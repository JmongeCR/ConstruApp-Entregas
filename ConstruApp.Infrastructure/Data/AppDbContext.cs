using ConstruApp.Core.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace ConstruApp.Infrastructure.Data;

public class AppDbContext : IdentityDbContext<Usuario, IdentityRole<int>, int>
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    // ── DbSets ────────────────────────────────────────────────────────────────
    public DbSet<Proyecto>          Proyectos           => Set<Proyecto>();
    public DbSet<ArchivoProyecto>   Archivos            => Set<ArchivoProyecto>();
    public DbSet<CotizacionIA>      CotizacionesIA      => Set<CotizacionIA>();
    public DbSet<LineaCotizacionIA> LineasCotizacion    => Set<LineaCotizacionIA>();
    public DbSet<Material>          Materiales          => Set<Material>();
    public DbSet<PrecioMaterial>    PreciosMaterial     => Set<PrecioMaterial>();
    public DbSet<Propuesta>         Propuestas          => Set<Propuesta>();
    public DbSet<PerfilConstructor> PerfilesConstructor => Set<PerfilConstructor>();
    public DbSet<PerfilProveedor>   PerfilesProveedor   => Set<PerfilProveedor>();
    public DbSet<PortafolioItem>    PortafolioItems     => Set<PortafolioItem>();
    public DbSet<Calificacion>      Calificaciones      => Set<Calificacion>();
    public DbSet<Mensaje>               Mensajes              => Set<Mensaje>();
    public DbSet<AvanceObra>            AvancesObra           => Set<AvanceObra>();
    public DbSet<FotoAvance>            FotosAvance           => Set<FotoAvance>();
    public DbSet<Empleado>              Empleados             => Set<Empleado>();
    public DbSet<AsignacionEmpleado>    AsignacionesEmpleado  => Set<AsignacionEmpleado>();
    public DbSet<CartaAceptacion>       CartasAceptacion      => Set<CartaAceptacion>();
    public DbSet<Factura>               Facturas              => Set<Factura>();
    public DbSet<PagoFactura>           PagosFactura          => Set<PagoFactura>();
    public DbSet<PresupuestoPartida>        PresupuestoPartidas   => Set<PresupuestoPartida>();
    public DbSet<GastoObra>                 GastosObra            => Set<GastoObra>();
    public DbSet<OrdenCambio>               OrdenesCambio         => Set<OrdenCambio>();
    public DbSet<MiembroEquipoProyecto>     MiembrosEquipo        => Set<MiembroEquipoProyecto>();
    // ── RBAC ──────────────────────────────────────────────────────────────────
    public DbSet<RolPermiso>               RolPermisos            => Set<RolPermiso>();
    public DbSet<UsuarioPermiso>           UsuarioPermisos        => Set<UsuarioPermiso>();
    public DbSet<AuditoriaLog>             AuditoriaLogs          => Set<AuditoriaLog>();
    public DbSet<ConfiguracionGlobal>      Configuraciones        => Set<ConfiguracionGlobal>();
    // ── Cronograma ────────────────────────────────────────────────────────────
    public DbSet<FaseProyecto>             FasesProyecto          => Set<FaseProyecto>();
    public DbSet<TareaFase>                TareasFase             => Set<TareaFase>();
    // ── Notificaciones ────────────────────────────────────────────────────────
    public DbSet<Notificacion>             Notificaciones         => Set<Notificacion>();
    // ── Email ──────────────────────────────────────────────────────────────────
    public DbSet<EmailLog>                 EmailLogs              => Set<EmailLog>();
    // ── Invitaciones workspace ────────────────────────────────────────────────
    public DbSet<Invitacion>              Invitaciones           => Set<Invitacion>();
    // ── Favoritos ─────────────────────────────────────────────────────────────
    public DbSet<FavoritoProveedor>       FavoritosProveedor     => Set<FavoritoProveedor>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // ── Renombrar tablas Identity ─────────────────────────────────────────
        builder.Entity<Usuario>().ToTable("Usuarios");
        builder.Entity<IdentityRole<int>>().ToTable("Roles");
        builder.Entity<IdentityUserRole<int>>().ToTable("UsuarioRoles");
        builder.Entity<IdentityUserClaim<int>>().ToTable("UsuarioClaims");
        builder.Entity<IdentityUserLogin<int>>().ToTable("UsuarioLogins");
        builder.Entity<IdentityRoleClaim<int>>().ToTable("RoleClaims");
        builder.Entity<IdentityUserToken<int>>().ToTable("UsuarioTokens");

        // ── Usuario ───────────────────────────────────────────────────────────
        builder.Entity<Usuario>(e =>
        {
            e.Property(u => u.Nombre).HasMaxLength(150).IsRequired();
            e.Property(u => u.Telefono).HasMaxLength(20);
            e.Property(u => u.AvatarUrl).HasMaxLength(500);
            e.Property(u => u.Rol).HasConversion<string>().HasMaxLength(20);
            e.Property(u => u.EstadoCuenta).HasMaxLength(20);
            e.Property(u => u.MotivoRegistro).HasMaxLength(1000);
        });

        // ── Proyecto ──────────────────────────────────────────────────────────
        builder.Entity<Proyecto>(e =>
        {
            e.HasKey(p => p.Id);
            e.Property(p => p.Titulo).HasMaxLength(200).IsRequired();
            e.Property(p => p.Descripcion).HasMaxLength(3000);
            e.Property(p => p.TipoProyecto).HasConversion<string>().HasMaxLength(30);
            e.Property(p => p.Estado).HasConversion<string>().HasMaxLength(30);
            e.Property(p => p.Canton).HasMaxLength(100);
            e.Property(p => p.Provincia).HasMaxLength(100);
            e.Property(p => p.PresupuestoMax).HasColumnType("decimal(18,2)");
            e.Property(p => p.AreaM2).HasColumnType("decimal(10,2)");

            e.HasOne(p => p.Cliente)
             .WithMany(u => u.Proyectos)
             .HasForeignKey(p => p.ClienteId)
             .OnDelete(DeleteBehavior.Restrict);
        });

        // ── ArchivoProyecto ───────────────────────────────────────────────────
        builder.Entity<ArchivoProyecto>(e =>
        {
            e.HasKey(a => a.Id);
            e.Property(a => a.Url).HasMaxLength(500).IsRequired();
            e.Property(a => a.NombreArchivo).HasMaxLength(200);
            e.Property(a => a.TipoArchivo).HasMaxLength(30);
            e.Property(a => a.Categoria).HasMaxLength(50);
            e.Property(a => a.Descripcion).HasMaxLength(1000);
            e.Property(a => a.Version).HasDefaultValue(1);

            e.HasOne(a => a.Proyecto)
             .WithMany(p => p.Archivos)
             .HasForeignKey(a => a.ProyectoId)
             .OnDelete(DeleteBehavior.Cascade);

            e.HasOne(a => a.SubidoPor)
             .WithMany()
             .HasForeignKey(a => a.SubidoPorId)
             .OnDelete(DeleteBehavior.SetNull)
             .IsRequired(false);
        });

        // ── CotizacionIA ──────────────────────────────────────────────────────
        builder.Entity<CotizacionIA>(e =>
        {
            e.HasKey(c => c.Id);
            e.Property(c => c.RangoMinimo).HasColumnType("decimal(18,2)");
            e.Property(c => c.RangoMaximo).HasColumnType("decimal(18,2)");
            e.Property(c => c.ResumenIA).HasMaxLength(5000);
            e.Property(c => c.Estado).HasMaxLength(40).HasDefaultValue("Activa");
            e.Property(c => c.Version).HasDefaultValue(1);

            // Múltiples cotizaciones por proyecto (historial)
            e.HasOne(c => c.Proyecto)
             .WithMany(p => p.CotizacionesIA)
             .HasForeignKey(c => c.ProyectoId)
             .OnDelete(DeleteBehavior.Cascade);

            e.HasOne(c => c.GeneradoPor)
             .WithMany()
             .HasForeignKey(c => c.GeneradoPorId)
             .OnDelete(DeleteBehavior.SetNull)
             .IsRequired(false);

            e.HasIndex(c => c.ProyectoId);
            e.HasIndex(c => c.FechaGeneracion);
            e.HasIndex(c => c.Estado);
        });

        // ── LineaCotizacionIA ─────────────────────────────────────────────────
        builder.Entity<LineaCotizacionIA>(e =>
        {
            e.HasKey(l => l.Id);
            e.Property(l => l.Descripcion).HasMaxLength(300).IsRequired();
            e.Property(l => l.Categoria).HasConversion<string>().HasMaxLength(30);
            e.Property(l => l.Unidad).HasMaxLength(50);
            e.Property(l => l.Cantidad).HasColumnType("decimal(18,3)");
            e.Property(l => l.PrecioUnitario).HasColumnType("decimal(18,2)");
            e.Property(l => l.PrecioTotal).HasColumnType("decimal(18,2)");

            e.HasOne(l => l.CotizacionIA)
             .WithMany(c => c.Lineas)
             .HasForeignKey(l => l.CotizacionIAId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        // ── Material ──────────────────────────────────────────────────────────
        builder.Entity<Material>(e =>
        {
            e.HasKey(m => m.Id);
            e.Property(m => m.Nombre).HasMaxLength(200).IsRequired();
            e.Property(m => m.Descripcion).HasMaxLength(500);
            e.Property(m => m.UnidadMedida).HasMaxLength(50);
            e.Property(m => m.Categoria).HasConversion<string>().HasMaxLength(30);
            e.Property(m => m.CodigoProducto).HasMaxLength(100);
        });

        // ── PrecioMaterial ────────────────────────────────────────────────────
        builder.Entity<PrecioMaterial>(e =>
        {
            e.HasKey(pm => pm.Id);
            e.Property(pm => pm.Precio).HasColumnType("decimal(18,2)");
            e.Property(pm => pm.Moneda).HasMaxLength(5);
            e.Property(pm => pm.UrlProducto).HasMaxLength(500);

            e.HasOne(pm => pm.Material)
             .WithMany(m => m.Precios)
             .HasForeignKey(pm => pm.MaterialId)
             .OnDelete(DeleteBehavior.Cascade);

            e.HasOne(pm => pm.Proveedor)
             .WithMany(p => p.Precios)
             .HasForeignKey(pm => pm.ProveedorId)
             .OnDelete(DeleteBehavior.Restrict);
        });

        // ── PerfilConstructor ─────────────────────────────────────────────────
        builder.Entity<PerfilConstructor>(e =>
        {
            e.HasKey(p => p.Id);
            e.Property(p => p.NombreEmpresa).HasMaxLength(200).IsRequired();
            e.Property(p => p.Bio).HasMaxLength(2000);
            e.Property(p => p.Especialidades).HasMaxLength(500);
            e.Property(p => p.ZonasCobertura).HasMaxLength(500);
            e.Property(p => p.CedulaJuridica).HasMaxLength(50);
            e.Property(p => p.Telefono).HasMaxLength(20);
            e.Property(p => p.EmailContacto).HasMaxLength(200);
            e.Property(p => p.SitioWeb).HasMaxLength(300);
            e.Property(p => p.Instagram).HasMaxLength(150);
            e.Property(p => p.CalificacionPromedio).HasColumnType("decimal(3,2)");
            e.Property(p => p.TasaIVA).HasColumnType("decimal(18,2)");

            e.HasOne(p => p.Usuario)
             .WithOne(u => u.PerfilConstructor)
             .HasForeignKey<PerfilConstructor>(p => p.UsuarioId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        // ── PerfilProveedor ───────────────────────────────────────────────────
        builder.Entity<PerfilProveedor>(e =>
        {
            e.HasKey(p => p.Id);
            e.Property(p => p.NombreComercial).HasMaxLength(200).IsRequired();
            e.Property(p => p.Descripcion).HasMaxLength(1000);
            e.Property(p => p.Direccion).HasMaxLength(300);
            e.Property(p => p.Canton).HasMaxLength(100);
            e.Property(p => p.Provincia).HasMaxLength(100);
            e.Property(p => p.TelefonoNegocio).HasMaxLength(20);
            e.Property(p => p.SitioWeb).HasMaxLength(300);
            e.Property(p => p.HorarioAtencion).HasMaxLength(200);

            e.HasOne(p => p.Usuario)
             .WithOne(u => u.PerfilProveedor)
             .HasForeignKey<PerfilProveedor>(p => p.UsuarioId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        // ── PortafolioItem ────────────────────────────────────────────────────
        builder.Entity<PortafolioItem>(e =>
        {
            e.HasKey(p => p.Id);
            e.Property(p => p.ImagenUrl).HasMaxLength(500).IsRequired();
            e.Property(p => p.Titulo).HasMaxLength(200);
            e.Property(p => p.Descripcion).HasMaxLength(1000);

            e.HasOne(p => p.Constructor)
             .WithMany(c => c.PortafolioItems)
             .HasForeignKey(p => p.ConstructorId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        // ── Propuesta ─────────────────────────────────────────────────────────
        builder.Entity<Propuesta>(e =>
        {
            e.HasKey(p => p.Id);
            e.Property(p => p.MontoTotal).HasColumnType("decimal(18,2)");
            e.Property(p => p.Descripcion).HasMaxLength(3000);
            e.Property(p => p.Incluye).HasMaxLength(2000);
            e.Property(p => p.Estado).HasConversion<string>().HasMaxLength(20);
            e.Property(p => p.ArchivoUrl).HasMaxLength(500);

            e.HasOne(p => p.Proyecto)
             .WithMany(pr => pr.Propuestas)
             .HasForeignKey(p => p.ProyectoId)
             .OnDelete(DeleteBehavior.Cascade);

            e.HasOne(p => p.Constructor)
             .WithMany(c => c.Propuestas)
             .HasForeignKey(p => p.ConstructorId)
             .OnDelete(DeleteBehavior.Restrict);
        });

        // ── Calificacion ──────────────────────────────────────────────────────
        builder.Entity<Calificacion>(e =>
        {
            e.HasKey(c => c.Id);
            e.Property(c => c.Comentario).HasMaxLength(1000);
            e.Property(c => c.RespuestaComentario).HasMaxLength(1000);

            e.HasOne(c => c.Proyecto)
             .WithMany(p => p.Calificaciones)
             .HasForeignKey(c => c.ProyectoId)
             .OnDelete(DeleteBehavior.Restrict);

            e.HasOne(c => c.Propuesta)
             .WithMany(p => p.Calificaciones)
             .HasForeignKey(c => c.PropuestaId)
             .OnDelete(DeleteBehavior.Restrict)
             .IsRequired(false);

            e.HasOne(c => c.Evaluador)
             .WithMany(u => u.CalificacionesEmitidas)
             .HasForeignKey(c => c.EvaluadorId)
             .OnDelete(DeleteBehavior.Restrict);

            e.HasOne(c => c.Evaluado)
             .WithMany(u => u.CalificacionesRecibidas)
             .HasForeignKey(c => c.EvaluadoId)
             .OnDelete(DeleteBehavior.Restrict);
        });

        // ── Mensaje ───────────────────────────────────────────────────────────
        builder.Entity<Mensaje>(e =>
        {
            e.HasKey(m => m.Id);
            e.Property(m => m.Contenido).HasMaxLength(4000).IsRequired();
            e.Property(m => m.Canal).HasMaxLength(20).HasDefaultValue("General");
            e.Property(m => m.AdjuntoUrl); // nvarchar(MAX) — soporta base64 de PDFs
            e.Property(m => m.AdjuntoNombre).HasMaxLength(200);

            e.HasOne(m => m.Proyecto)
             .WithMany(p => p.Mensajes)
             .HasForeignKey(m => m.ProyectoId)
             .OnDelete(DeleteBehavior.Restrict);

            e.HasOne(m => m.Propuesta)
             .WithMany(p => p.Mensajes)
             .HasForeignKey(m => m.PropuestaId)
             .OnDelete(DeleteBehavior.Restrict)
             .IsRequired(false);

            e.HasOne(m => m.Remitente)
             .WithMany()
             .HasForeignKey(m => m.RemitenteId)
             .OnDelete(DeleteBehavior.Restrict);

            e.HasOne(m => m.Destinatario)
             .WithMany()
             .HasForeignKey(m => m.DestinatarioId)
             .OnDelete(DeleteBehavior.Restrict)
             .IsRequired(false);
        });

        // ── AvanceObra ────────────────────────────────────────────────────────
        builder.Entity<AvanceObra>(e =>
        {
            e.HasKey(a => a.Id);
            e.Property(a => a.Titulo).HasMaxLength(300).IsRequired();
            e.Property(a => a.Descripcion).HasMaxLength(3000).IsRequired();
            e.Property(a => a.Responsable).HasMaxLength(200);
            e.Property(a => a.PorcentajeAvance).HasDefaultValue(0);

            e.HasOne(a => a.Proyecto)
             .WithMany(p => p.Avances)
             .HasForeignKey(a => a.ProyectoId)
             .OnDelete(DeleteBehavior.Cascade);

            e.HasOne(a => a.Constructor)
             .WithMany(c => c.AvancesObra)
             .HasForeignKey(a => a.ConstructorId)
             .OnDelete(DeleteBehavior.Restrict);
        });

        // ── FotoAvance ────────────────────────────────────────────────────────
        builder.Entity<FotoAvance>(e =>
        {
            e.HasKey(f => f.Id);
            e.Property(f => f.Url).HasMaxLength(500).IsRequired();
            e.Property(f => f.NombreArchivo).HasMaxLength(200);
            e.Property(f => f.Tipo).HasMaxLength(20);

            e.HasOne(f => f.Avance)
             .WithMany(a => a.Fotos)
             .HasForeignKey(f => f.AvanceObraId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        // ── PresupuestoPartida ────────────────────────────────────────────────
        builder.Entity<PresupuestoPartida>(e =>
        {
            e.HasKey(p => p.Id);
            e.Property(p => p.Nombre).HasMaxLength(300).IsRequired();
            e.Property(p => p.Categoria).HasMaxLength(50);
            e.Property(p => p.Descripcion).HasMaxLength(1000);
            e.Property(p => p.PresupuestoEstimado).HasColumnType("decimal(18,2)");
            e.Ignore(p => p.GastoReal);  // calculado

            e.HasOne(p => p.Proyecto)
             .WithMany(pr => pr.Partidas)
             .HasForeignKey(p => p.ProyectoId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        // ── GastoObra ─────────────────────────────────────────────────────────
        builder.Entity<GastoObra>(e =>
        {
            e.HasKey(g => g.Id);
            e.Property(g => g.Descripcion).HasMaxLength(500).IsRequired();
            e.Property(g => g.Categoria).HasMaxLength(50);
            e.Property(g => g.Monto).HasColumnType("decimal(18,2)");
            e.Property(g => g.Referencia).HasMaxLength(200);

            e.HasOne(g => g.Proyecto)
             .WithMany(p => p.GastosObra)
             .HasForeignKey(g => g.ProyectoId)
             .OnDelete(DeleteBehavior.ClientCascade);

            e.HasOne(g => g.Partida)
             .WithMany(p => p.Gastos)
             .HasForeignKey(g => g.PartidaId)
             .OnDelete(DeleteBehavior.SetNull)
             .IsRequired(false);

            e.HasOne(g => g.RegistradoPor)
             .WithMany()
             .HasForeignKey(g => g.RegistradoPorId)
             .OnDelete(DeleteBehavior.Restrict);
        });

        // ── OrdenCambio ───────────────────────────────────────────────────────
        builder.Entity<OrdenCambio>(e =>
        {
            e.HasKey(o => o.Id);
            e.Property(o => o.Titulo).HasMaxLength(300).IsRequired();
            e.Property(o => o.Descripcion).HasMaxLength(5000).IsRequired();
            e.Property(o => o.Estado).HasMaxLength(20);
            e.Property(o => o.Notas).HasMaxLength(2000);
            e.Property(o => o.ImpactoEconomico).HasColumnType("decimal(18,2)");
            e.Property(o => o.ArchivoEvidenciaUrl).HasMaxLength(500);

            e.HasOne(o => o.Proyecto)
             .WithMany(p => p.OrdenesCambio)
             .HasForeignKey(o => o.ProyectoId)
             .OnDelete(DeleteBehavior.Cascade);

            e.HasOne(o => o.SolicitadoPor)
             .WithMany()
             .HasForeignKey(o => o.SolicitadoPorId)
             .OnDelete(DeleteBehavior.Restrict);

            e.HasOne(o => o.AprobadoPor)
             .WithMany()
             .HasForeignKey(o => o.AprobadoPorId)
             .OnDelete(DeleteBehavior.Restrict)
             .IsRequired(false);
        });

        // ── MiembroEquipoProyecto ─────────────────────────────────────────────
        builder.Entity<MiembroEquipoProyecto>(e =>
        {
            e.HasKey(m => m.Id);
            e.Property(m => m.Nombre).HasMaxLength(200).IsRequired();
            e.Property(m => m.Rol).HasMaxLength(80).IsRequired();
            e.Property(m => m.Empresa).HasMaxLength(200);
            e.Property(m => m.Email).HasMaxLength(200);
            e.Property(m => m.Telefono).HasMaxLength(30);
            e.Property(m => m.Responsabilidades).HasMaxLength(2000);
            e.Property(m => m.Permisos).HasMaxLength(500);

            e.HasOne(m => m.Proyecto)
             .WithMany(p => p.MiembrosEquipo)
             .HasForeignKey(m => m.ProyectoId)
             .OnDelete(DeleteBehavior.Cascade);

            e.HasOne(m => m.Usuario)
             .WithMany()
             .HasForeignKey(m => m.UsuarioId)
             .OnDelete(DeleteBehavior.SetNull)
             .IsRequired(false);
        });

        // ── Usuario — campos extra ────────────────────────────────────────────
        builder.Entity<Usuario>(e =>
        {
            e.Property(u => u.Activo).HasDefaultValue(true);
            e.Property(u => u.UltimoAcceso).IsRequired(false);
        });

        // ── RolPermiso ────────────────────────────────────────────────────────
        builder.Entity<RolPermiso>(e =>
        {
            e.HasKey(r => r.Id);
            e.Property(r => r.Rol).HasMaxLength(30).IsRequired();
            e.Property(r => r.PermisoCodigo).HasMaxLength(80).IsRequired();
            e.HasIndex(r => new { r.Rol, r.PermisoCodigo }).IsUnique();
        });

        // ── UsuarioPermiso ────────────────────────────────────────────────────
        builder.Entity<UsuarioPermiso>(e =>
        {
            e.HasKey(u => u.Id);
            e.Property(u => u.PermisoCodigo).HasMaxLength(80).IsRequired();
            e.Property(u => u.Motivo).HasMaxLength(500);
            e.HasIndex(u => new { u.UsuarioId, u.PermisoCodigo }).IsUnique();

            e.HasOne(u => u.Usuario)
             .WithMany(u => u.PermisosExtra)
             .HasForeignKey(u => u.UsuarioId)
             .OnDelete(DeleteBehavior.ClientCascade); // evita múltiples cascade paths con ModificadoPorId

            e.HasOne(u => u.ModificadoPor)
             .WithMany()
             .HasForeignKey(u => u.ModificadoPorId)
             .OnDelete(DeleteBehavior.Restrict)
             .IsRequired(false);
        });

        // ── AuditoriaLog ──────────────────────────────────────────────────────
        builder.Entity<AuditoriaLog>(e =>
        {
            e.HasKey(a => a.Id);
            e.Property(a => a.Accion).HasMaxLength(100).IsRequired();
            e.Property(a => a.Modulo).HasMaxLength(50).IsRequired();
            e.Property(a => a.UsuarioNombre).HasMaxLength(150);
            e.Property(a => a.EntidadId).HasMaxLength(50);
            e.Property(a => a.Detalle).HasMaxLength(2000);
            e.Property(a => a.IpAddress).HasMaxLength(45);

            e.HasOne(a => a.Usuario)
             .WithMany()
             .HasForeignKey(a => a.UsuarioId)
             .OnDelete(DeleteBehavior.SetNull)
             .IsRequired(false);
        });

        // ── ConfiguracionGlobal ───────────────────────────────────────────────
        builder.Entity<ConfiguracionGlobal>(e =>
        {
            e.HasKey(c => c.Id);
            e.Property(c => c.Clave).HasMaxLength(100).IsRequired();
            e.Property(c => c.Valor).HasMaxLength(2000).IsRequired();
            e.Property(c => c.Descripcion).HasMaxLength(500);
            e.Property(c => c.Categoria).HasMaxLength(50);
            e.HasIndex(c => c.Clave).IsUnique();

            e.HasOne(c => c.ModificadoPor)
             .WithMany()
             .HasForeignKey(c => c.ModificadoPorId)
             .OnDelete(DeleteBehavior.SetNull)
             .IsRequired(false);
        });

        // ── Empleado ──────────────────────────────────────────────────────────
        builder.Entity<Empleado>(e =>
        {
            e.HasKey(emp => emp.Id);
            e.Property(emp => emp.Nombre).HasMaxLength(150).IsRequired();
            e.Property(emp => emp.Rol).HasMaxLength(100);
            e.Property(emp => emp.Puesto).HasMaxLength(100);
            e.Property(emp => emp.Cedula).HasMaxLength(20);
            e.Property(emp => emp.Email).HasMaxLength(200);
            e.Property(emp => emp.Telefono).HasMaxLength(20);
            e.HasIndex(emp => new { emp.ConstructorId, emp.Cedula }).IsUnique().HasFilter("[Cedula] IS NOT NULL");

            e.HasOne(emp => emp.Constructor)
             .WithMany(c => c.Empleados)
             .HasForeignKey(emp => emp.ConstructorId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        // ── AsignacionEmpleado ────────────────────────────────────────────────
        builder.Entity<AsignacionEmpleado>(e =>
        {
            e.HasKey(a => a.Id);
            e.Property(a => a.Notas).HasMaxLength(500);

            e.HasOne(a => a.Empleado)
             .WithMany(emp => emp.Asignaciones)
             .HasForeignKey(a => a.EmpleadoId)
             .OnDelete(DeleteBehavior.Cascade);

            e.HasOne(a => a.Proyecto)
             .WithMany(p => p.AsignacionesEquipo)
             .HasForeignKey(a => a.ProyectoId)
             .OnDelete(DeleteBehavior.Cascade);

            e.HasIndex(a => new { a.EmpleadoId, a.ProyectoId }).IsUnique();
        });

        // ── CartaAceptacion ───────────────────────────────────────────────────
        builder.Entity<CartaAceptacion>(e =>
        {
            e.HasKey(c => c.Id);
            e.Property(c => c.ObservacionesCliente).HasMaxLength(3000);

            e.HasOne(c => c.Proyecto)
             .WithOne(p => p.CartaAceptacion)
             .HasForeignKey<CartaAceptacion>(c => c.ProyectoId)
             .OnDelete(DeleteBehavior.Cascade);

            e.HasOne(c => c.Propuesta)
             .WithMany()
             .HasForeignKey(c => c.PropuestaId)
             .OnDelete(DeleteBehavior.Restrict);
        });

        // ── Factura ───────────────────────────────────────────────────────────
        builder.Entity<Factura>(e =>
        {
            e.HasKey(f => f.Id);
            e.Property(f => f.Numero).HasMaxLength(30).IsRequired();
            e.Property(f => f.Concepto).HasMaxLength(500);
            e.Property(f => f.Notas).HasMaxLength(2000);
            e.Property(f => f.MontoTotal).HasColumnType("decimal(18,2)");
            e.Property(f => f.MontoPagado).HasColumnType("decimal(18,2)");
            e.Property(f => f.MontoIVA).HasColumnType("decimal(18,2)");
            e.Property(f => f.MontoDescuento).HasColumnType("decimal(18,2)");
            e.Property(f => f.Estado).HasConversion<string>().HasMaxLength(20);
            e.Ignore(f => f.Saldo);   // propiedad calculada

            e.HasOne(f => f.Proyecto)
             .WithMany(p => p.Facturas)
             .HasForeignKey(f => f.ProyectoId)
             .OnDelete(DeleteBehavior.Restrict);

            e.HasOne(f => f.Propuesta)
             .WithMany(p => p.Facturas)
             .HasForeignKey(f => f.PropuestaId)
             .OnDelete(DeleteBehavior.Restrict)
             .IsRequired(false);

            e.HasOne(f => f.Constructor)
             .WithMany(c => c.Facturas)
             .HasForeignKey(f => f.ConstructorId)
             .OnDelete(DeleteBehavior.Restrict);
        });

        // ── PagoFactura ───────────────────────────────────────────────────────
        builder.Entity<PagoFactura>(e =>
        {
            e.HasKey(p => p.Id);
            e.Property(p => p.Monto).HasColumnType("decimal(18,2)");
            e.Property(p => p.MetodoPago).HasConversion<string>().HasMaxLength(20);
            e.Property(p => p.Referencia).HasMaxLength(200);
            e.Property(p => p.Notas).HasMaxLength(500);

            e.HasOne(p => p.Factura)
             .WithMany(f => f.Pagos)
             .HasForeignKey(p => p.FacturaId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        // ── FaseProyecto ──────────────────────────────────────────────────────
        builder.Entity<FaseProyecto>(e =>
        {
            e.HasKey(f => f.Id);
            e.Property(f => f.Nombre).HasMaxLength(300).IsRequired();
            e.Property(f => f.Descripcion).HasMaxLength(2000);
            e.Property(f => f.Estado).HasConversion<string>().HasMaxLength(20);
            e.Property(f => f.Color).HasMaxLength(20).HasDefaultValue("#1976d2");

            e.HasOne(f => f.Proyecto)
             .WithMany(p => p.Fases)
             .HasForeignKey(f => f.ProyectoId)
             .OnDelete(DeleteBehavior.Cascade);

            e.HasOne(f => f.Responsable)
             .WithMany()
             .HasForeignKey(f => f.ResponsableId)
             .OnDelete(DeleteBehavior.SetNull)
             .IsRequired(false);
        });

        // ── TareaFase ─────────────────────────────────────────────────────────
        builder.Entity<TareaFase>(e =>
        {
            e.HasKey(t => t.Id);
            e.Property(t => t.Nombre).HasMaxLength(300).IsRequired();
            e.Property(t => t.Descripcion).HasMaxLength(2000);
            e.Property(t => t.Estado).HasConversion<string>().HasMaxLength(20);

            e.HasOne(t => t.Fase)
             .WithMany(f => f.Tareas)
             .HasForeignKey(t => t.FaseId)
             .OnDelete(DeleteBehavior.Cascade);

            e.HasOne(t => t.Responsable)
             .WithMany()
             .HasForeignKey(t => t.ResponsableId)
             .OnDelete(DeleteBehavior.SetNull)
             .IsRequired(false);
        });

        // ── AvanceObra — FaseId (nullable FK, client-side null to avoid cascade cycles) ─
        builder.Entity<AvanceObra>(e =>
        {
            e.HasOne(a => a.Fase)
             .WithMany(f => f.Avances)
             .HasForeignKey(a => a.FaseId)
             .OnDelete(DeleteBehavior.ClientSetNull)
             .IsRequired(false);
        });

        // ── EmailLog ──────────────────────────────────────────────────────────
        builder.Entity<EmailLog>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Para).HasMaxLength(200).IsRequired();
            e.Property(x => x.Asunto).HasMaxLength(500).IsRequired();
            e.Property(x => x.Evento).HasMaxLength(100);
            e.Property(x => x.Error).HasMaxLength(2000);

            e.HasOne(x => x.Usuario)
             .WithMany()
             .HasForeignKey(x => x.UsuarioId)
             .OnDelete(DeleteBehavior.SetNull)
             .IsRequired(false);

            e.HasIndex(x => x.FechaEnvio);
            e.HasIndex(x => x.Exitoso);
        });

        // ── Notificacion ──────────────────────────────────────────────────────
        builder.Entity<Notificacion>(e =>
        {
            e.HasKey(n => n.Id);
            e.Property(n => n.Tipo).HasMaxLength(50).IsRequired();
            e.Property(n => n.Titulo).HasMaxLength(200).IsRequired();
            e.Property(n => n.Mensaje).HasMaxLength(1000);
            e.Property(n => n.UrlDestino).HasMaxLength(500);

            e.HasOne(n => n.Usuario)
             .WithMany()
             .HasForeignKey(n => n.UsuarioId)
             .OnDelete(DeleteBehavior.Cascade);

            e.HasOne(n => n.Proyecto)
             .WithMany()
             .HasForeignKey(n => n.ProyectoId)
             .OnDelete(DeleteBehavior.ClientSetNull)
             .IsRequired(false);

            e.HasIndex(n => new { n.UsuarioId, n.Leida });
            e.HasIndex(n => n.FechaCreacion);
        });

        // ── FavoritoProveedor ─────────────────────────────────────────────────────
        builder.Entity<FavoritoProveedor>(e =>
        {
            e.HasKey(f => f.Id);

            e.HasOne(f => f.Usuario)
             .WithMany()
             .HasForeignKey(f => f.UsuarioId)
             .OnDelete(DeleteBehavior.Cascade);

            e.HasOne(f => f.PerfilProveedor)
             .WithMany()
             .HasForeignKey(f => f.PerfilProveedorId)
             .OnDelete(DeleteBehavior.Restrict);

            // Un usuario no puede guardar el mismo proveedor dos veces
            e.HasIndex(f => new { f.UsuarioId, f.PerfilProveedorId }).IsUnique();
        });

        // ── Proyecto — índice de rendimiento ─────────────────────────────────────
        builder.Entity<Proyecto>(e =>
        {
            e.HasIndex(p => p.Estado);
            e.HasIndex(p => p.ClienteId);
        });

        // ── Invitacion ────────────────────────────────────────────────────────────
        builder.Entity<Invitacion>(e =>
        {
            e.HasKey(i => i.Id);
            e.Property(i => i.Email).HasMaxLength(200).IsRequired();
            e.Property(i => i.RolWorkspace).HasMaxLength(50).IsRequired();
            e.Property(i => i.Token).HasMaxLength(100).IsRequired();
            e.Property(i => i.Estado).HasMaxLength(20).IsRequired();
            e.HasIndex(i => i.Token).IsUnique();

            e.HasOne(i => i.Empresa)
             .WithMany()
             .HasForeignKey(i => i.EmpresaId)
             .OnDelete(DeleteBehavior.Cascade);

            e.HasOne(i => i.InvitadoPor)
             .WithMany()
             .HasForeignKey(i => i.InvitadoPorId)
             .OnDelete(DeleteBehavior.Restrict);

            e.HasOne(i => i.AceptadoPor)
             .WithMany()
             .HasForeignKey(i => i.AceptadoPorId)
             .OnDelete(DeleteBehavior.Restrict)
             .IsRequired(false);

            e.Property(i => i.Tipo).HasMaxLength(20).HasDefaultValue("Invitacion");

            e.HasOne(i => i.UsuarioCreador)
             .WithMany()
             .HasForeignKey(i => i.UsuarioCreadorId)
             .OnDelete(DeleteBehavior.NoAction)
             .IsRequired(false);

            e.HasIndex(i => i.EmpresaId);
        });
    }
}
