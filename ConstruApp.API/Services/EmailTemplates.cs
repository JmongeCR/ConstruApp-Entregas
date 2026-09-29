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
  <link href=""https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Serif+Display&display=swap"" rel=""stylesheet"">
  <style>
    * {{ box-sizing: border-box; margin: 0; padding: 0; }}
    body {{ font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif; background: #F4F1EC; color: #111827; }}
    .wrapper {{ max-width: 540px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.10); }}
    .stripe {{ height: 4px; background: #F59E0B; }}
    .top {{ padding: 22px 36px 0; display: flex; align-items: center; gap: 8px; }}
    .logo-mark {{ width: 28px; height: 28px; background: #111827; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 15px; line-height: 1; }}
    .logo-name {{ font-size: 15px; font-weight: 700; color: #111827; letter-spacing: -0.3px; }}
    .body {{ padding: 32px 36px 36px; }}
    .greeting {{ font-family: 'DM Serif Display', Georgia, serif; font-size: 28px; color: #111827; line-height: 1.25; margin-bottom: 14px; letter-spacing: -0.5px; }}
    .text {{ font-size: 15px; color: #4B5563; line-height: 1.75; margin-bottom: 32px; }}
    .cta {{ margin-bottom: 32px; }}
    .btn {{ display: inline-block; text-decoration: none; padding: 15px 32px; border-radius: 8px; font-family: 'DM Sans', sans-serif; font-size: 15px; font-weight: 700; color: #ffffff !important; letter-spacing: -0.1px; }}
    .btn-amber {{ background: #D97706; }}
    .btn-navy  {{ background: #1B3B7A; }}
    .btn-green {{ background: #16A34A; }}
    .meta {{ display: flex; gap: 24px; background: #F9FAFB; border-radius: 8px; padding: 14px 20px; margin-bottom: 28px; }}
    .meta-label {{ font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.8px; color: #9CA3AF; margin-bottom: 3px; }}
    .meta-value {{ font-size: 14px; font-weight: 600; color: #111827; }}
    .divider {{ height: 1px; background: #F3F4F6; margin-bottom: 20px; }}
    .small {{ font-size: 13px; color: #9CA3AF; line-height: 1.65; }}
    .footer {{ border-top: 1px solid #F3F4F6; padding: 18px 36px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 6px; }}
    .footer-copy {{ font-size: 12px; color: #D1D5DB; }}
    .footer-link {{ font-size: 12px; color: #9CA3AF; text-decoration: none; }}
    @media (max-width: 600px) {{
      .wrapper {{ margin: 0; border-radius: 0; }}
      .body {{ padding: 28px 20px 28px; }}
      .top {{ padding: 20px 20px 0; }}
      .footer {{ padding: 16px 20px; }}
      .meta {{ flex-direction: column; gap: 12px; }}
    }}
  </style>
</head>
<body>
  <div class=""wrapper"">
    <div class=""stripe""></div>
    <div class=""top"">
      <div class=""logo-mark"">🏗</div>
      <span class=""logo-name"">ConstruApp</span>
    </div>
    <div class=""body"">
      {contenido}
    </div>
    <div class=""footer"">
      <span class=""footer-copy"">© {DateTime.Now.Year} ConstruApp · Costa Rica</span>
      <a href=""mailto:soporte@construapp.com"" class=""footer-link"">soporte@construapp.com</a>
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
        <p class=""greeting"">Recuperá tu<br>contraseña</p>
        <p class=""text"">Hola <strong>{nombre}</strong>, recibimos una solicitud para cambiar la contraseña de tu cuenta. Si fuiste vos, usá el botón de abajo para crear una nueva.</p>
        <div class=""cta"">
          <a href=""{resetUrl}"" class=""btn btn-amber"">Restablecer contraseña</a>
        </div>
        <div class=""meta"">
          <div><div class=""meta-label"">Válido por</div><div class=""meta-value"">1 hora</div></div>
        </div>
        <div class=""divider""></div>
        <p class=""small"">Si no pediste este cambio, podés ignorar este correo. Tu contraseña no se va a modificar.</p>");

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
        <p class=""greeting"">Confirmá tu<br>correo electrónico</p>
        <p class=""text"">Hola <strong>{nombre}</strong>, gracias por registrarte. Para activar tu cuenta verificá tu dirección de correo. Luego un administrador aprobará tu acceso.</p>
        <div class=""cta"">
          <a href=""{verifyUrl}"" class=""btn btn-navy"">Verificar correo electrónico</a>
        </div>
        <div class=""meta"">
          <div><div class=""meta-label"">Enlace válido</div><div class=""meta-value"">24 horas</div></div>
          <div><div class=""meta-label"">Siguiente paso</div><div class=""meta-value"">Aprobación admin</div></div>
        </div>
        <div class=""divider""></div>
        <p class=""small"">Si no creaste esta cuenta, ignorá este correo.</p>");
}
