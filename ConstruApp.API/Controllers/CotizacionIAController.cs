using System.Security.Claims;
using System.Text.Json;
using ConstruApp.API.DTOs.IA;
using ConstruApp.API.Services;
using ConstruApp.Core.Entities;
using ConstruApp.Core.Enums;
using ConstruApp.Core.Interfaces;
using ConstruApp.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ConstruApp.API.Controllers;

[ApiController]
[Route("api/cotizacion-ia")]
[Authorize]
public class CotizacionIAController : ControllerBase
{
    private readonly IUnitOfWork              _uow;
    private readonly IGeminiService           _gemini;
    private readonly IPreciosCatalogoService  _precios;
    private readonly AppDbContext             _db;

    public CotizacionIAController(
        IUnitOfWork             uow,
        IGeminiService          gemini,
        IPreciosCatalogoService precios,
        AppDbContext            db)
    {
        _uow     = uow;
        _gemini  = gemini;
        _precios = precios;
        _db      = db;
    }

    private int    UserId   => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    private string UserRole => User.FindFirstValue(ClaimTypes.Role) ?? "";

    // ── GET /api/cotizacion-ia  ──────────────────────────────────────────────
    /// <summary>Lista completa con filtros (historial global).</summary>
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int?      proyectoId   = null,
        [FromQuery] int?      clienteId    = null,
        [FromQuery] int?      generadoPorId= null,
        [FromQuery] string?   plan         = null,
        [FromQuery] string?   estado       = null,
        [FromQuery] DateTime? fechaDesde   = null,
        [FromQuery] DateTime? fechaHasta   = null,
        [FromQuery] decimal?  montoMin     = null,
        [FromQuery] decimal?  montoMax     = null,
        [FromQuery] int       page         = 1,
        [FromQuery] int       size         = 30)
    {
        var q = _db.CotizacionesIA
            .Include(c => c.Proyecto).ThenInclude(p => p.Cliente)
            .Include(c => c.GeneradoPor)
            .AsQueryable();

        // Seguridad: cliente sólo ve cotizaciones de sus proyectos
        if (UserRole == "Cliente")
            q = q.Where(c => c.Proyecto.ClienteId == UserId);
        else if (UserRole == "Constructor")
        {
            // Constructor ve cotizaciones de proyectos donde tiene propuesta aceptada o es generador
            q = q.Where(c => c.GeneradoPorId == UserId || c.Proyecto.ClienteId == UserId);
        }

        // Filtros
        if (proyectoId.HasValue)    q = q.Where(c => c.ProyectoId    == proyectoId);
        if (clienteId.HasValue)     q = q.Where(c => c.Proyecto.ClienteId == clienteId);
        if (generadoPorId.HasValue) q = q.Where(c => c.GeneradoPorId == generadoPorId);
        if (!string.IsNullOrEmpty(plan))   q = q.Where(c => c.Plan   == plan);
        if (!string.IsNullOrEmpty(estado)) q = q.Where(c => c.Estado == estado);
        if (fechaDesde.HasValue) q = q.Where(c => c.FechaGeneracion >= fechaDesde.Value);
        if (fechaHasta.HasValue) q = q.Where(c => c.FechaGeneracion <= fechaHasta.Value.AddDays(1));
        if (montoMin.HasValue)   q = q.Where(c => c.RangoMaximo >= montoMin.Value);
        if (montoMax.HasValue)   q = q.Where(c => c.RangoMinimo <= montoMax.Value);

        var total = await q.CountAsync();
        var items = await q
            .OrderByDescending(c => c.FechaGeneracion)
            .Skip((page - 1) * size)
            .Take(size)
            .Select(c => new
            {
                c.Id,
                c.ProyectoId,
                c.RangoMinimo,
                c.RangoMaximo,
                c.Plan,
                c.NombrePlan,
                c.Estado,
                c.Version,
                c.FechaGeneracion,
                c.TipoProyectoIA,
                c.DuracionEstimada,
                Proyecto = new { c.Proyecto.Id, c.Proyecto.Titulo, c.Proyecto.Estado, c.Proyecto.TipoProyecto },
                Cliente  = new { c.Proyecto.Cliente.Id, c.Proyecto.Cliente.Nombre, c.Proyecto.Cliente.Email },
                GeneradoPor = c.GeneradoPor == null ? null : new { c.GeneradoPor.Id, c.GeneradoPor.Nombre },
            })
            .ToListAsync();

        return Ok(new { total, page, size, items });
    }

    // ── GET /api/cotizacion-ia/dashboard ─────────────────────────────────────
    /// <summary>Últimas cotizaciones para el widget del dashboard.</summary>
    [HttpGet("dashboard")]
    public async Task<IActionResult> Dashboard([FromQuery] int top = 5)
    {
        var q = _db.CotizacionesIA
            .Include(c => c.Proyecto).ThenInclude(p => p.Cliente)
            .AsQueryable();

        if (UserRole == "Cliente")
            q = q.Where(c => c.Proyecto.ClienteId == UserId);

        var items = await q
            .OrderByDescending(c => c.FechaGeneracion)
            .Take(top)
            .Select(c => new
            {
                c.Id, c.ProyectoId, c.Plan, c.NombrePlan, c.Estado,
                c.RangoMinimo, c.RangoMaximo, c.FechaGeneracion,
                ProyectoTitulo = c.Proyecto.Titulo,
                ClienteNombre  = c.Proyecto.Cliente.Nombre,
            })
            .ToListAsync();

        return Ok(items);
    }

    // ── GET /api/cotizacion-ia/{id} ──────────────────────────────────────────
    /// <summary>Detalle completo de una cotización por ID.</summary>
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var cotizacion = await _uow.CotizacionesIA.GetByIdAsync(id);
        if (cotizacion is null) return NotFound();

        var proyecto = await _uow.Proyectos.GetByIdAsync(cotizacion.ProyectoId);
        if (UserRole == "Cliente" && proyecto?.ClienteId != UserId) return Forbid();

        var lineas = await _uow.LineasCotizacion.FindAsync(l => l.CotizacionIAId == id);
        return Ok(MapFull(cotizacion, lineas));
    }

    // ── GET /api/cotizacion-ia/proyecto/{proyectoId} ─────────────────────────
    /// <summary>Historial de cotizaciones de un proyecto (todas las versiones + planes).</summary>
    [HttpGet("proyecto/{proyectoId:int}")]
    public async Task<IActionResult> GetByProyecto(int proyectoId)
    {
        var proyecto = await _uow.Proyectos.GetByIdAsync(proyectoId);
        if (proyecto is null) return NotFound();
        if (UserRole == "Cliente" && proyecto.ClienteId != UserId) return Forbid();

        var todas = await _uow.CotizacionesIA.FindAsync(c => c.ProyectoId == proyectoId);
        if (!todas.Any())
            return NotFound(new { message = "Aún no se generó cotización IA para este proyecto." });

        // Última generación = set de planes con fecha más reciente
        var ultimaFecha = todas.Max(c => c.FechaGeneracion);
        var umbral      = ultimaFecha.AddSeconds(-30);
        var planes      = todas.Where(c => c.FechaGeneracion >= umbral).OrderBy(c => c.Plan).ToList();

        var resultado = new List<object>();
        foreach (var plan in planes)
        {
            var lineas = await _uow.LineasCotizacion.FindAsync(l => l.CotizacionIAId == plan.Id);
            resultado.Add(MapFull(plan, lineas));
        }

        return Ok(resultado);
    }

    // ── GET /api/cotizacion-ia/proyecto/{proyectoId}/historial ───────────────
    /// <summary>Todas las generaciones del proyecto, agrupadas por versión.</summary>
    [HttpGet("proyecto/{proyectoId:int}/historial")]
    public async Task<IActionResult> GetHistorial(int proyectoId)
    {
        var proyecto = await _uow.Proyectos.GetByIdAsync(proyectoId);
        if (proyecto is null) return NotFound();
        if (UserRole == "Cliente" && proyecto.ClienteId != UserId) return Forbid();

        var todas = await _db.CotizacionesIA
            .Include(c => c.GeneradoPor)
            .Where(c => c.ProyectoId == proyectoId)
            .OrderByDescending(c => c.FechaGeneracion)
            .Select(c => new
            {
                c.Id, c.Plan, c.NombrePlan, c.Estado, c.Version,
                c.RangoMinimo, c.RangoMaximo, c.FechaGeneracion,
                c.TipoProyectoIA, c.DuracionEstimada,
                GeneradoPor = c.GeneradoPor == null ? null : new { c.GeneradoPor.Id, c.GeneradoPor.Nombre },
            })
            .ToListAsync();

        return Ok(todas);
    }

    // ── POST /api/cotizacion-ia/generar/{proyectoId} ─────────────────────────
    /// <summary>
    /// Genera cotización IA y la AGREGA al historial (no borra las anteriores).
    /// </summary>
    [HttpPost("generar/{proyectoId:int}")]
    public async Task<IActionResult> Generar(int proyectoId, [FromBody] CotizacionIARequest? request = null)
    {
        var proyecto = await _uow.Proyectos.GetByIdAsync(proyectoId);
        if (proyecto is null) return NotFound();
        if (proyecto.ClienteId != UserId) return Forbid();

        // Calcular número de versión (máximo actual + 1)
        var anteriores = await _uow.CotizacionesIA.FindAsync(c => c.ProyectoId == proyectoId);
        var version    = anteriores.Any() ? anteriores.Max(c => c.Version) + 1 : 1;

        // Análisis con IA — genera 3 planes
        var groqService = _gemini as GroqService;
        List<GeminiAnalisisResult> planes;
        if (groqService is not null)
            planes = await groqService.AnalizarPlanesAsync(proyecto, request?.ImagenesBase64, request?.PdfBase64);
        else
            planes = [await _gemini.AnalizarProyectoAsync(proyecto, request?.ImagenesBase64, request?.PdfBase64)];

        // Resolver precios del catálogo para mano de obra
        var clavesMdo  = planes.First().ManoDeObra.Select(mo => (mo, "ManoDeObra"));
        var mapPrecios = await _precios.ObtenerPreciosBulkAsync(clavesMdo);

        var fechaGen  = DateTime.UtcNow;
        var resultado = new List<object>();

        foreach (var analisis in planes)
        {
            var lineas = new List<LineaIA>();

            foreach (var mat in analisis.Materiales)
            {
                var precUnit  = mat.PrecioUnitario ?? EstimarPrecioFallback(mat.Categoria);
                var precTotal = Math.Round(mat.Cantidad * precUnit, 0);
                Enum.TryParse<CategoriaMaterial>(mat.Categoria, true, out var catEnum);

                var desc = string.IsNullOrWhiteSpace(mat.Fuente)
                    ? mat.Nombre : $"{mat.Nombre} [{mat.Fuente}]";
                lineas.Add(new LineaIA(desc, catEnum, mat.Cantidad, mat.Unidad, precUnit, precTotal, false));
            }

            int diasObra = EstimarDiasObra(analisis.DuracionEstimada);
            foreach (var mo in analisis.ManoDeObra)
            {
                var precUnit = mapPrecios.GetValueOrDefault(mo)?.PrecioUnitario ?? 35_000m;
                lineas.Add(new LineaIA(mo, CategoriaMaterial.ManoDeObra, diasObra, "días",
                    precUnit, Math.Round(diasObra * precUnit, 0), true));
            }

            var total      = lineas.Sum(l => l.PrecioTotal);
            var cotizacion = new CotizacionIA
            {
                ProyectoId          = proyectoId,
                GeneradoPorId       = UserId,
                Version             = version,
                Estado              = "Activa",
                RangoMinimo         = Math.Round(total * 0.85m / 1000m, 0) * 1000m,
                RangoMaximo         = Math.Round(total * 1.25m / 1000m, 0) * 1000m,
                ResumenIA           = analisis.Resumen,
                FechaGeneracion     = fechaGen,
                TipoProyectoIA      = analisis.TipoProyecto,
                DuracionEstimada    = analisis.DuracionEstimada,
                ManoDeObraJson      = JsonSerializer.Serialize(analisis.ManoDeObra),
                RecomendacionesJson = JsonSerializer.Serialize(analisis.Recomendaciones),
                Plan                = analisis.Plan,
                NombrePlan          = analisis.NombrePlan,
            };

            await _uow.CotizacionesIA.AddAsync(cotizacion);
            await _uow.SaveChangesAsync();

            foreach (var l in lineas)
                await _uow.LineasCotizacion.AddAsync(new LineaCotizacionIA
                {
                    CotizacionIAId = cotizacion.Id,
                    Descripcion    = l.Descripcion,
                    Categoria      = l.Categoria,
                    Cantidad       = l.Cantidad,
                    Unidad         = l.Unidad,
                    PrecioUnitario = l.PrecioUnitario,
                    PrecioTotal    = l.PrecioTotal,
                    EsManoDeObra   = l.EsManoDeObra,
                });

            await _uow.SaveChangesAsync();
            var lineasGuardadas = await _uow.LineasCotizacion.FindAsync(l => l.CotizacionIAId == cotizacion.Id);
            resultado.Add(MapFull(cotizacion, lineasGuardadas));
        }

        return Ok(resultado);
    }

    // ── POST /api/cotizacion-ia/{id}/duplicar ─────────────────────────────────
    /// <summary>Duplica una cotización (mismas líneas, estado Activa, nueva fecha).</summary>
    [HttpPost("{id:int}/duplicar")]
    public async Task<IActionResult> Duplicar(int id)
    {
        var original = await _uow.CotizacionesIA.GetByIdAsync(id);
        if (original is null) return NotFound();

        var proyecto = await _uow.Proyectos.GetByIdAsync(original.ProyectoId);
        if (proyecto?.ClienteId != UserId) return Forbid();

        var lineasOriginales = await _uow.LineasCotizacion.FindAsync(l => l.CotizacionIAId == id);
        var anteriores       = await _uow.CotizacionesIA.FindAsync(c => c.ProyectoId == original.ProyectoId);
        var version          = anteriores.Max(c => c.Version) + 1;

        var copia = new CotizacionIA
        {
            ProyectoId          = original.ProyectoId,
            GeneradoPorId       = UserId,
            Version             = version,
            Estado              = "Activa",
            RangoMinimo         = original.RangoMinimo,
            RangoMaximo         = original.RangoMaximo,
            ResumenIA           = original.ResumenIA,
            FechaGeneracion     = DateTime.UtcNow,
            TipoProyectoIA      = original.TipoProyectoIA,
            DuracionEstimada    = original.DuracionEstimada,
            ManoDeObraJson      = original.ManoDeObraJson,
            RecomendacionesJson = original.RecomendacionesJson,
            Plan                = original.Plan,
            NombrePlan          = original.NombrePlan,
        };

        await _uow.CotizacionesIA.AddAsync(copia);
        await _uow.SaveChangesAsync();

        foreach (var l in lineasOriginales)
            await _uow.LineasCotizacion.AddAsync(new LineaCotizacionIA
            {
                CotizacionIAId = copia.Id,
                Descripcion    = l.Descripcion,
                Categoria      = l.Categoria,
                Cantidad       = l.Cantidad,
                Unidad         = l.Unidad,
                PrecioUnitario = l.PrecioUnitario,
                PrecioTotal    = l.PrecioTotal,
                EsManoDeObra   = l.EsManoDeObra,
            });

        await _uow.SaveChangesAsync();

        var lineasCopia = await _uow.LineasCotizacion.FindAsync(l => l.CotizacionIAId == copia.Id);
        return Ok(MapFull(copia, lineasCopia));
    }

    // ── PUT /api/cotizacion-ia/{id}/estado ────────────────────────────────────
    [HttpPut("{id:int}/estado")]
    public async Task<IActionResult> CambiarEstado(int id, [FromBody] CambiarEstadoCotizacionRequest req)
    {
        var cotizacion = await _uow.CotizacionesIA.GetByIdAsync(id);
        if (cotizacion is null) return NotFound();

        var proyecto = await _uow.Proyectos.GetByIdAsync(cotizacion.ProyectoId);
        if (proyecto?.ClienteId != UserId) return Forbid();

        var estadosValidos = new[] { "Activa", "Archivada", "ConvertidaPresupuesto", "ConvertidaPropuesta" };
        if (!estadosValidos.Contains(req.Estado))
            return BadRequest(new { message = $"Estado inválido. Opciones: {string.Join(", ", estadosValidos)}" });

        cotizacion.Estado = req.Estado;
        await _uow.CotizacionesIA.UpdateAsync(cotizacion);
        await _uow.SaveChangesAsync();

        return Ok(new { ok = true, cotizacion.Id, cotizacion.Estado });
    }

    // ── POST /api/cotizacion-ia/{id}/convertir-propuesta ─────────────────────
    /// <summary>Crea una Propuesta a partir de una cotización IA.</summary>
    [HttpPost("{id:int}/convertir-propuesta")]
    public async Task<IActionResult> ConvertirPropuesta(int id)
    {
        var cotizacion = await _uow.CotizacionesIA.GetByIdAsync(id);
        if (cotizacion is null) return NotFound();

        var proyecto = await _uow.Proyectos.GetByIdAsync(cotizacion.ProyectoId);
        if (proyecto is null) return NotFound();

        // El usuario que convierte debe ser un constructor con perfil
        var perfiles = await _uow.PerfilesConstructor.FindAsync(p => p.UsuarioId == UserId);
        var perfil   = perfiles.FirstOrDefault();
        if (perfil is null)
            return BadRequest(new { message = "Necesitás un perfil de constructor para crear una propuesta." });

        var recomendaciones = TryDeserialize<List<string>>(cotizacion.RecomendacionesJson) ?? [];
        var descripcion     = string.IsNullOrEmpty(cotizacion.ResumenIA)
            ? $"Propuesta generada desde cotización IA ({cotizacion.NombrePlan})"
            : cotizacion.ResumenIA;

        var incluye = recomendaciones.Count > 0
            ? string.Join("\n", recomendaciones.Take(5).Select(r => $"• {r}"))
            : null;

        var propuesta = new Propuesta
        {
            ProyectoId        = cotizacion.ProyectoId,
            ConstructorId     = perfil.Id,
            MontoTotal        = cotizacion.RangoMaximo,
            Descripcion       = descripcion,
            Incluye           = incluye,
            PlazoEstimadoDias = EstimarDiasObra(cotizacion.DuracionEstimada ?? "4 semanas"),
            Estado            = EstadoPropuesta.Enviada,
        };

        await _uow.Propuestas.AddAsync(propuesta);

        cotizacion.Estado = "ConvertidaPropuesta";
        await _uow.CotizacionesIA.UpdateAsync(cotizacion);
        await _uow.SaveChangesAsync();

        return Ok(new { propuestaId = propuesta.Id, message = "Propuesta creada correctamente desde la cotización IA." });
    }

    // ── POST /api/cotizacion-ia/{id}/convertir-presupuesto ───────────────────
    /// <summary>Crea partidas de presupuesto a partir de una cotización IA.</summary>
    [HttpPost("{id:int}/convertir-presupuesto")]
    public async Task<IActionResult> ConvertirPresupuesto(int id)
    {
        var cotizacion = await _uow.CotizacionesIA.GetByIdAsync(id);
        if (cotizacion is null) return NotFound();

        var proyecto = await _uow.Proyectos.GetByIdAsync(cotizacion.ProyectoId);
        if (proyecto?.ClienteId != UserId) return Forbid();

        var lineas = await _uow.LineasCotizacion.FindAsync(l => l.CotizacionIAId == id);
        var grupos  = lineas.GroupBy(l => l.Categoria.ToString());

        int count = 0;
        foreach (var grupo in grupos)
        {
            var partida = new PresupuestoPartida
            {
                ProyectoId          = cotizacion.ProyectoId,
                Nombre              = grupo.Key,
                Categoria           = grupo.Key,
                PresupuestoEstimado = grupo.Sum(l => l.PrecioTotal),
                Descripcion         = $"Generado desde cotización IA #{cotizacion.Id} — {cotizacion.NombrePlan}",
            };
            await _uow.PresupuestoPartidas.AddAsync(partida);
            count++;
        }

        cotizacion.Estado = "ConvertidaPresupuesto";
        await _uow.CotizacionesIA.UpdateAsync(cotizacion);
        await _uow.SaveChangesAsync();

        return Ok(new { partidasCreadas = count, message = $"Se crearon {count} partidas de presupuesto desde la cotización IA." });
    }

    // ── POST /api/cotizacion-ia/analizar-imagen ───────────────────────────────
    [HttpPost("analizar-imagen")]
    public async Task<IActionResult> AnalizarImagen([FromBody] AnalizarImagenRequest req)
    {
        if (req.ImagenesBase64.Count == 0)
            return BadRequest(new { message = "Se requiere al menos una imagen." });

        var proyectoTemp = new Proyecto
        {
            Titulo      = req.Descripcion ?? "Análisis preliminar",
            Descripcion = req.Descripcion ?? "",
            TipoProyecto = Core.Enums.TipoProyecto.Otro,
            AreaM2      = req.AreaM2,
            Provincia   = req.Provincia,
        };

        var analisis = await _gemini.AnalizarProyectoAsync(proyectoTemp, req.ImagenesBase64);
        return Ok(new
        {
            analisis.TipoProyecto,
            analisis.Resumen,
            analisis.DuracionEstimada,
            analisis.Materiales,
            analisis.ManoDeObra,
            analisis.Recomendaciones,
        });
    }

    // ── Helpers ───────────────────────────────────────────────────────────────
    private static decimal EstimarPrecioFallback(string categoria) => categoria.ToLower() switch
    {
        "estructura"  => 8_000m,
        "acabados"    => 12_000m,
        "electrico"   => 15_000m,
        "plomeria"    => 7_500m,
        "pintura"     => 18_000m,
        "madera"      => 25_000m,
        "manodeobra"  => 35_000m,
        _             => 5_000m
    };

    private static int EstimarDiasObra(string duracion)
    {
        var nums = System.Text.RegularExpressions.Regex.Matches(duracion, @"\d+");
        if (nums.Count == 0) return 10;
        var max = nums.Select(m => int.Parse(m.Value)).Max();
        return duracion.Contains("mes",  StringComparison.OrdinalIgnoreCase) ? max * 20
             : duracion.Contains("sem",  StringComparison.OrdinalIgnoreCase) ? max * 5
             : max;
    }

    private static object MapFull(CotizacionIA c, IEnumerable<LineaCotizacionIA> lineas)
    {
        var manoDeObra      = TryDeserialize<List<string>>(c.ManoDeObraJson)      ?? [];
        var recomendaciones = TryDeserialize<List<string>>(c.RecomendacionesJson) ?? [];

        return new
        {
            c.Id, c.ProyectoId, c.RangoMinimo, c.RangoMaximo,
            c.ResumenIA, c.FechaGeneracion,
            c.Version, c.Estado,
            plan       = c.Plan       ?? "estandar",
            nombrePlan = c.NombrePlan ?? "Plan Estándar",
            lineas = lineas.Select(l => new
            {
                l.Id, l.Descripcion,
                categoria      = l.Categoria.ToString(),
                l.Cantidad, l.Unidad,
                l.PrecioUnitario, l.PrecioTotal, l.EsManoDeObra,
            }),
            analisisIA = new
            {
                tipoProyecto     = c.TipoProyectoIA ?? "",
                duracionEstimada = c.DuracionEstimada ?? "",
                manoDeObra,
                recomendaciones,
            }
        };
    }

    private static T? TryDeserialize<T>(string? json) where T : class
    {
        if (string.IsNullOrEmpty(json)) return null;
        try { return JsonSerializer.Deserialize<T>(json); } catch { return null; }
    }
}

// DTOs
public record AnalizarImagenRequest(
    List<string> ImagenesBase64,
    string?      Descripcion = null,
    decimal?     AreaM2      = null,
    string?      Provincia   = null);

public record CambiarEstadoCotizacionRequest(string Estado);

internal record LineaIA(
    string           Descripcion,
    CategoriaMaterial Categoria,
    decimal          Cantidad,
    string           Unidad,
    decimal          PrecioUnitario,
    decimal          PrecioTotal,
    bool             EsManoDeObra);
