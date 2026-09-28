namespace ConstruApp.Core.Entities;

/// <summary>Asignación de permiso a un rol (editable por el administrador).</summary>
public class RolPermiso
{
    public int    Id            { get; set; }
    public string Rol           { get; set; } = string.Empty;   // "Admin","Cliente","Constructor"...
    public string PermisoCodigo { get; set; } = string.Empty;   // "proyectos.ver", etc.
}
