namespace ConstruApp.Core.Entities;

/// <summary>
/// Miembro del equipo profesional asignado a un proyecto.
/// Roles: Arquitecto, Ingeniero, Supervisor, Maestro de Obra,
///        Electricista, Fontanero, Proveedor.
/// Puede o no tener cuenta en el sistema (UsuarioId nullable).
/// </summary>
public class MiembroEquipoProyecto
{
    public int      Id                  { get; set; }
    public int      ProyectoId          { get; set; }
    public int?     UsuarioId           { get; set; }   // null → contacto externo

    public string   Nombre              { get; set; } = string.Empty;
    public string   Rol                 { get; set; } = string.Empty;  // uno de los 7 roles
    public string?  Empresa             { get; set; }
    public string?  Email               { get; set; }
    public string?  Telefono            { get; set; }
    public string?  Responsabilidades   { get; set; }
    public string?  Permisos            { get; set; }  // ej. "verAvances,verPresupuesto,chat"
    public bool     Activo              { get; set; } = true;
    public DateTime FechaAsignacion     { get; set; } = DateTime.UtcNow;

    // Navegación
    public Proyecto Proyecto { get; set; } = null!;
    public Usuario? Usuario  { get; set; }
}
