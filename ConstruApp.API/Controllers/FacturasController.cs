using System.Security.Claims;
using ConstruApp.API.Services;
using ConstruApp.Core.Entities;
using ConstruApp.Core.Enums;
using ConstruApp.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ConstruApp.API.Controllers;

[ApiController]
[Route("api/facturas")]
[Authorize]
public sealed class FacturasController(
    IUnitOfWork uow,
    IAuditoriaService auditoria,
    ILogger<FacturasController> logger) : ControllerBase
{
    private int    UserId   => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    private string UserName => User.FindFirstValue("nombre") ?? "";
    private bool   EsConstructor => User.IsInRole("Constructor") || User.IsInRole("Admin");

    // ── GET /api/facturas ─────────────────────────────────────────────────────
    [HttpGet]
    public async Task<IActionResult> GetMias(CancellationToken ct)
    {
        var userId = UserId;

        IEnumerable<Factura> facturas;

        if (EsConstructor)
        {
            var perfil = (await uow.PerfilesConstructor.FindAsync(p => p.UsuarioId == userId)).FirstOrDefault();
            if (perfil is null) return Ok(new List<object>());
            facturas = await uow.Facturas.FindAsync(f => f.ConstructorId == perfil.Id);
        }
        else
        {
            // Cliente ve las facturas de sus proyectos
            var proyectos = await uow.Proyectos.FindAsync(p => p.ClienteId == userId);
            var ids = proyectos.Select(p => p.Id).ToHashSet();
            facturas = await uow.Facturas.FindAsync(f => ids.Contains(f.ProyectoId));
        }

        var result = facturas.OrderByDescending(f => f.FechaEmision).Select(f => new
        {
            f.Id, f.Numero, f.Concepto, f.FechaEmision, f.FechaVencimiento,
            f.MontoTotal, f.MontoPagado, saldo = f.Saldo,
            estado = f.Estado.ToString(),
            f.ProyectoId, f.ConstructorId,
        });

        return Ok(result);
    }

    // ── GET /api/facturas/proyecto/{pid} ──────────────────────────────────────
    [HttpGet("proyecto/{pid:int}")]
    public async Task<IActionResult> GetByProyecto(int pid, CancellationToken ct)
    {
        var facturas = await uow.Facturas.FindAsync(f => f.ProyectoId == pid);
        var result = facturas.OrderByDescending(f => f.FechaEmision).Select(f => new
        {
            f.Id, f.Numero, f.Concepto, f.FechaEmision, f.FechaVencimiento,
            f.MontoTotal, f.MontoPagado, saldo = f.Saldo,
            estado = f.Estado.ToString(),
            f.ProyectoId, f.ConstructorId,
        });
        return Ok(result);
    }

    // ── GET /api/facturas/{id} ────────────────────────────────────────────────
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id, CancellationToken ct)
    {
        var factura = await uow.Facturas.GetByIdAsync(id);
        if (factura is null) return NotFound(new { message = "Factura no encontrada." });

        // Cargar proyecto para el título
        var proyecto = await uow.Proyectos.GetByIdAsync(factura.ProyectoId);

        var pagos = await uow.PagosFactura.FindAsync(p => p.FacturaId == id);

        return Ok(new
        {
            factura = new
            {
                factura.Id, factura.Numero, factura.Concepto, factura.Notas,
                factura.FechaEmision, factura.FechaVencimiento,
                factura.MontoTotal, factura.MontoPagado, saldo = factura.Saldo,
                estado = factura.Estado.ToString(),
                factura.AplicaIVA, factura.MontoIVA, factura.MontoDescuento,
                factura.LineasJson,
                factura.FechaEnvioEmail, factura.FechaEnvioChat,
                factura.ProyectoId, factura.ConstructorId, factura.PropuestaId,
                proyectoTitulo = proyecto?.Titulo,
            },
            pagos = pagos.OrderBy(p => p.Fecha).Select(p => new
            {
                p.Id, p.Monto, p.Fecha,
                metodoPago = p.MetodoPago.ToString(),
                p.Referencia, p.Notas,
            }),
        });
    }

    // ── POST /api/facturas ────────────────────────────────────────────────────
    [HttpPost]
    [Authorize(Roles = "Constructor,Admin")]
    public async Task<IActionResult> Create([FromBody] FacturaRequest body, CancellationToken ct)
    {
        var userId = UserId;
        var perfil = (await uow.PerfilesConstructor.FindAsync(p => p.UsuarioId == userId)).FirstOrDefault();
        if (perfil is null) return BadRequest(new { message = "Perfil de constructor no encontrado." });

        // Generar número correlativo
        var existentes = await uow.Facturas.FindAsync(f => f.ConstructorId == perfil.Id);
        var siguiente  = existentes.Count() + 1;
        var numero     = $"FAC-{DateTime.UtcNow.Year}-{siguiente:D4}";

        var factura = new Factura
        {
            ProyectoId      = body.ProyectoId,
            PropuestaId     = body.PropuestaId,
            ConstructorId   = perfil.Id,
            Numero          = numero,
            Concepto        = body.Concepto,
            Notas           = body.Notas,
            FechaEmision    = DateTime.UtcNow,
            FechaVencimiento = body.FechaVencimiento,
            MontoTotal      = body.MontoTotal,
            MontoPagado     = 0,
            Estado          = EstadoFactura.Enviada,
            AplicaIVA       = body.AplicaIVA,
            MontoIVA        = body.MontoIVA,
            MontoDescuento  = body.MontoDescuento,
            LineasJson      = body.LineasJson,
        };

        await uow.Facturas.AddAsync(factura);
        await uow.SaveChangesAsync();

        await auditoria.RegistrarAsync(userId, UserName, "CrearFactura", "Facturas", factura.Id.ToString(),
            $"Factura {numero} por ₡{body.MontoTotal:N0}");

        return CreatedAtAction(nameof(GetById), new { id = factura.Id }, new { factura.Id, factura.Numero });
    }

    // ── PUT /api/facturas/{id} ────────────────────────────────────────────────
    [HttpPut("{id:int}")]
    [Authorize(Roles = "Constructor,Admin")]
    public async Task<IActionResult> Update(int id, [FromBody] FacturaRequest body, CancellationToken ct)
    {
        var factura = await uow.Facturas.GetByIdAsync(id);
        if (factura is null) return NotFound(new { message = "Factura no encontrada." });

        if (factura.Estado == EstadoFactura.Cancelada)
            return BadRequest(new { message = "No se puede editar una factura cancelada." });

        factura.Concepto        = body.Concepto;
        factura.Notas           = body.Notas;
        factura.FechaVencimiento = body.FechaVencimiento;
        factura.MontoTotal      = body.MontoTotal;
        factura.AplicaIVA       = body.AplicaIVA;
        factura.MontoIVA        = body.MontoIVA;
        factura.MontoDescuento  = body.MontoDescuento;
        factura.LineasJson      = body.LineasJson;

        await uow.Facturas.UpdateAsync(factura);
        await uow.SaveChangesAsync();

        return Ok(new { message = "Factura actualizada." });
    }

    // ── DELETE /api/facturas/{id} → cancelar ──────────────────────────────────
    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Constructor,Admin")]
    public async Task<IActionResult> Cancelar(int id, CancellationToken ct)
    {
        var factura = await uow.Facturas.GetByIdAsync(id);
        if (factura is null) return NotFound(new { message = "Factura no encontrada." });

        if (factura.Estado == EstadoFactura.Cancelada)
            return BadRequest(new { message = "La factura ya está cancelada." });

        factura.Estado = EstadoFactura.Cancelada;
        await uow.Facturas.UpdateAsync(factura);
        await uow.SaveChangesAsync();

        await auditoria.RegistrarAsync(UserId, UserName, "CancelarFactura", "Facturas", id.ToString(), "Factura cancelada");

        return Ok(new { message = "Factura cancelada." });
    }

    // ── POST /api/facturas/{id}/pagos ─────────────────────────────────────────
    [HttpPost("{id:int}/pagos")]
    [Authorize(Roles = "Constructor,Admin")]
    public async Task<IActionResult> RegistrarPago(int id, [FromBody] PagoRequest body, CancellationToken ct)
    {
        var factura = await uow.Facturas.GetByIdAsync(id);
        if (factura is null) return NotFound(new { message = "Factura no encontrada." });

        if (factura.Estado == EstadoFactura.Cancelada)
            return BadRequest(new { message = "No se puede registrar pago en una factura cancelada." });

        if (!Enum.TryParse<MetodoPago>(body.MetodoPago, out var metodo))
            metodo = MetodoPago.Transferencia;

        var pago = new PagoFactura
        {
            FacturaId  = id,
            Monto      = body.Monto,
            Fecha      = body.Fecha ?? DateTime.UtcNow,
            MetodoPago = metodo,
            Referencia = body.Referencia,
            Notas      = body.Notas,
        };

        factura.MontoPagado += body.Monto;
        factura.Estado = factura.MontoPagado >= factura.MontoTotal
            ? EstadoFactura.Pagada
            : EstadoFactura.PagoParcial;

        await uow.PagosFactura.AddAsync(pago);
        await uow.Facturas.UpdateAsync(factura);
        await uow.SaveChangesAsync();

        await auditoria.RegistrarAsync(UserId, UserName, "RegistrarPago", "Facturas", id.ToString(),
            $"Pago ₡{body.Monto:N0} vía {metodo}");

        return Ok(new { message = "Pago registrado.", estado = factura.Estado.ToString() });
    }

    // ── DELETE /api/facturas/{id}/pagos/{pagoId} ──────────────────────────────
    [HttpDelete("{id:int}/pagos/{pagoId:int}")]
    [Authorize(Roles = "Constructor,Admin")]
    public async Task<IActionResult> EliminarPago(int id, int pagoId, CancellationToken ct)
    {
        var factura = await uow.Facturas.GetByIdAsync(id);
        if (factura is null) return NotFound(new { message = "Factura no encontrada." });

        var pagos   = await uow.PagosFactura.FindAsync(p => p.Id == pagoId && p.FacturaId == id);
        var pago    = pagos.FirstOrDefault();
        if (pago is null) return NotFound(new { message = "Pago no encontrado." });

        factura.MontoPagado = Math.Max(0, factura.MontoPagado - pago.Monto);
        factura.Estado = factura.MontoPagado <= 0
            ? EstadoFactura.Enviada
            : factura.MontoPagado >= factura.MontoTotal
                ? EstadoFactura.Pagada
                : EstadoFactura.PagoParcial;

        await uow.PagosFactura.DeleteAsync(pago);
        await uow.Facturas.UpdateAsync(factura);
        await uow.SaveChangesAsync();

        return Ok(new { message = "Pago eliminado.", estado = factura.Estado.ToString() });
    }

    // ── POST /api/facturas/{id}/enviar ────────────────────────────────────────
    [HttpPost("{id:int}/enviar")]
    [Authorize(Roles = "Constructor,Admin")]
    public async Task<IActionResult> Enviar(int id, [FromBody] EnviarRequest body, CancellationToken ct)
    {
        var factura = await uow.Facturas.GetByIdAsync(id);
        if (factura is null) return NotFound(new { message = "Factura no encontrada." });

        if (body.PorEmail) factura.FechaEnvioEmail = DateTime.UtcNow;
        if (body.PorChat)  factura.FechaEnvioChat  = DateTime.UtcNow;

        if (factura.Estado == EstadoFactura.Borrador)
            factura.Estado = EstadoFactura.Enviada;

        await uow.Facturas.UpdateAsync(factura);
        await uow.SaveChangesAsync();

        await auditoria.RegistrarAsync(UserId, UserName, "EnviarFactura", "Facturas", id.ToString(),
            $"Distribuida: email={body.PorEmail}, chat={body.PorChat}");

        return Ok(new { message = "Factura distribuida." });
    }

    // ── DTOs ──────────────────────────────────────────────────────────────────
    public sealed record FacturaRequest(
        int      ProyectoId,
        int?     PropuestaId,
        string?  Concepto,
        string?  Notas,
        DateTime? FechaVencimiento,
        decimal  MontoTotal,
        bool     AplicaIVA,
        decimal  MontoIVA,
        decimal  MontoDescuento,
        string?  LineasJson
    );

    public sealed record PagoRequest(
        decimal   Monto,
        string    MetodoPago,
        DateTime? Fecha,
        string?   Referencia,
        string?   Notas
    );

    public sealed record EnviarRequest(bool PorEmail, bool PorChat, string? PdfBase64);
}
