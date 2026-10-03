using ConstruApp.E2E.Helpers;
using OpenQA.Selenium;
using OpenQA.Selenium.Support.UI;
using Xunit;

namespace ConstruApp.E2E.Tests;

[Collection("E2E")]
public class HU011_PersonalTests : E2ETestBase
{
    private const string HU = "HU-011 Administrar personal";

    public HU011_PersonalTests() : base(1440, 900) { }

    private void AbrirDialogoAgregar()
    {
        NavigateTo("/trabajadores");
        WaitHelper.WaitForPageLoad(Driver);
        Thread.Sleep(1000);

        // Clic en "Agregar colaborador" (PageHeader addLabel)
        var addBtn = WaitHelper.WaitForVisible(Driver,
            By.XPath("//button[contains(text(),'Agregar colaborador') or contains(text(),'Agregar primer')]"),
            12);
        addBtn.Click();
        Thread.Sleep(800);
    }

    private void LlenarNombre(string nombre)
    {
        var input = WaitHelper.WaitForVisible(Driver,
            By.XPath("//label[contains(text(),'Nombre completo')]/..//input"), 10);
        input.Clear();
        input.SendKeys(nombre);
    }

    private void LlenarCampo(string labelText, string value)
    {
        var input = WaitHelper.TryFind(Driver,
            By.XPath($"//label[contains(text(),'{labelText}')]/..//input"));
        input?.Clear();
        input?.SendKeys(value);
    }

    private void ClickGuardar()
    {
        var btn = Driver.FindElement(
            By.XPath("//button[contains(text(),'Guardar colaborador') or contains(text(),'Actualizar')]"));
        btn.Click();
        Thread.Sleep(1200);
    }

    [Fact]
    public void CrearColaborador_ApareceEnTabla()
    {
        var passed = false;
        var err    = string.Empty;
        var ts     = DateTimeOffset.Now.ToUnixTimeSeconds();
        var nombre = $"Juan E2E {ts}";

        try
        {
            LoginHelper.Login(Driver, Settings.Constructor);
            AbrirDialogoAgregar();

            LlenarNombre(nombre);
            LlenarCampo("Puesto", "Maestro de obras");
            LlenarCampo("Especialidad", "Obra gris");
            LlenarCampo("Teléfono", "8811-0011");

            ClickGuardar();

            // Verificar que aparece en la tabla
            var pageText = PageSource;
            passed = pageText.Contains(nombre);

            Screenshot(passed ? "HU011_CrearColaborador_OK" : "HU011_CrearColaborador_FAIL");
        }
        catch (Exception ex)
        {
            err = ex.Message;
            Screenshot("HU011_CrearColaborador_Error");
        }

        var ss = ScreenshotHelper.Capture(Driver, passed ? "HU011_CrearColaborador_OK" : "HU011_CrearColaborador_FAIL");
        Record(HU, "Crear colaborador — aparece en tabla", passed, passed ? null : err, ss);
        Assert.True(passed, err);
    }

    [Fact]
    public void EmailInvalido_MuestraError()
    {
        var passed = false;
        var err    = string.Empty;

        try
        {
            LoginHelper.Login(Driver, Settings.Constructor);
            AbrirDialogoAgregar();

            LlenarNombre("Colaborador Email Test");
            LlenarCampo("Correo electrónico", "correo-sin-arroba");
            ClickGuardar();

            var pageText = PageSource;
            passed = pageText.Contains("inválido") || pageText.Contains("invalido") ||
                     pageText.Contains("Correo") && pageText.Contains("inválido");

            Screenshot(passed ? "HU011_EmailInvalido_OK" : "HU011_EmailInvalido_FAIL");
        }
        catch (Exception ex)
        {
            err = ex.Message;
            Screenshot("HU011_EmailInvalido_Error");
        }

        Record(HU, "Validación: email inválido rechazado", passed, passed ? null : err);
        Assert.True(passed, err);
    }

    [Fact]
    public void CedulaDuplicada_MuestraConflicto()
    {
        var passed = false;
        var err    = string.Empty;
        var ts     = DateTimeOffset.Now.ToUnixTimeSeconds();
        var cedula = $"1-{ts % 10000:0000}-{(ts / 10000) % 10000:0000}";

        try
        {
            LoginHelper.Login(Driver, Settings.Constructor);

            // Crear primer colaborador con esa cédula
            AbrirDialogoAgregar();
            LlenarNombre($"Primer E2E {ts}");
            LlenarCampo("Puesto", "Electricista");
            LlenarCampo("Cédula de identidad", cedula);
            ClickGuardar();

            // Crear segundo con misma cédula
            AbrirDialogoAgregar();
            LlenarNombre($"Segundo E2E {ts}");
            LlenarCampo("Puesto", "Plomero");
            LlenarCampo("Cédula de identidad", cedula);
            ClickGuardar();

            var pageText = PageSource;
            passed = pageText.Contains("ya existe") || pageText.Contains("cédula") ||
                     pageText.Contains("documento") || pageText.Contains("registrado");

            Screenshot(passed ? "HU011_CedulaDuplicada_OK" : "HU011_CedulaDuplicada_FAIL");
        }
        catch (Exception ex)
        {
            err = ex.Message;
            Screenshot("HU011_CedulaDuplicada_Error");
        }

        var ss = ScreenshotHelper.Capture(Driver, passed ? "HU011_CedulaDuplicada_OK" : "HU011_CedulaDuplicada_FAIL");
        Record(HU, "Validación: cédula duplicada rechazada con mensaje claro", passed, passed ? null : err, ss);
        Assert.True(passed, err);
    }

    [Fact]
    public void DesactivarColaborador_MuestraInactivo()
    {
        var passed = false;
        var err    = string.Empty;
        var ts     = DateTimeOffset.Now.ToUnixTimeSeconds();

        try
        {
            LoginHelper.Login(Driver, Settings.Constructor);

            // Crear colaborador
            AbrirDialogoAgregar();
            LlenarNombre($"Desactivar E2E {ts}");
            LlenarCampo("Puesto", "Pintor");
            LlenarCampo("Especialidad", "Pintura");
            ClickGuardar();

            // Esperar a que el diálogo de agregar se cierre completamente antes de buscar Editar
            try
            {
                new WebDriverWait(Driver, TimeSpan.FromSeconds(5))
                    .Until(d => !d.FindElements(By.CssSelector(".MuiDialog-root")).Any(e => e.Displayed));
            }
            catch { }
            Thread.Sleep(600);

            // Editar ese colaborador → cambiar estado a Inactivo
            var editBtns = Driver.FindElements(
                By.XPath("//button[@aria-label='Editar' or @title='Editar']"));

            if (editBtns.Count > 0)
            {
                // JS click para evitar que el backdrop del diálogo intercepte el evento
                ((IJavaScriptExecutor)Driver).ExecuteScript("arguments[0].click();", editBtns[^1]);
                Thread.Sleep(800);

                // Cambiar Estado a Inactivo (MUI Select usa role='combobox')
                var estadoSelect = WaitHelper.TryFind(Driver,
                    By.XPath("//label[contains(text(),'Estado')]/..//div[@role='combobox'] | //label[contains(text(),'Estado')]/..//div[contains(@class,'MuiSelect-select')]"));
                estadoSelect?.Click();
                Thread.Sleep(400);

                var inactivoOption = WaitHelper.TryFind(Driver,
                    By.XPath("//li[contains(text(),'Inactivo')]"));
                inactivoOption?.Click();
                Thread.Sleep(400);

                // Guardar
                var updateBtn = Driver.FindElement(
                    By.XPath("//button[contains(text(),'Actualizar') or contains(text(),'Guardar')]"));
                updateBtn.Click();
                Thread.Sleep(1200);

                var pageText = PageSource;
                passed = pageText.Contains("Inactivo");
                Screenshot(passed ? "HU011_Desactivar_OK" : "HU011_Desactivar_FAIL");
            }
            else
            {
                // No hay colaboradores en lista para editar
                passed = false;
                err = "No se encontraron botones de editar";
            }
        }
        catch (Exception ex)
        {
            err = ex.Message;
            Screenshot("HU011_Desactivar_Error");
        }

        var ss = ScreenshotHelper.Capture(Driver, passed ? "HU011_DesactivarColaborador_OK" : "HU011_DesactivarColaborador_FAIL");
        Record(HU, "Desactivar colaborador → estado Inactivo en tabla", passed, passed ? null : err, ss);
        Assert.True(passed, err);
    }

    [Fact]
    public void NombreRequerido_SinNombreMuestraError()
    {
        var passed = false;
        var err    = string.Empty;

        try
        {
            LoginHelper.Login(Driver, Settings.Constructor);
            AbrirDialogoAgregar();

            // NO llenar nombre, sí llenar puesto
            LlenarCampo("Puesto", "Carpintero");
            ClickGuardar();

            var pageText = PageSource;
            passed = pageText.Contains("requerido") || pageText.Contains("obligatorio");

            Screenshot(passed ? "HU011_NombreRequerido_OK" : "HU011_NombreRequerido_FAIL");
        }
        catch (Exception ex)
        {
            err = ex.Message;
            Screenshot("HU011_NombreRequerido_Error");
        }

        Record(HU, "Validación: nombre de colaborador requerido", passed, passed ? null : err);
        Assert.True(passed, err);
    }
}
