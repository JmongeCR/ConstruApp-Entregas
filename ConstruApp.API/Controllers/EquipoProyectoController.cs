using System.Security.Claims;
using ConstruApp.API.Services;
using ConstruApp.Core.Entities;
using ConstruApp.Core.Enums;
using ConstruApp.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ConstruApp.API.Controllers;

[ApiController]
[Authorize]
[Route("api/equipo-proyecto")]
public sealed class EquipoProyectoController(IUnitOfWork uow, AccesoProyectoService acceso) : ControllerBase
{
    private static readonly string[] Roles = ["Arquitecto", "Ingeniero", "Supervisor", "Maestro de Obra", "Electricista", "Fontanero", "Proveedor", "Otro"];
    private static readonly string[] Permisos = ["verAvances", "verPresupuesto", "chat", "verDocumentos"];

    [HttpGet("proyecto/{proyectoId:int}")]
    public async Task<IActionResult> Listar(int proyectoId)
    {
        var proyecto = await uow.Proyectos.GetByIdAsync(proyectoId);
        if (proyecto is null) return NotFound();
        if (!await PuedeVer(proyecto)) return Forbid();
        return Ok((await uow.MiembrosEquipo.FindAsync(m => m.ProyectoId == proyectoId)).Select(Mapear));
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> Obtener(int id)
    {
        var miembro = await uow.MiembrosEquipo.GetByIdAsync(id);
        if (miembro is null) return NotFound();
        var proyecto = await uow.Proyectos.GetByIdAsync(miembro.ProyectoId);
        return proyecto is not null && await PuedeVer(proyecto) ? Ok(Mapear(miembro)) : Forbid();
    }

    [HttpPost]
    [Authorize(Roles = "Constructor,Admin")]
    public async Task<IActionResult> Crear(EquipoProyectoRequest req) => await Guardar(null, req);

    [HttpPut("{id:int}")]
    [Authorize(Roles = "Constructor,Admin")]
    public async Task<IActionResult> Actualizar(int id, EquipoProyectoRequest req) => await Guardar(id, req);

    private async Task<IActionResult> Guardar(int? id, EquipoProyectoRequest req)
    {
        var miembro = id.HasValue ? await uow.MiembrosEquipo.GetByIdAsync(id.Value) : null;
        if (id.HasValue && miembro is null) return NotFound();
        var proyecto = await uow.Proyectos.GetByIdAsync(miembro?.ProyectoId ?? req.ProyectoId);
        if (proyecto is null) return NotFound();
        if (!User.IsInRole("Admin") && !await acceso.ConstructorAsignadoAsync(proyecto, User)) return Forbid();
        if (proyecto.Estado != EstadoProyecto.EnCurso) return Conflict(new { message = "La obra debe estar en curso." });
        if (string.IsNullOrWhiteSpace(req.Nombre) || req.Nombre.Trim().Length > 200 ||
            !Roles.Contains(req.Rol) || req.Empresa?.Length > 200 || req.Email?.Length > 200 ||
            req.Telefono?.Length > 30 || req.Responsabilidades?.Length > 2000 ||
            (req.Permisos?.Split(',', StringSplitOptions.RemoveEmptyEntries).Any(p => !Permisos.Contains(p)) ?? false))
            return BadRequest(new { message = "Revisá el nombre, el rol y los datos del miembro." });
        miembro ??= new MiembroEquipoProyecto { ProyectoId = proyecto.Id };
        miembro.Nombre = req.Nombre.Trim();
        miembro.Rol = req.Rol;
        miembro.Empresa = req.Empresa?.Trim();
        miembro.Email = req.Email?.Trim();
        miembro.Telefono = req.Telefono?.Trim();
        miembro.Responsabilidades = req.Responsabilidades?.Trim();
        miembro.Permisos = req.Permisos;
        if (!id.HasValue) await uow.MiembrosEquipo.AddAsync(miembro);
        await uow.SaveChangesAsync();
        return Ok(Mapear(miembro));
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Constructor,Admin")]
    public async Task<IActionResult> Eliminar(int id)
    {
        var miembro = await uow.MiembrosEquipo.GetByIdAsync(id);
        if (miembro is null) return NotFound();
        var proyecto = await uow.Proyectos.GetByIdAsync(miembro.ProyectoId);
        if (proyecto is null || (!User.IsInRole("Admin") && !await acceso.ConstructorAsignadoAsync(proyecto, User))) return Forbid();
        await uow.MiembrosEquipo.DeleteAsync(miembro);
        await uow.SaveChangesAsync();
        return NoContent();
    }

    private async Task<bool> PuedeVer(Proyecto proyecto) => User.IsInRole("Admin") ||
        proyecto.ClienteId.ToString() == User.FindFirstValue(ClaimTypes.NameIdentifier) ||
        await acceso.ConstructorAsignadoAsync(proyecto, User);
    private static object Mapear(MiembroEquipoProyecto m) => new
    { m.Id, m.ProyectoId, m.Nombre, m.Rol, m.Empresa, m.Email, m.Telefono, m.Responsabilidades, m.Permisos, m.Activo };
}

public sealed record EquipoProyectoRequest(int ProyectoId, string Nombre, string Rol, string? Empresa,
    string? Email, string? Telefono, string? Responsabilidades, string? Permisos);
