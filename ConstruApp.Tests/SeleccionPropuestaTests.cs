using System.Text.Json;
using ConstruApp.API.Controllers;
using ConstruApp.API.Services;
using ConstruApp.Core.Entities;
using ConstruApp.Core.Enums;
using ConstruApp.Infrastructure.Data;
using ConstruApp.Infrastructure.Repositories;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace ConstruApp.Tests.Unit;

public sealed class SeleccionPropuestaTests
{
    [Fact]
    public async Task SelectionAssignsWorkAndNotifiesBothPartiesOnlyOnce()
    {
        using var db = CrearDatos();
        var controller = Seleccion(db);

        Assert.IsType<OkObjectResult>(await controller.Seleccionar(1, new(10)));
        db.ChangeTracker.Clear();
        Assert.Equal(EstadoProyecto.EnCurso, (await db.Proyectos.FindAsync(1))!.Estado);
        var propuesta = (await db.Propuestas.FindAsync(10))!;
        Assert.Equal(EstadoPropuesta.Aceptada, propuesta.Estado);
        Assert.NotNull(propuesta.FechaRespuesta);

        Assert.IsType<OkObjectResult>(await controller.Seleccionar(1, new(10)));
        Assert.IsType<ConflictObjectResult>(await controller.Seleccionar(1, new(11)));
        Assert.Equal(new[] { 7, 21 }, await db.Notificaciones.OrderBy(n => n.UsuarioId).Select(n => n.UsuarioId).ToArrayAsync());
        Assert.All(await db.Notificaciones.ToListAsync(), n => Assert.Equal("/obra/1", n.UrlDestino));
        Assert.Single(await db.AuditoriaLogs.ToListAsync());
        Assert.Equal(EstadoPropuesta.Enviada, (await db.Propuestas.FindAsync(11))!.Estado);
    }

    [Theory]
    [InlineData(null)]
    [InlineData(0)]
    public async Task EmptySelectionPromptsWithoutChangingProject(int? id)
    {
        using var db = CrearDatos();
        var result = Assert.IsType<BadRequestObjectResult>(await Seleccion(db).Seleccionar(1, new(id)));
        Assert.Contains("Elegí", JsonSerializer.Serialize(result.Value, new JsonSerializerOptions
        {
            Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping,
        }));
        Assert.Equal(EstadoProyecto.EnPropuestas, (await db.Proyectos.FindAsync(1))!.Estado);
        Assert.Empty(await db.Notificaciones.ToListAsync());
    }

    [Fact]
    public async Task AnotherClientOrProposalFromDifferentProjectCannotAssignWork()
    {
        using var db = CrearDatos();
        Assert.IsType<ForbidResult>(await Seleccion(db, 99).Seleccionar(1, new(10)));
        Assert.IsType<NotFoundObjectResult>(await Seleccion(db).Seleccionar(1, new(12)));
        Assert.Empty(await db.Notificaciones.ToListAsync());
    }

    [Fact]
    public async Task NotificationEndpointsAreScopedToTheRecipient()
    {
        using var db = CrearDatos();
        Assert.IsType<OkObjectResult>(await Seleccion(db).Seleccionar(1, new(10)));
        var constructor = await db.Notificaciones.SingleAsync(n => n.UsuarioId == 21);
        var controller = new NotificacionesController(new UnitOfWork(db)) { ControllerContext = Contexto(7) };
        var result = Assert.IsType<OkObjectResult>(await controller.Listar());
        var lista = JsonSerializer.SerializeToElement(result.Value);
        Assert.Equal(1, lista.GetArrayLength());
        Assert.IsType<NotFoundResult>(await controller.MarcarLeida(constructor.Id));
        Assert.False(constructor.Leida);
    }

    [Fact]
    public async Task OnlyProjectOwnerCanRejectPendingProposal()
    {
        using var db = CrearDatos();
        var controller = new EstadoPropuestaController(new UnitOfWork(db)) { ControllerContext = Contexto(99) };
        Assert.IsType<ForbidResult>(await controller.CambiarEstado(10, new("Rechazada")));
        controller.ControllerContext = Contexto(7);
        Assert.IsType<BadRequestObjectResult>(await controller.CambiarEstado(10, new("Aceptada")));
        Assert.IsType<NoContentResult>(await controller.CambiarEstado(10, new("Rechazada")));
        db.ChangeTracker.Clear();
        var propuesta = (await db.Propuestas.FindAsync(10))!;
        Assert.Equal(EstadoPropuesta.Rechazada, propuesta.Estado);
        Assert.NotNull(propuesta.FechaRespuesta);
        Assert.IsType<NoContentResult>(await controller.CambiarEstado(10, new("Rechazada")));
        Assert.IsType<ConflictObjectResult>(await Seleccion(db).Seleccionar(1, new(10)));
        Assert.Equal(EstadoProyecto.EnPropuestas, (await db.Proyectos.FindAsync(1))!.Estado);
        Assert.Single(await db.AuditoriaLogs.ToListAsync());
    }

    [Fact]
    public async Task OnlyAssignedConstructorCanFinalizeAcceptedProposalAndProject()
    {
        using var db = CrearDatos();
        var controller = new EstadoPropuestaController(new UnitOfWork(db)) { ControllerContext = Contexto(21, "Constructor") };
        Assert.IsType<ConflictObjectResult>(await controller.Finalizar(10));
        Assert.IsType<OkObjectResult>(await Seleccion(db).Seleccionar(1, new(10)));
        Assert.IsType<ConflictObjectResult>(await controller.Finalizar(11));
        controller.ControllerContext = Contexto(99, "Constructor");
        Assert.IsType<ForbidResult>(await controller.Finalizar(10));
        controller.ControllerContext = Contexto(21, "Constructor");
        Assert.IsType<NoContentResult>(await controller.Finalizar(10));
        db.ChangeTracker.Clear();
        Assert.Equal(EstadoPropuesta.Finalizada, (await db.Propuestas.FindAsync(10))!.Estado);
        Assert.Equal(EstadoProyecto.Completado, (await db.Proyectos.FindAsync(1))!.Estado);
        Assert.IsType<NoContentResult>(await controller.Finalizar(10));
        Assert.Equal(1, await db.AuditoriaLogs.CountAsync(a => a.Accion == "FinalizarObra"));
    }

    [Theory]
    [InlineData(true)]
    [InlineData(false)]
    public async Task AdminCompletionFinalizesAcceptedProposalWhenPresent(bool tienePropuestaAceptada)
    {
        using var db = CrearDatos();
        if (tienePropuestaAceptada)
            Assert.IsType<OkObjectResult>(await Seleccion(db).Seleccionar(1, new(10)));
        else
        {
            (await db.Proyectos.FindAsync(1))!.Estado = EstadoProyecto.EnCurso;
            await db.SaveChangesAsync();
        }

        var fechaRespuesta = (await db.Propuestas.FindAsync(10))!.FechaRespuesta;
        db.ChangeTracker.Clear();
        var controller = new ProyectosController(new UnitOfWork(db), new AuditoriaService(db),
            Options.Create(new CotizacionRequisitosOptions())) { ControllerContext = Contexto(99, "Admin") };

        Assert.IsType<OkObjectResult>(await controller.CambiarEstado(1, new("Completado")));
        db.ChangeTracker.Clear();
        Assert.Equal(EstadoProyecto.Completado, (await db.Proyectos.FindAsync(1))!.Estado);
        var propuesta = (await db.Propuestas.FindAsync(10))!;
        Assert.Equal(tienePropuestaAceptada ? EstadoPropuesta.Finalizada : EstadoPropuesta.Enviada, propuesta.Estado);
        Assert.Equal(fechaRespuesta, propuesta.FechaRespuesta);
        Assert.Equal(EstadoPropuesta.Enviada, (await db.Propuestas.FindAsync(11))!.Estado);
    }

    private static SeleccionPropuestaController Seleccion(AppDbContext db, int usuario = 7) =>
        new(new UnitOfWork(db)) { ControllerContext = Contexto(usuario) };

    private static ControllerContext Contexto(int usuario, string rol = "Cliente") =>
        new() { HttpContext = new DefaultHttpContext { User = ComparacionCotizacionesTests.User(usuario, rol) } };

    private static AppDbContext CrearDatos()
    {
        var db = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);
        db.Proyectos.AddRange(
            new Proyecto { Id = 1, ClienteId = 7, Titulo = "Casa", Estado = EstadoProyecto.EnPropuestas },
            new Proyecto { Id = 2, ClienteId = 7, Titulo = "Otro", Estado = EstadoProyecto.EnPropuestas });
        db.PerfilesConstructor.Add(new PerfilConstructor { Id = 4, UsuarioId = 21 });
        db.Propuestas.AddRange(
            new Propuesta { Id = 10, ProyectoId = 1, ConstructorId = 4 },
            new Propuesta { Id = 11, ProyectoId = 1, ConstructorId = 4 },
            new Propuesta { Id = 12, ProyectoId = 2, ConstructorId = 4 });
        db.SaveChanges();
        return db;
    }
}
