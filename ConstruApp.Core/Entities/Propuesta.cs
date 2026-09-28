using ConstruApp.Core.Enums;

namespace ConstruApp.Core.Entities;

public class Propuesta
{
    public int    Id            { get; set; }
    public int    ProyectoId    { get; set; }
    public int    ConstructorId { get; set; }   // FK → PerfilConstructor
    public decimal MontoTotal   { get; set; }
    public string  Descripcion  { get; set; } = string.Empty;
    public string? Incluye      { get; set; }
    public int     PlazoEstimadoDias { get; set; }
    public EstadoPropuesta Estado { get; set; } = EstadoPropuesta.Enviada;
    public string? ArchivoUrl   { get; set; }   // PDF adjunto opcional
    public DateTime FechaEnvio  { get; set; } = DateTime.UtcNow;
    public DateTime? FechaRespuesta { get; set; }

    // Navegación
    public Proyecto          Proyecto    { get; set; } = null!;
    public PerfilConstructor Constructor { get; set; } = null!;
    public ICollection<Mensaje>      Mensajes       { get; set; } = [];
    public ICollection<Calificacion> Calificaciones { get; set; } = [];
    public ICollection<Factura>      Facturas       { get; set; } = [];
}
