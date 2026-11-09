using System.Text.Json;
using ConstruApp.API.Controllers;
using ConstruApp.API.Services;
using ConstruApp.Core.Entities;
using ConstruApp.Core.Interfaces;
using ConstruApp.Infrastructure.Data;
using ConstruApp.Infrastructure.Repositories;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;

namespace ConstruApp.Tests.Unit;

public sealed class RevisionPr19Tests
{
    [Fact]
    public async Task ArchivarSoloActualizaEstadoYConservaEdicionesConcurrentesDelGrafo()
    {
        using var f = new Fixture();
        f.Db.CotizacionesIA.Add(new CotizacionIA { Id = 1, ProyectoId = 1, GeneradoPorId = 7,
            Lineas = [new() { Id = 1, Descripcion = "Material", PrecioTotal = 100 }] });
        await f.Db.SaveChangesAsync();
        f.Db.ChangeTracker.Clear();
        var uow = new Mock<IUnitOfWork>();
        uow.SetupGet(x => x.CotizacionesIA).Returns(f.Uow.CotizacionesIA);
        uow.Setup(x => x.SaveChangesAsync()).Returns(async () => {
            var entry = Assert.Single(f.Db.ChangeTracker.Entries(), e => e.State == EntityState.Modified);
            Assert.IsType<CotizacionIA>(entry.Entity);
            Assert.Equal(new[] { "Estado" }, entry.Properties.Where(p => p.IsModified).Select(p => p.Metadata.Name));
            using var paralelo = new AppDbContext(f.Options);
            (await paralelo.Proyectos.FindAsync(1))!.Descripcion = "Descripción nueva confirmada";
            (await paralelo.Users.FindAsync(7))!.Nombre = "Nombre actualizado";
            (await paralelo.LineasCotizacion.FindAsync(1))!.PrecioTotal = 250;
            await paralelo.SaveChangesAsync();
            return await f.Db.SaveChangesAsync();
        });
        var controller = new CotizacionIAController(uow.Object) { ControllerContext = Contexto(7) };
        Assert.IsType<NoContentResult>(await controller.CambiarEstado(1, new("Archivada")));
        f.Db.ChangeTracker.Clear();
        Assert.Equal("Descripción nueva confirmada", (await f.Db.Proyectos.FindAsync(1))!.Descripcion);
        Assert.Equal("Nombre actualizado", (await f.Db.Users.FindAsync(7))!.Nombre);
        Assert.Equal(250, (await f.Db.LineasCotizacion.FindAsync(1))!.PrecioTotal);
        Assert.Equal("Archivada", (await f.Db.CotizacionesIA.FindAsync(1))!.Estado);
    }

    [Fact]
    public async Task EditarEstadoRequiereAutorOAdminIncluyendoRegistrosAntiguos()
    {
        using var f = new Fixture();
        f.Db.CotizacionesIA.AddRange(
            new() { Id = 1, ProyectoId = 1, GeneradoPorId = 21 },
            new() { Id = 2, ProyectoId = 1, GeneradoPorId = 7 },
            new() { Id = 3, ProyectoId = 1 });
        await f.Db.SaveChangesAsync();
        f.Db.ChangeTracker.Clear();
        var controller = new CotizacionIAController(f.Uow) { ControllerContext = Contexto(7) };
        Assert.IsType<ForbidResult>(await controller.CambiarEstado(1, new("Archivada")));
        Assert.IsType<ForbidResult>(await controller.CambiarEstado(3, new("Archivada")));
        Assert.False(Json(await controller.GetById(1)).GetProperty("puedeCambiarEstado").GetBoolean());
        Assert.IsType<NoContentResult>(await controller.CambiarEstado(2, new("Archivada")));
        controller.ControllerContext = Contexto(21, "Constructor");
        Assert.IsType<NoContentResult>(await controller.CambiarEstado(1, new("Archivada")));
        Assert.IsType<NoContentResult>(await controller.CambiarEstado(1, new("Activa")));
        controller.ControllerContext = Contexto(99, "Admin");
        Assert.IsType<NoContentResult>(await controller.CambiarEstado(3, new("Archivada")));
        controller.ControllerContext = Contexto(99);
        Assert.IsType<NotFoundResult>(await controller.CambiarEstado(1, new("Activa")));
    }

    [Fact]
    public async Task ConversionConcurrenteImpideArchivarConEstadoAnterior()
    {
        using var f = new Fixture();
        f.Db.CotizacionesIA.Add(new() { Id = 1, ProyectoId = 1, GeneradoPorId = 21 });
        await f.Db.SaveChangesAsync();
        f.Db.ChangeTracker.Clear();
        var uow = new Mock<IUnitOfWork>();
        uow.SetupGet(x => x.CotizacionesIA).Returns(f.Uow.CotizacionesIA);
        uow.Setup(x => x.SaveChangesAsync()).Returns(async () => {
            using var paralelo = new AppDbContext(f.Options);
            var convertida = (await paralelo.CotizacionesIA.FindAsync(1))!;
            convertida.PropuestaId = 3;
            convertida.Estado = "ConvertidaPropuesta";
            await paralelo.SaveChangesAsync();
            return await f.Db.SaveChangesAsync();
        });
        var controller = new CotizacionIAController(uow.Object) { ControllerContext = Contexto(21, "Constructor") };
        Assert.IsType<ConflictObjectResult>(await controller.CambiarEstado(1, new("Archivada")));
        f.Db.ChangeTracker.Clear();
        Assert.Equal("ConvertidaPropuesta", (await f.Db.CotizacionesIA.FindAsync(1))!.Estado);
        Assert.Equal(3, (await f.Db.CotizacionesIA.FindAsync(1))!.PropuestaId);
    }

    [Fact]
    public async Task ArchivarAntesDeConvertirInvalidaLaLecturaAnterior()
    {
        using var f = new Fixture();
        f.Db.CotizacionesIA.Add(new() { Id = 1, ProyectoId = 1, GeneradoPorId = 21 });
        await f.Db.SaveChangesAsync();
        f.Db.ChangeTracker.Clear();
        var leidaParaConvertir = (await f.Db.CotizacionesIA.FindAsync(1))!;
        using var paralelo = new AppDbContext(f.Options);
        (await paralelo.CotizacionesIA.FindAsync(1))!.Estado = "Archivada";
        await paralelo.SaveChangesAsync();
        leidaParaConvertir.Estado = "ConvertidaPropuesta";
        await Assert.ThrowsAsync<DbUpdateConcurrencyException>(() => f.Db.SaveChangesAsync());
    }

    [Fact]
    public async Task DetalleSeparaGeneracionesYRespetaHistoricoYRegistrosSinGrupo()
    {
        using var f = new Fixture();
        var anterior = Guid.NewGuid();
        var actual = Guid.NewGuid();
        for (var i = 1; i <= 6; i++)
            f.Db.CotizacionesIA.Add(new() { Id = i, ProyectoId = 1, GeneradoPorId = 21,
                Plan = new[] { "economico", "estandar", "premium" }[(i - 1) % 3],
                GeneracionId = i <= 3 ? anterior : actual,
                Version = i, FechaGeneracion = new DateTime(2026, 11, 9).AddMinutes(i) });
        f.Db.CotizacionesIA.AddRange(
            new() { Id = 7, ProyectoId = 1, GeneradoPorId = 21, FechaGeneracion = new DateTime(2025, 1, 1) },
            new() { Id = 8, ProyectoId = 1, GeneradoPorId = 21, FechaGeneracion = new DateTime(2025, 1, 1) });
        await f.Db.SaveChangesAsync();
        var controller = new CotizacionIAController(f.Uow) { ControllerContext = Contexto(7) };
        var latest = Json(await controller.PorProyecto(1));
        Assert.Equal(new[] { 4, 5, 6 }, latest.EnumerateArray().Select(p => p.GetProperty("id").GetInt32()));
        var historico = Json(await controller.PorProyecto(1, 3));
        Assert.Equal(new[] { 1, 2, 3 }, historico.EnumerateArray().Select(p => p.GetProperty("id").GetInt32()));
        Assert.Equal(7, Json(await controller.PorProyecto(1, 7))[0].GetProperty("id").GetInt32());
        Assert.Equal(1, Json(await controller.PorProyecto(1, 8)).GetArrayLength());
        Assert.IsType<NotFoundResult>(await controller.PorProyecto(2, 3));
        controller.ControllerContext = Contexto(99);
        Assert.IsType<NotFoundResult>(await controller.PorProyecto(1, 3));
    }

    [Fact]
    public async Task DocumentoDesactualizadoExigeRevisionYConservaContenidoHastaConfirmar()
    {
        using var f = new Fixture();
        f.Db.Archivos.Add(new() { Id = 1, ProyectoId = 1, NombreArchivo = "Plano.pdf",
            Categoria = "Planos", Descripcion = "Original", Version = 1, Url = "/uploads/plano.pdf" });
        await f.Db.SaveChangesAsync();
        var env = new Mock<IWebHostEnvironment>();
        var controller = new DocumentosController(f.Uow, new AccesoProyectoService(f.Uow), env.Object,
            NullLogger<DocumentosController>.Instance) { ControllerContext = Contexto(7) };
        var req = new DocumentoRequest(1, "Plano.pdf", null, null, "Planos", "Edición del primer usuario", 1);
        Assert.IsType<BadRequestObjectResult>(await controller.Actualizar(1, req with { Version = null }));
        Assert.IsType<OkObjectResult>(await controller.Actualizar(1, req));
        f.Db.ChangeTracker.Clear();
        Assert.IsType<ConflictObjectResult>(await controller.Actualizar(1,
            req with { NombreArchivo = "Renombrado.pdf", Descripcion = "Original", Base64 = "archivo-inválido" }));
        var actual = Json(await controller.Obtener(1));
        Assert.Equal(2, actual.GetProperty("version").GetInt32());
        Assert.Equal("Edición del primer usuario", actual.GetProperty("descripcion").GetString());
        Assert.Equal("/uploads/plano.pdf", (await f.Db.Archivos.FindAsync(1))!.Url);
        Assert.IsType<OkObjectResult>(await controller.Actualizar(1,
            req with { NombreArchivo = "Renombrado.pdf", Version = 2 }));
        Assert.Equal(3, (await f.Db.Archivos.FindAsync(1))!.Version);
    }

    private static JsonElement Json(IActionResult r) =>
        JsonSerializer.SerializeToElement(Assert.IsType<OkObjectResult>(r).Value, JsonSerializerOptions.Web);
    private static ControllerContext Contexto(int id, string rol = "Cliente") => new()
        { HttpContext = new DefaultHttpContext { User = ComparacionCotizacionesTests.User(id, rol) } };

    private sealed class Fixture : IDisposable
    {
        public DbContextOptions<AppDbContext> Options { get; } = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options;
        public AppDbContext Db { get; }
        public UnitOfWork Uow { get; }
        public Fixture()
        {
            Db = new(Options); Uow = new(Db);
            Db.Users.Add(new Usuario { Id = 7, Nombre = "Cliente de ensayo" });
            Db.Proyectos.Add(new Proyecto { Id = 1, ClienteId = 7 });
            Db.SaveChanges();
        }
        public void Dispose() => Db.Dispose();
    }
}
