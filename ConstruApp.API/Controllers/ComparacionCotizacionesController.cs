using System.Security.Claims;
using ConstruApp.Core.Enums;
using ConstruApp.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ConstruApp.API.Controllers;

[ApiController]
[Route("api/proyectos/{proyectoId:int}/comparar-cotizaciones")]
[Authorize(Roles = "Cliente,Admin")]
public sealed class ComparacionCotizacionesController(IUnitOfWork uow) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Comparar(int proyectoId, [FromQuery] decimal? montoMinimo = null,
        [FromQuery] decimal? montoMaximo = null, [FromQuery] int? plazoMaximoDias = null,
        [FromQuery] string? estado = null, [FromQuery] string orden = "menorPrecio",
        [FromQuery] int page = 1, [FromQuery] int size = 20)
    {
        if (!int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var userId)) return Forbid();
        var proyecto = await uow.Proyectos.GetByIdAsync(proyectoId);
        if (proyecto is null) return NotFound(new { message = "No encontramos el proyecto." });
        if (!User.IsInRole("Admin") && proyecto.ClienteId != userId) return Forbid();

        if (page < 1 || size is < 1 or > 50 || (long)(page - 1) * size > int.MaxValue ||
            montoMinimo is < 0 || montoMaximo is < 0 || montoMinimo > montoMaximo || plazoMaximoDias is <= 0)
            return BadRequest(new { message = "Revisá el rango de montos, el plazo y la paginación." });
        if (!new[] { "menorPrecio", "mayorPrecio", "menorPlazo", "reciente" }.Contains(orden))
            return BadRequest(new { message = "El orden solicitado no es válido." });
        EstadoPropuesta? estadoFiltrado = null;
        if (!string.IsNullOrWhiteSpace(estado))
        {
            if (!Enum.TryParse<EstadoPropuesta>(estado, true, out var valor) || !Enum.IsDefined(valor))
                return BadRequest(new { message = "El estado solicitado no es válido." });
            estadoFiltrado = valor;
        }

        var todas = (await uow.Propuestas.FindAsync(p => p.ProyectoId == proyectoId)).ToList();
        var filtradas = todas.Where(p => (!montoMinimo.HasValue || p.MontoTotal >= montoMinimo) &&
            (!montoMaximo.HasValue || p.MontoTotal <= montoMaximo) &&
            (!plazoMaximoDias.HasValue || p.PlazoEstimadoDias <= plazoMaximoDias) &&
            (!estadoFiltrado.HasValue || p.Estado == estadoFiltrado));
        var ordenadas = orden switch
        {
            "mayorPrecio" => filtradas.OrderByDescending(p => p.MontoTotal).ThenBy(p => p.Id),
            "menorPlazo" => filtradas.OrderBy(p => p.PlazoEstimadoDias).ThenBy(p => p.Id),
            "reciente" => filtradas.OrderByDescending(p => p.FechaEnvio).ThenBy(p => p.Id),
            _ => filtradas.OrderBy(p => p.MontoTotal).ThenBy(p => p.Id),
        };
        var total = ordenadas.Count();
        var pagina = ordenadas.Skip((page - 1) * size).Take(size).ToList();
        var constructorIds = pagina.Select(p => p.ConstructorId).Distinct().ToArray();
        var constructores = (await uow.PerfilesConstructor.FindAsync(c => constructorIds.Contains(c.Id))).ToDictionary(c => c.Id);

        return Ok(new
        {
            proyectoId, titulo = proyecto.Titulo, moneda = "CRC", totalProyecto = todas.Count,
            total, page, size, puedeComparar = total >= 2,
            mensaje = todas.Count == 0 ? "Aún no hay cotizaciones para este proyecto."
                : todas.Count == 1 ? "Solo hay una cotización para este proyecto. Podrás comparar cuando recibas otra."
                : total == 0 ? "No hay cotizaciones que coincidan con estos filtros."
                : total == 1 ? "Solo una cotización coincide con los filtros. Ampliá los criterios para comparar."
                : $"{total} cotizaciones coinciden con los filtros.",
            items = pagina.Select(p => new
            {
                p.Id, p.ConstructorId,
                constructor = constructores.TryGetValue(p.ConstructorId, out var perfil) && !string.IsNullOrWhiteSpace(perfil.NombreEmpresa)
                    ? perfil.NombreEmpresa : "Constructor sin nombre registrado",
                p.MontoTotal, p.PlazoEstimadoDias, p.Descripcion, p.Incluye,
                estado = p.Estado.ToString(), p.FechaEnvio,
            }),
        });
    }
}
