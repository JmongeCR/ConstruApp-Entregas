# CAPP-29 — Borradores y envío a cotización

## Comportamiento entregado

- `POST /api/proyectos/borradores`: guarda información parcial, incluso sin nombre, propiedad o tipo. Los valores suministrados deben ser válidos.
- `PUT /api/proyectos/{id}/borrador`: reemplaza la información editable de un borrador del cliente autenticado. Los campos omitidos se vacían; no es un PATCH.
- `GET /api/proyectos` y `GET /api/proyectos/{id}` permiten retomar el borrador. Un borrador no es visible para otros clientes ni en el listado público.
- `PUT /api/proyectos/{id}/enviar-cotizacion`: exige nombre, descripción de al menos 20 caracteres, tipo válido, propiedad del cliente, valores positivos si se informaron, fechas coherentes y documentos configurados. Devuelve errores por campo y categoría sin publicar cuando hay requisitos pendientes.
- El envío cambia el estado a `EnPropuestas`, mostrado como «En proceso de cotización», y guarda `FechaEnvioCotizacion` y `FechaPublicacion`. La consulta posterior conserva la fecha y el proyecto aparece en el listado publicado. Los enlaces existentes permiten consultar las propuestas.
- `PUT /api/proyectos/{id}/publicar` conserva compatibilidad y aplica las mismas validaciones.
- Se auditan la creación y guardado de borradores y su envío. Un proyecto enviado no se puede guardar de nuevo como borrador ni volver a enviar por esta vía.
- La creación convencional de HU-014 conserva sus requisitos mínimos. El formulario ofrece las acciones separadas Guardar borrador, Guardar información y Enviar para cotización.

## Documentos obligatorios

Decisión del usuario para esta implementación: **ninguno por defecto; requisitos configurables por tipo de proyecto**. La hoja oficial `MODULO CLIENTES`, filas 35–37, menciona documentos obligatorios faltantes sin definir categorías universales.

La sección de configuración opcional es:

```json
{
  "CotizacionRequisitos": {
    "DocumentosPorTipo": {}
  }
}
```

El diccionario vacío exige cero documentos. Agregar una clave exige esas categorías únicamente para ese tipo; por ejemplo, **solo si el equipo acuerda esa regla**, `"ObraGris": ["Plano", "Permiso"]` dentro de `DocumentosPorTipo`. También puede configurarse con variables de entorno, como `CotizacionRequisitos__DocumentosPorTipo__ObraGris__0=Plano`. Se requiere reiniciar la API al cambiar estas opciones.

Tipos válidos, con esta escritura: `Remodelacion`, `ObraGris`, `ElectricoPlomeria`, `Pintura`, `Pisos`, `Techos`, `PiscinaJardin`, `Otro`.

Categorías: `Contrato`, `Plano`, `Diseño`, `Permiso`, `Factura`, `Fotografia`, `Video`, `Otro`, `Documento`. También se reconocen `foto` y `doc` como alias; las categorías no distinguen mayúsculas. Una configuración inválida impide iniciar la API y señala el error.

La comprobación usa `IUnitOfWork.Archivos`, entidad `ArchivoProyecto`, y filtra por ID del proyecto. Admite `Categoria` y, como compatibilidad, `TipoArchivo`. Un archivo de otro proyecto o con URL vacía no cumple el requisito. La carga de documentos corresponde a CAPP-28; esta historia entrega la validación para su integración, sin implementar esa otra historia.

## Migración

`20261014120000_CAPP29EnvioACotizacion` añade una fecha nullable y permite un tipo de proyecto nullable para representar información pendiente. Incluye modelo de destino y snapshot. No cambia los tipos de los proyectos existentes.

La reversión elimina la nueva fecha y convierte los tipos vacíos a `Otro` antes de restaurar la columna obligatoria. Esa conversión pierde la distinción entre tipo pendiente y Otro, por lo que debe considerarse al decidir una reversión.

## Verificación

- 41 pruebas correctas, 0 fallidas, 0 omitidas en `ConstruApp.Tests`.
- Persistencia y relectura comprobadas con EF InMemory: borrador vacío → completar → enviar → fecha, estado, auditoría y visibilidad pública.
- Casos de requisitos faltantes, reglas por tipo, categorías antiguas, archivos ajenos, valores inválidos, permisos y reenvío.
- Snapshot sin cambios pendientes y generación de SQL Server para subida y reversión: correctas, sin conexión a una base de datos.
- Compilación web de producción y ESLint de los archivos modificados: correctos.
- Advertencias existentes de dependencias: MailKit, MimeKit, System.Security.Cryptography.Pkcs y referencia redundante de SignalR. No se modificaron paquetes en esta historia.

**UAT pospuestas al final del sprint por instrucción del usuario.** La migración no fue aplicada a SQL/Azure y no se realizó despliegue ni fusión del PR. La validación automática con InMemory y SQL generado no equivale a UAT ni a validación de una base SQL real.

## Integración

La rama está sincronizada con `origin/main`. Se conservaron los campos de creación/edición y las rutas de propiedades/publicación que requería el flujo existente. El repositorio no tiene una rama remota `develop`; se usa `main` como destino del PR, sin fusionarlo.
