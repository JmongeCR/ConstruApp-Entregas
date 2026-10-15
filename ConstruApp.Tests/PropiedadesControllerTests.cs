using System.Linq.Expressions;
using System.Security.Claims;
using ConstruApp.API.Controllers;
using ConstruApp.API.Services;
using ConstruApp.Core.Entities;
using ConstruApp.Core.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Hosting;
using Moq;

namespace ConstruApp.Tests.Unit;

public class PropiedadesControllerTests
{
    [Fact]
    public async Task Create_WithValidData_AssignsAuthenticatedClientAndSaves()
    {
        var dependencies = CreateController();
        dependencies.Propiedades
            .Setup(repository => repository.AddAsync(It.IsAny<Propiedad>()))
            .Callback<Propiedad>(propiedad => propiedad.Id = 12)
            .ReturnsAsync((Propiedad propiedad) => propiedad);
        dependencies.UnitOfWork.Setup(unit => unit.SaveChangesAsync()).ReturnsAsync(1);

        var result = await dependencies.Controller.Create(ValidRequest());

        var created = Assert.IsType<CreatedAtActionResult>(result);
        Assert.Equal(nameof(PropiedadesController.GetById), created.ActionName);
        dependencies.Propiedades.Verify(repository => repository.AddAsync(
            It.Is<Propiedad>(propiedad => propiedad.Id == 12 && propiedad.ClienteId == 7)), Times.Once);
        dependencies.UnitOfWork.Verify(unit => unit.SaveChangesAsync(), Times.Once);
        dependencies.Auditoria.Verify(service => service.RegistrarAsync(
            7, "Cliente Prueba", "CrearPropiedad", "Propiedades", "12", "Casa principal", It.IsAny<string?>()), Times.Once);
    }

    [Fact]
    public async Task Create_WithoutRequiredLocation_ReturnsBadRequestWithoutSaving()
    {
        var dependencies = CreateController();
        var request = ValidRequest() with { Distrito = " " };

        var result = await dependencies.Controller.Create(request);

        Assert.IsType<BadRequestObjectResult>(result);
        dependencies.Propiedades.Verify(repository => repository.AddAsync(It.IsAny<Propiedad>()), Times.Never);
        dependencies.UnitOfWork.Verify(unit => unit.SaveChangesAsync(), Times.Never);
    }

    [Fact]
    public async Task GetById_WhenPropertyBelongsToAnotherClient_ReturnsForbidden()
    {
        var dependencies = CreateController();
        dependencies.Propiedades.Setup(repository => repository.GetByIdAsync(3))
            .ReturnsAsync(new Propiedad { Id = 3, ClienteId = 99 });

        var result = await dependencies.Controller.GetById(3);

        Assert.IsType<ForbidResult>(result);
        dependencies.Fotos.Verify(repository => repository.FindAsync(It.IsAny<Expression<Func<FotoPropiedad, bool>>>()), Times.Never);
    }

    [Fact]
    public async Task Delete_WhenPropertyIsUsedByAProject_ReturnsConflict()
    {
        var dependencies = CreateController();
        var propiedad = new Propiedad { Id = 5, ClienteId = 7, Nombre = "Lote" };
        dependencies.Propiedades.Setup(repository => repository.GetByIdAsync(5)).ReturnsAsync(propiedad);
        dependencies.Proyectos.Setup(repository => repository.ExistsAsync(It.IsAny<Expression<Func<Proyecto, bool>>>() ))
            .ReturnsAsync(true);

        var result = await dependencies.Controller.Delete(5);

        Assert.IsType<ConflictObjectResult>(result);
        dependencies.Propiedades.Verify(repository => repository.DeleteAsync(It.IsAny<Propiedad>()), Times.Never);
        dependencies.UnitOfWork.Verify(unit => unit.SaveChangesAsync(), Times.Never);
    }

    private static PropiedadRequest ValidRequest() => new(
        "Casa principal", "Del parque 200 m norte", "San José", "Montes de Oca", "San Pedro", "Dos plantas");

    private static ControllerDependencies CreateController()
    {
        var unitOfWork = new Mock<IUnitOfWork>();
        var propiedades = new Mock<IRepository<Propiedad>>();
        var fotos = new Mock<IRepository<FotoPropiedad>>();
        var proyectos = new Mock<IRepository<Proyecto>>();
        var auditoria = new Mock<IAuditoriaService>();
        var environment = new Mock<IWebHostEnvironment>();

        unitOfWork.SetupGet(unit => unit.Propiedades).Returns(propiedades.Object);
        unitOfWork.SetupGet(unit => unit.FotosPropiedad).Returns(fotos.Object);
        unitOfWork.SetupGet(unit => unit.Proyectos).Returns(proyectos.Object);
        auditoria.Setup(service => service.RegistrarAsync(
                It.IsAny<int?>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(),
                It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<string?>()))
            .Returns(Task.CompletedTask);

        var identity = new ClaimsIdentity([
            new Claim(ClaimTypes.NameIdentifier, "7"),
            new Claim("nombre", "Cliente Prueba"),
        ], "Test");
        var httpContext = new DefaultHttpContext { User = new ClaimsPrincipal(identity) };
        var controller = new PropiedadesController(unitOfWork.Object, environment.Object, auditoria.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = httpContext },
        };

        return new ControllerDependencies(controller, unitOfWork, propiedades, fotos, proyectos, auditoria);
    }

    private sealed record ControllerDependencies(
        PropiedadesController Controller,
        Mock<IUnitOfWork> UnitOfWork,
        Mock<IRepository<Propiedad>> Propiedades,
        Mock<IRepository<FotoPropiedad>> Fotos,
        Mock<IRepository<Proyecto>> Proyectos,
        Mock<IAuditoriaService> Auditoria);
}
