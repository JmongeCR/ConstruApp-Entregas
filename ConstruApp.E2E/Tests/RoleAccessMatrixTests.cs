using ConstruApp.E2E.Config;
using ConstruApp.E2E.Helpers;
using OpenQA.Selenium;
using OpenQA.Selenium.Support.UI;
using Xunit;
using Xunit.Abstractions;

namespace ConstruApp.E2E.Tests;

[Collection("E2E")]
public class RoleAccessMatrixTests : E2ETestBase
{
    private const string HU = "Acceso por rol";
    private readonly ITestOutputHelper _output;

    public RoleAccessMatrixTests(ITestOutputHelper output) : base(1440, 900)
    {
        _output = output;
    }

    public record RouteCheck(string Role, string Path, string Expected, bool RequiresAuth);

    private static readonly RouteCheck[] Matrix =
    [
        // Admin — rutas permitidas
        new("Admin",       "/",           "allowed",    true),
        new("Admin",       "/admin",      "allowed",    true),
        new("Admin",       "/perfil",     "allowed",    true),

        // Cliente — rutas permitidas
        new("Cliente",     "/",                    "allowed", true),
        new("Cliente",     "/mis-proyectos",        "allowed", true),
        new("Cliente",     "/marketplace",          "allowed", true),
        new("Cliente",     "/publicar",             "allowed", true),
        new("Cliente",     "/favoritos-proveedores","blocked", true),  // ruta de Constructor
        new("Cliente",     "/trabajadores",         "blocked", true),  // ruta de Constructor
        new("Cliente",     "/admin",                "blocked", true),  // solo Admin

        // Constructor — rutas permitidas
        new("Constructor", "/",                     "allowed", true),
        new("Constructor", "/trabajadores",         "allowed", true),
        new("Constructor", "/favoritos-proveedores","allowed", true),
        new("Constructor", "/mi-empresa",           "allowed", true),
        new("Constructor", "/admin",                "blocked", true),  // solo Admin

        // Sin autenticación
        new("Anonymous",   "/",                     "redirect-login", false),
        new("Anonymous",   "/mis-proyectos",        "redirect-login", false),
        new("Anonymous",   "/admin",                "redirect-login", false),
        new("Anonymous",   "/trabajadores",         "redirect-login", false),
        new("Anonymous",   "/mi-empresa",           "redirect-login", false),
    ];

    [Fact]
    public void MatrizCompleta_RolesYRutas()
    {
        var results = new List<(string role, string path, string expected, string actual, bool ok)>();

        foreach (var check in Matrix)
        {
            // Limpiar sesión: navegar al app primero (Chrome 154 bloquea localStorage en about:blank),
            // luego limpiar storage y recargar para resetear estado React en memoria.
            try
            {
                if (!Driver.Url.StartsWith("http://localhost"))
                    Driver.Navigate().GoToUrl($"{TestSettings.Current.FrontendUrl}/login");
                ((IJavaScriptExecutor)Driver).ExecuteScript("localStorage.clear(); sessionStorage.clear();");
                // Forzar recarga para que React auth context re-lea localStorage vacío
                Driver.Navigate().GoToUrl($"{TestSettings.Current.FrontendUrl}/login");
                WaitHelper.WaitForPageLoad(Driver);
            }
            catch { }

            // Login según rol
            if (check.RequiresAuth && check.Role != "Anonymous")
            {
                var creds = check.Role switch
                {
                    "Admin"       => Settings.Admin,
                    "Cliente"     => Settings.Cliente,
                    "Constructor" => Settings.Constructor,
                    "Proveedor"   => Settings.Proveedor,
                    _             => Settings.Cliente,
                };

                try
                {
                    LoginHelper.Login(Driver, creds);
                    WaitHelper.WaitForPageLoad(Driver);
                    // Esperar a que React almacene el JWT en localStorage antes de navegar
                    new WebDriverWait(Driver, TimeSpan.FromSeconds(5)).Until(d =>
                    {
                        try
                        {
                            var token = ((IJavaScriptExecutor)d).ExecuteScript(
                                "return Object.values(localStorage).find(v => v && typeof v === 'string' && v.startsWith('ey'))");
                            return token != null;
                        }
                        catch { return false; }
                    });
                    Thread.Sleep(500);
                }
                catch { Thread.Sleep(1500); }
            }

            // Navegar a la ruta
            NavigateTo(check.Path);
            Thread.Sleep(1500);

            var currentUrl = CurrentUrl;
            var pageText   = PageSource;

            string actual;
            bool   ok;

            if (check.Expected == "redirect-login")
            {
                ok     = currentUrl.Contains("/login");
                actual = ok ? "redirect-login" : $"permanece en {currentUrl}";
            }
            else if (check.Expected == "allowed")
            {
                ok     = !currentUrl.Contains("/login") && !pageText.Contains("Acceso denegado") &&
                         !pageText.Contains("403") && !pageText.Contains("Forbidden");
                actual = ok ? "allowed" : $"bloqueado / redirigido a {currentUrl}";
            }
            else // blocked
            {
                ok     = currentUrl.Contains("/login") || pageText.Contains("403") ||
                         pageText.Contains("Acceso denegado") || !currentUrl.Contains(check.Path.TrimEnd('/'));
                actual = ok ? "blocked-correctly" : $"accesible cuando no debería ({currentUrl})";
            }

            results.Add((check.Role, check.Path, check.Expected, actual, ok));
            _output.WriteLine($"[{(ok ? "✓" : "✗")}] {check.Role,-15} {check.Path,-35} expected:{check.Expected,-20} actual:{actual}");

            Record(HU,
                $"{check.Role} → {check.Path} ({check.Expected})",
                ok,
                ok ? null : $"Esperado: {check.Expected} | Obtenido: {actual}");
        }

        Screenshot("RoleMatrix_Resultado");

        // Generar tabla en output
        var failed = results.Where(r => !r.ok).ToList();
        if (failed.Any())
        {
            var msg = string.Join("\n", failed.Select(f =>
                $"  ✗ {f.role} en {f.path}: esperaba {f.expected}, obtuvo {f.actual}"));
            Assert.Fail($"Fallos en matriz de acceso:\n{msg}");
        }
    }

    [Fact]
    public void AccesoSinAuth_RutasProtegidas_Redirigen()
    {
        var passed = false;
        var err    = string.Empty;

        try
        {
            // Navegar al app primero — Chrome 154 bloquea localStorage en about:blank
            Driver.Navigate().GoToUrl($"{TestSettings.Current.FrontendUrl}/login");
            WaitHelper.WaitForPageLoad(Driver);
            try { ((IJavaScriptExecutor)Driver).ExecuteScript("localStorage.clear(); sessionStorage.clear();"); } catch { }

            var protectedRoutes = new[] { "/", "/mis-proyectos", "/admin", "/trabajadores", "/mi-empresa" };
            var allRedirected = true;

            foreach (var route in protectedRoutes)
            {
                NavigateTo(route);
                Thread.Sleep(1000);
                if (!CurrentUrl.Contains("/login"))
                {
                    allRedirected = false;
                    _output.WriteLine($"[✗] {route} no redirigió a /login — URL actual: {CurrentUrl}");
                }
            }

            passed = allRedirected;
            Screenshot(passed ? "RoleMatrix_SinAuth_OK" : "RoleMatrix_SinAuth_FAIL");
        }
        catch (Exception ex)
        {
            err = ex.Message;
        }

        Record(HU, "Rutas protegidas sin autenticación → todas redirigen a /login", passed, passed ? null : err);
        Assert.True(passed, err);
    }
}
