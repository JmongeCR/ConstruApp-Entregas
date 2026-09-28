namespace ConstruApp.API.DTOs.IA;

/// <summary>
/// Resultado del análisis semántico de Gemini.
/// Contiene materiales y mano de obra estimados, SIN precios.
/// Los precios reales se obtienen del catálogo o el microservicio de scraping.
/// </summary>
public class AnalisisProyectoIA
{
    public string                     TipoProyecto      { get; set; } = string.Empty;
    public string                     ResumenAnalisis   { get; set; } = string.Empty;
    public string                     DuracionEstimada  { get; set; } = string.Empty;
    public List<MaterialEstimado>     Materiales        { get; set; } = [];
    public List<string>               ManoDeObra        { get; set; } = [];
    public List<string>               RecomendacionesIA { get; set; } = [];
}

/// <summary>
/// Un material identificado por la IA con cantidad estimada pero sin precio.
/// El precio se resuelve después vía catálogo o scraper.
/// </summary>
public class MaterialEstimado
{
    public string  Nombre     { get; set; } = string.Empty;
    public string  Categoria  { get; set; } = string.Empty; // "Estructura", "Acabados", etc.
    public decimal Cantidad   { get; set; }
    public string  Unidad     { get; set; } = string.Empty;
    public string? NotasIA    { get; set; }                 // Ej: "preferir marca nacional"
}

/// <summary>
/// Request de cotización: proyecto + archivos adjuntos opcionales.
/// </summary>
public class CotizacionIARequest
{
    public int          ProyectoId { get; set; }
    public List<string> ImagenesBase64 { get; set; } = []; // JPEG/PNG en base64
    public List<string> PdfBase64      { get; set; } = []; // Planos PDF en base64
}
