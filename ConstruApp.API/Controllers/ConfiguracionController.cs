using ConstruApp.Core.Constants;
using ConstruApp.Core.Entities;
using ConstruApp.API.Filters;
using ConstruApp.API.Services;
using ConstruApp.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ConstruApp.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class ConfiguracionController : ControllerBase
{
    private readonly AppDbContext      _db;
    private readonly IAuditoriaService _auditoria;

    public ConfiguracionController(AppDbContext db, IAuditoriaService auditoria)
    {
        _db        = db;
        _auditoria = auditoria;
    }

    // GET api/configuracion
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? categoria)
    {
        var query = _db.Configuraciones.AsQueryable();
        if (!string.IsNullOrWhiteSpace(categoria))
            query = query.Where(c => c.Categoria == categoria);

        var data = await query
            .OrderBy(c => c.Categoria).ThenBy(c => c.Clave)
            .Select(c => new {
                c.Id, c.Clave, c.Valor, c.Descripcion,
                c.Categoria, c.Editable, c.FechaModificacion,
            })
            .ToListAsync();

        return Ok(data);
    }

    // GET api/configuracion/categorias
    [HttpGet("categorias")]
    public async Task<IActionResult> GetCategorias()
    {
        var cats = await _db.Configuraciones
            .Select(c => c.Categoria)
            .Distinct()
            .OrderBy(c => c)
            .ToListAsync();
        return Ok(cats);
    }

    // GET api/configuracion/{clave}
    [HttpGet("{clave}")]
    public async Task<IActionResult> GetByClave(string clave)
    {
        var config = await _db.Configuraciones.FirstOrDefaultAsync(c => c.Clave == clave);
        if (config is null) return NotFound();
        return Ok(config);
    }

    // PUT api/configuracion/{clave}
    [HttpPut("{clave}")]
    public async Task<IActionResult> Actualizar(string clave, [FromBody] ActualizarConfigRequest req)
    {
        var config = await _db.Configuraciones.FirstOrDefaultAsync(c => c.Clave == clave);
        if (config is null) return NotFound();
        if (!config.Editable) return BadRequest(new { message = "Esta configuración no es editable." });

        var valorAnterior      = config.Valor;
        config.Valor           = req.Valor;
        config.FechaModificacion = DateTime.UtcNow;

        var adminId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);
        config.ModificadoPorId = adminId;

        await _db.SaveChangesAsync();

        await _auditoria.RegistrarAsync(adminId, "Admin",
            "ActualizarConfiguracion", "Configuracion", clave,
            $"Valor: '{valorAnterior}' → '{req.Valor}'");

        return Ok(new { clave, valor = config.Valor });
    }

    // POST api/configuracion  — crear nueva entrada (solo admin)
    [HttpPost]
    public async Task<IActionResult> Crear([FromBody] CrearConfigRequest req)
    {
        var existe = await _db.Configuraciones.AnyAsync(c => c.Clave == req.Clave);
        if (existe) return Conflict(new { message = "Ya existe una configuración con esa clave." });

        var adminId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);

        var config = new ConfiguracionGlobal
        {
            Clave              = req.Clave,
            Valor              = req.Valor,
            Descripcion        = req.Descripcion,
            Categoria          = req.Categoria ?? "General",
            Editable           = req.Editable ?? true,
            ModificadoPorId    = adminId,
            FechaModificacion  = DateTime.UtcNow,
        };

        _db.Configuraciones.Add(config);
        await _db.SaveChangesAsync();
        return Created($"/api/configuracion/{config.Clave}", config);
    }
}

public record ActualizarConfigRequest(string Valor);
public record CrearConfigRequest(string Clave, string Valor, string? Descripcion, string? Categoria, bool? Editable);
