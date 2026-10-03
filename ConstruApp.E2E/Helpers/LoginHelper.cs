using ConstruApp.E2E.Config;
using OpenQA.Selenium;
using OpenQA.Selenium.Support.UI;

namespace ConstruApp.E2E.Helpers;

public static class LoginHelper
{
    public static void Login(IWebDriver driver, UserCredentials credentials)
    {
        driver.Navigate().GoToUrl($"{TestSettings.Current.FrontendUrl}/login");
        var wait = new WebDriverWait(driver, TimeSpan.FromSeconds(15));

        // Esperar formulario de login
        var emailInput = wait.Until(d =>
        {
            var el = d.FindElement(By.CssSelector("input[type='email'], input[name='email']"));
            return el.Displayed ? el : null;
        });

        // Triple-click selecciona todo el texto; luego Delete limpia; luego SendKeys escribe.
        // Necesario para inputs controlados de React donde Clear() no dispara onChange.
        emailInput!.Click();
        emailInput.SendKeys(Keys.Control + "a");
        emailInput.SendKeys(Keys.Delete);
        emailInput.SendKeys(credentials.Email);

        var passwordInput = driver.FindElement(By.CssSelector("input[type='password']"));
        passwordInput.Click();
        passwordInput.SendKeys(Keys.Control + "a");
        passwordInput.SendKeys(Keys.Delete);
        passwordInput.SendKeys(credentials.Password);

        var submitBtn = driver.FindElement(By.CssSelector("button[type='submit']"));
        submitBtn.Click();

        // Esperar redirección al dashboard (URL ya no /login)
        wait.Until(d => !d.Url.Contains("/login"));
    }

    public static void Logout(IWebDriver driver)
    {
        try
        {
            // Abre avatar/menú de usuario
            var avatarBtn = driver.FindElement(By.CssSelector("[aria-label='user-menu'], [data-testid='user-menu']"));
            avatarBtn.Click();

            var logoutBtn = new WebDriverWait(driver, TimeSpan.FromSeconds(5))
                .Until(d => d.FindElement(By.XPath("//*[contains(text(),'Cerrar sesión') or contains(text(),'Salir')]")));
            logoutBtn.Click();

            new WebDriverWait(driver, TimeSpan.FromSeconds(10))
                .Until(d => d.Url.Contains("/login"));
        }
        catch
        {
            // Si falla el logout por UI, borramos storage directamente
            try
            {
                ((IJavaScriptExecutor)driver).ExecuteScript("localStorage.clear(); sessionStorage.clear();");
                driver.Navigate().GoToUrl($"{TestSettings.Current.FrontendUrl}/login");
            }
            catch { /* ignorar */ }
        }
    }
}
