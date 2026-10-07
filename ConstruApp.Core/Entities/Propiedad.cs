namespace ConstruApp.Core.Entities;

public class Propiedad
{
    public int Id { get; set; }
    public int ClienteId { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string Direccion { get; set; } = string.Empty;
    public string Provincia { get; set; } = string.Empty;
    public string Canton { get; set; } = string.Empty;
    public string Distrito { get; set; } = string.Empty;
    public string? Caracteristicas { get; set; }
    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;
    public DateTime FechaActualizacion { get; set; } = DateTime.UtcNow;

    public Usuario Cliente { get; set; } = null!;
    public ICollection<FotoPropiedad> Fotos { get; set; } = [];
    public ICollection<Proyecto> Proyectos { get; set; } = [];
}
