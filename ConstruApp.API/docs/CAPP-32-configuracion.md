# CAPP-32: rangos configurables de referencia

La estimación usa el área registrada del proyecto multiplicada por un rango mínimo y máximo en colones por m². No hay tarifas predeterminadas porque deben ser aprobadas por el equipo y revisadas periódicamente; mientras falte una configuración válida, el servicio informa que no está disponible en vez de mostrar importes inventados.

Configurar en el entorno de ejecución usando la sección `EstimacionPrecios:PorTipo`. Por ejemplo, para Remodelación:

```text
EstimacionPrecios__PorTipo__Remodelacion__Minimo=<CRC por m²>
EstimacionPrecios__PorTipo__Remodelacion__Maximo=<CRC por m²>
```

Tipos admitidos: `Remodelacion`, `ObraGris`, `ElectricoPlomeria`, `Pintura`, `Pisos`, `Techos`, `PiscinaJardin` y `Otro`. Para cada tipo, el mínimo debe ser mayor que cero y el máximo igual o mayor que el mínimo. `Otro` se marca adicionalmente como proyecto especial y requiere validación profesional.

Los valores deben representar rangos referenciales en CRC/m², no cotizaciones comerciales. Actualizarlos con aprobación del responsable de precios.

## Decisión de producto y configuración

El usuario confirmó para esta entrega: **rangos configurables, sin tarifas predeterminadas**. La configuración vacía es válida. Sin un rango para el tipo solicitado, la API devuelve 503 con un mensaje de indisponibilidad y no registra una estimación.

La sección vacía equivale a:

```json
{
  "EstimacionPrecios": {
    "PorTipo": {}
  }
}
```

Además de Minimo y Maximo puede configurarse `EstimacionPrecios__PorTipo__Remodelacion__Fuente` con la referencia de los valores aprobados (hasta 300 caracteres). Las reglas de configuración se validan al iniciar: tipos desconocidos, valores no positivos o rangos invertidos impiden el arranque y señalan el error. Reiniciar la API después de cambiar esta configuración.

No se consulta un servicio externo ni se generan tarifas mediante IA: es un cálculo determinista por área. Los valores numéricos de las pruebas son ficticios y no se incluyen como tarifas de la aplicación.

## Contrato y comportamiento

`POST /api/proyectos/{proyectoId}/sugerencia-precios`, autenticado como Cliente o Admin. El cliente debe ser dueño del proyecto; Admin puede operar otros proyectos. Se valida que la propiedad pertenezca al cliente del proyecto.

- Nombre, descripción de al menos 20 caracteres, tipo válido, propiedad disponible y área positiva son necesarios. Presupuesto informado y fechas también deben ser coherentes. Los errores se devuelven por campo (400).
- El cálculo multiplica el área por cada extremo del rango, redondea a dos decimales (AwayFromZero) y comprueba que el resultado entre en decimal(18,2). No usa el presupuesto del cliente como tarifa.
- La respuesta incluye rango mínimo/máximo en CRC, área, valores por m², fuente, fecha de generación y advertencia explícita de estimación. `Otro` añade la necesidad de revisión profesional.
- Se persiste una entrada `CotizacionIA` con Plan `referencial`, versión, usuario y resumen de la base aplicada (área, tarifas y fuente). Se audita la generación. Se conserva el estado del proyecto.
- En Mis proyectos se añade Sugerir precios y se conserva el acceso anterior a Cotización IA. La pantalla permite completar los datos, bloquea solicitudes mientras calcula y descarta el resultado anterior al recalcular o cambiar de proyecto.

## Validación y entrega

- 64 pruebas automáticas correctas, 0 fallidas y 0 omitidas (incluidas las 41 de la base CAPP-29).
- Persistencia y auditoría comprobadas con EF InMemory; cálculo y redondeo, proyectos incompletos, propiedad ajena, permisos, tipo especial, configuración faltante, límites y versiones del historial.
- Compilación web de producción, ESLint de archivos modificados y git diff --check correctos.
- Sin nuevas migraciones en CAPP-32. La rama incluye CAPP-29 como dependencia y el PR se dirige a `feature/CAPP-29-envio-cotizacion`; integrar primero el PR #10 y luego cambiar la base de este PR a main.
- UAT pospuestas al final del sprint por instrucción del usuario. No se realizaron despliegues ni comprobaciones en SQL/Azure real. Las advertencias existentes de dependencias no se modificaron.
