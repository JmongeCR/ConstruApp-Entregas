using System.Security.Claims;
using ConstruApp.Core.Entities;
using ConstruApp.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ConstruApp.API.Controllers;

[ApiController]
[Route("api/perfiles/proveedor")]
[Authorize]
public class PerfilesProveedorController : ControllerBase
{
    private readonly IUnitOfWork _uow;

    public PerfilesProveedorController(IUnitOfWork uow) => _uow = uow;

    // GET api/perfiles/proveedor
    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetAll([FromQuery] string? zona, [FromQuery] string? nombre)
    {
        var perfiles = await _uow.PerfilesProveedor.FindAsync(p =>
            (string.IsNullOrEmpty(zona)   || (p.Provincia ?? "").Contains(zona)  ||
                                             (p.Canton   ?? "").Contains(zona)) &&
            (string.IsNullOrEmpty(nombre) || p.NombreComercial.Contains(nombre)));

        return Ok(perfiles.Select(p => MapDto(p)));
    }

    // GET api/perfiles/proveedor/mio
    [HttpGet("mio")]
    public async Task<IActionResult> GetMio()
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var perfil = (await _uow.PerfilesProveedor.FindAsync(p => p.UsuarioId == userId)).FirstOrDefault();
        if (perfil is null) return NotFound(new { message = "No tenés perfil de proveedor." });
        return Ok(MapDto(perfil));
    }

    // GET api/perfiles/proveedor/{id}
    [HttpGet("{id:int}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetById(int id)
    {
        var perfil = await _uow.PerfilesProveedor.GetByIdAsync(id);
        if (perfil is null) return NotFound();
        return Ok(MapDto(perfil));
    }

    // POST api/perfiles/proveedor
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] PerfilProveedorRequest req)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var existe = await _uow.PerfilesProveedor.ExistsAsync(p => p.UsuarioId == userId);
        if (existe) return Conflict(new { message = "Ya tenés un perfil de proveedor. Usá PUT para actualizarlo." });

        var perfil = new PerfilProveedor
        {
            UsuarioId        = userId,
            NombreComercial  = req.NombreComercial,
            Descripcion      = req.Descripcion,
            Direccion        = req.Direccion,
            Canton           = req.Canton,
            Provincia        = req.Provincia,
            TelefonoNegocio  = req.TelefonoNegocio,
            SitioWeb         = req.SitioWeb,
            HorarioAtencion  = req.HorarioAtencion,
        };

        await _uow.PerfilesProveedor.AddAsync(perfil);
        await _uow.SaveChangesAsync();

        return CreatedAtAction(nameof(GetMio), MapDto(perfil));
    }

    // PUT api/perfiles/proveedor/{id}
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] PerfilProveedorRequest req)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var perfil = await _uow.PerfilesProveedor.GetByIdAsync(id);
        if (perfil is null) return NotFound();
        if (perfil.UsuarioId != userId) return Forbid();

        perfil.NombreComercial = req.NombreComercial;
        perfil.Descripcion     = req.Descripcion;
        perfil.Direccion       = req.Direccion;
        perfil.Canton          = req.Canton;
        perfil.Provincia       = req.Provincia;
        perfil.TelefonoNegocio = req.TelefonoNegocio;
        perfil.SitioWeb        = req.SitioWeb;
        perfil.HorarioAtencion = req.HorarioAtencion;

        await _uow.PerfilesProveedor.UpdateAsync(perfil);
        await _uow.SaveChangesAsync();

        return Ok(MapDto(perfil));
    }

    // ── Helpers ──────────────────────────────────────────────────────────────────
    private static object MapDto(PerfilProveedor p) => new
    {
        p.Id,
        p.UsuarioId,
        p.NombreComercial,
        p.Descripcion,
        p.Direccion,
        p.Canton,
        p.Provincia,
        p.TelefonoNegocio,
        p.SitioWeb,
        p.HorarioAtencion,
        p.Verificado,
    };
}

public record PerfilProveedorRequest(
    string  NombreComercial,
    string? Descripcion,
    string? Direccion,
    string? Canton,
    string? Provincia,
    string? TelefonoNegocio,
    string? SitioWeb,
    string? HorarioAtencion
);
