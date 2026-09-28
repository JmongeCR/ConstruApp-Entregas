using ConstruApp.Core.Enums;

namespace ConstruApp.Core.Entities;

public class FaseProyecto
{
    public int    Id                    { get; set; }
    public int    ProyectoId            { get; set; }
    public string Nombre                { get; set; } = string.Empty;
    public string? Descripcion          { get; set; }
    public DateTime FechaInicio         { get; set; }
    public DateTime FechaFin            { get; set; }
    public EstadoFase Estado            { get; set; } = EstadoFase.Pendiente;
    public int    PorcentajeCompletado  { get; set; } = 0;   // 0–100
    public int?   ResponsableId         { get; set; }        // FK → Usuario (nullable)
    public int    Orden                 { get; set; } = 0;
    public string Color                 { get; set; } = "#1976d2";
    public DateTime FechaCreacion       { get; set; } = DateTime.UtcNow;
    public DateTime FechaActualizacion  { get; set; } = DateTime.UtcNow;

    // Navegación
    public Proyecto                Proyecto    { get; set; } = null!;
    public Usuario?                Responsable { get; set; }
    public ICollection<TareaFase>  Tareas      { get; set; } = [];
    public ICollection<AvanceObra> Avances     { get; set; } = [];
}
