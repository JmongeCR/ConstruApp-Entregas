using System.Security.Claims;
using ConstruApp.Core.Entities;
using ConstruApp.Core.Enums;
using ConstruApp.Core.Interfaces;
using ConstruApp.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace ConstruApp.API.Controllers;

[ApiController]
[Route("api/proyectos/{proyectoId:int}/sugerencia-precios")]
[Authorize(Roles = "Cliente,Admin")]
public sealed class SugerenciaPreciosController : ControllerBase
{
    private readonly IUnitOfWork _uow;
    private readonly RangosPreciosOptions _rangos;
    private readonly IAuditoriaService _auditoria;

    public SugerenciaPreciosController(IUnitOfWork uow, IOptions<RangosPreciosOptions> rangos,
        IAuditoriaService auditoria)
    {
        _uow = uow;
        _rangos = rangos.Value;
        _auditoria = auditoria;
    }

    [HttpPost]
    public async Task<IActionResult> Generar(int proyectoId)
    {
        var proyecto = await _uow.Proyectos.GetByIdAsync(proyectoId);
        if (proyecto is null) return NotFound(new { message = "No encontramos el proyecto." });

        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        if (!User.IsInRole("Admin") && proyecto.ClienteId != userId) return Forbid();

        var errores = new Dictionary<string, string>();
        if (string.IsNullOrWhiteSpace(proyecto.Titulo)) errores["titulo"] = "Ingresá el nombre del proyecto.";
        if (string.IsNullOrWhiteSpace(proyecto.Descripcion) || proyecto.Descripcion.Trim().Length < 20)
            errores["descripcion"] = "Completá una descripción de al menos 20 caracteres.";
        if (!proyecto.TipoProyecto.HasValue || !Enum.IsDefined(proyecto.TipoProyecto.Value))
            errores["tipoProyecto"] = "Seleccioná un tipo de trabajo válido.";
        if (proyecto.PropiedadId is null) errores["propiedadId"] = "Seleccioná una propiedad.";
        else
        {
            var propiedad = await _uow.Propiedades.GetByIdAsync(proyecto.PropiedadId.Value);
            if (propiedad is null || propiedad.ClienteId != proyecto.ClienteId)
                errores["propiedadId"] = "La propiedad no está disponible para este proyecto.";
        }
        if (proyecto.AreaM2 is null or <= 0 or > 99999999.99m)
            errores["areaM2"] = "Ingresá un área positiva y menor que 100000000 m².";
        if (proyecto.PresupuestoMax is <= 0)
            errores["presupuestoMax"] = "El presupuesto debe ser positivo o quedar vacío.";
        if (proyecto.FechaFin.HasValue && proyecto.FechaInicio.HasValue && proyecto.FechaFin < proyecto.FechaInicio)
            errores["fechaFin"] = "La finalización no puede ser anterior al inicio.";
        if (errores.Count > 0)
            return BadRequest(new { message = "Completá o corregí los datos del proyecto antes de sugerir precios.", errors = errores });

        var tipo = proyecto.TipoProyecto!.Value.ToString();
        if (!_rangos.PorTipo.TryGetValue(tipo, out var rango) || rango.Minimo <= 0 || rango.Maximo < rango.Minimo)
            return StatusCode(StatusCodes.Status503ServiceUnavailable, new { message = $"No hay un rango de referencia configurado para {tipo}." });

        decimal min, max;
        try
        {
            min = decimal.Round(proyecto.AreaM2!.Value * rango.Minimo, 2, MidpointRounding.AwayFromZero);
            max = decimal.Round(proyecto.AreaM2.Value * rango.Maximo, 2, MidpointRounding.AwayFromZero);
        }
        catch (OverflowException)
        {
            return BadRequest(new { message = "El área y los valores de referencia exceden el rango de cálculo permitido." });
        }
        if (min <= 0 || max > 9999999999999999.99m)
            return BadRequest(new { message = "El rango calculado no puede representarse en colones. Revisá el área y los valores de referencia." });
        var especial = proyecto.TipoProyecto == TipoProyecto.Otro;
        var advertencia = especial
            ? "Proyecto especial: el rango es orientativo y debe validarlo una persona profesional."
            : "Rango orientativo, no constituye una cotización ni un precio garantizado.";
        var fuente = string.IsNullOrWhiteSpace(rango.Fuente) ? "Rangos de referencia configurados" : rango.Fuente.Trim();
        var anteriores = await _uow.CotizacionesIA.FindAsync(c => c.ProyectoId == proyecto.Id);
        var registro = new CotizacionIA
        {
            ProyectoId = proyecto.Id,
            RangoMinimo = min,
            RangoMaximo = max,
            ResumenIA = FormattableString.Invariant($"Estimación referencial por área: {proyecto.AreaM2} m². Base: {rango.Minimo}–{rango.Maximo} CRC/m². Fuente: {fuente}. {advertencia}"),
            TipoProyectoIA = tipo,
            Plan = "referencial",
            NombrePlan = "Rango estimado",
            GeneradoPorId = userId,
            Estado = "Activa",
            Version = anteriores.Select(c => c.Version).DefaultIfEmpty(0).Max() + 1
        };
        await _uow.CotizacionesIA.AddAsync(registro);
        await _uow.SaveChangesAsync();
        await _auditoria.RegistrarAsync(userId, User.FindFirstValue("nombre") ?? "",
            "SugerirPrecios", "Proyectos", proyectoId.ToString(), registro.ResumenIA);

        return Ok(new
        {
            registro.Id, proyectoId, tipoProyecto = tipo, areaM2 = proyecto.AreaM2,
            rangoMinimo = min, rangoMaximo = max, moneda = "CRC",
            precioMinimoM2 = rango.Minimo, precioMaximoM2 = rango.Maximo,
            fuente, fechaGeneracion = registro.FechaGeneracion,
            esEstimacion = true,
            advertencia
        });
    }
}
