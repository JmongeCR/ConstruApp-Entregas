using System.Security.Claims;
using ConstruApp.API.Services;
using ConstruApp.Core.Entities;
using ConstruApp.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ConstruApp.API.Controllers;

[ApiController]
[Route("api/perfiles/constructor")]
[Authorize]
public class PerfilesConstructorController : ControllerBase
{
    private readonly IUnitOfWork       _uow;
    private readonly IAuditoriaService _auditoria;

    public PerfilesConstructorController(IUnitOfWork uow, IAuditoriaService auditoria)
    {
        _uow       = uow;
        _auditoria = auditoria;
    }

    // GET api/perfiles/constructor
    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetAll([FromQuery] string? nombre, [FromQuery] string? zona)
    {
        var perfiles = await _uow.PerfilesConstructor.FindAsync(p =>
            (string.IsNullOrEmpty(nombre) || p.NombreEmpresa.Contains(nombre)) &&
            (string.IsNullOrEmpty(zona)   || (p.ZonasCobertura ?? "").Contains(zona)));

        return Ok(perfiles.OrderByDescending(p => p.CalificacionPromedio).Select(MapDto));
    }

    // GET api/perfiles/constructor/mio
    [HttpGet("mio")]
    public async Task<IActionResult> GetMio()
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var perfil = (await _uow.PerfilesConstructor.FindAsync(p => p.UsuarioId == userId)).FirstOrDefault();
        if (perfil is null) return NotFound(new { message = "No tenés perfil de empresa." });
        return Ok(MapDto(perfil));
    }

    // GET api/perfiles/constructor/{id}
    [HttpGet("{id:int}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetById(int id)
    {
        var perfil = await _uow.PerfilesConstructor.GetByIdAsync(id);
        if (perfil is null) return NotFound();
        return Ok(MapDto(perfil));
    }

    // POST api/perfiles/constructor
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] PerfilConstructorRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.NombreEmpresa))
            return BadRequest(new { message = "El nombre de la empresa es requerido." });

        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var existe = await _uow.PerfilesConstructor.ExistsAsync(p => p.UsuarioId == userId);
        if (existe)
            return Conflict(new { message = "Ya tenés un perfil de empresa registrado. Usá PUT para actualizarlo." });

        // Validar cédula jurídica única si se provee
        if (!string.IsNullOrWhiteSpace(req.CedulaJuridica))
        {
            var cedDup = await _uow.PerfilesConstructor.ExistsAsync(p => p.CedulaJuridica == req.CedulaJuridica);
            if (cedDup)
                return Conflict(new { message = "La cédula jurídica ya está registrada por otra empresa." });
        }

        var perfil = new PerfilConstructor
        {
            UsuarioId        = userId,
            NombreEmpresa    = req.NombreEmpresa.Trim(),
            Bio              = req.Bio,
            Especialidades   = req.Especialidades,
            ZonasCobertura   = req.ZonasCobertura,
            AniosExperiencia = req.AniosExperiencia,
            CedulaJuridica   = req.CedulaJuridica?.Trim(),
            Telefono         = req.Telefono,
            EmailContacto    = req.EmailContacto,
            SitioWeb         = req.SitioWeb,
            Instagram        = req.Instagram,
            Verificado       = false,
        };

        await _uow.PerfilesConstructor.AddAsync(perfil);
        await _uow.SaveChangesAsync();

        var nombre = User.FindFirstValue("nombre") ?? "Usuario";
        await _auditoria.RegistrarAsync(userId, nombre, "RegistrarEmpresa", "PerfilesConstructor",
            perfil.Id.ToString(), $"Empresa: {perfil.NombreEmpresa}",
            HttpContext.Connection.RemoteIpAddress?.ToString());

        return CreatedAtAction(nameof(GetMio), MapDto(perfil));
    }

    // PUT api/perfiles/constructor/{id}
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] PerfilConstructorRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.NombreEmpresa))
            return BadRequest(new { message = "El nombre de la empresa es requerido." });

        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var perfil = await _uow.PerfilesConstructor.GetByIdAsync(id);
        if (perfil is null) return NotFound();
        if (perfil.UsuarioId != userId) return Forbid();

        // Validar cédula jurídica única (excluyendo la propia)
        if (!string.IsNullOrWhiteSpace(req.CedulaJuridica) && req.CedulaJuridica != perfil.CedulaJuridica)
        {
            var cedDup = await _uow.PerfilesConstructor.ExistsAsync(
                p => p.CedulaJuridica == req.CedulaJuridica && p.Id != id);
            if (cedDup)
                return Conflict(new { message = "La cédula jurídica ya está registrada por otra empresa." });
        }

        perfil.NombreEmpresa    = req.NombreEmpresa.Trim();
        perfil.Bio              = req.Bio;
        perfil.Especialidades   = req.Especialidades;
        perfil.ZonasCobertura   = req.ZonasCobertura;
        perfil.AniosExperiencia = req.AniosExperiencia;
        perfil.CedulaJuridica   = req.CedulaJuridica?.Trim();
        perfil.Telefono         = req.Telefono;
        perfil.EmailContacto    = req.EmailContacto;
        perfil.SitioWeb         = req.SitioWeb;
        perfil.Instagram        = req.Instagram;

        await _uow.PerfilesConstructor.UpdateAsync(perfil);
        await _uow.SaveChangesAsync();

        return Ok(MapDto(perfil));
    }

    // ── Helpers ──────────────────────────────────────────────────────────────────
    private static object MapDto(PerfilConstructor p) => new
    {
        p.Id,
        p.UsuarioId,
        p.NombreEmpresa,
        p.Bio,
        p.Especialidades,
        p.ZonasCobertura,
        p.AniosExperiencia,
        p.CedulaJuridica,
        p.Telefono,
        p.EmailContacto,
        p.SitioWeb,
        p.Instagram,
        p.Verificado,
        p.CalificacionPromedio,
        p.TotalProyectos,
    };
}

public record PerfilConstructorRequest(
    string  NombreEmpresa,
    string? Bio,
    string? Especialidades,
    string? ZonasCobertura,
    int     AniosExperiencia,
    string? CedulaJuridica,
    string? Telefono,
    string? EmailContacto,
    string? SitioWeb,
    string? Instagram
);
