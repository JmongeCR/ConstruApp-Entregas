namespace ConstruApp.Core.Entities;

/// <summary>Registro de auditoría de acciones en el sistema.</summary>
public class AuditoriaLog
{
    public int     Id          { get; set; }
    public int?    UsuarioId   { get; set; }
    public string  UsuarioNombre { get; set; } = string.Empty;  // snapshot, no FK join needed
    public string  Accion      { get; set; } = string.Empty;    // "Login","CambioRol","BloqueoUsuario"...
    public string  Modulo      { get; set; } = string.Empty;    // "Auth","Usuarios","Roles","Proyectos"...
    public string? EntidadId   { get; set; }                    // ID del objeto afectado
    public string? Detalle     { get; set; }                    // Descripción libre o JSON
    public string? IpAddress   { get; set; }
    public DateTime Fecha      { get; set; } = DateTime.UtcNow;

    public Usuario? Usuario    { get; set; }
}
