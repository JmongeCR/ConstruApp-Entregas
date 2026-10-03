using ConstruApp.E2E.Config;
using OpenQA.Selenium;

namespace ConstruApp.E2E.Helpers;

public static class ScreenshotHelper
{
    private static readonly string BaseDir = Path.Combine(
        AppContext.BaseDirectory,
        TestSettings.Current.ScreenshotPath);

    static ScreenshotHelper()
    {
        Directory.CreateDirectory(BaseDir);
    }

    public static string Capture(IWebDriver driver, string name)
    {
        try
        {
            var screenshot = ((ITakesScreenshot)driver).GetScreenshot();
            var filename   = $"{name}_{DateTime.Now:yyyyMMdd_HHmmss}.png";
            var fullPath   = Path.Combine(BaseDir, filename);
            screenshot.SaveAsFile(fullPath);
            return fullPath;
        }
        catch
        {
            return string.Empty;
        }
    }
}
