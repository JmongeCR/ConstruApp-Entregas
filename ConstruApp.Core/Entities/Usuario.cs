using ConstruApp.Core.Enums;
using Microsoft.AspNetCore.Identity;

namespace ConstruApp.Core.Entities;

public class Usuario : IdentityUser<int>
{
    public string Nombre     { get; set; } = string.Empty;
    public string? Telefono  { get; set; }
    public string? AvatarUrl { get; set; }
    public Rol Rol            { get; set; } = Rol.Cliente;
    public bool Activo          { get; set; } = true;
    // null o "Activo" = normal | "Pendiente" = esperando aprobación | "Rechazado"
    public string? EstadoCuenta { get; set; }
    public string? MotivoRegistro { get; set; }
    public DateTime CreatedAt   { get; set; } = DateTime.UtcNow;
    public DateTime? UltimoAcceso { get; set; }

    // Navegación
    public PerfilConstructor? PerfilConstructor { get; set; }
    public PerfilProveedor?   PerfilProveedor   { get; set; }
    public ICollection<Proyecto>     Proyectos             { get; set; } = [];
    public ICollection<Calificacion> CalificacionesEmitidas  { get; set; } = [];
    public ICollection<Calificacion> CalificacionesRecibidas { get; set; } = [];
    public ICollection<UsuarioPermiso> PermisosExtra        { get; set; } = [];
}
