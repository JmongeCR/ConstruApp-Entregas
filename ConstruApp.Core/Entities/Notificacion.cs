namespace ConstruApp.Core.Entities;

public class Notificacion
{
    public int     Id          { get; set; }
    public int     UsuarioId   { get; set; }

    /// <summary>
    /// Tipo canónico: nueva_propuesta | propuesta_aceptada | propuesta_rechazada |
    /// proyecto_creado | proyecto_asignado | proyecto_finalizado |
    /// fase_iniciada | fase_completada | fase_atrasada |
    /// avance_registrado | foto_subida |
    /// factura_creada | factura_enviada | factura_vencida | pago_recibido |
    /// orden_creada | orden_aprobada | orden_rechazada |
    /// documento_agregado | documento_actualizado |
    /// nuevo_mensaje | mencion_directa
    /// </summary>
    public string  Tipo        { get; set; } = "";
    public string  Titulo      { get; set; } = "";
    public string  Mensaje     { get; set; } = "";
    public string? UrlDestino  { get; set; }
    public bool    Leida       { get; set; } = false;
    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;
    public int?    ProyectoId  { get; set; }

    // Navigation
    public Usuario  Usuario  { get; set; } = null!;
    public Proyecto? Proyecto { get; set; }
}
