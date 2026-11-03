using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using ConstruApp.API.Controllers;
using ConstruApp.API.Services;
using ConstruApp.Core.Entities;
using ConstruApp.Core.Enums;
using ConstruApp.Infrastructure.Data;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

namespace ConstruApp.Tests.Unit;

public sealed class EntrevistaIaTests
{
    [Theory]
    [InlineData("", "", "", "", "", "titulo,tipoProyecto,descripcion", "¿Cómo querés llamar al proyecto?", false)]
    [InlineData("Piso de cocina", "Pisos", "Necesito hacer algunos arreglos en el piso de la cocina.",
        "¿Qué trabajos necesitás en el piso?", "", "", "¿Qué trabajos necesitás en el piso?", false)]
    [InlineData("Piso de cocina", "Pisos", "Retirar cerámica e instalar porcelanato en 15 m² de la cocina.",
        "", "Confirmá el formato del porcelanato.", "", "Confirmá el formato del porcelanato.", true)]
    public async Task ValidacionDistingueDatosFaltantesDescripcionVagaYAlcanceCompleto(
        string titulo, string tipo, string descripcion, string pregunta, string recomendaciones,
        string faltantes, string mensaje, bool completo)
    {
        using var db = CrearDb();
        using var handler = new RespuestasIa(new RevisionProyectoIa(titulo, tipo, descripcion, pregunta, recomendaciones));
        using var http = new HttpClient(handler);
        var controller = Controlador(db, http, 7);
        var inicial = Json(await controller.Crear(default));

        var resultado = Json(await controller.Mensaje(Id(inicial), new(Version(inicial), "Mensaje ficticio"), default));
        var datos = resultado.GetProperty("datos");
        Assert.Equal(faltantes.Split(',', StringSplitOptions.RemoveEmptyEntries),
            datos.GetProperty("faltantes").EnumerateObject().Select(campo => campo.Name));
        Assert.Equal(completo, datos.GetProperty("completo").GetBoolean());
        Assert.Equal(mensaje, datos.GetProperty("turnos")[1].GetProperty("texto").GetString());
        Assert.Equal(1, handler.Solicitudes);
        db.ChangeTracker.Clear();
        var guardada = Json(await controller.Obtener(Id(inicial), default));
        Assert.Equal(Version(resultado), Version(guardada));
        Assert.Equal(2, guardada.GetProperty("datos").GetProperty("turnos").GetArrayLength());
    }

    [Fact]
    public async Task OtroClienteNoPuedeLeerNiContinuarEntrevistasAjenas()
    {
        using var db = CrearDb();
        using var handler = new RespuestasIa();
        using var http = new HttpClient(handler);
        var creada = Json(await Controlador(db, http, 7).Crear(default));
        var otroCliente = Controlador(db, http, 8);

        var lista = Json(await otroCliente.Listar(default));
        Assert.Equal(0, lista.GetArrayLength());
        Assert.IsType<NotFoundResult>(await otroCliente.Obtener(Id(creada), default));
        Assert.IsType<NotFoundResult>(await otroCliente.Mensaje(Id(creada), new(Version(creada), "Texto"), default));
        Assert.Equal(0, handler.Solicitudes);
    }

    [Fact]
    public async Task RepetirConfirmacionDevuelveElMismoBorrador()
    {
        using var db = CrearDb();
        db.Propiedades.Add(new Propiedad { Id = 12, ClienteId = 7, Nombre = "Cocina ficticia" });
        await db.SaveChangesAsync();
        using var handler = new RespuestasIa(
            new RevisionProyectoIa("Piso", "Pisos", "Retirar la cerámica e instalar porcelanato en la cocina.", "", "Confirmá el material."),
            new ContenidoAlcanceIa("Cambiar el piso", "Instalar porcelanato", "Instalaciones", "Piso nivelado", "Instalador", ""));
        using var http = new HttpClient(handler);
        var controller = Controlador(db, http, 7);
        var inicial = Json(await controller.Crear(default));
        var id = Id(inicial);
        var ficha = Json(await controller.Mensaje(id, new(Version(inicial), "Cambiar el piso de la cocina"), default));
        var alcance = Json(await controller.Alcance(id, new(Version(ficha), 15), default));
        var confirmar = new ConfirmarBorrador(Version(alcance), 12);

        var primera = Json(await controller.CrearBorrador(id, confirmar, default));
        db.ChangeTracker.Clear();
        var segunda = Json(await controller.CrearBorrador(id, confirmar, default));
        var proyecto = await db.Proyectos.SingleAsync();
        Assert.Equal(proyecto.Id, primera.GetProperty("proyectoId").GetInt32());
        Assert.Equal(proyecto.Id, segunda.GetProperty("proyectoId").GetInt32());
        Assert.Equal(EstadoProyecto.Borrador, proyecto.Estado);
        Assert.Equal(15m, proyecto.AreaM2);
        Assert.Equal(2, handler.Solicitudes);
    }

    private static EntrevistaIaController Controlador(AppDbContext db, HttpClient http, int usuario)
    {
        var config = new ConfigurationBuilder().AddInMemoryCollection(
            new Dictionary<string, string?> { ["OPENAI_API_KEY"] = "clave-ficticia" }).Build();
        var ia = new ValidacionProyectoIa(http, config, NullLogger<ValidacionProyectoIa>.Instance);
        return new EntrevistaIaController(db, ia, Options.Create(new RangosPreciosOptions()), config)
        {
            ControllerContext = new() { HttpContext = new DefaultHttpContext { User = ComparacionCotizacionesTests.User(usuario, "Cliente") } },
        };
    }

    private static AppDbContext CrearDb() => new(new DbContextOptionsBuilder<AppDbContext>()
        .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);
    private static Guid Id(JsonElement resultado) => resultado.GetProperty("id").GetGuid();
    private static Guid Version(JsonElement resultado) => resultado.GetProperty("version").GetGuid();
    private static JsonElement Json(IActionResult resultado) => JsonSerializer.SerializeToElement(
        Assert.IsType<OkObjectResult>(resultado).Value, JsonSerializerOptions.Web);

    private sealed class RespuestasIa(params object[] respuestas) : HttpMessageHandler
    {
        private readonly Queue<object> _respuestas = new(respuestas);
        public int Solicitudes { get; private set; }

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken ct)
        {
            Solicitudes++;
            Assert.Equal("https://api.openai.com/v1/responses", request.RequestUri?.AbsoluteUri);
            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = JsonContent.Create(new
                {
                    status = "completed",
                    output = new[]
                    {
                        new { type = "message", content = new[]
                        {
                            new { type = "output_text", text = JsonSerializer.Serialize(_respuestas.Dequeue(), JsonSerializerOptions.Web) },
                        } },
                    },
                }),
            });
        }
    }
}
