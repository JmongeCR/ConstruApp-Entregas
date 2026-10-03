using ConstruApp.Core.Entities;
using ConstruApp.Core.Interfaces;
using ConstruApp.Infrastructure.Data;

namespace ConstruApp.Infrastructure.Repositories;

public class UnitOfWork : IUnitOfWork
{
    private readonly AppDbContext _context;

    public IRepository<Proyecto>          Proyectos           { get; }
    public IRepository<ArchivoProyecto>   Archivos            { get; }
    public IRepository<CotizacionIA>      CotizacionesIA      { get; }
    public IRepository<LineaCotizacionIA> LineasCotizacion    { get; }
    public IRepository<Material>          Materiales          { get; }
    public IRepository<PrecioMaterial>    PreciosMaterial     { get; }
    public IRepository<Propuesta>         Propuestas          { get; }
    public IRepository<PerfilConstructor> PerfilesConstructor { get; }
    public IRepository<PerfilProveedor>   PerfilesProveedor   { get; }
    public IRepository<PortafolioItem>    PortafolioItems     { get; }
    public IRepository<Calificacion>        Calificaciones        { get; }
    public IRepository<Mensaje>             Mensajes              { get; }
    public IRepository<AvanceObra>          AvancesObra           { get; }
    public IRepository<FotoAvance>          FotosAvance           { get; }
    public IRepository<Empleado>            Empleados             { get; }
    public IRepository<AsignacionEmpleado>  AsignacionesEmpleado  { get; }
    public IRepository<CartaAceptacion>     CartasAceptacion      { get; }
    public IRepository<Factura>             Facturas              { get; }
    public IRepository<PagoFactura>         PagosFactura          { get; }
    public IRepository<PresupuestoPartida>      PresupuestoPartidas   { get; }
    public IRepository<GastoObra>               GastosObra            { get; }
    public IRepository<OrdenCambio>             OrdenesCambio         { get; }
    public IRepository<MiembroEquipoProyecto>   MiembrosEquipo        { get; }
    public IRepository<RolPermiso>              RolPermisos           { get; }
    public IRepository<UsuarioPermiso>          UsuarioPermisos       { get; }
    public IRepository<AuditoriaLog>            AuditoriaLogs         { get; }
    public IRepository<ConfiguracionGlobal>     Configuraciones       { get; }
    public IRepository<FaseProyecto>            FasesProyecto         { get; }
    public IRepository<TareaFase>               TareasFase            { get; }
    public IRepository<Notificacion>            Notificaciones        { get; }
    public IRepository<EmailLog>                EmailLogs             { get; }
    public IRepository<FavoritoProveedor>       FavoritosProveedor    { get; }

    public UnitOfWork(AppDbContext context)
    {
        _context              = context;
        Proyectos             = new Repository<Proyecto>(context);
        Archivos              = new Repository<ArchivoProyecto>(context);
        CotizacionesIA        = new Repository<CotizacionIA>(context);
        LineasCotizacion      = new Repository<LineaCotizacionIA>(context);
        Materiales            = new Repository<Material>(context);
        PreciosMaterial       = new Repository<PrecioMaterial>(context);
        Propuestas            = new Repository<Propuesta>(context);
        PerfilesConstructor   = new Repository<PerfilConstructor>(context);
        PerfilesProveedor     = new Repository<PerfilProveedor>(context);
        PortafolioItems       = new Repository<PortafolioItem>(context);
        Calificaciones        = new Repository<Calificacion>(context);
        Mensajes              = new Repository<Mensaje>(context);
        AvancesObra           = new Repository<AvanceObra>(context);
        FotosAvance           = new Repository<FotoAvance>(context);
        Empleados             = new Repository<Empleado>(context);
        AsignacionesEmpleado  = new Repository<AsignacionEmpleado>(context);
        CartasAceptacion      = new Repository<CartaAceptacion>(context);
        Facturas              = new Repository<Factura>(context);
        PagosFactura          = new Repository<PagoFactura>(context);
        PresupuestoPartidas   = new Repository<PresupuestoPartida>(context);
        GastosObra            = new Repository<GastoObra>(context);
        OrdenesCambio         = new Repository<OrdenCambio>(context);
        MiembrosEquipo        = new Repository<MiembroEquipoProyecto>(context);
        RolPermisos           = new Repository<RolPermiso>(context);
        UsuarioPermisos       = new Repository<UsuarioPermiso>(context);
        AuditoriaLogs         = new Repository<AuditoriaLog>(context);
        Configuraciones       = new Repository<ConfiguracionGlobal>(context);
        FasesProyecto         = new Repository<FaseProyecto>(context);
        TareasFase            = new Repository<TareaFase>(context);
        Notificaciones        = new Repository<Notificacion>(context);
        EmailLogs             = new Repository<EmailLog>(context);
        FavoritosProveedor    = new Repository<FavoritoProveedor>(context);
    }

    public async Task<int> SaveChangesAsync() => await _context.SaveChangesAsync();

    public void Dispose() => _context.Dispose();
}
