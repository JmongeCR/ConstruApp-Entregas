using ConstruApp.Core.Enums;

namespace ConstruApp.Core.Entities;

public class Proyecto
{
    public int    Id          { get; set; }
    public int    ClienteId   { get; set; }
    public int?   PropiedadId { get; set; }
    public string Titulo      { get; set; } = string.Empty;
    public string Descripcion { get; set; } = string.Empty;

    public TipoProyecto   TipoProyecto { get; set; } = TipoProyecto.Otro;
    public EstadoProyecto Estado       { get; set; } = EstadoProyecto.Borrador;

    // Ubicación
    public string? Canton   { get; set; }
    public string? Provincia { get; set; }
    public string? Distrito { get; set; }

    // Presupuesto y área (opcionales — el cliente los informa)
    public decimal? PresupuestoMax { get; set; }
    public decimal? AreaM2         { get; set; }

    public DateTime  FechaPublicacion { get; set; } = DateTime.UtcNow;
    public DateTime? FechaInicio      { get; set; }
    public DateTime? FechaFin         { get; set; }

    // Navegación
    public Usuario                          Cliente              { get; set; } = null!;
    public Propiedad?                       Propiedad            { get; set; }
    public ICollection<ArchivoProyecto>     Archivos             { get; set; } = [];
    public ICollection<CotizacionIA>         CotizacionesIA       { get; set; } = [];
    public ICollection<Propuesta>           Propuestas           { get; set; } = [];
    public ICollection<Calificacion>        Calificaciones       { get; set; } = [];
    public ICollection<Mensaje>             Mensajes             { get; set; } = [];
    public ICollection<AvanceObra>          Avances              { get; set; } = [];
    public ICollection<AsignacionEmpleado>  AsignacionesEquipo   { get; set; } = [];
    public CartaAceptacion?                 CartaAceptacion      { get; set; }
    public ICollection<Factura>             Facturas             { get; set; } = [];
    public ICollection<PresupuestoPartida>      Partidas             { get; set; } = [];
    public ICollection<GastoObra>               GastosObra           { get; set; } = [];
    public ICollection<OrdenCambio>             OrdenesCambio        { get; set; } = [];
    public ICollection<MiembroEquipoProyecto>   MiembrosEquipo       { get; set; } = [];
    public ICollection<FaseProyecto>            Fases                { get; set; } = [];
}
