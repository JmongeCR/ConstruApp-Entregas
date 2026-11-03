using System.Security.Claims;
using System.Text.Json;
using ConstruApp.API.Services;
using ConstruApp.Core.Entities;
using ConstruApp.Core.Enums;
using ConstruApp.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace ConstruApp.API.Controllers;

[ApiController]
[Authorize(Roles = "Cliente")]
[Route("api/cotizacion-ia/entrevistas")]
public sealed class EntrevistaIaController(AppDbContext db, ValidacionProyectoIa ia,
    IOptions<RangosPreciosOptions> precios, IConfiguration config) : ControllerBase
{
    private int ClienteId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    private const int MaxArchivo = 4 * 1024 * 1024;

    [HttpGet]
    public async Task<IActionResult> Listar(CancellationToken ct) => Ok(await db.EntrevistasIa.AsNoTracking()
        .Where(e => e.ClienteId == ClienteId).OrderByDescending(e => e.ActualizadaUtc)
        .Take(30).Select(e => new { e.Id, e.ActualizadaUtc, e.ProyectoId }).ToListAsync(ct));

    [HttpPost]
    public async Task<IActionResult> Crear(CancellationToken ct)
    {
        var entrevista = new EntrevistaIa { Id = Guid.NewGuid(), ClienteId = ClienteId };
        db.EntrevistasIa.Add(entrevista);
        return await Guardar(entrevista, new(), ct);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Obtener(Guid id, CancellationToken ct)
    {
        var entrevista = await Cargar(id, ct);
        return entrevista is null ? NotFound() : Ok(Respuesta(entrevista, Leer(entrevista)));
    }

    [HttpPost("{id:guid}/mensajes")]
    [EnableRateLimiting("entrevista-ia")]
    [RequestSizeLimit(16_000)]
    public async Task<IActionResult> Mensaje(Guid id, MensajeEntrevista solicitud, CancellationToken ct)
    {
        var entrevista = await Cargar(id, ct);
        if (entrevista is null) return NotFound();
        if (entrevista.ProyectoId.HasValue || entrevista.Version != solicitud.Version) return Desactualizada();
        var datos = Leer(entrevista);
        var texto = solicitud.Texto?.Trim();
        if (string.IsNullOrEmpty(texto) || texto.Length > 1500 || datos.Turnos.Count >= 20)
            return BadRequest(new { message = "Ingresá un mensaje de hasta 1500 caracteres. Cada entrevista admite diez mensajes." });

        datos.Turnos.Add(new("cliente", texto));
        var revision = await ia.RevisarAsync(datos.Turnos, ct);
        if (revision is null) return IaNoDisponible();

        var titulo = revision.Titulo?.Trim();
        var descripcion = revision.Descripcion?.Trim();
        var tipo = revision.TipoProyecto?.Trim();
        var faltantes = new Dictionary<string, string>();
        if (string.IsNullOrEmpty(titulo) || titulo.Length > 200)
            faltantes["titulo"] = "¿Cómo querés llamar al proyecto?";
        if (!Enum.GetNames<TipoProyecto>().Contains(tipo))
            faltantes["tipoProyecto"] = "¿Qué tipo de trabajo querés realizar?";
        if (descripcion is null || descripcion.Length < 20)
            faltantes["descripcion"] = "¿Qué trabajos necesitás y en qué parte del inmueble?";

        var pregunta = faltantes.Values.FirstOrDefault() ?? revision.Pregunta?.Trim();
        var completo = string.IsNullOrWhiteSpace(pregunta) && !string.IsNullOrWhiteSpace(revision.Recomendaciones);
        var respuesta = completo ? revision.Recomendaciones! : string.IsNullOrWhiteSpace(pregunta)
            ? "¿Qué condiciones o límites del trabajo querés aclarar antes de cotizar?" : pregunta;
        datos.Turnos.Add(new("asistente", respuesta));
        return await Guardar(entrevista, datos with
        {
            Ficha = revision with { Titulo = titulo, Descripcion = descripcion,
                TipoProyecto = faltantes.ContainsKey("tipoProyecto") ? null : tipo },
            Faltantes = faltantes,
            Completo = completo,
            Alcance = null
        }, ct);
    }

    [HttpPost("{id:guid}/adjuntos")]
    [EnableRateLimiting("entrevista-ia")]
    [RequestSizeLimit(MaxArchivo + 64 * 1024)]
    public async Task<IActionResult> Adjunto(Guid id, [FromForm] Guid version, IFormFile archivo, CancellationToken ct)
    {
        var entrevista = await Cargar(id, ct);
        if (entrevista is null) return NotFound();
        if (entrevista.ProyectoId.HasValue || entrevista.Version != version) return Desactualizada();
        var datos = Leer(entrevista);
        if (archivo.Length is <= 0 or > MaxArchivo || datos.Fuentes.Count >= 5)
            return BadRequest(new { message = "Adjuntá hasta cinco archivos de un máximo de 4 MB cada uno." });

        using var buffer = new MemoryStream();
        await archivo.CopyToAsync(buffer, ct);
        var bytes = buffer.ToArray();
        var mime = DetectarFormato(bytes);
        if (mime is null)
            return BadRequest(new { message = "Seleccioná un PDF o una imagen JPEG, PNG o WebP." });
        var nombre = Path.GetFileName(archivo.FileName.Replace('\\', '/'));
        nombre = string.IsNullOrWhiteSpace(nombre) ? "Adjunto" : nombre[..Math.Min(160, nombre.Length)];
        var hallazgo = await ia.AnalizarAsync(nombre, mime, bytes, ct);
        if (hallazgo is null)
            return StatusCode(StatusCodes.Status503ServiceUnavailable,
                new { message = "No se pudo analizar el archivo. Probá con otro o volvé a intentar más tarde." });
        datos.Fuentes.Add(new(nombre, hallazgo));
        return await Guardar(entrevista, datos with { Alcance = null }, ct);
    }

    [HttpPost("{id:guid}/alcance")]
    [EnableRateLimiting("entrevista-ia")]
    public async Task<IActionResult> Alcance(Guid id, SolicitudAlcance solicitud, CancellationToken ct)
    {
        var entrevista = await Cargar(id, ct);
        if (entrevista is null) return NotFound();
        if (entrevista.ProyectoId.HasValue || entrevista.Version != solicitud.Version) return Desactualizada();
        var datos = Leer(entrevista);
        if (!datos.Completo || datos.Ficha is null)
            return BadRequest(new { message = "Completá la entrevista antes de generar el alcance." });
        if (solicitud.AreaM2 is decimal area &&
            (area is <= 0 or > 99999999.99m || area != decimal.Round(area, 2)))
            return BadRequest(new { message = "Ingresá un área positiva con hasta dos decimales, o dejala en blanco." });

        var contenido = await ia.RedactarAsync(datos.Ficha, datos.Turnos, datos.Fuentes, ct);
        if (contenido is null || string.IsNullOrWhiteSpace(contenido.Objetivo) ||
            string.IsNullOrWhiteSpace(contenido.Entregables)) return IaNoDisponible();

        var alcance = new AlcanceEntrevista(contenido, solicitud.AreaM2,
            Estimar(datos.Ficha.TipoProyecto!, solicitud.AreaM2));
        return await Guardar(entrevista, datos with { Alcance = alcance }, ct);
    }

    [HttpPost("{id:guid}/borrador")]
    public async Task<IActionResult> CrearBorrador(Guid id, ConfirmarBorrador solicitud, CancellationToken ct)
    {
        var entrevista = await Cargar(id, ct);
        if (entrevista is null) return NotFound();
        var datos = Leer(entrevista);
        if (entrevista.ProyectoId.HasValue) return Ok(Respuesta(entrevista, datos));
        if (entrevista.Version != solicitud.Version) return Desactualizada();
        if (datos.Alcance is null || datos.Ficha is null)
            return BadRequest(new { message = "Generá y revisá el alcance antes de crear el borrador." });
        var propiedad = await db.Propiedades.AsNoTracking()
            .SingleOrDefaultAsync(p => p.Id == solicitud.PropiedadId && p.ClienteId == ClienteId, ct);
        if (propiedad is null) return BadRequest(new { message = "Seleccioná una propiedad de tu cuenta." });

        var contenido = datos.Alcance.Contenido;
        var estimacion = datos.Alcance.Estimacion;
        var costo = estimacion.CostoMinCrc is decimal costoMin
            ? $"CRC {costoMin:N2} a {estimacion.CostoMaxCrc:N2}" : "pendiente de estimar";
        var plazo = estimacion.DiasMin is decimal diasMin
            ? $"{diasMin} a {estimacion.DiasMax} días de trabajo" : "pendiente de estimar";
        var descripcion = $"""
            Alcance del proyecto
            {contenido.Objetivo}
            Entregables: {contenido.Entregables}
            Proyección preliminar: costo {costo}, plazo {plazo}, cuadrilla {estimacion.Personas?.ToString() ?? "pendiente"}.
            Exclusiones: {contenido.Exclusiones}
            Supuestos: {contenido.Supuestos}
            Personal: {contenido.Personal}
            Pendientes: {contenido.Pendientes}

            {datos.Ficha.Descripcion}
            """;
        entrevista.Proyecto = new Proyecto
        {
            ClienteId = ClienteId, PropiedadId = propiedad.Id,
            Provincia = propiedad.Provincia, Canton = propiedad.Canton, Distrito = propiedad.Distrito,
            Titulo = datos.Ficha.Titulo!,
            Descripcion = descripcion[..Math.Min(3000, descripcion.Length)],
            TipoProyecto = Enum.Parse<TipoProyecto>(datos.Ficha.TipoProyecto!),
            AreaM2 = datos.Alcance.AreaM2,
            Estado = EstadoProyecto.Borrador
        };
        return await Guardar(entrevista, datos, ct);
    }

    private EstimacionEntrevista Estimar(string tipo, decimal? area)
    {
        decimal? minimo = null, maximo = null, diasMin = null, diasMax = null;
        int? personas = null;
        string? fuente = null;
        if (area is > 0 && precios.Value.PorTipo.TryGetValue(tipo, out var rango))
        {
            minimo = decimal.Round(area.Value * rango.Minimo, 2);
            maximo = decimal.Round(area.Value * rango.Maximo, 2);
            fuente = string.IsNullOrWhiteSpace(rango.Fuente) ? "Rango por m² configurado" : rango.Fuente;
        }
        var rendimiento = config.GetSection($"EstimacionAlcance:PorTipo:{tipo}").Get<RendimientoEntrevista>();
        if (rendimiento is { Personas: > 0, MinM2Dia: > 0, MaxM2Dia: > 0 } &&
            rendimiento.MaxM2Dia >= rendimiento.MinM2Dia && rendimiento.MinM2Dia >= 0.01m)
        {
            personas = rendimiento.Personas;
            if (area is > 0)
            {
                diasMin = decimal.Ceiling(area.Value / rendimiento.MaxM2Dia);
                diasMax = decimal.Ceiling(area.Value / rendimiento.MinM2Dia);
            }
        }
        return new(minimo, maximo, fuente, diasMin, diasMax, personas);
    }

    private Task<EntrevistaIa?> Cargar(Guid id, CancellationToken ct) =>
        db.EntrevistasIa.SingleOrDefaultAsync(e => e.Id == id && e.ClienteId == ClienteId, ct);

    private async Task<IActionResult> Guardar(EntrevistaIa entrevista, DatosEntrevista datos, CancellationToken ct)
    {
        entrevista.Datos = JsonSerializer.Serialize(datos, JsonSerializerOptions.Web);
        entrevista.Version = Guid.NewGuid();
        entrevista.ActualizadaUtc = DateTime.UtcNow;
        try { await db.SaveChangesAsync(ct); }
        catch (DbUpdateConcurrencyException) { return Desactualizada(); }
        return Ok(Respuesta(entrevista, datos));
    }

    private static DatosEntrevista Leer(EntrevistaIa entrevista) =>
        JsonSerializer.Deserialize<DatosEntrevista>(entrevista.Datos, JsonSerializerOptions.Web) ?? new();

    private static object Respuesta(EntrevistaIa e, DatosEntrevista datos) =>
        new { e.Id, e.Version, e.ActualizadaUtc, e.ProyectoId, datos };

    private IActionResult Desactualizada() => Conflict(new { message = "La entrevista cambió. Volvé a cargarla." });
    private IActionResult IaNoDisponible() => StatusCode(StatusCodes.Status503ServiceUnavailable,
        new { message = "La IA no está disponible en este momento. Podés intentar de nuevo." });

    private static string? DetectarFormato(ReadOnlySpan<byte> bytes)
    {
        if (bytes.StartsWith("%PDF-"u8)) return "application/pdf";
        if (bytes.StartsWith(new byte[] { 0xff, 0xd8, 0xff })) return "image/jpeg";
        if (bytes.StartsWith(new byte[] { 137, 80, 78, 71, 13, 10, 26, 10 })) return "image/png";
        if (bytes.Length >= 12 && bytes.StartsWith("RIFF"u8) && bytes[8..12].SequenceEqual("WEBP"u8))
            return "image/webp";
        return null;
    }
}

public sealed record MensajeEntrevista(Guid Version, string? Texto);
public sealed record SolicitudAlcance(Guid Version, decimal? AreaM2);
public sealed record ConfirmarBorrador(Guid Version, int PropiedadId);
public sealed record RendimientoEntrevista(decimal MinM2Dia, decimal MaxM2Dia, int Personas);
public sealed record EstimacionEntrevista(decimal? CostoMinCrc, decimal? CostoMaxCrc, string? Fuente,
    decimal? DiasMin, decimal? DiasMax, int? Personas);
public sealed record AlcanceEntrevista(ContenidoAlcanceIa Contenido, decimal? AreaM2, EstimacionEntrevista Estimacion);
public sealed record DatosEntrevista
{
    public List<TurnoProyectoIa> Turnos { get; init; } = [];
    public List<FuenteIa> Fuentes { get; init; } = [];
    public RevisionProyectoIa? Ficha { get; init; }
    public Dictionary<string, string> Faltantes { get; init; } = [];
    public bool Completo { get; init; }
    public AlcanceEntrevista? Alcance { get; init; }
}
