using System.Security.Claims;
using ConstruApp.API.Controllers;
using ConstruApp.API.Services;
using ConstruApp.Core.Entities;
using ConstruApp.Core.Interfaces;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;

namespace ConstruApp.Tests.Unit;

public class PerfilesConstructorPortafolioControllerTests
{
    [Fact]
    public async Task AddPortafolio_ValidRequest_PersistsProjectAndAllImages()
    {
        var root = Path.Combine(Path.GetTempPath(), $"construapp-portafolio-{Guid.NewGuid():N}");
        Directory.CreateDirectory(root);

        try
        {
            var (controller, uow) = CreateController(root, ownerId: 7);
            var request = new CrearPortafolioRequest
            {
                Titulo = "Remodelación de cocina",
                Descripcion = "Renovación completa con mobiliario a medida.",
                Imagenes =
                [
                    CreateImage("antes.jpg", "image/jpeg"),
                    CreateImage("despues.jpeg", "image/jpeg"),
                ],
            };

            var result = await controller.AddPortafolio(12, request);

            var created = Assert.IsType<ObjectResult>(result);
            Assert.Equal(StatusCodes.Status201Created, created.StatusCode);
            uow.Verify(x => x.PortafolioItems.AddAsync(It.Is<PortafolioItem>(item =>
                item.ConstructorId == 12 && item.Titulo == request.Titulo)), Times.Once);
            uow.Verify(x => x.PortafolioImagenes.AddAsync(It.IsAny<PortafolioImagen>()), Times.Exactly(2));
            uow.Verify(x => x.SaveChangesAsync(), Times.Once);
            Assert.Equal(2, Directory.GetFiles(Path.Combine(root, "uploads", "portafolio", "12")).Length);
        }
        finally
        {
            if (Directory.Exists(root)) Directory.Delete(root, recursive: true);
        }
    }

    [Fact]
    public async Task AddPortafolio_DisallowedFile_ReturnsValidationErrorWithoutSaving()
    {
        var root = Path.Combine(Path.GetTempPath(), $"construapp-portafolio-{Guid.NewGuid():N}");
        Directory.CreateDirectory(root);

        try
        {
            var (controller, uow) = CreateController(root, ownerId: 7);
            var request = new CrearPortafolioRequest
            {
                Titulo = "Proyecto inválido",
                Imagenes = [CreateImage("evidencia.pdf", "application/pdf")],
            };

            var result = await controller.AddPortafolio(12, request);

            Assert.IsType<BadRequestObjectResult>(result);
            uow.Verify(x => x.SaveChangesAsync(), Times.Never);
            Assert.Empty(Directory.GetFiles(root, "*", SearchOption.AllDirectories));
        }
        finally
        {
            if (Directory.Exists(root)) Directory.Delete(root, recursive: true);
        }
    }

    private static (PerfilesConstructorController controller, Mock<IUnitOfWork> uow) CreateController(
        string webRoot,
        int ownerId)
    {
        var profileRepository = new Mock<IRepository<PerfilConstructor>>();
        profileRepository.Setup(x => x.GetByIdAsync(12)).ReturnsAsync(new PerfilConstructor
        {
            Id = 12,
            UsuarioId = ownerId,
            NombreEmpresa = "Constructora Prueba",
        });

        var portfolioRepository = new Mock<IRepository<PortafolioItem>>();
        portfolioRepository.Setup(x => x.AddAsync(It.IsAny<PortafolioItem>()))
            .ReturnsAsync((PortafolioItem item) => item);

        var imageRepository = new Mock<IRepository<PortafolioImagen>>();
        imageRepository.Setup(x => x.AddAsync(It.IsAny<PortafolioImagen>()))
            .Callback<PortafolioImagen>(image => image.PortafolioItem.Imagenes.Add(image))
            .ReturnsAsync((PortafolioImagen image) => image);

        var uow = new Mock<IUnitOfWork>();
        uow.SetupGet(x => x.PerfilesConstructor).Returns(profileRepository.Object);
        uow.SetupGet(x => x.PortafolioItems).Returns(portfolioRepository.Object);
        uow.SetupGet(x => x.PortafolioImagenes).Returns(imageRepository.Object);
        uow.Setup(x => x.SaveChangesAsync()).ReturnsAsync(1);

        var audit = new Mock<IAuditoriaService>();
        audit.Setup(x => x.RegistrarAsync(
                It.IsAny<int?>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(),
                It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<string?>()))
            .Returns(Task.CompletedTask);

        var environment = new Mock<IWebHostEnvironment>();
        environment.SetupGet(x => x.WebRootPath).Returns(webRoot);
        environment.SetupGet(x => x.ContentRootPath).Returns(webRoot);

        var httpContext = new DefaultHttpContext
        {
            User = new ClaimsPrincipal(new ClaimsIdentity(
            [
                new Claim(ClaimTypes.NameIdentifier, ownerId.ToString()),
                new Claim("nombre", "Persona Prueba"),
            ], "Tests")),
        };

        var controller = new PerfilesConstructorController(uow.Object, audit.Object, environment.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = httpContext },
        };

        return (controller, uow);
    }

    private static FormFile CreateImage(string fileName, string contentType)
    {
        var bytes = new byte[] { 0xFF, 0xD8, 0xFF, 0xE0 };
        return new FormFile(new MemoryStream(bytes), 0, bytes.Length, "Imagenes", fileName)
        {
            Headers = new HeaderDictionary(),
            ContentType = contentType,
        };
    }
}
