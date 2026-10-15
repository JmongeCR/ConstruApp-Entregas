namespace ConstruApp.Core.Entities;

public class PortafolioImagen
{
    public int Id { get; set; }
    public int PortafolioItemId { get; set; }
    public string Url { get; set; } = string.Empty;
    public int Orden { get; set; }

    public PortafolioItem PortafolioItem { get; set; } = null!;
}
