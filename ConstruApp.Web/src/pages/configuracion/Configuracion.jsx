import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box, Typography, Button, TextField, Avatar, Divider,
  Chip, Alert, Snackbar, Select, MenuItem, FormControl, InputLabel,
  Dialog, DialogTitle, DialogContent, DialogActions, Switch, FormControlLabel,
  Tabs, Tab,
} from '@mui/material';
import PersonIcon               from '@mui/icons-material/Person';
import BusinessIcon             from '@mui/icons-material/Business';
import GroupsIcon               from '@mui/icons-material/Groups';
import LockIcon                 from '@mui/icons-material/Lock';
import SaveIcon                 from '@mui/icons-material/Save';
import AddIcon                  from '@mui/icons-material/Add';
import CheckCircleIcon          from '@mui/icons-material/CheckCircle';
import ShieldIcon               from '@mui/icons-material/Shield';
import NotificationsIcon        from '@mui/icons-material/Notifications';
import EmailIcon                from '@mui/icons-material/Email';
import WifiIcon                 from '@mui/icons-material/Wifi';
import SendIcon                 from '@mui/icons-material/Send';
import { useAuth } from '../../context/AuthContext';
import { usuariosApi, perfilesConstructorApi, emailApi, invitacionesApi, empresaApi } from '../../api/endpoints';
import CancelIcon from '@mui/icons-material/Cancel';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import TaskAltIcon from '@mui/icons-material/TaskAlt';

const AVATAR_PALETTE = ['#4F46E5','#0EA5E9','#10B981','#F59E0B','#8B5CF6','#EC4899'];
const avatarBg = name => AVATAR_PALETTE[(name?.charCodeAt(0) ?? 0) % AVATAR_PALETTE.length];

const ROL_INFO = {
  Cliente:      { color: '#1D4ED8', bg: '#EFF6FF', desc: 'Publica proyectos y contrata constructores' },
  Constructor:  { color: '#065F46', bg: '#ECFDF5', desc: 'Envía propuestas y gestiona obras' },
  Proveedor:    { color: '#6D28D9', bg: '#F5F3FF', desc: 'Publica materiales y precios' },
  Admin:        { color: '#334155', bg: '#F1F5F9', desc: 'Acceso total a la plataforma' },
};

// Roles internos del workspace (concepto multi-tenant)
const ROLES_WORKSPACE = [
  { role: 'Dueño',         desc: 'Control total del workspace',    color: '#92400E', bg: '#FEF3C7' },
  { role: 'Administrador', desc: 'Gestiona proyectos y facturas',  color: '#1D4ED8', bg: '#DBEAFE' },
  { role: 'Supervisor',    desc: 'Gestiona obra y equipo en campo', color: '#065F46', bg: '#D1FAE5' },
  { role: 'Contador',      desc: 'Acceso solo a facturación',      color: '#6D28D9', bg: '#EDE9FE' },
  { role: 'MaestroObra',   desc: 'Coordina cuadrillas y avances',  color: '#0E7490', bg: '#CFFAFE' },
  { role: 'Arquitecto',    desc: 'Revisión técnica y planos',       color: '#7C3AED', bg: '#EDE9FE' },
  { role: 'Ingeniero',     desc: 'Supervisión estructural y calidad', color: '#0369A1', bg: '#E0F2FE' },
];


const SECCIONES = [
  { id: 'cuenta',         label: 'Mi cuenta',        icon: <PersonIcon          sx={{ fontSize: 16 }} /> },
  { id: 'empresa',        label: 'Empresa',           icon: <BusinessIcon        sx={{ fontSize: 16 }} /> },
  { id: 'equipo',         label: 'Equipo',            icon: <GroupsIcon          sx={{ fontSize: 16 }} /> },
  { id: 'seguridad',      label: 'Seguridad',         icon: <LockIcon            sx={{ fontSize: 16 }} /> },
  { id: 'notificaciones', label: 'Notificaciones',    icon: <NotificationsIcon   sx={{ fontSize: 16 }} /> },
  { id: 'email',          label: 'Email SMTP',        icon: <EmailIcon           sx={{ fontSize: 16 }} /> },
];

// ── Sección cuenta ────────────────────────────────────────────────────────────
function SeccionCuenta({ usuario, notify }) {
  const [form, setForm] = useState({
    nombre:   usuario?.nombre   ?? '',
    telefono: usuario?.telefono ?? '',
  });
  const [saving, setSaving] = useState(false);
  const set = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const bg  = avatarBg(usuario?.nombre);

  const handleSave = async () => {
    setSaving(true);
    try {
      await usuariosApi.update(usuario.id, form);
      notify('Perfil actualizado.');
    } catch { notify('Error al guardar.', 'error'); }
    finally { setSaving(false); }
  };

  const rolInfo = ROL_INFO[usuario?.rol] ?? ROL_INFO.Cliente;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Avatar + info */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 3,
        bgcolor: 'white', border: '1px solid #E2E8F0', borderRadius: 2, p: 3 }}>
        <Avatar sx={{ width: 64, height: 64, bgcolor: bg, fontWeight: 800, fontSize: 24 }}>
          {usuario?.nombre?.[0]?.toUpperCase()}
        </Avatar>
        <Box sx={{ flex: 1 }}>
          <Typography fontWeight={800} fontSize={16} sx={{ color: '#0F172A' }}>
            {usuario?.nombre}
          </Typography>
          <Typography fontSize={13.5} color="text.secondary">{usuario?.email}</Typography>
          <Box sx={{ mt: 1 }}>
            <Chip label={usuario?.rol} size="small"
              sx={{ bgcolor: rolInfo.bg, color: rolInfo.color, fontWeight: 700, fontSize: 11, height: 22, borderRadius: 1 }} />
          </Box>
        </Box>
        <Box sx={{ bgcolor: `${rolInfo.bg}`, borderRadius: 2, p: 2, maxWidth: 200 }}>
          <Typography variant="caption" sx={{ color: rolInfo.color, fontWeight: 700, display: 'block', mb: 0.5 }}>
            {usuario?.rol?.toUpperCase()}
          </Typography>
          <Typography variant="caption" sx={{ color: rolInfo.color, opacity: 0.8 }}>
            {rolInfo.desc}
          </Typography>
        </Box>
      </Box>

      {/* Formulario */}
      <Box sx={{ bgcolor: 'white', border: '1px solid #E2E8F0', borderRadius: 2, p: 3 }}>
        <Typography fontWeight={700} fontSize={13} sx={{ color: '#64748B', mb: 2, letterSpacing: 0.3 }}>
          INFORMACIÓN PERSONAL
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
          <TextField label="Nombre completo" name="nombre" value={form.nombre}
            onChange={set} size="small" fullWidth />
          <TextField label="Email" value={usuario?.email ?? ''} size="small" fullWidth disabled
            helperText="No se puede cambiar" />
          <TextField label="Teléfono" name="telefono" value={form.telefono}
            onChange={set} size="small" fullWidth placeholder="+506 8888-0000" />
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2.5 }}>
          <Button variant="contained" size="small" onClick={handleSave} disabled={saving}
            startIcon={<SaveIcon sx={{ fontSize: 15 }} />}
            sx={{ bgcolor: '#2563EB', '&:hover': { bgcolor: '#1D4ED8' }, fontWeight: 700, textTransform: 'none' }}>
            {saving ? 'Guardando…' : 'Guardar cambios'}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}

// ── Sección empresa (solo constructores) ──────────────────────────────────────
function SeccionEmpresa({ notify }) {
  const [perfil, setPerfil]   = useState(null);
  const [form,   setForm]     = useState({});
  const [saving, setSaving]   = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    perfilesConstructorApi.getMio()
      .then(r => {
        setPerfil(r.data);
        setForm({
          nombreEmpresa:   r.data.nombreEmpresa ?? '',
          bio:             r.data.bio ?? '',
          especialidades:  r.data.especialidades ?? '',
          zonasCobertura:  r.data.zonasCobertura ?? '',
          aniosExperiencia: r.data.aniosExperiencia ?? 0,
          cedulaJuridica:  r.data.cedulaJuridica ?? '',
          sitioWeb:        r.data.sitioWeb ?? '',
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const set = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSave = async () => {
    if (!perfil) return;
    setSaving(true);
    try {
      await perfilesConstructorApi.update(perfil.id, form);
      notify('Empresa actualizada.');
    } catch { notify('Error al guardar.', 'error'); }
    finally { setSaving(false); }
  };

  if (loading) return null;

  if (!perfil) return (
    <Box sx={{ bgcolor: 'white', border: '1px solid #E2E8F0', borderRadius: 2, p: 4, textAlign: 'center' }}>
      <BusinessIcon sx={{ fontSize: 40, color: '#E2E8F0', mb: 1.5 }} />
      <Typography fontWeight={600} color="#94A3B8" gutterBottom>Sin perfil de empresa</Typography>
      <Typography variant="caption" color="text.disabled">
        Creá tu perfil de constructor para poder enviar propuestas.
      </Typography>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      {/* Identidad */}
      <Box sx={{ bgcolor: 'white', border: '1px solid #E2E8F0', borderRadius: 2, p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Typography fontWeight={700} fontSize={13} sx={{ color: '#64748B', letterSpacing: 0.3 }}>
            IDENTIDAD DE LA EMPRESA
          </Typography>
          {perfil.verificado && (
            <Chip icon={<CheckCircleIcon sx={{ fontSize: 12 }} />} label="Verificado" size="small"
              sx={{ height: 20, fontSize: 10, fontWeight: 700, bgcolor: '#D1FAE5', color: '#065F46',
                '& .MuiChip-icon': { color: '#065F46' } }} />
          )}
        </Box>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
          <TextField label="Nombre de empresa *" name="nombreEmpresa" value={form.nombreEmpresa}
            onChange={set} size="small" fullWidth />
          <TextField label="Cédula jurídica" name="cedulaJuridica" value={form.cedulaJuridica}
            onChange={set} size="small" fullWidth placeholder="3-XXX-XXXXXX" />
          <TextField label="Sitio web" name="sitioWeb" value={form.sitioWeb}
            onChange={set} size="small" fullWidth placeholder="https://tuempresa.com" />
          <TextField label="Años de experiencia" name="aniosExperiencia" value={form.aniosExperiencia}
            onChange={set} type="number" size="small" fullWidth />
        </Box>
      </Box>

      {/* Servicios */}
      <Box sx={{ bgcolor: 'white', border: '1px solid #E2E8F0', borderRadius: 2, p: 3 }}>
        <Typography fontWeight={700} fontSize={13} sx={{ color: '#64748B', mb: 2, letterSpacing: 0.3 }}>
          SERVICIOS Y COBERTURA
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField label="Especialidades (separadas por coma)" name="especialidades" value={form.especialidades}
            onChange={set} size="small" fullWidth
            placeholder="Remodelación, Obra gris, Pisos…" />
          <TextField label="Zonas de cobertura" name="zonasCobertura" value={form.zonasCobertura}
            onChange={set} size="small" fullWidth
            placeholder="San José, Heredia, Alajuela…" />
          <TextField label="Descripción de la empresa" name="bio" value={form.bio}
            onChange={set} size="small" fullWidth multiline rows={3}
            placeholder="Contá brevemente qué hace tu empresa y qué la hace especial…" />
        </Box>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="contained" size="small" onClick={handleSave} disabled={saving}
          startIcon={<SaveIcon sx={{ fontSize: 15 }} />}
          sx={{ bgcolor: '#2563EB', '&:hover': { bgcolor: '#1D4ED8' }, fontWeight: 700, textTransform: 'none' }}>
          {saving ? 'Guardando…' : 'Guardar cambios'}
        </Button>
      </Box>
    </Box>
  );
}

// ── Sección equipo ────────────────────────────────────────────────────────────
function SeccionEquipo({ usuario, notify }) {
  const [miembros,   setMiembros]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [modalOpen,  setModalOpen]  = useState(false);
  const [sending,    setSending]    = useState(false);
  // Editar rol
  const [editOpen,   setEditOpen]   = useState(false);
  const [editMiembro, setEditMiembro] = useState(null);
  const [editRol,    setEditRol]    = useState('Supervisor');
  const [editLoading, setEditLoading] = useState(false);
  // Quitar miembro
  const [quitarId,   setQuitarId]   = useState(null);

  // Form agregar
  const [fNombre,   setFNombre]   = useState('');
  const [fEmail,    setFEmail]    = useState('');
  const [fTelefono, setFTelefono] = useState('');
  const [fRol,      setFRol]      = useState('Supervisor');

  const rolesSelect = ROLES_WORKSPACE.filter(r => r.role !== 'Dueño');

  const cargar = () => {
    setLoading(true);
    empresaApi.getMiembros()
      .then(r => setMiembros(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { cargar(); }, []);

  const resetModal = () => { setFNombre(''); setFEmail(''); setFTelefono(''); setFRol('Supervisor'); };
  const handleClose = () => { setModalOpen(false); resetModal(); };

  const handleAgregar = async () => {
    if (!fNombre || !fEmail) return;
    setSending(true);
    try {
      await empresaApi.agregarMiembro({ nombre: fNombre, email: fEmail, telefono: fTelefono || null, rolWorkspace: fRol });
      notify(`Cuenta creada. Se envió email con contraseña temporal a ${fEmail}`);
      handleClose();
      cargar();
    } catch (e) {
      notify(e?.response?.data?.message ?? 'Error al agregar miembro.', 'error');
    } finally { setSending(false); }
  };

  const abrirEditar = (m) => {
    setEditMiembro(m);
    setEditRol(m.rolWorkspace);
    setEditOpen(true);
  };

  const handleEditarRol = async () => {
    setEditLoading(true);
    try {
      await empresaApi.editarMiembro(editMiembro.invitacionId, { rolWorkspace: editRol });
      notify(`Rol de ${editMiembro.nombre} actualizado.`);
      setEditOpen(false);
      cargar();
    } catch (e) {
      notify(e?.response?.data?.message ?? 'Error.', 'error');
    } finally { setEditLoading(false); }
  };

  const handleQuitar = async (userId, nombre) => {
    setQuitarId(userId);
    try {
      await empresaApi.quitarMiembro(userId);
      notify(`${nombre} removido del equipo.`);
      cargar();
    } catch (e) {
      notify(e?.response?.data?.message ?? 'Error al quitar miembro.', 'error');
    } finally { setQuitarId(null); }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      {/* Miembros activos */}
      <Box sx={{ bgcolor: 'white', border: '1px solid #E2E8F0', borderRadius: 2, overflow: 'hidden' }}>
        <Box sx={{ px: 3, py: 2, borderBottom: '1px solid #F1F5F9',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography fontWeight={700} fontSize={13.5} sx={{ color: '#0F172A' }}>
            Equipo del workspace
          </Typography>
          <Button size="small" variant="contained"
            startIcon={<PersonAddIcon sx={{ fontSize: 14 }} />}
            onClick={() => setModalOpen(true)}
            sx={{ bgcolor: '#0F172A', '&:hover': { bgcolor: '#1E293B' },
              fontWeight: 700, textTransform: 'none', fontSize: 12.5, height: 32 }}>
            Agregar miembro
          </Button>
        </Box>

        {/* Dueño */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, px: 3, py: 2, borderBottom: '1px solid #F8FAFC' }}>
          <Avatar sx={{ width: 36, height: 36, bgcolor: avatarBg(usuario?.nombre), fontSize: 13, fontWeight: 800 }}>
            {usuario?.nombre?.[0]?.toUpperCase()}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography fontWeight={700} fontSize={13.5} noWrap>{usuario?.nombre}</Typography>
              <Chip label="Vos" size="small"
                sx={{ height: 18, fontSize: 9.5, fontWeight: 700, bgcolor: '#F1F5F9', color: '#64748B' }} />
            </Box>
            <Typography variant="caption" color="text.disabled">{usuario?.email}</Typography>
          </Box>
          <Chip label="Dueño" size="small"
            sx={{ bgcolor: '#FEF3C7', color: '#92400E', fontWeight: 700, fontSize: 11, height: 22, borderRadius: 1 }} />
        </Box>

        {loading ? (
          <Box sx={{ px: 3, py: 2 }}><Typography fontSize={12.5} color="text.disabled">Cargando…</Typography></Box>
        ) : miembros.length === 0 ? (
          <Box sx={{ px: 3, py: 2 }}>
            <Typography fontSize={12.5} color="text.disabled">Aún no hay miembros adicionales.</Typography>
          </Box>
        ) : miembros.map(m => {
          const ri = ROLES_WORKSPACE.find(r => r.role === m.rolWorkspace) ?? ROLES_WORKSPACE[1];
          return (
            <Box key={m.invitacionId} sx={{ display: 'flex', alignItems: 'center', gap: 2, px: 3, py: 2, borderBottom: '1px solid #F8FAFC' }}>
              <Avatar sx={{ width: 36, height: 36, bgcolor: avatarBg(m.nombre), fontSize: 13, fontWeight: 800 }}>
                {m.nombre?.[0]?.toUpperCase()}
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography fontWeight={700} fontSize={13.5} noWrap>{m.nombre}</Typography>
                  {!m.activo && <Chip label="Inactivo" size="small" color="warning" sx={{ height: 16, fontSize: 9.5 }} />}
                </Box>
                <Typography variant="caption" color="text.disabled">{m.email}</Typography>
              </Box>
              <Chip label={m.rolWorkspace} size="small"
                sx={{ bgcolor: ri.bg, color: ri.color, fontWeight: 700, fontSize: 11, height: 22, borderRadius: 1 }} />
              <Button size="small" onClick={() => abrirEditar(m)}
                sx={{ textTransform: 'none', fontSize: 11.5, fontWeight: 700, minWidth: 0, color: '#64748B' }}>
                Editar rol
              </Button>
              <Button size="small" color="error" disabled={quitarId === m.usuarioId}
                onClick={() => handleQuitar(m.usuarioId, m.nombre)}
                sx={{ textTransform: 'none', fontSize: 11.5, fontWeight: 700, minWidth: 0 }}>
                {quitarId === m.usuarioId ? '…' : 'Quitar'}
              </Button>
            </Box>
          );
        })}
      </Box>

      {/* Roles disponibles */}
      <Box sx={{ bgcolor: 'white', border: '1px solid #E2E8F0', borderRadius: 2, p: 3 }}>
        <Typography fontWeight={700} fontSize={13} sx={{ color: '#64748B', mb: 2, letterSpacing: 0.3 }}>
          ROLES DISPONIBLES
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}>
          {ROLES_WORKSPACE.filter(r => r.role !== 'Dueño').map(r => (
            <Box key={r.role} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5,
              p: 1.5, bgcolor: '#F8FAFC', borderRadius: 1.5, border: '1px solid #F1F5F9' }}>
              <Chip label={r.role} size="small"
                sx={{ bgcolor: r.bg, color: r.color, fontWeight: 700, fontSize: 10.5, height: 22, borderRadius: 1, flexShrink: 0 }} />
              <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.5, mt: 0.2 }}>
                {r.desc}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>

      {/* Modal agregar miembro */}
      <Dialog open={modalOpen} onClose={handleClose} maxWidth="xs" fullWidth
        PaperProps={{ sx: { borderRadius: 2.5 } }}>
        <DialogTitle sx={{ fontWeight: 800, fontSize: 15 }}>Agregar miembro al equipo</DialogTitle>
        <DialogContent sx={{ pt: '8px !important', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography fontSize={12.5} color="text.secondary">
            Se crea la cuenta y se envía email con contraseña temporal.
          </Typography>
          <TextField label="Nombre completo *" size="small" fullWidth
            value={fNombre} onChange={e => setFNombre(e.target.value)} />
          <TextField label="Email *" type="email" size="small" fullWidth
            value={fEmail} onChange={e => setFEmail(e.target.value)} placeholder="colaborador@email.com" />
          <TextField label="Teléfono (opcional)" size="small" fullWidth
            value={fTelefono} onChange={e => setFTelefono(e.target.value)} placeholder="+506 8888-0000" />
          <FormControl fullWidth size="small">
            <InputLabel>Rol en la empresa</InputLabel>
            <Select value={fRol} label="Rol en la empresa" onChange={e => setFRol(e.target.value)}>
              {rolesSelect.map(r => (
                <MenuItem key={r.role} value={r.role}>
                  <Box>
                    <Typography fontWeight={600} fontSize={13}>{r.role}</Typography>
                    <Typography fontSize={11} color="text.secondary">{r.desc}</Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ px: 2.5, pb: 2.5, gap: 1 }}>
          <Button size="small" onClick={handleClose} disabled={sending}>Cancelar</Button>
          <Button size="small" variant="contained"
            startIcon={<PersonAddIcon sx={{ fontSize: 14 }} />}
            onClick={handleAgregar}
            disabled={sending || !fNombre || !fEmail}
            sx={{ bgcolor: '#0F172A', '&:hover': { bgcolor: '#1E293B' }, fontWeight: 700, textTransform: 'none' }}>
            {sending ? 'Agregando…' : 'Agregar miembro'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal editar rol */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, fontSize: 15 }}>Editar rol — {editMiembro?.nombre}</DialogTitle>
        <DialogContent sx={{ pt: '8px !important' }}>
          <FormControl fullWidth size="small" sx={{ mt: 1 }}>
            <InputLabel>Rol en la empresa</InputLabel>
            <Select value={editRol} label="Rol en la empresa" onChange={e => setEditRol(e.target.value)}>
              {rolesSelect.map(r => (
                <MenuItem key={r.role} value={r.role}>
                  <Box>
                    <Typography fontWeight={600} fontSize={13}>{r.role}</Typography>
                    <Typography fontSize={11} color="text.secondary">{r.desc}</Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ px: 2.5, pb: 2.5, gap: 1 }}>
          <Button size="small" onClick={() => setEditOpen(false)}>Cancelar</Button>
          <Button size="small" variant="contained" onClick={handleEditarRol} disabled={editLoading}
            sx={{ bgcolor: '#0F172A', '&:hover': { bgcolor: '#1E293B' }, fontWeight: 700, textTransform: 'none' }}>
            {editLoading ? 'Guardando…' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// ── Sección seguridad ─────────────────────────────────────────────────────────
function SeccionSeguridad() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      <Box sx={{ bgcolor: 'white', border: '1px solid #E2E8F0', borderRadius: 2, p: 3 }}>
        <Typography fontWeight={700} fontSize={13} sx={{ color: '#64748B', mb: 2, letterSpacing: 0.3 }}>
          CONTRASEÑA
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 400 }}>
          <TextField label="Contraseña actual" type="password" size="small" fullWidth />
          <TextField label="Nueva contraseña" type="password" size="small" fullWidth />
          <TextField label="Confirmar nueva contraseña" type="password" size="small" fullWidth />
        </Box>
        <Box sx={{ mt: 2.5 }}>
          <Button variant="contained" size="small" disabled
            sx={{ bgcolor: '#0F172A', fontWeight: 700, textTransform: 'none' }}>
            Cambiar contraseña
          </Button>
        </Box>
      </Box>

      <Box sx={{ bgcolor: 'white', border: '1px solid #E2E8F0', borderRadius: 2, p: 3 }}>
        <Typography fontWeight={700} fontSize={13} sx={{ color: '#64748B', mb: 0.5, letterSpacing: 0.3 }}>
          SESIÓN ACTIVA
        </Typography>
        <Typography fontSize={13} color="text.secondary" sx={{ mb: 2 }}>
          Si sospechás que tu cuenta fue comprometida, cerrá la sesión desde todos los dispositivos.
        </Typography>
        <Button size="small" variant="outlined" color="error"
          sx={{ fontWeight: 700, textTransform: 'none', fontSize: 12.5 }}>
          Cerrar todas las sesiones
        </Button>
      </Box>
    </Box>
  );
}

// ── Sección notificaciones ────────────────────────────────────────────────────
const NOTIF_PREFS_KEY = 'notif_prefs';
const NOTIF_DEFAULT = {
  chat:          true,
  facturacion:   true,
  proyectos:     true,
  avances:       true,
  ordenesCambio: true,
  cronograma:    true,
};

function SeccionNotificaciones() {
  const [prefs, setPrefs] = useState(() => {
    try { return { ...NOTIF_DEFAULT, ...JSON.parse(localStorage.getItem(NOTIF_PREFS_KEY) || '{}') }; }
    catch { return NOTIF_DEFAULT; }
  });
  const [saved, setSaved] = useState(false);

  const toggle = (key) => setPrefs(p => ({ ...p, [key]: !p[key] }));

  const handleSave = () => {
    localStorage.setItem(NOTIF_PREFS_KEY, JSON.stringify(prefs));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const ITEMS = [
    { key: 'proyectos',     label: 'Proyectos',          desc: 'Creación, asignación y finalización de proyectos',   emoji: '🏗️' },
    { key: 'chat',          label: 'Chat y mensajes',     desc: 'Nuevos mensajes y menciones directas',               emoji: '💬' },
    { key: 'facturacion',   label: 'Facturación',         desc: 'Facturas creadas, enviadas, vencidas y pagos',       emoji: '💰' },
    { key: 'avances',       label: 'Avances de obra',     desc: 'Nuevos avances y fotografías subidas',               emoji: '📸' },
    { key: 'ordenesCambio', label: 'Órdenes de cambio',   desc: 'Creación, aprobación y rechazo de órdenes',          emoji: '📝' },
    { key: 'cronograma',    label: 'Cronograma',          desc: 'Fases iniciadas, completadas y con atraso',          emoji: '📅' },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      <Box sx={{ bgcolor: 'white', border: '1px solid #E2E8F0', borderRadius: 2, p: 3 }}>
        <Typography fontWeight={700} fontSize={14} sx={{ mb: 0.5 }}>Preferencias de notificaciones</Typography>
        <Typography fontSize={12.5} color="text.secondary" sx={{ mb: 2.5 }}>
          Controlá qué eventos generan notificaciones en tu cuenta.
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {ITEMS.map((item, i) => (
            <Box key={item.key}
              sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 1.5,
                borderBottom: i < ITEMS.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{ fontSize: 20, width: 36, height: 36, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', bgcolor: '#F8FAFC', borderRadius: '8px' }}>
                  {item.emoji}
                </Box>
                <Box>
                  <Typography fontSize={13.5} fontWeight={600}>{item.label}</Typography>
                  <Typography fontSize={12} color="text.secondary">{item.desc}</Typography>
                </Box>
              </Box>
              <Switch
                checked={prefs[item.key]}
                onChange={() => toggle(item.key)}
                size="small"
                sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#2563EB' },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#2563EB' } }}
              />
            </Box>
          ))}
        </Box>
        <Box sx={{ mt: 2.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Button variant="contained" size="small" startIcon={<SaveIcon sx={{ fontSize: 14 }} />}
            onClick={handleSave} sx={{ fontSize: 12.5, textTransform: 'none' }}>
            Guardar preferencias
          </Button>
          {saved && <Chip label="✓ Guardado" size="small" sx={{ bgcolor: '#DCFCE7', color: '#166534' }} />}
        </Box>
      </Box>

      <Box sx={{ bgcolor: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 2, p: 2.5 }}>
        <Typography fontWeight={700} fontSize={13.5} color="#1D4ED8" sx={{ mb: 0.5 }}>
          🔔 Tiempo real con SignalR
        </Typography>
        <Typography fontSize={12.5} color="#3B82F6">
          Actualmente las notificaciones usan polling cada 30 segundos.
          La arquitectura está preparada para migrar a SignalR para notificaciones instantáneas sin recarga.
        </Typography>
      </Box>
    </Box>
  );
}

// ── Sección Email SMTP ────────────────────────────────────────────────────────
function SeccionEmail({ notify }) {
  const [cfg,         setCfg]         = useState(null);
  const [pingStatus,  setPingStatus]  = useState(null); // null | 'ok' | 'error'
  const [pinging,     setPinging]     = useState(false);
  const [testEmail,   setTestEmail]   = useState('');
  const [sending,     setSending]     = useState(false);
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    emailApi.getConfig()
      .then(r => setCfg(r.data))
      .catch(() => setCfg(null))
      .finally(() => setLoading(false));
  }, []);

  const handlePing = async () => {
    setPinging(true);
    setPingStatus(null);
    try {
      const r = await emailApi.ping();
      setPingStatus(r.data.ok ? 'ok' : 'error');
    } catch { setPingStatus('error'); }
    finally { setPinging(false); }
  };

  const handleSendTest = async () => {
    if (!testEmail) return;
    setSending(true);
    try {
      const r = await emailApi.sendTest(testEmail);
      if (r.data.ok) notify('Correo de prueba enviado correctamente.');
      else           notify(r.data.mensaje || 'Error al enviar.', 'error');
    } catch { notify('Error al enviar el correo de prueba.', 'error'); }
    finally { setSending(false); }
  };

  const habilitado = cfg?.habilitarEnvio === 'True' || cfg?.habilitarEnvio === true;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>

      {/* Estado actual */}
      <Box sx={{ bgcolor: 'white', border: '1px solid #E2E8F0', borderRadius: 2, p: 3 }}>
        <Typography fontWeight={700} fontSize={14} sx={{ mb: 0.5 }}>
          Configuración SMTP actual
        </Typography>
        <Typography fontSize={12.5} color="text.secondary" sx={{ mb: 2.5 }}>
          Los valores se configuran en <code>appsettings.json</code> bajo la clave <code>Email</code>.
        </Typography>

        {loading ? (
          <Typography fontSize={13} color="text.secondary">Cargando…</Typography>
        ) : cfg ? (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}>
            {[
              { label: 'Servidor SMTP',   value: cfg.host || '—' },
              { label: 'Puerto',          value: cfg.puerto || '—' },
              { label: 'Usuario',         value: cfg.usuario || <em style={{ color: '#94A3B8' }}>Sin configurar</em> },
              { label: 'SSL',             value: cfg.sslEnabled === 'True' || cfg.sslEnabled === true ? 'Habilitado' : 'Deshabilitado' },
              { label: 'Remitente',       value: cfg.nombreRemitente || '—' },
              { label: 'Envío activo',    value: (
                <Chip
                  label={habilitado ? 'Habilitado' : 'Deshabilitado (dev)'}
                  size="small"
                  sx={{ height: 20, fontSize: 11, fontWeight: 700,
                    bgcolor: habilitado ? '#DCFCE7' : '#FEF3C7',
                    color:   habilitado ? '#166534' : '#92400E',
                  }}
                />
              )},
            ].map(row => (
              <Box key={row.label} sx={{ p: 1.5, bgcolor: '#F8FAFC', borderRadius: 1.5 }}>
                <Typography fontSize={11} color="text.secondary" fontWeight={600}
                  sx={{ mb: 0.3, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  {row.label}
                </Typography>
                <Typography fontSize={13} fontWeight={600}>{row.value}</Typography>
              </Box>
            ))}
          </Box>
        ) : (
          <Alert severity="warning" sx={{ fontSize: 12.5 }}>No se pudo cargar la configuración.</Alert>
        )}
      </Box>

      {/* Test de conexión */}
      <Box sx={{ bgcolor: 'white', border: '1px solid #E2E8F0', borderRadius: 2, p: 3 }}>
        <Typography fontWeight={700} fontSize={14} sx={{ mb: 0.5 }}>
          Probar conexión SMTP
        </Typography>
        <Typography fontSize={12.5} color="text.secondary" sx={{ mb: 2 }}>
          Verifica que el servidor SMTP esté accesible sin enviar correos.
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button variant="outlined" size="small" onClick={handlePing} disabled={pinging}
            startIcon={<WifiIcon sx={{ fontSize: 14 }} />}
            sx={{ textTransform: 'none', fontWeight: 700, fontSize: 12.5,
              color: '#2563EB', borderColor: '#BFDBFE', '&:hover': { borderColor: '#2563EB' } }}>
            {pinging ? 'Probando…' : 'Probar conexión'}
          </Button>
          {pingStatus === 'ok'    && <Chip label="✓ Conexión exitosa"  size="small" sx={{ bgcolor: '#DCFCE7', color: '#166534', fontWeight: 700 }} />}
          {pingStatus === 'error' && <Chip label="✗ No se pudo conectar" size="small" sx={{ bgcolor: '#FEE2E2', color: '#991B1B', fontWeight: 700 }} />}
        </Box>
      </Box>

      {/* Enviar correo de prueba */}
      <Box sx={{ bgcolor: 'white', border: '1px solid #E2E8F0', borderRadius: 2, p: 3 }}>
        <Typography fontWeight={700} fontSize={14} sx={{ mb: 0.5 }}>
          Correo de prueba
        </Typography>
        <Typography fontSize={12.5} color="text.secondary" sx={{ mb: 2 }}>
          Envía un correo de prueba con las plantillas de ConstruApp para verificar el formato HTML.
        </Typography>
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <TextField
            size="small" placeholder="destinatario@ejemplo.com" label="Destinatario"
            value={testEmail} onChange={e => setTestEmail(e.target.value)}
            sx={{ flex: 1, minWidth: 220 }}
          />
          <Button variant="contained" size="small" onClick={handleSendTest}
            disabled={sending || !testEmail}
            startIcon={<SendIcon sx={{ fontSize: 14 }} />}
            sx={{ bgcolor: '#2563EB', '&:hover': { bgcolor: '#1D4ED8' },
              textTransform: 'none', fontWeight: 700, fontSize: 12.5, height: 40 }}>
            {sending ? 'Enviando…' : 'Enviar prueba'}
          </Button>
        </Box>
      </Box>

      {/* Instrucciones */}
      <Box sx={{ bgcolor: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 2, p: 2.5 }}>
        <Typography fontWeight={700} fontSize={13.5} color="#166534" sx={{ mb: 1 }}>
          📧 Cómo configurar Gmail SMTP
        </Typography>
        <Typography fontSize={12.5} color="#15803D" component="div">
          <ol style={{ margin: 0, paddingLeft: 18, lineHeight: 1.8 }}>
            <li>Activá la <strong>verificación en dos pasos</strong> en tu cuenta Google.</li>
            <li>Creá una <strong>Contraseña de aplicación</strong> en <em>Seguridad → Contraseñas de aplicaciones</em>.</li>
            <li>En <code>appsettings.json</code> configurá <code>Email:Usuario</code> con tu Gmail y <code>Email:Password</code> con la contraseña de app.</li>
            <li>Cambiá <code>Email:HabilitarEnvio</code> a <code>true</code> para activar el envío real.</li>
          </ol>
        </Typography>
      </Box>
    </Box>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
export default function Configuracion() {
  const location        = useLocation();
  const navigate        = useNavigate();
  const { usuario }     = useAuth();
  const [toast, setToast] = useState({ open: false, msg: '', severity: 'success' });
  const notify = (msg, severity = 'success') => setToast({ open: true, msg, severity });

  // Sección activa desde hash o default 'cuenta'
  const seccionActiva = location.hash.replace('#', '') || 'cuenta';
  const esConstructor = usuario?.rol === 'Constructor';
  const esAdmin       = usuario?.rol === 'Admin';

  const secciones = SECCIONES.filter(s => {
    if (s.id === 'empresa' || s.id === 'equipo') return esConstructor;
    if (s.id === 'email') return esAdmin;
    return true;
  });

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={800} sx={{ color: '#0F172A' }}>Configuración</Typography>
        <Typography fontSize={13.5} color="text.secondary" sx={{ mt: 0.3 }}>
          Gestioná tu cuenta, empresa y preferencias
        </Typography>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '200px 1fr' }, gap: 3, alignItems: 'start' }}>

        {/* ── Sidebar ── */}
        <Box sx={{ bgcolor: 'white', border: '1px solid #E8EDF3', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          {secciones.map((s, i) => {
            const activo = seccionActiva === s.id;
            return (
              <Box key={s.id}
                onClick={() => navigate(`/configuracion#${s.id}`)}
                sx={{
                  display: 'flex', alignItems: 'center', gap: 1.5,
                  px: '14px', py: '11px',
                  cursor: 'pointer',
                  bgcolor: activo ? '#F0F4FF' : 'transparent',
                  borderLeft: `3px solid ${activo ? '#3B5BDB' : 'transparent'}`,
                  borderBottom: i < secciones.length - 1 ? '1px solid #F4F7FA' : 'none',
                  transition: 'all .12s ease',
                  '&:hover': { bgcolor: activo ? '#F0F4FF' : '#F8FAFC' },
                }}>
                <Box sx={{ color: activo ? '#3B5BDB' : '#A0ADBF', transition: 'color .12s' }}>{s.icon}</Box>
                <Typography fontWeight={activo ? 700 : 500} fontSize={13}
                  sx={{ color: activo ? '#3B5BDB' : '#5A6A7E', letterSpacing: '-0.1px' }}>
                  {s.label}
                </Typography>
              </Box>
            );
          })}
        </Box>

        {/* ── Contenido ── */}
        <Box>
          {seccionActiva === 'cuenta'         && <SeccionCuenta         usuario={usuario} notify={notify} />}
          {seccionActiva === 'empresa'        && esConstructor && <SeccionEmpresa    notify={notify} />}
          {seccionActiva === 'equipo'         && esConstructor && <SeccionEquipo     usuario={usuario} notify={notify} />}
          {seccionActiva === 'seguridad'      && <SeccionSeguridad />}
          {seccionActiva === 'notificaciones' && <SeccionNotificaciones />}
          {seccionActiva === 'email'          && esAdmin && <SeccionEmail notify={notify} />}
        </Box>
      </Box>

      <Snackbar open={toast.open} autoHideDuration={4000}
        onClose={() => setToast(t => ({ ...t, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={toast.severity} onClose={() => setToast(t => ({ ...t, open: false }))}>
          {toast.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
