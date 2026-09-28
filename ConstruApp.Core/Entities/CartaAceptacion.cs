namespace ConstruApp.Core.Entities;

public class CartaAceptacion
{
    public int    Id                    { get; set; }
    public int    ProyectoId            { get; set; }
    public int    PropuestaId           { get; set; }
    public string? ObservacionesCliente { get; set; }
    public bool   Aceptado              { get; set; } = false;
    public DateTime FechaEmision        { get; set; } = DateTime.UtcNow;
    public DateTime? FechaAceptacion    { get; set; }

    // Navegación
    public Proyecto  Proyecto  { get; set; } = null!;
    public Propuesta Propuesta { get; set; } = null!;
}
