using System.Net.Http.Headers;
using System.Security.Claims;
using System.Text;
using ConstruApp.API.Services;
using ConstruApp.Core.Entities;
using ConstruApp.Core.Enums;
using ConstruApp.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ConstruApp.API.Controllers;

[ApiController]
[Route("api/facturas/{facturaId:int}/onvo")]
[Authorize]
public sealed class OnvoPagosController(
    IUnitOfWork uow,
    IHttpClientFactory httpFactory,
    IConfiguration config,
    IAuditoriaService auditoria,
    ILogger<OnvoPagosController> logger) : ControllerBase
{
    private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    // POST api/facturas/{facturaId}/onvo/iniciar
    [HttpPost("iniciar")]
    public async Task<IActionResult> Iniciar(int facturaId, CancellationToken ct)
    {
        var factura = await uow.Facturas.GetByIdAsync(facturaId);
        if (factura is null) return NotFound(new { message = "Factura no encontrada." });

        if (factura.Estado == EstadoFactura.Pagada || factura.Estado == EstadoFactura.Cancelada)
            return BadRequest(new { message = "Esta factura no admite pagos." });

        var saldo = factura.Saldo;
        if (saldo <= 0) return BadRequest(new { message = "La factura ya está saldada." });

        // Obtener claves ONVO del constructor que emitió la factura
        var perfil = await uow.PerfilesConstructor.GetByIdAsync(factura.ConstructorId);
        if (perfil is null) return StatusCode(503, new { message = "Perfil del constructor no encontrado." });

        var secretKey = Descifrar(perfil.OnvoSecretKeyEncriptado);
        var publicKey = perfil.OnvoPublicKey;

        if (string.IsNullOrWhiteSpace(secretKey) || string.IsNullOrWhiteSpace(publicKey))
            return StatusCode(503, new { message = "El constructor no ha configurado su pasarela de pagos. Contactá al constructor para coordinar el pago." });

        // Crear Payment Intent en ONVO
        using var http = httpFactory.CreateClient();
        http.Timeout = TimeSpan.FromSeconds(20);
        using var req = new HttpRequestMessage(HttpMethod.Post, "https://api.onvopay.com/v1/payment-intents");
        req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", secretKey);
        req.Content = JsonContent.Create(new
        {
            currency    = "CRC",
            amount      = (long)Math.Round(saldo),
            description = $"Factura {factura.Numero} — {factura.Concepto ?? factura.Numero}",
        });

        try
        {
            using var res = await http.SendAsync(req, ct);
            if (!res.IsSuccessStatusCode)
            {
                var body = await res.Content.ReadAsStringAsync(ct);
                logger.LogWarning("ONVO error {Status}: {Body}", (int)res.StatusCode, body);
                return StatusCode(502, new { message = "Error al conectar con la pasarela de pagos. Intentá de nuevo." });
            }

            var intent = await res.Content.ReadFromJsonAsync<OnvoIntentResponse>(ct);
            if (intent?.Id is null) return StatusCode(502, new { message = "Respuesta inválida de la pasarela." });

            return Ok(new { paymentIntentId = intent.Id, publicKey });
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Error al llamar ONVO para factura {Id}.", facturaId);
            return StatusCode(503, new { message = "Pasarela de pagos no disponible. Intentá más tarde." });
        }
    }

    // POST api/facturas/{facturaId}/onvo/confirmar
    [HttpPost("confirmar")]
    public async Task<IActionResult> Confirmar(int facturaId, ConfirmarPagoRequest body, CancellationToken ct)
    {
        var factura = await uow.Facturas.GetByIdAsync(facturaId);
        if (factura is null) return NotFound(new { message = "Factura no encontrada." });

        if (factura.Estado == EstadoFactura.Pagada)
            return BadRequest(new { message = "La factura ya fue marcada como pagada." });

        var pago = new PagoFactura
        {
            FacturaId  = facturaId,
            Monto      = factura.Saldo,
            MetodoPago = MetodoPago.Tarjeta,
            Referencia = body.PaymentIntentId,
            Notas      = "Pago en línea vía ONVO Pay",
            Fecha      = DateTime.UtcNow,
        };

        factura.MontoPagado += pago.Monto;
        factura.Estado = factura.MontoPagado >= factura.MontoTotal
            ? EstadoFactura.Pagada
            : EstadoFactura.PagoParcial;

        await uow.PagosFactura.AddAsync(pago);
        await uow.Facturas.UpdateAsync(factura);
        await uow.SaveChangesAsync();

        await auditoria.RegistrarAsync(UserId, User.FindFirstValue("nombre") ?? "",
            "PagoOnline", "Facturas", facturaId.ToString(),
            $"Pago ONVO {body.PaymentIntentId} — ₡{pago.Monto:N0}");

        return Ok(new { message = "Pago confirmado.", estado = factura.Estado.ToString() });
    }

    // PUT api/perfiles/constructor/mio/onvo-keys  (guardado de llaves desde el perfil)
    // Nota: se expone aquí para mantener cohesión de pagos en este controller
    [HttpPut("/api/perfiles/constructor/mio/onvo-keys")]
    [Authorize(Roles = "Constructor")]
    public async Task<IActionResult> GuardarLlaves([FromBody] LlavesOnvoRequest body, CancellationToken ct)
    {
        var userId = UserId;
        var perfil = (await uow.PerfilesConstructor.FindAsync(p => p.UsuarioId == userId)).FirstOrDefault();
        if (perfil is null) return NotFound(new { message = "Perfil no encontrado." });

        if (!string.IsNullOrWhiteSpace(body.SecretKey))
            perfil.OnvoSecretKeyEncriptado = Cifrar(body.SecretKey.Trim());

        if (!string.IsNullOrWhiteSpace(body.PublicKey))
            perfil.OnvoPublicKey = body.PublicKey.Trim();

        await uow.PerfilesConstructor.UpdateAsync(perfil);
        await uow.SaveChangesAsync();

        await auditoria.RegistrarAsync(userId, User.FindFirstValue("nombre") ?? "",
            "ActualizarLlavesOnvo", "PerfilesConstructor", perfil.Id.ToString(), "Llaves ONVO actualizadas");

        return Ok(new { message = "Configuración de pagos guardada." });
    }

    // ── Cifrado simétrico simple con clave de config ───────────────────────────
    private string Cifrar(string plain)
    {
        var key = ObtenerClaveAes();
        using var aes = System.Security.Cryptography.Aes.Create();
        aes.Key = key;
        aes.GenerateIV();
        using var enc = aes.CreateEncryptor();
        var bytes = Encoding.UTF8.GetBytes(plain);
        var cipher = enc.TransformFinalBlock(bytes, 0, bytes.Length);
        var result = new byte[aes.IV.Length + cipher.Length];
        aes.IV.CopyTo(result, 0);
        cipher.CopyTo(result, aes.IV.Length);
        return Convert.ToBase64String(result);
    }

    private string? Descifrar(string? cipherB64)
    {
        if (string.IsNullOrWhiteSpace(cipherB64)) return null;
        try
        {
            var key = ObtenerClaveAes();
            var data = Convert.FromBase64String(cipherB64);
            using var aes = System.Security.Cryptography.Aes.Create();
            aes.Key = key;
            var iv = data[..16];
            var cipher = data[16..];
            aes.IV = iv;
            using var dec = aes.CreateDecryptor();
            var plain = dec.TransformFinalBlock(cipher, 0, cipher.Length);
            return Encoding.UTF8.GetString(plain);
        }
        catch { return null; }
    }

    private byte[] ObtenerClaveAes()
    {
        var raw = config["Encryption:Key"] ?? "ConstruApp2026!!ConstruApp2026!!";
        return Encoding.UTF8.GetBytes(raw.PadRight(32)[..32]);
    }

    private sealed record OnvoIntentResponse(string? Id);
    public sealed record ConfirmarPagoRequest(string PaymentIntentId);
    public sealed record LlavesOnvoRequest(string? SecretKey, string? PublicKey);
}
