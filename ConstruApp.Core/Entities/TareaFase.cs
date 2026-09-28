using ConstruApp.Core.Enums;

namespace ConstruApp.Core.Entities;

public class TareaFase
{
    public int    Id             { get; set; }
    public int    FaseId         { get; set; }
    public string Nombre         { get; set; } = string.Empty;
    public string? Descripcion   { get; set; }
    public DateTime? FechaInicio { get; set; }
    public DateTime? FechaFin    { get; set; }
    public EstadoFase Estado     { get; set; } = EstadoFase.Pendiente;
    public int?   ResponsableId  { get; set; }  // FK → Usuario (nullable)
    public int    Orden          { get; set; } = 0;
    public bool   Completada     { get; set; } = false;

    // Navegación
    public FaseProyecto Fase        { get; set; } = null!;
    public Usuario?     Responsable { get; set; }
}
