using System.Security.Claims;
using ConstruApp.API.Controllers;
using ConstruApp.API.DTOs.Historial;
using ConstruApp.API.Services;
using ConstruApp.Core.Entities;
using ConstruApp.Core.Enums;
using ConstruApp.Infrastructure.Data;
using ConstruApp.Infrastructure.Repositories;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Moq;

namespace ConstruApp.Tests.Unit;

public class ProyectosHistorialControllerTests
{
    [Fact]
    public async Task GetHistorial_OrdersProjectsAndSummarizesContractedProvider()
    {
        await using var db = CreateDb();
        db.Proyectos.AddRange(
            Project(1, 7, "Proyecto anterior", new DateTime(2026, 8, 1), EstadoProyecto.Completado),
            Project(2, 7, "Proyecto reciente", new DateTime(2026, 9, 1), EstadoProyecto.EnCurso));
        db.PerfilesConstructor.Add(new PerfilConstructor { Id = 3, UsuarioId = 30, NombreEmpresa = "Constructora Norte" });
        db.Propuestas.Add(new Propuesta
        {
            Id = 8,
            ProyectoId = 2,
            ConstructorId = 3,
            MontoTotal = 2_500_000,
            Descripcion = "Propuesta aceptada",
            Estado = EstadoPropuesta.Aceptada,
            FechaEnvio = new DateTime(2026, 9, 2)
        });
        db.CotizacionesIA.Add(new CotizacionIA { Id = 4, ProyectoId = 2, RangoMinimo = 2_000_000, RangoMaximo = 3_000_000 });
        await db.SaveChangesAsync();

        using var uow = new UnitOfWork(db);
        var controller = CreateController(uow, 7);

        var action = await controller.GetHistorial();

        var ok = Assert.IsType<OkObjectResult>(action.Result);
        var rows = Assert.IsAssignableFrom<IEnumerable<HistorialProyectoResumenDto>>(ok.Value).ToList();
        Assert.Equal([2, 1], rows.Select(r => r.Id));
        Assert.Equal("Constructora Norte", rows[0].ProveedorSeleccionado);
        Assert.Equal(2_500_000, rows[0].MontoContratado);
        Assert.Equal(1, rows[0].CantidadCotizacionesIA);
        Assert.Equal("Contratación en ejecución", rows[0].Resultado);
    }

    [Fact]
    public async Task GetHistorial_WhenClientHasNoProjects_ReturnsEmptyList()
    {
        await using var db = CreateDb();
        db.Proyectos.Add(Project(1, 99, "Proyecto ajeno", DateTime.UtcNow, EstadoProyecto.Publicado));
        await db.SaveChangesAsync();

        using var uow = new UnitOfWork(db);
        var controller = CreateController(uow, 7);

        var action = await controller.GetHistorial();

        var ok = Assert.IsType<OkObjectResult>(action.Result);
        Assert.Empty(Assert.IsAssignableFrom<IEnumerable<HistorialProyectoResumenDto>>(ok.Value));
    }

    [Fact]
    public async Task GetHistorialDetalle_WhenProjectBelongsToAnotherClient_ReturnsForbidden()
    {
        await using var db = CreateDb();
        db.Proyectos.Add(Project(1, 99, "Proyecto ajeno", DateTime.UtcNow, EstadoProyecto.EnCurso));
        await db.SaveChangesAsync();

        using var uow = new UnitOfWork(db);
        var controller = CreateController(uow, 7);

        var action = await controller.GetHistorialDetalle(1);

        Assert.IsType<ForbidResult>(action.Result);
    }

    private static AppDbContext CreateDb()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new AppDbContext(options);
    }

    private static Proyecto Project(int id, int clientId, string title, DateTime date, EstadoProyecto state) => new()
    {
        Id = id,
        ClienteId = clientId,
        Titulo = title,
        Descripcion = $"Descripción de {title}",
        TipoProyecto = TipoProyecto.Remodelacion,
        Estado = state,
        FechaPublicacion = date
    };

    private static ProyectosController CreateController(UnitOfWork uow, int userId)
    {
        var controller = new ProyectosController(uow, Mock.Of<IAuditoriaService>());
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(new ClaimsIdentity(
                [
                    new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
                    new Claim(ClaimTypes.Role, Rol.Cliente.ToString())
                ], "Test"))
            }
        };
        return controller;
    }
}
