# CAPP-35 — Comparar cotizaciones

## Entrega

Desde Mis proyectos, la acción «Comparar cotizaciones» abre `/proyectos/{proyectoId}/comparar-cotizaciones`. El comparador presenta las propuestas reales de constructores de ese proyecto con empresa, monto en CRC, plazo estimado en días, descripción/alcance, inclusiones, estado y fecha. No modifica las propuestas ni selecciona un ganador.

Se cubren los tres escenarios de Jira:

1. Varias cotizaciones: tabla comparativa con datos de cada propuesta.
2. Solo una: mensaje explícito de que hace falta otra para comparar, manteniendo visible la disponible.
3. Filtros: monto mínimo/máximo, plazo máximo y estado; orden por menor/mayor monto, menor plazo o fecha reciente. Se aplican antes de contar y paginar.

También se diferencian los casos sin propuestas, sin coincidencias y una sola coincidencia por filtros. Aplicar o limpiar filtros vuelve a la primera página; cambiar de proyecto o filtro descarta las respuestas de consultas anteriores.

## Contrato de comparación

`GET /api/proyectos/{proyectoId}/comparar-cotizaciones`

Parámetros opcionales: `montoMinimo`, `montoMaximo`, `plazoMaximoDias`, `estado`, `orden` (`menorPrecio`, `mayorPrecio`, `menorPlazo`, `reciente`), `page` (desde 1), `size` (1–50, por defecto 20).

Devuelve título, moneda, total de propuestas del proyecto, total filtrado, página, tamaño, indicador de comparación, mensaje e ítems. Los empates se ordenan por ID para mantener una paginación estable. Se rechazan montos negativos, rangos invertidos, plazos no positivos, estados/órdenes desconocidos y paginación inválida.

Cliente: solo proyectos propios. Admin: puede consultar otros proyectos. La consulta siempre filtra por proyecto antes de aplicar filtros. No devuelve correos, información de otros proyectos ni datos privados de facturación del constructor.

Usa las entidades y repositorios existentes `Propuesta` y `PerfilConstructor` mediante `IUnitOfWork`. La creación de propuestas corresponde a CAPP-34 y su selección a CAPP-36. Esta historia puede consultar las propuestas que existan sin implementar los flujos de esas otras historias. Para UAT deben existir propuestas registradas mediante el flujo real del equipo; no se generaron datos de producción en esta entrega.

## Vista de cotizaciones IA existente

Se conserva el trabajo adelantado de comparación de cotizaciones IA. El controlador de lectura usa un repositorio especializado a través de `IUnitOfWork`, con proyecto, cliente y líneas incluidos; el controlador no recibe `AppDbContext`.

- `GET /api/cotizacion-ia`: paginación 1–100 ítems, filtros por plan/estado/fechas, búsqueda por proyecto/cliente/nombre del plan y orden por precio o fecha.
- La búsqueda se aplica en el servidor antes de paginar y contar; los cambios de filtro vuelven a la primera página.
- `GET /api/cotizacion-ia/{id}`: detalle autorizado, líneas y listas de recomendaciones/mano de obra; JSON inválido se maneja como lista vacía.
- Clientes aislados por dueño del proyecto y acceso global para Admin. El comparador existente admite seleccionar una opción e informa que hacen falta al menos dos.
- La vista de IA compara estimaciones; el nuevo comparador por proyecto compara propuestas de constructores. Esta entrega no implementa otras acciones del menú de IA (generar, duplicar, convertir o archivar).

## Validación y estado

- 88 pruebas automáticas correctas, 0 fallidas, 0 omitidas: 64 de base y 24 añadidas para CAPP-35.
- Casos de varias/una/cero propuestas, una coincidencia por filtro, combinación de filtros, orden, paginación, permisos y ausencia de escrituras.
- Consultas IA: aislamiento por cliente, búsqueda antes de paginar, fecha final inclusiva, orden y lectura de detalle con JSON inválido.
- Compilación web de producción, ESLint de los archivos modificados y `git diff --check`: correctos.
- Persistencia/lectura comprobadas con EF InMemory. No se verificó ejecución contra SQL/Azure real. No se añadieron migraciones ni se cambiaron dependencias; permanecen sus advertencias previas.
- UAT pospuestas al final del sprint por instrucción del usuario. Sin despliegue ni fusión del PR.

La rama se apoya en CAPP-32 (PR #11), que a su vez depende de CAPP-29 (PR #10). Integrar en ese orden y cambiar la base del PR de CAPP-35 a `main` cuando las dependencias estén integradas.
