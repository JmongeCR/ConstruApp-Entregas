using System.Text;

namespace ConstruApp.E2E.Helpers;

public record TestResult(string HU, string Name, bool Passed, string? Error, string? ScreenshotPath);

public static class ReportHelper
{
    private static readonly List<TestResult> Results = [];
    private static readonly object Lock = new();

    public static void Record(TestResult result)
    {
        lock (Lock) Results.Add(result);
    }

    public static void WriteHtmlReport(string outputDir)
    {
        Directory.CreateDirectory(outputDir);
        var path = Path.Combine(outputDir, $"E2E_Report_{DateTime.Now:yyyyMMdd_HHmmss}.html");

        lock (Lock)
        {
            var passed = Results.Count(r => r.Passed);
            var failed = Results.Count(r => !r.Passed);
            var byHU = Results.GroupBy(r => r.HU).OrderBy(g => g.Key);

            var sb = new StringBuilder();
            sb.AppendLine("""
                <!DOCTYPE html>
                <html lang="es">
                <head>
                  <meta charset="UTF-8"/>
                  <title>ConstruApp E2E Report</title>
                  <style>
                    body { font-family: system-ui; margin: 0; padding: 24px; background: #f8fafc; color: #1e293b; }
                    h1 { font-size: 1.6rem; font-weight: 800; margin-bottom: 4px; }
                    .summary { display: flex; gap: 16px; margin: 16px 0; flex-wrap: wrap; }
                    .card { background: #fff; border-radius: 8px; padding: 16px 24px; border: 1px solid #e2e8f0; min-width: 140px; }
                    .card .num { font-size: 2rem; font-weight: 800; }
                    .pass { color: #16a34a; } .fail { color: #dc2626; } .total { color: #2563eb; }
                    table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 8px; overflow: hidden; border: 1px solid #e2e8f0; margin-bottom: 24px; }
                    th { background: #f1f5f9; padding: 10px 14px; text-align: left; font-size: 13px; font-weight: 700; }
                    td { padding: 10px 14px; font-size: 13px; border-top: 1px solid #f1f5f9; vertical-align: top; }
                    .badge { display: inline-block; padding: 2px 10px; border-radius: 99px; font-size: 11px; font-weight: 700; }
                    .badge-pass { background: #dcfce7; color: #16a34a; }
                    .badge-fail { background: #fee2e2; color: #dc2626; }
                    .hu-title { font-weight: 700; font-size: 1rem; margin: 24px 0 8px; }
                    pre { white-space: pre-wrap; word-break: break-all; font-size: 11px; background: #f8fafc; padding: 8px; border-radius: 4px; margin: 0; }
                    a img { max-width: 120px; border-radius: 4px; border: 1px solid #e2e8f0; }
                  </style>
                </head>
                <body>
                """);

            sb.AppendLine($"<h1>ConstruApp — Reporte E2E</h1>");
            sb.AppendLine($"<p style='color:#64748b;font-size:13px'>Generado: {DateTime.Now:dd/MM/yyyy HH:mm:ss}</p>");

            sb.AppendLine("<div class='summary'>");
            sb.AppendLine($"<div class='card'><div class='num total'>{Results.Count}</div><div>Total</div></div>");
            sb.AppendLine($"<div class='card'><div class='num pass'>{passed}</div><div>Aprobadas</div></div>");
            sb.AppendLine($"<div class='card'><div class='num fail'>{failed}</div><div>Fallidas</div></div>");
            sb.AppendLine($"<div class='card'><div class='num'>{(Results.Count > 0 ? passed * 100 / Results.Count : 0)}%</div><div>Éxito</div></div>");
            sb.AppendLine("</div>");

            foreach (var group in byHU)
            {
                sb.AppendLine($"<div class='hu-title'>{group.Key}</div>");
                sb.AppendLine("<table><thead><tr><th>Prueba</th><th>Estado</th><th>Error</th><th>Screenshot</th></tr></thead><tbody>");
                foreach (var r in group)
                {
                    var badge = r.Passed
                        ? "<span class='badge badge-pass'>✓ PASS</span>"
                        : "<span class='badge badge-fail'>✗ FAIL</span>";

                    var errorCell = r.Error is null
                        ? "—"
                        : $"<pre>{System.Web.HttpUtility.HtmlEncode(r.Error)}</pre>";

                    var ssCell = !string.IsNullOrEmpty(r.ScreenshotPath)
                        ? $"<a href='{r.ScreenshotPath}' target='_blank'><img src='{r.ScreenshotPath}' alt='ss'/></a>"
                        : "—";

                    sb.AppendLine($"<tr><td>{r.Name}</td><td>{badge}</td><td>{errorCell}</td><td>{ssCell}</td></tr>");
                }
                sb.AppendLine("</tbody></table>");
            }

            sb.AppendLine("</body></html>");
            File.WriteAllText(path, sb.ToString());
        }

        Console.WriteLine($"[Report] Generado: {path}");
    }
}
