using System.Security.Claims;
using ConstruApp.API.Services;
using ConstruApp.Core.Entities;
using ConstruApp.Core.Enums;
using ConstruApp.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ConstruApp.API.Controllers;

[ApiController]
[Route("api/proyectos")]
[Authorize]
public class ProyectosController : ControllerBase
{
    private readonly IUnitOfWork       _uow;
    private readonly IAuditoriaService _auditoria;

    // Transiciones válidas: (estadoActual, rol) → [estadosPermitidos]
    private static readonly Dictionary<(EstadoProyecto, Rol), EstadoProyecto[]> Transiciones = new()
    {
        { (EstadoProyecto.Publicado,    Rol.Cliente),      [EstadoProyecto.Cancelado] },
        { (EstadoProyecto.EnPropuestas, Rol.Cliente),      [EstadoProyecto.EnCurso, EstadoProyecto.Cancelado] },
        { (EstadoProyecto.EnCurso,      Rol.Constructor),  [EstadoProyecto.Completado] },
        { (EstadoProyecto.EnCurso,      Rol.Admin),        [EstadoProyecto.Completado, EstadoProyecto.Cancelado] },
        { (EstadoProyecto.Publicado,    Rol.Admin),        [EstadoProyecto.Cancelado] },
    };

    public ProyectosController(IUnitOfWork uow, IAuditoriaService auditoria)
    {
        _uow       = uow;
        _auditoria = auditoria;
    }

    // GET api/proyectos  — proyectos del cliente autenticado
    [HttpGet]
    public async Task<IActionResult> GetMios()
    {
        var userId   = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var proyectos = await _uow.Proyectos.FindAsync(p => p.ClienteId == userId);
        return Ok(proyectos.OrderByDescending(p => p.FechaPublicacion).Select(MapDto));
    }

    // GET api/proyectos/publicados
    [HttpGet("publicados")]
    [AllowAnonymous]
    public async Task<IActionResult> GetPublicados([FromQuery] string? tipo, [FromQuery] string? provincia)
    {
        var proyectos = await _uow.Proyectos.FindAsync(p =>
            p.Estado == EstadoProyecto.Publicado || p.Estado == EstadoProyecto.EnPropuestas);

        if (!string.IsNullOrEmpty(tipo) && Enum.TryParse<TipoProyecto>(tipo, out var t))
            proyectos = proyectos.Where(p => p.TipoProyecto == t);

        if (!string.IsNullOrEmpty(provincia))
            proyectos = proyectos.Where(p => (p.Provincia ?? "").Contains(provincia));

        return Ok(proyectos.OrderByDescending(p => p.FechaPublicacion).Select(MapDto));
    }

    // GET api/proyectos/{id}
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var userId   = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var proyecto = await _uow.Proyectos.GetByIdAsync(id);
        if (proyecto is null) return NotFound();
        if (proyecto.ClienteId != userId &&
            proyecto.Estado != EstadoProyecto.Publicado &&
            proyecto.Estado != EstadoProyecto.EnPropuestas)
            return Forbid();
        return Ok(MapDto(proyecto));
    }

    // POST api/proyectos
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] ProyectoRequest req)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        if (!Enum.TryParse<TipoProyecto>(req.TipoProyecto, out var tipo))
            return BadRequest(new { message = "Tipo de proyecto inválido." });

        var proyecto = new Proyecto
        {
            ClienteId        = userId,
            Titulo           = req.Titulo,
            Descripcion      = req.Descripcion,
            TipoProyecto     = tipo,
            Estado           = EstadoProyecto.Borrador,
            Canton           = req.Canton,
            Provincia        = req.Provincia,
            PresupuestoMax   = req.PresupuestoMax,
            AreaM2           = req.AreaM2,
            FechaPublicacion = DateTime.UtcNow,
            FechaInicio      = req.FechaInicio,
            FechaFin         = req.FechaFin,
        };

        await _uow.Proyectos.AddAsync(proyecto);
        await _uow.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = proyecto.Id }, MapDto(proyecto));
    }

    // PUT api/proyectos/{id}
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] ProyectoRequest req)
    {
        var userId   = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var proyecto = await _uow.Proyectos.GetByIdAsync(id);
        if (proyecto is null)  return NotFound();
        if (proyecto.ClienteId != userId) return Forbid();

        if (!Enum.TryParse<TipoProyecto>(req.TipoProyecto, out var tipo))
            return BadRequest(new { message = "Tipo de proyecto inválido." });

        proyecto.Titulo        = req.Titulo;
        proyecto.Descripcion   = req.Descripcion;
        proyecto.TipoProyecto  = tipo;
        proyecto.Canton        = req.Canton;
        proyecto.Provincia     = req.Provincia;
        proyecto.PresupuestoMax = req.PresupuestoMax;
        proyecto.AreaM2        = req.AreaM2;
        proyecto.FechaInicio   = req.FechaInicio;
        proyecto.FechaFin      = req.FechaFin;

        await _uow.Proyectos.UpdateAsync(proyecto);
        await _uow.SaveChangesAsync();
        return Ok(MapDto(proyecto));
    }

    // PUT api/proyectos/{id}/publicar
    [HttpPut("{id:int}/publicar")]
    public async Task<IActionResult> Publicar(int id)
    {
        var userId   = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var proyecto = await _uow.Proyectos.GetByIdAsync(id);
        if (proyecto is null)  return NotFound();
        if (proyecto.ClienteId != userId) return Forbid();

        proyecto.Estado           = EstadoProyecto.Publicado;
        proyecto.FechaPublicacion = DateTime.UtcNow;

        await _uow.Proyectos.UpdateAsync(proyecto);
        await _uow.SaveChangesAsync();
        return Ok(MapDto(proyecto));
    }

    // PUT api/proyectos/{id}/estado
    [HttpPut("{id:int}/estado")]
    public async Task<IActionResult> CambiarEstado(int id, [FromBody] CambiarEstadoRequest req)
    {
        var userId   = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var rolStr   = User.FindFirstValue(ClaimTypes.Role) ?? "";
        var proyecto = await _uow.Proyectos.GetByIdAsync(id);
        if (proyecto is null) return NotFound();

        if (!Enum.TryParse<EstadoProyecto>(req.Estado, out var nuevoEstado))
            return BadRequest(new { message = "Estado inválido." });

        if (!Enum.TryParse<Rol>(rolStr, out var rol))
            return Forbid();

        // Solo el dueño del proyecto o un Admin puede operar
        var esAdmin = rol == Rol.Admin;
        var esConstructor = rol == Rol.Constructor;
        if (!esAdmin && proyecto.ClienteId != userId && !esConstructor)
            return Forbid();

        // Validar transición permitida
        var clave = (proyecto.Estado, rol);
        if (!Transiciones.TryGetValue(clave, out var permitidos) || !permitidos.Contains(nuevoEstado))
            return BadRequest(new
            {
                message = $"Transición no permitida: {proyecto.Estado} → {nuevoEstado} para rol {rol}."
            });

        var estadoAnterior = proyecto.Estado.ToString();
        proyecto.Estado = nuevoEstado;
        await _uow.Proyectos.UpdateAsync(proyecto);
        await _uow.SaveChangesAsync();

        await _auditoria.RegistrarAsync(userId, User.FindFirstValue("nombre") ?? rolStr,
            "CambiarEstadoProyecto", "Proyectos",
            proyecto.Id.ToString(),
            $"{estadoAnterior} → {nuevoEstado}",
            HttpContext.Connection.RemoteIpAddress?.ToString());

        return Ok(MapDto(proyecto));
    }

    // DELETE api/proyectos/{id}
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var userId   = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var proyecto = await _uow.Proyectos.GetByIdAsync(id);
        if (proyecto is null)  return NotFound();
        if (proyecto.ClienteId != userId) return Forbid();

        await _uow.Proyectos.DeleteAsync(proyecto);
        await _uow.SaveChangesAsync();
        return NoContent();
    }

    // ── Helpers ──────────────────────────────────────────────────────────────────
    private static object MapDto(Proyecto p) => new
    {
        p.Id,
        p.ClienteId,
        p.Titulo,
        p.Descripcion,
        TipoProyecto   = p.TipoProyecto.ToString(),
        Estado         = p.Estado.ToString(),
        p.Canton,
        p.Provincia,
        p.PresupuestoMax,
        p.AreaM2,
        p.FechaPublicacion,
        p.FechaInicio,
        p.FechaFin,
    };
}

public record ProyectoRequest(
    string    Titulo,
    string    Descripcion,
    string    TipoProyecto,
    string?   Canton,
    string?   Provincia,
    decimal?  PresupuestoMax,
    decimal?  AreaM2,
    DateTime? FechaInicio,
    DateTime? FechaFin
);

public record CambiarEstadoRequest(string Estado);
