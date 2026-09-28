using ConstruApp.Core.Entities;
using ConstruApp.Core.Enums;
using ConstruApp.Core.Interfaces;
using ConstruApp.Infrastructure.Data;
using ConstruApp.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;
using Moq;

namespace ConstruApp.Tests.Unit;

public class RepositoryTests
{
    private static AppDbContext CreateInMemoryContext(string dbName)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(dbName)
            .Options;
        return new AppDbContext(options);
    }

    [Fact]
    public async Task AddAsync_Proyecto_ShouldPersist()
    {
        using var ctx = CreateInMemoryContext(nameof(AddAsync_Proyecto_ShouldPersist));
        var repo = new Repository<Proyecto>(ctx);

        var proyecto = new Proyecto
        {
            ClienteId    = 1,
            Titulo       = "Casa Residencial",
            Descripcion  = "Remodelación cocina",
            TipoProyecto = TipoProyecto.Remodelacion,
            Estado       = EstadoProyecto.Publicado,
        };

        await repo.AddAsync(proyecto);
        await ctx.SaveChangesAsync();

        var found = await repo.GetByIdAsync(proyecto.Id);
        Assert.NotNull(found);
        Assert.Equal("Casa Residencial", found!.Titulo);
    }

    [Fact]
    public async Task GetAllAsync_ShouldReturnAllProyectos()
    {
        using var ctx = CreateInMemoryContext(nameof(GetAllAsync_ShouldReturnAllProyectos));
        var repo = new Repository<Proyecto>(ctx);

        await repo.AddAsync(new Proyecto { ClienteId = 1, Titulo = "P1", Descripcion = "d1" });
        await repo.AddAsync(new Proyecto { ClienteId = 1, Titulo = "P2", Descripcion = "d2" });
        await ctx.SaveChangesAsync();

        var all = await repo.GetAllAsync();
        Assert.Equal(2, all.Count());
    }

    [Fact]
    public async Task DeleteAsync_ShouldRemoveProyecto()
    {
        using var ctx = CreateInMemoryContext(nameof(DeleteAsync_ShouldRemoveProyecto));
        var repo = new Repository<Proyecto>(ctx);

        var proyecto = new Proyecto { ClienteId = 1, Titulo = "A Eliminar", Descripcion = "d" };
        await repo.AddAsync(proyecto);
        await ctx.SaveChangesAsync();

        await repo.DeleteAsync(proyecto);
        await ctx.SaveChangesAsync();

        Assert.Null(await repo.GetByIdAsync(proyecto.Id));
    }

    [Fact]
    public async Task FindAsync_ShouldFilterByEstado()
    {
        using var ctx = CreateInMemoryContext(nameof(FindAsync_ShouldFilterByEstado));
        var repo = new Repository<Proyecto>(ctx);

        await repo.AddAsync(new Proyecto { ClienteId = 1, Titulo = "Publicado", Descripcion = "d", Estado = EstadoProyecto.Publicado });
        await repo.AddAsync(new Proyecto { ClienteId = 2, Titulo = "Borrador",  Descripcion = "d", Estado = EstadoProyecto.Borrador });
        await ctx.SaveChangesAsync();

        var publicados = await repo.FindAsync(p => p.Estado == EstadoProyecto.Publicado);
        Assert.Single(publicados);
        Assert.Equal("Publicado", publicados.First().Titulo);
    }

    [Fact]
    public async Task UnitOfWork_ShouldSaveMultipleEntities()
    {
        using var ctx = CreateInMemoryContext(nameof(UnitOfWork_ShouldSaveMultipleEntities));
        var uow = new UnitOfWork(ctx);

        await uow.Proyectos.AddAsync(new Proyecto { ClienteId = 1, Titulo = "Test UoW", Descripcion = "d" });
        var saved = await uow.SaveChangesAsync();

        Assert.Equal(1, saved);
    }

    [Fact]
    public void IUnitOfWork_MockShouldWork()
    {
        var mockUow = new Mock<IUnitOfWork>();
        mockUow.Setup(u => u.Proyectos).Returns(new Mock<IRepository<Proyecto>>().Object);
        Assert.NotNull(mockUow.Object.Proyectos);
    }
}
