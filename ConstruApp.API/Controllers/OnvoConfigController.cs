using System.Security.Claims;
using System.Text;
using ConstruApp.API.Services;
using ConstruApp.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ConstruApp.API.Controllers;

[ApiController]
[Route("api/perfiles/constructor/mio/onvo-keys")]
[Authorize(Roles = "Constructor,Admin")]
public sealed class OnvoConfigController(
    IUnitOfWork uow,
    IAuditoriaService auditoria,
    IConfiguration config,
    ILogger<OnvoConfigController> logger) : ControllerBase
{
    private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpPut]
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

    private byte[] ObtenerClaveAes()
    {
        var raw = config["Encryption:Key"] ?? "ConstruApp2026!!ConstruApp2026!!";
        return Encoding.UTF8.GetBytes(raw.PadRight(32)[..32]);
    }

    public sealed record LlavesOnvoRequest(string? SecretKey, string? PublicKey);
}
