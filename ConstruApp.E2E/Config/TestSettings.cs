using Microsoft.Extensions.Configuration;

namespace ConstruApp.E2E.Config;

public class TestSettings
{
    public static TestSettings Current { get; } = Load();

    public string FrontendUrl         { get; init; } = "http://localhost:5173";
    public string BackendUrl          { get; init; } = "http://localhost:5115";
    public string ScreenshotPath      { get; init; } = "TestResults/Screenshots";
    public bool   HeadlessBrowser     { get; init; } = false;
    public int    ImplicitWaitSeconds { get; init; } = 10;
    public int    PageLoadTimeoutSeconds { get; init; } = 30;
    public UserCredentials Admin       { get; init; } = new();
    public UserCredentials Cliente     { get; init; } = new();
    public UserCredentials Constructor { get; init; } = new();
    public UserCredentials Proveedor   { get; init; } = new();

    private static TestSettings Load()
    {
        var config = new ConfigurationBuilder()
            .AddJsonFile("appsettings.json", optional: true)
            .AddEnvironmentVariables()
            .Build();

        var section = config.GetSection("TestSettings");
        var s = new TestSettings
        {
            FrontendUrl          = section["FrontendUrl"]          ?? "http://localhost:5173",
            BackendUrl           = section["BackendUrl"]           ?? "http://localhost:5115",
            ScreenshotPath       = section["ScreenshotPath"]       ?? "TestResults/Screenshots",
            HeadlessBrowser      = bool.TryParse(section["HeadlessBrowser"],      out var h) && h,
            ImplicitWaitSeconds  = int.TryParse(section["ImplicitWaitSeconds"],   out var i) ? i : 10,
            PageLoadTimeoutSeconds = int.TryParse(section["PageLoadTimeoutSeconds"], out var p) ? p : 30,
            Admin       = BindUser(section, "Users:Admin"),
            Cliente     = BindUser(section, "Users:Cliente"),
            Constructor = BindUser(section, "Users:Constructor"),
            Proveedor   = BindUser(section, "Users:Proveedor"),
        };
        return s;
    }

    private static UserCredentials BindUser(IConfigurationSection section, string key) => new()
    {
        Email    = section[key + ":Email"]    ?? "",
        Password = section[key + ":Password"] ?? "",
    };
}

public record UserCredentials
{
    public string Email    { get; init; } = "";
    public string Password { get; init; } = "";
}
