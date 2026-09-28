using System.Security.Claims;
using ConstruApp.Core.Entities;
using ConstruApp.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ConstruApp.API.Controllers;

[ApiController]
[Route("api/perfiles/proveedor")]
public class PerfilesProveedorController : ControllerBase
{
    private readonly IUnitOfWork _uow;
    public PerfilesProveedorController(IUnitOfWork uow) => _uow = uow;

    private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [AllowAnonymous]
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? provincia)
    {
        var perfiles = await _uow.PerfilesProveedor.GetAllAsync();
        if (!string.IsNullOrEmpty(provincia))
            perfiles = perfiles.Where(p => p.Provincia == provincia);
        return Ok(perfiles.Select(Map));
    }

    [AllowAnonymous]
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var p = await _uow.PerfilesProveedor.GetByIdAsync(id);
        if (p is null) return NotFound();
        var precios = await _uow.PreciosMaterial.FindAsync(pm => pm.ProveedorId == id);
        return Ok(MapFull(p, precios));
    }

    [Authorize]
    [HttpGet("mio")]
    public async Task<IActionResult> GetMio()
    {
        var lista = await _uow.PerfilesProveedor.FindAsync(p => p.UsuarioId == UserId);
        var p = lista.FirstOrDefault();
        if (p is null) return NotFound();
        return Ok(Map(p));
    }

    [Authorize]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] PerfilProveedorRequest req)
    {
        var existe = await _uow.PerfilesProveedor.FindAsync(p => p.UsuarioId == UserId);
        if (existe.Any()) return Conflict(new { message = "Ya tenés un perfil de proveedor." });

        var perfil = new PerfilProveedor
        {
            UsuarioId       = UserId,
            NombreComercial = req.NombreComercial,
            Descripcion     = req.Descripcion,
            Direccion       = req.Direccion,
            Canton          = req.Canton,
            Provincia       = req.Provincia,
            TelefonoNegocio = req.TelefonoNegocio,
            SitioWeb        = req.SitioWeb,
            HorarioAtencion = req.HorarioAtencion,
        };

        await _uow.PerfilesProveedor.AddAsync(perfil);
        await _uow.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = perfil.Id }, Map(perfil));
    }

    [Authorize]
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] PerfilProveedorRequest req)
    {
        var p = await _uow.PerfilesProveedor.GetByIdAsync(id);
        if (p is null) return NotFound();
        if (p.UsuarioId != UserId && User.FindFirstValue(ClaimTypes.Role) != "Admin") return Forbid();

        p.NombreComercial = req.NombreComercial;
        p.Descripcion     = req.Descripcion;
        p.Direccion       = req.Direccion;
        p.Canton          = req.Canton;
        p.Provincia       = req.Provincia;
        p.TelefonoNegocio = req.TelefonoNegocio;
        p.SitioWeb        = req.SitioWeb;
        p.HorarioAtencion = req.HorarioAtencion;

        _uow.PerfilesProveedor.UpdateAsync(p);
        await _uow.SaveChangesAsync();
        return Ok(Map(p));
    }

    private static object Map(PerfilProveedor p) => new
    {
        p.Id, p.UsuarioId, p.NombreComercial, p.Descripcion,
        p.Direccion, p.Canton, p.Provincia, p.TelefonoNegocio,
        p.SitioWeb, p.HorarioAtencion, p.Verificado,
    };

    private static object MapFull(PerfilProveedor p, IEnumerable<PrecioMaterial> precios) => new
    {
        p.Id, p.UsuarioId, p.NombreComercial, p.Descripcion,
        p.Direccion, p.Canton, p.Provincia, p.TelefonoNegocio,
        p.SitioWeb, p.HorarioAtencion, p.Verificado,
        Precios = precios.Select(pm => new
        {
            pm.Id, pm.MaterialId, pm.Precio, pm.Moneda,
            pm.UrlProducto, pm.FechaActualizacion, pm.Disponible,
        }),
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
    string? HorarioAtencion);
