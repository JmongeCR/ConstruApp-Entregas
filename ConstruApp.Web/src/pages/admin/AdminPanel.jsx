import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Tabs, Tab, Card, CardContent,
  Grid, Avatar, Chip, Button, IconButton, TextField,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Dialog, DialogTitle, DialogContent, DialogActions,
  MenuItem, Select, FormControl, InputLabel, Tooltip,
  Alert, CircularProgress, Divider, Stack, Switch, FormControlLabel, Checkbox,
} from '@mui/material';
import DashboardIcon            from '@mui/icons-material/Dashboard';
import PeopleIcon               from '@mui/icons-material/People';
import AdminPanelSettingsIcon   from '@mui/icons-material/AdminPanelSettings';
import BusinessIcon             from '@mui/icons-material/Business';
import FolderIcon               from '@mui/icons-material/Folder';
import SecurityIcon             from '@mui/icons-material/Security';
import HistoryIcon              from '@mui/icons-material/History';
import SettingsIcon             from '@mui/icons-material/Settings';
import BlockIcon                from '@mui/icons-material/Block';
import CheckCircleIcon          from '@mui/icons-material/CheckCircle';
import LockResetIcon            from '@mui/icons-material/LockReset';
import VerifiedIcon             from '@mui/icons-material/Verified';
import EditIcon                 from '@mui/icons-material/Edit';
import RefreshIcon              from '@mui/icons-material/Refresh';
import SearchIcon               from '@mui/icons-material/Search';
import SaveIcon                 from '@mui/icons-material/Save';
import StorageIcon              from '@mui/icons-material/Storage';
import CloudDoneIcon            from '@mui/icons-material/CloudDone';
import FolderOpenIcon           from '@mui/icons-material/FolderOpen';
import CalculateIcon            from '@mui/icons-material/Calculate';
import ArticleIcon              from '@mui/icons-material/Article';
import ChatIcon                 from '@mui/icons-material/Chat';
import TrendingUpIcon           from '@mui/icons-material/TrendingUp';
import AssignmentTurnedInIcon   from '@mui/icons-material/AssignmentTurnedIn';
import GroupsIcon               from '@mui/icons-material/Groups';
import ReceiptIcon              from '@mui/icons-material/Receipt';
import AutoAwesomeIcon          from '@mui/icons-material/AutoAwesome';
import LocationOnIcon           from '@mui/icons-material/LocationOn';
import StorefrontIcon           from '@mui/icons-material/Storefront';
import GppMaybeIcon             from '@mui/icons-material/GppMaybe';
import HourglassEmptyIcon       from '@mui/icons-material/HourglassEmpty';
import ThumbUpIcon              from '@mui/icons-material/ThumbUp';
import ThumbDownIcon            from '@mui/icons-material/ThumbDown';
import PersonAddIcon            from '@mui/icons-material/PersonAdd';
import GroupAddIcon             from '@mui/icons-material/GroupAdd';
import AddBusinessIcon          from '@mui/icons-material/AddBusiness';
import PersonRemoveIcon         from '@mui/icons-material/PersonRemove';
import DeleteIcon               from '@mui/icons-material/Delete';
import Accordion                from '@mui/material/Accordion';
import AccordionSummary         from '@mui/material/AccordionSummary';
import AccordionDetails         from '@mui/material/AccordionDetails';
import ExpandMoreIcon           from '@mui/icons-material/ExpandMore';
import {
  adminApi, permisosApi, auditoriaApi, configuracionApi,
} from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';

const ACCENT = '#2563EB';

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtCRC  = (n) => n == null ? '—' : `₡${Number(n).toLocaleString('es-CR')}`;
const fmtDate = (d) => d ? new Date(d).toLocaleString('es-CR', { dateStyle: 'short', timeStyle: 'short' }) : '—';

function KpiCard({ label, value, icon, color = ACCENT }) {
  return (
    <Card sx={{ borderRadius: 2, boxShadow: '0 1px 8px rgba(0,0,0,.08)' }}>
      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: '12px !important' }}>
        <Avatar sx={{ bgcolor: `${color}20`, color, width: 44, height: 44 }}>{icon}</Avatar>
        <Box>
          <Typography variant="h5" fontWeight={700}>{value}</Typography>
          <Typography variant="caption" color="text.secondary">{label}</Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

// ════════════════════════════════════════════════════════
//  TAB 0 — Dashboard
// ════════════════════════════════════════════════════════
function TabDashboard() {
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getStats()
      .then(r => setStats(r.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}><CircularProgress /></Box>;
  if (!stats)  return <Alert severity="error">No se pudo cargar el dashboard.</Alert>;

  const { usuarios: u, sistema: s } = stats;

  return (
    <Box>
      <Typography variant="h6" fontWeight={700} mb={2}>Resumen del sistema</Typography>

      {/* Usuarios */}
      <Typography variant="subtitle2" color="text.secondary" mb={1}>Usuarios</Typography>
      <Grid container spacing={2} mb={3}>
        <Grid size={{ xs: 6, sm: 3 }}><KpiCard label="Total usuarios"  value={u.total}         icon={<PeopleIcon />} /></Grid>
        <Grid size={{ xs: 6, sm: 3 }}><KpiCard label="Activos"         value={u.activos}       icon={<CheckCircleIcon />} color="#16a34a" /></Grid>
        <Grid size={{ xs: 6, sm: 3 }}><KpiCard label="Bloqueados"      value={u.bloqueados}    icon={<BlockIcon />}   color="#dc2626" /></Grid>
        <Grid size={{ xs: 6, sm: 3 }}><KpiCard label="Nuevos (30d)"    value={u.nuevosEste30d} icon={<PeopleIcon />}  color="#9333ea" /></Grid>
      </Grid>

      {/* Sistema */}
      <Typography variant="subtitle2" color="text.secondary" mb={1}>Estado del sistema</Typography>
      <Grid container spacing={2} mb={3}>
        <Grid size={{ xs: 6, sm: 3 }}><KpiCard label="Logs auditoría (30d)" value={s.auditLogs30d}              icon={<SecurityIcon />}  color="#9333ea" /></Grid>
        <Grid size={{ xs: 6, sm: 3 }}><KpiCard label="Almacenamiento"       value={`${s.uploadsSizeMb} MB`}     icon={<StorageIcon />}   color="#0891b2" /></Grid>
        <Grid size={{ xs: 6, sm: 3 }}><KpiCard label="Versión"              value={s.version}                   icon={<CloudDoneIcon />} color="#16a34a" /></Grid>
        <Grid size={{ xs: 6, sm: 3 }}><KpiCard label="Base de datos"        value={s.dbConectada ? 'Conectada' : 'Error'} icon={<StorageIcon />} color={s.dbConectada ? '#16a34a' : '#dc2626'} /></Grid>
      </Grid>

      {/* Tarjeta detalle sistema */}
      <Card variant="outlined" sx={{ borderRadius: 2 }}>
        <CardContent>
          <Typography variant="subtitle2" fontWeight={700} mb={1.5}>Información del servidor</Typography>
          <Grid container spacing={1.5}>
            {[
              { label: 'Ambiente',    value: s.ambiente },
              { label: 'Versión API', value: s.version },
              { label: 'BD',          value: s.dbConectada ? '✓ Conectada' : '✗ Sin conexión' },
              { label: 'Uploads',     value: `${s.uploadsSizeMb} MB usados` },
            ].map(({ label, value }) => (
              <Grid key={label} size={{ xs: 6, sm: 3 }}>
                <Box sx={{ p: 1.5, bgcolor: '#F8FAFC', borderRadius: 1.5 }}>
                  <Typography fontSize={11} color="text.secondary" fontWeight={600}
                    sx={{ mb: 0.3, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {label}
                  </Typography>
                  <Typography fontSize={13} fontWeight={600}>{value}</Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
}

// ════════════════════════════════════════════════════════
//  TAB 1 — Usuarios
// ════════════════════════════════════════════════════════
const ROLES = ['Cliente','Constructor','Proveedor','Supervisor','MaestroObra','Arquitecto','Ingeniero','Contador','Admin'];
const ROLES_NO_EMPRESA = ['Cliente'];
const FORM_CREAR_INIT = {
  nombre: '', email: '', telefono: '', rol: 'Cliente',
  empresaId: '', crearEmpresa: false,
  nombreEmpresa: '', cedulaJuridica: '', descripcion: '',
};

function TabUsuarios() {
  const { usuario: me } = useAuth();
  const [data, setData]             = useState([]);
  const [empresas, setEmpresas]     = useState([]);
  const [loading, setLoading]       = useState(false);
  const [buscar, setBuscar]         = useState('');
  const [rolFilt, setRolFilt]       = useState('');
  const [activoFilt, setActFilt]    = useState('');
  const [empresaFilt, setEmpFilt]   = useState('');
  // quick-action dialog (bloquear/activar/password)
  const [dialog, setDialog]         = useState(null);
  const [pwdVal, setPwdVal]         = useState('');
  const [motivoVal, setMotivoVal]   = useState('');
  // edit dialog
  const [editOpen, setEditOpen]     = useState(false);
  const [editUser, setEditUser]     = useState(null);
  const [editForm, setEditForm]     = useState({ nombre: '', telefono: '', rol: '', activo: true, empresaId: '' });
  const [editLoading, setEditLoading] = useState(false);
  // crear dialog
  const [crearOpen, setCrearOpen]   = useState(false);
  const [crearForm, setCrearForm]   = useState(FORM_CREAR_INIT);
  const [crearLoading, setCrearLoading] = useState(false);
  // eliminar dialog
  const [eliminarUser, setEliminarUser] = useState(null);
  const [eliminarLoading, setEliminarLoading] = useState(false);
  const [feedback, setFeedback]     = useState(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (rolFilt)           params.rol      = rolFilt;
      if (buscar)            params.buscar   = buscar;
      if (activoFilt !== '') params.activo   = activoFilt === 'true';
      if (empresaFilt)       params.empresaId = empresaFilt;
      const [usRes, empRes] = await Promise.all([
        adminApi.getUsuarios(params),
        empresas.length ? Promise.resolve({ data: [] }) : adminApi.getEmpresas(),
      ]);
      setData(usRes.data.data ?? usRes.data);
      if (!empresas.length && empRes.data.length) setEmpresas(empRes.data);
    } finally { setLoading(false); }
  }, [buscar, rolFilt, activoFilt, empresaFilt, empresas.length]);

  useEffect(() => { cargar(); }, [cargar]);

  const showFeedback = (msg, severity = 'success') => {
    setFeedback({ msg, severity });
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleAction = async () => {
    const { tipo, usuario } = dialog;
    try {
      if (tipo === 'bloquear') {
        await adminApi.bloquearUsuario(usuario.id, motivoVal || undefined);
        showFeedback(`${usuario.nombre} bloqueado.`);
      } else if (tipo === 'activar') {
        await adminApi.activarUsuario(usuario.id);
        showFeedback(`${usuario.nombre} activado.`);
      } else if (tipo === 'password') {
        if (!pwdVal || pwdVal.length < 6) { showFeedback('Mínimo 6 caracteres.', 'error'); return; }
        await adminApi.resetPassword(usuario.id, pwdVal);
        showFeedback('Contraseña restablecida.');
      }
      setDialog(null);
      cargar();
    } catch (e) {
      showFeedback(e.response?.data?.message || 'Error.', 'error');
    }
  };

  const abrirEditar = (u) => {
    setEditUser(u);
    setEditForm({ nombre: u.nombre, telefono: u.telefono || '', rol: u.rol, activo: u.activo, empresaId: u.empresaId || '' });
    setEditOpen(true);
  };

  const handleEditar = async () => {
    setEditLoading(true);
    try {
      await adminApi.editarUsuario(editUser.id, {
        nombre: editForm.nombre,
        telefono: editForm.telefono || null,
        rol: editForm.rol,
        activo: editForm.activo,
        empresaId: editForm.empresaId ? Number(editForm.empresaId) : null,
      });
      showFeedback(`${editForm.nombre} actualizado.`);
      setEditOpen(false);
      cargar();
    } catch (e) {
      showFeedback(e.response?.data?.message || 'Error al editar.', 'error');
    } finally { setEditLoading(false); }
  };

  const handleCrear = async () => {
    if (!crearForm.nombre || !crearForm.email) { showFeedback('Nombre y email son obligatorios.', 'error'); return; }
    setCrearLoading(true);
    try {
      await adminApi.crearUsuario({
        nombre: crearForm.nombre,
        email: crearForm.email,
        telefono: crearForm.telefono || null,
        rol: crearForm.rol,
        empresaId: (!ROLES_NO_EMPRESA.includes(crearForm.rol) && crearForm.empresaId && !crearForm.crearEmpresa)
          ? Number(crearForm.empresaId) : null,
        nombreEmpresa: crearForm.crearEmpresa ? crearForm.nombreEmpresa : null,
        cedulaJuridica: crearForm.crearEmpresa ? crearForm.cedulaJuridica : null,
        descripcion: crearForm.crearEmpresa ? crearForm.descripcion : null,
      });
      showFeedback(`Usuario ${crearForm.nombre} creado. Se envió email con contraseña temporal.`);
      setCrearOpen(false);
      setCrearForm(FORM_CREAR_INIT);
      setEmpresas([]); // force reload of empresas list
      cargar();
    } catch (e) {
      showFeedback(e.response?.data?.message || 'Error al crear usuario.', 'error');
    } finally { setCrearLoading(false); }
  };

  const handleEliminar = async () => {
    setEliminarLoading(true);
    try {
      await adminApi.eliminarUsuario(eliminarUser.id);
      showFeedback(`${eliminarUser.nombre} eliminado correctamente.`);
      setEliminarUser(null);
      cargar();
    } catch (e) {
      showFeedback(e.response?.data?.message || 'Error al eliminar.', 'error');
    } finally { setEliminarLoading(false); }
  };

  const mostrarEmpresa = !ROLES_NO_EMPRESA.includes(crearForm.rol);

  return (
    <Box>
      {feedback && <Alert severity={feedback.severity} sx={{ mb: 2 }}>{feedback.msg}</Alert>}

      <Stack direction="row" spacing={1.5} mb={2} flexWrap="wrap" alignItems="center">
        <TextField size="small" placeholder="Buscar nombre o email…"
          value={buscar} onChange={e => setBuscar(e.target.value)}
          InputProps={{ startAdornment: <SearchIcon sx={{ mr: .5, fontSize: 18, color: 'text.secondary' }} /> }}
          sx={{ width: 230 }}
        />
        <FormControl size="small" sx={{ minWidth: 130 }}>
          <InputLabel>Rol</InputLabel>
          <Select value={rolFilt} label="Rol" onChange={e => setRolFilt(e.target.value)}>
            <MenuItem value="">Todos</MenuItem>
            {ROLES.map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Estado</InputLabel>
          <Select value={activoFilt} label="Estado" onChange={e => setActFilt(e.target.value)}>
            <MenuItem value="">Todos</MenuItem>
            <MenuItem value="true">Activos</MenuItem>
            <MenuItem value="false">Bloqueados</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Empresa</InputLabel>
          <Select value={empresaFilt} label="Empresa" onChange={e => setEmpFilt(e.target.value)}>
            <MenuItem value="">Todas</MenuItem>
            {empresas.map(e => <MenuItem key={e.id} value={e.id}>{e.nombreEmpresa}</MenuItem>)}
          </Select>
        </FormControl>
        <IconButton onClick={cargar} size="small"><RefreshIcon /></IconButton>
        <Box sx={{ flex: 1 }} />
        <Button variant="contained" startIcon={<PersonAddIcon />}
          onClick={() => setCrearOpen(true)}
          sx={{ bgcolor: ACCENT, textTransform: 'none', fontWeight: 700, whiteSpace: 'nowrap' }}>
          Crear usuario
        </Button>
      </Stack>

      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
        <Table size="small">
          <TableHead sx={{ bgcolor: '#f8fafc' }}>
            <TableRow>
              <TableCell>Usuario</TableCell>
              <TableCell>Rol</TableCell>
              <TableCell>Empresa</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Registro</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4 }}><CircularProgress size={28} /></TableCell></TableRow>
            ) : data.length === 0 ? (
              <TableRow><TableCell colSpan={6} align="center" sx={{ py: 3, color: 'text.secondary' }}>Sin resultados.</TableCell></TableRow>
            ) : data.map(u => (
              <TableRow key={u.id} hover>
                <TableCell>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Avatar sx={{ width: 32, height: 32, bgcolor: ACCENT, fontSize: 13 }}>{u.nombre?.[0]}</Avatar>
                    <Box>
                      <Typography variant="body2" fontWeight={600}>{u.nombre}</Typography>
                      <Typography variant="caption" color="text.secondary">{u.email}</Typography>
                    </Box>
                  </Stack>
                </TableCell>
                <TableCell>
                  <Chip label={u.rol} size="small"
                    color={u.rol === 'Admin' ? 'error' : u.rol === 'Constructor' ? 'primary' : 'default'}
                    sx={{ fontWeight: 600 }}
                  />
                </TableCell>
                <TableCell>
                  {u.nombreEmpresa ? (
                    <Stack direction="row" spacing={.5} alignItems="center">
                      <Typography variant="caption" fontWeight={600}>{u.nombreEmpresa}</Typography>
                      {u.esDueno && <Chip label="Dueño" size="small" sx={{ height: 16, fontSize: 10, bgcolor: '#EFF6FF', color: ACCENT }} />}
                    </Stack>
                  ) : (
                    <Typography variant="caption" color="text.disabled">—</Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Chip label={u.activo ? 'Activo' : 'Bloqueado'} size="small"
                    color={u.activo ? 'success' : 'error'} />
                </TableCell>
                <TableCell><Typography variant="caption">{fmtDate(u.createdAt)}</Typography></TableCell>
                <TableCell align="right">
                  <Stack direction="row" spacing={.5} justifyContent="flex-end">
                    <Tooltip title="Editar">
                      <IconButton size="small" onClick={() => abrirEditar(u)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Restablecer contraseña">
                      <IconButton size="small" onClick={() => { setPwdVal(''); setDialog({ tipo: 'password', usuario: u }); }}>
                        <LockResetIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    {u.activo ? (
                      <Tooltip title="Bloquear">
                        <IconButton size="small" color="error" onClick={() => { setMotivoVal(''); setDialog({ tipo: 'bloquear', usuario: u }); }}>
                          <BlockIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    ) : (
                      <Tooltip title="Activar">
                        <IconButton size="small" color="success" onClick={() => setDialog({ tipo: 'activar', usuario: u })}>
                          <CheckCircleIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    {u.id !== me?.id && (
                      <Tooltip title="Eliminar usuario">
                        <IconButton size="small" color="error"
                          onClick={() => setEliminarUser(u)}
                          sx={{ opacity: 0.6, '&:hover': { opacity: 1 } }}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* ── Quick-action dialog ──────────────────────────────────────── */}
      <Dialog open={!!dialog} onClose={() => setDialog(null)} maxWidth="xs" fullWidth>
        <DialogTitle>
          {dialog?.tipo === 'bloquear'  && 'Bloquear usuario'}
          {dialog?.tipo === 'activar'   && 'Activar usuario'}
          {dialog?.tipo === 'password'  && 'Restablecer contraseña'}
        </DialogTitle>
        <DialogContent sx={{ pt: '12px !important' }}>
          <Typography mb={2} color="text.secondary">{dialog?.usuario?.nombre} — {dialog?.usuario?.email}</Typography>
          {dialog?.tipo === 'bloquear' && (
            <TextField fullWidth size="small" label="Motivo (opcional)"
              value={motivoVal} onChange={e => setMotivoVal(e.target.value)} />
          )}
          {dialog?.tipo === 'password' && (
            <TextField fullWidth size="small" label="Nueva contraseña" type="password"
              value={pwdVal} onChange={e => setPwdVal(e.target.value)}
              helperText="Mínimo 6 caracteres" />
          )}
          {dialog?.tipo === 'activar' && <Alert severity="info">¿Confirmar activación de la cuenta?</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog(null)}>Cancelar</Button>
          <Button variant="contained" onClick={handleAction}
            color={dialog?.tipo === 'bloquear' ? 'error' : 'primary'}>
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Editar usuario ───────────────────────────────────────────── */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Editar usuario — {editUser?.nombre}</DialogTitle>
        <DialogContent sx={{ pt: '12px !important' }}>
          <Stack spacing={2} mt={.5}>
            <TextField label="Nombre" size="small" fullWidth
              value={editForm.nombre} onChange={e => setEditForm(f => ({ ...f, nombre: e.target.value }))} />
            <TextField label="Teléfono" size="small" fullWidth
              value={editForm.telefono} onChange={e => setEditForm(f => ({ ...f, telefono: e.target.value }))} />
            <FormControl fullWidth size="small">
              <InputLabel>Rol</InputLabel>
              <Select value={editForm.rol} label="Rol" onChange={e => setEditForm(f => ({ ...f, rol: e.target.value }))}>
                {ROLES.map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}
              </Select>
            </FormControl>
            {!ROLES_NO_EMPRESA.includes(editForm.rol) && (
              <FormControl fullWidth size="small">
                <InputLabel>Empresa</InputLabel>
                <Select value={editForm.empresaId} label="Empresa"
                  onChange={e => setEditForm(f => ({ ...f, empresaId: e.target.value }))}>
                  <MenuItem value="">Sin empresa</MenuItem>
                  {empresas.map(e => <MenuItem key={e.id} value={e.id}>{e.nombreEmpresa}</MenuItem>)}
                </Select>
              </FormControl>
            )}
            <FormControlLabel
              control={<Switch checked={editForm.activo} onChange={e => setEditForm(f => ({ ...f, activo: e.target.checked }))} />}
              label={editForm.activo ? 'Cuenta activa' : 'Cuenta bloqueada'}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleEditar} disabled={editLoading}>
            {editLoading ? <CircularProgress size={18} /> : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Eliminar usuario ─────────────────────────────────────────── */}
      <Dialog open={!!eliminarUser} onClose={() => setEliminarUser(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ color: 'error.main', display: 'flex', alignItems: 'center', gap: 1 }}>
          <DeleteIcon fontSize="small" /> Eliminar usuario
        </DialogTitle>
        <DialogContent sx={{ pt: '12px !important' }}>
          <Alert severity="warning" sx={{ mb: 2 }}>Esta acción no se puede deshacer.</Alert>
          <Typography fontSize={14}>
            ¿Estás seguro de eliminar a <strong>{eliminarUser?.nombre}</strong> ({eliminarUser?.email})?
          </Typography>
          {eliminarUser?.nombreEmpresa && (
            <Typography fontSize={13} color="text.secondary" mt={1}>
              Se desvinculará de la empresa <strong>{eliminarUser.nombreEmpresa}</strong>.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEliminarUser(null)} disabled={eliminarLoading}>Cancelar</Button>
          <Button variant="contained" color="error" onClick={handleEliminar} disabled={eliminarLoading}
            startIcon={eliminarLoading ? <CircularProgress size={16} color="inherit" /> : <DeleteIcon />}>
            {eliminarLoading ? 'Eliminando…' : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Crear usuario ────────────────────────────────────────────── */}
      <Dialog open={crearOpen} onClose={() => { setCrearOpen(false); setCrearForm(FORM_CREAR_INIT); }} maxWidth="sm" fullWidth>
        <DialogTitle>Crear usuario</DialogTitle>
        <DialogContent sx={{ pt: '12px !important' }}>
          <Stack spacing={2} mt={.5}>
            <Stack direction="row" spacing={2}>
              <TextField label="Nombre completo" size="small" fullWidth required
                value={crearForm.nombre} onChange={e => setCrearForm(f => ({ ...f, nombre: e.target.value }))} />
              <TextField label="Email" size="small" fullWidth required type="email"
                value={crearForm.email} onChange={e => setCrearForm(f => ({ ...f, email: e.target.value }))} />
            </Stack>
            <Stack direction="row" spacing={2}>
              <TextField label="Teléfono" size="small" fullWidth
                value={crearForm.telefono} onChange={e => setCrearForm(f => ({ ...f, telefono: e.target.value }))} />
              <FormControl fullWidth size="small">
                <InputLabel>Rol</InputLabel>
                <Select value={crearForm.rol} label="Rol"
                  onChange={e => setCrearForm(f => ({ ...f, rol: e.target.value, empresaId: '', crearEmpresa: false }))}>
                  {ROLES.map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}
                </Select>
              </FormControl>
            </Stack>

            {mostrarEmpresa && (
              <>
                <Divider textAlign="left"><Typography fontSize={12} color="text.secondary">Empresa</Typography></Divider>
                <FormControlLabel
                  control={<Switch checked={crearForm.crearEmpresa}
                    onChange={e => setCrearForm(f => ({ ...f, crearEmpresa: e.target.checked, empresaId: '' }))} />}
                  label="Crear nueva empresa"
                />
                {!crearForm.crearEmpresa ? (
                  <FormControl fullWidth size="small">
                    <InputLabel>Empresa existente (opcional)</InputLabel>
                    <Select value={crearForm.empresaId} label="Empresa existente (opcional)"
                      onChange={e => setCrearForm(f => ({ ...f, empresaId: e.target.value }))}>
                      <MenuItem value="">Sin empresa</MenuItem>
                      {empresas.map(e => <MenuItem key={e.id} value={e.id}>{e.nombreEmpresa}</MenuItem>)}
                    </Select>
                  </FormControl>
                ) : (
                  <Stack spacing={2}>
                    <TextField label="Nombre de empresa" size="small" fullWidth required
                      value={crearForm.nombreEmpresa} onChange={e => setCrearForm(f => ({ ...f, nombreEmpresa: e.target.value }))} />
                    <Stack direction="row" spacing={2}>
                      <TextField label="Cédula jurídica" size="small" fullWidth
                        value={crearForm.cedulaJuridica} onChange={e => setCrearForm(f => ({ ...f, cedulaJuridica: e.target.value }))} />
                    </Stack>
                    <TextField label="Descripción (opcional)" size="small" fullWidth multiline rows={2}
                      value={crearForm.descripcion} onChange={e => setCrearForm(f => ({ ...f, descripcion: e.target.value }))} />
                  </Stack>
                )}
              </>
            )}

            <Alert severity="info" sx={{ fontSize: 12.5 }}>
              Se generará una contraseña temporal y se enviará al email del usuario.
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setCrearOpen(false); setCrearForm(FORM_CREAR_INIT); }}>Cancelar</Button>
          <Button variant="contained" onClick={handleCrear} disabled={crearLoading}
            sx={{ bgcolor: ACCENT, textTransform: 'none', fontWeight: 700 }}>
            {crearLoading ? <CircularProgress size={18} /> : 'Crear usuario'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// ════════════════════════════════════════════════════════
//  TAB 2 — Roles y permisos
// ════════════════════════════════════════════════════════
const ROLES_EDITABLES = ['Cliente','Constructor','Proveedor','Supervisor','MaestroObra','Arquitecto','Ingeniero'];

const MODULO_META = {
  proyectos:   { label: 'Proyectos',   icon: <FolderOpenIcon fontSize="small" />,         color: '#2563EB' },
  presupuesto: { label: 'Presupuesto', icon: <CalculateIcon fontSize="small" />,          color: '#0891b2' },
  documentos:  { label: 'Documentos',  icon: <ArticleIcon fontSize="small" />,            color: '#6b7280' },
  chat:        { label: 'Chat',        icon: <ChatIcon fontSize="small" />,               color: '#16a34a' },
  avances:     { label: 'Avances',     icon: <TrendingUpIcon fontSize="small" />,         color: '#d97706' },
  ordenes:     { label: 'Órdenes',     icon: <AssignmentTurnedInIcon fontSize="small" />, color: '#9333ea' },
  equipo:      { label: 'Equipo',      icon: <GroupsIcon fontSize="small" />,             color: '#0891b2' },
  facturacion: { label: 'Facturación', icon: <ReceiptIcon fontSize="small" />,            color: '#dc2626' },
  ia:          { label: 'IA',          icon: <AutoAwesomeIcon fontSize="small" />,        color: '#7c3aed' },
  campo:       { label: 'Campo',       icon: <LocationOnIcon fontSize="small" />,         color: '#16a34a' },
  marketplace: { label: 'Marketplace', icon: <StorefrontIcon fontSize="small" />,         color: '#d97706' },
  admin:       { label: 'Admin',       icon: <GppMaybeIcon fontSize="small" />,           color: '#dc2626' },
};

function TabRoles() {
  const [matriz,   setMatriz]   = useState(null);
  const [catalogo, setCatalogo] = useState([]);
  const [rolSel,   setRolSel]   = useState('Constructor');
  const [modSel,   setModSel]   = useState('');
  const [permisosSel, setPermisos] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [feedback, setFeedback] = useState(null);

  const cargar = async () => {
    setLoading(true);
    try {
      const [mRes, cRes] = await Promise.all([
        permisosApi.getMatriz(),
        permisosApi.getCatalogo(),
      ]);
      setMatriz(mRes.data.matriz);
      setCatalogo(cRes.data);
      setPermisos(mRes.data.matriz['Constructor'] ?? []);
    } finally { setLoading(false); }
  };
  useEffect(() => { cargar(); }, []);

  // Permisos del módulo seleccionado
  const grupoActual   = catalogo.find(g => g.modulo === modSel) ?? null;
  const permisosGrupo = grupoActual?.permisos ?? [];
  const codigosGrupo  = permisosGrupo.map(p => p.codigo);

  // Subset activos solo del módulo visible
  const activosEnMod  = codigosGrupo.filter(c => permisosSel.includes(c));
  const todosActivos  = activosEnMod.length === codigosGrupo.length && codigosGrupo.length > 0;
  const algunoActivo  = activosEnMod.length > 0 && !todosActivos;

  const onRolChange = (r) => {
    setRolSel(r);
    setPermisos(matriz?.[r] ?? []);
    setModSel('');
  };

  const togglePermiso = (codigo) => {
    setPermisos(prev =>
      prev.includes(codigo) ? prev.filter(c => c !== codigo) : [...prev, codigo]
    );
  };

  const toggleTodos = () => {
    if (todosActivos) {
      setPermisos(prev => prev.filter(c => !codigosGrupo.includes(c)));
    } else {
      setPermisos(prev => [...new Set([...prev, ...codigosGrupo])]);
    }
  };

  const guardar = async () => {
    setSaving(true);
    try {
      await permisosApi.actualizarRol(rolSel, permisosSel);
      setFeedback({ msg: 'Permisos guardados.', severity: 'success' });
      setMatriz(prev => ({ ...prev, [rolSel]: permisosSel }));
    } catch { setFeedback({ msg: 'Error al guardar.', severity: 'error' }); }
    finally  { setSaving(false); setTimeout(() => setFeedback(null), 3000); }
  };

  const restaurar = async () => {
    setSaving(true);
    try {
      const { data } = await permisosApi.restaurarRol(rolSel);
      const nuevos = data.permisos ?? [];
      setPermisos(nuevos);
      setMatriz(prev => ({ ...prev, [rolSel]: nuevos }));
      setFeedback({ msg: 'Permisos restaurados a valores por defecto.', severity: 'info' });
    } catch { setFeedback({ msg: 'Error al restaurar.', severity: 'error' }); }
    finally  { setSaving(false); setTimeout(() => setFeedback(null), 3000); }
  };

  const meta = MODULO_META[modSel] ?? null;

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}><CircularProgress /></Box>;

  return (
    <Box sx={{ maxWidth: 620 }}>
      {feedback && <Alert severity={feedback.severity} sx={{ mb: 2.5 }}>{feedback.msg}</Alert>}

      {/* ── Dos comboboxes ── */}
      <Grid container spacing={2} mb={3}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Rol</InputLabel>
            <Select value={rolSel} label="Rol" onChange={e => onRolChange(e.target.value)}>
              {ROLES_EDITABLES.map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}
            </Select>
          </FormControl>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Módulo</InputLabel>
            <Select
              value={modSel} label="Módulo"
              onChange={e => setModSel(e.target.value)}
              renderValue={v => {
                const m = MODULO_META[v];
                return m ? (
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Box sx={{ color: m.color, display: 'flex' }}>{m.icon}</Box>
                    <span>{m.label}</span>
                  </Stack>
                ) : v;
              }}
            >
              <MenuItem value=""><em>— Seleccioná un módulo —</em></MenuItem>
              {catalogo.map(g => {
                const m = MODULO_META[g.modulo] ?? { label: g.modulo, icon: <SettingsIcon fontSize="small" />, color: '#64748B' };
                const activos = g.permisos.filter(p => permisosSel.includes(p.codigo)).length;
                return (
                  <MenuItem key={g.modulo} value={g.modulo}>
                    <Stack direction="row" alignItems="center" spacing={1.5} sx={{ width: '100%' }}>
                      <Box sx={{ color: m.color, display: 'flex' }}>{m.icon}</Box>
                      <Typography fontSize={13.5} sx={{ flex: 1 }}>{m.label}</Typography>
                      <Chip label={`${activos}/${g.permisos.length}`} size="small"
                        sx={{
                          height: 20, fontSize: 10.5, fontWeight: 700,
                          bgcolor: activos === 0 ? '#F1F5F9' : activos === g.permisos.length ? '#DCFCE7' : '#FEF3C7',
                          color:   activos === 0 ? '#94A3B8'  : activos === g.permisos.length ? '#166534'  : '#92400E',
                        }}
                      />
                    </Stack>
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {/* ── Panel de permisos ── */}
      {!modSel ? (
        <Box sx={{ py: 5, textAlign: 'center', color: 'text.disabled', border: '1px dashed #E2E8F0', borderRadius: 2 }}>
          <Typography fontSize={13.5}>Seleccioná un rol y un módulo para ver los permisos</Typography>
        </Box>
      ) : (
        <Card variant="outlined" sx={{ borderRadius: 2 }}>
          {/* Header del módulo */}
          <Box sx={{ px: 2.5, py: 1.5, borderBottom: '1px solid #F1F5F9',
            display: 'flex', alignItems: 'center', gap: 1.5, bgcolor: '#F8FAFC' }}>
            <Box sx={{ color: meta?.color ?? '#64748B', display: 'flex' }}>{meta?.icon}</Box>
            <Typography fontWeight={700} fontSize={14} sx={{ flex: 1 }}>
              {meta?.label ?? modSel} — <span style={{ color: '#64748B', fontWeight: 500 }}>{rolSel}</span>
            </Typography>
            <Chip
              label={`${activosEnMod.length}/${codigosGrupo.length} activos`}
              size="small"
              sx={{
                height: 22, fontSize: 11, fontWeight: 700,
                bgcolor: activosEnMod.length === 0 ? '#F1F5F9' : activosEnMod.length === codigosGrupo.length ? '#DCFCE7' : '#FEF3C7',
                color:   activosEnMod.length === 0 ? '#94A3B8'  : activosEnMod.length === codigosGrupo.length ? '#166534'  : '#92400E',
              }}
            />
          </Box>

          <CardContent sx={{ py: 1.5, px: 2.5 }}>
            {/* Seleccionar todos */}
            <FormControlLabel
              sx={{ mb: 1, ml: 0 }}
              control={
                <Checkbox
                  size="small"
                  checked={todosActivos}
                  indeterminate={algunoActivo}
                  onChange={toggleTodos}
                  sx={{ '&.Mui-checked, &.MuiCheckbox-indeterminate': { color: meta?.color ?? ACCENT } }}
                />
              }
              label={
                <Typography fontSize={13} fontWeight={700} color="text.secondary">
                  Seleccionar todos
                </Typography>
              }
            />

            <Divider sx={{ mb: 1.5 }} />

            {/* Lista de permisos */}
            <Stack spacing={0.25}>
              {permisosGrupo.map(p => (
                <FormControlLabel
                  key={p.codigo}
                  sx={{ ml: 0 }}
                  control={
                    <Checkbox
                      size="small"
                      checked={permisosSel.includes(p.codigo)}
                      onChange={() => togglePermiso(p.codigo)}
                      sx={{ '&.Mui-checked': { color: meta?.color ?? ACCENT } }}
                    />
                  }
                  label={<Typography fontSize={13.5}>{p.nombre}</Typography>}
                />
              ))}
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* ── Botones ── */}
      <Stack direction="row" spacing={1.5} mt={2.5}>
        <Button variant="contained" onClick={guardar} disabled={saving || !modSel}
          startIcon={<SaveIcon />}
          sx={{ bgcolor: ACCENT, '&:hover': { bgcolor: '#1D4ED8' }, textTransform: 'none', fontWeight: 700 }}>
          {saving ? 'Guardando…' : 'Guardar permisos'}
        </Button>
        <Button variant="outlined" onClick={restaurar} disabled={saving}
          startIcon={<RefreshIcon />} color="warning" sx={{ textTransform: 'none', fontWeight: 700 }}>
          Restaurar defaults
        </Button>
      </Stack>
    </Box>
  );
}

// ════════════════════════════════════════════════════════
//  TAB 3 — Empresas (gestión + verificación)
// ════════════════════════════════════════════════════════
const FORM_EMPRESA_INIT = { nombreEmpresa: '', cedulaJuridica: '', descripcion: '', usuarioDuenoId: '' };
const FORM_MIEMBRO_INIT = { tipo: 'existente', usuarioId: '', nombre: '', email: '', telefono: '', rolWorkspace: 'Supervisor' };
const ROLES_WS = ['Administrador','Supervisor','MaestroObra','Arquitecto','Ingeniero','Contador'];

function TabEmpresas() {
  const [subTab, setSubTab]         = useState(0); // 0=gestión, 1=verificación
  // ── Gestión ──────────────────────────────────────────
  const [empresas, setEmpresas]     = useState([]);
  const [todosUsuarios, setTodosUs] = useState([]);
  const [loading, setLoading]       = useState(false);
  const [buscar, setBuscar]         = useState('');
  const [empSel, setEmpSel]         = useState(null); // empresa con miembros abierta
  const [miembros, setMiembros]     = useState([]);
  const [loadMiembros, setLoadMiembros] = useState(false);
  const [crearEmpOpen, setCrearEmpOpen] = useState(false);
  const [crearEmpForm, setCrearEmpForm] = useState(FORM_EMPRESA_INIT);
  const [crearEmpLoading, setCrearEmpLoading] = useState(false);
  const [miembroOpen, setMiembroOpen] = useState(false);
  const [miembroForm, setMiembroForm] = useState(FORM_MIEMBRO_INIT);
  const [miembroLoading, setMiembroLoading] = useState(false);
  // ── Verificación ─────────────────────────────────────
  const [tipoVerif, setTipoVerif]   = useState(0);
  const [dataVerif, setDataVerif]   = useState([]);
  const [loadingV, setLoadingV]     = useState(false);
  const [filtVerif, setFiltVerif]   = useState('false');
  const [feedback, setFeedback]     = useState(null);

  const showFeedback = (msg, severity = 'success') => {
    setFeedback({ msg, severity });
    setTimeout(() => setFeedback(null), 3500);
  };

  // Cargar empresas (gestión)
  const cargarEmpresas = useCallback(async () => {
    setLoading(true);
    try {
      const params = buscar ? { buscar } : {};
      const [empRes, usRes] = await Promise.all([
        adminApi.getEmpresas(params),
        todosUsuarios.length ? Promise.resolve({ data: [] }) : adminApi.getUsuarios({ limit: 200 }),
      ]);
      setEmpresas(empRes.data);
      if (!todosUsuarios.length && (usRes.data.data ?? usRes.data).length)
        setTodosUs(usRes.data.data ?? usRes.data);
    } finally { setLoading(false); }
  }, [buscar, todosUsuarios.length]);

  // Cargar verificación
  const cargarVerif = useCallback(async () => {
    setLoadingV(true);
    const params = filtVerif !== '' ? { verificado: filtVerif === 'true' } : {};
    try {
      const fn = tipoVerif === 0 ? adminApi.getConstructores : adminApi.getProveedores;
      const { data: res } = await fn(params);
      setDataVerif(res);
    } finally { setLoadingV(false); }
  }, [tipoVerif, filtVerif]);

  useEffect(() => { if (subTab === 0) cargarEmpresas(); }, [cargarEmpresas, subTab]);
  useEffect(() => { if (subTab === 1) cargarVerif(); }, [cargarVerif, subTab]);

  const abrirMiembros = async (emp) => {
    setEmpSel(emp);
    setLoadMiembros(true);
    try {
      const { data: res } = await adminApi.getEmpresaMiembros(emp.id);
      setMiembros(res.miembros ?? []);
    } finally { setLoadMiembros(false); }
  };

  const handleQuitarMiembro = async (userId) => {
    try {
      await adminApi.quitarMiembroEmpresa(empSel.id, userId);
      showFeedback('Miembro removido.');
      abrirMiembros(empSel);
      cargarEmpresas();
    } catch (e) { showFeedback(e.response?.data?.message || 'Error.', 'error'); }
  };

  const handleCrearEmpresa = async () => {
    if (!crearEmpForm.nombreEmpresa || !crearEmpForm.usuarioDuenoId) {
      showFeedback('Nombre y dueño son obligatorios.', 'error'); return;
    }
    setCrearEmpLoading(true);
    try {
      await adminApi.crearEmpresa({
        nombreEmpresa:  crearEmpForm.nombreEmpresa,
        cedulaJuridica: crearEmpForm.cedulaJuridica || null,
        descripcion:    crearEmpForm.descripcion || null,
        usuarioDuenoId: Number(crearEmpForm.usuarioDuenoId),
      });
      showFeedback('Empresa creada.');
      setCrearEmpOpen(false);
      setCrearEmpForm(FORM_EMPRESA_INIT);
      cargarEmpresas();
    } catch (e) { showFeedback(e.response?.data?.message || 'Error.', 'error'); }
    finally { setCrearEmpLoading(false); }
  };

  const handleAgregarMiembro = async () => {
    setMiembroLoading(true);
    try {
      if (miembroForm.tipo === 'existente') {
        await adminApi.agregarMiembroEmpresa(empSel.id, {
          usuarioId: Number(miembroForm.usuarioId),
          rolWorkspace: miembroForm.rolWorkspace,
        });
      } else {
        await adminApi.agregarMiembroEmpresa(empSel.id, {
          nombre: miembroForm.nombre,
          email: miembroForm.email,
          telefono: miembroForm.telefono || null,
          rolWorkspace: miembroForm.rolWorkspace,
        });
      }
      showFeedback('Miembro agregado.');
      setMiembroOpen(false);
      setMiembroForm(FORM_MIEMBRO_INIT);
      abrirMiembros(empSel);
      cargarEmpresas();
    } catch (e) { showFeedback(e.response?.data?.message || 'Error.', 'error'); }
    finally { setMiembroLoading(false); }
  };

  const handleVerificar = async (id, nombreActual) => {
    try {
      const fn = tipoVerif === 0 ? adminApi.verificarConstructor : adminApi.verificarProveedor;
      const { data: res } = await fn(id);
      showFeedback(res.verificado ? `${nombreActual} verificada.` : 'Verificación revocada.');
      cargarVerif();
    } catch { showFeedback('Error.', 'error'); }
  };

  return (
    <Box>
      {feedback && <Alert severity={feedback.severity} sx={{ mb: 2 }}>{feedback.msg}</Alert>}

      <Tabs value={subTab} onChange={(_, v) => setSubTab(v)} sx={{ mb: 3, borderBottom: '1px solid #E2E8F0' }}>
        <Tab label="Gestión de empresas" icon={<AddBusinessIcon fontSize="small" />} iconPosition="start"
          sx={{ textTransform: 'none', fontWeight: 600 }} />
        <Tab label="Verificación" icon={<VerifiedIcon fontSize="small" />} iconPosition="start"
          sx={{ textTransform: 'none', fontWeight: 600 }} />
      </Tabs>

      {/* ── SUB-TAB 0: Gestión ──────────────────────────────────────── */}
      {subTab === 0 && (
        <>
          <Stack direction="row" spacing={1.5} mb={2} alignItems="center">
            <TextField size="small" placeholder="Buscar empresa…"
              value={buscar} onChange={e => setBuscar(e.target.value)}
              InputProps={{ startAdornment: <SearchIcon sx={{ mr: .5, fontSize: 18, color: 'text.secondary' }} /> }}
              sx={{ width: 220 }}
            />
            <IconButton onClick={cargarEmpresas} size="small"><RefreshIcon /></IconButton>
            <Box sx={{ flex: 1 }} />
            <Button variant="contained" startIcon={<AddBusinessIcon />}
              onClick={() => setCrearEmpOpen(true)}
              sx={{ bgcolor: ACCENT, textTransform: 'none', fontWeight: 700, whiteSpace: 'nowrap' }}>
              Crear empresa
            </Button>
          </Stack>

          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  <TableCell>Empresa</TableCell>
                  <TableCell>Cédula</TableCell>
                  <TableCell>Dueño</TableCell>
                  <TableCell>Miembros</TableCell>
                  <TableCell>Verificación</TableCell>
                  <TableCell align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4 }}><CircularProgress size={28} /></TableCell></TableRow>
                ) : empresas.length === 0 ? (
                  <TableRow><TableCell colSpan={6} align="center" sx={{ py: 3, color: 'text.secondary' }}>Sin empresas.</TableCell></TableRow>
                ) : empresas.map(e => (
                  <TableRow key={e.id} hover>
                    <TableCell>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Avatar sx={{ width: 32, height: 32, bgcolor: '#E2E8F0', color: '#475569', fontSize: 13 }}>
                          {e.nombreEmpresa?.[0]}
                        </Avatar>
                        <Typography variant="body2" fontWeight={600}>{e.nombreEmpresa}</Typography>
                      </Stack>
                    </TableCell>
                    <TableCell><Typography variant="caption">{e.cedulaJuridica || '—'}</Typography></TableCell>
                    <TableCell>
                      <Typography variant="caption" fontWeight={600}>{e.dueno?.nombre}</Typography>
                      <br /><Typography variant="caption" color="text.secondary">{e.dueno?.email}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={`${e.cantidadMiembros} miembro${e.cantidadMiembros !== 1 ? 's' : ''}`}
                        size="small" icon={<GroupsIcon sx={{ fontSize: '14px !important' }} />}
                        sx={{ fontWeight: 600 }} />
                    </TableCell>
                    <TableCell>
                      <Chip label={e.verificado ? 'Verificada' : 'Pendiente'} size="small"
                        color={e.verificado ? 'success' : 'warning'} />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Ver miembros">
                        <IconButton size="small" onClick={() => abrirMiembros(e)}>
                          <GroupsIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* ── Panel miembros ── */}
          <Dialog open={!!empSel} onClose={() => setEmpSel(null)} maxWidth="md" fullWidth>
            <DialogTitle>
              <Stack direction="row" alignItems="center" spacing={1}>
                <GroupsIcon />
                <span>Miembros — {empSel?.nombreEmpresa}</span>
                <Box sx={{ flex: 1 }} />
                <Button startIcon={<GroupAddIcon />} size="small" variant="contained"
                  onClick={() => setMiembroOpen(true)}
                  sx={{ bgcolor: ACCENT, textTransform: 'none', fontWeight: 700 }}>
                  Agregar miembro
                </Button>
              </Stack>
            </DialogTitle>
            <DialogContent sx={{ p: 0 }}>
              {loadMiembros ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: '#f8fafc' }}>
                      <TableRow>
                        <TableCell>Miembro</TableCell>
                        <TableCell>Rol workspace</TableCell>
                        <TableCell>Estado</TableCell>
                        <TableCell>Unión</TableCell>
                        <TableCell align="right">Acción</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {miembros.length === 0 ? (
                        <TableRow><TableCell colSpan={5} align="center" sx={{ py: 3, color: 'text.secondary' }}>Sin miembros adicionales.</TableCell></TableRow>
                      ) : miembros.map(m => (
                        <TableRow key={m.invitacionId} hover>
                          <TableCell>
                            <Stack direction="row" spacing={1.5} alignItems="center">
                              <Avatar sx={{ width: 28, height: 28, bgcolor: ACCENT, fontSize: 12 }}>{m.nombre?.[0]}</Avatar>
                              <Box>
                                <Typography variant="body2" fontWeight={600}>{m.nombre}</Typography>
                                <Typography variant="caption" color="text.secondary">{m.email}</Typography>
                              </Box>
                            </Stack>
                          </TableCell>
                          <TableCell><Chip label={m.rolWorkspace} size="small" /></TableCell>
                          <TableCell>
                            <Chip label={m.activo ? 'Activo' : 'Inactivo'} size="small"
                              color={m.activo ? 'success' : 'default'} />
                          </TableCell>
                          <TableCell><Typography variant="caption">{fmtDate(m.fechaUnion)}</Typography></TableCell>
                          <TableCell align="right">
                            <Tooltip title="Quitar miembro">
                              <IconButton size="small" color="error"
                                onClick={() => handleQuitarMiembro(m.usuarioId)}>
                                <PersonRemoveIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setEmpSel(null)}>Cerrar</Button>
            </DialogActions>
          </Dialog>

          {/* ── Crear empresa ── */}
          <Dialog open={crearEmpOpen} onClose={() => setCrearEmpOpen(false)} maxWidth="sm" fullWidth>
            <DialogTitle>Crear empresa</DialogTitle>
            <DialogContent sx={{ pt: '12px !important' }}>
              <Stack spacing={2} mt={.5}>
                <TextField label="Nombre de empresa" size="small" fullWidth required
                  value={crearEmpForm.nombreEmpresa} onChange={e => setCrearEmpForm(f => ({ ...f, nombreEmpresa: e.target.value }))} />
                <TextField label="Cédula jurídica" size="small" fullWidth
                  value={crearEmpForm.cedulaJuridica} onChange={e => setCrearEmpForm(f => ({ ...f, cedulaJuridica: e.target.value }))} />
                <TextField label="Descripción (opcional)" size="small" fullWidth multiline rows={2}
                  value={crearEmpForm.descripcion} onChange={e => setCrearEmpForm(f => ({ ...f, descripcion: e.target.value }))} />
                <FormControl fullWidth size="small" required>
                  <InputLabel>Dueño de la empresa</InputLabel>
                  <Select value={crearEmpForm.usuarioDuenoId} label="Dueño de la empresa"
                    onChange={e => setCrearEmpForm(f => ({ ...f, usuarioDuenoId: e.target.value }))}>
                    {todosUsuarios.map(u => (
                      <MenuItem key={u.id} value={u.id}>{u.nombre} — {u.email}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setCrearEmpOpen(false)}>Cancelar</Button>
              <Button variant="contained" onClick={handleCrearEmpresa} disabled={crearEmpLoading}
                sx={{ bgcolor: ACCENT, textTransform: 'none', fontWeight: 700 }}>
                {crearEmpLoading ? <CircularProgress size={18} /> : 'Crear empresa'}
              </Button>
            </DialogActions>
          </Dialog>

          {/* ── Agregar miembro ── */}
          <Dialog open={miembroOpen} onClose={() => setMiembroOpen(false)} maxWidth="sm" fullWidth>
            <DialogTitle>Agregar miembro — {empSel?.nombreEmpresa}</DialogTitle>
            <DialogContent sx={{ pt: '12px !important' }}>
              <Stack spacing={2} mt={.5}>
                <FormControlLabel
                  control={<Switch checked={miembroForm.tipo === 'nuevo'}
                    onChange={e => setMiembroForm(f => ({ ...f, tipo: e.target.checked ? 'nuevo' : 'existente', usuarioId: '' }))} />}
                  label="Crear nuevo usuario"
                />
                {miembroForm.tipo === 'existente' ? (
                  <FormControl fullWidth size="small">
                    <InputLabel>Usuario existente</InputLabel>
                    <Select value={miembroForm.usuarioId} label="Usuario existente"
                      onChange={e => setMiembroForm(f => ({ ...f, usuarioId: e.target.value }))}>
                      {todosUsuarios.map(u => (
                        <MenuItem key={u.id} value={u.id}>{u.nombre} — {u.email}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                ) : (
                  <Stack spacing={2}>
                    <TextField label="Nombre completo" size="small" fullWidth
                      value={miembroForm.nombre} onChange={e => setMiembroForm(f => ({ ...f, nombre: e.target.value }))} />
                    <TextField label="Email" size="small" fullWidth type="email"
                      value={miembroForm.email} onChange={e => setMiembroForm(f => ({ ...f, email: e.target.value }))} />
                    <TextField label="Teléfono (opcional)" size="small" fullWidth
                      value={miembroForm.telefono} onChange={e => setMiembroForm(f => ({ ...f, telefono: e.target.value }))} />
                  </Stack>
                )}
                <FormControl fullWidth size="small">
                  <InputLabel>Rol en el equipo</InputLabel>
                  <Select value={miembroForm.rolWorkspace} label="Rol en el equipo"
                    onChange={e => setMiembroForm(f => ({ ...f, rolWorkspace: e.target.value }))}>
                    {ROLES_WS.map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}
                  </Select>
                </FormControl>
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setMiembroOpen(false)}>Cancelar</Button>
              <Button variant="contained" onClick={handleAgregarMiembro} disabled={miembroLoading}
                sx={{ bgcolor: ACCENT, textTransform: 'none', fontWeight: 700 }}>
                {miembroLoading ? <CircularProgress size={18} /> : 'Agregar'}
              </Button>
            </DialogActions>
          </Dialog>
        </>
      )}

      {/* ── SUB-TAB 1: Verificación ─────────────────────────────────── */}
      {subTab === 1 && (
        <>
          <Alert severity="info" sx={{ mb: 2, fontSize: 12.5 }}>
            Verificación de constructoras y proveedores. Los datos de negocio son privados de cada empresa.
          </Alert>

          <Tabs value={tipoVerif} onChange={(_, v) => setTipoVerif(v)} sx={{ mb: 2 }}>
            <Tab label="Constructoras" />
            <Tab label="Proveedores" />
          </Tabs>

          <Stack direction="row" spacing={2} mb={2} alignItems="center">
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Filtrar por estado</InputLabel>
              <Select value={filtVerif} label="Filtrar por estado" onChange={e => setFiltVerif(e.target.value)}>
                <MenuItem value="">Todas</MenuItem>
                <MenuItem value="false">Pendientes de verificación</MenuItem>
                <MenuItem value="true">Ya verificadas</MenuItem>
              </Select>
            </FormControl>
            <IconButton onClick={cargarVerif} size="small"><RefreshIcon /></IconButton>
            <Typography variant="caption" color="text.secondary">{dataVerif.length} empresa{dataVerif.length !== 1 ? 's' : ''}</Typography>
          </Stack>

          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  <TableCell>Empresa</TableCell>
                  <TableCell>Email de contacto</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell align="right">Acción</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loadingV ? (
                  <TableRow><TableCell colSpan={4} align="center" sx={{ py: 4 }}><CircularProgress size={28} /></TableCell></TableRow>
                ) : dataVerif.length === 0 ? (
                  <TableRow><TableCell colSpan={4} align="center" sx={{ py: 3, color: 'text.secondary' }}>Sin resultados.</TableCell></TableRow>
                ) : dataVerif.map(e => {
                  const nombre = e.nombreEmpresa ?? e.nombreComercial ?? '—';
                  return (
                    <TableRow key={e.id} hover>
                      <TableCell>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <Avatar sx={{ width: 32, height: 32, bgcolor: '#E2E8F0', color: '#64748B', fontSize: 13 }}>{nombre[0]}</Avatar>
                          <Typography variant="body2" fontWeight={600}>{nombre}</Typography>
                        </Stack>
                      </TableCell>
                      <TableCell><Typography variant="caption" color="text.secondary">{e.usuario?.email ?? '—'}</Typography></TableCell>
                      <TableCell>
                        <Chip label={e.verificado ? 'Verificada' : 'Pendiente'} size="small"
                          color={e.verificado ? 'success' : 'warning'} sx={{ fontWeight: 700 }} />
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title={e.verificado ? 'Revocar verificación' : 'Aprobar verificación'}>
                          <Button size="small" variant={e.verificado ? 'outlined' : 'contained'}
                            color={e.verificado ? 'warning' : 'success'}
                            startIcon={<VerifiedIcon fontSize="small" />}
                            onClick={() => handleVerificar(e.id, nombre)}
                            sx={{ textTransform: 'none', fontWeight: 700, fontSize: 12 }}>
                            {e.verificado ? 'Revocar' : 'Verificar'}
                          </Button>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </Box>
  );
}

// ════════════════════════════════════════════════════════
//  TAB 4 — Proyectos (admin view)
// ════════════════════════════════════════════════════════
const ESTADOS_PROYECTO = ['Borrador','Publicado','EnPropuestas','EnCurso','Completado','Cancelado'];

function TabProyectos() {
  const [data, setData]                   = useState([]);
  const [loading, setLoading]             = useState(false);
  const [estadoFilt, setEstadoFilt]       = useState('');
  const [buscar, setBuscar]               = useState('');
  const [dialog, setDialog]               = useState(null);
  const [nuevoEstado, setNuevoEstado]     = useState('');
  const [feedback, setFeedback]           = useState(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    const params = {};
    if (estadoFilt) params.estado = estadoFilt;
    if (buscar)     params.buscar = buscar;
    try {
      const { data: res } = await adminApi.getAllProyectos(params);
      setData(res.data ?? res);
    } finally { setLoading(false); }
  }, [estadoFilt, buscar]);

  useEffect(() => { cargar(); }, [cargar]);

  const cambiarEstado = async () => {
    try {
      await adminApi.cambiarEstadoProyecto(dialog.id, { estado: nuevoEstado, motivo: 'Intervención admin' });
      setFeedback({ msg: 'Estado actualizado.', severity: 'success' });
      setDialog(null);
      cargar();
    } catch { setFeedback({ msg: 'Error.', severity: 'error' }); }
    finally  { setTimeout(() => setFeedback(null), 3000); }
  };

  const estadoColor = { Borrador: 'default', Publicado: 'info', EnPropuestas: 'warning', EnCurso: 'success', Completado: 'default', Cancelado: 'error' };

  return (
    <Box>
      {feedback && <Alert severity={feedback.severity} sx={{ mb: 2 }}>{feedback.msg}</Alert>}

      <Stack direction="row" spacing={1.5} mb={2} flexWrap="wrap">
        <TextField size="small" placeholder="Buscar título, cantón…"
          value={buscar} onChange={e => setBuscar(e.target.value)}
          InputProps={{ startAdornment: <SearchIcon sx={{ mr: .5, fontSize: 18, color: 'text.secondary' }} /> }}
          sx={{ width: 220 }}
        />
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Estado</InputLabel>
          <Select value={estadoFilt} label="Estado" onChange={e => setEstadoFilt(e.target.value)}>
            <MenuItem value="">Todos</MenuItem>
            {ESTADOS_PROYECTO.map(e => <MenuItem key={e} value={e}>{e}</MenuItem>)}
          </Select>
        </FormControl>
        <IconButton onClick={cargar} size="small"><RefreshIcon /></IconButton>
      </Stack>

      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
        <Table size="small">
          <TableHead sx={{ bgcolor: '#f8fafc' }}>
            <TableRow>
              <TableCell>Proyecto</TableCell>
              <TableCell>Cliente</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Presupuesto</TableCell>
              <TableCell>Publicación</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4 }}><CircularProgress size={28} /></TableCell></TableRow>
            ) : data.map(p => (
              <TableRow key={p.id} hover>
                <TableCell>
                  <Typography variant="body2" fontWeight={600}>{p.titulo}</Typography>
                  <Typography variant="caption" color="text.secondary">{p.canton}, {p.provincia}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{p.cliente?.nombre}</Typography>
                  <Typography variant="caption" color="text.secondary">{p.cliente?.email}</Typography>
                </TableCell>
                <TableCell>
                  <Chip label={p.estado} size="small" color={estadoColor[p.estado] ?? 'default'} />
                </TableCell>
                <TableCell><Typography variant="caption">{fmtCRC(p.presupuestoMax)}</Typography></TableCell>
                <TableCell><Typography variant="caption">{fmtDate(p.fechaPublicacion)}</Typography></TableCell>
                <TableCell align="right">
                  <Tooltip title="Cambiar estado">
                    <IconButton size="small" onClick={() => { setNuevoEstado(p.estado); setDialog(p); }}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={!!dialog} onClose={() => setDialog(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Cambiar estado — {dialog?.titulo}</DialogTitle>
        <DialogContent sx={{ pt: '12px !important' }}>
          <FormControl fullWidth size="small">
            <InputLabel>Nuevo estado</InputLabel>
            <Select value={nuevoEstado} label="Nuevo estado" onChange={e => setNuevoEstado(e.target.value)}>
              {ESTADOS_PROYECTO.map(e => <MenuItem key={e} value={e}>{e}</MenuItem>)}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog(null)}>Cancelar</Button>
          <Button variant="contained" onClick={cambiarEstado}>Confirmar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// ════════════════════════════════════════════════════════
//  TAB 5 — Auditoría
// ════════════════════════════════════════════════════════
function TabAuditoria() {
  const [data, setData]         = useState([]);
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(false);
  const [modulos, setModulos]   = useState([]);
  const [modFilt, setModFilt]   = useState('');
  const [buscar, setBuscar]     = useState('');
  const [page, setPage]         = useState(1);

  const cargar = useCallback(async () => {
    setLoading(true);
    const params = { page, limit: 50 };
    if (modFilt) params.modulo = modFilt;
    if (buscar)  params.buscar = buscar;
    try {
      const [logRes, modRes] = await Promise.all([
        auditoriaApi.getLogs(params),
        modulos.length ? Promise.resolve({ data: modulos }) : auditoriaApi.getModulos(),
      ]);
      setData(logRes.data.data ?? []);
      setTotal(logRes.data.total ?? 0);
      if (!modulos.length) setModulos(modRes.data);
    } finally { setLoading(false); }
  }, [page, modFilt, buscar]);

  useEffect(() => { cargar(); }, [cargar]);

  const accionColor = (a) => {
    if (!a) return 'default';
    if (a.includes('Bloquear') || a.includes('Revocar') || a.includes('Suspender')) return 'error';
    if (a.includes('Crear')    || a.includes('Registro') || a.includes('Agregar'))   return 'success';
    if (a.includes('Actualizar')|| a.includes('Cambiar') || a.includes('Reset'))     return 'warning';
    return 'default';
  };

  return (
    <Box>
      <Stack direction="row" spacing={1.5} mb={2} flexWrap="wrap" alignItems="center">
        <TextField size="small" placeholder="Buscar usuario, detalle…"
          value={buscar} onChange={e => { setBuscar(e.target.value); setPage(1); }}
          InputProps={{ startAdornment: <SearchIcon sx={{ mr: .5, fontSize: 18, color: 'text.secondary' }} /> }}
          sx={{ width: 220 }}
        />
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Módulo</InputLabel>
          <Select value={modFilt} label="Módulo" onChange={e => { setModFilt(e.target.value); setPage(1); }}>
            <MenuItem value="">Todos</MenuItem>
            {modulos.map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
          </Select>
        </FormControl>
        <IconButton onClick={cargar} size="small"><RefreshIcon /></IconButton>
        <Typography variant="caption" color="text.secondary">{total} registros</Typography>
      </Stack>

      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
        <Table size="small">
          <TableHead sx={{ bgcolor: '#f8fafc' }}>
            <TableRow>
              <TableCell>Fecha</TableCell>
              <TableCell>Usuario</TableCell>
              <TableCell>Acción</TableCell>
              <TableCell>Módulo</TableCell>
              <TableCell>Detalle</TableCell>
              <TableCell>IP</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4 }}><CircularProgress size={28} /></TableCell></TableRow>
            ) : data.map(l => (
              <TableRow key={l.id} hover>
                <TableCell><Typography variant="caption">{fmtDate(l.fecha)}</Typography></TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight={600}>{l.usuarioNombre}</Typography>
                  {l.entidadId && <Typography variant="caption" color="text.secondary">ID: {l.entidadId}</Typography>}
                </TableCell>
                <TableCell>
                  <Chip label={l.accion} size="small" color={accionColor(l.accion)} sx={{ fontWeight: 600 }} />
                </TableCell>
                <TableCell><Chip label={l.modulo} size="small" variant="outlined" /></TableCell>
                <TableCell sx={{ maxWidth: 300 }}>
                  <Typography variant="caption" sx={{ wordBreak: 'break-word' }}>{l.detalle}</Typography>
                </TableCell>
                <TableCell><Typography variant="caption">{l.ipAddress ?? '—'}</Typography></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {total > 50 && (
        <Stack direction="row" spacing={1} justifyContent="center" mt={2}>
          <Button size="small" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Anterior</Button>
          <Typography variant="body2" alignSelf="center">Pág. {page}</Typography>
          <Button size="small" disabled={page * 50 >= total} onClick={() => setPage(p => p + 1)}>Siguiente</Button>
        </Stack>
      )}
    </Box>
  );
}

// ════════════════════════════════════════════════════════
//  TAB 6 — Configuración Global
// ════════════════════════════════════════════════════════
function TabConfiguracion() {
  const [configs, setConfigs]   = useState([]);
  const [cats, setCats]         = useState([]);
  const [catSel, setCatSel]     = useState('');
  const [loading, setLoading]   = useState(true);
  const [editVals, setEditVals] = useState({});
  const [saving, setSaving]     = useState({});
  const [feedback, setFeedback] = useState(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const [cfgRes, catRes] = await Promise.all([
        configuracionApi.getAll(catSel || undefined),
        configuracionApi.getCategorias(),
      ]);
      setConfigs(cfgRes.data);
      setCats(catRes.data);
      const vals = {};
      cfgRes.data.forEach(c => { vals[c.clave] = c.valor; });
      setEditVals(vals);
    } finally { setLoading(false); }
  }, [catSel]);

  useEffect(() => { cargar(); }, [cargar]);

  const guardar = async (clave) => {
    setSaving(prev => ({ ...prev, [clave]: true }));
    try {
      await configuracionApi.actualizar(clave, editVals[clave]);
      setFeedback({ msg: `${clave} actualizada.`, severity: 'success' });
      setTimeout(() => setFeedback(null), 2500);
    } catch { setFeedback({ msg: 'Error al guardar.', severity: 'error' }); }
    finally  { setSaving(prev => ({ ...prev, [clave]: false })); }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}><CircularProgress /></Box>;

  return (
    <Box>
      {feedback && <Alert severity={feedback.severity} sx={{ mb: 2 }}>{feedback.msg}</Alert>}

      <Stack direction="row" spacing={1.5} mb={3} flexWrap="wrap">
        <Button variant={catSel === '' ? 'contained' : 'outlined'} size="small"
          onClick={() => setCatSel('')} sx={{ borderRadius: 4, textTransform: 'none' }}>
          Todas
        </Button>
        {cats.map(c => (
          <Button key={c} variant={catSel === c ? 'contained' : 'outlined'} size="small"
            onClick={() => setCatSel(c)} sx={{ borderRadius: 4, textTransform: 'none' }}>
            {c}
          </Button>
        ))}
      </Stack>

      <Stack spacing={2}>
        {configs.map(c => (
          <Card key={c.clave} variant="outlined" sx={{ borderRadius: 2 }}>
            <CardContent sx={{ py: '10px !important' }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Box sx={{ flex: 1 }}>
                  <Stack direction="row" spacing={1} alignItems="center" mb={.5}>
                    <Typography variant="body2" fontWeight={700} fontFamily="monospace">{c.clave}</Typography>
                    <Chip label={c.categoria} size="small" variant="outlined" sx={{ fontSize: 10 }} />
                    {!c.editable && <Chip label="Solo lectura" size="small" color="default" sx={{ fontSize: 10 }} />}
                  </Stack>
                  {c.descripcion && (
                    <Typography variant="caption" color="text.secondary">{c.descripcion}</Typography>
                  )}
                </Box>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 340 }}>
                  <TextField size="small" fullWidth
                    value={editVals[c.clave] ?? ''}
                    onChange={e => setEditVals(prev => ({ ...prev, [c.clave]: e.target.value }))}
                    disabled={!c.editable}
                  />
                  <Button variant="contained" size="small" disabled={!c.editable || saving[c.clave]}
                    onClick={() => guardar(c.clave)} sx={{ minWidth: 80 }}>
                    {saving[c.clave] ? <CircularProgress size={16} /> : 'Guardar'}
                  </Button>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Stack>
    </Box>
  );
}

// ════════════════════════════════════════════════════════
//  PÁGINA PRINCIPAL
// ════════════════════════════════════════════════════════
// ════════════════════════════════════════════════════════
//  TAB 7 — Solicitudes de acceso
// ════════════════════════════════════════════════════════
const ROLES_ASIGNABLES = ['Cliente', 'Constructor', 'Proveedor', 'Supervisor', 'MaestroObra', 'Arquitecto', 'Ingeniero'];

function TabSolicitudes() {
  const [data, setData]         = useState([]);
  const [loading, setLoading]   = useState(false);
  const [dialog, setDialog]     = useState(null); // { tipo: 'aprobar'|'rechazar', sol }
  const [rolVal, setRolVal]     = useState('Cliente');
  const [motivoVal, setMotivo]  = useState('');
  const [feedback, setFeedback] = useState(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const { data: res } = await adminApi.getSolicitudes();
      setData(res);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const showFeedback = (msg, severity = 'success') => {
    setFeedback({ msg, severity });
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleAccion = async () => {
    const { tipo, sol } = dialog;
    try {
      if (tipo === 'aprobar') {
        await adminApi.aprobarSolicitud(sol.id, rolVal);
        showFeedback(`Cuenta de ${sol.nombre} aprobada como ${rolVal}.`);
      } else {
        await adminApi.rechazarSolicitud(sol.id, motivoVal || undefined);
        showFeedback(`Solicitud de ${sol.nombre} rechazada.`);
      }
      setDialog(null);
      cargar();
    } catch (err) {
      showFeedback(err.response?.data?.message || 'Error al procesar la solicitud.', 'error');
      setDialog(null);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" fontWeight={700}>Solicitudes de acceso</Typography>
        <Button size="small" startIcon={<RefreshIcon />} onClick={cargar}>Actualizar</Button>
      </Box>

      {feedback && <Alert severity={feedback.severity} sx={{ mb: 2 }}>{feedback.msg}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}><CircularProgress /></Box>
      ) : data.length === 0 ? (
        <Alert severity="info">No hay solicitudes de acceso pendientes.</Alert>
      ) : (
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
          <Table size="small">
            <TableHead sx={{ bgcolor: '#F8FAFC' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Nombre</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Teléfono</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Motivo</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Fecha</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map(sol => (
                <TableRow key={sol.id} hover>
                  <TableCell><Typography fontSize={13} fontWeight={600}>{sol.nombre}</Typography></TableCell>
                  <TableCell><Typography fontSize={12} color="text.secondary">{sol.email}</Typography></TableCell>
                  <TableCell><Typography fontSize={12}>{sol.telefono || '—'}</Typography></TableCell>
                  <TableCell sx={{ maxWidth: 220 }}>
                    <Typography fontSize={12} color="text.secondary" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {sol.motivoRegistro || '—'}
                    </Typography>
                  </TableCell>
                  <TableCell><Typography fontSize={12}>{fmtDate(sol.createdAt)}</Typography></TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={0.5} justifyContent="center">
                      <Tooltip title="Aprobar">
                        <IconButton size="small" color="success"
                          onClick={() => { setRolVal('Cliente'); setDialog({ tipo: 'aprobar', sol }); }}>
                          <ThumbUpIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Rechazar">
                        <IconButton size="small" color="error"
                          onClick={() => { setMotivo(''); setDialog({ tipo: 'rechazar', sol }); }}>
                          <ThumbDownIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Dialog aprobar */}
      <Dialog open={dialog?.tipo === 'aprobar'} onClose={() => setDialog(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Aprobar solicitud</DialogTitle>
        <DialogContent>
          <Typography fontSize={14} mb={2}>
            Aprobando la cuenta de <strong>{dialog?.sol.nombre}</strong>.<br />
            Seleccioná el rol que se le asignará:
          </Typography>
          <FormControl fullWidth size="small">
            <InputLabel>Rol</InputLabel>
            <Select value={rolVal} label="Rol" onChange={e => setRolVal(e.target.value)}>
              {ROLES_ASIGNABLES.map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog(null)}>Cancelar</Button>
          <Button variant="contained" color="success" onClick={handleAccion}>Aprobar</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog rechazar */}
      <Dialog open={dialog?.tipo === 'rechazar'} onClose={() => setDialog(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Rechazar solicitud</DialogTitle>
        <DialogContent>
          <Typography fontSize={14} mb={2}>
            Rechazando la solicitud de <strong>{dialog?.sol.nombre}</strong>.<br />
            Podés incluir un motivo (opcional):
          </Typography>
          <TextField fullWidth multiline rows={3} label="Motivo (opcional)"
            value={motivoVal} onChange={e => setMotivo(e.target.value)}
            placeholder="Ej: La solicitud no cumple los requisitos actuales..." />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog(null)}>Cancelar</Button>
          <Button variant="contained" color="error" onClick={handleAccion}>Rechazar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

const TABS_DEF = [
  { label: 'Dashboard',        icon: <DashboardIcon fontSize="small" /> },
  { label: 'Usuarios',         icon: <PeopleIcon fontSize="small" /> },
  { label: 'Roles & Permisos', icon: <AdminPanelSettingsIcon fontSize="small" /> },
  { label: 'Empresas',         icon: <BusinessIcon fontSize="small" /> },
  { label: 'Auditoría',        icon: <SecurityIcon fontSize="small" /> },
  { label: 'Configuración',    icon: <SettingsIcon fontSize="small" /> },
  { label: 'Solicitudes',      icon: <HourglassEmptyIcon fontSize="small" /> },
];

export default function AdminPanel() {
  const [tab, setTab] = useState(0);

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Typography variant="h5" fontWeight={800} mb={.5}>Portal Administrador</Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Gestión de la plataforma ConstruApp
      </Typography>

      <Tabs
        value={tab} onChange={(_, v) => setTab(v)}
        variant="scrollable" scrollButtons="auto"
        sx={{
          mb: 3,
          '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, minHeight: 44 },
          '& .Mui-selected': { color: ACCENT },
          '& .MuiTabs-indicator': { bgcolor: ACCENT },
        }}
      >
        {TABS_DEF.map(t => (
          <Tab key={t.label} label={t.label} icon={t.icon} iconPosition="start" />
        ))}
      </Tabs>

      {tab === 0 && <TabDashboard />}
      {tab === 1 && <TabUsuarios />}
      {tab === 2 && <TabRoles />}
      {tab === 3 && <TabEmpresas />}
      {tab === 4 && <TabAuditoria />}
      {tab === 5 && <TabConfiguracion />}
      {tab === 6 && <TabSolicitudes />}
    </Box>
  );
}
