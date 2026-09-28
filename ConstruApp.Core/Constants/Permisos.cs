namespace ConstruApp.Core.Constants;

/// <summary>
/// Códigos de permiso granulares del sistema RBAC de ConstruApp.
/// Formato: modulo.accion
/// </summary>
public static class Permisos
{
    // ── Proyectos ─────────────────────────────────────────────────────────────
    public static class Proyectos
    {
        public const string Ver           = "proyectos.ver";
        public const string Crear         = "proyectos.crear";
        public const string Editar        = "proyectos.editar";
        public const string Eliminar      = "proyectos.eliminar";
        public const string CambiarEstado = "proyectos.cambiarEstado";
    }

    // ── Presupuesto ───────────────────────────────────────────────────────────
    public static class Presupuesto
    {
        public const string Ver       = "presupuesto.ver";
        public const string Gestionar = "presupuesto.gestionar";
        public const string Aprobar   = "presupuesto.aprobar";
    }

    // ── Documentos ────────────────────────────────────────────────────────────
    public static class Documentos
    {
        public const string Ver      = "documentos.ver";
        public const string Subir    = "documentos.subir";
        public const string Eliminar = "documentos.eliminar";
    }

    // ── Chat ─────────────────────────────────────────────────────────────────
    public static class Chat
    {
        public const string Ver    = "chat.ver";
        public const string Enviar = "chat.enviar";
    }

    // ── Avances ───────────────────────────────────────────────────────────────
    public static class Avances
    {
        public const string Ver    = "avances.ver";
        public const string Crear  = "avances.crear";
        public const string Editar = "avances.editar";
    }

    // ── Órdenes de cambio ────────────────────────────────────────────────────
    public static class Ordenes
    {
        public const string Ver     = "ordenes.ver";
        public const string Crear   = "ordenes.crear";
        public const string Aprobar = "ordenes.aprobar";
    }

    // ── Equipo ────────────────────────────────────────────────────────────────
    public static class Equipo
    {
        public const string Ver       = "equipo.ver";
        public const string Gestionar = "equipo.gestionar";
    }

    // ── Facturación ───────────────────────────────────────────────────────────
    public static class Facturacion
    {
        public const string Ver       = "facturacion.ver";
        public const string Crear     = "facturacion.crear";
        public const string Gestionar = "facturacion.gestionar";
    }

    // ── IA ────────────────────────────────────────────────────────────────────
    public static class IA
    {
        public const string Usar = "ia.usar";
    }

    // ── Campo / PWA ───────────────────────────────────────────────────────────
    public static class Campo
    {
        public const string Acceso = "campo.acceso";
    }

    // ── Marketplace ───────────────────────────────────────────────────────────
    public static class Marketplace
    {
        public const string Ver      = "marketplace.ver";
        public const string Proponer = "marketplace.proponer";
    }

    // ── Administración ────────────────────────────────────────────────────────
    public static class Admin
    {
        public const string Usuarios      = "admin.usuarios";
        public const string Roles         = "admin.roles";
        public const string Auditoria     = "admin.auditoria";
        public const string Configuracion = "admin.configuracion";
        public const string Empresas      = "admin.empresas";
    }

    /// <summary>Lista completa de todos los permisos del sistema.</summary>
    public static readonly string[] Todos =
    [
        Proyectos.Ver, Proyectos.Crear, Proyectos.Editar, Proyectos.Eliminar, Proyectos.CambiarEstado,
        Presupuesto.Ver, Presupuesto.Gestionar, Presupuesto.Aprobar,
        Documentos.Ver, Documentos.Subir, Documentos.Eliminar,
        Chat.Ver, Chat.Enviar,
        Avances.Ver, Avances.Crear, Avances.Editar,
        Ordenes.Ver, Ordenes.Crear, Ordenes.Aprobar,
        Equipo.Ver, Equipo.Gestionar,
        Facturacion.Ver, Facturacion.Crear, Facturacion.Gestionar,
        IA.Usar,
        Campo.Acceso,
        Marketplace.Ver, Marketplace.Proponer,
        Admin.Usuarios, Admin.Roles, Admin.Auditoria, Admin.Configuracion, Admin.Empresas,
    ];

    /// <summary>Matriz de permisos por defecto para cada rol.</summary>
    public static readonly Dictionary<string, string[]> MatrizPorDefecto = new()
    {
        ["Admin"] = Todos,

        ["Cliente"] = [
            Proyectos.Ver, Proyectos.Crear, Proyectos.Editar, Proyectos.Eliminar,
            Presupuesto.Ver, Presupuesto.Aprobar,
            Documentos.Ver, Documentos.Subir, Documentos.Eliminar,
            Chat.Ver, Chat.Enviar,
            Avances.Ver,
            Ordenes.Ver, Ordenes.Crear, Ordenes.Aprobar,
            Equipo.Ver,
            Facturacion.Ver,
            Marketplace.Ver,
        ],

        ["Constructor"] = [
            Proyectos.Ver, Proyectos.CambiarEstado,
            Presupuesto.Ver, Presupuesto.Gestionar,
            Documentos.Ver, Documentos.Subir, Documentos.Eliminar,
            Chat.Ver, Chat.Enviar,
            Avances.Ver, Avances.Crear, Avances.Editar,
            Ordenes.Ver, Ordenes.Crear, Ordenes.Aprobar,
            Equipo.Ver, Equipo.Gestionar,
            Facturacion.Ver, Facturacion.Crear, Facturacion.Gestionar,
            IA.Usar,
            Campo.Acceso,
            Marketplace.Ver, Marketplace.Proponer,
        ],

        ["Supervisor"] = [
            Proyectos.Ver, Proyectos.CambiarEstado,
            Presupuesto.Ver, Presupuesto.Gestionar,
            Documentos.Ver, Documentos.Subir,
            Chat.Ver, Chat.Enviar,
            Avances.Ver, Avances.Crear, Avances.Editar,
            Ordenes.Ver, Ordenes.Crear,
            Equipo.Ver,
            Campo.Acceso,
        ],

        ["MaestroObra"] = [
            Proyectos.Ver,
            Documentos.Ver, Documentos.Subir,
            Chat.Ver, Chat.Enviar,
            Avances.Ver, Avances.Crear, Avances.Editar,
            Ordenes.Ver, Ordenes.Crear,
            Equipo.Ver,
            Campo.Acceso,
        ],

        ["Arquitecto"] = [
            Proyectos.Ver,
            Presupuesto.Ver,
            Documentos.Ver, Documentos.Subir,
            Chat.Ver, Chat.Enviar,
            Avances.Ver, Avances.Crear,
            Ordenes.Ver, Ordenes.Crear,
            Equipo.Ver,
            Campo.Acceso,
        ],

        ["Ingeniero"] = [
            Proyectos.Ver,
            Presupuesto.Ver,
            Documentos.Ver, Documentos.Subir,
            Chat.Ver, Chat.Enviar,
            Avances.Ver, Avances.Crear,
            Ordenes.Ver, Ordenes.Crear,
            Equipo.Ver,
            Campo.Acceso,
        ],

        ["Proveedor"] = [
            Marketplace.Ver,
        ],
    };
}
