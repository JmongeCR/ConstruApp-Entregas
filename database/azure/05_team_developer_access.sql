/*
  Acceso vigente del equipo de desarrollo de ConstruApp.

  Requisitos:
  1. El grupo de seguridad ConstruApp-Developers debe existir en Microsoft Entra.
  2. Los integrantes deben estar agregados al grupo como invitados B2B.
  3. Ejecutar con el administrador de Microsoft Entra dentro de ConstruAppDB.

  No concede db_owner, db_securityadmin, db_accessadmin, CONTROL DATABASE
  ni permisos administrativos del servidor lógico.
*/

IF NOT EXISTS (
    SELECT 1
    FROM sys.database_principals
    WHERE name = N'ConstruApp-Developers'
)
BEGIN
    CREATE USER [ConstruApp-Developers] FROM EXTERNAL PROVIDER;
END;
GO

IF IS_ROLEMEMBER(N'db_datareader', N'ConstruApp-Developers') <> 1
    ALTER ROLE [db_datareader] ADD MEMBER [ConstruApp-Developers];

IF IS_ROLEMEMBER(N'db_datawriter', N'ConstruApp-Developers') <> 1
    ALTER ROLE [db_datawriter] ADD MEMBER [ConstruApp-Developers];

IF IS_ROLEMEMBER(N'db_ddladmin', N'ConstruApp-Developers') <> 1
    ALTER ROLE [db_ddladmin] ADD MEMBER [ConstruApp-Developers];
GO

GRANT EXECUTE TO [ConstruApp-Developers];
GRANT VIEW DEFINITION TO [ConstruApp-Developers];
GO

-- Verificacion de roles concedidos.
SELECT
    member_principal.name AS principal,
    role_principal.name AS database_role
FROM sys.database_role_members AS role_membership
INNER JOIN sys.database_principals AS role_principal
    ON role_principal.principal_id = role_membership.role_principal_id
INNER JOIN sys.database_principals AS member_principal
    ON member_principal.principal_id = role_membership.member_principal_id
WHERE member_principal.name = N'ConstruApp-Developers'
ORDER BY role_principal.name;

-- Debe devolver cero filas.
SELECT
    role_principal.name AS forbidden_admin_role
FROM sys.database_role_members AS role_membership
INNER JOIN sys.database_principals AS role_principal
    ON role_principal.principal_id = role_membership.role_principal_id
INNER JOIN sys.database_principals AS member_principal
    ON member_principal.principal_id = role_membership.member_principal_id
WHERE member_principal.name = N'ConstruApp-Developers'
  AND role_principal.name IN (N'db_owner', N'db_securityadmin', N'db_accessadmin');
GO
