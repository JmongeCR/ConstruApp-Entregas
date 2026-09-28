using System.Security.Claims;
using ConstruApp.Core.Entities;
using ConstruApp.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ConstruApp.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class EmpleadosController : ControllerBase
{
    private readonly IUnitOfWork _uow;
    public EmpleadosController(IUnitOfWork uow) => _uow = uow;
    private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    // GET api/empleados/mios  → empleados del constructor autenticado
    [HttpGet("mios")]
    public async Task<IActionResult> GetMios()
    {
        var perfil = await GetMiPerfilAsync();
        if (perfil is null) return BadRequest(new { message = "No tenés perfil de constructor." });

        var empleados = await _uow.Empleados.FindAsync(e => e.ConstructorId == perfil.Id && e.Activo);
        return Ok(empleados.Select(MapEmp));
    }

    // GET api/empleados/proyecto/{proyectoId}  → asignados a un proyecto
    [HttpGet("proyecto/{proyectoId}")]
    public async Task<IActionResult> GetByProyecto(int proyectoId)
    {
        var asignaciones = await _uow.AsignacionesEmpleado.FindAsync(a => a.ProyectoId == proyectoId);
        if (!asignaciones.Any()) return Ok(new List<object>());

        var ids = asignaciones.Select(a => a.EmpleadoId).ToList();
        var empleados = await _uow.Empleados.FindAsync(e => ids.Contains(e.Id));
        var dict = empleados.ToDictionary(e => e.Id);

        var result = asignaciones.Select(a =>
        {
            var e = dict.GetValueOrDefault(a.EmpleadoId);
            return new
            {
                AsignacionId = a.Id,
                a.EmpleadoId,
                a.ProyectoId,
                a.Notas,
                a.FechaAsignacion,
                Nombre = e?.Nombre,
                Rol    = e?.Rol,
                Telefono = e?.Telefono,
            };
        });

        return Ok(result);
    }

    // POST api/empleados  → crear nuevo empleado
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] EmpleadoRequest req)
    {
        var perfil = await GetMiPerfilAsync();
        if (perfil is null) return BadRequest(new { message = "No tenés perfil de constructor." });

        var emp = new Empleado
        {
            ConstructorId = perfil.Id,
            Nombre        = req.Nombre,
            Rol           = req.Rol,
            Telefono      = req.Telefono,
        };
        await _uow.Empleados.AddAsync(emp);
        await _uow.SaveChangesAsync();
        return Ok(MapEmp(emp));
    }

    // PUT api/empleados/{id}
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] EmpleadoRequest req)
    {
        var emp = await _uow.Empleados.GetByIdAsync(id);
        if (emp is null) return NotFound();

        var perfil = await GetMiPerfilAsync();
        if (perfil?.Id != emp.ConstructorId) return Forbid();

        emp.Nombre   = req.Nombre;
        emp.Rol      = req.Rol;
        emp.Telefono = req.Telefono;
        await _uow.Empleados.UpdateAsync(emp);
        await _uow.SaveChangesAsync();
        return Ok(MapEmp(emp));
    }

    // DELETE api/empleados/{id}  → desactivar (soft delete)
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var emp = await _uow.Empleados.GetByIdAsync(id);
        if (emp is null) return NotFound();

        var perfil = await GetMiPerfilAsync();
        if (perfil?.Id != emp.ConstructorId) return Forbid();

        emp.Activo = false;
        await _uow.Empleados.UpdateAsync(emp);
        await _uow.SaveChangesAsync();
        return NoContent();
    }

    // POST api/empleados/asignar  → asignar empleado a proyecto
    [HttpPost("asignar")]
    public async Task<IActionResult> Asignar([FromBody] AsignarRequest req)
    {
        var perfil = await GetMiPerfilAsync();
        if (perfil is null) return BadRequest(new { message = "No tenés perfil de constructor." });

        // Verificar que el empleado pertenece a este constructor
        var emp = await _uow.Empleados.GetByIdAsync(req.EmpleadoId);
        if (emp is null || emp.ConstructorId != perfil.Id) return Forbid();

        // Evitar duplicado
        var existe = await _uow.AsignacionesEmpleado.FindAsync(
            a => a.EmpleadoId == req.EmpleadoId && a.ProyectoId == req.ProyectoId);
        if (existe.Any())
            return Conflict(new { message = "Este empleado ya está asignado al proyecto." });

        var asig = new AsignacionEmpleado
        {
            EmpleadoId  = req.EmpleadoId,
            ProyectoId  = req.ProyectoId,
            Notas       = req.Notas,
        };
        await _uow.AsignacionesEmpleado.AddAsync(asig);
        await _uow.SaveChangesAsync();
        return Ok(new { asig.Id, asig.EmpleadoId, asig.ProyectoId, asig.Notas, asig.FechaAsignacion,
            emp.Nombre, emp.Rol, emp.Telefono });
    }

    // DELETE api/empleados/asignar/{asignacionId}  → quitar del proyecto
    [HttpDelete("asignar/{asignacionId}")]
    public async Task<IActionResult> DesasignarEmpleado(int asignacionId)
    {
        var asig = await _uow.AsignacionesEmpleado.GetByIdAsync(asignacionId);
        if (asig is null) return NotFound();

        // Verificar que el constructor es dueño
        var emp = await _uow.Empleados.GetByIdAsync(asig.EmpleadoId);
        var perfil = await GetMiPerfilAsync();
        if (emp is null || perfil?.Id != emp.ConstructorId) return Forbid();

        await _uow.AsignacionesEmpleado.DeleteAsync(asig);
        await _uow.SaveChangesAsync();
        return NoContent();
    }

    // ── Helpers ───────────────────────────────────────────────────────────────
    private async Task<PerfilConstructor?> GetMiPerfilAsync()
    {
        var perfiles = await _uow.PerfilesConstructor.FindAsync(p => p.UsuarioId == UserId);
        return perfiles.FirstOrDefault();
    }

    private static object MapEmp(Empleado e) => new
    {
        e.Id, e.ConstructorId, e.Nombre, e.Rol, e.Telefono, e.Activo,
    };
}

public record EmpleadoRequest(string Nombre, string? Rol, string? Telefono);
public record AsignarRequest(int EmpleadoId, int ProyectoId, string? Notas);
