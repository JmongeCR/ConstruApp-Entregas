using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using ConstruApp.Core.Entities;
using ConstruApp.Core.Interfaces;
using ConstruApp.Infrastructure.Data;

namespace ConstruApp.API.Services;

public class ResendEmailService : IEmailService
{
    private readonly ResendConfig           _cfg;
    private readonly IHttpClientFactory     _http;
    private readonly AppDbContext           _db;
    private readonly ILogger<ResendEmailService> _log;

    public ResendEmailService(IConfiguration config, IHttpClientFactory http, AppDbContext db, ILogger<ResendEmailService> log)
    {
        _cfg  = config.GetSection("Resend").Get<ResendConfig>() ?? new ResendConfig();
        _http = http;
        _db   = db;
        _log  = log;
    }

    public async Task<bool> EnviarAsync(EmailMessage msg)
    {
        string? errorMsg = null;
        bool ok = false;

        try
        {
            var client = _http.CreateClient();
            client.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Bearer", _cfg.ApiKey);

            var payload = new
            {
                from    = $"{_cfg.NombreRemitente} <{_cfg.From}>",
                to      = new[] { msg.Para },
                subject = msg.Asunto,
                html    = msg.HtmlBody,
                text    = msg.TextoPlano,
            };

            var json    = JsonSerializer.Serialize(payload);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await client.PostAsync("https://api.resend.com/emails", content);
            var body     = await response.Content.ReadAsStringAsync();

            if (response.IsSuccessStatusCode)
            {
                ok = true;
                _log.LogInformation("[Resend] Enviado OK → {Para} | {Asunto}", msg.Para, msg.Asunto);
            }
            else
            {
                errorMsg = $"HTTP {(int)response.StatusCode}: {body}";
                _log.LogError("[Resend] Error al enviar a {Para}: {Error}", msg.Para, errorMsg);
            }
        }
        catch (Exception ex)
        {
            errorMsg = ex.Message;
            _log.LogError(ex, "[Resend] Excepción al enviar a {Para}", msg.Para);
        }

        await RegistrarLog(msg, ok, errorMsg);
        return ok;
    }

    public Task<bool> ProbarConexionAsync() => Task.FromResult(!string.IsNullOrEmpty(_cfg.ApiKey));

    private async Task RegistrarLog(EmailMessage msg, bool exitoso, string? error)
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
            _log.LogWarning(ex, "[Resend] Error al registrar log de email");
        }
    }
}

public class ResendConfig
{
    public string ApiKey          { get; set; } = "";
    public string From            { get; set; } = "onboarding@resend.dev";
    public string NombreRemitente { get; set; } = "ConstruApp";
}
