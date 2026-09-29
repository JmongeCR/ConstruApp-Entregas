namespace ConstruApp.API.Services;

/// <summary>
/// Plantillas HTML transaccionales de ConstruApp.
/// Todas heredan del layout base (cabecera + footer con branding).
/// </summary>
public static class EmailTemplates
{
    // ── Layout base ────────────────────────────────────────────────────────────

    private static string Base(string titulo, string contenido) => $@"
<!DOCTYPE html>
<html lang=""es"">
<head>
  <meta charset=""UTF-8"">
  <meta name=""viewport"" content=""width=device-width, initial-scale=1.0"">
  <title>{titulo}</title>
  <style>
    * {{ box-sizing: border-box; margin: 0; padding: 0; }}
    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #F1F5F9; color: #0F172A; }}
    .wrapper {{ max-width: 600px; margin: 32px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }}
    .header {{ background: linear-gradient(135deg, #0F1629 0%, #1E3A5F 100%); padding: 28px 32px; }}
    .logo {{ display: flex; align-items: center; gap: 10px; }}
    .logo-icon {{ background: #2563EB; border-radius: 8px; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; font-size: 18px; }}
    .logo-text {{ color: #fff; font-size: 18px; font-weight: 800; letter-spacing: -0.3px; }}
    .body {{ padding: 32px; }}
    .title {{ font-size: 22px; font-weight: 700; color: #0F172A; margin-bottom: 8px; }}
    .subtitle {{ font-size: 15px; color: #64748B; margin-bottom: 24px; line-height: 1.6; }}
    .card {{ background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 20px 24px; margin-bottom: 20px; }}
    .card-row {{ display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #F1F5F9; }}
    .card-row:last-child {{ border-bottom: none; }}
    .card-label {{ font-size: 13px; color: #64748B; }}
    .card-value {{ font-size: 13px; font-weight: 600; color: #0F172A; }}
    .badge {{ display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; }}
    .badge-green  {{ background: #DCFCE7; color: #166534; }}
    .badge-blue   {{ background: #DBEAFE; color: #1D4ED8; }}
    .badge-yellow {{ background: #FEF9C3; color: #854D0E; }}
    .badge-red    {{ background: #FEE2E2; color: #991B1B; }}
    .btn {{ display: inline-block; background: #2563EB; color: #fff !important; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-size: 14px; font-weight: 700; margin: 16px 0; }}
    .btn-green {{ background: #16A34A; }}
    .divider {{ border: none; border-top: 1px solid #F1F5F9; margin: 24px 0; }}
    .footer {{ background: #F8FAFC; border-top: 1px solid #E2E8F0; padding: 20px 32px; text-align: center; }}
    .footer p {{ font-size: 12px; color: #94A3B8; line-height: 1.6; }}
    .footer a {{ color: #2563EB; text-decoration: none; }}
    @media (max-width: 600px) {{
      .wrapper {{ margin: 0; border-radius: 0; }}
      .body {{ padding: 20px; }}
      .header {{ padding: 20px; }}
    }}
  </style>
</head>
<body>
  <div class=""wrapper"">
    <div class=""header"">
      <div class=""logo"">
        <div class=""logo-icon"">🏗️</div>
        <span class=""logo-text"">ConstruApp</span>
      </div>
    </div>
    <div class=""body"">
      {contenido}
    </div>
    <div class=""footer"">
      <p>Este correo fue enviado automáticamente por <strong>ConstruApp</strong>.<br>
      Si tenés preguntas, contactanos en <a href=""mailto:soporte@construapp.com"">soporte@construapp.com</a></p>
      <p style=""margin-top:8px;"">© {DateTime.Now.Year} ConstruApp · Costa Rica</p>
    </div>
  </div>
</body>
</html>";

    // ── Propuestas ──────────────────────────────────────────────────────────────

    public static string NuevaPropuestaRecibida(
        string clienteNombre, string proyectoTitulo,
        string constructorNombre, decimal monto, string urlAccion) =>
        Base("Nueva propuesta recibida", $@"
        <p class=""title"">📋 Nueva propuesta recibida</p>
        <p class=""subtitle"">Hola <strong>{clienteNombre}</strong>, recibiste una propuesta para tu proyecto.</p>
        <div class=""card"">
          <div class=""card-row""><span class=""card-label"">Proyecto</span><span class=""card-value"">{proyectoTitulo}</span></div>
          <div class=""card-row""><span class=""card-label"">Constructor</span><span class=""card-value"">{constructorNombre}</span></div>
          <div class=""card-row""><span class=""card-label"">Monto propuesto</span><span class=""card-value"" style=""color:#2563EB;"">₡{monto:N0}</span></div>
        </div>
        <a href=""{urlAccion}"" class=""btn"">Ver propuesta →</a>
        <p style=""font-size:13px; color:#94A3B8; margin-top:8px;"">Podés aceptar o rechazar la propuesta desde la plataforma.</p>");

    public static string PropuestaAceptada(
        string constructorNombre, string proyectoTitulo,
        string clienteNombre, decimal monto, string urlAccion) =>
        Base("Propuesta aceptada 🎉", $@"
        <p class=""title"">✅ ¡Tu propuesta fue aceptada!</p>
        <p class=""subtitle"">Hola <strong>{constructorNombre}</strong>, el cliente aceptó tu propuesta.</p>
        <div class=""card"">
          <div class=""card-row""><span class=""card-label"">Proyecto</span><span class=""card-value"">{proyectoTitulo}</span></div>
          <div class=""card-row""><span class=""card-label"">Cliente</span><span class=""card-value"">{clienteNombre}</span></div>
          <div class=""card-row""><span class=""card-label"">Monto acordado</span><span class=""card-value"" style=""color:#16A34A;"">₡{monto:N0}</span></div>
          <div class=""card-row""><span class=""card-label"">Estado</span><span class=""badge badge-green"">Aceptada</span></div>
        </div>
        <a href=""{urlAccion}"" class=""btn btn-green"">Ver proyecto →</a>
        <p style=""font-size:13px; color:#64748B; margin-top:8px;"">Podés empezar a gestionar el cronograma y avances desde ConstruApp.</p>");

    public static string PropuestaRechazada(
        string constructorNombre, string proyectoTitulo,
        string? motivoRechazo, string urlAccion) =>
        Base("Propuesta rechazada", $@"
        <p class=""title"">❌ Tu propuesta no fue seleccionada</p>
        <p class=""subtitle"">Hola <strong>{constructorNombre}</strong>, el cliente revisó tu propuesta para <strong>{proyectoTitulo}</strong>.</p>
        {(string.IsNullOrEmpty(motivoRechazo) ? "" : $@"<div class=""card""><p style=""font-size:13px; color:#64748B;""><strong>Motivo:</strong> {motivoRechazo}</p></div>")}
        <hr class=""divider"">
        <p style=""font-size:13px; color:#64748B;"">Explorá más proyectos disponibles en el marketplace.</p>
        <a href=""{urlAccion}"" class=""btn"">Ver marketplace →</a>");

    // ── Facturación ─────────────────────────────────────────────────────────────

    public static string FacturaEmitida(
        string clienteNombre, string numFactura,
        string proyectoTitulo, decimal monto,
        DateTime? fechaVencimiento, string urlAccion) =>
        Base($"Factura {numFactura} emitida", $@"
        <p class=""title"">🧾 Nueva factura emitida</p>
        <p class=""subtitle"">Hola <strong>{clienteNombre}</strong>, recibiste una nueva factura de cobro.</p>
        <div class=""card"">
          <div class=""card-row""><span class=""card-label"">Número</span><span class=""card-value"">{numFactura}</span></div>
          <div class=""card-row""><span class=""card-label"">Proyecto</span><span class=""card-value"">{proyectoTitulo}</span></div>
          <div class=""card-row""><span class=""card-label"">Monto total</span><span class=""card-value"" style=""color:#2563EB; font-size:18px;"">₡{monto:N0}</span></div>
          <div class=""card-row""><span class=""card-label"">Vence</span><span class=""card-value"">{fechaVencimiento:dd/MM/yyyy}</span></div>
          <div class=""card-row""><span class=""card-label"">Estado</span><span class=""badge badge-yellow"">Pendiente</span></div>
        </div>
        <a href=""{urlAccion}"" class=""btn"">Ver factura →</a>
        <p style=""font-size:12px; color:#94A3B8; margin-top:8px;"">Si el PDF está adjunto, podés descargarlo directamente de este correo.</p>");

    public static string FacturaVencida(
        string clienteNombre, string numFactura,
        decimal monto, int diasVencida, string urlAccion) =>
        Base($"⚠ Factura {numFactura} vencida", $@"
        <p class=""title"">⚠️ Factura vencida sin pago</p>
        <p class=""subtitle"">Hola <strong>{clienteNombre}</strong>, la siguiente factura lleva <strong>{diasVencida} días</strong> sin pagar.</p>
        <div class=""card"">
          <div class=""card-row""><span class=""card-label"">Número</span><span class=""card-value"">{numFactura}</span></div>
          <div class=""card-row""><span class=""card-label"">Monto pendiente</span><span class=""card-value"" style=""color:#DC2626; font-size:18px;"">₡{monto:N0}</span></div>
          <div class=""card-row""><span class=""card-label"">Estado</span><span class=""badge badge-red"">Vencida ({diasVencida}d)</span></div>
        </div>
        <a href=""{urlAccion}"" class=""btn"" style=""background:#DC2626;"">Regularizar pago →</a>");

    public static string PagoRecibido(
        string constructorNombre, string numFactura,
        decimal montoPago, string proyectoTitulo, string urlAccion) =>
        Base("💰 Pago recibido", $@"
        <p class=""title"">💰 Pago registrado exitosamente</p>
        <p class=""subtitle"">Hola <strong>{constructorNombre}</strong>, se registró un pago para tu factura.</p>
        <div class=""card"">
          <div class=""card-row""><span class=""card-label"">Factura</span><span class=""card-value"">{numFactura}</span></div>
          <div class=""card-row""><span class=""card-label"">Proyecto</span><span class=""card-value"">{proyectoTitulo}</span></div>
          <div class=""card-row""><span class=""card-label"">Monto pagado</span><span class=""card-value"" style=""color:#16A34A; font-size:18px;"">₡{montoPago:N0}</span></div>
        </div>
        <a href=""{urlAccion}"" class=""btn btn-green"">Ver facturación →</a>");

    // ── Proyectos ───────────────────────────────────────────────────────────────

    public static string ProyectoAsignado(
        string constructorNombre, string proyectoTitulo,
        string clienteNombre, string ubicacion, string urlAccion) =>
        Base("Proyecto asignado", $@"
        <p class=""title"">👷 Fuiste asignado a un proyecto</p>
        <p class=""subtitle"">Hola <strong>{constructorNombre}</strong>, tenés un nuevo proyecto asignado.</p>
        <div class=""card"">
          <div class=""card-row""><span class=""card-label"">Proyecto</span><span class=""card-value"">{proyectoTitulo}</span></div>
          <div class=""card-row""><span class=""card-label"">Cliente</span><span class=""card-value"">{clienteNombre}</span></div>
          <div class=""card-row""><span class=""card-label"">Ubicación</span><span class=""card-value"">{ubicacion}</span></div>
          <div class=""card-row""><span class=""card-label"">Estado</span><span class=""badge badge-blue"">En ejecución</span></div>
        </div>
        <a href=""{urlAccion}"" class=""btn"">Ver proyecto →</a>");

    public static string ProyectoFinalizado(
        string clienteNombre, string proyectoTitulo, string urlAccion) =>
        Base("Proyecto finalizado 🏆", $@"
        <p class=""title"">🏆 Tu proyecto fue finalizado</p>
        <p class=""subtitle"">Hola <strong>{clienteNombre}</strong>, ¡el constructor marcó tu proyecto como completado!</p>
        <div class=""card"">
          <div class=""card-row""><span class=""card-label"">Proyecto</span><span class=""card-value"">{proyectoTitulo}</span></div>
          <div class=""card-row""><span class=""card-label"">Estado</span><span class=""badge badge-green"">Completado</span></div>
        </div>
        <a href=""{urlAccion}"" class=""btn btn-green"">Ver obra →</a>
        <p style=""font-size:13px; color:#64748B; margin-top:8px;"">¡No olvidés dejar tu calificación al constructor!</p>");

    // ── Órdenes de cambio ────────────────────────────────────────────────────────

    public static string OrdenCambioAprobada(
        string constructorNombre, string proyectoTitulo,
        string descripcion, decimal montoExtra, string urlAccion) =>
        Base("Orden de cambio aprobada ✅", $@"
        <p class=""title"">✅ Orden de cambio aprobada</p>
        <p class=""subtitle"">Hola <strong>{constructorNombre}</strong>, el cliente aprobó una orden de cambio.</p>
        <div class=""card"">
          <div class=""card-row""><span class=""card-label"">Proyecto</span><span class=""card-value"">{proyectoTitulo}</span></div>
          <div class=""card-row""><span class=""card-label"">Descripción</span><span class=""card-value"">{descripcion}</span></div>
          <div class=""card-row""><span class=""card-label"">Monto adicional</span><span class=""card-value"" style=""color:#16A34A;"">₡{montoExtra:N0}</span></div>
        </div>
        <a href=""{urlAccion}"" class=""btn btn-green"">Ver orden →</a>");

    public static string OrdenCambioRechazada(
        string constructorNombre, string proyectoTitulo,
        string descripcion, string urlAccion) =>
        Base("Orden de cambio rechazada", $@"
        <p class=""title"">❌ Orden de cambio rechazada</p>
        <p class=""subtitle"">Hola <strong>{constructorNombre}</strong>, el cliente rechazó la siguiente orden de cambio.</p>
        <div class=""card"">
          <div class=""card-row""><span class=""card-label"">Proyecto</span><span class=""card-value"">{proyectoTitulo}</span></div>
          <div class=""card-row""><span class=""card-label"">Descripción</span><span class=""card-value"">{descripcion}</span></div>
        </div>
        <a href=""{urlAccion}"" class=""btn"">Ver detalles →</a>");

    // ── Invitaciones workspace ────────────────────────────────────────────────────

    public static string InvitacionWorkspace(
        string nombreEmpresa, string rolWorkspace,
        string invitadoPorNombre, string urlAceptar, DateTime fechaExpiracion) =>
        Base($"Te invitaron a {nombreEmpresa} en ConstruApp", $@"
        <p class=""title"">🤝 Fuiste invitado a un workspace</p>
        <p class=""subtitle""><strong>{invitadoPorNombre}</strong> te invitó a unirte al workspace de <strong>{nombreEmpresa}</strong> en ConstruApp.</p>
        <div class=""card"">
          <div class=""card-row""><span class=""card-label"">Empresa</span><span class=""card-value"">{nombreEmpresa}</span></div>
          <div class=""card-row""><span class=""card-label"">Tu rol</span><span class=""badge badge-blue"">{rolWorkspace}</span></div>
          <div class=""card-row""><span class=""card-label"">Invitado por</span><span class=""card-value"">{invitadoPorNombre}</span></div>
          <div class=""card-row""><span class=""card-label"">Enlace válido hasta</span><span class=""card-value"">{fechaExpiracion:dd/MM/yyyy}</span></div>
        </div>
        <a href=""{urlAceptar}"" class=""btn btn-green"">Aceptar invitación →</a>
        <p style=""font-size:12px; color:#94A3B8; margin-top:12px;"">Si no esperabas esta invitación, podés ignorar este correo. El enlace expira el {fechaExpiracion:dd/MM/yyyy HH:mm} UTC.</p>");

    // ── Agregar miembro directo ───────────────────────────────────────────────────

    public static string AgregarMiembroWorkspace(
        string nombreEmpresa, string rolWorkspace,
        string nombreNuevo, string agregadoPor,
        string email, string urlActivar, DateTime fechaExpiracion) =>
        Base($"Fuiste agregado al equipo de {nombreEmpresa}", $@"
        <p class=""title"">👋 ¡Hola, {nombreNuevo}!</p>
        <p class=""subtitle""><strong>{agregadoPor}</strong> creó tu cuenta en <strong>ConstruApp</strong> y te agregó al equipo de <strong>{nombreEmpresa}</strong>.</p>
        <div class=""card"">
          <div class=""card-row""><span class=""card-label"">Empresa</span><span class=""card-value"">{nombreEmpresa}</span></div>
          <div class=""card-row""><span class=""card-label"">Tu rol</span><span class=""badge badge-blue"">{rolWorkspace}</span></div>
          <div class=""card-row""><span class=""card-label"">Email de acceso</span><span class=""card-value"">{email}</span></div>
          <div class=""card-row""><span class=""card-label"">Enlace válido hasta</span><span class=""card-value"">{fechaExpiracion:dd/MM/yyyy HH:mm} UTC</span></div>
        </div>
        <p style=""font-size:14px; color:#0F172A; margin-bottom:12px;"">Para empezar, definí tu contraseña haciendo clic en el botón de abajo:</p>
        <a href=""{urlActivar}"" class=""btn btn-green"">Definir mi contraseña →</a>
        <hr class=""divider"">
        <p style=""font-size:12px; color:#94A3B8;"">Si no esperabas este mensaje, podés ignorarlo. El enlace expira el {fechaExpiracion:dd/MM/yyyy}.</p>");

    // ── Aprobación / Rechazo de cuenta ───────────────────────────────────────────

    public static string CuentaAprobada(string nombre, string rol, string loginUrl) =>
        Base("¡Tu cuenta en ConstruApp fue aprobada!", $@"
        <p class=""title"">✅ ¡Bienvenido/a a ConstruApp!</p>
        <p class=""subtitle"">Hola <strong>{nombre}</strong>, tu solicitud de acceso fue revisada y aprobada por nuestro equipo.</p>
        <div class=""card"">
          <div class=""card-row""><span class=""card-label"">Usuario</span><span class=""card-value"">{nombre}</span></div>
          <div class=""card-row""><span class=""card-label"">Rol asignado</span><span class=""badge badge-green"">{rol}</span></div>
          <div class=""card-row""><span class=""card-label"">Estado</span><span class=""badge badge-green"">✓ Activo</span></div>
        </div>
        <p style=""text-align:center;"">
          <a href=""{loginUrl}"" class=""btn btn-green"">Ingresar a ConstruApp →</a>
        </p>
        <p style=""font-size:13px; color:#64748B; margin-top:16px;"">
          Ya podés iniciar sesión con tu correo y la contraseña que registraste.
          Si tenés alguna consulta, contactá a nuestro equipo de soporte.
        </p>");

    public static string CuentaRechazada(string nombre, string? motivo) =>
        Base("Actualización sobre tu solicitud en ConstruApp", $@"
        <p class=""title"">Tu solicitud fue revisada</p>
        <p class=""subtitle"">Hola <strong>{nombre}</strong>, gracias por tu interés en ConstruApp.</p>
        <p style=""font-size:15px; color:#374151; margin-bottom:20px;"">
          Lamentablemente, en esta oportunidad no pudimos aprobar tu solicitud de acceso.
        </p>
        {(string.IsNullOrWhiteSpace(motivo) ? "" : $@"
        <div class=""card"">
          <p style=""font-size:13px; color:#64748B; margin-bottom:6px; font-weight:600;"">Motivo:</p>
          <p style=""font-size:14px; color:#374151;"">{motivo}</p>
        </div>")}
        <p style=""font-size:13px; color:#64748B; margin-top:16px;"">
          Si crees que hubo un error o deseas más información, podés responder este correo o contactar a nuestro equipo.
        </p>");

    // ── Admin: usuario creado con contraseña temporal ─────────────────────────────

    public static string UsuarioCreado(string nombre, string email, string tempPassword, string loginUrl) =>
        Base("Tu cuenta en ConstruApp ha sido creada", $@"
        <p class=""title"">¡Bienvenido a ConstruApp!</p>
        <p class=""subtitle"">Hola <strong>{nombre}</strong>, un administrador creó una cuenta para vos.</p>
        <div class=""card"">
          <div class=""card-row""><span class=""card-label"">Usuario (email)</span><span class=""card-value"">{email}</span></div>
          <div class=""card-row""><span class=""card-label"">Contraseña temporal</span><span class=""card-value"" style=""font-family:monospace;letter-spacing:1px;"">{tempPassword}</span></div>
        </div>
        <p style=""font-size:14px; color:#374151; margin:20px 0 8px;"">
          Por seguridad, cambiá tu contraseña apenas inicies sesión.
        </p>
        <div style=""text-align:center; margin:28px 0;"">
          <a href=""{loginUrl}"" class=""btn"">Iniciar sesión</a>
        </div>
        <p style=""font-size:12px; color:#94A3B8;"">Si no esperabas este correo, podés ignorarlo.</p>");

    // ── Recuperación de contraseña ────────────────────────────────────────────────

    public static string RecuperacionContrasena(string nombre, string resetUrl) =>
        Base("Recuperá tu contraseña — ConstruApp", $@"
        <p class=""title"">🔐 Recuperá tu contraseña</p>
        <p class=""subtitle"">Hola <strong>{nombre}</strong>, recibimos una solicitud para restablecer la contraseña de tu cuenta en ConstruApp.</p>
        <div style=""text-align:center; margin:28px 0;"">
          <a href=""{resetUrl}"" class=""btn"">Restablecer contraseña</a>
        </div>
        <div class=""card"">
          <div class=""card-row""><span class=""card-label"">Válido por</span><span class=""badge badge-yellow"">24 horas</span></div>
          <div class=""card-row""><span class=""card-label"">Solicitado</span><span class=""card-value"">{DateTime.Now:dd/MM/yyyy HH:mm}</span></div>
        </div>
        <p style=""font-size:13px; color:#94A3B8;"">Si no solicitaste este cambio, podés ignorar este correo. Tu contraseña no será modificada.</p>
        <p style=""font-size:12px; color:#CBD5E1; margin-top:8px;"">Si el botón no funciona, copiá este enlace: <a href=""{resetUrl}"" style=""color:#2563EB;"">{resetUrl}</a></p>");

    // ── Test ─────────────────────────────────────────────────────────────────────

    public static string CorreoPrueba(string destinatario) =>
        Base("Prueba de correo ConstruApp", $@"
        <p class=""title"">🎉 ¡Conexión SMTP funcionando!</p>
        <p class=""subtitle"">Hola <strong>{destinatario}</strong>, este es un correo de prueba enviado desde ConstruApp.</p>
        <div class=""card"">
          <div class=""card-row""><span class=""card-label"">Estado SMTP</span><span class=""badge badge-green"">✓ Conectado</span></div>
          <div class=""card-row""><span class=""card-label"">Fecha</span><span class=""card-value"">{DateTime.Now:dd/MM/yyyy HH:mm}</span></div>
          <div class=""card-row""><span class=""card-label"">Sistema</span><span class=""card-value"">ConstruApp v1.0</span></div>
        </div>
        <p style=""font-size:13px; color:#64748B;"">Si recibiste este correo, la configuración SMTP está correcta.</p>");

    public static string VerificacionEmail(string nombre, string verifyUrl) =>
        Base("Verificá tu correo — ConstruApp", $@"
        <p class=""title"">Verificá tu correo electrónico</p>
        <p class=""subtitle"">Hola {nombre}, gracias por registrarte en ConstruApp. Hacé clic en el botón para confirmar tu dirección de correo.</p>
        <div style=""text-align:center; margin: 28px 0;"">
          <a href=""{verifyUrl}"" style=""background:#1B3B7A; color:#fff; text-decoration:none; padding:14px 32px; border-radius:10px; font-weight:700; font-size:15px; display:inline-block;"">
            Verificar correo electrónico
          </a>
        </div>
        <p style=""font-size:13px; color:#64748B; text-align:center;"">
          O copiá este enlace en tu navegador:<br/>
          <a href=""{verifyUrl}"" style=""color:#2563EB; word-break:break-all;"">{verifyUrl}</a>
        </p>
        <p style=""font-size:12px; color:#94A3B8; margin-top:20px; text-align:center;"">
          Este enlace expira en 24 horas. Si no creaste una cuenta, ignorá este mensaje.
        </p>");
}
