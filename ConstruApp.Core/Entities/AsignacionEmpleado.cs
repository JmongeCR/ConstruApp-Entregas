namespace ConstruApp.Core.Entities;

public class AsignacionEmpleado
{
    public int     Id                { get; set; }
    public int     EmpleadoId        { get; set; }
    public int     ProyectoId        { get; set; }
    public string? Notas             { get; set; }
    public DateTime FechaAsignacion  { get; set; } = DateTime.UtcNow;

    // Navegación
    public Empleado  Empleado  { get; set; } = null!;
    public Proyecto  Proyecto  { get; set; } = null!;
}
