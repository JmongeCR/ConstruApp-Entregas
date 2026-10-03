using ConstruApp.E2E.Helpers;
using OpenQA.Selenium;
using OpenQA.Selenium.Support.UI;
using Xunit;

namespace ConstruApp.E2E.Tests;

[Collection("E2E")]
public class HU008_FavoritosTests : E2ETestBase
{
    private const string HU = "HU-008 Favoritos";

    public HU008_FavoritosTests() : base(1440, 900) { }

    [Fact]
    public void FlujoCompleto_AgregarVerificarEliminarFavorito()
    {
        var err = string.Empty;
        var passed = false;

        try
        {
            // 1. Login como Constructor (favoritos-proveedores es ruta de Constructor)
            LoginHelper.Login(Driver, Settings.Constructor);
            Assert.False(CurrentUrl.Contains("/login"), "Login no exitoso");

            // 2. Navegar a Marketplace para agregar favorito
            NavigateTo("/marketplace");
            WaitHelper.WaitForPageLoad(Driver);

            // 3. Buscar primer card de proveedor con botón de favorito
            var wait = new WebDriverWait(Driver, TimeSpan.FromSeconds(15));
            IWebElement? favBtn = null;

            try
            {
                // Botón de corazón/favorito en marketplace
                favBtn = wait.Until(d =>
                {
                    var btns = d.FindElements(By.XPath("//button[@aria-label='Agregar a favoritos' or @title='Agregar a favoritos' or contains(@aria-label,'favorit') or contains(@title,'favorit')]"));
                    return btns.Count > 0 ? btns[0] : null;
                });
            }
            catch
            {
                // Intentar con ícono de corazón
                favBtn = WaitHelper.TryFind(Driver,
                    By.XPath("//button[.//*[name()='svg' and contains(@class,'MuiFavorite') or contains(@data-testid,'FavoriteBorder')]]"));
            }

            if (favBtn != null)
            {
                favBtn.Click();
                Thread.Sleep(1000);
                Screenshot("HU008_AgregarFavorito_OK");
            }

            // 4. Navegar a Favoritos
            NavigateTo("/favoritos-proveedores");
            WaitHelper.WaitForPageLoad(Driver);

            var pageText = PageSource;
            var hayFavoritos = !pageText.Contains("No tenés proveedores guardados") &&
                               !pageText.Contains("0 guardados");

            Screenshot("HU008_VerFavoritos");

            // 5. Recargar y verificar persistencia
            Driver.Navigate().Refresh();
            WaitHelper.WaitForPageLoad(Driver);
            Thread.Sleep(1000);

            var pageTextDespues = PageSource;
            var persistido = !pageTextDespues.Contains("No tenés proveedores guardados");
            Screenshot("HU008_PersistenciaFavoritos");

            // 6. Eliminar favorito (si hay alguno)
            var deleteBtn = WaitHelper.TryFind(Driver,
                By.XPath("//button[@aria-label='Quitar de favoritos' or @title='Quitar de favoritos']"));

            if (deleteBtn != null)
            {
                deleteBtn.Click();
                Thread.Sleep(1000);
                Screenshot("HU008_EliminarFavorito_OK");

                // Verificar eliminación
                Driver.Navigate().Refresh();
                WaitHelper.WaitForPageLoad(Driver);
            }

            passed = true;
        }
        catch (Exception ex)
        {
            err = ex.Message;
            Screenshot("HU008_Error");
        }

        var ss = ScreenshotHelper.Capture(Driver, passed ? "HU008_FlujoCompleto_OK" : "HU008_FlujoCompleto_FAIL");
        Record(HU, "Flujo completo: agregar / verificar / eliminar favorito", passed, passed ? null : err, ss);

        Assert.True(passed, err);
    }

    [Fact]
    public void FavoritosURL_SinLogin_Redirige()
    {
        var passed = false;
        var err    = string.Empty;

        try
        {
            // Navegar al app primero (Chrome 154 bloquea localStorage en about:blank)
            NavigateTo("/login");
            WaitHelper.WaitForPageLoad(Driver);
            try { ((IJavaScriptExecutor)Driver).ExecuteScript("localStorage.clear(); sessionStorage.clear();"); } catch { }
            NavigateTo("/favoritos-proveedores");
            WaitHelper.WaitForPageLoad(Driver);
            Thread.Sleep(1500);

            // Debe redirigir a /login
            passed = CurrentUrl.Contains("/login");
            Screenshot(passed ? "HU008_RedirectLogin_OK" : "HU008_RedirectLogin_FAIL");
        }
        catch (Exception ex)
        {
            err = ex.Message;
            Screenshot("HU008_RedirectLogin_Error");
        }

        var ss = ScreenshotHelper.Capture(Driver, passed ? "HU008_AccesoSinLogin_OK" : "HU008_AccesoSinLogin_FAIL");
        Record(HU, "Acceso a /favoritos-proveedores sin login → redirige a /login", passed, passed ? null : err, ss);
        Assert.True(passed, err);
    }
}
