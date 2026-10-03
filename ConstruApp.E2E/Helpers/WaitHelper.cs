using OpenQA.Selenium;
using OpenQA.Selenium.Support.UI;

namespace ConstruApp.E2E.Helpers;

public static class WaitHelper
{
    public static IWebElement WaitForVisible(IWebDriver driver, By by, int timeoutSeconds = 15)
    {
        var wait = new WebDriverWait(driver, TimeSpan.FromSeconds(timeoutSeconds));
        return wait.Until(d =>
        {
            try
            {
                var el = d.FindElement(by);
                return el.Displayed ? el : null;
            }
            catch (NoSuchElementException)
            {
                return null;
            }
        })!;
    }

    public static IWebElement WaitForText(IWebDriver driver, string text, int timeoutSeconds = 15)
    {
        var wait = new WebDriverWait(driver, TimeSpan.FromSeconds(timeoutSeconds));
        return wait.Until(d =>
        {
            try
            {
                return d.FindElement(By.XPath($"//*[contains(text(),'{text}')]"));
            }
            catch
            {
                return null;
            }
        })!;
    }

    public static bool WaitForAbsent(IWebDriver driver, By by, int timeoutSeconds = 10)
    {
        var wait = new WebDriverWait(driver, TimeSpan.FromSeconds(timeoutSeconds));
        try
        {
            return wait.Until(d =>
            {
                try { d.FindElement(by); return false; }
                catch (NoSuchElementException) { return true; }
            });
        }
        catch { return false; }
    }

    public static void WaitForPageLoad(IWebDriver driver, int timeoutSeconds = 15)
    {
        var wait = new WebDriverWait(driver, TimeSpan.FromSeconds(timeoutSeconds));
        wait.Until(d => ((IJavaScriptExecutor)d)
            .ExecuteScript("return document.readyState")?.ToString() == "complete");
        Thread.Sleep(800); // breve pausa para React
    }

    public static IWebElement? TryFind(IWebDriver driver, By by)
    {
        try { return driver.FindElement(by); }
        catch { return null; }
    }
}
