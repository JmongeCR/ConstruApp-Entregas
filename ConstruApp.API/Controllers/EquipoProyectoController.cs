using System.Security.Claims;
using ConstruApp.Core.Entities;
using ConstruApp.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ConstruApp.API.Controllers;

[ApiController]
[Route("api/equipo-proyecto")]
[Authorize]
public class EquipoProyectoController : ControllerBase
{
    private readonly IUnitOfWork _uow;
    public EquipoProyectoController(IUnitOfWork uow) => _uow = uow;
    private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    // Roles válidos para el equipo del proyecto
    private static readonly HashSet<string> RolesValidos = new(StringComparer.OrdinalIgnoreCase)
    {
        "Arquitecto", "Ingeniero", "Supervisor", "Maestro de Obra",
        "Electricista", "Fontanero", "Proveedor", "Otro"
    };

    // GET api/equipo-proyecto/proyecto/{pid}
    [HttpGet("proyecto/{proyectoId}")]
    public async Task<IActionResult> GetByProyecto(int proyectoId)
    {
        var miembros = await _uow.MiembrosEquipo.FindAsync(m => m.ProyectoId == proyectoId && m.Activo);
        return Ok(miembros.OrderBy(m => m.Rol).ThenBy(m => m.Nombre).Select(Map));
    }

    // GET api/equipo-proyecto/{id}
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var m = await _uow.MiembrosEquipo.GetByIdAsync(id);
        if (m is null) return NotFound();
        return Ok(Map(m));
    }

    // POST api/equipo-proyecto
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] MiembroEquipoRequest req)
    {
        var m = new MiembroEquipoProyecto
        {
            ProyectoId         = req.ProyectoId,
            UsuarioId          = req.UsuarioId,
            Nombre             = req.Nombre,
            Rol                = req.Rol,
            Empresa            = req.Empresa,
            Email              = req.Email,
            Telefono           = req.Telefono,
            Responsabilidades  = req.Responsabilidades,
            Permisos           = req.Permisos,
            Activo             = true,
        };
        await _uow.MiembrosEquipo.AddAsync(m);
        await _uow.SaveChangesAsync();
        return Ok(Map(m));
    }

    // PUT api/equipo-proyecto/{id}
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] MiembroEquipoRequest req)
    {
        var m = await _uow.MiembrosEquipo.GetByIdAsync(id);
        if (m is null) return NotFound();

        m.Nombre            = req.Nombre;
        m.Rol               = req.Rol;
        m.Empresa           = req.Empresa;
        m.Email             = req.Email;
        m.Telefono          = req.Telefono;
        m.Responsabilidades = req.Responsabilidades;
        m.Permisos          = req.Permisos;

        _uow.MiembrosEquipo.UpdateAsync(m);
        await _uow.SaveChangesAsync();
        return Ok(Map(m));
    }

    // DELETE api/equipo-proyecto/{id} — soft delete (marca como inactivo)
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var m = await _uow.MiembrosEquipo.GetByIdAsync(id);
        if (m is null) return NotFound();

        m.Activo = false;
        _uow.MiembrosEquipo.UpdateAsync(m);
        await _uow.SaveChangesAsync();
        return NoContent();
    }

    private static object Map(MiembroEquipoProyecto m) => new
    {
        m.Id, m.ProyectoId, m.UsuarioId,
        m.Nombre, m.Rol, m.Empresa,
        m.Email, m.Telefono,
        m.Responsabilidades, m.Permisos,
        m.Activo, m.FechaAsignacion,
    };
}

public record MiembroEquipoRequest(
    int     ProyectoId,
    string  Nombre,
    string  Rol,
    int?    UsuarioId         = null,
    string? Empresa           = null,
    string? Email             = null,
    string? Telefono          = null,
    string? Responsabilidades = null,
    string? Permisos          = null);
