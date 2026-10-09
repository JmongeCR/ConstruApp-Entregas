using System.Security.Claims;
using ConstruApp.API.Controllers;
using ConstruApp.API.DTOs.Favoritos;
using ConstruApp.Core.Entities;
using ConstruApp.Core.Enums;
using ConstruApp.Infrastructure.Data;
using ConstruApp.Infrastructure.Repositories;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ConstruApp.Tests.Unit;

public class FavoritosConstructorControllerTests
{
    [Fact]
    public async Task AgregarConstructora_WithValidProfile_PersistsFavorite()
    {
        await using var db = CreateDb();
        db.PerfilesConstructor.Add(Profile(3, "Constructora Central"));
        await db.SaveChangesAsync();

        using var uow = new UnitOfWork(db);
        var controller = CreateController(uow, 7);

        var result = await controller.AgregarConstructora(3);

        var created = Assert.IsType<CreatedAtActionResult>(result);
        var dto = Assert.IsType<ConstructoraFavoritaDto>(created.Value);
        Assert.Equal("Constructora Central", dto.NombreEmpresa);
        Assert.True(await db.FavoritosConstructor.AnyAsync(f => f.ClienteId == 7 && f.PerfilConstructorId == 3));
    }

    [Fact]
    public async Task AgregarConstructora_WhenAlreadySaved_ReturnsConflictWithoutDuplicate()
    {
        await using var db = CreateDb();
        db.PerfilesConstructor.Add(Profile(3, "Constructora Central"));
        db.FavoritosConstructor.Add(new FavoritoConstructor { ClienteId = 7, PerfilConstructorId = 3 });
        await db.SaveChangesAsync();

        using var uow = new UnitOfWork(db);
        var controller = CreateController(uow, 7);

        var result = await controller.AgregarConstructora(3);

        Assert.IsType<ConflictObjectResult>(result);
        Assert.Equal(1, await db.FavoritosConstructor.CountAsync());
    }

    [Fact]
    public async Task GetConstructoras_ReturnsOnlyFavoritesFromAuthenticatedClient()
    {
        await using var db = CreateDb();
        db.PerfilesConstructor.AddRange(Profile(3, "Constructora Central"), Profile(4, "Constructora Pacífico"));
        db.FavoritosConstructor.AddRange(
            new FavoritoConstructor { Id = 1, ClienteId = 7, PerfilConstructorId = 3, FechaAgregado = new DateTime(2026, 10, 7) },
            new FavoritoConstructor { Id = 2, ClienteId = 99, PerfilConstructorId = 4, FechaAgregado = new DateTime(2026, 10, 6) });
        await db.SaveChangesAsync();

        using var uow = new UnitOfWork(db);
        var controller = CreateController(uow, 7);

        var action = await controller.GetConstructoras();

        var ok = Assert.IsType<OkObjectResult>(action.Result);
        var rows = Assert.IsAssignableFrom<IEnumerable<ConstructoraFavoritaDto>>(ok.Value).ToList();
        var favorite = Assert.Single(rows);
        Assert.Equal(3, favorite.PerfilConstructorId);
        Assert.Equal("Constructora Central", favorite.NombreEmpresa);
    }

    private static AppDbContext CreateDb()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new AppDbContext(options);
    }

    private static PerfilConstructor Profile(int id, string name) => new()
    {
        Id = id,
        UsuarioId = id + 100,
        NombreEmpresa = name,
        Especialidades = "Remodelación",
        Verificado = true,
        CalificacionPromedio = 4.5m,
    };

    private static FavoritosController CreateController(UnitOfWork uow, int userId)
    {
        var controller = new FavoritosController(uow);
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
