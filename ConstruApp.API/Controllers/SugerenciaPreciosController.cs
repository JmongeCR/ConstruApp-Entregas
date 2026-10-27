using System.Security.Claims;
using ConstruApp.Core.Entities;
using ConstruApp.Core.Enums;
using ConstruApp.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace ConstruApp.API.Controllers;

public sealed class RangosPreciosOptions
{
    public Dictionary<string, RangoPrecioPorM2> PorTipo { get; set; } = new(StringComparer.OrdinalIgnoreCase);
}

public sealed class RangoPrecioPorM2
{
    public decimal Minimo { get; set; }
    public decimal Maximo { get; set; }
}

[ApiController]
[Route("api/proyectos/{proyectoId:int}/sugerencia-precios")]
[Authorize(Roles = "Cliente,Admin")]
public sealed class SugerenciaPreciosController : ControllerBase
{
    private readonly IUnitOfWork _uow;
    private readonly RangosPreciosOptions _rangos;

    public SugerenciaPreciosController(IUnitOfWork uow, IOptions<RangosPreciosOptions> rangos)
    {
        _uow = uow;
        _rangos = rangos.Value;
    }

    [HttpPost]
    public async Task<IActionResult> Generar(int proyectoId)
    {
        var proyecto = await _uow.Proyectos.GetByIdAsync(proyectoId);
        if (proyecto is null) return NotFound(new { message = "No encontramos el proyecto." });

        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        if (!User.IsInRole("Admin") && proyecto.ClienteId != userId) return Forbid();

        var incompletos = new List<string>();
        if (string.IsNullOrWhiteSpace(proyecto.Titulo)) incompletos.Add("título");
        if (string.IsNullOrWhiteSpace(proyecto.Descripcion)) incompletos.Add("descripción");
        if (proyecto.PropiedadId is null) incompletos.Add("propiedad");
        if (proyecto.AreaM2 is null or <= 0) incompletos.Add("área en m² positiva");
        if (incompletos.Count > 0)
            return BadRequest(new { message = $"Completa estos datos antes de sugerir un precio: {string.Join(", ", incompletos)}." });

        var tipo = proyecto.TipoProyecto.ToString();
        if (!_rangos.PorTipo.TryGetValue(tipo, out var rango) || rango.Minimo <= 0 || rango.Maximo < rango.Minimo)
            return StatusCode(StatusCodes.Status503ServiceUnavailable, new { message = $"No hay un rango de referencia configurado para {tipo}." });

        var min = decimal.Round(proyecto.AreaM2!.Value * rango.Minimo, 0);
        var max = decimal.Round(proyecto.AreaM2.Value * rango.Maximo, 0);
        var especial = proyecto.TipoProyecto == TipoProyecto.Otro;
        var registro = new CotizacionIA
        {
            ProyectoId = proyecto.Id,
            RangoMinimo = min,
            RangoMaximo = max,
            ResumenIA = especial
                ? "Estimación referencial para un proyecto especial; requiere revisión profesional."
                : "Estimación referencial calculada con rangos configurables por tipo de proyecto y área.",
            TipoProyectoIA = tipo,
            Plan = "referencial",
            NombrePlan = "Rango estimado",
            GeneradoPorId = userId,
            Estado = "Activa",
            Version = await _uow.CotizacionesIA.CountAsync(c => c.ProyectoId == proyecto.Id) + 1
        };
        await _uow.CotizacionesIA.AddAsync(registro);
        await _uow.SaveChangesAsync();

        return Ok(new
        {
            registro.Id, proyectoId, tipoProyecto = tipo, areaM2 = proyecto.AreaM2,
            rangoMinimo = min, rangoMaximo = max, moneda = "CRC",
            esEstimacion = true,
            advertencia = especial
                ? "Proyecto especial: el rango es orientativo y debe validarlo una persona profesional."
                : "Rango orientativo, no constituye una cotización ni un precio garantizado."
        });
    }
}
