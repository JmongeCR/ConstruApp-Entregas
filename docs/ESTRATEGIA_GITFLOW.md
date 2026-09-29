# Estrategia GitFlow de ConstruApp

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

## Convención de commits

```
<tipo>(CAPP-<id>): <descripción corta>
```

Tipos: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`.

## Protección de ramas recomendada

- Requerir pull request antes de integrar.
- Al menos una aprobación de otro integrante.
- Validaciones exitosas antes de fusionar.
