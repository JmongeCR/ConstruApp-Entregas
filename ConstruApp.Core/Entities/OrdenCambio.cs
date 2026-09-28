namespace ConstruApp.Core.Entities;

/// <summary>
/// Solicitud de cambio durante la ejecución del proyecto.
/// Estados: Pendiente → Aprobada | Rechazada
/// </summary>
public class OrdenCambio
{
    public int      Id                     { get; set; }
    public int      ProyectoId             { get; set; }
    public int      SolicitadoPorId        { get; set; }
    public int?     AprobadoPorId          { get; set; }

    public string   Titulo                 { get; set; } = string.Empty;
    public string   Descripcion            { get; set; } = string.Empty;
    public decimal  ImpactoEconomico       { get; set; }   // positivo = costo adicional
    public int      ImpactoCronogramaDias  { get; set; }   // días adicionales (puede ser negativo)
    public string   Estado                 { get; set; } = "Pendiente"; // Pendiente|Aprobada|Rechazada
    public string?  Notas                  { get; set; }
    public string?  ArchivoEvidenciaUrl    { get; set; }

    public DateTime  FechaSolicitud   { get; set; } = DateTime.UtcNow;
    public DateTime? FechaResolucion  { get; set; }

    // Navegación
    public Proyecto Proyecto      { get; set; } = null!;
    public Usuario  SolicitadoPor { get; set; } = null!;
    public Usuario? AprobadoPor   { get; set; }
}
