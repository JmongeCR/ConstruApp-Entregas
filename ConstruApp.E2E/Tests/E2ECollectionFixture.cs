using ConstruApp.E2E.Helpers;
using Xunit;

namespace ConstruApp.E2E.Tests;

[CollectionDefinition("E2E")]
public class E2ECollection : ICollectionFixture<E2ECollectionFixture>;

public class E2ECollectionFixture : IDisposable
{
    public E2ECollectionFixture()
    {
        var dir = Path.Combine(
            AppContext.BaseDirectory,
            ConstruApp.E2E.Config.TestSettings.Current.ScreenshotPath);
        Directory.CreateDirectory(dir);

        var reportDir = Path.Combine(AppContext.BaseDirectory, "TestResults");
        Directory.CreateDirectory(reportDir);
    }

    public void Dispose()
    {
        // Generar reporte HTML al finalizar toda la colección
        var reportDir = Path.Combine(AppContext.BaseDirectory, "TestResults");
        ReportHelper.WriteHtmlReport(reportDir);
    }
}
