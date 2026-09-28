using System.Security.Claims;
using ConstruApp.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ConstruApp.API.Controllers;

/// <summary>
/// Módulo de IA Empresarial para ConstruApp.
/// Genera: resúmenes semanales, propuestas, presupuestos, alertas de sobrecosto,
/// recomendaciones de materiales y reportes de estado del proyecto.
/// La IA apoya el flujo — NO es la pantalla principal.
/// </summary>
[ApiController]
[Route("api/ia")]
[Authorize]
public class IAEmpresarialController : ControllerBase
{
    private readonly IUnitOfWork      _uow;
    private readonly IGeminiService   _gemini;

    public IAEmpresarialController(IUnitOfWork uow, IGeminiService gemini)
    {
        _uow    = uow;
        _gemini = gemini;
    }

    private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    // ── Resumen semanal de obra ───────────────────────────────────────────────
    // GET api/ia/resumen-semanal/{proyectoId}
    [HttpGet("resumen-semanal/{proyectoId}")]
    public async Task<IActionResult> ResumenSemanal(int proyectoId)
    {
        var proyecto = await _uow.Proyectos.GetByIdAsync(proyectoId);
        if (proyecto is null) return NotFound();

        var semanaAtras = DateTime.UtcNow.AddDays(-7);
        var avances     = await _uow.AvancesObra.FindAsync(a => a.ProyectoId == proyectoId);
        var recientes   = avances.Where(a => a.Fecha >= semanaAtras).OrderByDescending(a => a.Fecha).ToList();
        var todos       = avances.OrderByDescending(a => a.Fecha).ToList();
        var ultimoPct   = todos.FirstOrDefault()?.PorcentajeAvance ?? 0;

        var gastos = await _uow.GastosObra.FindAsync(g => g.ProyectoId == proyectoId);
        var gastosRecientes = gastos.Where(g => g.Fecha >= semanaAtras).ToList();
        var totalGastoSemana = gastosRecientes.Sum(g => g.Monto);

        var partidas = await _uow.PresupuestoPartidas.FindAsync(p => p.ProyectoId == proyectoId);
        var presupuestoTotal = partidas.Sum(p => p.PresupuestoEstimado);
        var gastoTotal = gastos.Sum(g => g.Monto);

        var ordenesPend = await _uow.OrdenesCambio.FindAsync(o => o.ProyectoId == proyectoId && o.Estado == "Pendiente");

        var systemPrompt =
            """
            Eres un asistente especializado en gestión de proyectos de construcción en Costa Rica.
            Genera resúmenes semanales claros, concisos y orientados a la acción.
            Responde en español, en formato Markdown con secciones claras.
            Sé conciso: máximo 400 palabras.
            """;

        var userPrompt = $"""
            Genera un resumen semanal del proyecto de construcción con estos datos:

            PROYECTO: {proyecto.Titulo}
            Estado: {proyecto.Estado}
            Ubicación: {proyecto.Canton ?? "N/D"}, {proyecto.Provincia ?? "Costa Rica"}

            AVANCES ESTA SEMANA: {recientes.Count} registrado(s)
            {string.Join("\n", recientes.Take(5).Select(a => $"- {a.Titulo}: {a.PorcentajeAvance}% - {a.Descripcion}"))}

            PROGRESO GENERAL: {ultimoPct}% completado
            Total avances registrados: {todos.Count}

            PRESUPUESTO:
            - Estimado total: ₡{presupuestoTotal:N0}
            - Gasto ejecutado: ₡{gastoTotal:N0}
            - Gasto esta semana: ₡{totalGastoSemana:N0}
            - Porcentaje ejecutado: {(presupuestoTotal > 0 ? Math.Round(gastoTotal / presupuestoTotal * 100, 1) : 0)}%

            ÓRDENES DE CAMBIO PENDIENTES: {ordenesPend.Count()}

            Incluye:
            1. 🏗️ Resumen ejecutivo (2 líneas)
            2. ✅ Logros de la semana
            3. 📊 Estado financiero
            4. ⚠️ Alertas o riesgos
            5. 🎯 Próximos pasos recomendados
            """;

        var texto = await _gemini.GenerarTextoAsync(systemPrompt, userPrompt);
        return Ok(new { contenido = texto, generadoEn = DateTime.UtcNow });
    }

    // ── Detección de sobrecostos ──────────────────────────────────────────────
    // GET api/ia/sobrecostos/{proyectoId}
    [HttpGet("sobrecostos/{proyectoId}")]
    public async Task<IActionResult> AnalizarSobrecostos(int proyectoId)
    {
        var proyecto  = await _uow.Proyectos.GetByIdAsync(proyectoId);
        if (proyecto is null) return NotFound();

        var partidas  = await _uow.PresupuestoPartidas.FindAsync(p => p.ProyectoId == proyectoId);
        var gastos    = await _uow.GastosObra.FindAsync(g => g.ProyectoId == proyectoId);

        var gastosXP = gastos.Where(g => g.PartidaId.HasValue)
            .GroupBy(g => g.PartidaId!.Value)
            .ToDictionary(gr => gr.Key, gr => gr.Sum(g => g.Monto));

        var sobrecostos = partidas
            .Where(p => gastosXP.GetValueOrDefault(p.Id, 0) > p.PresupuestoEstimado)
            .Select(p => new
            {
                Partida   = p.Nombre,
                Estimado  = p.PresupuestoEstimado,
                Ejecutado = gastosXP.GetValueOrDefault(p.Id, 0),
                Exceso    = gastosXP.GetValueOrDefault(p.Id, 0) - p.PresupuestoEstimado,
            }).ToList();

        var systemPrompt =
            """
            Eres un analista financiero de proyectos de construcción en Costa Rica.
            Analiza sobrecostos y da recomendaciones concretas y accionables.
            Responde en español, formato Markdown, máximo 350 palabras.
            """;

        var userPrompt = $"""
            Analiza los sobrecostos del proyecto "{proyecto.Titulo}":

            {(sobrecostos.Count == 0
                ? "No se detectaron sobrecostos en partidas asignadas."
                : string.Join("\n", sobrecostos.Select(s =>
                    $"- {s.Partida}: Estimado ₡{s.Estimado:N0} | Ejecutado ₡{s.Ejecutado:N0} | Exceso ₡{s.Exceso:N0}")))}

            Presupuesto total: ₡{partidas.Sum(p => p.PresupuestoEstimado):N0}
            Gasto total: ₡{gastos.Sum(g => g.Monto):N0}
            Partidas con sobrecosto: {sobrecostos.Count} de {partidas.Count()}

            Genera:
            1. 📊 Diagnóstico del estado financiero
            2. 🔴 Partidas críticas y causas probables
            3. 💡 Recomendaciones para controlar costos
            4. 📉 Proyección si continúa la tendencia
            """;

        var texto = await _gemini.GenerarTextoAsync(systemPrompt, userPrompt);
        return Ok(new
        {
            contenido   = texto,
            sobrecostos,
            resumen = new
            {
                totalPartidas    = partidas.Count(),
                partidasConAlerta = sobrecostos.Count,
                totalEstimado    = partidas.Sum(p => p.PresupuestoEstimado),
                totalEjecutado   = gastos.Sum(g => g.Monto),
            },
            generadoEn = DateTime.UtcNow
        });
    }

    // ── Generador de presupuesto ──────────────────────────────────────────────
    // POST api/ia/presupuesto/{proyectoId}
    [HttpPost("presupuesto/{proyectoId}")]
    public async Task<IActionResult> GenerarPresupuesto(int proyectoId, [FromBody] IAContextoRequest? req = null)
    {
        var proyecto = await _uow.Proyectos.GetByIdAsync(proyectoId);
        if (proyecto is null) return NotFound();

        var partidas = await _uow.PresupuestoPartidas.FindAsync(p => p.ProyectoId == proyectoId);
        var equipo   = await _uow.MiembrosEquipo.FindAsync(m => m.ProyectoId == proyectoId && m.Activo);

        var systemPrompt =
            """
            Eres un experto en presupuestos de construcción en Costa Rica.
            Genera presupuestos detallados y realistas con precios actuales del mercado costarricense.
            Usa colones costarricenses (₡). Formato Markdown con tablas cuando sea apropiado.
            Máximo 600 palabras.
            """;

        var userPrompt = $"""
            Genera un presupuesto detallado para el proyecto:

            PROYECTO: {proyecto.Titulo}
            Descripción: {proyecto.Descripcion}
            Tipo: {proyecto.TipoProyecto}
            Área: {(proyecto.AreaM2.HasValue ? $"{proyecto.AreaM2} m²" : "No especificada")}
            Ubicación: {proyecto.Canton ?? "N/D"}, {proyecto.Provincia ?? "Costa Rica"}
            Presupuesto máximo del cliente: {(proyecto.PresupuestoMax.HasValue ? $"₡{proyecto.PresupuestoMax:N0}" : "No definido")}

            PARTIDAS ACTUALES ({partidas.Count()} definidas):
            {string.Join("\n", partidas.Select(p => $"- {p.Nombre} ({p.Categoria}): ₡{p.PresupuestoEstimado:N0}"))}

            EQUIPO ACTUAL: {string.Join(", ", equipo.Select(e => e.Rol))}

            {(req?.Notas != null ? $"Notas adicionales: {req.Notas}" : "")}

            Genera:
            1. 📋 Resumen ejecutivo del presupuesto
            2. 💰 Desglose por categorías con montos sugeridos
            3. 👷 Costos de mano de obra estimados
            4. 📦 Materiales principales con precios de referencia
            5. ⚠️ Imprevistos recomendados (%)
            6. 📊 Total estimado y rango (mín-máx)
            """;

        var texto = await _gemini.GenerarTextoAsync(systemPrompt, userPrompt);
        return Ok(new { contenido = texto, generadoEn = DateTime.UtcNow });
    }

    // ── Generador de propuesta ────────────────────────────────────────────────
    // POST api/ia/propuesta/{proyectoId}
    [HttpPost("propuesta/{proyectoId}")]
    public async Task<IActionResult> GenerarPropuesta(int proyectoId, [FromBody] IAContextoRequest? req = null)
    {
        var proyecto = await _uow.Proyectos.GetByIdAsync(proyectoId);
        if (proyecto is null) return NotFound();

        var propuestas = await _uow.Propuestas.FindAsync(p => p.ProyectoId == proyectoId);
        var partidas   = await _uow.PresupuestoPartidas.FindAsync(p => p.ProyectoId == proyectoId);

        var systemPrompt =
            """
            Eres un experto en redacción de propuestas comerciales para empresas constructoras en Costa Rica.
            Genera propuestas profesionales, claras y persuasivas.
            Formato Markdown. Máximo 700 palabras.
            Usa lenguaje formal y técnico apropiado para el sector construcción costarricense.
            """;

        var userPrompt = $"""
            Genera una propuesta comercial para el siguiente proyecto:

            PROYECTO: {proyecto.Titulo}
            Descripción del cliente: {proyecto.Descripcion}
            Tipo de proyecto: {proyecto.TipoProyecto}
            Área aproximada: {(proyecto.AreaM2.HasValue ? $"{proyecto.AreaM2} m²" : "por definir")}
            Ubicación: {proyecto.Canton ?? "N/D"}, {proyecto.Provincia ?? "Costa Rica"}
            Presupuesto máximo cliente: {(proyecto.PresupuestoMax.HasValue ? $"₡{proyecto.PresupuestoMax:N0}" : "por definir")}

            ALCANCE BASADO EN PARTIDAS:
            {string.Join("\n", partidas.Select(p => $"- {p.Nombre}: {p.Descripcion ?? p.Categoria}"))}

            {(req?.Notas != null ? $"Información adicional: {req.Notas}" : "")}

            La propuesta debe incluir:
            1. 🏗️ Introducción y presentación
            2. 📋 Alcance detallado del trabajo
            3. 📅 Cronograma estimado
            4. 💰 Estructura de pagos sugerida
            5. ✅ Condiciones generales
            6. 🤝 Llamada a la acción
            """;

        var texto = await _gemini.GenerarTextoAsync(systemPrompt, userPrompt);
        return Ok(new { contenido = texto, generadoEn = DateTime.UtcNow });
    }

    // ── Generador de alcance ──────────────────────────────────────────────────
    // POST api/ia/alcance/{proyectoId}
    [HttpPost("alcance/{proyectoId}")]
    public async Task<IActionResult> GenerarAlcance(int proyectoId, [FromBody] IAContextoRequest? req = null)
    {
        var proyecto = await _uow.Proyectos.GetByIdAsync(proyectoId);
        if (proyecto is null) return NotFound();

        var systemPrompt =
            """
            Eres un experto en definición de alcance de proyectos de construcción en Costa Rica.
            Genera documentos de alcance claros, medibles y sin ambigüedades.
            Formato Markdown con listas numeradas. Máximo 500 palabras.
            """;

        var userPrompt = $"""
            Define el alcance completo para el proyecto:

            PROYECTO: {proyecto.Titulo}
            Descripción: {proyecto.Descripcion}
            Tipo: {proyecto.TipoProyecto}
            Área: {(proyecto.AreaM2.HasValue ? $"{proyecto.AreaM2} m²" : "No especificada")}
            Ubicación: {proyecto.Canton ?? "N/D"}, {proyecto.Provincia ?? "Costa Rica"}
            Presupuesto: {(proyecto.PresupuestoMax.HasValue ? $"₡{proyecto.PresupuestoMax:N0}" : "No definido")}

            {(req?.Notas != null ? $"Notas del constructor: {req.Notas}" : "")}

            Incluye:
            1. 📌 Trabajos INCLUIDOS en el alcance
            2. 🚫 Trabajos EXCLUIDOS (fuera del alcance)
            3. ⚠️ Supuestos y consideraciones
            4. 📋 Entregables específicos
            5. 🔑 Criterios de aceptación
            """;

        var texto = await _gemini.GenerarTextoAsync(systemPrompt, userPrompt);
        return Ok(new { contenido = texto, generadoEn = DateTime.UtcNow });
    }

    // ── Recomendación de materiales ───────────────────────────────────────────
    // POST api/ia/materiales/{proyectoId}
    [HttpPost("materiales/{proyectoId}")]
    public async Task<IActionResult> RecomendarMateriales(int proyectoId, [FromBody] IAContextoRequest? req = null)
    {
        var proyecto = await _uow.Proyectos.GetByIdAsync(proyectoId);
        if (proyecto is null) return NotFound();

        var partidas = await _uow.PresupuestoPartidas.FindAsync(p => p.ProyectoId == proyectoId);

        var systemPrompt =
            """
            Eres un experto en materiales de construcción con conocimiento del mercado costarricense (EPA, El Lagar, Ferretería El Colono, Do it Center, Construplaza).
            Recomienda materiales específicos con marcas, precios aproximados y dónde conseguirlos.
            Formato Markdown. Máximo 500 palabras. Precios en colones (₡).
            """;

        var userPrompt = $"""
            Recomienda materiales para el proyecto:

            PROYECTO: {proyecto.Titulo}
            Descripción: {proyecto.Descripcion}
            Tipo: {proyecto.TipoProyecto}
            Área: {(proyecto.AreaM2.HasValue ? $"{proyecto.AreaM2} m²" : "N/D")}
            Ubicación: {proyecto.Canton ?? "N/D"}, {proyecto.Provincia ?? "Costa Rica"}
            Presupuesto: {(proyecto.PresupuestoMax.HasValue ? $"₡{proyecto.PresupuestoMax:N0}" : "No definido")}

            Partidas a cubrir: {string.Join(", ", partidas.Select(p => p.Nombre))}

            {(req?.Notas != null ? $"Especificaciones adicionales: {req.Notas}" : "")}

            Para cada categoría principal:
            1. 🏗️ Estructura (cemento, block, varilla, arena)
            2. 🎨 Acabados (azulejos, pintura, cielos)
            3. ⚡ Electricidad (cable, tableros, tomas)
            4. 🚰 Plomería (tubos, llaves, sanitarios)
            5. 🚪 Carpintería (puertas, ventanas, madera)

            Incluye marcas recomendadas, precios estimados y tiendas donde conseguirlos.
            """;

        var texto = await _gemini.GenerarTextoAsync(systemPrompt, userPrompt);
        return Ok(new { contenido = texto, generadoEn = DateTime.UtcNow });
    }

    // ── Reporte completo del proyecto ─────────────────────────────────────────
    // GET api/ia/reporte/{proyectoId}
    [HttpGet("reporte/{proyectoId}")]
    public async Task<IActionResult> GenerarReporte(int proyectoId)
    {
        var proyecto = await _uow.Proyectos.GetByIdAsync(proyectoId);
        if (proyecto is null) return NotFound();

        var avances   = await _uow.AvancesObra.FindAsync(a => a.ProyectoId == proyectoId);
        var gastos    = await _uow.GastosObra.FindAsync(g => g.ProyectoId == proyectoId);
        var partidas  = await _uow.PresupuestoPartidas.FindAsync(p => p.ProyectoId == proyectoId);
        var ordenes   = await _uow.OrdenesCambio.FindAsync(o => o.ProyectoId == proyectoId);
        var equipo    = await _uow.MiembrosEquipo.FindAsync(m => m.ProyectoId == proyectoId && m.Activo);
        var docs      = await _uow.Archivos.FindAsync(a => a.ProyectoId == proyectoId);

        var ultimoPct        = avances.OrderByDescending(a => a.Fecha).FirstOrDefault()?.PorcentajeAvance ?? 0;
        var presupuestoTotal = partidas.Sum(p => p.PresupuestoEstimado);
        var gastoTotal       = gastos.Sum(g => g.Monto);
        var pctEjec          = presupuestoTotal > 0 ? Math.Round(gastoTotal / presupuestoTotal * 100, 1) : 0;

        var systemPrompt =
            """
            Eres un consultor de proyectos de construcción en Costa Rica.
            Genera reportes ejecutivos profesionales y completos.
            Formato Markdown. Máximo 800 palabras.
            Usa emojis para las secciones para mejorar la legibilidad.
            """;

        var userPrompt = $"""
            Genera un reporte ejecutivo completo del proyecto:

            INFORMACIÓN GENERAL:
            - Proyecto: {proyecto.Titulo}
            - Estado: {proyecto.Estado}
            - Tipo: {proyecto.TipoProyecto}
            - Ubicación: {proyecto.Canton ?? "N/D"}, {proyecto.Provincia ?? "CR"}
            - Área: {(proyecto.AreaM2.HasValue ? $"{proyecto.AreaM2} m²" : "N/D")}
            - Inicio: {(proyecto.FechaInicio.HasValue ? proyecto.FechaInicio.Value.ToString("dd/MM/yyyy") : "N/D")}
            - Fin previsto: {(proyecto.FechaFin.HasValue ? proyecto.FechaFin.Value.ToString("dd/MM/yyyy") : "N/D")}

            AVANCES:
            - Progreso: {ultimoPct}%
            - Total registros de avance: {avances.Count()}
            - Último avance: {avances.OrderByDescending(a => a.Fecha).FirstOrDefault()?.Titulo ?? "N/A"}

            FINANCIERO:
            - Presupuesto estimado: ₡{presupuestoTotal:N0}
            - Gasto ejecutado: ₡{gastoTotal:N0}
            - % ejecutado: {pctEjec}%
            - Partidas: {partidas.Count()}
            - Registros de gasto: {gastos.Count()}

            EQUIPO ({equipo.Count()} miembros):
            {string.Join(", ", equipo.Select(e => $"{e.Nombre} ({e.Rol})"))}

            ÓRDENES DE CAMBIO:
            - Total: {ordenes.Count()}
            - Pendientes: {ordenes.Count(o => o.Estado == "Pendiente")}
            - Aprobadas: {ordenes.Count(o => o.Estado == "Aprobada")}
            - Impacto económico aprobado: ₡{ordenes.Where(o => o.Estado == "Aprobada").Sum(o => o.ImpactoEconomico):N0}

            DOCUMENTOS: {docs.Count()} archivos subidos

            Genera el reporte con:
            1. 📊 Resumen ejecutivo
            2. 🏗️ Estado de avance físico
            3. 💰 Estado financiero
            4. 👥 Equipo del proyecto
            5. 📝 Órdenes de cambio
            6. ⚠️ Riesgos y alertas
            7. 🎯 Próximas acciones
            """;

        var texto = await _gemini.GenerarTextoAsync(systemPrompt, userPrompt);
        return Ok(new
        {
            contenido = texto,
            resumen = new
            {
                proyecto       = proyecto.Titulo,
                estado         = proyecto.Estado,
                progreso       = ultimoPct,
                presupuesto    = presupuestoTotal,
                gastoEjecutado = gastoTotal,
                pctEjecucion   = pctEjec,
                equipo         = equipo.Count(),
                documentos     = docs.Count(),
                ordenesCambio  = ordenes.Count(),
            },
            generadoEn = DateTime.UtcNow
        });
    }
}

public record IAContextoRequest(string? Notas = null);
