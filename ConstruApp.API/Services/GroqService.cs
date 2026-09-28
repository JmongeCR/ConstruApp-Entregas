using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using ConstruApp.Core.Entities;
using ConstruApp.Core.Interfaces;

namespace ConstruApp.API.Services;

public class GroqService : IGeminiService
{
    private const string BaseUrl = "https://api.groq.com/openai/v1/chat/completions";
    private const string ModelId = "llama-3.3-70b-versatile";

    private readonly HttpClient              _http;
    private readonly IConfiguration          _config;
    private readonly ILogger<GroqService>    _logger;

    public GroqService(IHttpClientFactory factory, IConfiguration config, ILogger<GroqService> logger)
    {
        _http   = factory.CreateClient("groq");
        _config = config;
        _logger = logger;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GenerarTextoAsync — respuesta markdown libre (IA empresarial)
    // ─────────────────────────────────────────────────────────────────────────
    public async Task<string> GenerarTextoAsync(string systemPrompt, string userPrompt)
    {
        var apiKey = _config["Groq:ApiKey"];
        if (string.IsNullOrWhiteSpace(apiKey))
            return "IA no disponible. Configure Groq:ApiKey en appsettings.json.";

        try
        {
            var requestBody = new
            {
                model    = ModelId,
                messages = new[]
                {
                    new { role = "system", content = systemPrompt },
                    new { role = "user",   content = userPrompt   },
                },
                temperature = 0.5,
                max_tokens  = 4096,
            };

            using var request = new HttpRequestMessage(HttpMethod.Post, BaseUrl);
            request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", apiKey);
            request.Content = new StringContent(
                JsonSerializer.Serialize(requestBody, JsonOpts),
                System.Text.Encoding.UTF8, "application/json");

            var response = await _http.SendAsync(request);
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError("Groq GenerarTexto error {Status}", response.StatusCode);
                return "Error al consultar la IA. Intente más tarde.";
            }

            var json = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(json);
            var content   = doc.RootElement
                .GetProperty("choices")[0]
                .GetProperty("message")
                .GetProperty("content")
                .GetString();
            return content ?? "Sin respuesta de la IA.";
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en GenerarTextoAsync (Groq)");
            return "Error al consultar la IA.";
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    public async Task<GeminiAnalisisResult> AnalizarProyectoAsync(
        Proyecto      proyecto,
        List<string>? imagenesBase64 = null,
        List<string>? pdfsBase64     = null)
    {
        var planes = await AnalizarPlanesAsync(proyecto, imagenesBase64, pdfsBase64);
        return planes.FirstOrDefault(p => p.Plan == "estandar") ?? planes.First();
    }

    public async Task<List<GeminiAnalisisResult>> AnalizarPlanesAsync(
        Proyecto      proyecto,
        List<string>? imagenesBase64 = null,
        List<string>? pdfsBase64     = null)
    {
        var apiKey = _config["Groq:ApiKey"];

        if (string.IsNullOrWhiteSpace(apiKey))
        {
            _logger.LogWarning("Groq:ApiKey no configurado — usando análisis demo");
            return GenerarPlanesDemo(proyecto);
        }

        try
        {
            var requestBody = ConstruirRequest(proyecto);

            using var request = new HttpRequestMessage(HttpMethod.Post, BaseUrl);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
            request.Content = new StringContent(
                JsonSerializer.Serialize(requestBody, JsonOpts),
                Encoding.UTF8, "application/json");

            var response = await _http.SendAsync(request);

            if (!response.IsSuccessStatusCode)
            {
                var err = await response.Content.ReadAsStringAsync();
                _logger.LogError("Groq API error {Status}: {Body}", response.StatusCode, err);
                return GenerarPlanesDemo(proyecto);
            }

            var json = await response.Content.ReadAsStringAsync();
            var planes = ParsearPlanes(json);
            _logger.LogInformation("Groq devolvió {Count} planes", planes.Count);
            if (planes.Count == 0)
                _logger.LogWarning("ParsearPlanes falló — respuesta cruda: {Raw}", json[..Math.Min(500, json.Length)]);
            return planes.Count > 0 ? planes : GenerarPlanesDemo(proyecto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al llamar Groq API");
            return GenerarPlanesDemo(proyecto);
        }
    }

    // ── Request ───────────────────────────────────────────────────────────────
    private static object ConstruirRequest(Proyecto proyecto) => new
    {
        model    = ModelId,
        messages = new[]
        {
            new { role = "system", content = SystemPrompt },
            new { role = "user",   content = ConstruirPrompt(proyecto) }
        },
        temperature     = 0.3,
        max_tokens      = 8192,
        response_format = new { type = "json_object" }
    };

    // ── System Prompt ─────────────────────────────────────────────────────────
    private const string SystemPrompt =
        """
        Eres un experto en construcción en Costa Rica. Para el proyecto dado, genera EXACTAMENTE 3 cotizaciones
        con diferentes niveles de calidad y precio. Los 3 niveles SON OBLIGATORIOS y deben usar estos mismos materiales
        pero con diferentes calidades y precios:

        NIVEL 1 (economico): materiales genéricos o de menor costo, precios bajos, duración más larga.
        NIVEL 2 (estandar): materiales de marca reconocida (Holcim, Lanco, Plycem), precios medios.
        NIVEL 3 (premium): mejores materiales importados o premium (Porcelanato italiano, Sherwin-Williams, etc.), precios altos.

        RESPONDE con este JSON exacto (sin cambiar los valores de "plan"):
        {
          "tipoProyecto": "remodelacion",
          "planes": [
            {
              "plan": "economico",
              "nombrePlan": "Plan Económico",
              "resumenAnalisis": "descripción breve nivel económico",
              "duracionEstimada": "X semanas",
              "materiales": [
                {"nombre": "Cemento genérico 50kg", "categoria": "Estructura", "cantidad": 20, "unidad": "sacos", "precioUnitario": 6500, "fuente": "Ferretería El Colono", "notas": ""}
              ],
              "manoDeObra": ["albañil"],
              "recomendaciones": ["tip 1"]
            },
            {
              "plan": "estandar",
              "nombrePlan": "Plan Estándar",
              "resumenAnalisis": "descripción breve nivel estándar",
              "duracionEstimada": "X semanas",
              "materiales": [...],
              "manoDeObra": ["albañil", "maestro de obras"],
              "recomendaciones": ["tip 1", "tip 2"]
            },
            {
              "plan": "premium",
              "nombrePlan": "Plan Premium",
              "resumenAnalisis": "descripción breve nivel premium",
              "duracionEstimada": "X semanas",
              "materiales": [...],
              "manoDeObra": ["maestro de obras", "albañil especializado"],
              "recomendaciones": ["tip 1", "tip 2"]
            }
          ]
        }

        REGLAS:
        - El valor de "plan" SIEMPRE debe ser exactamente: "economico", "estandar" o "premium"
        - Máximo 8 materiales por plan
        - Precios en colones CRC (números, sin símbolos)
        - Categorías válidas: Estructura, Acabados, Electrico, Plomeria, Pintura, Madera, Ferreteria, Otro
        - SOLO JSON, sin texto adicional
        """;

    // ── Prompt por proyecto ───────────────────────────────────────────────────
    private static string ConstruirPrompt(Proyecto p)
    {
        var area   = p.AreaM2.HasValue ? $"{p.AreaM2} m²" : "no especificada";
        var presup = p.PresupuestoMax.HasValue ? $"₡{p.PresupuestoMax.Value:N0}" : "no especificado";

        return $"""
            Analiza el siguiente proyecto de construcción en Costa Rica:

            DATOS DEL PROYECTO:
            - Título: {p.Titulo}
            - Tipo declarado: {p.TipoProyecto}
            - Descripción del cliente: {p.Descripcion}
            - Área aproximada: {area}
            - Ubicación: {p.Canton ?? "no especificado"}, {p.Provincia ?? "Costa Rica"}
            - Presupuesto máximo del cliente: {presup}

            Genera el análisis técnico completo con materiales estimados y sus precios aproximados
            en colones costarricenses (CRC). Ajusta las cantidades al área indicada.
            """;
    }

    // ── Parser de 3 planes ────────────────────────────────────────────────────
    private List<GeminiAnalisisResult> ParsearPlanes(string rawJson)
    {
        try
        {
            var doc     = JsonDocument.Parse(rawJson);
            var content = doc.RootElement
                .GetProperty("choices")[0]
                .GetProperty("message")
                .GetProperty("content")
                .GetString() ?? "";

            var clean = content.Trim();
            if (clean.StartsWith("```")) clean = clean[(clean.IndexOf('\n') + 1)..];
            if (clean.EndsWith("```"))   clean = clean[..clean.LastIndexOf("```")].TrimEnd();

            var root        = JsonDocument.Parse(clean.Trim()).RootElement;
            var tipoProyecto= root.GetString("tipoProyecto");
            var resultados  = new List<GeminiAnalisisResult>();

            if (!root.TryGetProperty("planes", out var planesEl)) return resultados;

            // Labels por defecto si el modelo no respeta los valores exactos
            string[] planKeys   = ["economico", "estandar", "premium"];
            string[] planNombres= ["Plan Económico", "Plan Estándar", "Plan Premium"];
            int idx = 0;

            foreach (var p in planesEl.EnumerateArray())
            {
                var materiales = new List<MaterialIA>();
                if (p.TryGetProperty("materiales", out var mats))
                {
                    foreach (var m in mats.EnumerateArray())
                    {
                        decimal? precioUnit = null;
                        if (m.TryGetProperty("precioUnitario", out var pu) &&
                            pu.ValueKind != JsonValueKind.Null &&
                            pu.TryGetDecimal(out var puVal))
                            precioUnit = puVal;

                        string? fuente = null;
                        if (m.TryGetProperty("fuente", out var fu) && fu.ValueKind != JsonValueKind.Null)
                            fuente = fu.GetString();

                        materiales.Add(new MaterialIA(
                            Nombre         : m.GetString("nombre"),
                            Categoria      : m.GetString("categoria"),
                            Cantidad       : m.TryGetProperty("cantidad", out var q) ? q.GetDecimal() : 1,
                            Unidad         : m.GetString("unidad"),
                            Notas          : m.TryGetProperty("notas", out var n) ? n.GetString() : null,
                            PrecioUnitario : precioUnit,
                            Fuente         : fuente
                        ));
                    }
                }

                var mdo  = new List<string>();
                if (p.TryGetProperty("manoDeObra", out var mdoEl))
                    foreach (var item in mdoEl.EnumerateArray())
                        mdo.Add(item.GetString() ?? "");

                var recs = new List<string>();
                if (p.TryGetProperty("recomendaciones", out var recsEl))
                    foreach (var r in recsEl.EnumerateArray())
                        recs.Add(r.GetString() ?? "");

                // Asegurar que plan/nombrePlan sean los valores correctos (por si el modelo usa 1/2/3)
                var rawPlan = p.GetString("plan");
                var planKey = planKeys.Contains(rawPlan) ? rawPlan : (idx < planKeys.Length ? planKeys[idx] : rawPlan);
                var planNom = planNombres.Contains(p.GetString("nombrePlan"))
                    ? p.GetString("nombrePlan")
                    : (idx < planNombres.Length ? planNombres[idx] : p.GetString("nombrePlan"));

                resultados.Add(new GeminiAnalisisResult(
                    Exitoso          : true,
                    TipoProyecto     : tipoProyecto,
                    Resumen          : p.GetString("resumenAnalisis"),
                    DuracionEstimada : p.GetString("duracionEstimada"),
                    Materiales       : materiales,
                    ManoDeObra       : mdo,
                    Recomendaciones  : recs,
                    Plan             : planKey,
                    NombrePlan       : planNom
                ));
                idx++;
            }

            return resultados;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al parsear planes de Groq");
            return [];
        }
    }

    // ── Demo — 3 planes predefinidos ──────────────────────────────────────────
    private static List<GeminiAnalisisResult> GenerarPlanesDemo(Proyecto proyecto)
    {
        var area    = proyecto.AreaM2 ?? 30m;
        var factor  = area / 30m;
        var tipo    = proyecto.TipoProyecto.ToString().ToLowerInvariant();
        var dur     = area <= 20 ? "1–2 semanas" : area <= 60 ? "3–6 semanas" : "2–4 meses";
        var lugar   = $"{proyecto.Canton ?? "la zona indicada"}, {proyecto.Provincia ?? "Costa Rica"}";

        var mdo     = new List<string> { "Maestro de obras", "Albañil", "Peón de construcción" };
        var recs    = new List<string>
        {
            "Solicitar permiso de construcción en la municipalidad antes de iniciar.",
            "Verificar disponibilidad de materiales en Ferretería El Colono o EPA.",
            "Considerar la época lluviosa en el cronograma (mayo–noviembre).",
        };

        return
        [
            new(true, tipo,
                $"Opción económica para {tipo} de {area} m² en {lugar}. Materiales básicos con buena relación calidad-precio.",
                dur, new List<MaterialIA>
                {
                    new("Cemento gris 50kg (genérico)",  "Estructura", Math.Round(20*factor), "sacos",    null, 6_500m,  "Ferretería El Colono"),
                    new("Arena de río",                   "Estructura", Math.Round( 3*factor), "m³",       null, 18_000m, null),
                    new("Block 15×20×40 (estándar)",     "Estructura", Math.Round(150*factor),"unidades", null, 680m,    "EPA"),
                    new("Azulejo piso económico 40×40",  "Acabados",   Math.Round(area*1.1m), "m²",       "10% cortes", 8_500m, "El Lagar"),
                    new("Pintura interior económica",    "Pintura",    Math.Round( 4*factor), "galones",  null, 12_000m, "EPA"),
                }, mdo, recs, Plan: "economico", NombrePlan: "Plan Económico"),

            new(true, tipo,
                $"Opción estándar para {tipo} de {area} m² en {lugar}. Materiales de marca reconocida con garantía.",
                dur, new List<MaterialIA>
                {
                    new("Cemento gris 50kg (Holcim)",    "Estructura", Math.Round(20*factor), "sacos",    null, 7_500m,  "EPA"),
                    new("Arena de río lavada",           "Estructura", Math.Round( 3*factor), "m³",       null, 22_000m, null),
                    new("Block 15×20×40 (Plycem)",       "Estructura", Math.Round(160*factor),"unidades", null, 750m,    "Construplaza"),
                    new("Azulejo piso 45×45 (Porcelanite)","Acabados", Math.Round(area*1.1m), "m²",       "10% cortes", 14_000m,"El Lagar"),
                    new("Pintura Lanco Premium",         "Pintura",    Math.Round( 6*factor), "galones",  "2 manos", 22_000m,"EPA"),
                    new("Tubo PVC presión 1/2\" 6m",     "Plomeria",   Math.Round( 6*factor), "tubos",    null, 4_500m,  "EPA"),
                }, mdo, recs, Plan: "estandar", NombrePlan: "Plan Estándar"),

            new(true, tipo,
                $"Opción premium para {tipo} de {area} m² en {lugar}. Mejores materiales del mercado y acabados superiores.",
                dur, new List<MaterialIA>
                {
                    new("Cemento gris 50kg (Cemex Premium)","Estructura",Math.Round(22*factor),"sacos",   null, 8_200m,  "Construplaza"),
                    new("Arena de río lavada premium",    "Estructura", Math.Round( 3*factor), "m³",       null, 28_000m, null),
                    new("Block 20×20×40 reforzado",      "Estructura", Math.Round(180*factor),"unidades", null, 920m,    "Construplaza"),
                    new("Porcelanato 60×60 importado",   "Acabados",   Math.Round(area*1.1m), "m²",       "10% cortes", 28_000m,"El Lagar"),
                    new("Pintura Sherwin-Williams ProMar","Pintura",   Math.Round( 8*factor), "galones",  "2-3 manos", 35_000m,"EPA"),
                    new("Tubo PVC presión 3/4\" 6m",     "Plomeria",   Math.Round( 6*factor), "tubos",    null, 6_800m,  "EPA"),
                    new("Cable THW #12 (Phelps Dodge)",  "Electrico",  Math.Round( 3*factor), "rollos",   "Norma ICE", 28_000m,"EPA"),
                }, mdo, recs, Plan: "premium", NombrePlan: "Plan Premium"),
        ];
    }

    private static readonly JsonSerializerOptions JsonOpts = new()
    {
        PropertyNamingPolicy   = JsonNamingPolicy.CamelCase,
        WriteIndented          = false,
        DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull,
    };
}
