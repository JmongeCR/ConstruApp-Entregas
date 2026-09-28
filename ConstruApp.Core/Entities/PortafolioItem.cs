namespace ConstruApp.Core.Entities;

public class PortafolioItem
{
    public int    Id            { get; set; }
    public int    ConstructorId { get; set; }
    public string ImagenUrl     { get; set; } = string.Empty;
    public string Titulo        { get; set; } = string.Empty;
    public string? Descripcion  { get; set; }
    public DateTime Fecha       { get; set; } = DateTime.UtcNow;

    // Navegación
    public PerfilConstructor Constructor { get; set; } = null!;
}
