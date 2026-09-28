# ConstruApp — Sprint 1: Autenticación

Proyecto independiente para la demo del **Sprint 1** de ConstruApp.  
SC-603 / SC-702 — Universidad Fidélitas.

## Historias de usuario entregadas

| HU | Descripción |
|----|-------------|
| HU-001 | Registro de usuario con solicitud de aprobación |
| HU-002 | Inicio de sesión con JWT |
| HU-003 | Recuperación de contraseña por correo |
| HU-004 | Actualización de perfil personal |

## Stack

- **Backend**: .NET 10 · ASP.NET Core Identity · EF Core · JWT Bearer
- **Frontend**: React 19 · Vite · MUI v9
- **BD**: Azure SQL Server (`ckmecr-admin-server.database.windows.net`)

---

## Requisitos previos

- [.NET 10 SDK](https://dotnet.microsoft.com/download)
- [Node.js 20+](https://nodejs.org)
- Acceso a la base de datos Azure SQL

---

## Configuración

### 1. Backend — credenciales

Copiar el archivo de ejemplo y rellenar los valores:

```bash
cp ConstruApp.API/appsettings.Development.json.example ConstruApp.API/appsettings.Development.json
```

Editar `appsettings.Development.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=ckmecr-admin-server.database.windows.net,1433;Database=ConstruApp_Sprint1;User Id=TU_USUARIO;Password=TU_PASSWORD;Encrypt=True;TrustServerCertificate=False;"
  },
  "JwtSettings": {
    "SecretKey": "clave-secreta-de-al-menos-32-caracteres"
  },
  "Email": {
    "Usuario": "correo@gmail.com",
    "Password": "app-password",
    "HabilitarEnvio": true
  }
}
```

### 2. Frontend — variables de entorno

Crear `ConstruApp.Web/.env.local`:

```
VITE_API_URL=http://localhost:5115/api
```

---

## Ejecutar

### Backend

```bash
cd ConstruApp.API
dotnet run
```

La API levanta en `http://localhost:5115`.  
Swagger disponible en: `http://localhost:5115/swagger`  
La migración y el seed se aplican automáticamente al iniciar.

**Usuarios de prueba** (creados por el seed):

| Email | Password | Rol |
|-------|----------|-----|
| `admin@test.com` | `Test1234!` | Admin |
| `cliente@test.com` | `Test1234!` | Cliente |
| `constructor@test.com` | `Test1234!` | Constructor |

### Frontend

```bash
cd ConstruApp.Web
npm install
npm run dev
```

Abre `http://localhost:5173`.

---

## Endpoints disponibles

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/api/auth/register` | Solicitar acceso |
| `POST` | `/api/auth/login` | Iniciar sesión → JWT |
| `GET`  | `/api/auth/profile` | Ver perfil (requiere JWT) |
| `PUT`  | `/api/auth/profile` | Actualizar perfil (requiere JWT) |
| `POST` | `/api/auth/forgot-password` | Enviar email de recuperación |
| `POST` | `/api/auth/reset-password` | Restablecer contraseña |
| `POST` | `/api/auth/change-password` | Cambiar contraseña (requiere JWT) |
| `GET`  | `/api/health` | Health check + estado de BD |
