namespace ConstruApp.Core.Entities;

/// <summary>Configuración global de la plataforma (clave-valor).</summary>
public class ConfiguracionGlobal
{
    public int     Id           { get; set; }
    public string  Clave        { get; set; } = string.Empty;  // único, ej: "app.nombre"
    public string  Valor        { get; set; } = string.Empty;
    public string? Descripcion  { get; set; }
    public string  Categoria    { get; set; } = "General";     // General|IA|Proyectos|Facturacion|Notificaciones
    public bool    Editable     { get; set; } = true;          // false = solo lectura
    public int?    ModificadoPorId  { get; set; }
    public DateTime FechaModificacion { get; set; } = DateTime.UtcNow;

    public Usuario? ModificadoPor { get; set; }
}
