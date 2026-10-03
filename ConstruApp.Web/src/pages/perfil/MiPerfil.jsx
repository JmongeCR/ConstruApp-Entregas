import { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Button, Avatar,
  Chip, TextField, Divider, Alert, Snackbar, LinearProgress,
  Tabs, Tab, Switch, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, IconButton, Tooltip,
  Dialog, DialogTitle, DialogContent, DialogActions,
  MenuItem, Select, FormControl, InputLabel,
} from '@mui/material';
import PersonOutlineIcon   from '@mui/icons-material/PersonOutlined';
import LockIcon            from '@mui/icons-material/Lock';
import BusinessIcon        from '@mui/icons-material/Business';
import PeopleIcon          from '@mui/icons-material/PeopleOutlined';
import NotificationsIcon   from '@mui/icons-material/NotificationsOutlined';
import SaveIcon            from '@mui/icons-material/Save';
import EditIcon            from '@mui/icons-material/Edit';
import DeleteIcon          from '@mui/icons-material/Delete';
import AddIcon             from '@mui/icons-material/Add';
import VerifiedIcon        from '@mui/icons-material/Verified';
import LanguageIcon        from '@mui/icons-material/Language';
import LogoutIcon          from '@mui/icons-material/Logout';
import FolderOpenIcon      from '@mui/icons-material/FolderOpenOutlined';
import ChatIcon            from '@mui/icons-material/ChatBubbleOutlineRounded';
import ReceiptIcon         from '@mui/icons-material/ReceiptLongOutlined';
import CameraAltIcon       from '@mui/icons-material/CameraAltOutlined';
import SwapHorizIcon       from '@mui/icons-material/SwapHorizOutlined';
import CalendarMonthIcon   from '@mui/icons-material/CalendarMonthOutlined';
import { useAuth } from '../../context/AuthContext';
import {
  authApi, perfilesConstructorApi, perfilesProveedorApi, trabajadoresApi,
} from '../../api/endpoints';

const ACCENT = '#2563EB';
const AVATAR_PALETTE = ['#4F46E5','#0EA5E9','#10B981','#2563EB','#8B5CF6','#EC4899','#EF4444'];
const avatarBg = name => AVATAR_PALETTE[(name?.charCodeAt(0) ?? 0) % AVATAR_PALETTE.length];
const ROLE_COLOR = { Admin: '#7C3AED', Constructor: '#059669', Proveedor: '#A78BFA', Cliente: '#2563EB' };
const PROVINCIAS = ['San José','Alajuela','Cartago','Heredia','Guanacaste','Puntarenas','Limón'];
const ESTADOS_EMP = ['Activo','Inactivo'];
const ROLE_DESC = {
  Cliente:     { label: 'CLIENTE',     desc: 'Publicá proyectos y contratá constructores' },
  Constructor: { label: 'CONSTRUCTOR', desc: 'Gestioná proyectos y equipos de obra' },
  Proveedor:   { label: 'PROVEEDOR',   desc: 'Ofrecé materiales y servicios al mercado' },
  Admin:       { label: 'ADMIN',       desc: 'Administrá la plataforma completa' },
};

const HORAS = [
  '5am','6am','7am','8am','9am','10am','11am','12pm',
  '1pm','2pm','3pm','4pm','5pm','6pm','7pm','8pm','9pm','10pm',
];
const HORARIO_GRUPOS = [
  { key: 'lv', label: 'Lun – Vie' },
  { key: 'sa', label: 'Sábado'    },
  { key: 'do', label: 'Domingo'   },
];

const normalizeHora = h => h.replace(':00','').toLowerCase().replace(' ','');

function parseHorarioStr(str) {
  const slots = { lv: null, sa: null, do: null };
  if (!str) return slots;
  str.split(/,\s*/).forEach(part => {
    const m = part.match(/(\d+(?::\d+)?(?:am|pm))-(\d+(?::\d+)?(?:am|pm))/i);
    if (!m) return;
    const from = normalizeHora(m[1]), to = normalizeHora(m[2]);
    if (/lun/i.test(part))       slots.lv = { from, to };
    else if (/s[aá]b/i.test(part)) slots.sa = { from, to };
    else if (/dom/i.test(part))  slots.do = { from, to };
  });
  return slots;
}

function buildHorarioStr(slots) {
  return HORARIO_GRUPOS
    .filter(g => slots[g.key])
    .map(g => `${g.label} ${slots[g.key].from}-${slots[g.key].to}`)
    .join(', ');
}

function HorarioSelector({ value, onChange }) {
  const [slots, setSlots] = useState(() => parseHorarioStr(value));

  const toggle = (key, on) => {
    setSlots(prev => {
      const next = { ...prev, [key]: on ? { from: '8am', to: '6pm' } : null };
      onChange(buildHorarioStr(next));
      return next;
    });
  };
  const updateHora = (key, field, val) => {
    setSlots(prev => {
      const next = { ...prev, [key]: { ...prev[key], [field]: val } };
      onChange(buildHorarioStr(next));
      return next;
    });
  };

  return (
    <Box>
      <Label>Horario de atención</Label>
      {HORARIO_GRUPOS.map(({ key, label }) => (
        <Box key={key} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1,
          p: 1, borderRadius: '8px', bgcolor: slots[key] ? '#F8FAFC' : 'transparent',
          border: '1px solid', borderColor: slots[key] ? '#E2E8F0' : 'transparent' }}>
          <Switch size="small" checked={!!slots[key]} onChange={e => toggle(key, e.target.checked)} />
          <Typography fontSize={12.5} fontWeight={slots[key] ? 600 : 400}
            color={slots[key] ? 'text.primary' : 'text.secondary'} sx={{ minWidth: 76 }}>
            {label}
          </Typography>
          {slots[key] ? (
            <>
              <FormControl size="small" sx={{ minWidth: 88 }}>
                <Select value={HORAS.includes(slots[key].from) ? slots[key].from : '8am'}
                  onChange={e => updateHora(key, 'from', e.target.value)}
                  sx={{ fontSize: 12.5 }}>
                  {HORAS.map(h => <MenuItem key={h} value={h} sx={{ fontSize: 12.5 }}>{h}</MenuItem>)}
                </Select>
              </FormControl>
              <Typography fontSize={12} color="text.secondary">a</Typography>
              <FormControl size="small" sx={{ minWidth: 88 }}>
                <Select value={HORAS.includes(slots[key].to) ? slots[key].to : '6pm'}
                  onChange={e => updateHora(key, 'to', e.target.value)}
                  sx={{ fontSize: 12.5 }}>
                  {HORAS.map(h => <MenuItem key={h} value={h} sx={{ fontSize: 12.5 }}>{h}</MenuItem>)}
                </Select>
              </FormControl>
            </>
          ) : (
            <Typography fontSize={12} color="text.secondary" fontStyle="italic">Cerrado</Typography>
          )}
        </Box>
      ))}
    </Box>
  );
}

// ── helpers ───────────────────────────────────────────────────────────────────
function TabPanel({ children, value, index }) {
  return (
    <Box hidden={value !== index} sx={{ pt: 3 }}>
      {value === index && children}
    </Box>
  );
}

const Label = ({ children }) => (
  <Typography fontSize={12} color="text.secondary" fontWeight={600} sx={{ mb: 0.5, display: 'block' }}>
    {children}
  </Typography>
);

function SCard({ title, subtitle, children }) {
  return (
    <Card sx={{ mb: 2.5, border: '1px solid #E8EDF3', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
      <CardContent sx={{ p: 3 }}>
        <Typography fontWeight={700} fontSize={11.5} letterSpacing="0.7px"
          textTransform="uppercase" color="#475569">
          {title}
        </Typography>
        {subtitle && (
          <Typography fontSize={12.5} color="text.secondary" sx={{ mt: 0.3, mb: 2 }}>{subtitle}</Typography>
        )}
        <Divider sx={{ mt: 1.5, mb: 2.5 }} />
        {children}
      </CardContent>
    </Card>
  );
}

const TAB_SX = {
  '& .MuiTab-root': { fontSize: 13, fontWeight: 500, minHeight: 46, textTransform: 'none', color: '#64748B', gap: 0.5 },
  '& .Mui-selected': { fontWeight: 700, color: ACCENT },
  '& .MuiTabs-indicator': { bgcolor: ACCENT },
};

// ── MI CUENTA ─────────────────────────────────────────────────────────────────
function MiCuentaTab({ usuario }) {
  const { setUsuario } = useAuth();
  const [saving, setSaving] = useState(false);
  const [msg, setMsg]       = useState({ text: '', sev: 'success' });
  const [form, setForm]     = useState({ nombre: usuario?.nombre || '', telefono: usuario?.telefono || '' });
  const bg    = avatarBg(usuario?.nombre);
  const color = ROLE_COLOR[usuario?.rol] ?? ROLE_COLOR.Cliente;

  const roleInfo = ROLE_DESC[usuario?.rol];

  return (
    <SCard title="Información personal">
      <Box sx={{ display: 'flex', gap: 2, mb: 2.5, flexWrap: { xs: 'wrap', sm: 'nowrap' } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1,
          p: 1.75, bgcolor: '#F8FAFC', borderRadius: '10px', border: '1px solid #EEF2F7' }}>
          <Avatar sx={{ width: 48, height: 48, bgcolor: bg, fontSize: 18, fontWeight: 700, flexShrink: 0 }}>
            {usuario?.nombre?.[0]?.toUpperCase()}
          </Avatar>
          <Box>
            <Typography fontWeight={700} fontSize={14}>{usuario?.nombre}</Typography>
            <Chip label={usuario?.rol} size="small"
              sx={{ bgcolor: `${color}18`, color, fontWeight: 700, fontSize: 10.5, height: 19, mt: 0.25 }} />
          </Box>
        </Box>
        {roleInfo && (
          <Box sx={{ p: 1.75, bgcolor: `${color}10`, borderRadius: '10px', border: `1px solid ${color}30`,
            minWidth: { xs: '100%', sm: 180 }, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <Typography fontSize={10.5} fontWeight={700} letterSpacing="0.6px" color={color}
              textTransform="uppercase">{roleInfo.label}</Typography>
            <Typography fontSize={12.5} color="text.secondary" sx={{ mt: 0.4 }}>{roleInfo.desc}</Typography>
          </Box>
        )}
      </Box>

      {msg.text && (
        <Alert severity={msg.sev} sx={{ mb: 2.5 }} onClose={() => setMsg({ text: '', sev: 'success' })}>
          {msg.text}
        </Alert>
      )}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 2.5 }}>
        <Box>
          <Label>Nombre completo</Label>
          <TextField fullWidth size="small" value={form.nombre}
            onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} />
        </Box>
        <Box>
          <Label>Correo electrónico</Label>
          <TextField fullWidth size="small" value={usuario?.email} disabled
            helperText="No se puede cambiar" />
        </Box>
        <Box>
          <Label>Teléfono</Label>
          <TextField fullWidth size="small" value={form.telefono}
            onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))}
            placeholder="8888-8888" />
        </Box>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="contained" size="medium" startIcon={<SaveIcon />} disabled={saving}
          onClick={async () => {
            setSaving(true);
            try {
              const { data } = await authApi.updateProfile({ nombre: form.nombre, telefono: form.telefono || null });
              setUsuario(prev => ({ ...prev, nombre: data.nombre, telefono: data.telefono }));
              setMsg({ text: 'Perfil actualizado.', sev: 'success' });
            } catch { setMsg({ text: 'Error al guardar.', sev: 'error' }); }
            finally { setSaving(false); }
          }}
          sx={{ bgcolor: ACCENT, '&:hover': { bgcolor: '#1D4ED8' } }}>
          {saving ? 'Guardando…' : 'Guardar cambios'}
        </Button>
      </Box>
    </SCard>
  );
}

// ── SEGURIDAD ─────────────────────────────────────────────────────────────────
function SeguridadTab() {
  const { logout } = useAuth();
  const [form, setForm]     = useState({ contrasenaActual: '', contrasenaNueva: '', confirmar: '' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg]       = useState({ text: '', sev: 'success' });
  const set = f => e => setForm(p => ({ ...p, [f]: e.target.value }));

  const handleSave = async () => {
    if (form.contrasenaNueva !== form.confirmar) {
      setMsg({ text: 'Las contraseñas nuevas no coinciden.', sev: 'error' });
      return;
    }
    setSaving(true);
    try {
      await authApi.changePassword({ contrasenaActual: form.contrasenaActual, contrasenaNueva: form.contrasenaNueva });
      setMsg({ text: 'Contraseña actualizada correctamente.', sev: 'success' });
      setForm({ contrasenaActual: '', contrasenaNueva: '', confirmar: '' });
    } catch (e) {
      setMsg({ text: e.response?.data?.message || 'Error al cambiar la contraseña.', sev: 'error' });
    } finally { setSaving(false); }
  };

  return (
    <>
      <SCard title="Contraseña">
        {msg.text && (
          <Alert severity={msg.sev} sx={{ mb: 2.5 }} onClose={() => setMsg({ text: '', sev: 'success' })}>
            {msg.text}
          </Alert>
        )}
        <Box sx={{ display: 'grid', gap: 2 }}>
          <Box>
            <Label>Contraseña actual</Label>
            <TextField fullWidth size="small" type="password" value={form.contrasenaActual} onChange={set('contrasenaActual')} />
          </Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <Box>
              <Label>Nueva contraseña</Label>
              <TextField fullWidth size="small" type="password" value={form.contrasenaNueva} onChange={set('contrasenaNueva')}
                helperText="Mín. 6 caracteres, 1 mayúscula, 1 número" />
            </Box>
            <Box>
              <Label>Confirmar nueva contraseña</Label>
              <TextField fullWidth size="small" type="password" value={form.confirmar} onChange={set('confirmar')} />
            </Box>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2.5 }}>
          <Button variant="contained" size="medium" startIcon={<LockIcon />}
            onClick={handleSave} disabled={saving || !form.contrasenaActual || !form.contrasenaNueva}
            sx={{ bgcolor: '#0F172A', '&:hover': { bgcolor: '#1E293B' } }}>
            {saving ? 'Guardando…' : 'Cambiar contraseña'}
          </Button>
        </Box>
      </SCard>

      <SCard title="Sesión activa">
        <Typography fontSize={13} color="text.secondary" sx={{ mb: 2.5 }}>
          Cerrá todas las sesiones activas en otros dispositivos por seguridad.
        </Typography>
        <Button variant="outlined" color="error" size="medium" startIcon={<LogoutIcon />} onClick={logout}>
          Cerrar todas las sesiones
        </Button>
      </SCard>
    </>
  );
}

// ── NOTIFICACIONES ────────────────────────────────────────────────────────────
const NOTIF_ITEMS = [
  { key: 'proyectos',   label: 'Proyectos',         desc: 'Creación, asignación y finalización de proyectos', Icon: FolderOpenIcon,  def: true },
  { key: 'chat',        label: 'Chat y mensajes',   desc: 'Nuevos mensajes y menciones directas',              Icon: ChatIcon,        def: true },
  { key: 'facturacion', label: 'Facturación',       desc: 'Facturas creadas, enviadas, vencidas y pagos',      Icon: ReceiptIcon,     def: true },
  { key: 'avances',     label: 'Avances de obra',   desc: 'Nuevos avances y fotografías subidas',              Icon: CameraAltIcon,   def: true },
  { key: 'ordenes',     label: 'Órdenes de cambio', desc: 'Creación, aprobación y rechazo de órdenes',         Icon: SwapHorizIcon,   def: true },
  { key: 'cronograma',  label: 'Cronograma',        desc: 'Fases iniciadas, completadas y con atraso',         Icon: CalendarMonthIcon, def: false },
];

function NotificacionesTab() {
  const [prefs, setPrefs] = useState(Object.fromEntries(NOTIF_ITEMS.map(i => [i.key, i.def])));
  const [saved, setSaved] = useState(false);

  return (
    <SCard title="Preferencias de notificaciones" subtitle="Controlá qué eventos generan notificaciones en tu cuenta.">
      {NOTIF_ITEMS.map(({ key, label, desc, Icon }) => (
        <Box key={key} sx={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          py: 1.75, borderBottom: '1px solid #F1F5F9',
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ width: 36, height: 36, borderRadius: '9px', bgcolor: '#F1F5F9', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon sx={{ fontSize: 18, color: '#64748B' }} />
            </Box>
            <Box>
              <Typography fontSize={13.5} fontWeight={600}>{label}</Typography>
              <Typography fontSize={12} color="text.secondary">{desc}</Typography>
            </Box>
          </Box>
          <Switch checked={prefs[key]} size="small"
            onChange={e => setPrefs(p => ({ ...p, [key]: e.target.checked }))} />
        </Box>
      ))}
      <Box sx={{ mt: 2.5, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button variant="contained" size="medium" startIcon={<SaveIcon />}
          onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2000); }}
          sx={{ bgcolor: ACCENT, '&:hover': { bgcolor: '#1D4ED8' } }}>
          {saved ? '¡Guardado!' : 'Guardar preferencias'}
        </Button>
      </Box>
      <Box sx={{ mt: 2, p: 1.5, bgcolor: '#FFFBEB', borderRadius: '8px', border: '1px solid #FDE68A' }}>
        <Typography fontSize={12} color="#92400E">
          ⚠️ Tiempo real con SignalR — Actualmente las notificaciones usan polling cada 30 segundos. La arquitectura está preparada para migrar a SignalR para notificaciones instantáneas sin recarga.
        </Typography>
      </Box>
    </SCard>
  );
}

// ── EMPRESA (Constructor) ─────────────────────────────────────────────────────
function EmpresaTab({ perfil, setPerfil, form, setForm, saving, setSaving, notify }) {
  const set = f => e => setForm(p => ({ ...p, [f]: e.target.value }));
  const especialidades = form.especialidades?.split(',').map(s => s.trim()).filter(Boolean) ?? [];

  const handleSave = async () => {
    if (!form.nombreEmpresa?.trim()) {
      notify('El nombre de empresa es requerido.', 'error');
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form, aniosExperiencia: parseInt(form.aniosExperiencia) || 0 };
      const { data } = perfil?.id
        ? await perfilesConstructorApi.update(perfil.id, payload)
        : await perfilesConstructorApi.create(payload);
      setPerfil(data);
      notify('Perfil actualizado.');
    } catch { notify('Error al guardar.', 'error'); }
    finally { setSaving(false); }
  };

  return (
    <>
      <SCard title="Identidad de la empresa">
        <Box sx={{ display: 'grid', gap: 2 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <Box>
              <Label>Nombre de empresa *</Label>
              <TextField fullWidth size="small" value={form.nombreEmpresa} onChange={set('nombreEmpresa')} />
            </Box>
            <Box>
              <Label>Cédula jurídica</Label>
              <TextField fullWidth size="small" value={form.cedulaJuridica} onChange={set('cedulaJuridica')} />
            </Box>
          </Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 140px' }, gap: 2 }}>
            <Box>
              <Label>Sitio web</Label>
              <TextField fullWidth size="small" value={form.sitioWeb} onChange={set('sitioWeb')}
                placeholder="https://miempresa.cr"
                InputProps={{ startAdornment: <LanguageIcon sx={{ color: 'text.secondary', fontSize: 17, mr: 0.75 }} /> }} />
            </Box>
            <Box>
              <Label>Años de experiencia</Label>
              <TextField fullWidth size="small" type="number" inputProps={{ min: 0 }}
                value={form.aniosExperiencia} onChange={set('aniosExperiencia')} />
            </Box>
          </Box>
          {perfil?.verificado && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <VerifiedIcon sx={{ color: '#16A34A', fontSize: 17 }} />
              <Typography fontSize={12.5} color="#16A34A" fontWeight={600}>Verificado</Typography>
            </Box>
          )}
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2.5 }}>
          <Button variant="contained" size="medium" startIcon={<SaveIcon />}
            onClick={handleSave} disabled={saving}
            sx={{ bgcolor: ACCENT, '&:hover': { bgcolor: '#1D4ED8' } }}>
            {saving ? 'Guardando…' : 'Guardar cambios'}
          </Button>
        </Box>
      </SCard>

      <SCard title="Servicios y cobertura">
        <Box sx={{ display: 'grid', gap: 2 }}>
          <Box>
            <Label>Especialidades</Label>
            <TextField fullWidth size="small" value={form.especialidades} onChange={set('especialidades')}
              placeholder="Remodelación, Obra gris, Pisos, Pintura"
              helperText="Separadas por coma. Aparecen como chips en tu perfil público." />
            {especialidades.length > 0 && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mt: 1.25 }}>
                {especialidades.map(e => (
                  <Chip key={e} label={e} size="small"
                    sx={{ bgcolor: '#D1FAE5', color: '#065F46', fontWeight: 600, fontSize: 11 }} />
                ))}
              </Box>
            )}
          </Box>
          <Box>
            <Label>Zonas de cobertura</Label>
            <TextField fullWidth size="small" value={form.zonasCobertura} onChange={set('zonasCobertura')}
              placeholder="San José, Alajuela, Heredia" />
          </Box>
          <Box>
            <Label>Descripción de la empresa</Label>
            <TextField fullWidth multiline rows={4} size="small" value={form.bio} onChange={set('bio')}
              placeholder="Describí tu experiencia, proyectos que realizás, valores de tu empresa..." />
            <Typography fontSize={11} color="text.secondary" sx={{ mt: 0.5 }}>
              {form.bio?.length ?? 0} / 2000 caracteres
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2.5 }}>
          <Button variant="contained" size="medium" startIcon={<SaveIcon />}
            onClick={handleSave} disabled={saving}
            sx={{ bgcolor: ACCENT, '&:hover': { bgcolor: '#1D4ED8' } }}>
            {saving ? 'Guardando…' : 'Guardar cambios'}
          </Button>
        </Box>
      </SCard>
    </>
  );
}

// ── EQUIPO (Constructor) ──────────────────────────────────────────────────────
const EMPTY_EMP = { nombre: '', especialidad: '', telefono: '', estado: 'Activo' };

function EquipoTab() {
  const [rows, setRows]     = useState([]);
  const [loading, setLoad]  = useState(true);
  const [open, setOpen]     = useState(false);
  const [form, setForm]     = useState(EMPTY_EMP);
  const [editId, setEditId] = useState(null);
  const [error, setError]   = useState('');
  const set = f => e => setForm(p => ({ ...p, [f]: e.target.value }));

  const load = () => {
    setLoad(true);
    trabajadoresApi.getAll().then(r => setRows(r.data)).catch(() => {}).finally(() => setLoad(false));
  };
  useEffect(load, []);

  const handleOpen = (row = null) => {
    setError('');
    if (row) { setForm({ nombre: row.nombre, especialidad: row.especialidad, telefono: row.telefono, estado: row.estado }); setEditId(row.id); }
    else { setForm(EMPTY_EMP); setEditId(null); }
    setOpen(true);
  };

  const handleSave = async () => {
    setError('');
    try {
      if (editId) await trabajadoresApi.update(editId, form);
      else await trabajadoresApi.create(form);
      setOpen(false); load();
    } catch (e) { setError(e.response?.data?.message || 'Error al guardar'); }
  };

  return (
    <SCard title="Mi equipo" subtitle="Trabajadores registrados en tu empresa de construcción.">
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={() => handleOpen()}
          sx={{ bgcolor: ACCENT, '&:hover': { bgcolor: '#1D4ED8' } }}>
          Nuevo trabajador
        </Button>
      </Box>

      {loading ? <LinearProgress /> : (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#F8FAFC' }}>
                {['Nombre','Especialidad','Teléfono','Estado',''].map(h => (
                  <TableCell key={h} sx={{ fontWeight: 700, fontSize: 12 }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary', fontSize: 13 }}>
                    Sin trabajadores registrados
                  </TableCell>
                </TableRow>
              ) : rows.map(r => (
                <TableRow key={r.id} hover>
                  <TableCell><Typography fontWeight={600} fontSize={13}>{r.nombre}</Typography></TableCell>
                  <TableCell sx={{ fontSize: 13 }}>{r.especialidad || '—'}</TableCell>
                  <TableCell sx={{ fontSize: 13 }}>{r.telefono || '—'}</TableCell>
                  <TableCell>
                    <Chip label={r.estado} size="small"
                      sx={{ bgcolor: r.estado === 'Activo' ? '#D1FAE5' : '#F1F5F9',
                        color: r.estado === 'Activo' ? '#065F46' : '#64748B', fontWeight: 600, fontSize: 11 }} />
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Editar">
                      <IconButton size="small" onClick={() => handleOpen(r)}><EditIcon fontSize="small" /></IconButton>
                    </Tooltip>
                    <Tooltip title="Eliminar">
                      <IconButton size="small" color="error"
                        onClick={async () => { await trabajadoresApi.delete(r.id); load(); }}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>{editId ? 'Editar trabajador' : 'Nuevo trabajador'}</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2, mt: 1 }}>{error}</Alert>}
          <Box sx={{ display: 'grid', gap: 2, mt: 1 }}>
            <TextField fullWidth label="Nombre completo" size="small" value={form.nombre} onChange={set('nombre')} required />
            <TextField fullWidth label="Especialidad / Puesto" size="small" value={form.especialidad} onChange={set('especialidad')} />
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField fullWidth label="Teléfono" size="small" value={form.telefono} onChange={set('telefono')} />
              <FormControl fullWidth size="small">
                <InputLabel>Estado</InputLabel>
                <Select value={form.estado} onChange={set('estado')} label="Estado">
                  {ESTADOS_EMP.map(e => <MenuItem key={e} value={e}>{e}</MenuItem>)}
                </Select>
              </FormControl>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={handleSave} variant="contained"
            sx={{ bgcolor: ACCENT, '&:hover': { bgcolor: '#1D4ED8' } }}>Guardar</Button>
        </DialogActions>
      </Dialog>
    </SCard>
  );
}

// ── MI NEGOCIO (Proveedor) ────────────────────────────────────────────────────
function MiNegocioTab({ perfil, setPerfil, form, setForm, saving, setSaving, notify }) {
  const [errors, setErrors] = useState({});
  const set = f => e => {
    setForm(p => ({ ...p, [f]: e.target.value }));
    if (errors[f]) setErrors(p => ({ ...p, [f]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.nombreComercial?.trim()) errs.nombreComercial = 'El nombre comercial es requerido.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const { data } = perfil?.id
        ? await perfilesProveedorApi.update(perfil.id, form)
        : await perfilesProveedorApi.create(form);
      setPerfil(data);
      notify(perfil?.id ? 'Perfil actualizado.' : '¡Empresa registrada exitosamente!');
    } catch { notify('Error al guardar.', 'error'); }
    finally { setSaving(false); }
  };

  const isNew = !perfil?.id;

  return (
    <>
      {isNew && (
        <Box sx={{ mb: 2.5, p: 2, bgcolor: '#EFF6FF', borderRadius: '10px', border: '1px solid #BFDBFE',
          display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
          <Box sx={{ fontSize: 20, lineHeight: 1 }}>🏪</Box>
          <Box>
            <Typography fontSize={13.5} fontWeight={700} color="#1D4ED8">Registrá tu empresa</Typography>
            <Typography fontSize={12.5} color="#1E40AF" sx={{ mt: 0.3 }}>
              Completá la información de tu negocio para aparecer en el marketplace y empezar a recibir solicitudes de cotización de constructores y clientes.
            </Typography>
          </Box>
        </Box>
      )}
      {perfil?.verificado && (
        <Box sx={{ mb: 2.5, p: 1.5, bgcolor: '#F0FDF4', borderRadius: '8px', border: '1px solid #BBF7D0',
          display: 'flex', alignItems: 'center', gap: 1 }}>
          <VerifiedIcon sx={{ color: '#16A34A', fontSize: 18 }} />
          <Typography fontSize={13} fontWeight={600} color="#15803D">Empresa verificada</Typography>
        </Box>
      )}
      <SCard title="Mi negocio" subtitle="Información pública visible para clientes y constructores en el marketplace.">
        <Box sx={{ display: 'grid', gap: 2 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 180px' }, gap: 2 }}>
            <Box>
              <Label>Nombre comercial *</Label>
              <TextField fullWidth size="small" value={form.nombreComercial} onChange={set('nombreComercial')}
                error={!!errors.nombreComercial} helperText={errors.nombreComercial} />
            </Box>
            <Box>
              <Label>Teléfono del negocio</Label>
              <TextField fullWidth size="small" value={form.telefonoNegocio} onChange={set('telefonoNegocio')}
                placeholder="8888-8888" />
            </Box>
          </Box>
          <Box>
            <Label>Descripción del negocio</Label>
            <TextField fullWidth multiline rows={3} size="small" value={form.descripcion} onChange={set('descripcion')}
              placeholder="Describí tu negocio, productos que ofrecés, especialidades..." />
          </Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 160px' }, gap: 2 }}>
            <Box>
              <Label>Dirección</Label>
              <TextField fullWidth size="small" value={form.direccion} onChange={set('direccion')} />
            </Box>
            <Box>
              <Label>Provincia</Label>
              <TextField fullWidth size="small" select value={form.provincia} onChange={set('provincia')}
                SelectProps={{ native: true }}>
                {PROVINCIAS.map(p => <option key={p} value={p}>{p}</option>)}
              </TextField>
            </Box>
          </Box>
          <Box>
            <Label>Sitio web</Label>
            <TextField fullWidth size="small" value={form.sitioWeb} onChange={set('sitioWeb')} placeholder="https://..." />
          </Box>
          <HorarioSelector value={form.horarioAtencion}
            onChange={val => setForm(p => ({ ...p, horarioAtencion: val }))} />
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2.5 }}>
          <Button variant="contained" size="medium" startIcon={<SaveIcon />}
            onClick={handleSave} disabled={saving}
            sx={{ bgcolor: ACCENT, '&:hover': { bgcolor: '#1D4ED8' } }}>
            {saving ? 'Guardando…' : isNew ? 'Registrar empresa' : 'Guardar cambios'}
          </Button>
        </Box>
      </SCard>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ROLES
// ═══════════════════════════════════════════════════════════════════════════════

function PerfilConstructor({ usuario }) {
  const [tab, setTab]       = useState(0);
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoad]  = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast]   = useState({ open: false, msg: '', severity: 'success' });
  const [form, setForm]     = useState({
    nombreEmpresa: '', bio: '', especialidades: '', zonasCobertura: '',
    aniosExperiencia: '', cedulaJuridica: '', sitioWeb: '', instagram: '',
  });
  const notify = (msg, sev = 'success') => setToast({ open: true, msg, severity: sev });

  useEffect(() => {
    perfilesConstructorApi.getMio()
      .then(r => {
        setPerfil(r.data);
        setForm({
          nombreEmpresa:    r.data.nombreEmpresa    || '',
          bio:              r.data.bio              || '',
          especialidades:   r.data.especialidades   || '',
          zonasCobertura:   r.data.zonasCobertura   || '',
          aniosExperiencia: r.data.aniosExperiencia ?? '',
          cedulaJuridica:   r.data.cedulaJuridica   || '',
          sitioWeb:         r.data.sitioWeb         || '',
          instagram:        r.data.instagram        || '',
        });
      })
      .catch(() => {})
      .finally(() => setLoad(false));
  }, []);

  const TABS = [
    { label: 'Mi cuenta',      Icon: PersonOutlineIcon },
    { label: 'Empresa',        Icon: BusinessIcon },
    { label: 'Equipo',         Icon: PeopleIcon },
    { label: 'Seguridad',      Icon: LockIcon },
    { label: 'Notificaciones', Icon: NotificationsIcon },
  ];

  if (loading) return <LinearProgress />;

  return (
    <>
      <Box sx={{ borderBottom: '1px solid #E2E8F0' }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={TAB_SX}>
          {TABS.map(({ label, Icon }) => (
            <Tab key={label} label={label} icon={<Icon sx={{ fontSize: 16 }} />} iconPosition="start" />
          ))}
        </Tabs>
      </Box>
      <TabPanel value={tab} index={0}><MiCuentaTab usuario={usuario} /></TabPanel>
      <TabPanel value={tab} index={1}>
        <EmpresaTab perfil={perfil} setPerfil={setPerfil}
          form={form} setForm={setForm} saving={saving} setSaving={setSaving} notify={notify} />
      </TabPanel>
      <TabPanel value={tab} index={2}><EquipoTab /></TabPanel>
      <TabPanel value={tab} index={3}><SeguridadTab /></TabPanel>
      <TabPanel value={tab} index={4}><NotificacionesTab /></TabPanel>
      <Snackbar open={toast.open} autoHideDuration={3000}
        onClose={() => setToast(t => ({ ...t, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={toast.severity} onClose={() => setToast(t => ({ ...t, open: false }))}>{toast.msg}</Alert>
      </Snackbar>
    </>
  );
}

function PerfilProveedor({ usuario }) {
  const [tab, setTab]       = useState(0);
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoad]  = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast]   = useState({ open: false, msg: '', severity: 'success' });
  const [form, setForm]     = useState({
    nombreComercial: '', descripcion: '', direccion: '',
    canton: '', provincia: 'San José', telefonoNegocio: '',
    sitioWeb: '', horarioAtencion: '',
  });
  const notify = (msg, sev = 'success') => setToast({ open: true, msg, severity: sev });

  useEffect(() => {
    perfilesProveedorApi.getMio()
      .then(r => {
        setPerfil(r.data);
        setForm({
          nombreComercial: r.data.nombreComercial || '',
          descripcion:     r.data.descripcion     || '',
          direccion:       r.data.direccion        || '',
          canton:          r.data.canton           || '',
          provincia:       r.data.provincia        || 'San José',
          telefonoNegocio: r.data.telefonoNegocio  || '',
          sitioWeb:        r.data.sitioWeb         || '',
          horarioAtencion: r.data.horarioAtencion  || '',
        });
      })
      .catch(() => {})
      .finally(() => setLoad(false));
  }, []);

  const TABS = [
    { label: 'Mi cuenta',      Icon: PersonOutlineIcon },
    { label: 'Mi negocio',     Icon: BusinessIcon },
    { label: 'Seguridad',      Icon: LockIcon },
    { label: 'Notificaciones', Icon: NotificationsIcon },
  ];

  if (loading) return <LinearProgress />;

  return (
    <>
      <Box sx={{ borderBottom: '1px solid #E2E8F0' }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={TAB_SX}>
          {TABS.map(({ label, Icon }) => (
            <Tab key={label} label={label} icon={<Icon sx={{ fontSize: 16 }} />} iconPosition="start" />
          ))}
        </Tabs>
      </Box>
      <TabPanel value={tab} index={0}><MiCuentaTab usuario={usuario} /></TabPanel>
      <TabPanel value={tab} index={1}>
        <MiNegocioTab perfil={perfil} setPerfil={setPerfil}
          form={form} setForm={setForm} saving={saving} setSaving={setSaving} notify={notify} />
      </TabPanel>
      <TabPanel value={tab} index={2}><SeguridadTab /></TabPanel>
      <TabPanel value={tab} index={3}><NotificacionesTab /></TabPanel>
      <Snackbar open={toast.open} autoHideDuration={3000}
        onClose={() => setToast(t => ({ ...t, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={toast.severity} onClose={() => setToast(t => ({ ...t, open: false }))}>{toast.msg}</Alert>
      </Snackbar>
    </>
  );
}

function PerfilCliente({ usuario }) {
  const [tab, setTab] = useState(0);
  const TABS = [
    { label: 'Mi cuenta',      Icon: PersonOutlineIcon },
    { label: 'Seguridad',      Icon: LockIcon },
    { label: 'Notificaciones', Icon: NotificationsIcon },
  ];
  return (
    <>
      <Box sx={{ borderBottom: '1px solid #E2E8F0' }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={TAB_SX}>
          {TABS.map(({ label, Icon }) => (
            <Tab key={label} label={label} icon={<Icon sx={{ fontSize: 16 }} />} iconPosition="start" />
          ))}
        </Tabs>
      </Box>
      <TabPanel value={tab} index={0}><MiCuentaTab usuario={usuario} /></TabPanel>
      <TabPanel value={tab} index={1}><SeguridadTab /></TabPanel>
      <TabPanel value={tab} index={2}><NotificacionesTab /></TabPanel>
    </>
  );
}

function PerfilAdmin({ usuario }) {
  const [tab, setTab] = useState(0);
  const TABS = [
    { label: 'Mi cuenta', Icon: PersonOutlineIcon },
    { label: 'Seguridad', Icon: LockIcon },
  ];
  return (
    <>
      <Box sx={{ borderBottom: '1px solid #E2E8F0' }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={TAB_SX}>
          {TABS.map(({ label, Icon }) => (
            <Tab key={label} label={label} icon={<Icon sx={{ fontSize: 16 }} />} iconPosition="start" />
          ))}
        </Tabs>
      </Box>
      <TabPanel value={tab} index={0}><MiCuentaTab usuario={usuario} /></TabPanel>
      <TabPanel value={tab} index={1}><SeguridadTab /></TabPanel>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ROOT
// ═══════════════════════════════════════════════════════════════════════════════
export default function MiPerfil() {
  const { usuario } = useAuth();
  const rol = usuario?.rol;

  return (
    <Box>
      <Typography variant="h5" fontWeight={800} color="#0F172A" sx={{ mb: 0.5 }}>Configuración</Typography>
      <Typography color="text.secondary" fontSize={13.5} sx={{ mb: 3 }}>
        Gestioná tu cuenta, empresa y preferencias.
      </Typography>
      <Card sx={{ border: '1px solid #E8EDF3', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
        <CardContent sx={{ p: { xs: 1.5, sm: 2.5 } }}>
          {rol === 'Constructor' && <PerfilConstructor usuario={usuario} />}
          {rol === 'Proveedor'   && <PerfilProveedor   usuario={usuario} />}
          {rol === 'Admin'       && <PerfilAdmin        usuario={usuario} />}
          {rol === 'Cliente'     && <PerfilCliente      usuario={usuario} />}
        </CardContent>
      </Card>
    </Box>
  );
}
