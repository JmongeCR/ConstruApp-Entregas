namespace ConstruApp.Core.Interfaces;

public interface IEmailService
{
    /// <summary>Envía un correo electrónico.</summary>
    Task<bool> EnviarAsync(EmailMessage message);

    /// <summary>Prueba la conexión SMTP. Devuelve true si OK.</summary>
    Task<bool> ProbarConexionAsync();
}

/// <summary>Datos del mensaje a enviar.</summary>
public record EmailMessage(
    string   Para,
    string   Asunto,
    string   HtmlBody,
    string?  TextoPlano      = null,
    byte[]?  AdjuntoBytes    = null,
    string?  AdjuntoNombre   = null,
    string?  AdjuntoMime     = null,  // e.g. "application/pdf"
    string?  Evento          = null,  // e.g. "propuesta_aceptada"
    int?     ReferenciaId    = null,  // ID del objeto relacionado
    int?     UsuarioId       = null
);
