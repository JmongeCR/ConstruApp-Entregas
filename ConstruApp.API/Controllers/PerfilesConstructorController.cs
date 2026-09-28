using System.Security.Claims;
using ConstruApp.Core.Entities;
using ConstruApp.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ConstruApp.API.Controllers;

[ApiController]
[Route("api/perfiles/constructor")]
public class PerfilesConstructorController : ControllerBase
{
    private readonly IUnitOfWork _uow;
    public PerfilesConstructorController(IUnitOfWork uow) => _uow = uow;

    private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    // GET api/perfiles/constructor  (público — marketplace)
    [AllowAnonymous]
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? especialidad,
        [FromQuery] string? zona,
        [FromQuery] bool?   soloVerificados)
    {
        var perfiles = await _uow.PerfilesConstructor.GetAllAsync();

        if (!string.IsNullOrEmpty(especialidad))
            perfiles = perfiles.Where(p => p.Especialidades != null &&
                p.Especialidades.Contains(especialidad, StringComparison.OrdinalIgnoreCase));

        if (!string.IsNullOrEmpty(zona))
            perfiles = perfiles.Where(p => p.ZonasCobertura != null &&
                p.ZonasCobertura.Contains(zona, StringComparison.OrdinalIgnoreCase));

        if (soloVerificados == true)
            perfiles = perfiles.Where(p => p.Verificado);

        return Ok(perfiles.OrderByDescending(p => p.CalificacionPromedio).Select(Map));
    }

    // GET api/perfiles/constructor/{id}
    [AllowAnonymous]
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var p = await _uow.PerfilesConstructor.GetByIdAsync(id);
        if (p is null) return NotFound();

        var items         = await _uow.PortafolioItems.FindAsync(pi => pi.ConstructorId == id);
        var propuestasAll = await _uow.Propuestas.FindAsync(pr => pr.ConstructorId == id);

        return Ok(MapFull(p, items, propuestasAll.Count()));
    }

    // GET api/perfiles/constructor/mio
    [Authorize]
    [HttpGet("mio")]
    public async Task<IActionResult> GetMio()
    {
        var perfiles = await _uow.PerfilesConstructor.FindAsync(p => p.UsuarioId == UserId);
        var p = perfiles.FirstOrDefault();
        if (p is null) return NotFound(new { message = "No tenés perfil de constructor aún." });

        var items = await _uow.PortafolioItems.FindAsync(pi => pi.ConstructorId == p.Id);
        return Ok(MapFull(p, items, 0));
    }

    // POST api/perfiles/constructor
    [Authorize]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] PerfilConstructorRequest req)
    {
        var existe = await _uow.PerfilesConstructor.FindAsync(p => p.UsuarioId == UserId);
        if (existe.Any())
            return Conflict(new { message = "Ya tenés un perfil de constructor." });

        var perfil = new PerfilConstructor
        {
            UsuarioId        = UserId,
            NombreEmpresa    = req.NombreEmpresa,
            Bio              = req.Bio,
            Especialidades   = req.Especialidades,
            ZonasCobertura   = req.ZonasCobertura,
            AniosExperiencia = req.AniosExperiencia,
            CedulaJuridica   = req.CedulaJuridica,
            SitioWeb         = req.SitioWeb,
            Instagram        = req.Instagram,
        };

        await _uow.PerfilesConstructor.AddAsync(perfil);
        await _uow.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = perfil.Id }, Map(perfil));
    }

    // PUT api/perfiles/constructor/{id}
    [Authorize]
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] PerfilConstructorRequest req)
    {
        var p = await _uow.PerfilesConstructor.GetByIdAsync(id);
        if (p is null) return NotFound();
        if (p.UsuarioId != UserId && User.FindFirstValue(ClaimTypes.Role) != "Admin")
            return Forbid();

        p.NombreEmpresa    = req.NombreEmpresa;
        p.Bio              = req.Bio;
        p.Especialidades   = req.Especialidades;
        p.ZonasCobertura   = req.ZonasCobertura;
        p.AniosExperiencia = req.AniosExperiencia;
        p.CedulaJuridica   = req.CedulaJuridica;
        p.SitioWeb         = req.SitioWeb;
        p.Instagram        = req.Instagram;

        _uow.PerfilesConstructor.UpdateAsync(p);
        await _uow.SaveChangesAsync();
        return Ok(Map(p));
    }

    // GET api/perfiles/constructor/financiero
    [Authorize]
    [HttpGet("financiero")]
    public async Task<IActionResult> GetFinanciero()
    {
        var perfiles = await _uow.PerfilesConstructor.FindAsync(p => p.UsuarioId == UserId);
        var p = perfiles.FirstOrDefault();
        if (p is null) return NotFound(new { message = "No tenés perfil de constructor." });
        return Ok(MapFinanciero(p));
    }

    // PUT api/perfiles/constructor/financiero
    [Authorize]
    [HttpPut("financiero")]
    public async Task<IActionResult> UpdateFinanciero([FromBody] FinancieroRequest req)
    {
        var perfiles = await _uow.PerfilesConstructor.FindAsync(p => p.UsuarioId == UserId);
        var p = perfiles.FirstOrDefault();
        if (p is null) return NotFound(new { message = "No tenés perfil de constructor." });

        p.EmailFacturacion    = req.EmailFacturacion;
        p.DireccionFiscal     = req.DireccionFiscal;
        p.TelefonoFiscal      = req.TelefonoFiscal;
        p.PrefijoFactura      = string.IsNullOrEmpty(req.PrefijoFactura) ? "FAC" : req.PrefijoFactura.ToUpper();
        p.DiasVencimiento     = req.DiasVencimiento > 0 ? req.DiasVencimiento : 30;
        p.TasaIVA             = req.TasaIVA >= 0 ? req.TasaIVA : 13;
        p.AplicaIVADefault    = req.AplicaIVADefault;
        p.TerminosCondiciones = req.TerminosCondiciones;
        p.FormasPago          = req.FormasPago;
        p.CuentasBancarias    = req.CuentasBancarias;

        _uow.PerfilesConstructor.UpdateAsync(p);
        await _uow.SaveChangesAsync();
        return Ok(MapFinanciero(p));
    }

    // POST api/perfiles/constructor/{id}/portafolio
    [Authorize]
    [HttpPost("{id}/portafolio")]
    public async Task<IActionResult> AgregarPortafolio(int id, [FromBody] PortafolioItemRequest req)
    {
        var p = await _uow.PerfilesConstructor.GetByIdAsync(id);
        if (p is null || p.UsuarioId != UserId) return Forbid();

        var item = new PortafolioItem
        {
            ConstructorId = id,
            ImagenUrl     = req.ImagenUrl,
            Titulo        = req.Titulo,
            Descripcion   = req.Descripcion,
        };
        await _uow.PortafolioItems.AddAsync(item);
        await _uow.SaveChangesAsync();
        return Ok(item);
    }

    private static object Map(PerfilConstructor p) => new
    {
        p.Id, p.UsuarioId, p.NombreEmpresa, p.Bio,
        p.Especialidades, p.ZonasCobertura, p.AniosExperiencia,
        p.SitioWeb, p.Instagram, p.Verificado,
        p.CalificacionPromedio, p.TotalProyectos,
    };

    private static object MapFull(PerfilConstructor p, IEnumerable<PortafolioItem> items, int propuestas) => new
    {
        p.Id, p.UsuarioId, p.NombreEmpresa, p.Bio,
        p.Especialidades, p.ZonasCobertura, p.AniosExperiencia,
        p.CedulaJuridica, p.SitioWeb, p.Instagram,
        p.Verificado, p.CalificacionPromedio, p.TotalProyectos,
        TotalPropuestas = propuestas,
        Portafolio = items.Select(i => new { i.Id, i.ImagenUrl, i.Titulo, i.Descripcion, i.Fecha }),
    };

    private static object MapFinanciero(PerfilConstructor p) => new
    {
        p.Id,
        p.NombreEmpresa,
        p.CedulaJuridica,
        p.EmailFacturacion,
        p.DireccionFiscal,
        p.TelefonoFiscal,
        p.PrefijoFactura,
        p.DiasVencimiento,
        p.TasaIVA,
        p.AplicaIVADefault,
        p.TerminosCondiciones,
        p.FormasPago,
        p.CuentasBancarias,
    };
}

public record PerfilConstructorRequest(
    string  NombreEmpresa,
    string? Bio,
    string? Especialidades,
    string? ZonasCobertura,
    int     AniosExperiencia,
    string? CedulaJuridica,
    string? SitioWeb,
    string? Instagram);

public record PortafolioItemRequest(string ImagenUrl, string Titulo, string? Descripcion);

public record FinancieroRequest(
    string? EmailFacturacion,
    string? DireccionFiscal,
    string? TelefonoFiscal,
    string  PrefijoFactura,
    int     DiasVencimiento,
    decimal TasaIVA,
    bool    AplicaIVADefault,
    string? TerminosCondiciones,
    string? FormasPago,
    string? CuentasBancarias);
