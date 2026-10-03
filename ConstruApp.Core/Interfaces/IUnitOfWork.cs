using ConstruApp.Core.Entities;

namespace ConstruApp.Core.Interfaces;

public interface IUnitOfWork : IDisposable
{
    IRepository<Proyecto>          Proyectos          { get; }
    IRepository<ArchivoProyecto>   Archivos           { get; }
    IRepository<CotizacionIA>      CotizacionesIA     { get; }
    IRepository<LineaCotizacionIA> LineasCotizacion   { get; }
    IRepository<Material>          Materiales         { get; }
    IRepository<PrecioMaterial>    PreciosMaterial    { get; }
    IRepository<Propuesta>         Propuestas         { get; }
    IRepository<PerfilConstructor> PerfilesConstructor { get; }
    IRepository<PerfilProveedor>   PerfilesProveedor  { get; }
    IRepository<PortafolioItem>    PortafolioItems    { get; }
    IRepository<Calificacion>        Calificaciones        { get; }
    IRepository<Mensaje>             Mensajes              { get; }
    IRepository<AvanceObra>          AvancesObra           { get; }
    IRepository<FotoAvance>          FotosAvance           { get; }
    IRepository<Empleado>            Empleados             { get; }
    IRepository<AsignacionEmpleado>  AsignacionesEmpleado  { get; }
    IRepository<CartaAceptacion>     CartasAceptacion      { get; }
    IRepository<Factura>             Facturas              { get; }
    IRepository<PagoFactura>         PagosFactura          { get; }
    IRepository<PresupuestoPartida>       PresupuestoPartidas   { get; }
    IRepository<GastoObra>                GastosObra            { get; }
    IRepository<OrdenCambio>              OrdenesCambio         { get; }
    IRepository<MiembroEquipoProyecto>    MiembrosEquipo        { get; }
    IRepository<RolPermiso>               RolPermisos           { get; }
    IRepository<UsuarioPermiso>           UsuarioPermisos       { get; }
    IRepository<AuditoriaLog>             AuditoriaLogs         { get; }
    IRepository<ConfiguracionGlobal>      Configuraciones       { get; }
    IRepository<FaseProyecto>             FasesProyecto         { get; }
    IRepository<TareaFase>                TareasFase            { get; }
    IRepository<Notificacion>             Notificaciones        { get; }
    IRepository<EmailLog>                 EmailLogs             { get; }

    IRepository<FavoritoProveedor>          FavoritosProveedor     { get; }
    Task<int> SaveChangesAsync();
}
