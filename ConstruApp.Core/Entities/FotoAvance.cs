namespace ConstruApp.Core.Entities;

public class FotoAvance
{
    public int      Id            { get; set; }
    public int      AvanceObraId  { get; set; }
    public string   Url           { get; set; } = string.Empty;   // /uploads/avances/...
    public string   NombreArchivo { get; set; } = string.Empty;
    public string   Tipo          { get; set; } = "foto";         // foto | video
    public long?    TamanioBytes  { get; set; }
    public DateTime FechaSubida   { get; set; } = DateTime.UtcNow;

    // Navegación
    public AvanceObra Avance { get; set; } = null!;
}
