namespace ConstruApp.Core.Entities;

public class Empleado
{
    public int    Id            { get; set; }
    public int    ConstructorId { get; set; }   // FK → PerfilConstructor
    public string Nombre        { get; set; } = string.Empty;
    public string? Rol          { get; set; }   // "Albañil", "Electricista", etc.
    public string? Puesto       { get; set; }   // cargo formal: "Maestro de obras", "Asistente"
    public string? Cedula       { get; set; }   // cédula nacional para evitar duplicados
    public string? Email        { get; set; }
    public string? Telefono     { get; set; }
    public bool   Activo        { get; set; } = true;

    // Navegación
    public PerfilConstructor               Constructor   { get; set; } = null!;
    public ICollection<AsignacionEmpleado> Asignaciones  { get; set; } = [];
}
