using ConstruApp.Core.Entities;
using ConstruApp.Core.Interfaces;
using ConstruApp.Infrastructure.Data;
using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;
using Microsoft.EntityFrameworkCore;

namespace ConstruApp.API.Services;

/// <summary>
/// Servicio de correo usando Gmail SMTP (o cualquier proveedor SMTP).
/// Migración a SendGrid / SES en producción: implementar otra clase con IEmailService
/// y cambiar el registro DI en Program.cs — el resto de la app no cambia.
/// </summary>
public class EmailService : IEmailService
{
    private readonly EmailConfig      _cfg;
    private readonly AppDbContext     _db;
    private readonly ILogger<EmailService> _log;

    public EmailService(IConfiguration config, AppDbContext db, ILogger<EmailService> log)
    {
        _cfg = config.GetSection("Email").Get<EmailConfig>() ?? new EmailConfig();
        _db  = db;
        _log = log;
    }

    // ─────────────────────────────────────────────────────────────────────────

    public async Task<bool> EnviarAsync(EmailMessage msg)
    {
        if (!_cfg.HabilitarEnvio)
        {
            _log.LogInformation("[Email] Envío deshabilitado. Para: {Para} | Asunto: {Asunto}", msg.Para, msg.Asunto);
            await RegistrarLog(msg, exitoso: true, error: "Envío deshabilitado (modo desarrollo)");
            return true; // no bloquea el flujo
        }

        var mime = BuildMimeMessage(msg);
        string? errorMsg = null;
        bool ok = false;

        try
        {
            using var client = new SmtpClient();
            // Evita error de revocación de certificado en macOS/Linux
            client.CheckCertificateRevocation = false;

            var secureSocket = _cfg.SslEnabled
                ? SecureSocketOptions.StartTls
                : SecureSocketOptions.None;

            await client.ConnectAsync(_cfg.Host, _cfg.Puerto, secureSocket);

            if (!string.IsNullOrEmpty(_cfg.Usuario))
                await client.AuthenticateAsync(_cfg.Usuario, _cfg.Password);

            await client.SendAsync(mime);
            await client.DisconnectAsync(true);
            ok = true;
            _log.LogInformation("[Email] Enviado OK → {Para} | {Asunto}", msg.Para, msg.Asunto);
        }
        catch (Exception ex)
        {
            errorMsg = ex.Message;
            _log.LogError(ex, "[Email] Error al enviar a {Para}", msg.Para);
        }

        await RegistrarLog(msg, ok, errorMsg);
        return ok;
    }

    public async Task<bool> ProbarConexionAsync()
    {
        if (string.IsNullOrEmpty(_cfg.Host)) return false;
        try
        {
            using var client = new SmtpClient();
            client.CheckCertificateRevocation = false;
            var secureSocket = _cfg.SslEnabled
                ? SecureSocketOptions.StartTls
                : SecureSocketOptions.None;

            await client.ConnectAsync(_cfg.Host, _cfg.Puerto, secureSocket);
            if (!string.IsNullOrEmpty(_cfg.Usuario))
                await client.AuthenticateAsync(_cfg.Usuario, _cfg.Password);
            await client.DisconnectAsync(true);
            return true;
        }
        catch
        {
            return false;
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private MimeMessage BuildMimeMessage(EmailMessage msg)
    {
        var mime = new MimeMessage();
        var fromAddress = string.IsNullOrWhiteSpace(_cfg.EmailOrigen) ? _cfg.Usuario : _cfg.EmailOrigen;
        mime.From.Add(new MailboxAddress(_cfg.NombreRemitente, fromAddress));
        mime.To.Add(MailboxAddress.Parse(msg.Para));
        mime.Subject = msg.Asunto;

        var builder = new BodyBuilder
        {
            HtmlBody  = msg.HtmlBody,
            TextBody  = msg.TextoPlano ?? StripHtml(msg.HtmlBody),
        };

        if (msg.AdjuntoBytes is { Length: > 0 } && msg.AdjuntoNombre != null)
        {
            builder.Attachments.Add(
                msg.AdjuntoNombre,
                msg.AdjuntoBytes,
                ContentType.Parse(msg.AdjuntoMime ?? "application/octet-stream")
            );
        }

        mime.Body = builder.ToMessageBody();
        return mime;
    }

    private async Task RegistrarLog(EmailMessage msg, bool exitoso, string? error = null)
    {
        try
        {
            _db.EmailLogs.Add(new EmailLog
            {
                Para         = msg.Para,
                Asunto       = msg.Asunto,
                Exitoso      = exitoso,
                Error        = error,
                FechaEnvio   = DateTime.UtcNow,
                Evento       = msg.Evento,
                ReferenciaId = msg.ReferenciaId,
                UsuarioId    = msg.UsuarioId,
            });
            await _db.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            _log.LogWarning(ex, "[Email] Error al registrar log de email");
        }
    }

    private static string StripHtml(string html)
    {
        if (string.IsNullOrEmpty(html)) return "";
        return System.Text.RegularExpressions.Regex.Replace(html, "<[^>]+>", " ").Trim();
    }
}

// ── Configuración tipada ───────────────────────────────────────────────────────

public class EmailConfig
{
    public string Host            { get; set; } = "smtp.gmail.com";
    public int    Puerto          { get; set; } = 587;
    public string Usuario         { get; set; } = "";
    public string Password        { get; set; } = "";
    public bool   SslEnabled      { get; set; } = true;
    public string NombreRemitente { get; set; } = "ConstruApp";
    public string EmailOrigen     { get; set; } = "";    // si está vacío usa Usuario
    public bool   HabilitarEnvio  { get; set; } = false; // false en dev por defecto
}
