using System.Security.Claims;
using ConstruApp.API.Services;
using ConstruApp.Core.Entities;
using ConstruApp.Core.Enums;
using ConstruApp.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace ConstruApp.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class FacturasController : ControllerBase
{
    private readonly IUnitOfWork _uow;
    private readonly UserManager<Usuario> _users;
    private readonly IEmailService _email;

    public FacturasController(IUnitOfWork uow, UserManager<Usuario> users, IEmailService email)
    {
        _uow   = uow;
        _users = users;
        _email = email;
    }

    private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    // ── GET /api/facturas  ─────────────────────────────────────────────────────
    // Constructor: sus facturas. Cliente: facturas de sus proyectos.
    [HttpGet]
    public async Task<IActionResult> GetMias()
    {
        var user = await _users.FindByIdAsync(UserId.ToString());
        if (user is null) return Unauthorized();

        IEnumerable<Factura> facturas;

        if (user.Rol == Rol.Constructor)
        {
            var perfiles = await _uow.PerfilesConstructor.FindAsync(p => p.UsuarioId == UserId);
            var perfil   = perfiles.FirstOrDefault();
            if (perfil is null) return Ok(Array.Empty<object>());

            facturas = await _uow.Facturas.FindAsync(f => f.ConstructorId == perfil.Id);
        }
        else
        {
            var proyectos = await _uow.Proyectos.FindAsync(p => p.ClienteId == UserId);
            var pids      = proyectos.Select(p => p.Id).ToHashSet();
            facturas      = await _uow.Facturas.FindAsync(f => pids.Contains(f.ProyectoId));
        }

        // Enriquecer con nombre del proyecto
        var proyIds    = facturas.Select(f => f.ProyectoId).Distinct().ToList();
        var proyMap    = (await _uow.Proyectos.FindAsync(p => proyIds.Contains(p.Id)))
                            .ToDictionary(p => p.Id);

        return Ok(facturas.OrderByDescending(f => f.FechaEmision).Select(f => Map(f, proyMap)));
    }

    // ── GET /api/facturas/proyecto/{proyectoId}  ───────────────────────────────
    [HttpGet("proyecto/{proyectoId}")]
    public async Task<IActionResult> GetByProyecto(int proyectoId)
    {
        var proyecto = await _uow.Proyectos.GetByIdAsync(proyectoId);
        if (proyecto is null) return NotFound();

        // Solo constructor asignado o cliente propietario
        if (!await TieneAcceso(proyectoId)) return Forbid();

        var facturas = await _uow.Facturas.FindAsync(f => f.ProyectoId == proyectoId);
        var proyMap  = new Dictionary<int, Proyecto> { [proyectoId] = proyecto };

        return Ok(facturas.OrderByDescending(f => f.FechaEmision).Select(f => Map(f, proyMap)));
    }

    // ── GET /api/facturas/{id}  ────────────────────────────────────────────────
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var factura = await _uow.Facturas.GetByIdAsync(id);
        if (factura is null) return NotFound();

        if (!await TieneAcceso(factura.ProyectoId)) return Forbid();

        var pagos   = await _uow.PagosFactura.FindAsync(p => p.FacturaId == id);
        var proyecto = await _uow.Proyectos.GetByIdAsync(factura.ProyectoId);
        var proyMap  = proyecto is not null
            ? new Dictionary<int, Proyecto> { [factura.ProyectoId] = proyecto }
            : new Dictionary<int, Proyecto>();

        return Ok(new
        {
            Factura = Map(factura, proyMap),
            Pagos   = pagos.OrderBy(p => p.Fecha).Select(MapPago),
        });
    }

    // ── POST /api/facturas  ────────────────────────────────────────────────────
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] FacturaRequest req)
    {
        var perfil = await GetPerfil();
        if (perfil is null) return BadRequest(new { message = "No tenés perfil de constructor." });

        // Verificar que la propuesta/proyecto sea suya
        if (req.PropuestaId.HasValue)
        {
            var propuesta = await _uow.Propuestas.GetByIdAsync(req.PropuestaId.Value);
            if (propuesta is null || propuesta.ConstructorId != perfil.Id)
                return Forbid();
        }

        // Generar número correlativo
        var existing = await _uow.Facturas.FindAsync(f => f.ConstructorId == perfil.Id);
        var numero   = $"FAC-{DateTime.UtcNow.Year}-{(existing.Count() + 1):D4}";

        var factura = new Factura
        {
            ProyectoId        = req.ProyectoId,
            PropuestaId       = req.PropuestaId,
            ConstructorId     = perfil.Id,
            Numero            = numero,
            Concepto          = req.Concepto,
            Notas             = req.Notas,
            MontoTotal        = req.MontoTotal,
            FechaEmision      = DateTime.UtcNow,
            FechaVencimiento  = req.FechaVencimiento,
            Estado            = EstadoFactura.Enviada,
            LineasJson        = req.LineasJson,
            AplicaIVA         = req.AplicaIVA,
            MontoIVA          = req.MontoIVA,
            MontoDescuento    = req.MontoDescuento,
        };

        await _uow.Facturas.AddAsync(factura);
        await _uow.SaveChangesAsync();

        var proyecto = await _uow.Proyectos.GetByIdAsync(req.ProyectoId);
        var proyMap  = proyecto is not null
            ? new Dictionary<int, Proyecto> { [req.ProyectoId] = proyecto }
            : new Dictionary<int, Proyecto>();

        // ── Email: notificar al cliente la nueva factura ───────────────────────
        _ = EnviarEmailFacturaEmitida(factura, proyecto);

        return Ok(Map(factura, proyMap));
    }

    // ── PUT /api/facturas/{id}  ────────────────────────────────────────────────
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] FacturaUpdateRequest req)
    {
        var factura = await _uow.Facturas.GetByIdAsync(id);
        if (factura is null) return NotFound();

        var perfil = await GetPerfil();
        if (perfil is null || factura.ConstructorId != perfil.Id) return Forbid();

        if (factura.Estado == EstadoFactura.Pagada || factura.Estado == EstadoFactura.Cancelada)
            return BadRequest(new { message = "No se puede editar una factura pagada o cancelada." });

        factura.Concepto         = req.Concepto ?? factura.Concepto;
        factura.Notas            = req.Notas ?? factura.Notas;
        factura.MontoTotal       = req.MontoTotal > 0 ? req.MontoTotal : factura.MontoTotal;
        factura.FechaVencimiento = req.FechaVencimiento ?? factura.FechaVencimiento;

        RecalcularEstado(factura);

        await _uow.Facturas.UpdateAsync(factura);
        await _uow.SaveChangesAsync();

        return Ok(new { message = "Factura actualizada." });
    }

    // ── DELETE /api/facturas/{id}  ─────────────────────────────────────────────
    [HttpDelete("{id}")]
    public async Task<IActionResult> Cancel(int id)
    {
        var factura = await _uow.Facturas.GetByIdAsync(id);
        if (factura is null) return NotFound();

        var perfil = await GetPerfil();
        if (perfil is null || factura.ConstructorId != perfil.Id) return Forbid();

        factura.Estado = EstadoFactura.Cancelada;
        await _uow.Facturas.UpdateAsync(factura);
        await _uow.SaveChangesAsync();

        return NoContent();
    }

    // ── POST /api/facturas/{id}/pagos  ─────────────────────────────────────────
    [HttpPost("{id}/pagos")]
    public async Task<IActionResult> RegistrarPago(int id, [FromBody] PagoRequest req)
    {
        var factura = await _uow.Facturas.GetByIdAsync(id);
        if (factura is null) return NotFound();

        var perfil = await GetPerfil();
        if (perfil is null || factura.ConstructorId != perfil.Id) return Forbid();

        if (factura.Estado == EstadoFactura.Pagada)
            return BadRequest(new { message = "La factura ya está completamente pagada." });
        if (factura.Estado == EstadoFactura.Cancelada)
            return BadRequest(new { message = "No se puede registrar pago en una factura cancelada." });

        var pago = new PagoFactura
        {
            FacturaId  = id,
            Monto      = req.Monto,
            Fecha      = req.Fecha ?? DateTime.UtcNow,
            MetodoPago = req.MetodoPago,
            Referencia = req.Referencia,
            Notas      = req.Notas,
        };

        await _uow.PagosFactura.AddAsync(pago);

        // Actualizar monto pagado y estado
        factura.MontoPagado += req.Monto;
        RecalcularEstado(factura);
        await _uow.Facturas.UpdateAsync(factura);
        await _uow.SaveChangesAsync();

        // ── Email: notificar al constructor que recibió un pago ────────────────
        _ = EnviarEmailPagoRecibido(factura, pago, perfil);

        return Ok(MapPago(pago));
    }

    // ── POST /api/facturas/{id}/enviar  ───────────────────────────────────────
    // Distribuye la factura por correo (simulado) y/o al chat del proyecto
    [HttpPost("{id}/enviar")]
    public async Task<IActionResult> Enviar(int id, [FromBody] EnviarFacturaRequest req)
    {
        var factura = await _uow.Facturas.GetByIdAsync(id);
        if (factura is null) return NotFound();

        var perfil = await GetPerfil();
        if (perfil is null || factura.ConstructorId != perfil.Id) return Forbid();

        if (req.PorEmail)
            factura.FechaEnvioEmail = DateTime.UtcNow;

        if (req.PorChat)
        {
            factura.FechaEnvioChat = DateTime.UtcNow;
            var monto = factura.MontoTotal.ToString("N0");
            var vence = factura.FechaVencimiento.HasValue
                ? factura.FechaVencimiento.Value.ToString("dd/MM/yyyy")
                : "—";
            var msg = new Mensaje
            {
                ProyectoId    = factura.ProyectoId,
                RemitenteId   = UserId,
                Canal         = "Cliente",
                Contenido     = $"📄 Factura {factura.Numero} — ₡{monto}\n{(factura.Concepto ?? "Servicio de construcción")}\nVence: {vence}",
                AdjuntoUrl    = req.PdfBase64 ?? null,        // base64 del PDF generado en frontend
                AdjuntoNombre = !string.IsNullOrEmpty(req.PdfBase64)
                                    ? $"{factura.Numero}.pdf"
                                    : null,
                FechaEnvio    = DateTime.UtcNow,
                Leido         = false,
            };
            await _uow.Mensajes.AddAsync(msg);
        }

        await _uow.Facturas.UpdateAsync(factura);
        await _uow.SaveChangesAsync();

        return Ok(new { message = "Factura distribuida correctamente.", factura.FechaEnvioEmail, factura.FechaEnvioChat });
    }

    // ── DELETE /api/facturas/{id}/pagos/{pagoId}  ─────────────────────────────
    [HttpDelete("{id}/pagos/{pagoId}")]
    public async Task<IActionResult> EliminarPago(int id, int pagoId)
    {
        var pago = await _uow.PagosFactura.GetByIdAsync(pagoId);
        if (pago is null || pago.FacturaId != id) return NotFound();

        var factura = await _uow.Facturas.GetByIdAsync(id);
        if (factura is null) return NotFound();

        var perfil = await GetPerfil();
        if (perfil is null || factura.ConstructorId != perfil.Id) return Forbid();

        factura.MontoPagado = Math.Max(0, factura.MontoPagado - pago.Monto);
        RecalcularEstado(factura);

        await _uow.PagosFactura.DeleteAsync(pago);
        await _uow.Facturas.UpdateAsync(factura);
        await _uow.SaveChangesAsync();

        return NoContent();
    }

    // ── Helpers de email ──────────────────────────────────────────────────────

    private async Task EnviarEmailFacturaEmitida(Factura factura, Proyecto? proyecto)
    {
        if (proyecto is null) return;
        var cliente = await _users.FindByIdAsync(proyecto.ClienteId.ToString());
        if (cliente?.Email is null) return;

        await _email.EnviarAsync(new EmailMessage(
            Para:        cliente.Email,
            Asunto:      $"Nueva factura {factura.Numero} — {proyecto.Titulo}",
            HtmlBody:    EmailTemplates.FacturaEmitida(
                             clienteNombre:    cliente.Nombre,
                             numFactura:       factura.Numero,
                             proyectoTitulo:   proyecto.Titulo,
                             monto:            factura.MontoTotal,
                             fechaVencimiento: factura.FechaVencimiento,
                             urlAccion:        $"/facturas"),
            Evento:      "factura_emitida",
            ReferenciaId: factura.Id,
            UsuarioId:   proyecto.ClienteId
        ));
    }

    private async Task EnviarEmailPagoRecibido(Factura factura, PagoFactura pago, PerfilConstructor perfil)
    {
        var constructor = await _users.FindByIdAsync(perfil.UsuarioId.ToString());
        if (constructor?.Email is null) return;

        var proyecto = await _uow.Proyectos.GetByIdAsync(factura.ProyectoId);

        await _email.EnviarAsync(new EmailMessage(
            Para:        constructor.Email,
            Asunto:      $"Pago recibido — Factura {factura.Numero}",
            HtmlBody:    EmailTemplates.PagoRecibido(
                             constructorNombre: perfil.NombreEmpresa,
                             numFactura:        factura.Numero,
                             montoPago:         pago.Monto,
                             proyectoTitulo:    proyecto?.Titulo ?? "Proyecto",
                             urlAccion:         $"/facturas"),
            Evento:      "pago_recibido",
            ReferenciaId: factura.Id,
            UsuarioId:   perfil.UsuarioId
        ));
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    private async Task<PerfilConstructor?> GetPerfil()
    {
        var perfiles = await _uow.PerfilesConstructor.FindAsync(p => p.UsuarioId == UserId);
        return perfiles.FirstOrDefault();
    }

    private async Task<bool> TieneAcceso(int proyectoId)
    {
        var proyecto = await _uow.Proyectos.GetByIdAsync(proyectoId);
        if (proyecto is null) return false;

        // Cliente dueño
        if (proyecto.ClienteId == UserId) return true;

        // Constructor asignado
        var perfiles = await _uow.PerfilesConstructor.FindAsync(p => p.UsuarioId == UserId);
        var perfil   = perfiles.FirstOrDefault();
        if (perfil is null) return false;

        var propuestas = await _uow.Propuestas.FindAsync(p =>
            p.ProyectoId == proyectoId && p.ConstructorId == perfil.Id);
        return propuestas.Any();
    }

    private static void RecalcularEstado(Factura f)
    {
        if (f.Estado == EstadoFactura.Cancelada) return;

        if (f.MontoPagado >= f.MontoTotal)
        {
            f.Estado = EstadoFactura.Pagada;
            return;
        }

        if (f.MontoPagado > 0)
        {
            f.Estado = EstadoFactura.PagoParcial;
            return;
        }

        if (f.FechaVencimiento.HasValue && f.FechaVencimiento.Value < DateTime.UtcNow)
        {
            f.Estado = EstadoFactura.Vencida;
            return;
        }

        f.Estado = EstadoFactura.Enviada;
    }

    private static object Map(Factura f, Dictionary<int, Proyecto> proyMap)
    {
        proyMap.TryGetValue(f.ProyectoId, out var proyecto);
        return new
        {
            f.Id,
            f.Numero,
            f.ProyectoId,
            f.PropuestaId,
            f.ConstructorId,
            f.Concepto,
            f.Notas,
            f.MontoTotal,
            f.MontoPagado,
            Saldo          = f.MontoTotal - f.MontoPagado,
            f.Estado,
            f.FechaEmision,
            f.FechaVencimiento,
            f.FechaEnvioEmail,
            f.FechaEnvioChat,
            f.LineasJson,
            f.AplicaIVA,
            f.MontoIVA,
            f.MontoDescuento,
            ProyectoTitulo = proyecto?.Titulo,
        };
    }

    private static object MapPago(PagoFactura p) => new
    {
        p.Id,
        p.FacturaId,
        p.Monto,
        p.Fecha,
        p.MetodoPago,
        p.Referencia,
        p.Notas,
    };
}

// ── Records ───────────────────────────────────────────────────────────────────
public record FacturaRequest(
    int       ProyectoId,
    int?      PropuestaId,
    string    Concepto,
    decimal   MontoTotal,
    DateTime? FechaVencimiento,
    string?   Notas,
    string?   LineasJson,
    bool      AplicaIVA,
    decimal   MontoIVA,
    decimal   MontoDescuento
);

public record FacturaUpdateRequest(
    string?   Concepto,
    decimal   MontoTotal,
    DateTime? FechaVencimiento,
    string?   Notas
);

public record PagoRequest(
    decimal   Monto,
    MetodoPago MetodoPago,
    DateTime? Fecha,
    string?   Referencia,
    string?   Notas
);

public record EnviarFacturaRequest(
    bool    PorEmail,
    bool    PorChat,
    string? PdfBase64 = null   // base64 del PDF generado en el cliente (data:application/pdf;base64,...)
);
