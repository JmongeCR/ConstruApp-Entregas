using ConstruApp.API.Services;
using ConstruApp.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ConstruApp.Infrastructure.Data;

namespace ConstruApp.API.Controllers;

[ApiController]
[Route("api/email")]
[Authorize(Roles = "Admin")]
public class EmailController : ControllerBase
{
    private readonly IEmailService _email;
    private readonly AppDbContext  _db;

    public EmailController(IEmailService email, AppDbContext db)
    {
        _email = email;
        _db    = db;
    }

    // ── GET /api/email/logs ──────────────────────────────────────────────────
    /// <summary>Historial de correos enviados. Solo admin.</summary>
    [HttpGet("logs")]
    public async Task<IActionResult> GetLogs(
        [FromQuery] int page = 1,
        [FromQuery] int size = 20,
        [FromQuery] string? evento = null,
        [FromQuery] bool? exitoso = null)
    {
        var q = _db.EmailLogs.AsQueryable().OrderByDescending(e => e.FechaEnvio);

        if (!string.IsNullOrWhiteSpace(evento))
            q = (IOrderedQueryable<ConstruApp.Core.Entities.EmailLog>)q.Where(e => e.Evento == evento);

        if (exitoso.HasValue)
            q = (IOrderedQueryable<ConstruApp.Core.Entities.EmailLog>)q.Where(e => e.Exitoso == exitoso.Value);

        var total = await q.CountAsync();
        var items = await q
            .Skip((page - 1) * size)
            .Take(size)
            .Select(e => new
            {
                e.Id,
                e.Para,
                e.Asunto,
                e.Exitoso,
                e.Error,
                e.FechaEnvio,
                e.Evento,
                e.ReferenciaId,
                e.UsuarioId,
            })
            .ToListAsync();

        return Ok(new { total, page, size, items });
    }

    // ── GET /api/email/config ────────────────────────────────────────────────
    /// <summary>Estado actual de la configuración (sin contraseña).</summary>
    [HttpGet("config")]
    public IActionResult GetConfig([FromServices] IConfiguration config)
    {
        var cfg = config.GetSection("Email");
        return Ok(new
        {
            host            = cfg["Host"],
            puerto          = cfg["Puerto"],
            usuario         = cfg["Usuario"],
            sslEnabled      = cfg["SslEnabled"],
            nombreRemitente = cfg["NombreRemitente"],
            habilitarEnvio  = cfg["HabilitarEnvio"],
            configurado     = !string.IsNullOrEmpty(cfg["Usuario"]),
        });
    }

    // ── POST /api/email/test ─────────────────────────────────────────────────
    /// <summary>Envía un correo de prueba al destinatario indicado.</summary>
    [HttpPost("test")]
    public async Task<IActionResult> Test([FromBody] TestEmailRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Para))
            return BadRequest("El campo 'para' es requerido.");

        var msg = new EmailMessage(
            Para:     req.Para,
            Asunto:   "✉️ Correo de prueba — ConstruApp",
            HtmlBody: EmailTemplates.CorreoPrueba(req.Para),
            Evento:   "prueba"
        );

        var ok = await _email.EnviarAsync(msg);
        return Ok(new { ok, mensaje = ok ? "Correo enviado correctamente." : "Error al enviar el correo. Revisa la configuración SMTP." });
    }

    // ── GET /api/email/ping ──────────────────────────────────────────────────
    /// <summary>Verifica la conexión SMTP sin enviar nada.</summary>
    [HttpGet("ping")]
    public async Task<IActionResult> Ping()
    {
        var ok = await _email.ProbarConexionAsync();
        return Ok(new { ok, mensaje = ok ? "Conexión SMTP exitosa." : "No se pudo conectar al servidor SMTP." });
    }
}

public record TestEmailRequest(string Para);
