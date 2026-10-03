using System.Security.Claims;
using ConstruApp.Core.Entities;
using ConstruApp.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ConstruApp.API.Controllers;

[ApiController]
[Route("api/trabajadores")]
[Authorize]
public class TrabajadoresController : ControllerBase
{
    private readonly IUnitOfWork _uow;

    public TrabajadoresController(IUnitOfWork uow) => _uow = uow;

    // GET api/trabajadores
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var perfil = (await _uow.PerfilesConstructor.FindAsync(p => p.UsuarioId == userId)).FirstOrDefault();
        if (perfil is null) return Ok(Array.Empty<object>());

        var empleados = await _uow.Empleados.FindAsync(e => e.ConstructorId == perfil.Id);
        return Ok(empleados.Select(MapDto));
    }

    // GET api/trabajadores/{id}
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var perfil = (await _uow.PerfilesConstructor.FindAsync(p => p.UsuarioId == userId)).FirstOrDefault();
        if (perfil is null) return NotFound();

        var empleado = await _uow.Empleados.GetByIdAsync(id);
        if (empleado is null || empleado.ConstructorId != perfil.Id) return NotFound();

        return Ok(MapDto(empleado));
    }

    // POST api/trabajadores
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] TrabajadorRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Nombre))
            return BadRequest(new { message = "El nombre del colaborador es requerido." });

        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var perfil = (await _uow.PerfilesConstructor.FindAsync(p => p.UsuarioId == userId)).FirstOrDefault();
        if (perfil is null)
            return BadRequest(new { message = "Necesitás registrar tu empresa antes de agregar personal." });

        // Validar cédula duplicada dentro de la misma empresa
        if (!string.IsNullOrWhiteSpace(req.Cedula))
        {
            var cedDup = await _uow.Empleados.ExistsAsync(
                e => e.ConstructorId == perfil.Id && e.Cedula == req.Cedula.Trim());
            if (cedDup)
                return Conflict(new { message = "Ya existe un colaborador con esa cédula en tu empresa." });
        }

        var empleado = new Empleado
        {
            ConstructorId = perfil.Id,
            Nombre        = req.Nombre.Trim(),
            Puesto        = req.Puesto,
            Rol           = req.Especialidad,
            Cedula        = req.Cedula?.Trim(),
            Email         = req.Email,
            Telefono      = req.Telefono,
            Activo        = !string.Equals(req.Estado, "Inactivo", StringComparison.OrdinalIgnoreCase),
        };

        await _uow.Empleados.AddAsync(empleado);
        await _uow.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = empleado.Id }, MapDto(empleado));
    }

    // PUT api/trabajadores/{id}
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] TrabajadorRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Nombre))
            return BadRequest(new { message = "El nombre del colaborador es requerido." });

        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var perfil = (await _uow.PerfilesConstructor.FindAsync(p => p.UsuarioId == userId)).FirstOrDefault();
        if (perfil is null) return Forbid();

        var empleado = await _uow.Empleados.GetByIdAsync(id);
        if (empleado is null || empleado.ConstructorId != perfil.Id) return NotFound();

        // Validar cédula duplicada (excluyendo el propio registro)
        if (!string.IsNullOrWhiteSpace(req.Cedula) && req.Cedula.Trim() != empleado.Cedula)
        {
            var cedDup = await _uow.Empleados.ExistsAsync(
                e => e.ConstructorId == perfil.Id && e.Cedula == req.Cedula.Trim() && e.Id != id);
            if (cedDup)
                return Conflict(new { message = "Ya existe un colaborador con esa cédula en tu empresa." });
        }

        empleado.Nombre   = req.Nombre.Trim();
        empleado.Puesto   = req.Puesto;
        empleado.Rol      = req.Especialidad;
        empleado.Cedula   = req.Cedula?.Trim();
        empleado.Email    = req.Email;
        empleado.Telefono = req.Telefono;
        empleado.Activo   = !string.Equals(req.Estado, "Inactivo", StringComparison.OrdinalIgnoreCase);

        await _uow.Empleados.UpdateAsync(empleado);
        await _uow.SaveChangesAsync();
        return Ok(MapDto(empleado));
    }

    // DELETE api/trabajadores/{id}
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var perfil = (await _uow.PerfilesConstructor.FindAsync(p => p.UsuarioId == userId)).FirstOrDefault();
        if (perfil is null) return Forbid();

        var empleado = await _uow.Empleados.GetByIdAsync(id);
        if (empleado is null || empleado.ConstructorId != perfil.Id) return NotFound();

        await _uow.Empleados.DeleteAsync(empleado);
        await _uow.SaveChangesAsync();
        return NoContent();
    }

    // ── Helpers ──────────────────────────────────────────────────────────────────
    private static object MapDto(Empleado e) => new
    {
        e.Id,
        e.Nombre,
        Puesto       = e.Puesto       ?? "",
        Especialidad = e.Rol          ?? "",
        Cedula       = e.Cedula       ?? "",
        Email        = e.Email        ?? "",
        Telefono     = e.Telefono     ?? "",
        Estado       = e.Activo ? "Activo" : "Inactivo",
    };
}

public record TrabajadorRequest(
    string  Nombre,
    string? Puesto,
    string? Especialidad,
    string? Cedula,
    string? Email,
    string? Telefono,
    string  Estado
);
