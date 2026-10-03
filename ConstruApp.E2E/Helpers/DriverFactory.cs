using ConstruApp.E2E.Config;
using OpenQA.Selenium;
using OpenQA.Selenium.Chrome;

namespace ConstruApp.E2E.Helpers;

public static class DriverFactory
{
    public static IWebDriver Create(int? widthOverride = null, int? heightOverride = null)
    {
        var settings = TestSettings.Current;
        var options = new ChromeOptions();

        if (settings.HeadlessBrowser)
        {
            options.AddArgument("--headless=new");
            options.AddArgument("--disable-gpu");
        }

        options.AddArgument("--no-sandbox");
        options.AddArgument("--disable-dev-shm-usage");
        options.AddArgument("--disable-extensions");
        options.AddArgument("--disable-notifications");

        int width  = widthOverride ?? 1440;
        int height = heightOverride ?? 900;
        options.AddArgument($"--window-size={width},{height}");

        var driver = new ChromeDriver(options);
        driver.Manage().Timeouts().ImplicitWait    = TimeSpan.FromSeconds(settings.ImplicitWaitSeconds);
        driver.Manage().Timeouts().PageLoad        = TimeSpan.FromSeconds(settings.PageLoadTimeoutSeconds);

        return driver;
    }
}
