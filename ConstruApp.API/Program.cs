using System.Text;
using ConstruApp.API.Hubs;
using ConstruApp.API.Services;
using ConstruApp.Core.Entities;
using ConstruApp.Core.Interfaces;
using ConstruApp.Infrastructure.Data;
using ConstruApp.Infrastructure.Repositories;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

// ── Secretos desde variables de entorno (override de appsettings.json) ────
var envVars = new Dictionary<string, string?>
{
    ["Groq:ApiKey"]                          = Environment.GetEnvironmentVariable("GROQ_API_KEY"),
    ["Gemini:ApiKey"]                        = Environment.GetEnvironmentVariable("GEMINI_API_KEY"),
    ["ConnectionStrings:DefaultConnection"]  = Environment.GetEnvironmentVariable("CONNECTION_STRING"),
    ["JwtSettings:SecretKey"]                = Environment.GetEnvironmentVariable("JWT_SECRET_KEY"),
    ["Email:Password"]                       = Environment.GetEnvironmentVariable("EMAIL_PASSWORD"),
    ["Email:Usuario"]                        = Environment.GetEnvironmentVariable("EMAIL_USER"),
};
foreach (var (key, val) in envVars)
    if (!string.IsNullOrEmpty(val))
        builder.Configuration[key] = val;

// ── Base de datos ──────────────────────────────────────────────────────────
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("DefaultConnection"),
        sql => sql.MigrationsAssembly("ConstruApp.Infrastructure")));

// ── Identity ───────────────────────────────────────────────────────────────
builder.Services.AddIdentity<Usuario, IdentityRole<int>>(options =>
{
    options.Password.RequireDigit           = true;
    options.Password.RequiredLength         = 6;
    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequireUppercase       = false;
    options.User.RequireUniqueEmail         = true;
})
.AddEntityFrameworkStores<AppDbContext>()
.AddDefaultTokenProviders();

// ── JWT ────────────────────────────────────────────────────────────────────
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var secretKey   = Encoding.UTF8.GetBytes(jwtSettings["SecretKey"]!);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme    = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer           = true,
        ValidateAudience         = true,
        ValidateLifetime         = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer              = jwtSettings["Issuer"],
        ValidAudience            = jwtSettings["Audience"],
        IssuerSigningKey         = new SymmetricSecurityKey(secretKey),
        ClockSkew                = TimeSpan.Zero
    };

    // SignalR envía el token por query string (?access_token=...) en WS/SSE
    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = ctx =>
        {
            var token = ctx.Request.Query["access_token"];
            var path  = ctx.HttpContext.Request.Path;
            if (!string.IsNullOrEmpty(token) && path.StartsWithSegments("/hubs"))
                ctx.Token = token;
            return Task.CompletedTask;
        }
    };
});

builder.Services.AddAuthorization();

// ── HttpClients ────────────────────────────────────────────────────────────
builder.Services.AddHttpClient("gemini", client =>
{
    client.Timeout = TimeSpan.FromSeconds(60);
});
builder.Services.AddHttpClient("groq", client =>
{
    client.Timeout = TimeSpan.FromSeconds(30);
});
builder.Services.AddHttpClient("scraper", client =>
{
    client.Timeout = TimeSpan.FromSeconds(30);
    var scraperUrl = builder.Configuration["Scraper:BaseUrl"];
    if (!string.IsNullOrEmpty(scraperUrl))
        client.BaseAddress = new Uri(scraperUrl);
});

// ── Servicios de IA y precios ──────────────────────────────────────────────
builder.Services.AddScoped<IGeminiService,          GroqService>();
builder.Services.AddScoped<IPreciosCatalogoService, PreciosCatalogoService>();

// ── Servicios de permisos y auditoría ─────────────────────────────────────
builder.Services.AddScoped<IPermisosService,    PermisosService>();
builder.Services.AddScoped<IAuditoriaService,   AuditoriaService>();
builder.Services.AddScoped<INotificacionService, NotificacionService>();
builder.Services.AddScoped<IEmailService,        EmailService>();

// ── Repositorios / UnitOfWork ──────────────────────────────────────────────
builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();

// ── Controllers + JSON ─────────────────────────────────────────────────────
builder.Services.AddControllers()
    .AddJsonOptions(opt =>
    {
        opt.JsonSerializerOptions.Converters.Add(
            new System.Text.Json.Serialization.JsonStringEnumConverter());
    });

// ── Swagger ────────────────────────────────────────────────────────────────
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title   = "ConstruApp API",
        Version = "v1",
        Description = "API para la plataforma de construcción ConstruApp"
    });

    // Soporte JWT en Swagger
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name         = "Authorization",
        Type         = SecuritySchemeType.Http,
        Scheme       = "Bearer",
        BearerFormat = "JWT",
        In           = ParameterLocation.Header,
        Description  = "Ingresa el token JWT. Ejemplo: Bearer {token}"
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id   = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// ── SignalR ────────────────────────────────────────────────────────────────
builder.Services.AddSignalR();

// ── CORS — WebSocket requiere credenciales explícitas (no AllowAnyOrigin) ──
// En producción: si el frontend está en wwwroot (mismo origen) no se necesita CORS.
// Si el frontend está en un dominio separado, configurar "AllowedOrigins" en appsettings.Production.json.
builder.Services.AddCors(options =>
{
    var devOrigins = new[] { "http://localhost:5173", "https://localhost:5173", "http://localhost:5177", "https://localhost:5177" };
    var prodOrigins = builder.Configuration.GetSection("AllowedOrigins").Get<string[]>() ?? [];

    options.AddPolicy("AppPolicy", policy =>
    {
        var origins = builder.Environment.IsDevelopment() ? devOrigins : prodOrigins;
        if (origins.Length > 0)
            policy.WithOrigins(origins).AllowAnyMethod().AllowAnyHeader().AllowCredentials();
        else
            policy.SetIsOriginAllowed(_ => true).AllowAnyMethod().AllowAnyHeader().AllowCredentials();
    });
});

var app = builder.Build();

// ── Migración automática + Seed al iniciar ────────────────────────────────
try
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();
    await DatabaseSeeder.SeedAsync(scope.ServiceProvider);
}
catch (Exception ex)
{
    Console.Error.WriteLine($"[Startup] ERROR: {ex.GetType().Name}: {ex.Message}");
    if (ex.InnerException != null)
        Console.Error.WriteLine($"[Startup] Inner: {ex.InnerException.GetType().Name}: {ex.InnerException.Message}");
    throw;
}
// ── Middleware ─────────────────────────────────────────────────────────────
// Swagger disponible en todos los entornos (útil para verificar el deploy)
app.UseSwagger();
app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "ConstruApp API v1"));

// Health check — GET /api/health
app.MapGet("/api/health", async (AppDbContext db) =>
{
    try
    {
        var canConnect = await db.Database.CanConnectAsync();
        return Results.Ok(new
        {
            Status  = "ok",
            Version = "1.0.0",
            Env     = app.Environment.EnvironmentName,
            Db      = canConnect ? "connected" : "unreachable",
            Time    = DateTime.UtcNow,
        });
    }
    catch (Exception ex)
    {
        return Results.Ok(new { Status = "degraded", Db = "error", Error = ex.Message });
    }
});

app.UseCors("AppPolicy");
app.UseStaticFiles();   // Sirve wwwroot/uploads/ y wwwroot/ (frontend React)
// IIS maneja HTTPS; en desarrollo se usa HttpsRedirection
if (app.Environment.IsDevelopment())
    app.UseHttpsRedirection();
// WebSockets necesario para SignalR en IIS
app.UseWebSockets(new WebSocketOptions { KeepAliveInterval = TimeSpan.FromMinutes(2) });
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapHub<NotificacionHub>("/hubs/notificaciones").RequireAuthorization();

// SPA fallback: rutas no-API las maneja el index.html del frontend
app.MapFallbackToFile("index.html");

app.Run();

// Permite ser referenciado desde los tests de integración
public partial class Program { }
