namespace ConstruApp.Core.Entities;

public class PrecioMaterial
{
    public int     Id          { get; set; }
    public int     MaterialId  { get; set; }
    public int     ProveedorId { get; set; }   // FK → PerfilProveedor
    public decimal Precio      { get; set; }
    public string  Moneda      { get; set; } = "CRC";
    public string? UrlProducto { get; set; }
    public DateTime FechaActualizacion { get; set; } = DateTime.UtcNow;
    public bool    Disponible  { get; set; } = true;

    // Navegación
    public Material       Material  { get; set; } = null!;
    public PerfilProveedor Proveedor { get; set; } = null!;
}
