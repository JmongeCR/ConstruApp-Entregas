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

        var validacion = ValidarInformacionGeneral(req, out var tipo);
        if (validacion is not null) return validacion;

        var propiedad = await GetPropiedadDelCliente(req.PropiedadId, userId);
        if (propiedad is null)
            return BadRequest(new { message = "La propiedad seleccionada no existe o no pertenece al cliente." });

        var proyecto = new Proyecto
        {
            ClienteId        = userId,
            PropiedadId      = propiedad?.Id,
            Titulo           = req.Titulo.Trim(),
            Descripcion      = req.Descripcion.Trim(),
            TipoProyecto     = tipo,
            Estado           = EstadoProyecto.Borrador,
            Canton           = propiedad?.Canton ?? req.Canton,
            Provincia        = propiedad?.Provincia ?? req.Provincia,
            Distrito         = propiedad?.Distrito ?? req.Distrito,
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

        var validacion = ValidarInformacionGeneral(req, out var tipo);
        if (validacion is not null) return validacion;

        var propiedad = await GetPropiedadDelCliente(req.PropiedadId, userId);
        if (propiedad is null)
            return BadRequest(new { message = "La propiedad seleccionada no existe o no pertenece al cliente." });

        proyecto.Titulo        = req.Titulo.Trim();
        proyecto.Descripcion   = req.Descripcion.Trim();
        proyecto.TipoProyecto  = tipo;
        proyecto.PropiedadId   = propiedad?.Id;
        proyecto.Canton        = propiedad?.Canton ?? req.Canton;
        proyecto.Provincia     = propiedad?.Provincia ?? req.Provincia;
        proyecto.Distrito      = propiedad?.Distrito ?? req.Distrito;
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
        // Compatibilidad con clientes antiguos: publicar ahora significa enviar a cotización.
        return await EnviarACotizacion(id);
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
        p.PropiedadId,
        p.Titulo,
        p.Descripcion,
        TipoProyecto   = p.TipoProyecto.ToString(),
        Estado         = p.Estado.ToString(),
        p.Canton,
        p.Provincia,
        p.Distrito,
        p.PresupuestoMax,
        p.AreaM2,
        p.FechaPublicacion,
        p.FechaEnvioCotizacion,
        p.FechaInicio,
        p.FechaFin,
    };

    // PUT api/proyectos/{id}/enviar-cotizacion
    [HttpPut("{id:int}/enviar-cotizacion")]
    public async Task<IActionResult> EnviarACotizacion(int id)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var proyecto = await _uow.Proyectos.GetByIdAsync(id);
        if (proyecto is null) return NotFound();
        if (proyecto.ClienteId != userId) return Forbid();
        if (proyecto.Estado != EstadoProyecto.Borrador)
            return BadRequest(new { message = "Solo se pueden enviar a cotización proyectos en borrador." });

        var errores = new Dictionary<string, string>();
        if (string.IsNullOrWhiteSpace(proyecto.Titulo))
            errores["titulo"] = "El nombre del proyecto es obligatorio.";
        if (string.IsNullOrWhiteSpace(proyecto.Descripcion) || proyecto.Descripcion.Trim().Length < 20)
            errores["descripcion"] = "La descripción debe tener al menos 20 caracteres.";
        if (!Enum.IsDefined(proyecto.TipoProyecto))
            errores["tipoProyecto"] = "Seleccioná un tipo de trabajo válido.";
        if (!proyecto.PropiedadId.HasValue)
            errores["propiedadId"] = "Seleccioná la propiedad donde se realizará el proyecto.";
        else
        {
            var propiedad = await _uow.Propiedades.GetByIdAsync(proyecto.PropiedadId.Value);
            if (propiedad is null || propiedad.ClienteId != userId)
                errores["propiedadId"] = "La propiedad del proyecto ya no está disponible.";
        }
        if (proyecto.AreaM2.HasValue && proyecto.AreaM2.Value <= 0)
            errores["areaM2"] = "El área debe ser mayor que cero.";
        if (proyecto.PresupuestoMax.HasValue && proyecto.PresupuestoMax.Value <= 0)
            errores["presupuestoMax"] = "El presupuesto debe ser mayor que cero.";
        if (proyecto.FechaInicio.HasValue && proyecto.FechaFin.HasValue && proyecto.FechaFin < proyecto.FechaInicio)
            errores["fechaFin"] = "La fecha de finalización no puede ser anterior a la fecha de inicio.";

        if (errores.Count > 0)
            return BadRequest(new { message = "Completá o corregí la información antes de enviar el proyecto.", errors = errores });

        proyecto.Estado = EstadoProyecto.EnPropuestas;
        proyecto.FechaEnvioCotizacion = DateTime.UtcNow;
        proyecto.FechaPublicacion = proyecto.FechaEnvioCotizacion.Value;
        await _uow.Proyectos.UpdateAsync(proyecto);
        await _uow.SaveChangesAsync();
        await _auditoria.RegistrarAsync(userId, User.FindFirstValue("nombre") ?? "",
            "Enviar a cotización", "Proyectos", id.ToString(),
            "Proyecto enviado de borrador a proceso de cotización.");
        return Ok(MapDto(proyecto));
    }

    private async Task<Propiedad?> GetPropiedadDelCliente(int? propiedadId, int clienteId)
    {
        if (!propiedadId.HasValue) return null;
        var propiedad = await _uow.Propiedades.GetByIdAsync(propiedadId.Value);
        return propiedad?.ClienteId == clienteId ? propiedad : null;
    }

    private BadRequestObjectResult? ValidarInformacionGeneral(
        ProyectoRequest req,
        out TipoProyecto tipo)
    {
        tipo = default;
        var errores = new Dictionary<string, string>();

        if (string.IsNullOrWhiteSpace(req.Titulo))
            errores["titulo"] = "El nombre del proyecto es obligatorio.";

        if (string.IsNullOrWhiteSpace(req.TipoProyecto) ||
            !Enum.TryParse(req.TipoProyecto, ignoreCase: true, out tipo) ||
            !Enum.IsDefined(tipo))
            errores["tipoProyecto"] = "Seleccioná un tipo de trabajo válido.";

        if (string.IsNullOrWhiteSpace(req.Descripcion) || req.Descripcion.Trim().Length < 20)
            errores["descripcion"] = "La descripción debe tener al menos 20 caracteres.";

        if (!req.PropiedadId.HasValue)
            errores["propiedadId"] = "Seleccioná la propiedad donde se realizará el proyecto.";

        if (req.AreaM2.HasValue && req.AreaM2.Value <= 0)
            errores["areaM2"] = "El área debe ser mayor que cero.";

        if (req.PresupuestoMax.HasValue && req.PresupuestoMax.Value <= 0)
            errores["presupuestoMax"] = "El presupuesto debe ser mayor que cero.";

        return errores.Count == 0
            ? null
            : BadRequest(new { message = "Completá la información obligatoria.", errors = errores });
    }
}

public record ProyectoRequest(
    string    Titulo,
    string    Descripcion,
    string    TipoProyecto,
    string?   Canton,
    string?   Provincia,
    string?   Distrito,
    decimal?  PresupuestoMax,
    decimal?  AreaM2,
    DateTime? FechaInicio,
    DateTime? FechaFin,
    int?      PropiedadId
);

public record CambiarEstadoRequest(string Estado);
