namespace ConstruApp.Core.Entities;

public class PerfilConstructor
{
    public int    Id            { get; set; }
    public int    UsuarioId     { get; set; }
    public string NombreEmpresa { get; set; } = string.Empty;
    public string? Bio          { get; set; }
    public string? Especialidades { get; set; }   // JSON / CSV
    public string? ZonasCobertura { get; set; }   // CSV provincias
    public int    AniosExperiencia { get; set; }
    public string? CedulaJuridica  { get; set; }
    public string? SitioWeb        { get; set; }
    public string? Instagram       { get; set; }
    public bool   Verificado       { get; set; } = false;
    public decimal CalificacionPromedio { get; set; } = 0;
    public int    TotalProyectos   { get; set; } = 0;

    // ── Configuración financiera / facturación ────────────────────────────────
    public string? EmailFacturacion    { get; set; }
    public string? DireccionFiscal     { get; set; }
    public string? TelefonoFiscal      { get; set; }
    public string  PrefijoFactura      { get; set; } = "FAC";
    public int     DiasVencimiento     { get; set; } = 30;
    public decimal TasaIVA             { get; set; } = 13;
    public bool    AplicaIVADefault    { get; set; } = false;
    public string? TerminosCondiciones { get; set; }
    public string? FormasPago          { get; set; } // JSON: ["Transferencia","SINPE"]
    public string? CuentasBancarias    { get; set; } // JSON: [{banco, iban, tipo}]

    // Navegación
    public Usuario                    Usuario          { get; set; } = null!;
    public ICollection<PortafolioItem> PortafolioItems { get; set; } = [];
    public ICollection<Propuesta>      Propuestas      { get; set; } = [];
    public ICollection<Empleado>       Empleados       { get; set; } = [];
    public ICollection<AvanceObra>     AvancesObra     { get; set; } = [];
    public ICollection<Factura>        Facturas        { get; set; } = [];
}
