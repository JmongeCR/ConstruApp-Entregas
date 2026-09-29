/*
  Requisitos:
  1. Configurar un administrador de Microsoft Entra en el servidor SQL.
  2. Agregar como invitados B2B en Microsoft Entra los correos personales o corporativos del equipo.
  3. Sustituir los correos de ejemplo por las identidades invitadas exactas.
  4. Ejecutar conectado con Microsoft Entra dentro de ConstruAppDB.
*/

-- CREATE USER [correo.personal@dominio.com] FROM EXTERNAL PROVIDER;
-- ALTER ROLE db_datareader ADD MEMBER [correo.personal@dominio.com];
-- ALTER ROLE db_datawriter ADD MEMBER [correo.personal@dominio.com];
-- GRANT EXECUTE TO [correo.personal@dominio.com];
-- GRANT VIEW DEFINITION TO [correo.personal@dominio.com];

-- Repetir el bloque para cada integrante. No compartir el usuario SQL de la aplicación.
