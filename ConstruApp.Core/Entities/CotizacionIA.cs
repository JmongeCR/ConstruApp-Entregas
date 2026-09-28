namespace ConstruApp.Core.Entities;

public class CotizacionIA
{
    public int     Id         { get; set; }
    public int     ProyectoId { get; set; }
    public decimal RangoMinimo { get; set; }
    public decimal RangoMaximo { get; set; }
    public string  ResumenIA   { get; set; } = string.Empty;
    public DateTime FechaGeneracion { get; set; } = DateTime.UtcNow;

    // Metadatos del análisis Gemini (persistidos para no perderlos al recargar)
    public string? TipoProyectoIA    { get; set; }   // "remodelacion", "electrico", etc.
    public string? DuracionEstimada  { get; set; }   // "3-4 semanas"
    public string? ManoDeObraJson    { get; set; }   // JSON array: ["albañil","electricista"]
    public string? RecomendacionesJson { get; set; } // JSON array: ["verificar permisos"...]
    public string? Plan        { get; set; }   // economico | estandar | premium
    public string? NombrePlan  { get; set; }   // "Plan Económico" | "Plan Estándar" | "Plan Premium"

    // ── Historial ─────────────────────────────────────────────────────────────
    /// <summary>Usuario que ejecutó la generación.</summary>
    public int?   GeneradoPorId { get; set; }

    /// <summary>Número de versión dentro del mismo proyecto (1, 2, 3…).</summary>
    public int    Version       { get; set; } = 1;

    /// <summary>Activa | Archivada | ConvertidaPresupuesto | ConvertidaPropuesta</summary>
    public string Estado        { get; set; } = "Activa";

    // Navegación
    public Proyecto                     Proyecto    { get; set; } = null!;
    public Usuario?                     GeneradoPor { get; set; }
    public ICollection<LineaCotizacionIA> Lineas    { get; set; } = [];
}
