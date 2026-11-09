using System.Security.Claims;
using System.Text.Json;
using ConstruApp.Core.Entities;
using ConstruApp.Core.Interfaces;
using ConstruApp.Core.Enums;
using ConstruApp.Infrastructure.Data;
using System.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ConstruApp.API.Controllers;

[ApiController]
[Route("api/cotizacion-ia")]
[Authorize(Roles = "Cliente,Constructor,Admin")]
public sealed class CotizacionIAController : ControllerBase
{
    private readonly IUnitOfWork _uow;

    public CotizacionIAController(IUnitOfWork uow) => _uow = uow;

    [HttpGet("proyecto/{proyectoId:int}")]
    public async Task<IActionResult> PorProyecto(int proyectoId)
    {
        var rows = await QueryVisible().Where(c => c.ProyectoId == proyectoId)
            .OrderByDescending(c => c.FechaGeneracion).ThenByDescending(c => c.Id).ToListAsync();
        return Ok(rows.Select(Map));
    }

    [HttpPut("{id:int}/estado")]
    public async Task<IActionResult> CambiarEstado(int id, EstadoCotizacionRequest req)
    {
        if (req.Estado is not ("Activa" or "Archivada")) return BadRequest();
        var cotizacion = await QueryVisible().FirstOrDefaultAsync(c => c.Id == id);
        if (cotizacion is null) return NotFound();
        if (cotizacion.PropuestaId.HasValue) return Conflict(new { message = "La cotización ya fue convertida en propuesta." });
        cotizacion.Estado = req.Estado;
        await _uow.CotizacionesIA.UpdateAsync(cotizacion);
        await _uow.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("{id:int}/convertir-propuesta")]
    [Authorize(Roles = "Constructor")]
    public async Task<IActionResult> Convertir(int id, ConvertirCotizacionRequest req, [FromServices] AppDbContext db, CancellationToken ct)
    {
        var usuarioId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        await using var tx = db.Database.IsRelational()
            ? await db.Database.BeginTransactionAsync(IsolationLevel.Serializable, ct) : null;
        var cotizacion = await db.CotizacionesIA.SingleOrDefaultAsync(c => c.Id == id && c.GeneradoPorId == usuarioId, ct);
        if (cotizacion is null) return NotFound();
        if (cotizacion.PropuestaId.HasValue) return Ok(new { propuestaId = cotizacion.PropuestaId.Value });
        if (req.MontoTotal is <= 0 or > 9999999999999999.99m ||
            req.MontoTotal != decimal.Round(req.MontoTotal, 2) || req.PlazoEstimadoDias <= 0 ||
            string.IsNullOrWhiteSpace(req.Descripcion) || req.Descripcion.Trim().Length > 3000)
            return BadRequest(new { message = "Confirmá monto, plazo y descripción de la propuesta." });
        var proyecto = await db.Proyectos.SingleAsync(p => p.Id == cotizacion.ProyectoId, ct);
        if (proyecto.Estado is not (EstadoProyecto.Publicado or EstadoProyecto.EnPropuestas) || cotizacion.Estado != "Activa")
            return Conflict(new { message = "El proyecto o la cotización ya no admite una propuesta." });
        var perfil = await db.PerfilesConstructor.SingleOrDefaultAsync(c => c.UsuarioId == usuarioId, ct);
        if (perfil is null) return Forbid();
        cotizacion.Propuesta = new Propuesta { ProyectoId = proyecto.Id, ConstructorId = perfil.Id,
            MontoTotal = req.MontoTotal, PlazoEstimadoDias = req.PlazoEstimadoDias,
            Descripcion = req.Descripcion.Trim(), Estado = EstadoPropuesta.Enviada };
        cotizacion.Estado = "ConvertidaPropuesta";
        try { await db.SaveChangesAsync(ct); }
        catch (DbUpdateConcurrencyException) { return Conflict(new { message = "La cotización cambió. Actualizá la pantalla." }); }
        if (tx is not null) await tx.CommitAsync(ct);
        return Ok(new { propuestaId = cotizacion.PropuestaId });
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int size = 20,
        [FromQuery] string? plan = null,
        [FromQuery] string? estado = null,
        [FromQuery] DateTime? fechaDesde = null,
        [FromQuery] DateTime? fechaHasta = null,
        [FromQuery] string? orden = "reciente",
        [FromQuery] string? busqueda = null)
    {
        if (page < 1 || size is < 1 or > 100 || (long)(page - 1) * size > int.MaxValue)
            return BadRequest(new { message = "La paginación solicitada no es válida." });
        if (fechaDesde.HasValue && fechaHasta.HasValue && fechaDesde.Value.Date > fechaHasta.Value.Date)
            return BadRequest(new { message = "La fecha inicial debe ser anterior a la fecha final." });

        var query = QueryVisible();
        if (!new[] { "reciente", "antiguo", "menorprecio", "mayorprecio" }.Contains((orden ?? "reciente").ToLowerInvariant()))
            return BadRequest(new { message = "El orden solicitado no es válido." });
        if (!string.IsNullOrWhiteSpace(busqueda))
        {
            var texto = busqueda.Trim().ToLower();
            query = query.Where(c => c.Proyecto.Titulo.ToLower().Contains(texto) ||
                c.Proyecto.Cliente.Nombre.ToLower().Contains(texto) || (c.NombrePlan ?? "").ToLower().Contains(texto));
        }
        if (!string.IsNullOrWhiteSpace(plan)) query = query.Where(c => c.Plan == plan);
        if (!string.IsNullOrWhiteSpace(estado)) query = query.Where(c => c.Estado == estado);
        if (fechaDesde.HasValue) query = query.Where(c => c.FechaGeneracion >= fechaDesde.Value.Date);
        if (fechaHasta.HasValue) query = query.Where(c => c.FechaGeneracion.Date <= fechaHasta.Value.Date);

        query = (orden ?? "reciente").ToLowerInvariant() switch
        {
            "menorprecio" => query.OrderBy(c => c.RangoMinimo).ThenBy(c => c.Id),
            "mayorprecio" => query.OrderByDescending(c => c.RangoMaximo).ThenBy(c => c.Id),
            "antiguo" => query.OrderBy(c => c.FechaGeneracion).ThenBy(c => c.Id),
            _ => query.OrderByDescending(c => c.FechaGeneracion).ThenBy(c => c.Id)
        };

        var total = await query.CountAsync();
        var rows = await query.Skip((page - 1) * size).Take(size).ToListAsync();
        return Ok(new
        {
            items = rows.Select(Map),
            total,
            page,
            size
        });
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var cotizacion = await QueryVisible().FirstOrDefaultAsync(c => c.Id == id);
        if (cotizacion is null) return NotFound(new { message = "No encontramos la cotización." });
        return Ok(Map(cotizacion));
    }

    private IQueryable<CotizacionIA> QueryVisible()
    {
        var query = _uow.CotizacionesIA.QueryWithDetails();

        if (!User.IsInRole("Admin"))
        {
            var claim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(claim, out var userId)) return query.Where(_ => false);
            query = User.IsInRole("Constructor")
                ? query.Where(c => c.GeneradoPorId == userId)
                : query.Where(c => c.Proyecto.ClienteId == userId);
        }
        return query;
    }

    private static object Map(CotizacionIA c)
    {
        var recomendaciones = LeerLista(c.RecomendacionesJson);
        var manoObra = LeerLista(c.ManoDeObraJson);
        return new
        {
            c.Id,
            c.ProyectoId,
            proyecto = new { c.Proyecto.Titulo, tipoProyecto = c.Proyecto.TipoProyecto.ToString() },
            cliente = new { nombre = c.Proyecto.Cliente.Nombre, email = c.Proyecto.Cliente.Email },
            c.Plan,
            c.NombrePlan,
            c.Estado,
            c.PropuestaId,
            c.RangoMinimo,
            c.RangoMaximo,
            fechaGeneracion = c.FechaGeneracion,
            c.Version,
            tipoProyectoIA = c.TipoProyectoIA,
            duracionEstimada = c.DuracionEstimada,
            resumenIA = c.ResumenIA,
            analisisIA = new
            {
                tipoProyecto = c.TipoProyectoIA ?? c.Proyecto.TipoProyecto.ToString(),
                duracionEstimada = c.DuracionEstimada,
                recomendaciones,
                manoDeObra = manoObra
            },
            lineas = c.Lineas.Select(l => new
            {
                l.Id, l.Descripcion, categoria = l.Categoria.ToString(), l.Cantidad, l.Unidad,
                l.PrecioUnitario, l.PrecioTotal, l.EsManoDeObra
            })
        };
    }

    private static IReadOnlyList<string> LeerLista(string? json)
    {
        if (string.IsNullOrWhiteSpace(json)) return [];
        try { return JsonSerializer.Deserialize<List<string>>(json) ?? []; }
        catch (JsonException) { return []; }
    }
}

public sealed record EstadoCotizacionRequest(string Estado);
public sealed record ConvertirCotizacionRequest(decimal MontoTotal, int PlazoEstimadoDias, string Descripcion);
