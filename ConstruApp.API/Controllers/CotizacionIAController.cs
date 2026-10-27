using System.Security.Claims;
using System.Text.Json;
using ConstruApp.Core.Entities;
using ConstruApp.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ConstruApp.API.Controllers;

[ApiController]
[Route("api/cotizacion-ia")]
[Authorize(Roles = "Cliente,Admin")]
public sealed class CotizacionIAController : ControllerBase
{
    private readonly IUnitOfWork _uow;

    public CotizacionIAController(IUnitOfWork uow) => _uow = uow;

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
            query = query.Where(c => c.Proyecto.ClienteId == userId);
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
