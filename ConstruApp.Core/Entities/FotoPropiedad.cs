namespace ConstruApp.Core.Entities;

public class FotoPropiedad
{
    public int Id { get; set; }
    public int PropiedadId { get; set; }
    public string Url { get; set; } = string.Empty;
    public string NombreArchivo { get; set; } = string.Empty;
    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;

    public Propiedad Propiedad { get; set; } = null!;
}
