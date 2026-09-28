using ConstruApp.Core.Entities;

namespace ConstruApp.Core.Interfaces;

/// <summary>
/// Contrato para el servicio de análisis IA con Google Gemini.
/// Desacoplado para facilitar testing y reemplazo de proveedor.
/// </summary>
public interface IGeminiService
{
    /// <summary>
    /// Analiza un proyecto de construcción usando Gemini y devuelve una
    /// estimación semántica: materiales con cantidades, tipos de mano de obra
    /// y duración estimada. SIN precios — los precios se resuelven aparte.
    /// </summary>
    Task<GeminiAnalisisResult> AnalizarProyectoAsync(
        Proyecto          proyecto,
        List<string>?     imagenesBase64 = null,
        List<string>?     pdfsBase64     = null);

    /// <summary>
    /// Genera texto libre (markdown) dado un system prompt y un user prompt.
    /// Usado por los módulos de IA empresarial: resúmenes, propuestas, reportes.
    /// </summary>
    Task<string> GenerarTextoAsync(string systemPrompt, string userPrompt);
}

/// <summary>
/// Resultado tipado del análisis de Gemini.
/// Usado internamente entre GeminiService y el controlador.
/// </summary>
public record GeminiAnalisisResult(
    bool              Exitoso,
    string            TipoProyecto,
    string            Resumen,
    string            DuracionEstimada,
    List<MaterialIA>  Materiales,
    List<string>      ManoDeObra,
    List<string>      Recomendaciones,
    string?           ErrorMensaje = null,
    string            Plan        = "estandar",
    string            NombrePlan  = "Plan Estándar");

public record MaterialIA(
    string   Nombre,
    string   Categoria,
    decimal  Cantidad,
    string   Unidad,
    string?  Notas          = null,
    decimal? PrecioUnitario = null,   // precio real encontrado via Google Search
    string?  Fuente         = null);  // tienda/sitio donde se encontró el precio
