# ConstruApp.E2E — Suite de Pruebas End-to-End

Suite Selenium WebDriver + xUnit para el Sprint 2 de ConstruApp.

## Prerrequisitos

- .NET 8 SDK
- Google Chrome instalado
- Frontend corriendo en `http://localhost:5173` (`npm run dev`)
- Backend corriendo en `http://localhost:5115` (`dotnet run`)
- Base de datos sembrada con usuarios de prueba

## Usuarios de prueba

| Rol         | Email                        | Password        |
|-------------|------------------------------|-----------------|
| Admin       | admin@test.com               | Test1234!       |
| Cliente     | cliente@test.com             | Test1234!       |
| Constructor | constructor@test.com         | Test1234!       |
| Proveedor   | proveedor@construapp.com     | Proveedor123!   |

## Configuración

Editar `appsettings.json` o definir variables de entorno:

```
TestSettings__FrontendUrl=http://localhost:5173
TestSettings__BackendUrl=http://localhost:5115
TestSettings__HeadlessBrowser=true
```

## Ejecutar todas las pruebas

```bash
dotnet test ConstruApp.E2E --logger "console;verbosity=detailed"
```

## Ejecutar por HU

```bash
dotnet test ConstruApp.E2E --filter "FullyQualifiedName~HU008"
dotnet test ConstruApp.E2E --filter "FullyQualifiedName~HU009"
dotnet test ConstruApp.E2E --filter "FullyQualifiedName~HU011"
dotnet test ConstruApp.E2E --filter "FullyQualifiedName~HU014"
dotnet test ConstruApp.E2E --filter "FullyQualifiedName~RoleAccess"
dotnet test ConstruApp.E2E --filter "FullyQualifiedName~Navigation"
```

## Resultados

- Screenshots: `bin/Debug/net8.0/TestResults/Screenshots/`
- Reporte HTML: `bin/Debug/net8.0/TestResults/E2E_Report_*.html`

## Pruebas incluidas

| HU       | Prueba                                              |
|----------|-----------------------------------------------------|
| HU-008   | Agregar/verificar/eliminar favorito                 |
| HU-008   | Acceso sin login → redirección a /login             |
| HU-009   | Validación nombre requerido                         |
| HU-009   | Validación email inválido                           |
| HU-009   | Registro completo + persistencia al recargar        |
| HU-009   | Cédula jurídica duplicada rechazada                 |
| HU-011   | Crear colaborador → aparece en tabla                |
| HU-011   | Email inválido rechazado                            |
| HU-011   | Cédula duplicada rechazada con mensaje              |
| HU-011   | Desactivar colaborador → estado Inactivo            |
| HU-011   | Nombre requerido                                    |
| HU-014   | Crear proyecto + verificar en Mis Proyectos         |
| HU-014   | Publicar proyecto → estado Publicado                |
| HU-014   | Transición inválida → rechazada (400/403)           |
| Roles    | Matriz completa rol × ruta × resultado esperado     |
| Roles    | Rutas protegidas sin auth → todas redirigen         |
| Nav      | Sidebar links sin pantallas en blanco ni errores JS |
| Nav      | Responsive: 1440/768/390 sin overflow horizontal    |
