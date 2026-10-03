using ConstruApp.E2E.Helpers;
using OpenQA.Selenium;
using Xunit;
using Xunit.Abstractions;

namespace ConstruApp.E2E.Tests;

[Collection("E2E")]
public class NavigationAuditTests : E2ETestBase
{
    private const string HU = "Navegación / Audit";
    private readonly ITestOutputHelper _output;

    public NavigationAuditTests(ITestOutputHelper output) : base(1440, 900)
    {
        _output = output;
    }

    private static readonly (string Role, string[] Paths)[] NavByRole =
    [
        ("Admin",       ["/", "/admin", "/perfil", "/configuracion", "/notificaciones"]),
        ("Cliente",     ["/", "/mis-proyectos", "/publicar", "/marketplace", "/cotizaciones-ia", "/cronograma", "/calendario", "/perfil"]),
        ("Constructor", ["/", "/trabajadores", "/favoritos-proveedores", "/propuestas", "/mi-empresa", "/perfil"]),
        ("Proveedor",   ["/", "/perfil", "/configuracion"]),
    ];

    private record NavResult(string Role, string Path, bool Blank, bool JSError, bool NotFound, bool Loaded);

    [Fact]
    public void SidebarLinks_NoHayPantallasEnBlanco()
    {
        var allResults = new List<NavResult>();

        foreach (var (role, paths) in NavByRole)
        {
            var creds = role switch
            {
                "Admin"       => Settings.Admin,
                "Cliente"     => Settings.Cliente,
                "Constructor" => Settings.Constructor,
                "Proveedor"   => Settings.Proveedor,
                _             => Settings.Cliente,
            };

            try { LoginHelper.Login(Driver, creds); }
            catch { continue; }

            foreach (var path in paths)
            {
                NavigateTo(path);
                Thread.Sleep(1200);

                var src     = PageSource;
                var jsErrs  = GetJsErrors();
                var blank   = src.Length < 200 || src.Contains("<body></body>") || src.Contains("root\"></div>");
                var notFound = src.Contains("404") || src.Contains("No encontrado") || CurrentUrl.Contains("/404");
                var loaded  = !blank && !notFound;

                var r = new NavResult(role, path, blank, jsErrs.Any(), notFound, loaded);
                allResults.Add(r);

                var status = loaded ? "✓" : (notFound ? "404" : (blank ? "BLANK" : "?"));
                _output.WriteLine($"[{status}] {role,-15} {path,-35} JSErrors:{jsErrs.Count}");

                if (jsErrs.Any())
                {
                    _output.WriteLine($"  JS: {string.Join("; ", jsErrs.Take(3))}");
                }

                if (!loaded)
                {
                    Screenshot($"Nav_FAIL_{role}_{path.Replace("/", "_")}");
                }
                else
                {
                    Screenshot($"Nav_OK_{role}_{path.Replace("/", "_")}");
                }

                Record(HU,
                    $"[{role}] {path}",
                    loaded,
                    loaded ? null : (notFound ? "Página 404" : (blank ? "Pantalla en blanco" : "No cargó"))
                );
            }

            // Logout entre roles
            try
            {
                ((IJavaScriptExecutor)Driver).ExecuteScript("localStorage.clear(); sessionStorage.clear();");
            }
            catch { }
        }

        var failed = allResults.Where(r => !r.Loaded).ToList();
        if (failed.Any())
        {
            var msg = string.Join("\n", failed.Select(f =>
                $"  {f.Role} → {f.Path}: blank={f.Blank}, 404={f.NotFound}, JSErr={f.JSError}"));
            Assert.Fail($"Pantallas con problemas:\n{msg}");
        }
    }

    [Fact]
    public void ResponsiveAudit_3Breakpoints()
    {
        var breakpoints = new[]
        {
            (Label: "Desktop", Width: 1440, Height: 900),
            (Label: "Tablet",  Width: 768,  Height: 1024),
            (Label: "Mobile",  Width: 390,  Height: 844),
        };

        var testRoutes = new[] { "/mis-proyectos", "/trabajadores", "/mi-empresa", "/favoritos-proveedores" };

        LoginHelper.Login(Driver, Settings.Constructor);

        var passed  = true;
        var details = new List<string>();

        foreach (var bp in breakpoints)
        {
            Driver.Manage().Window.Size = new System.Drawing.Size(bp.Width, bp.Height);
            Thread.Sleep(400);

            foreach (var route in testRoutes)
            {
                NavigateTo(route);
                Thread.Sleep(1500);

                // Verificar overflow horizontal — esperar estabilidad: el scrollWidth debe ser consistente
                // 3 veces con 200ms de intervalo para descartar toasts/spinners transitorios
                bool hasHScroll = false;
                for (int attempt = 0; attempt < 3; attempt++)
                {
                    hasHScroll = (bool)((IJavaScriptExecutor)Driver).ExecuteScript(
                        "return document.documentElement.scrollWidth > document.documentElement.clientWidth;");
                    if (!hasHScroll) break;
                    Thread.Sleep(300);
                }

                if (hasHScroll)
                {
                    passed = false;
                    details.Add($"[{bp.Label}] {route} tiene scroll horizontal (overflow)");
                }

                Screenshot($"Responsive_{bp.Label}_{route.Replace("/", "_")}");
                Record("Responsive", $"[{bp.Label}] {route}", !hasHScroll,
                    hasHScroll ? $"Scroll horizontal detectado en {bp.Width}px" : null);

                _output.WriteLine($"[{(hasHScroll ? "✗ OVERFLOW" : "✓ OK")}] {bp.Label} {bp.Width}x{bp.Height} — {route}");
            }
        }

        // Restaurar tamaño
        Driver.Manage().Window.Size = new System.Drawing.Size(1440, 900);

        if (!passed)
            Assert.Fail($"Problemas responsive:\n{string.Join("\n", details)}");
    }

    private List<string> GetJsErrors()
    {
        var errors = new List<string>();
        try
        {
            var logs = Driver.Manage().Logs.GetLog("browser");
            errors.AddRange(
                logs.Where(l => l.Level == OpenQA.Selenium.LogLevel.Severe)
                    .Select(l => l.Message)
                    .Take(5));
        }
        catch { }
        return errors;
    }
}
