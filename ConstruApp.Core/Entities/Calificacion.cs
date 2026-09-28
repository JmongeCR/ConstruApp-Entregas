namespace ConstruApp.Core.Entities;

public class Calificacion
{
    public int  Id          { get; set; }
    public int  ProyectoId  { get; set; }
    public int? PropuestaId { get; set; }
    public int  EvaluadorId { get; set; }
    public int  EvaluadoId  { get; set; }
    public int  Puntuacion  { get; set; }   // 1-5
    public string? Comentario          { get; set; }
    public string? RespuestaComentario { get; set; }
    public DateTime Fecha { get; set; } = DateTime.UtcNow;

    // Navegación
    public Proyecto   Proyecto  { get; set; } = null!;
    public Propuesta? Propuesta { get; set; }
    public Usuario    Evaluador { get; set; } = null!;
    public Usuario    Evaluado  { get; set; } = null!;
}
