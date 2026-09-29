using ConstruApp.API.Controllers;
using ConstruApp.API.DTOs.Auth;
using ConstruApp.API.Services;
using ConstruApp.Core.Entities;
using ConstruApp.Core.Interfaces;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using IdentitySignInResult = Microsoft.AspNetCore.Identity.SignInResult;

namespace ConstruApp.Tests.Unit;

public class AuthControllerTests
{
    [Fact]
    public async Task Login_PendingAccountWithWrongPassword_DoesNotRevealAccountStatus()
    {
        var user = CreateUser(estado: "Pendiente", activo: false, emailConfirmed: false);
        var (controller, signInManager) = CreateController(user);
        signInManager
            .Setup(s => s.CheckPasswordSignInAsync(user, "incorrecta", false))
            .ReturnsAsync(IdentitySignInResult.Failed);

        var response = await controller.Login(new LoginRequest
        {
            Email = user.Email!,
            Password = "incorrecta"
        });

        var result = Assert.IsType<UnauthorizedObjectResult>(response.Result);
        Assert.Equal(401, result.StatusCode);
    }

    [Fact]
    public async Task Login_PendingAccountWithValidPassword_ReturnsForbidden()
    {
        var user = CreateUser(estado: "Pendiente", activo: false, emailConfirmed: false);
        var (controller, signInManager) = CreateController(user);
        signInManager
            .Setup(s => s.CheckPasswordSignInAsync(user, "correcta", false))
            .ReturnsAsync(IdentitySignInResult.Success);

        var response = await controller.Login(new LoginRequest
        {
            Email = user.Email!,
            Password = "correcta"
        });

        var result = Assert.IsType<ObjectResult>(response.Result);
        Assert.Equal(403, result.StatusCode);
    }

    [Fact]
    public async Task Login_UnconfirmedAccountWithValidPassword_ReturnsForbidden()
    {
        var user = CreateUser(estado: null, activo: true, emailConfirmed: false);
        var (controller, signInManager) = CreateController(user);
        signInManager
            .Setup(s => s.CheckPasswordSignInAsync(user, "correcta", false))
            .ReturnsAsync(IdentitySignInResult.Success);

        var response = await controller.Login(new LoginRequest
        {
            Email = user.Email!,
            Password = "correcta"
        });

        var result = Assert.IsType<ObjectResult>(response.Result);
        Assert.Equal(403, result.StatusCode);
    }

    [Fact]
    public async Task Login_ActiveConfirmedAccount_ReturnsJwtAndUpdatesLastAccess()
    {
        var user = CreateUser(estado: null, activo: true, emailConfirmed: true);
        var (controller, signInManager, userManager, permisos, auditoria) = CreateControllerWithDependencies(user);
        signInManager
            .Setup(s => s.CheckPasswordSignInAsync(user, "correcta", false))
            .ReturnsAsync(IdentitySignInResult.Success);
        userManager.Setup(m => m.UpdateAsync(user)).ReturnsAsync(IdentityResult.Success);
        permisos.Setup(p => p.GetPermisosAsync(user.Id, user.Rol)).ReturnsAsync(["proyectos.ver"]);

        var response = await controller.Login(new LoginRequest
        {
            Email = user.Email!,
            Password = "correcta"
        });

        var ok = Assert.IsType<OkObjectResult>(response.Result);
        var auth = Assert.IsType<AuthResponse>(ok.Value);
        Assert.False(string.IsNullOrWhiteSpace(auth.Token));
        Assert.NotNull(user.UltimoAcceso);
        userManager.Verify(m => m.UpdateAsync(user), Times.Once);
        auditoria.Verify(a => a.RegistrarAsync(user.Id, user.Nombre, "Login", "Auth", null, null, It.IsAny<string?>()), Times.Once);
    }

    private static Usuario CreateUser(string? estado, bool activo, bool emailConfirmed) => new()
    {
        Id = 7,
        Email = "persona@construapp.test",
        UserName = "persona@construapp.test",
        Nombre = "Persona Prueba",
        EstadoCuenta = estado,
        Activo = activo,
        EmailConfirmed = emailConfirmed
    };

    private static (AuthController controller, Mock<SignInManager<Usuario>> signInManager) CreateController(Usuario user)
    {
        var (controller, signInManager, _, _, _) = CreateControllerWithDependencies(user);
        return (controller, signInManager);
    }

    private static (
        AuthController controller,
        Mock<SignInManager<Usuario>> signInManager,
        Mock<UserManager<Usuario>> userManager,
        Mock<IPermisosService> permisos,
        Mock<IAuditoriaService> auditoria) CreateControllerWithDependencies(Usuario user)
    {
        var store = new Mock<IUserStore<Usuario>>();
        var userManager = new Mock<UserManager<Usuario>>(
            store.Object,
            Options.Create(new IdentityOptions()),
            new PasswordHasher<Usuario>(),
            Array.Empty<IUserValidator<Usuario>>(),
            Array.Empty<IPasswordValidator<Usuario>>(),
            new UpperInvariantLookupNormalizer(),
            new IdentityErrorDescriber(),
            null!,
            new Mock<ILogger<UserManager<Usuario>>>().Object);
        userManager.Setup(m => m.FindByEmailAsync(user.Email!)).ReturnsAsync(user);

        var signInManager = new Mock<SignInManager<Usuario>>(
            userManager.Object,
            new Mock<IHttpContextAccessor>().Object,
            new Mock<IUserClaimsPrincipalFactory<Usuario>>().Object,
            Options.Create(new IdentityOptions()),
            new Mock<ILogger<SignInManager<Usuario>>>().Object,
            new Mock<IAuthenticationSchemeProvider>().Object,
            new Mock<IUserConfirmation<Usuario>>().Object);

        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["JwtSettings:SecretKey"] = "clave-de-pruebas-segura-con-mas-de-32-caracteres",
                ["JwtSettings:Issuer"] = "ConstruApp.Tests",
                ["JwtSettings:Audience"] = "ConstruApp.Tests",
                ["JwtSettings:ExpirationMinutes"] = "15"
            })
            .Build();
        var permisos = new Mock<IPermisosService>();
        var auditoria = new Mock<IAuditoriaService>();

        var controller = new AuthController(
            userManager.Object,
            signInManager.Object,
            configuration,
            permisos.Object,
            auditoria.Object,
            new Mock<IUnitOfWork>().Object,
            new Mock<IEmailService>().Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() }
        };

        return (controller, signInManager, userManager, permisos, auditoria);
    }
}
