# Integración IA del Sprint 3

Se implementan las correcciones autorizadas de la auditoría. El usuario confirmó volver a OpenAI con la clave del proyecto ConstruApp. Se conserva gpt-5-mini, configurable mediante OpenAI__Model, y el contrato de las pantallas existentes.

| Recorrido | Cambio aprobado | Verificación |
|---|---|---|
| Entrevista y alcance | Restaurar Responses API con salida estructurada | Pruebas simuladas y prueba local con la API real |
| Fotos y PDF | Usar input_image e input_file respectivamente | Verificar ambos adjuntos |
| Planes de cotización | Reutilizar Responses API, validar los datos, calcular totales en el servidor y guardar los tres planes juntos | Pruebas de validación previa, importes y guardado |
| Conversión | Confirmación del constructor y una sola propuesta por cotización | Prueba de repetición y permisos |

Las solicitudes usan store=false. No se presume que la organización tenga Zero Data Retention o residencia especial. La clave permanece en el entorno del servidor.

Se revisaron las capacidades de la guía Responses API. Se aplican selección de modelo, HTTP, privacidad, estado explícito del proyecto, razonamiento minimal, límite de salida y esquema JSON. Se conservan conversaciones en la base local y se envía su historial. No se agrega streaming o WebSocket porque el recorrido actual confirma cada operación completa. Las conversaciones están limitadas, por lo que no requieren compactación. No hay herramientas, llamadas paralelas de herramientas, fases de asistente, resúmenes de razonamiento ni necesidad de replay de razonamiento cifrado. No se introducen archivos de instrucciones. Se mantiene el nivel de procesamiento predeterminado y el caché automático, sin claves de caché, retención extendida o puntos de corte explícitos. Estas opciones no son necesarias para corregir los recorridos aprobados. La verbosidad está limitada por las instrucciones y los tokens de salida.

La configuración de retención de la organización y los costos reales no se modifican. La implementación devuelve errores controlados si falta la clave, si el proveedor falla o si la salida está incompleta. Las pruebas de regresión usan respuestas simuladas.

Documentación consultada el 9 de noviembre de 2026.

Verificación completada el 9 de noviembre: 145/145 pruebas automatizadas y compilación Vite correctas. El recorrido HTTP completo pasó contra una base SQL Server Express aislada y OpenAI real: entrevista, PDF, imagen, alcance, creación de borrador, publicación, descarga autorizada, tres planes, conversión idempotente, comparación de dos propuestas, selección, asignación de personal, equipo externo y avance con foto consultado por el cliente. Los importes configurados y los archivos fueron ficticios. Se corrigió y probó la estabilidad de la huella de validación al recargar decimales y fechas desde SQL. Esta verificación técnica no reemplaza el UAT del usuario ni acredita un despliegue en Azure o Render.

- https://developers.openai.com/api/docs/guides/structured-outputs
- https://developers.openai.com/api/docs/guides/file-inputs
