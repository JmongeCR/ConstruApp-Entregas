using System.Text;
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
    ["ConnectionStrings:DefaultConnection"] = Environment.GetEnvironmentVariable("CONNECTION_STRING"),
    ["JwtSettings:SecretKey"]              = Environment.GetEnvironmentVariable("JWT_SECRET_KEY"),
    ["Email:Password"]                     = Environment.GetEnvironmentVariable("EMAIL_PASSWORD"),
    ["Email:Usuario"]                      = Environment.GetEnvironmentVariable("EMAIL_USER"),
};
foreach (var (key, val) in envVars)
    if (!string.IsNullOrEmpty(val))
        builder.Configuration[key] = val;

// ── Base de datos (Azure SQL) ─────────────────────────────────────────────
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
});

builder.Services.AddAuthorization();

// ── Servicios ──────────────────────────────────────────────────────────────
builder.Services.AddScoped<IPermisosService,  PermisosService>();
builder.Services.AddScoped<IAuditoriaService, AuditoriaService>();
builder.Services.AddHttpClient();
var resendKey = builder.Configuration["Resend:ApiKey"];
if (!string.IsNullOrEmpty(resendKey))
    builder.Services.AddScoped<IEmailService, ResendEmailService>();
else
    builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddScoped<IUnitOfWork,       UnitOfWork>();

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
        Title       = "ConstruApp API — Sprint 1",
        Version     = "v1",
        Description = "Autenticación y perfil de usuario"
    });

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
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            Array.Empty<string>()
        }
    });
});

// ── CORS ───────────────────────────────────────────────────────────────────
builder.Services.AddCors(options =>
{
    var devOrigins  = new[] { "http://localhost:5173", "https://localhost:5173", "http://localhost:5174", "https://localhost:5174" };
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

// ── Migración automática + Seed ───────────────────────────────────────────
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

app.UseSwagger();
app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "ConstruApp Sprint 1 v1"));

app.MapGet("/api/health", async (AppDbContext db) =>
{
    try
    {
        var canConnect = await db.Database.CanConnectAsync();
        return Results.Ok(new { Status = "ok", Db = canConnect ? "connected" : "unreachable", Time = DateTime.UtcNow });
    }
    catch (Exception ex)
    {
        return Results.Ok(new { Status = "degraded", Db = "error", Error = ex.Message });
    }
});

app.UseCors("AppPolicy");
app.UseStaticFiles();
if (app.Environment.IsDevelopment())
    app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapFallbackToFile("index.html");

app.Run();

public partial class Program { }
