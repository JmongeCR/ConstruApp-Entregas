using ConstruApp.Core.Enums;

namespace ConstruApp.Core.Entities;

public class Factura
{
    public int    Id            { get; set; }
    public int    ProyectoId    { get; set; }
    public int?   PropuestaId   { get; set; }     // propuesta asociada (opcional)
    public int    ConstructorId { get; set; }     // FK → PerfilConstructor

    public string  Numero    { get; set; } = string.Empty;  // FAC-2026-0001
    public string? Concepto  { get; set; }                  // descripción del cobro
    public string? Notas     { get; set; }

    public DateTime  FechaEmision     { get; set; } = DateTime.UtcNow;
    public DateTime? FechaVencimiento { get; set; }

    public decimal MontoTotal  { get; set; }
    public decimal MontoPagado { get; set; } = 0;

    public EstadoFactura Estado { get; set; } = EstadoFactura.Enviada;

    // ── Líneas de factura (JSON) ──────────────────────────────────────────────
    // [{descripcion, cantidad, precioUnit, subtotal}]
    public string? LineasJson     { get; set; }
    public bool    AplicaIVA      { get; set; } = false;
    public decimal MontoIVA       { get; set; } = 0;
    public decimal MontoDescuento { get; set; } = 0;

    // ── Seguimiento de distribución ───────────────────────────────────────────
    public DateTime? FechaEnvioEmail { get; set; }
    public DateTime? FechaEnvioChat  { get; set; }

    // Navegación
    public Proyecto          Proyecto    { get; set; } = null!;
    public Propuesta?         Propuesta   { get; set; }
    public PerfilConstructor  Constructor { get; set; } = null!;
    public ICollection<PagoFactura> Pagos { get; set; } = [];

    // Calculados
    public decimal Saldo => MontoTotal - MontoPagado;
}
