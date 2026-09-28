namespace ConstruApp.Core.Entities;

/// <summary>Registro histórico de cada correo enviado (o intento fallido).</summary>
public class EmailLog
{
    public int      Id          { get; set; }
    public string   Para        { get; set; } = string.Empty;
    public string   Asunto      { get; set; } = string.Empty;
    public bool     Exitoso     { get; set; } = false;
    public string?  Error       { get; set; }
    public DateTime FechaEnvio  { get; set; } = DateTime.UtcNow;

    /// <summary>Evento que originó el envío, ej. "propuesta_aceptada".</summary>
    public string?  Evento      { get; set; }

    /// <summary>ID del objeto referenciado (Factura, Propuesta, etc.).</summary>
    public int?     ReferenciaId { get; set; }

    /// <summary>Usuario que accionó el envío (puede ser null si es automático).</summary>
    public int?     UsuarioId   { get; set; }
    public Usuario? Usuario     { get; set; }
}
