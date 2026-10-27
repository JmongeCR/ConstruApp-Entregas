# Inicio del Sprint 3 — ConstruApp

Consulta de Jira: 26 de octubre de 2026, zona America/Costa_Rica.

## Estado confirmado

- Tablero: CAPP board, ID 170.
- Sprint: CAPP Sprint 3, ID 138, activo. Sprint 2 cerrado.
- Fecha final registrada: 9 de noviembre de 2026, 12:00 p. m. de Costa Rica.
- Alcance: 13 historias, 75 puntos; 1 En progreso y 12 To Do después del inicio de CAPP-29; ninguna terminada.
- César: 4 historias, 21 puntos.

## Orden de trabajo de César

| Orden | Historia | Puntos | Estado / siguiente acción |
| --- | --- | --- | --- |
| 1 | [CAPP-29 — Borradores y envío a cotización](https://ckmecr.atlassian.net/browse/CAPP-29) | 3 | En progreso. Completar guardado parcial y requisitos de envío. |
| 2 | [CAPP-32 — Sugerir precios](https://ckmecr.atlassian.net/browse/CAPP-32) | 8 | To Do. Revisar borrador local y confirmar fuente de precios antes de mostrar rangos. |
| 3 | [CAPP-35 — Comparar cotizaciones](https://ckmecr.atlassian.net/browse/CAPP-35) | 5 | To Do. Revisar borrador local y contrato de cotizaciones con CAPP-34. |
| 4 | [CAPP-38 — Registrar avances](https://ckmecr.atlassian.net/browse/CAPP-38) | 5 | To Do. Revisar borrador local, permisos y estados del proyecto. |

El orden sigue Rank de Jira para las historias asignadas y puede ajustarse según dependencias. Las referencias a otras historias son puntos de integración por revisar, no bloqueos formalmente confirmados.

## Trabajo inicial de CAPP-29

Se reutilizó el worktree `ConstruApp-Entregas-CAPP29`, rama `feature/CAPP-29-envio-cotizacion`, conservando los cambios locales existentes. La revisión encontró el endpoint de envío, la fecha de envío, una migración y cambios en la interfaz preparados previamente.

Se corrigió que la fecha de publicación coincida con el envío, para que el listado público ordene por la publicación efectiva. Se añadió auditoría del envío y se ajustó el texto visible a «En proceso de cotización». Se amplió la comprobación de fechas en la prueba de envío exitoso.

Validación tras estos ajustes:

- Pruebas de ConstruApp.Tests: 24 correctas, 0 fallidas, 0 omitidas.
- Compilación de producción de la web con Vite: exitosa.
- `git diff --check`: sin errores.
- La restauración detectó advertencias de dependencias existentes (MailKit, MimeKit y System.Security.Cryptography.Pkcs). No fueron modificadas en este inicio.

## Pendientes para aceptar CAPP-29

1. Permitir persistir y retomar un borrador incompleto: Create y Update aún aplican validación completa de información general.
2. Definir con la fuente del proyecto qué documentos son obligatorios e integrar su validación con CAPP-28; el endpoint revisado no verifica documentos. No inventar categorías obligatorias.
3. Cubrir los escenarios de borrador parcial, propiedad ajena, documentos faltantes, persistencia y visibilidad pública.
4. Revisar la integración con el repositorio actualizado: origin/main y la base local de la rama difieren. No se fusionaron ramas ni se sobrescribió trabajo previo.
5. Validar la migración y el flujo completo en la aplicación real con su base SQL. No se ejecutaron migraciones ni UAT en esta sesión.
6. Publicar la rama y abrir el PR cuando la historia esté preparada para revisión; los cambios permanecen locales y CAPP-29 continúa En progreso.

Las 24 pruebas y la compilación verifican el estado local; no acreditan el cumplimiento completo de la historia ni validación de Azure.
