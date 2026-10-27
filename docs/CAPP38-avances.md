# CAPP-38 — Registrar avances

## Entrega

Se completa el registro y consulta de avances desde el espacio de obra y la vista de campo. Cada avance guarda título, descripción opcional, responsable opcional, porcentaje entero 0–100, fecha UTC y constructor asignado. El porcentaje informado no cambia automáticamente el estado del proyecto; la vista muestra el último avance como progreso actual.

La interfaz valida los datos y confirma el guardado únicamente después de recibir éxito de la API. Conserva el formulario ante errores, bloquea el envío mientras guarda o lee adjuntos y presenta errores de consulta en lugar de informar falsamente que no hay avances.

## Permisos e integración

- Solo Constructor con propuesta aceptada en ese proyecto puede registrar avances mientras el proyecto esté `EnCurso`.
- Admin puede registrar para la empresa asignada mediante una propuesta aceptada, aunque el administrador no tenga perfil propio de constructor. La auditoría identifica al usuario que ejecutó la acción.
- El cliente dueño, el constructor con propuesta aceptada o finalizada y Admin pueden consultar el historial. Los demás no pueden acceder.
- El constructor asignado puede abrir el detalle de su obra privada, incluso finalizada. Esta autorización se añadió a la consulta de detalle del proyecto que usa la pantalla de obra.
- La vista de campo consulta proyectos asignados en lugar del listado «Mis proyectos» de clientes. Presenta obras activas y terminadas, y habilita el registro solo cuando corresponde.
- El constructor puede eliminar avances propios mientras mantenga una propuesta aceptada y la obra esté en curso. Admin puede moderar eliminaciones. Se auditan registros y eliminaciones.

## API

- `GET /api/avances/proyectos`: proyectos de obra visibles, estado e indicador `puedeRegistrar` para el selector de campo.
- `GET /api/avances/proyecto/{proyectoId}`: historial ordenado por fecha descendente e ID descendente, con adjuntos asociados.
- `POST /api/avances`: registra y devuelve el avance persistido con sus adjuntos (201).
- `DELETE /api/avances/{id}`: elimina después de comprobar permisos (204).

Se exige proyecto válido, título no vacío de hasta 300 caracteres y porcentaje presente entre 0 y 100. Descripción: hasta 3000 caracteres; responsable: hasta 200. Proyecto inexistente devuelve 404; falta de permisos, 403; datos inválidos, 400.

## Adjuntos opcionales existentes

Se conserva el soporte adelantado de adjuntos durante el registro, sin sustituir el alcance independiente de CAPP-39. Máximo cuatro por avance y 5 MB por archivo. Formatos: JPEG, PNG, WebP, MP4 y WebM, como data URL base64. El servidor comprueba MIME, firma básica de cabecera, tamaño real y nombre (hasta 200 caracteres), y no confía en el tamaño declarado por el cliente. Estas comprobaciones no equivalen a decodificar íntegramente imágenes/videos ni a analizar su contenido.

Se escriben nombres UUID bajo `wwwroot/uploads/avances`; se configura la raíz estática también para instalaciones donde el directorio no existía inicialmente. Los archivos se sirven con el mecanismo de archivos estáticos existente de la aplicación.

El avance y sus referencias a archivos se guardan mediante un único `SaveChanges` de `IUnitOfWork` con el grafo de entidades. Ante un fallo de ese guardado se limpian los archivos creados. Al eliminar, se guarda primero el cambio en la base; si ese guardado falla, los archivos permanecen. La limpieza física se limita a nombres UUID en el directorio de avances. Fallos posteriores de limpieza se registran en el log del servidor.

## Verificación

- 119 pruebas correctas, 0 fallidas, 0 omitidas: 88 de base y 31 para CAPP-38.
- Registro y relectura de avances/adjuntos, límites 0 y 100, campos inválidos, proyectos fuera de curso y separación entre clientes/constructores.
- Acceso del administrador, selector de proyectos asignados, historial finalizado y detalle privado de la obra.
- Adjuntos inválidos, demasiados archivos, tamaños excesivos y rutas ajenas; fallos simulados de persistencia y conservación/limpieza física correspondiente.
- Persistencia comprobada con EF InMemory y archivos temporales locales. No se ejecutó contra SQL/Azure real ni se validó el arranque completo con ese entorno.
- Compilación web de producción y ESLint del nuevo módulo de validación/adjuntos y del archivo de API: correctos. `git diff --check`: sin errores.
- Las pantallas antiguas conservan su deuda previa de ESLint: ObraDetalle tiene 27 errores y 7 avisos; CampoApp, 18 errores. La comparación con la base CAPP-35 no detecta diagnósticos nuevos. No se declara aprobado el lint completo de esos archivos.
- No se añadieron migraciones ni se modificaron paquetes; permanecen sus advertencias previas.

UAT pospuestas al final del sprint por instrucción del usuario. No se desplegó ni se fusionó el PR. La rama se apoya en CAPP-35 (#12), precedida por CAPP-32 (#11) y CAPP-29 (#10); integrar en ese orden y cambiar la base de este PR a main cuando las dependencias estén integradas.
