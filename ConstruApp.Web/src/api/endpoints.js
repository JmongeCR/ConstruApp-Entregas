import api from './axios';

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  login:           (data) => api.post('/auth/login', data),
  register:        (data) => api.post('/auth/register', data),
  profile:         ()     => api.get('/auth/profile'),
  changePassword:  (data) => api.post('/auth/change-password', data),
  updateProfile:   (data) => api.put('/auth/profile', data),
  forgotPassword:  (data) => api.post('/auth/forgot-password', data),
  resetPassword:   (data) => api.post('/auth/reset-password', data),
};

// ── Usuarios ──────────────────────────────────────────────────────────────────
export const usuariosApi = {
  getAll:  ()           => api.get('/usuarios'),
  getById: (id)         => api.get(`/usuarios/${id}`),
  update:  (id, data)   => api.put(`/usuarios/${id}`, data),
  delete:  (id)         => api.delete(`/usuarios/${id}`),
};

// ── Proyectos ─────────────────────────────────────────────────────────────────
export const proyectosApi = {
  getMios:       ()            => api.get('/proyectos'),
  getPublicados: (params)      => api.get('/proyectos/publicados', { params }),
  getById:       (id)          => api.get(`/proyectos/${id}`),
  create:        (data)        => api.post('/proyectos', data),
  update:        (id, data)    => api.put(`/proyectos/${id}`, data),
  publicar:      (id)          => api.put(`/proyectos/${id}/publicar`),
  cambiarEstado: (id, estado)  => api.put(`/proyectos/${id}/estado`, { estado }),
  delete:        (id)          => api.delete(`/proyectos/${id}`),
  getFotos:      (id)          => api.get(`/proyectos/${id}/fotos`),
  subirFoto:     (id, data)    => api.post(`/proyectos/${id}/fotos`, data),
};

// ── Cotización IA (Gemini 2.5 Flash) ─────────────────────────────────────────
export const cotizacionIAApi = {
  // Historial global
  getAll:          (params)       => api.get('/cotizacion-ia', { params }),
  dashboard:       (top = 5)      => api.get('/cotizacion-ia/dashboard', { params: { top } }),
  getById:         (id)           => api.get(`/cotizacion-ia/${id}`),
  // Por proyecto
  getByProyecto:   (pid)          => api.get(`/cotizacion-ia/proyecto/${pid}`),
  getHistorial:    (pid)          => api.get(`/cotizacion-ia/proyecto/${pid}/historial`),
  // Generación
  generar:         (pid, payload) => api.post(`/cotizacion-ia/generar/${pid}`, payload ?? {}),
  analizarImagen:  (payload)      => api.post('/cotizacion-ia/analizar-imagen', payload),
  // Acciones
  duplicar:        (id)           => api.post(`/cotizacion-ia/${id}/duplicar`),
  cambiarEstado:   (id, estado)   => api.put(`/cotizacion-ia/${id}/estado`, { estado }),
  convertirPropuesta:   (id)      => api.post(`/cotizacion-ia/${id}/convertir-propuesta`),
  convertirPresupuesto: (id)      => api.post(`/cotizacion-ia/${id}/convertir-presupuesto`),
};

// ── Propuestas ────────────────────────────────────────────────────────────────
export const propuestasApi = {
  getByProyecto: (pid)        => api.get(`/propuestas/proyecto/${pid}`),
  getMias:       ()           => api.get('/propuestas/mis-propuestas'),
  getById:       (id)         => api.get(`/propuestas/${id}`),
  create:        (data)       => api.post('/propuestas', data),
  cambiarEstado: (id, estado) => api.put(`/propuestas/${id}/estado`, { estado }),
  finalizar:     (id)         => api.put(`/propuestas/${id}/finalizar`),
  delete:        (id)         => api.delete(`/propuestas/${id}`),
};

// ── Materiales ────────────────────────────────────────────────────────────────
export const materialesApi = {
  getAll:       (params)   => api.get('/materiales', { params }),
  getPrecios:   (id)       => api.get(`/materiales/${id}/precios`),
  create:       (data)     => api.post('/materiales', data),
  agregarPrecio:(id, data) => api.post(`/materiales/${id}/precios`, data),
};

// ── Perfiles Constructor ──────────────────────────────────────────────────────
export const perfilesConstructorApi = {
  getAll:       (params)    => api.get('/perfiles/constructor', { params }),
  getById:      (id)        => api.get(`/perfiles/constructor/${id}`),
  getMio:       ()          => api.get('/perfiles/constructor/mio'),
  create:       (data)      => api.post('/perfiles/constructor', data),
  update:       (id, data)  => api.put(`/perfiles/constructor/${id}`, data),
  addPortafolio:(id, data)  => api.post(`/perfiles/constructor/${id}/portafolio`, data),
  getFinanciero: ()         => api.get('/perfiles/constructor/financiero'),
  updateFinanciero: (data)  => api.put('/perfiles/constructor/financiero', data),
};

// ── Perfiles Proveedor ────────────────────────────────────────────────────────
export const perfilesProveedorApi = {
  getAll:  (params)   => api.get('/perfiles/proveedor', { params }),
  getById: (id)       => api.get(`/perfiles/proveedor/${id}`),
  getMio:  ()         => api.get('/perfiles/proveedor/mio'),
  create:  (data)     => api.post('/perfiles/proveedor', data),
  update:  (id, data) => api.put(`/perfiles/proveedor/${id}`, data),
};

// ── Constructor (dashboard + clientes) ───────────────────────────────────────
export const constructorApi = {
  dashboard: () => api.get('/constructor/dashboard'),
};

// ── Facturas ──────────────────────────────────────────────────────────────────
export const facturasApi = {
  getMias:       ()           => api.get('/facturas'),
  getByProyecto: (pid)        => api.get(`/facturas/proyecto/${pid}`),
  getById:       (id)         => api.get(`/facturas/${id}`),
  create:        (data)       => api.post('/facturas', data),
  update:        (id, data)   => api.put(`/facturas/${id}`, data),
  cancelar:      (id)         => api.delete(`/facturas/${id}`),
  registrarPago: (id, data)   => api.post(`/facturas/${id}/pagos`, data),
  eliminarPago:  (id, pagoId) => api.delete(`/facturas/${id}/pagos/${pagoId}`),
  enviar:        (id, data)   => api.post(`/facturas/${id}/enviar`, data),
};

// ── Avances de obra ───────────────────────────────────────────────────────────
export const avancesApi = {
  getByProyecto: (pid)  => api.get(`/avances/proyecto/${pid}`),
  create:        (data) => api.post('/avances', data),
  delete:        (id)   => api.delete(`/avances/${id}`),
};

// ── Empleados ─────────────────────────────────────────────────────────────────
export const empleadosApi = {
  getMios:            ()           => api.get('/empleados/mios'),
  getByProyecto:      (pid)        => api.get(`/empleados/proyecto/${pid}`),
  create:             (data)       => api.post('/empleados', data),
  update:             (id, data)   => api.put(`/empleados/${id}`, data),
  delete:             (id)         => api.delete(`/empleados/${id}`),
  asignar:            (data)       => api.post('/empleados/asignar', data),
  desasignar:         (asigId)     => api.delete(`/empleados/asignar/${asigId}`),
};

// ── Carta de aceptación ───────────────────────────────────────────────────────
export const cartaApi = {
  getByProyecto: (pid) => api.get(`/carta-aceptacion/proyecto/${pid}`),
  generar:       (pid) => api.post(`/carta-aceptacion/generar/${pid}`),
  aceptar:       (id, data) => api.put(`/carta-aceptacion/${id}/aceptar`, data),
};

// ── Calificaciones ────────────────────────────────────────────────────────────
export const calificacionesApi = {
  getAll:        ()     => api.get('/calificaciones'),
  getByUsuario:  (uid)  => api.get(`/calificaciones/usuario/${uid}`),
  getByProyecto: (pid)  => api.get(`/calificaciones/proyecto/${pid}`),
  create:        (data) => api.post('/calificaciones', data),
  delete:        (id)   => api.delete(`/calificaciones/${id}`),
};

// ── Mensajes / Chat ───────────────────────────────────────────────────────────
export const mensajesApi = {
  // Widget global
  conversaciones:   ()              => api.get('/mensajes/conversaciones'),
  getCanalMensajes: (pid, canal)    => api.get(`/mensajes/proyecto/${pid}/canal/${canal}`),
  sendCanal:        (pid, canal, d) => api.post(`/mensajes/proyecto/${pid}/canal/${canal}`, d),
  marcarLeidos:     (pid, canal)    => api.put(`/mensajes/proyecto/${pid}/canal/${canal}/leidos`),
  noLeidos:         ()              => api.get('/mensajes/no-leidos'),
  // Legacy (proyecto chat tab)
  getChatProyecto:  (pid)           => api.get(`/mensajes/proyecto/${pid}/chat`),
  sendChat:         (pid, data)     => api.post(`/mensajes/proyecto/${pid}/chat`, data),
  getByPropuesta:   (pid)           => api.get(`/mensajes/propuesta/${pid}`),
  send:             (data)          => api.post('/mensajes', data),
};

// ── Documentos ────────────────────────────────────────────────────────────────
export const documentosApi = {
  getByProyecto:  (pid, params) => api.get(`/documentos/proyecto/${pid}`, { params }),
  getById:        (id)          => api.get(`/documentos/${id}`),
  upload:         (data)        => api.post('/documentos', data),
  update:         (id, data)    => api.put(`/documentos/${id}`, data),
  delete:         (id)          => api.delete(`/documentos/${id}`),
  getCategorias:  (pid)         => api.get(`/documentos/proyecto/${pid}/categorias`),
};

// ── Presupuesto ───────────────────────────────────────────────────────────────
export const presupuestoApi = {
  getResumen:       (pid)        => api.get(`/presupuesto/proyecto/${pid}/resumen`),
  getPartidas:      (pid)        => api.get(`/presupuesto/proyecto/${pid}/partidas`),
  createPartida:    (data)       => api.post('/presupuesto/partidas', data),
  updatePartida:    (id, data)   => api.put(`/presupuesto/partidas/${id}`, data),
  deletePartida:    (id)         => api.delete(`/presupuesto/partidas/${id}`),
  getGastos:        (pid, params)=> api.get(`/presupuesto/proyecto/${pid}/gastos`, { params }),
  createGasto:      (data)       => api.post('/presupuesto/gastos', data),
  deleteGasto:      (id)         => api.delete(`/presupuesto/gastos/${id}`),
};

// ── Órdenes de cambio ─────────────────────────────────────────────────────────
export const ordenesApi = {
  getByProyecto: (pid)         => api.get(`/ordenes/proyecto/${pid}`),
  getById:       (id)          => api.get(`/ordenes/${id}`),
  create:        (data)        => api.post('/ordenes', data),
  update:        (id, data)    => api.put(`/ordenes/${id}`, data),
  cambiarEstado: (id, data)    => api.put(`/ordenes/${id}/estado`, data),
  delete:        (id)          => api.delete(`/ordenes/${id}`),
};

// ── Equipo del proyecto ───────────────────────────────────────────────────────
export const equipoProyectoApi = {
  getByProyecto: (pid)         => api.get(`/equipo-proyecto/proyecto/${pid}`),
  getById:       (id)          => api.get(`/equipo-proyecto/${id}`),
  create:        (data)        => api.post('/equipo-proyecto', data),
  update:        (id, data)    => api.put(`/equipo-proyecto/${id}`, data),
  delete:        (id)          => api.delete(`/equipo-proyecto/${id}`),
};

// ── IA Empresarial ────────────────────────────────────────────────────────────
export const iaEmpresarialApi = {
  resumenSemanal:        (pid)         => api.get(`/ia/resumen-semanal/${pid}`),
  sobrecostos:           (pid)         => api.get(`/ia/sobrecostos/${pid}`),
  generarPresupuesto:    (pid, data)   => api.post(`/ia/presupuesto/${pid}`, data ?? {}),
  generarPropuesta:      (pid, data)   => api.post(`/ia/propuesta/${pid}`, data ?? {}),
  generarAlcance:        (pid, data)   => api.post(`/ia/alcance/${pid}`, data ?? {}),
  recomendarMateriales:  (pid, data)   => api.post(`/ia/materiales/${pid}`, data ?? {}),
  generarReporte:        (pid)         => api.get(`/ia/reporte/${pid}`),
};

// ── Admin ─────────────────────────────────────────────────────────────────────
export const adminApi = {
  // Dashboard
  getStats:               ()                => api.get('/admin/stats'),
  // Usuarios
  getUsuarios:            (params)          => api.get('/admin/usuarios', { params }),
  getUsuario:             (id)              => api.get(`/admin/usuarios/${id}`),
  crearUsuario:           (data)            => api.post('/admin/usuarios/crear', data),
  editarUsuario:          (id, data)        => api.put(`/admin/usuarios/${id}`, data),
  eliminarUsuario:        (id)              => api.delete(`/admin/usuarios/${id}`),
  cambiarRol:             (id, rol)         => api.put(`/admin/usuarios/${id}/rol`, { rol }),
  bloquearUsuario:        (id, motivo)      => api.put(`/admin/usuarios/${id}/bloquear`, { motivo }),
  activarUsuario:         (id)              => api.put(`/admin/usuarios/${id}/activar`),
  resetPassword:          (id, pwd)         => api.post(`/admin/usuarios/${id}/reset-password`, { nuevaContrasena: pwd }),
  // Proyectos (admin)
  getAllProyectos:         (params)          => api.get('/admin/proyectos', { params }),
  cambiarEstadoProyecto:  (id, data)        => api.put(`/admin/proyectos/${id}/estado`, data),
  // Empresas (gestión admin)
  getEmpresas:            (params)          => api.get('/admin/empresas', { params }),
  crearEmpresa:           (data)            => api.post('/admin/empresas', data),
  getEmpresaMiembros:     (id)              => api.get(`/admin/empresas/${id}/miembros`),
  agregarMiembroEmpresa:  (id, data)        => api.post(`/admin/empresas/${id}/miembros`, data),
  quitarMiembroEmpresa:   (id, userId)      => api.delete(`/admin/empresas/${id}/miembros/${userId}`),
  // Empresas constructoras (verificación)
  getConstructores:       (params)          => api.get('/admin/empresas/constructores', { params }),
  verificarConstructor:   (id)              => api.put(`/admin/empresas/constructores/${id}/verificar`),
  suspenderConstructor:   (id, motivo)      => api.put(`/admin/empresas/constructores/${id}/suspender`, { motivo }),
  // Proveedores
  getProveedores:         (params)          => api.get('/admin/empresas/proveedores', { params }),
  verificarProveedor:     (id)              => api.put(`/admin/empresas/proveedores/${id}/verificar`),
  suspenderProveedor:     (id, motivo)      => api.put(`/admin/empresas/proveedores/${id}/suspender`, { motivo }),
  // Solicitudes de acceso
  getSolicitudes:         ()                => api.get('/admin/solicitudes'),
  aprobarSolicitud:       (id, rol)         => api.post(`/admin/solicitudes/${id}/aprobar`, { rol }),
  rechazarSolicitud:      (id, motivo)      => api.post(`/admin/solicitudes/${id}/rechazar`, { motivo }),
};

// ── Empresa (dueño/admin de constructora) ─────────────────────────────────────
export const empresaApi = {
  getMiembros:    ()            => api.get('/empresa/miembros'),
  agregarMiembro: (data)        => api.post('/empresa/miembros', data),
  editarMiembro:  (invId, data) => api.put(`/empresa/miembros/${invId}`, data),
  quitarMiembro:  (userId)      => api.delete(`/empresa/miembros/${userId}`),
};

// ── Permisos (RBAC) ───────────────────────────────────────────────────────────
export const permisosApi = {
  getCatalogo:            ()                => api.get('/permisos/catalogo'),
  getMatriz:              ()                => api.get('/permisos/matriz'),
  actualizarRol:          (rol, permisos)   => api.put(`/permisos/rol/${rol}`, { permisos }),
  restaurarRol:           (rol)             => api.post(`/permisos/rol/${rol}/restaurar`),
  getUsuarioPermisos:     (id)              => api.get(`/permisos/usuario/${id}`),
  setOverride:            (id, data)        => api.post(`/permisos/usuario/${id}/override`, data),
  removeOverride:         (id, codigo)      => api.delete(`/permisos/usuario/${id}/override/${codigo}`),
};

// ── Auditoría ─────────────────────────────────────────────────────────────────
export const auditoriaApi = {
  getLogs:                (params)          => api.get('/auditoria/logs', { params }),
  getModulos:             ()                => api.get('/auditoria/modulos'),
  getPorUsuario:          (id, params)      => api.get(`/auditoria/usuario/${id}`, { params }),
  getResumen:             ()                => api.get('/auditoria/resumen'),
};

// ── Cronograma ────────────────────────────────────────────────────────────────
export const cronogramaApi = {
  getByProyecto:    (pid)        => api.get(`/cronograma/proyecto/${pid}`),
  dashboard:        ()           => api.get('/cronograma/dashboard'),
  createFase:       (data)       => api.post('/cronograma/fases', data),
  updateFase:       (id, data)   => api.put(`/cronograma/fases/${id}`, data),
  deleteFase:       (id)         => api.delete(`/cronograma/fases/${id}`),
  reordenarFase:    (id, orden)  => api.put(`/cronograma/fases/${id}/orden`, { nuevoOrden: orden }),
  createTarea:      (faseId, d)  => api.post(`/cronograma/fases/${faseId}/tareas`, d),
  updateTarea:      (id, data)   => api.put(`/cronograma/tareas/${id}`, data),
  deleteTarea:      (id)         => api.delete(`/cronograma/tareas/${id}`),
  vincularAvance:   (avId, faseId) => api.put(`/cronograma/avances/${avId}/fase`, { faseId }),
};

// ── Notificaciones ────────────────────────────────────────────────────────────
export const notificacionesApi = {
  getMias:         (pagina = 1, tamano = 30) => api.get('/notificaciones', { params: { pagina, tamano } }),
  contador:        ()                        => api.get('/notificaciones/contador'),
  marcarLeida:     (id)                      => api.put(`/notificaciones/${id}/leer`),
  marcarTodas:     ()                        => api.put('/notificaciones/leer-todas'),
  eliminar:        (id)                      => api.delete(`/notificaciones/${id}`),
  limpiarLeidas:   ()                        => api.delete('/notificaciones/limpiar-leidas'),
};

// ── Configuración global ──────────────────────────────────────────────────────
export const configuracionApi = {
  getAll:                 (categoria)       => api.get('/configuracion', categoria ? { params: { categoria } } : {}),
  getCategorias:          ()                => api.get('/configuracion/categorias'),
  getByClave:             (clave)           => api.get(`/configuracion/${clave}`),
  actualizar:             (clave, valor)    => api.put(`/configuracion/${clave}`, { valor }),
  crear:                  (data)            => api.post('/configuracion', data),
};

// ── Invitaciones workspace ────────────────────────────────────────────────────
export const invitacionesApi = {
  crear:          (data)        => api.post('/invitaciones', data),
  agregarMiembro: (data)        => api.post('/invitaciones/agregar-miembro', data),
  getMias:        ()            => api.get('/invitaciones'),
  cancelar:       (id)          => api.delete(`/invitaciones/${id}`),
  getInfo:        (token)       => api.get(`/invitaciones/${token}/info`),
  aceptar:        (token)       => api.post(`/invitaciones/${token}/aceptar`),
  getActivarInfo: (token)       => api.get(`/invitaciones/${token}/activar`),
  activar:        (token, data) => api.post(`/invitaciones/${token}/activar`, data),
};

// ── Email ─────────────────────────────────────────────────────────────────────
export const emailApi = {
  getConfig:  ()        => api.get('/email/config'),
  ping:       ()        => api.get('/email/ping'),
  sendTest:   (para)    => api.post('/email/test', { para }),
  getLogs:    (params)  => api.get('/email/logs', { params }),
};

// ── Trabajadores ──────────────────────────────────────────────────────────────
export const trabajadoresApi = {
  getAll:  ()           => api.get('/trabajadores'),
  getById: (id)         => api.get(`/trabajadores/${id}`),
  create:  (data)       => api.post('/trabajadores', data),
  update:  (id, data)   => api.put(`/trabajadores/${id}`, data),
  delete:  (id)         => api.delete(`/trabajadores/${id}`),
};

// ── Cuadrillas ────────────────────────────────────────────────────────────────
export const cuadrillasApi = {
  getAll:            ()           => api.get('/cuadrillas'),
  getByProyecto:     (pid)        => api.get(`/cuadrillas/proyecto/${pid}`),
  getById:           (id)         => api.get(`/cuadrillas/${id}`),
  create:            (data)       => api.post('/cuadrillas', data),
  update:            (id, data)   => api.put(`/cuadrillas/${id}`, data),
  delete:            (id)         => api.delete(`/cuadrillas/${id}`),
};

// ── Asistencias ───────────────────────────────────────────────────────────────
export const asistenciasApi = {
  getAll:            ()           => api.get('/asistencias'),
  getByProyecto:     (pid)        => api.get(`/asistencias/proyecto/${pid}`),
  create:            (data)       => api.post('/asistencias', data),
  delete:            (id)         => api.delete(`/asistencias/${id}`),
};

// ── Bitácora de obra ──────────────────────────────────────────────────────────
export const bitacoraApi = {
  getAll:            ()           => api.get('/bitacora'),
  getByProyecto:     (pid)        => api.get(`/bitacora/proyecto/${pid}`),
  create:            (data)       => api.post('/bitacora', data),
  delete:            (id)         => api.delete(`/bitacora/${id}`),
};

// ── Fases (via CronogramaController) ─────────────────────────────────────────
export const fasesApi = {
  getAll:       ()         => api.get('/cronograma/dashboard'),
  getByProyecto:(pid)      => api.get(`/cronograma/proyecto/${pid}`),
  getById:      (id)       => api.get(`/cronograma/fases/${id}`),
  create:       (data)     => api.post('/cronograma/fases', data),
  update:       (id, data) => api.put(`/cronograma/fases/${id}`, data),
  delete:       (id)       => api.delete(`/cronograma/fases/${id}`),
};

// ── Cotizaciones (propuestas de precio) ───────────────────────────────────────
export const cotizacionesApi = {
  getAll:            ()           => api.get('/cotizaciones'),
  getById:           (id)         => api.get(`/cotizaciones/${id}`),
  create:            (data)       => api.post('/cotizaciones', data),
  update:            (id, data)   => api.put(`/cotizaciones/${id}`, data),
  delete:            (id)         => api.delete(`/cotizaciones/${id}`),
};

// ── Listas de materiales (alias → materialesApi) ──────────────────────────────
export const listasApi = {
  getAll:       ()    => api.get('/materiales'),
  getByProyecto:()    => api.get('/materiales'),
  create:       (data)=> api.post('/materiales', data),
  delete:       (id)  => api.delete(`/materiales/${id}`),
};

// ── Ítems de materiales (alias → precios por material) ───────────────────────
export const itemsApi = {
  getAll:       ()         => api.get('/materiales'),
  getByLista:   (id)       => api.get(`/materiales/${id}/precios`),
  create:       (data)     => api.post('/materiales', data),
  update:       (id, data) => api.put(`/materiales/${id}`, data),
  delete:       (id)       => api.delete(`/materiales/${id}`),
};

// ── Perfiles Ferretería / Proveedores (→ /perfiles/proveedor real) ────────────
export const perfilesFerreteriaApi = {
  getAll:  (params)   => api.get('/perfiles/proveedor', { params }),
  getById: (id)       => api.get(`/perfiles/proveedor/${id}`),
  getMio:  ()         => api.get('/perfiles/proveedor/mio'),
  create:  (data)     => api.post('/perfiles/proveedor', data),
  update:  (id, data) => api.put(`/perfiles/proveedor/${id}`, data),
};
