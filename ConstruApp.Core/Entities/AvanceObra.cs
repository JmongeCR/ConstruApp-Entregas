namespace ConstruApp.Core.Entities;

public class AvanceObra
{
    public int    Id                { get; set; }
    public int    ProyectoId        { get; set; }
    public int    ConstructorId     { get; set; }   // FK → PerfilConstructor
    public string Titulo            { get; set; } = string.Empty;
    public string Descripcion       { get; set; } = string.Empty;
    public string? Responsable      { get; set; }
    public int    PorcentajeAvance  { get; set; }   // 0–100
    public DateTime Fecha           { get; set; } = DateTime.UtcNow;
    public int?   FaseId            { get; set; }   // FK → FaseProyecto (nullable)

    // Navegación
    public Proyecto                  Proyecto    { get; set; } = null!;
    public PerfilConstructor         Constructor { get; set; } = null!;
    public ICollection<FotoAvance>   Fotos       { get; set; } = [];
    public FaseProyecto?             Fase        { get; set; }
}
