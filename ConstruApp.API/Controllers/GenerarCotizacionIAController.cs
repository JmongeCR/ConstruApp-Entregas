using System.Net.Http.Headers;
using System.Security.Claims;
using System.Text.Json;
using System.Text.Json.Serialization;
using ConstruApp.API.Services;
using ConstruApp.Core.Entities;
using ConstruApp.Core.Enums;
using ConstruApp.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ConstruApp.API.Controllers;

[ApiController]
[Route("api/cotizacion-ia/generar")]
[Authorize(Roles = "Cliente,Admin")]
public sealed class GenerarCotizacionIAController(
    IUnitOfWork uow,
    IHttpClientFactory httpFactory,
    IConfiguration config,
    IAuditoriaService auditoria,
    ILogger<GenerarCotizacionIAController> logger) : ControllerBase
{
    private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpPost("{proyectoId:int}")]
    [EnableRateLimiting("entrevista-ia")]
    public async Task<IActionResult> Generar(int proyectoId, CancellationToken ct)
    {
        var proyecto = await uow.Proyectos.GetByIdAsync(proyectoId);
        if (proyecto is null) return NotFound(new { message = "No encontramos el proyecto." });
        if (!User.IsInRole("Admin") && proyecto.ClienteId != UserId) return Forbid();

        var errores = new Dictionary<string, string>();
        if (string.IsNullOrWhiteSpace(proyecto.Titulo))
            errores["titulo"] = "Ingresá el nombre del proyecto.";
        if (string.IsNullOrWhiteSpace(proyecto.Descripcion) || proyecto.Descripcion.Trim().Length < 20)
            errores["descripcion"] = "Completá la descripción del proyecto (mínimo 20 caracteres).";
        if (!proyecto.TipoProyecto.HasValue)
            errores["tipoProyecto"] = "Seleccioná el tipo de trabajo.";
        if (proyecto.AreaM2 is null or <= 0)
            errores["areaM2"] = "Ingresá el área del proyecto en m² para poder estimar precios.";
        if (errores.Count > 0)
            return BadRequest(new { message = "Completá los datos del proyecto antes de generar la cotización.", errors = errores });

        var planes = await GenerarPlanesAsync(proyecto, ct);
        if (planes is null)
            return StatusCode(StatusCodes.Status503ServiceUnavailable,
                new { message = "La IA no está disponible en este momento. Intentá de nuevo en unos segundos." });

        var userId = UserId;
        var cotizaciones = new List<CotizacionIA>();
        foreach (var plan in planes)
        {
            var cotizacion = new CotizacionIA
            {
                ProyectoId       = proyectoId,
                Plan             = plan.Plan,
                NombrePlan       = plan.NombrePlan,
                RangoMinimo      = plan.Total * 0.9m,
                RangoMaximo      = plan.Total * 1.1m,
                ResumenIA        = plan.Resumen,
                TipoProyectoIA   = proyecto.TipoProyecto!.Value.ToString(),
                DuracionEstimada = plan.DuracionEstimada,
                ManoDeObraJson   = JsonSerializer.Serialize(plan.PerfilesManoDeObra),
                RecomendacionesJson = JsonSerializer.Serialize(plan.Recomendaciones),
                GeneradoPorId    = userId,
                Estado           = "Activa",
                Lineas           = plan.Lineas.Select(l => new LineaCotizacionIA
                {
                    Descripcion    = l.Descripcion,
                    Categoria      = ParseCategoria(l.Categoria),
                    Cantidad       = l.Cantidad,
                    Unidad         = l.Unidad,
                    PrecioUnitario = l.PrecioUnitario,
                    PrecioTotal    = l.PrecioTotal,
                    EsManoDeObra   = l.EsManoDeObra
                }).ToList()
            };
            await uow.GuardarCotizacionConVersionAsync(cotizacion);
            cotizaciones.Add(cotizacion);
        }

        await auditoria.RegistrarAsync(userId, User.FindFirstValue("nombre") ?? "",
            "GenerarCotizacionIA", "Proyectos", proyectoId.ToString(),
            $"Generados {cotizaciones.Count} planes para proyecto {proyecto.Titulo}");

        return Ok(cotizaciones.Select(c => new
        {
            c.Id, c.ProyectoId, c.Plan, c.NombrePlan, c.RangoMinimo, c.RangoMaximo,
            c.ResumenIA, c.TipoProyectoIA, c.DuracionEstimada, c.FechaGeneracion, c.Version,
            lineas = c.Lineas.Select(l => new
            {
                l.Id, l.Descripcion, categoria = l.Categoria.ToString(),
                l.Cantidad, l.Unidad, l.PrecioUnitario, l.PrecioTotal, l.EsManoDeObra
            })
        }));
    }

    private async Task<List<PlanCotizacion>?> GenerarPlanesAsync(Proyecto proyecto, CancellationToken ct)
    {
        var apiKey = config["GEMINI_API_KEY"];
        if (string.IsNullOrWhiteSpace(apiKey)) return null;

        var prompt = $"""
            Sos un constructor profesional costarricense. Generá 3 planes de cotización para este proyecto:

            Título: {proyecto.Titulo}
            Tipo: {proyecto.TipoProyecto}
            Descripción: {proyecto.Descripcion}
            Área: {proyecto.AreaM2} m²
            Ubicación: {proyecto.Provincia ?? "Costa Rica"}, {proyecto.Canton ?? ""}

            Generá exactamente 3 planes: economico, estandar, premium.
            Cada plan debe tener exactamente entre 5 y 7 líneas de materiales y mano de obra. Sé breve en las descripciones (máximo 8 palabras por descripción).
            Los precios deben ser en colones costarricenses (CRC) y realistas para el mercado actual.
            Para mano de obra usá jornales (precio por día o por m²).
            Categorías válidas: Estructura, Acabados, Electrico, Plomeria, Pintura, Madera, Ferreteria, ManoDeObra, Otro.
            IMPORTANTE: Los valores numéricos (cantidad, precioUnitario, precioTotal) deben ser números enteros o decimales SIN separador de miles. Ejemplo correcto: 150000. Ejemplo incorrecto: 150,000.
            """;

        using var http = httpFactory.CreateClient();
        http.Timeout = TimeSpan.FromSeconds(45);
        using var request = new HttpRequestMessage(HttpMethod.Post,
            "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
        request.Content = JsonContent.Create(new
        {
            model = config["Gemini:Model"] ?? "gemini-2.5-flash",
            max_tokens = 8000,
            messages = new object[]
            {
                new { role = "system", content = "Sos un experto en construcción costarricense. Respondés SOLO con JSON válido, sin markdown ni texto extra." },
                new { role = "user", content = prompt }
            },
            response_format = new
            {
                type = "json_schema",
                json_schema = new
                {
                    name = "planes_cotizacion",
                    strict = true,
                    schema = new
                    {
                        type = "object",
                        properties = new
                        {
                            planes = new
                            {
                                type = "array",
                                items = new
                                {
                                    type = "object",
                                    properties = new
                                    {
                                        plan             = new { type = "string" },
                                        nombrePlan       = new { type = "string" },
                                        resumen          = new { type = "string" },
                                        duracionEstimada = new { type = "string" },
                                        perfilesManoDeObra = new { type = "array", items = new { type = "string" } },
                                        recomendaciones  = new { type = "array", items = new { type = "string" } },
                                        lineas = new
                                        {
                                            type = "array",
                                            items = new
                                            {
                                                type = "object",
                                                properties = new
                                                {
                                                    descripcion    = new { type = "string" },
                                                    categoria      = new { type = "string" },
                                                    cantidad       = new { type = "number" },
                                                    unidad         = new { type = "string" },
                                                    precioUnitario = new { type = "number" },
                                                    precioTotal    = new { type = "number" },
                                                    esManoDeObra   = new { type = "boolean" }
                                                },
                                                required = new[] { "descripcion","categoria","cantidad","unidad","precioUnitario","precioTotal","esManoDeObra" },
                                                additionalProperties = false
                                            }
                                        }
                                    },
                                    required = new[] { "plan","nombrePlan","resumen","duracionEstimada","perfilesManoDeObra","recomendaciones","lineas" },
                                    additionalProperties = false
                                }
                            }
                        },
                        required = new[] { "planes" },
                        additionalProperties = false
                    }
                }
            }
        });

        try
        {
            using var response = await http.SendAsync(request, ct);
            if (!response.IsSuccessStatusCode)
            {
                logger.LogWarning("Gemini devolvió {Status} al generar planes.", (int)response.StatusCode);
                return null;
            }
            var chat = await response.Content.ReadFromJsonAsync<RespuestaChat>(ct);
            var json = chat?.Choices?.FirstOrDefault()?.Message?.Content;
            if (string.IsNullOrWhiteSpace(json)) return null;

            logger.LogInformation("Gemini raw JSON ({Len} chars): {Json}", json.Length, json);

            // Gemini a veces usa separador de miles en números (150,000) → lo removemos
            json = System.Text.RegularExpressions.Regex.Replace(json, @"(\d{1,3}),(\d{3})", "$1$2");

            var resultado = JsonSerializer.Deserialize<ResultadoPlanes>(json, JsonSerializerOptions.Web);
            return resultado?.Planes;
        }
        catch (Exception ex) when (ex is HttpRequestException or JsonException or OperationCanceledException)
        {
            logger.LogWarning(ex, "Error al llamar Gemini para generar planes.");
            return null;
        }
    }

    private static CategoriaMaterial ParseCategoria(string? cat) =>
        Enum.TryParse<CategoriaMaterial>(cat, ignoreCase: true, out var result) ? result : CategoriaMaterial.Otro;

    private sealed record RespuestaChat(OpcionChat[]? Choices);
    private sealed record OpcionChat(MensajeChat? Message);
    private sealed record MensajeChat(string? Role, string? Content);
    private sealed record ResultadoPlanes([property: JsonPropertyName("planes")] List<PlanCotizacion> Planes);

    private sealed record PlanCotizacion(
        [property: JsonPropertyName("plan")]             string Plan,
        [property: JsonPropertyName("nombrePlan")]       string NombrePlan,
        [property: JsonPropertyName("resumen")]          string Resumen,
        [property: JsonPropertyName("duracionEstimada")] string DuracionEstimada,
        [property: JsonPropertyName("perfilesManoDeObra")] List<string> PerfilesManoDeObra,
        [property: JsonPropertyName("recomendaciones")]  List<string> Recomendaciones,
        [property: JsonPropertyName("lineas")]           List<LineaDto> Lineas)
    {
        public decimal Total => Lineas.Sum(l => l.PrecioTotal);
    }

    private sealed record LineaDto(
        [property: JsonPropertyName("descripcion")]    string  Descripcion,
        [property: JsonPropertyName("categoria")]      string? Categoria,
        [property: JsonPropertyName("cantidad")]       decimal Cantidad,
        [property: JsonPropertyName("unidad")]         string  Unidad,
        [property: JsonPropertyName("precioUnitario")] decimal PrecioUnitario,
        [property: JsonPropertyName("precioTotal")]    decimal PrecioTotal,
        [property: JsonPropertyName("esManoDeObra")]   bool    EsManoDeObra);
}
