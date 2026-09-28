using ConstruApp.API.Services;
using ConstruApp.Core.Entities;
using ConstruApp.Core.Enums;
using ConstruApp.Core.Interfaces;
using ConstruApp.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace ConstruApp.API.Controllers;

[ApiController]
[Route("api/empresa")]
[Authorize]
public class EmpresaController : ControllerBase
{
    private readonly AppDbContext         _db;
    private readonly UserManager<Usuario> _userManager;
    private readonly IEmailService        _email;
    private readonly IConfiguration       _config;
    private readonly IAuditoriaService    _auditoria;

    public EmpresaController(AppDbContext db, UserManager<Usuario> userManager,
        IEmailService email, IConfiguration config, IAuditoriaService auditoria)
    {
        _db        = db;
        _userManager = userManager;
        _email     = email;
        _config    = config;
        _auditoria = auditoria;
    }

    private async Task<(PerfilConstructor? perfil, int userId)> GetEmpresaDelUsuarioAsync()
    {
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var perfil = await _db.PerfilesConstructor.FirstOrDefaultAsync(p => p.UsuarioId == userId);
        return (perfil, userId);
    }

    // GET /api/empresa/miembros
    [HttpGet("miembros")]
    public async Task<IActionResult> GetMiembros()
    {
        var (perfil, _) = await GetEmpresaDelUsuarioAsync();
        if (perfil is null) return Forbid();

        var miembros = await _db.Invitaciones
            .Where(i => i.EmpresaId == perfil.Id &&
                (i.Estado == "Aceptada" || (i.Tipo == "Directo" && i.Estado == "Pendiente")))
            .Include(i => i.AceptadoPor)
            .Include(i => i.UsuarioCreador)
            .OrderBy(i => i.FechaCreacion)
            .ToListAsync();

        var data = miembros.Select(i => {
            var u = i.AceptadoPor ?? i.UsuarioCreador;
            return new {
                InvitacionId  = i.Id,
                UsuarioId     = u?.Id,
                Nombre        = u?.Nombre ?? i.Email,
                Email         = u?.Email ?? i.Email,
                Telefono      = u?.Telefono,
                RolWorkspace  = i.RolWorkspace,
                Activo        = u?.Activo ?? false,
                Estado        = i.Estado,
                FechaUnion    = i.FechaAceptacion ?? i.FechaCreacion,
            };
        });

        return Ok(data);
    }

    // POST /api/empresa/miembros  — crea usuario nuevo y lo agrega
    [HttpPost("miembros")]
    public async Task<IActionResult> AgregarMiembro([FromBody] AgregarMiembroEmpresaRequest req)
    {
        var (perfil, adminId) = await GetEmpresaDelUsuarioAsync();
        if (perfil is null) return Forbid();

        if (await _userManager.FindByEmailAsync(req.Email) is not null)
            return Conflict(new { message = "El email ya está registrado en la plataforma." });

        if (!Enum.TryParse<Rol>(req.RolWorkspace, true, out var rolPlataforma))
            rolPlataforma = Rol.Supervisor;

        var tempPass = Guid.NewGuid().ToString("N")[..8] + "Aa1!";
        var nuevo = new Usuario
        {
            UserName = req.Email, Email = req.Email,
            Nombre   = req.Nombre.Trim(), Telefono = req.Telefono?.Trim(),
            Rol = rolPlataforma, Activo = true, EmailConfirmed = true, CreatedAt = DateTime.UtcNow,
        };
        var cr = await _userManager.CreateAsync(nuevo, tempPass);
        if (!cr.Succeeded) return BadRequest(cr.Errors);

        var inv = new Invitacion
        {
            Email            = req.Email,
            RolWorkspace     = req.RolWorkspace,
            Token            = Guid.NewGuid().ToString("N"),
            EmpresaId        = perfil.Id,
            InvitadoPorId    = adminId,
            UsuarioCreadorId = nuevo.Id,
            AceptadoPorId    = nuevo.Id,
            FechaAceptacion  = DateTime.UtcNow,
            FechaCreacion    = DateTime.UtcNow,
            FechaExpiracion  = DateTime.UtcNow.AddYears(10),
            Estado           = "Aceptada",
            Tipo             = "Directo",
        };
        _db.Invitaciones.Add(inv);
        await _db.SaveChangesAsync();

        var baseUrl = _config["AppBaseUrl"] ?? "https://construapp.runasp.net";
        await _email.EnviarAsync(new Core.Interfaces.EmailMessage(
            Para:     req.Email,
            Asunto:   $"Fuiste agregado al equipo de {perfil.NombreEmpresa} en ConstruApp",
            HtmlBody: EmailTemplates.UsuarioCreado(nuevo.Nombre, req.Email, tempPass, $"{baseUrl}/login"),
            Evento:   "usuario_creado",
            UsuarioId: nuevo.Id
        ));

        await _auditoria.RegistrarAsync(adminId, "Empresa", "AgregarMiembro", "Empresa",
            perfil.Id.ToString(), $"Nuevo miembro: {req.Email}");

        return Ok(new { nuevo.Id, nuevo.Nombre, nuevo.Email, RolWorkspace = req.RolWorkspace });
    }

    // PUT /api/empresa/miembros/{invId}  — editar rol de workspace
    [HttpPut("miembros/{invId}")]
    public async Task<IActionResult> EditarMiembro(int invId, [FromBody] EditarMiembroRequest req)
    {
        var (perfil, _) = await GetEmpresaDelUsuarioAsync();
        if (perfil is null) return Forbid();

        var inv = await _db.Invitaciones.FirstOrDefaultAsync(i =>
            i.Id == invId && i.EmpresaId == perfil.Id);
        if (inv is null) return NotFound();

        inv.RolWorkspace = req.RolWorkspace;
        await _db.SaveChangesAsync();

        return Ok(new { inv.Id, inv.RolWorkspace });
    }

    // DELETE /api/empresa/miembros/{userId}  — desactivar miembro
    [HttpDelete("miembros/{userId}")]
    public async Task<IActionResult> QuitarMiembro(int userId)
    {
        var (perfil, adminId) = await GetEmpresaDelUsuarioAsync();
        if (perfil is null) return Forbid();

        if (perfil.UsuarioId == userId)
            return BadRequest(new { message = "No podés removerte a vos mismo como dueño." });

        var invitaciones = await _db.Invitaciones
            .Where(i => i.EmpresaId == perfil.Id &&
                (i.AceptadoPorId == userId || i.UsuarioCreadorId == userId) &&
                (i.Estado == "Aceptada" || (i.Tipo == "Directo" && i.Estado == "Pendiente")))
            .ToListAsync();

        foreach (var inv in invitaciones) inv.Estado = "Removida";
        await _db.SaveChangesAsync();

        await _auditoria.RegistrarAsync(adminId, "Empresa", "QuitarMiembro", "Empresa",
            perfil.Id.ToString(), $"Usuario {userId} removido");

        return Ok(new { message = "Miembro removido." });
    }
}

public record AgregarMiembroEmpresaRequest(string Nombre, string Email, string? Telefono, string RolWorkspace);
public record EditarMiembroRequest(string RolWorkspace);
