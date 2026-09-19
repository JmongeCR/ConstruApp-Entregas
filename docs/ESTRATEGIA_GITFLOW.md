# Estrategia GitFlow de ConstruApp

## Verificación del repositorio

- Repositorio oficial: `https://github.com/JmongeCR/ConstruApp`
- Remoto configurado: `origin`
- Rama predeterminada remota: `main`
- Commit verificado: `894b055cfd1a49d817ba023f95107825e1e44c54`
- Fecha de verificación: 18 de septiembre de 2026
- Estado remoto observado: únicamente existe `origin/main`; todavía no se ha publicado `develop` ni ninguna rama `feature/*`.

El proyecto se clonó desde GitHub y el clon quedó vinculado al remoto oficial. La copia anterior, `ConstruApp-main`, proviene de un archivo ZIP y no contiene metadatos Git, por lo que no debe utilizarse para confirmar ramas, historial o remoto.

## Ramas del equipo

| Rama | Propósito | Origen | Destino de integración |
| --- | --- | --- | --- |
| `main` | Versión estable y entregable | Repositorio oficial | No aplica |
| `develop` | Integración del trabajo del sprint | `main` | `main` mediante pull request al cierre del sprint |
| `feature/CAPP-<id>-<descripcion>` | Desarrollo de una historia o tarea de Jira | `develop` | `develop` mediante pull request |
| `release/<version>` | Estabilización de una entrega | `develop` | `main` y luego sincronización con `develop` |
| `hotfix/<version>` | Corrección urgente de producción | `main` | `main` y luego sincronización con `develop` |

Los nombres deben escribirse en minúsculas, usar guiones y contener la clave de Jira cuando corresponda. Ejemplo: `feature/CAPP-66-repositorio-gitflow`.

## Flujo de trabajo

1. Actualizar `develop` antes de iniciar una tarea.
2. Crear una rama `feature/*` desde `develop`.
3. Realizar commits pequeños con la clave de Jira, por ejemplo: `docs(CAPP-66): documentar estrategia GitFlow`.
4. Publicar la rama y abrir un pull request hacia `develop`.
5. Solicitar al menos una revisión de otro integrante.
6. Integrar solamente cuando la compilación y las pruebas sean satisfactorias.
7. Eliminar la rama `feature/*` después de la integración.

No se debe trabajar directamente sobre `main` ni integrar cambios en ella sin pull request.

## Configuración inicial pendiente en GitHub

El propietario del repositorio debe publicar `develop` y configurar protección para `main` y `develop`. La protección recomendada debe exigir pull request, una aprobación y validaciones exitosas antes de integrar.

Comandos de publicación, para ejecutar únicamente por una persona con permisos sobre el repositorio:

```bash
git push -u origin develop
git push -u origin feature/CAPP-66-repositorio-gitflow
```

## Evidencia para CAPP-66

- URL del repositorio oficial visible.
- Salida de `git remote -v` mostrando `origin`.
- Salida de `git branch -a` mostrando las ramas locales y remotas.
- Rama activa `feature/CAPP-66-repositorio-gitflow`.
- Este documento incluido en el repositorio.
- Captura de la configuración de protección de ramas cuando el propietario la habilite en GitHub.
