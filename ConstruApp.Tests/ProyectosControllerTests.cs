using System.Security.Claims;
using ConstruApp.API.Controllers;
using ConstruApp.API.Services;
using ConstruApp.Core.Entities;
using ConstruApp.Core.Enums;
using ConstruApp.Core.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using Microsoft.Extensions.Options;

namespace ConstruApp.Tests.Unit;

public class ProyectosControllerTests
{
    [Fact]
    public async Task Create_WithValidGeneralInformation_AssociatesPropertyAndSavesDraft()
    {
        var dependencies = CreateController();
        dependencies.Propiedades.Setup(repository => repository.GetByIdAsync(4))
            .ReturnsAsync(OwnedProperty());
        dependencies.Proyectos
            .Setup(repository => repository.AddAsync(It.IsAny<Proyecto>()))
            .Callback<Proyecto>(proyecto => proyecto.Id = 18)
            .ReturnsAsync((Proyecto proyecto) => proyecto);
        dependencies.UnitOfWork.Setup(unit => unit.SaveChangesAsync()).ReturnsAsync(1);

        var result = await dependencies.Controller.Create(ValidRequest());

        var created = Assert.IsType<CreatedAtActionResult>(result);
        Assert.Equal(nameof(ProyectosController.GetById), created.ActionName);
        dependencies.Proyectos.Verify(repository => repository.AddAsync(
            It.Is<Proyecto>(proyecto =>
                proyecto.Id == 18 &&
                proyecto.ClienteId == 7 &&
                proyecto.PropiedadId == 4 &&
                proyecto.Titulo == "Remodelación de cocina" &&
                proyecto.Descripcion == "Renovar muebles, iluminación y acabados de la cocina." &&
                proyecto.TipoProyecto == TipoProyecto.Remodelacion &&
                proyecto.Estado == EstadoProyecto.Borrador &&
                proyecto.Provincia == "San José" &&
                proyecto.Canton == "Montes de Oca" &&
                proyecto.Distrito == "San Pedro")), Times.Once);
        dependencies.UnitOfWork.Verify(unit => unit.SaveChangesAsync(), Times.Once);
    }

    [Fact]
    public async Task Create_WithoutRequiredGeneralInformation_ReturnsBadRequestWithoutSaving()
    {
        var dependencies = CreateController();
        var request = ValidRequest() with
        {
            Descripcion = "Muy corta",
            TipoProyecto = "",
            PropiedadId = null,
        };

        var result = await dependencies.Controller.Create(request);

        Assert.IsType<BadRequestObjectResult>(result);
        dependencies.Propiedades.Verify(repository => repository.GetByIdAsync(It.IsAny<int>()), Times.Never);
        dependencies.Proyectos.Verify(repository => repository.AddAsync(It.IsAny<Proyecto>()), Times.Never);
        dependencies.UnitOfWork.Verify(unit => unit.SaveChangesAsync(), Times.Never);
    }

    [Theory]
    [InlineData(0, 8_000_000)]
    [InlineData(-1, 8_000_000)]
    [InlineData(25, 0)]
    [InlineData(25, -1)]
    public async Task Create_WithNonPositiveAreaOrBudget_ReturnsBadRequestWithoutSaving(decimal areaM2, decimal budget)
    {
        var dependencies = CreateController();
        var request = ValidRequest() with { AreaM2 = areaM2, PresupuestoMax = budget };

        var result = await dependencies.Controller.Create(request);

        Assert.IsType<BadRequestObjectResult>(result);
        dependencies.Propiedades.Verify(repository => repository.GetByIdAsync(It.IsAny<int>()), Times.Never);
        dependencies.Proyectos.Verify(repository => repository.AddAsync(It.IsAny<Proyecto>()), Times.Never);
        dependencies.UnitOfWork.Verify(unit => unit.SaveChangesAsync(), Times.Never);
    }

    [Theory]
    [InlineData(0, 8_000_000)]
    [InlineData(-1, 8_000_000)]
    [InlineData(25, 0)]
    [InlineData(25, -1)]
    public async Task Update_WithNonPositiveAreaOrBudget_ReturnsBadRequestWithoutUpdating(decimal areaM2, decimal budget)
    {
        var dependencies = CreateController();
        var project = new Proyecto { Id = 9, ClienteId = 7, Titulo = "Proyecto anterior" };
        dependencies.Proyectos.Setup(repository => repository.GetByIdAsync(9)).ReturnsAsync(project);

        var result = await dependencies.Controller.Update(9,
            ValidRequest() with { AreaM2 = areaM2, PresupuestoMax = budget });

        Assert.IsType<BadRequestObjectResult>(result);
        Assert.Equal("Proyecto anterior", project.Titulo);
        dependencies.Propiedades.Verify(repository => repository.GetByIdAsync(It.IsAny<int>()), Times.Never);
        dependencies.Proyectos.Verify(repository => repository.UpdateAsync(It.IsAny<Proyecto>()), Times.Never);
        dependencies.UnitOfWork.Verify(unit => unit.SaveChangesAsync(), Times.Never);
    }

    [Fact]
    public async Task Update_WithValidInformation_UpdatesGeneralFieldsWithoutLosingProjectState()
    {
        var dependencies = CreateController();
        var publicationDate = new DateTime(2026, 10, 1, 12, 0, 0, DateTimeKind.Utc);
        var project = new Proyecto
        {
            Id = 9,
            ClienteId = 7,
            Titulo = "Proyecto anterior",
            Descripcion = "Descripción anterior suficientemente extensa.",
            TipoProyecto = TipoProyecto.Otro,
            Estado = EstadoProyecto.EnPropuestas,
            FechaPublicacion = publicationDate,
        };
        dependencies.Proyectos.Setup(repository => repository.GetByIdAsync(9)).ReturnsAsync(project);
        dependencies.Propiedades.Setup(repository => repository.GetByIdAsync(4))
            .ReturnsAsync(OwnedProperty());
        dependencies.UnitOfWork.Setup(unit => unit.SaveChangesAsync()).ReturnsAsync(1);

        var result = await dependencies.Controller.Update(9, ValidRequest());

        Assert.IsType<OkObjectResult>(result);
        Assert.Equal("Remodelación de cocina", project.Titulo);
        Assert.Equal(4, project.PropiedadId);
        Assert.Equal(EstadoProyecto.EnPropuestas, project.Estado);
        Assert.Equal(publicationDate, project.FechaPublicacion);
        dependencies.Proyectos.Verify(repository => repository.UpdateAsync(project), Times.Once);
        dependencies.UnitOfWork.Verify(unit => unit.SaveChangesAsync(), Times.Once);
    }

    [Fact]
    public async Task Update_WithAnotherClientsProperty_ReturnsBadRequestWithoutChangingProject()
    {
        var dependencies = CreateController();
        var project = new Proyecto
        {
            Id = 9,
            ClienteId = 7,
            Titulo = "Proyecto anterior",
            Descripcion = "Descripción anterior suficientemente extensa.",
        };
        dependencies.Proyectos.Setup(repository => repository.GetByIdAsync(9)).ReturnsAsync(project);
        dependencies.Propiedades.Setup(repository => repository.GetByIdAsync(4))
            .ReturnsAsync(new Propiedad { Id = 4, ClienteId = 99 });

        var result = await dependencies.Controller.Update(9, ValidRequest());

        Assert.IsType<BadRequestObjectResult>(result);
        Assert.Equal("Proyecto anterior", project.Titulo);
        dependencies.Proyectos.Verify(repository => repository.UpdateAsync(It.IsAny<Proyecto>()), Times.Never);
        dependencies.UnitOfWork.Verify(unit => unit.SaveChangesAsync(), Times.Never);
    }

    [Fact]
    public async Task EnviarACotizacion_WithCompleteOwnedDraft_SetsStatusAndSubmissionDate()
    {
        var dependencies = CreateController();
        var project = CompleteDraft();
        dependencies.Proyectos.Setup(repository => repository.GetByIdAsync(project.Id)).ReturnsAsync(project);
        dependencies.Propiedades.Setup(repository => repository.GetByIdAsync(4)).ReturnsAsync(OwnedProperty());
        dependencies.UnitOfWork.Setup(unit => unit.SaveChangesAsync()).ReturnsAsync(1);

        var result = await dependencies.Controller.EnviarACotizacion(project.Id);

        Assert.IsType<OkObjectResult>(result);
        Assert.Equal(EstadoProyecto.EnPropuestas, project.Estado);
        Assert.NotNull(project.FechaEnvioCotizacion);
        Assert.Equal(project.FechaEnvioCotizacion.Value, project.FechaPublicacion);
        dependencies.Proyectos.Verify(repository => repository.UpdateAsync(project), Times.Once);
        dependencies.UnitOfWork.Verify(unit => unit.SaveChangesAsync(), Times.Once);
    }

    [Fact]
    public async Task EnviarACotizacion_WithIncompleteDraft_ReturnsFieldErrorsWithoutSaving()
    {
        var dependencies = CreateController();
        var project = CompleteDraft();
        project.Descripcion = "Corta";
        project.PropiedadId = null;
        dependencies.Proyectos.Setup(repository => repository.GetByIdAsync(project.Id)).ReturnsAsync(project);

        var result = await dependencies.Controller.EnviarACotizacion(project.Id);

        var badRequest = Assert.IsType<BadRequestObjectResult>(result);
        var errors = Assert.IsType<Dictionary<string, string>>(
            badRequest.Value!.GetType().GetProperty("errors")!.GetValue(badRequest.Value));
        Assert.Contains("descripcion", errors.Keys);
        Assert.Contains("propiedadId", errors.Keys);
        Assert.Equal(EstadoProyecto.Borrador, project.Estado);
        dependencies.Proyectos.Verify(repository => repository.UpdateAsync(It.IsAny<Proyecto>()), Times.Never);
        dependencies.UnitOfWork.Verify(unit => unit.SaveChangesAsync(), Times.Never);
    }

    [Fact]
    public async Task EnviarACotizacion_WithAnotherClientsProject_ReturnsForbid()
    {
        var dependencies = CreateController();
        var project = CompleteDraft();
        project.ClienteId = 99;
        dependencies.Proyectos.Setup(repository => repository.GetByIdAsync(project.Id)).ReturnsAsync(project);

        var result = await dependencies.Controller.EnviarACotizacion(project.Id);

        Assert.IsType<ForbidResult>(result);
        dependencies.Proyectos.Verify(repository => repository.UpdateAsync(It.IsAny<Proyecto>()), Times.Never);
    }

    [Fact]
    public async Task EnviarACotizacion_WhenNotDraft_RejectsResubmission()
    {
        var dependencies = CreateController();
        var project = CompleteDraft();
        project.Estado = EstadoProyecto.EnPropuestas;
        dependencies.Proyectos.Setup(repository => repository.GetByIdAsync(project.Id)).ReturnsAsync(project);

        var result = await dependencies.Controller.EnviarACotizacion(project.Id);

        Assert.IsType<BadRequestObjectResult>(result);
        dependencies.Propiedades.Verify(repository => repository.GetByIdAsync(It.IsAny<int>()), Times.Never);
        dependencies.UnitOfWork.Verify(unit => unit.SaveChangesAsync(), Times.Never);
    }

    private static ProyectoRequest ValidRequest() => new(
        "  Remodelación de cocina  ",
        "  Renovar muebles, iluminación y acabados de la cocina.  ",
        "Remodelacion",
        null,
        null,
        null,
        8_000_000,
        25,
        null,
        null,
        4);

    private static Proyecto CompleteDraft() => new()
    {
        Id = 21,
        ClienteId = 7,
        PropiedadId = 4,
        Titulo = "Remodelación de cocina",
        Descripcion = "Renovar muebles, iluminación y acabados de la cocina.",
        TipoProyecto = TipoProyecto.Remodelacion,
        Estado = EstadoProyecto.Borrador,
        AreaM2 = 25,
        PresupuestoMax = 8_000_000,
    };

    private static Propiedad OwnedProperty() => new()
    {
        Id = 4,
        ClienteId = 7,
        Nombre = "Casa principal",
        Direccion = "Del parque 200 m norte",
        Provincia = "San José",
        Canton = "Montes de Oca",
        Distrito = "San Pedro",
    };

    private static ControllerDependencies CreateController()
    {
        var unitOfWork = new Mock<IUnitOfWork>();
        var proyectos = new Mock<IRepository<Proyecto>>();
        var propiedades = new Mock<IRepository<Propiedad>>();
        var auditoria = new Mock<IAuditoriaService>();

        unitOfWork.SetupGet(unit => unit.Proyectos).Returns(proyectos.Object);
        unitOfWork.SetupGet(unit => unit.Propiedades).Returns(propiedades.Object);

        var identity = new ClaimsIdentity([
            new Claim(ClaimTypes.NameIdentifier, "7"),
            new Claim("nombre", "Cliente Prueba"),
        ], "Test");
        var httpContext = new DefaultHttpContext { User = new ClaimsPrincipal(identity) };
        var controller = new ProyectosController(unitOfWork.Object, auditoria.Object,
            Options.Create(new CotizacionRequisitosOptions()))
        {
            ControllerContext = new ControllerContext { HttpContext = httpContext },
        };

        return new ControllerDependencies(controller, unitOfWork, proyectos, propiedades);
    }

    private sealed record ControllerDependencies(
        ProyectosController Controller,
        Mock<IUnitOfWork> UnitOfWork,
        Mock<IRepository<Proyecto>> Proyectos,
        Mock<IRepository<Propiedad>> Propiedades);
}
