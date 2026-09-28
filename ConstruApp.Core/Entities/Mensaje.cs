namespace ConstruApp.Core.Entities;

public class Mensaje
{
    public int    Id              { get; set; }
    public int    ProyectoId      { get; set; }
    public int?   PropuestaId     { get; set; }
    public int    RemitenteId     { get; set; }
    public int?   DestinatarioId  { get; set; }     // null = mensaje grupal de proyecto
    public string Contenido       { get; set; } = string.Empty;
    public string? AdjuntoUrl     { get; set; }     // URL de archivo adjunto
    public string? AdjuntoNombre  { get; set; }     // Nombre del adjunto
    public string  Canal           { get; set; } = "General"; // General | Cliente | Tecnico | Equipo
    public bool   Leido           { get; set; } = false;
    public DateTime FechaEnvio    { get; set; } = DateTime.UtcNow;

    // Navegación
    public Proyecto   Proyecto    { get; set; } = null!;
    public Propuesta? Propuesta   { get; set; }
    public Usuario    Remitente   { get; set; } = null!;
    public Usuario?   Destinatario { get; set; }
}
