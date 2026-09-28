using ConstruApp.Core.Enums;

namespace ConstruApp.Core.Entities;

public class PagoFactura
{
    public int    Id        { get; set; }
    public int    FacturaId { get; set; }

    public decimal    Monto      { get; set; }
    public DateTime   Fecha      { get; set; } = DateTime.UtcNow;
    public MetodoPago MetodoPago { get; set; } = MetodoPago.Transferencia;
    public string?    Referencia { get; set; }   // número de transferencia / SINPE
    public string?    Notas      { get; set; }

    // Navegación
    public Factura Factura { get; set; } = null!;
}
