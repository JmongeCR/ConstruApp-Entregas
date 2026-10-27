# CAPP-32: rangos configurables de referencia

La estimación usa el área registrada del proyecto multiplicada por un rango mínimo y máximo en colones por m². No hay tarifas predeterminadas porque deben ser aprobadas por el equipo y revisadas periódicamente; mientras falte una configuración válida, el servicio informa que no está disponible en vez de mostrar importes inventados.

Configurar en el entorno de ejecución usando la sección `EstimacionPrecios:PorTipo`. Por ejemplo, para Remodelación:

```text
EstimacionPrecios__PorTipo__Remodelacion__Minimo=<CRC por m²>
EstimacionPrecios__PorTipo__Remodelacion__Maximo=<CRC por m²>
```

Tipos admitidos: `Remodelacion`, `ObraGris`, `ElectricoPlomeria`, `Pintura`, `Pisos`, `Techos`, `PiscinaJardin` y `Otro`. Para cada tipo, el mínimo debe ser mayor que cero y el máximo igual o mayor que el mínimo. `Otro` se marca adicionalmente como proyecto especial y requiere validación profesional.

Los valores deben representar rangos referenciales en CRC/m², no cotizaciones comerciales. Actualizarlos con aprobación del responsable de precios.
