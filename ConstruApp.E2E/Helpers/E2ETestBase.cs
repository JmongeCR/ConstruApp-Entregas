using ConstruApp.E2E.Config;
using OpenQA.Selenium;

namespace ConstruApp.E2E.Helpers;

public abstract class E2ETestBase : IDisposable
{
    protected IWebDriver Driver { get; private set; }
    protected TestSettings Settings => TestSettings.Current;

    protected E2ETestBase(int width = 1440, int height = 900)
    {
        Driver = DriverFactory.Create(width, height);
    }

    protected void Screenshot(string name)
        => ScreenshotHelper.Capture(Driver, name);

    protected void Record(string hu, string name, bool passed, string? error = null, string? screenshotPath = null)
        => ReportHelper.Record(new TestResult(hu, name, passed, error, screenshotPath));

    protected void NavigateTo(string path)
    {
        Driver.Navigate().GoToUrl($"{Settings.FrontendUrl}{path}");
        WaitHelper.WaitForPageLoad(Driver);
    }

    protected string PageSource => Driver.PageSource;
    protected string CurrentUrl => Driver.Url;

    public void Dispose()
    {
        try { Driver.Quit(); } catch { }
    }
}
