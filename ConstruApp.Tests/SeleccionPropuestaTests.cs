using System.Text.Json;
using ConstruApp.API.Controllers;
using ConstruApp.Core.Entities;
using ConstruApp.Core.Enums;
using ConstruApp.Infrastructure.Data;
using ConstruApp.Infrastructure.Repositories;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

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

    private static SeleccionPropuestaController Seleccion(AppDbContext db, int usuario = 7) =>
        new(new UnitOfWork(db)) { ControllerContext = Contexto(usuario) };

    private static ControllerContext Contexto(int usuario) =>
        new() { HttpContext = new DefaultHttpContext { User = ComparacionCotizacionesTests.User(usuario) } };

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
