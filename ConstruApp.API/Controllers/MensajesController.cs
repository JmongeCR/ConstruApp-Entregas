using System.Security.Claims;
using ConstruApp.Core.Entities;
using ConstruApp.Core.Enums;
using ConstruApp.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ConstruApp.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class MensajesController : ControllerBase
{
    private readonly IUnitOfWork          _uow;
    private readonly UserManager<Usuario> _userManager;

    public MensajesController(IUnitOfWork uow, UserManager<Usuario> userManager)
    {
        _uow         = uow;
        _userManager = userManager;
    }

    private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    // ── Widget: lista de conversaciones (proyectos + canales) ─────────────────

    // GET api/mensajes/conversaciones
    [HttpGet("conversaciones")]
    public async Task<IActionResult> GetConversaciones()
    {
        var userId = UserId;
        var rol    = User.FindFirstValue(ClaimTypes.Role) ?? "";

        // Collect project IDs the user is involved in
        var proyectoIds = new HashSet<int>();

        if (rol == "Admin")
        {
            var todos = await _uow.Proyectos.FindAsync(p => p.Estado != EstadoProyecto.Cancelado);
            foreach (var p in todos) proyectoIds.Add(p.Id);
        }
        else
        {
            // As client
            var proyectosCliente = await _uow.Proyectos.FindAsync(p => p.ClienteId == userId);
            foreach (var p in proyectosCliente) proyectoIds.Add(p.Id);

            // As constructor (via accepted/active proposals)
            var perfiles = await _uow.PerfilesConstructor.FindAsync(p => p.UsuarioId == userId);
            var perfilId = perfiles.FirstOrDefault()?.Id;
            if (perfilId.HasValue)
            {
                var propuestas = await _uow.Propuestas.FindAsync(p =>
                    p.ConstructorId == perfilId.Value &&
                    (p.Estado == EstadoPropuesta.Aceptada || p.Estado == EstadoPropuesta.Finalizada));
                foreach (var p in propuestas) proyectoIds.Add(p.ProyectoId);
            }
        }

        if (proyectoIds.Count == 0) return Ok(new List<object>());

        var ids = proyectoIds.ToList();
        var proyectos = (await _uow.Proyectos.FindAsync(p => ids.Contains(p.Id)))
            .ToDictionary(p => p.Id);

        var mensajes = (await _uow.Mensajes.FindAsync(m => ids.Contains(m.ProyectoId))).ToList();

        var canales = new[] { "General", "Cliente", "Tecnico", "Equipo" };

        var result = ids
            .Where(pid => proyectos.ContainsKey(pid))
            .Select(pid =>
            {
                var proyecto    = proyectos[pid];
                var msgsProyecto = mensajes.Where(m => m.ProyectoId == pid).ToList();

                var channelData = canales.Select(canal =>
                {
                    var msCan   = msgsProyecto.Where(m => m.Canal == canal).ToList();
                    var ultimo  = msCan.MaxBy(m => m.FechaEnvio);
                    var noLeidos = msCan.Count(m =>
                        !m.Leido && m.RemitenteId != userId &&
                        (m.DestinatarioId == null || m.DestinatarioId == userId));

                    return new
                    {
                        Canal        = canal,
                        UltimoMensaje = ultimo?.Contenido is { } c && c.Length > 80 ? c[..80] + "…" : ultimo?.Contenido,
                        UltimaFecha  = ultimo?.FechaEnvio,
                        NoLeidos     = noLeidos,
                    };
                }).ToList();

                return new
                {
                    ProyectoId     = pid,
                    Titulo         = proyecto.Titulo,
                    TipoProyecto   = proyecto.TipoProyecto.ToString(),
                    EstadoProyecto = proyecto.Estado.ToString(),
                    Canton         = proyecto.Canton,
                    Provincia      = proyecto.Provincia,
                    Canales        = channelData,
                    TotalNoLeidos  = channelData.Sum(c => c.NoLeidos),
                };
            })
            .OrderByDescending(x => x.TotalNoLeidos)
            .ToList();

        return Ok(result);
    }

    // ── Chat por canal ────────────────────────────────────────────────────────

    // GET api/mensajes/proyecto/{proyectoId}/canal/{canal}
    [HttpGet("proyecto/{proyectoId}/canal/{canal}")]
    public async Task<IActionResult> GetCanalMensajes(int proyectoId, string canal)
    {
        var proyecto = await _uow.Proyectos.GetByIdAsync(proyectoId);
        if (proyecto is null) return NotFound();

        if (!CanalValido(canal)) return BadRequest(new { message = "Canal no válido" });

        var msgs = (await _uow.Mensajes.FindAsync(m => m.ProyectoId == proyectoId && m.Canal == canal)).ToList();

        // Mark as read
        bool huboLeidos = false;
        foreach (var m in msgs.Where(m => m.RemitenteId != UserId && !m.Leido))
        {
            m.Leido = true;
            _uow.Mensajes.UpdateAsync(m);
            huboLeidos = true;
        }
        if (huboLeidos) await _uow.SaveChangesAsync();

        var remitenteIds = msgs.Select(m => m.RemitenteId).Distinct().ToList();
        var users = remitenteIds.Any()
            ? await _userManager.Users
                .Where(u => remitenteIds.Contains(u.Id))
                .Select(u => new { u.Id, u.Nombre, u.AvatarUrl })
                .ToListAsync()
            : [];
        var usersDict = users.ToDictionary(u => u.Id);

        return Ok(msgs.OrderBy(m => m.FechaEnvio).Select(m => new
        {
            m.Id, m.ProyectoId, m.Canal,
            m.RemitenteId,
            RemitenteNombre = usersDict.TryGetValue(m.RemitenteId, out var u)  ? u.Nombre    : "Usuario",
            RemitenteAvatar = usersDict.TryGetValue(m.RemitenteId, out var ua) ? ua.AvatarUrl : null,
            m.Contenido, m.Leido, m.FechaEnvio,
            m.AdjuntoUrl, m.AdjuntoNombre,
        }));
    }

    // POST api/mensajes/proyecto/{proyectoId}/canal/{canal}
    [HttpPost("proyecto/{proyectoId}/canal/{canal}")]
    public async Task<IActionResult> SendCanalMensaje(int proyectoId, string canal, [FromBody] ChatMensajeRequest req)
    {
        var proyecto = await _uow.Proyectos.GetByIdAsync(proyectoId);
        if (proyecto is null) return NotFound();
        if (!CanalValido(canal)) return BadRequest(new { message = "Canal no válido" });

        var msg = new Mensaje
        {
            ProyectoId    = proyectoId,
            Canal         = canal,
            RemitenteId   = UserId,
            Contenido     = req.Contenido,
            AdjuntoUrl    = req.AdjuntoUrl,
            AdjuntoNombre = req.AdjuntoNombre,
        };

        await _uow.Mensajes.AddAsync(msg);
        await _uow.SaveChangesAsync();

        var nombre = (await _userManager.FindByIdAsync(UserId.ToString()))?.Nombre ?? "Usuario";
        return Ok(new
        {
            msg.Id, msg.ProyectoId, msg.Canal,
            msg.RemitenteId, RemitenteNombre = nombre,
            msg.Contenido, msg.Leido, msg.FechaEnvio,
            msg.AdjuntoUrl, msg.AdjuntoNombre,
        });
    }

    // PUT api/mensajes/proyecto/{proyectoId}/canal/{canal}/leidos
    [HttpPut("proyecto/{proyectoId}/canal/{canal}/leidos")]
    public async Task<IActionResult> MarcarLeidos(int proyectoId, string canal)
    {
        if (!CanalValido(canal)) return BadRequest();
        var msgs = (await _uow.Mensajes.FindAsync(m =>
            m.ProyectoId == proyectoId && m.Canal == canal &&
            m.RemitenteId != UserId && !m.Leido)).ToList();

        foreach (var m in msgs)
        {
            m.Leido = true;
            _uow.Mensajes.UpdateAsync(m);
        }
        if (msgs.Count > 0) await _uow.SaveChangesAsync();
        return Ok(new { marcados = msgs.Count });
    }

    // ── Chat grupal de proyecto (legacy) ──────────────────────────────────────

    [HttpGet("proyecto/{proyectoId}/chat")]
    public async Task<IActionResult> GetChatProyecto(int proyectoId)
    {
        var msgs = await _uow.Mensajes.FindAsync(m => m.ProyectoId == proyectoId);

        bool huboLeidos = false;
        foreach (var m in msgs.Where(m => m.DestinatarioId == UserId && !m.Leido))
        {
            m.Leido = true;
            _uow.Mensajes.UpdateAsync(m);
            huboLeidos = true;
        }
        if (huboLeidos) await _uow.SaveChangesAsync();

        var remitenteIds = msgs.Select(m => m.RemitenteId).Distinct().ToList();
        var users = remitenteIds.Any()
            ? await _userManager.Users.Where(u => remitenteIds.Contains(u.Id))
                                      .Select(u => new { u.Id, u.Nombre })
                                      .ToListAsync()
            : new List<dynamic>() as IEnumerable<dynamic>;

        var usersDict = ((IEnumerable<dynamic>)users).ToDictionary(u => (int)u.Id, u => (string)u.Nombre);
        return Ok(msgs.OrderBy(m => m.FechaEnvio).Select(m => MapChat(m, usersDict)));
    }

    [HttpPost("proyecto/{proyectoId}/chat")]
    public async Task<IActionResult> SendChat(int proyectoId, [FromBody] ChatMensajeRequest req)
    {
        var proyecto = await _uow.Proyectos.GetByIdAsync(proyectoId);
        if (proyecto is null) return NotFound();

        var msg = new Mensaje
        {
            ProyectoId    = proyectoId,
            Canal         = "General",
            RemitenteId   = UserId,
            Contenido     = req.Contenido,
            AdjuntoUrl    = req.AdjuntoUrl,
            AdjuntoNombre = req.AdjuntoNombre,
        };

        await _uow.Mensajes.AddAsync(msg);
        await _uow.SaveChangesAsync();

        var nombre = (await _userManager.FindByIdAsync(UserId.ToString()))?.Nombre ?? "Usuario";
        return Ok(MapChat(msg, new Dictionary<int, string> { [UserId] = nombre }));
    }

    // ── Mensajería 1:1 (legacy propuesta) ────────────────────────────────────

    [HttpGet("propuesta/{propuestaId}")]
    public async Task<IActionResult> GetByPropuesta(int propuestaId)
    {
        var msgs = await _uow.Mensajes.FindAsync(m => m.PropuestaId == propuestaId);
        foreach (var m in msgs.Where(m => m.DestinatarioId == UserId && !m.Leido))
        {
            m.Leido = true;
            _uow.Mensajes.UpdateAsync(m);
        }
        await _uow.SaveChangesAsync();
        return Ok(msgs.OrderBy(m => m.FechaEnvio).Select(Map));
    }

    [HttpPost]
    public async Task<IActionResult> Send([FromBody] MensajeRequest req)
    {
        var m = new Mensaje
        {
            ProyectoId     = req.ProyectoId,
            PropuestaId    = req.PropuestaId,
            RemitenteId    = UserId,
            DestinatarioId = req.DestinatarioId,
            Contenido      = req.Contenido,
        };
        await _uow.Mensajes.AddAsync(m);
        await _uow.SaveChangesAsync();
        return Ok(Map(m));
    }

    // GET api/mensajes/no-leidos
    [HttpGet("no-leidos")]
    public async Task<IActionResult> NoLeidos()
    {
        var count = await _uow.Mensajes.CountAsync(m =>
            !m.Leido && m.RemitenteId != UserId &&
            (m.DestinatarioId == null || m.DestinatarioId == UserId));
        return Ok(new { count });
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private static bool CanalValido(string canal) =>
        canal is "General" or "Cliente" or "Tecnico" or "Equipo";

    private static object MapChat(Mensaje m, IDictionary<int, string> nombres) => new
    {
        m.Id, m.ProyectoId, m.Canal,
        m.RemitenteId,
        RemitenteNombre = nombres.TryGetValue(m.RemitenteId, out var n) ? n : "Usuario",
        m.DestinatarioId,
        m.Contenido, m.Leido, m.FechaEnvio,
        m.AdjuntoUrl, m.AdjuntoNombre,
    };

    private static object Map(Mensaje m) => new
    {
        m.Id, m.ProyectoId, m.PropuestaId, m.Canal,
        m.RemitenteId, m.DestinatarioId,
        m.Contenido, m.Leido, m.FechaEnvio,
    };
}

public record ChatMensajeRequest(string Contenido, string? AdjuntoUrl = null, string? AdjuntoNombre = null);
public record MensajeRequest(int ProyectoId, int? PropuestaId, int? DestinatarioId, string Contenido);
