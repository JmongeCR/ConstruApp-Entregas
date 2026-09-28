using System.Text;
using System.Text.Json;
using ConstruApp.Core.Entities;
using ConstruApp.Core.Interfaces;

namespace ConstruApp.API.Services;

/// <summary>
/// Implementación del servicio de IA usando Google Gemini 2.5 Flash.
/// Si no hay API key configurada, devuelve un análisis demo realista
/// para no bloquear el desarrollo.
/// </summary>
public class GeminiService : IGeminiService
{
    private const string BaseUrl   = "https://generativelanguage.googleapis.com/v1beta/models";
    private const string ModelId   = "gemini-2.0-flash";
    private const string Endpoint  = "generateContent";

    private readonly HttpClient     _http;
    private readonly IConfiguration _config;
    private readonly ILogger<GeminiService> _logger;

    public GeminiService(IHttpClientFactory factory, IConfiguration config, ILogger<GeminiService> logger)
    {
        _http   = factory.CreateClient("gemini");
        _config = config;
        _logger = logger;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GenerarTextoAsync — respuesta markdown libre (IA empresarial)
    // ─────────────────────────────────────────────────────────────────────────
    public async Task<string> GenerarTextoAsync(string systemPrompt, string userPrompt)
    {
        var apiKey = _config["Gemini:ApiKey"];
        if (string.IsNullOrWhiteSpace(apiKey))
            return "IA no disponible. Configure Gemini:ApiKey en appsettings.json.";

        try
        {
            var requestBody = new
            {
                contents = new[]
                {
                    new
                    {
                        role  = "user",
                        parts = new[] { new { text = userPrompt } }
                    }
                },
                systemInstruction = new
                {
                    parts = new[] { new { text = systemPrompt } }
                },
                generationConfig = new
                {
                    temperature     = 0.5,
                    maxOutputTokens = 4096,
                }
            };

            var url = $"{BaseUrl}/{ModelId}:{Endpoint}?key={apiKey}";
            using var request = new HttpRequestMessage(HttpMethod.Post, url);
            request.Content = new StringContent(
                JsonSerializer.Serialize(requestBody, JsonOpts),
                System.Text.Encoding.UTF8, "application/json");

            var response = await _http.SendAsync(request);
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError("Gemini GenerarTexto error {Status}", response.StatusCode);
                return "Error al consultar la IA.";
            }

            var json = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(json);
            var candidate = doc.RootElement.GetProperty("candidates")[0];
            var parts = candidate.GetProperty("content").GetProperty("parts");
            foreach (var part in parts.EnumerateArray())
            {
                if (part.TryGetProperty("thought", out var th) && th.GetBoolean()) continue;
                if (part.TryGetProperty("text", out var t))
                    return t.GetString() ?? "Sin respuesta.";
            }
            return "Sin respuesta de la IA.";
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en GenerarTextoAsync (Gemini)");
            return "Error al consultar la IA.";
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    public async Task<GeminiAnalisisResult> AnalizarProyectoAsync(
        Proyecto       proyecto,
        List<string>?  imagenesBase64 = null,
        List<string>?  pdfsBase64     = null)
    {
        var apiKey = _config["Gemini:ApiKey"];

        if (string.IsNullOrWhiteSpace(apiKey))
        {
            _logger.LogWarning("Gemini:ApiKey no configurado — usando análisis demo");
            return GenerarAnalisisDemo(proyecto);
        }

        try
        {
            var requestBody = ConstruirRequest(proyecto, imagenesBase64, pdfsBase64);
            var url         = $"{BaseUrl}/{ModelId}:{Endpoint}?key={apiKey}";

            using var request = new HttpRequestMessage(HttpMethod.Post, url);
            request.Content   = new StringContent(
                JsonSerializer.Serialize(requestBody, JsonOpts),
                Encoding.UTF8, "application/json");

            var response = await _http.SendAsync(request);

            if (!response.IsSuccessStatusCode)
            {
                var err = await response.Content.ReadAsStringAsync();
                _logger.LogError("Gemini API error {Status}: {Body}", response.StatusCode, err);
                return GenerarAnalisisDemo(proyecto);
            }

            var json = await response.Content.ReadAsStringAsync();
            return ParsearRespuestaGemini(json) ?? GenerarAnalisisDemo(proyecto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al llamar Gemini API");
            return GenerarAnalisisDemo(proyecto);
        }
    }

    // ── Construcción del request ──────────────────────────────────────────────
    private static object ConstruirRequest(
        Proyecto      proyecto,
        List<string>? imagenes,
        List<string>? pdfs)
    {
        var parts = new List<object>
        {
            new { text = ConstruirPrompt(proyecto) }
        };

        // Imágenes adjuntas (fotos del lugar)
        if (imagenes?.Count > 0)
        {
            foreach (var img in imagenes.Take(4)) // máx 4 imágenes
            {
                parts.Add(new
                {
                    inline_data = new
                    {
                        mime_type = "image/jpeg",
                        data      = img
                    }
                });
            }
        }

        // PDFs (planos de construcción)
        if (pdfs?.Count > 0)
        {
            foreach (var pdf in pdfs.Take(2)) // máx 2 PDFs
            {
                parts.Add(new
                {
                    inline_data = new
                    {
                        mime_type = "application/pdf",
                        data      = pdf
                    }
                });
            }
        }

        return new
        {
            contents = new[]
            {
                new { parts = parts.ToArray() }
            },
            tools = new[] { new { google_search = new { } } },
            generationConfig = new
            {
                temperature     = 0.2,
                maxOutputTokens = 8192,
                // responseMimeType omitido — incompatible con Google Search Grounding
            },
            systemInstruction = new
            {
                parts = new[]
                {
                    new { text = SystemPrompt }
                }
            }
        };
    }

    // ── System Prompt (instrucción de rol del modelo) ─────────────────────────
    private const string SystemPrompt =
        """
        Eres un experto en construcción en Costa Rica. Analiza proyectos de construcción y devuelve un JSON estructurado.

        IMPORTANTE — PRECIOS REALES:
        Usa Google Search para buscar precios actuales de los materiales en tiendas costarricenses:
        EPA Costa Rica, El Lagar, Construplaza, Ferretería El Colono, Do it Center.
        Busca el precio en colones (CRC) del material exacto o el más parecido.
        Si encuentras un precio real, inclúyelo en "precioUnitario" (número sin símbolo) y la tienda en "fuente".
        Si no encuentras precio confiable, omite esos campos (null).

        ESTRUCTURA JSON OBLIGATORIA (sin texto adicional, sin markdown):
        {
          "tipoProyecto": "remodelacion|obra_nueva|ampliacion|acabados|electrico|plomeria|otro",
          "resumenAnalisis": "descripción técnica breve (2 oraciones)",
          "duracionEstimada": "X semanas",
          "materiales": [
            {
              "nombre": "Cemento gris 50kg (Holcim)",
              "categoria": "Estructura",
              "cantidad": 20,
              "unidad": "sacos",
              "notas": "disponible en EPA y El Colono",
              "precioUnitario": 7500,
              "fuente": "EPA Costa Rica"
            }
          ],
          "manoDeObra": ["albañil", "electricista"],
          "recomendaciones": ["recomendación breve 1", "recomendación breve 2"]
        }

        Máximo 12 materiales. Categorías válidas: Estructura, Acabados, Electrico, Plomeria, Pintura, Madera, Ferreteria, Otro.
        Responde SOLO con el JSON. Sin explicaciones ni texto adicional.
        """;

    // ── Prompt por proyecto ──────────────────────────────────────────────────
    private static string ConstruirPrompt(Proyecto p)
    {
        var area     = p.AreaM2.HasValue ? $"{p.AreaM2} m²" : "no especificada";
        var presup   = p.PresupuestoMax.HasValue
                       ? $"₡{p.PresupuestoMax.Value:N0}" : "no especificado";
        var imagenHint = "Se adjuntan imágenes del lugar para un análisis más preciso.";

        return $"""
            Analiza el siguiente proyecto de construcción en Costa Rica:

            DATOS DEL PROYECTO:
            - Título: {p.Titulo}
            - Tipo declarado: {p.TipoProyecto}
            - Descripción del cliente: {p.Descripcion}
            - Área aproximada: {area}
            - Ubicación: {p.Canton ?? "no especificado"}, {p.Provincia ?? "Costa Rica"}
            - Presupuesto máximo del cliente: {presup}

            {imagenHint}

            Genera el análisis técnico completo con materiales estimados (sin precios)
            y tipos de mano de obra necesarios para ejecutar este proyecto en Costa Rica.
            Ajusta las cantidades de materiales al área indicada.
            """;
    }

    // ── Parser de respuesta Gemini ────────────────────────────────────────────
    private GeminiAnalisisResult? ParsearRespuestaGemini(string rawJson)
    {
        try
        {
            var doc  = JsonDocument.Parse(rawJson);
            var root = doc.RootElement;

            var candidate = root.GetProperty("candidates")[0];
            var finishReason = candidate.TryGetProperty("finishReason", out var fr)
                               ? fr.GetString() : "UNKNOWN";

            if (finishReason == "MAX_TOKENS")
                _logger.LogWarning("Gemini respondió MAX_TOKENS — aumentar maxOutputTokens");

            // Buscar el part con texto (Gemini 2.5 Flash puede tener parts de thinking sin text)
            var parts = candidate.GetProperty("content").GetProperty("parts");
            string text = "";
            foreach (var part in parts.EnumerateArray())
            {
                // Saltar parts de "thought" (razonamiento interno)
                if (part.TryGetProperty("thought", out var thought) && thought.GetBoolean())
                    continue;
                if (part.TryGetProperty("text", out var t))
                {
                    text = t.GetString() ?? "";
                    break;
                }
            }

            if (string.IsNullOrWhiteSpace(text))
            {
                _logger.LogWarning("Gemini no devolvió texto. finishReason={Reason}", finishReason);
                return null;
            }

            // Limpiar posibles backticks de markdown
            var clean = text.Trim();
            if (clean.StartsWith("```")) clean = clean[(clean.IndexOf('\n') + 1)..];
            if (clean.EndsWith("```"))  clean = clean[..clean.LastIndexOf("```")].TrimEnd();
            clean = clean.Trim();

            var inner = JsonDocument.Parse(clean).RootElement;

            // Parsear materiales
            var materiales = new List<MaterialIA>();
            if (inner.TryGetProperty("materiales", out var mats))
            {
                foreach (var m in mats.EnumerateArray())
                {
                    decimal? precioUnitario = null;
                    if (m.TryGetProperty("precioUnitario", out var pu) &&
                        pu.ValueKind != JsonValueKind.Null &&
                        pu.TryGetDecimal(out var puVal))
                        precioUnitario = puVal;

                    string? fuente = null;
                    if (m.TryGetProperty("fuente", out var fu) && fu.ValueKind != JsonValueKind.Null)
                        fuente = fu.GetString();

                    materiales.Add(new MaterialIA(
                        Nombre         : m.GetString("nombre"),
                        Categoria      : m.GetString("categoria"),
                        Cantidad       : m.TryGetProperty("cantidad", out var q) ? q.GetDecimal() : 1,
                        Unidad         : m.GetString("unidad"),
                        Notas          : m.TryGetProperty("notas", out var n) ? n.GetString() : null,
                        PrecioUnitario : precioUnitario,
                        Fuente         : fuente
                    ));
                }
            }

            // Parsear mano de obra
            var manoDeObra = new List<string>();
            if (inner.TryGetProperty("manoDeObra", out var mdo))
                foreach (var item in mdo.EnumerateArray())
                    manoDeObra.Add(item.GetString() ?? "");

            // Parsear recomendaciones
            var recs = new List<string>();
            if (inner.TryGetProperty("recomendaciones", out var recsProp))
                foreach (var r in recsProp.EnumerateArray())
                    recs.Add(r.GetString() ?? "");

            return new GeminiAnalisisResult(
                Exitoso          : true,
                TipoProyecto     : inner.GetString("tipoProyecto"),
                Resumen          : inner.GetString("resumenAnalisis"),
                DuracionEstimada : inner.GetString("duracionEstimada"),
                Materiales       : materiales,
                ManoDeObra       : manoDeObra,
                Recomendaciones  : recs
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al parsear respuesta de Gemini");
            return null;
        }
    }

    // ── Análisis demo (sin API key) ───────────────────────────────────────────
    private static GeminiAnalisisResult GenerarAnalisisDemo(Proyecto proyecto)
    {
        var area   = proyecto.AreaM2 ?? 30m;
        var factor = area / 30m; // escalar materiales según área

        var materiales = new List<MaterialIA>
        {
            new("Cemento gris 50kg (Holcim/Cemex)",  "Estructura", Math.Round(20  * factor), "sacos",    "Disponible en Ferretería El Colono, EPA"),
            new("Arena de río (m³)",                 "Estructura", Math.Round( 3  * factor), "m³",       null),
            new("Lastre compactado (m³)",             "Estructura", Math.Round( 4  * factor), "m³",       null),
            new("Block 15×20×40 (Plycem o similar)", "Estructura", Math.Round(180 * factor), "unidades", null),
            new("Varilla #3 corrugada 6m",            "Estructura", Math.Round(15  * factor), "varillas", null),
            new("Azulejo piso 45×45 (m²)",            "Acabados",   Math.Round(area  * 1.1m), "m²",       "10% extra para cortes"),
            new("Azulejo pared 30×60 (m²)",           "Acabados",   Math.Round(area  * 0.4m), "m²",       null),
            new("Pintura interior (Lanco/Pinco)",     "Pintura",    Math.Round(6   * factor), "galones",  "2 manos de aplicación"),
            new("Puerta HDF 0.90m marco incluido",   "Madera",     Math.Round(2   * factor), "unidades", null),
            new("Tubo PVC presión 1/2\" 6m",          "Plomeria",   Math.Round(6   * factor), "tubos",    null),
            new("Cable THW #12 (rollo 100m)",         "Electrico",  Math.Round(2   * factor), "rollos",   "Norma ICE"),
            new("Lámina zinc cal. 26 (m)",            "Estructura", Math.Round(12  * factor), "metros",   "Para cubierta si aplica"),
        };

        return new GeminiAnalisisResult(
            Exitoso          : true,
            TipoProyecto     : proyecto.TipoProyecto.ToString().ToLowerInvariant(),
            Resumen          : $"Análisis preliminar para {proyecto.TipoProyecto.ToString().ToLower()} " +
                               $"de {area} m² en {proyecto.Canton ?? "la zona indicada"}, {proyecto.Provincia ?? "Costa Rica"}. " +
                               "Cotización estimada basada en precios de mercado 2025. " +
                               "Configure Gemini:ApiKey para análisis personalizado con IA.",
            DuracionEstimada : area <= 20 ? "1–2 semanas" : area <= 60 ? "3–6 semanas" : "2–4 meses",
            Materiales       : materiales,
            ManoDeObra       : ["Maestro de obras", "Albañil", "Peón de construcción", "Electricista", "Plomero"],
            Recomendaciones  : [
                "Solicitar permiso de construcción en la municipalidad antes de iniciar.",
                "Verificar disponibilidad de materiales en Ferretería El Colono o EPA.",
                "Considerar la época lluviosa en el cronograma (mayo–noviembre).",
                "Confirmar medidas exactas con el constructor antes de comprar materiales.",
            ]
        );
    }

    // ── Opciones JSON ─────────────────────────────────────────────────────────
    private static readonly JsonSerializerOptions JsonOpts = new()
    {
        PropertyNamingPolicy        = JsonNamingPolicy.CamelCase,
        WriteIndented               = false,
        DefaultIgnoreCondition      = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull,
    };
}

// ── Extensión helper para leer strings de JsonElement ─────────────────────
internal static class JsonElementExt
{
    public static string GetString(this JsonElement el, string prop)
        => el.TryGetProperty(prop, out var v) ? v.GetString() ?? "" : "";
}
