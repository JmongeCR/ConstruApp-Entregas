import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, Chip, LinearProgress, Tooltip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Select, MenuItem, Skeleton, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, IconButton, Collapse, Checkbox,
  FormControl, InputLabel, CircularProgress, Stack,
} from '@mui/material';
import ViewTimelineIcon            from '@mui/icons-material/ViewTimeline';
import TableChartIcon              from '@mui/icons-material/TableChart';
import AddIcon                     from '@mui/icons-material/Add';
import CheckCircleIcon             from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon    from '@mui/icons-material/RadioButtonUnchecked';
import PlayCircleIcon              from '@mui/icons-material/PlayCircle';
import CancelIcon                  from '@mui/icons-material/Cancel';
import EditIcon                    from '@mui/icons-material/Edit';
import DeleteIcon                  from '@mui/icons-material/Delete';
import ExpandMoreIcon              from '@mui/icons-material/ExpandMore';
import ExpandLessIcon              from '@mui/icons-material/ExpandLess';
import TaskAltIcon                 from '@mui/icons-material/TaskAlt';
import { cronogramaApi, proyectosApi, constructorApi } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';

const ACCENT = '#2563EB';

const FASE_ESTADOS = {
  Pendiente:   { label: 'Pendiente',    bg: '#F1F5F9', color: '#64748B', dot: '#94A3B8' },
  EnProgreso:  { label: 'En progreso',  bg: '#DBEAFE', color: '#1D4ED8', dot: '#3B82F6' },
  Completada:  { label: 'Completada',   bg: '#DCFCE7', color: '#166534', dot: '#10B981' },
  Cancelada:   { label: 'Cancelada',    bg: '#F1F5F9', color: '#9CA3AF', dot: '#9CA3AF' },
  Atrasada:    { label: 'Atrasada',     bg: '#FEE2E2', color: '#991B1B', dot: '#EF4444' },
};

const COLORES_PRESET = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#EC4899', '#6B7280'];

function fmtFecha(s) {
  if (!s) return '—';
  return new Date(s).toLocaleDateString('es-CR', { day: 'numeric', month: 'short', year: 'numeric' });
}

function isoDate(s) {
  if (!s) return '';
  return s.slice(0, 10);
}

/** Detecta si una fase está atrasada (fecha fin pasada y no completada/cancelada) */
function estadoVis(fase) {
  if (fase.estado === 'Completada' || fase.estado === 'Cancelada') return fase.estado;
  if (new Date(fase.fechaFin) < new Date()) return 'Atrasada';
  return fase.estado;
}

function EstadoIcon({ estado }) {
  if (estado === 'Completada')  return <CheckCircleIcon sx={{ fontSize: 15, color: '#10B981' }} />;
  if (estado === 'EnProgreso')  return <PlayCircleIcon  sx={{ fontSize: 15, color: '#3B82F6' }} />;
  if (estado === 'Atrasada')    return <CancelIcon      sx={{ fontSize: 15, color: '#EF4444' }} />;
  if (estado === 'Cancelada')   return <CancelIcon      sx={{ fontSize: 15, color: '#9CA3AF' }} />;
  return <RadioButtonUncheckedIcon sx={{ fontSize: 15, color: '#CBD5E1' }} />;
}

function GanttBar({ fechaInicio, fechaFin, proyInicio, proyFin, estadoVis: ev, avance, color }) {
  const total = proyFin - proyInicio;
  if (!total) return null;
  const left  = Math.max(0, ((new Date(fechaInicio) - proyInicio) / total) * 100);
  const width = Math.min(100 - left, ((new Date(fechaFin) - new Date(fechaInicio)) / total) * 100);
  const colors = { Completada: '#10B981', EnProgreso: color || ACCENT, Pendiente: '#CBD5E1', Atrasada: '#EF4444', Cancelada: '#9CA3AF' };
  const bg = colors[ev] ?? '#CBD5E1';
  return (
    <Box sx={{ position: 'relative', height: 18, bgcolor: '#F1F5F9', borderRadius: '3px', overflow: 'hidden', minWidth: 80 }}>
      <Box sx={{ position: 'absolute', left: `${left}%`, width: `${width}%`, height: '100%',
        bgcolor: `${bg}30`, border: `1.5px solid ${bg}`, borderRadius: '3px' }}>
        {avance > 0 && (
          <Box sx={{ width: `${avance}%`, height: '100%', bgcolor: bg, opacity: 0.7 }} />
        )}
      </Box>
    </Box>
  );
}

// ── Modal: crear / editar fase ────────────────────────────────────────────────
function FaseModal({ open, onClose, proyectoId, fase, onSaved }) {
  const editing = !!fase;
  const [form, setForm] = useState({
    nombre: '', descripcion: '', fechaInicio: '', fechaFin: '', color: '#2563EB', estado: 'Pendiente', porcentajeCompletado: 0,
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (fase) {
      setForm({
        nombre: fase.nombre ?? '',
        descripcion: fase.descripcion ?? '',
        fechaInicio: isoDate(fase.fechaInicio),
        fechaFin: isoDate(fase.fechaFin),
        color: fase.color ?? '#2563EB',
        estado: fase.estado ?? 'Pendiente',
        porcentajeCompletado: fase.porcentajeCompletado ?? 0,
      });
    } else {
      setForm({ nombre: '', descripcion: '', fechaInicio: '', fechaFin: '', color: '#2563EB', estado: 'Pendiente', porcentajeCompletado: 0 });
    }
    setErr('');
  }, [fase, open]);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!form.nombre.trim()) { setErr('El nombre es obligatorio.'); return; }
    if (!form.fechaInicio || !form.fechaFin) { setErr('Las fechas son obligatorias.'); return; }
    if (form.fechaFin < form.fechaInicio) { setErr('La fecha de fin debe ser posterior al inicio.'); return; }
    setSaving(true);
    try {
      if (editing) {
        await cronogramaApi.updateFase(fase.id, {
          nombre: form.nombre,
          descripcion: form.descripcion || null,
          fechaInicio: form.fechaInicio,
          fechaFin: form.fechaFin,
          color: form.color,
          estado: form.estado,
          porcentajeCompletado: Number(form.porcentajeCompletado),
        });
      } else {
        await cronogramaApi.createFase({
          proyectoId,
          nombre: form.nombre,
          descripcion: form.descripcion || null,
          fechaInicio: form.fechaInicio,
          fechaFin: form.fechaFin,
          color: form.color,
        });
      }
      onSaved();
      onClose();
    } catch (e) {
      setErr(e?.response?.data?.message ?? 'Error al guardar la fase.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontSize: 15, fontWeight: 700 }}>
        {editing ? 'Editar fase' : 'Nueva fase'}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <TextField label="Nombre de la fase" size="small" fullWidth value={form.nombre}
            onChange={e => set('nombre', e.target.value)} required />
          <TextField label="Descripción" size="small" fullWidth multiline rows={2} value={form.descripcion}
            onChange={e => set('descripcion', e.target.value)} />
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <TextField label="Fecha inicio" type="date" size="small" fullWidth
              value={form.fechaInicio} onChange={e => set('fechaInicio', e.target.value)}
              InputLabelProps={{ shrink: true }} required />
            <TextField label="Fecha fin" type="date" size="small" fullWidth
              value={form.fechaFin} onChange={e => set('fechaFin', e.target.value)}
              InputLabelProps={{ shrink: true }} required />
          </Box>
          {editing && (
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <FormControl size="small" fullWidth>
                <InputLabel>Estado</InputLabel>
                <Select label="Estado" value={form.estado} onChange={e => set('estado', e.target.value)}>
                  {['Pendiente', 'EnProgreso', 'Completada', 'Cancelada'].map(s => (
                    <MenuItem key={s} value={s}>{FASE_ESTADOS[s]?.label ?? s}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField label="Avance (%)" type="number" size="small" fullWidth
                value={form.porcentajeCompletado}
                onChange={e => set('porcentajeCompletado', Math.min(100, Math.max(0, Number(e.target.value))))}
                inputProps={{ min: 0, max: 100 }} />
            </Box>
          )}
          <Box>
            <Typography fontSize={12} color="text.secondary" sx={{ mb: 0.75 }}>Color</Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {COLORES_PRESET.map(c => (
                <Box key={c} onClick={() => set('color', c)} sx={{
                  width: 26, height: 26, borderRadius: '50%', bgcolor: c, cursor: 'pointer',
                  border: form.color === c ? '2.5px solid #1e293b' : '2px solid transparent',
                  boxSizing: 'border-box', transition: 'border 0.1s',
                }} />
              ))}
            </Box>
          </Box>
          {err && <Typography fontSize={12} color="error">{err}</Typography>}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} size="small">Cancelar</Button>
        <Button onClick={handleSave} variant="contained" size="small" disabled={saving}>
          {saving ? <CircularProgress size={14} sx={{ mr: 1 }} /> : null}
          {editing ? 'Guardar cambios' : 'Crear fase'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Modal: agregar tarea ───────────────────────────────────────────────────────
function TareaModal({ open, onClose, faseId, onSaved }) {
  const [nombre, setNombre] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (open) setNombre(''); }, [open]);

  const handleSave = async () => {
    if (!nombre.trim()) return;
    setSaving(true);
    try {
      await cronogramaApi.createTarea(faseId, { nombre });
      onSaved();
      onClose();
    } catch { /* ignore */ } finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontSize: 14, fontWeight: 700 }}>Nueva tarea</DialogTitle>
      <DialogContent>
        <TextField label="Nombre de la tarea" size="small" fullWidth value={nombre}
          onChange={e => setNombre(e.target.value)} sx={{ mt: 1 }}
          onKeyDown={e => e.key === 'Enter' && handleSave()} />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} size="small">Cancelar</Button>
        <Button onClick={handleSave} variant="contained" size="small" disabled={saving || !nombre.trim()}>
          Agregar
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Fila expandible de tareas ─────────────────────────────────────────────────
function TareasRow({ fase, esConstructor, onRefresh }) {
  const tareas = fase.tareas ?? [];
  const [toggling, setToggling] = useState(null);
  const [addOpen, setAddOpen] = useState(false);

  const toggleTarea = async (tarea) => {
    setToggling(tarea.id);
    try {
      await cronogramaApi.updateTarea(tarea.id, { completada: !tarea.completada });
      onRefresh();
    } catch { /* ignore */ } finally { setToggling(null); }
  };

  return (
    <>
      <TableRow>
        <TableCell colSpan={7} sx={{ p: 0 }}>
          <Box sx={{ pl: 6, pr: 2, py: 1, bgcolor: '#FAFAFA', borderBottom: '1px solid #F1F5F9' }}>
            {tareas.length === 0 && !esConstructor && (
              <Typography fontSize={12} color="text.secondary" sx={{ py: 0.5 }}>Sin tareas registradas.</Typography>
            )}
            {tareas.map(t => (
              <Box key={t.id} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, py: 0.3 }}>
                <Checkbox size="small" checked={t.completada} disabled={!esConstructor || toggling === t.id}
                  onChange={() => toggleTarea(t)}
                  icon={<RadioButtonUncheckedIcon sx={{ fontSize: 16, color: '#CBD5E1' }} />}
                  checkedIcon={<CheckCircleIcon sx={{ fontSize: 16, color: '#10B981' }} />}
                  sx={{ p: 0.3 }} />
                <Typography fontSize={12.5} sx={{ textDecoration: t.completada ? 'line-through' : 'none', color: t.completada ? '#9CA3AF' : 'text.primary' }}>
                  {t.nombre}
                </Typography>
                {toggling === t.id && <CircularProgress size={10} sx={{ ml: 0.5 }} />}
              </Box>
            ))}
            {esConstructor && (
              <Button size="small" startIcon={<AddIcon sx={{ fontSize: 13 }} />}
                onClick={() => setAddOpen(true)}
                sx={{ fontSize: 11.5, mt: tareas.length > 0 ? 0.5 : 0, color: ACCENT, px: 0.5 }}>
                Agregar tarea
              </Button>
            )}
          </Box>
        </TableCell>
      </TableRow>
      <TareaModal open={addOpen} onClose={() => setAddOpen(false)} faseId={fase.id} onSaved={onRefresh} />
    </>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function Cronograma() {
  const navigate = useNavigate();
  const { esRol } = useAuth();
  const esConstructor = esRol('Constructor');

  const [proyectos, setProyectos]     = useState([]);
  const [selProyecto, setSelProyecto] = useState('');
  const [fases, setFases]             = useState([]);
  const [vista, setVista]             = useState('tabla');
  const [loadingProy, setLoadingProy] = useState(true);
  const [loadingFases, setLoadingFases] = useState(false);
  const [expandedFase, setExpandedFase] = useState(null);

  // Modals
  const [faseModalOpen, setFaseModalOpen]   = useState(false);
  const [editFase, setEditFase]             = useState(null);
  const [deleteConfirm, setDeleteConfirm]   = useState(null);
  const [deleting, setDeleting]             = useState(false);

  // Cargar proyectos según rol
  useEffect(() => {
    const loadProyectos = async () => {
      try {
        let lista = [];
        if (esConstructor) {
          const r = await constructorApi.dashboard();
          const clientes = r.data?.clientes ?? [];
          // Mostrar todos los proyectos del constructor (activos y completados)
          lista = clientes
            .map(c => ({ id: c.proyectoId, titulo: c.proyectoTitulo, estado: c.estadoProyecto }));
          // Deduplicar por proyectoId
          lista = lista.filter((p, i, arr) => arr.findIndex(x => x.id === p.id) === i);
        } else {
          const r = await proyectosApi.getMios();
          // Para clientes: solo proyectos activos o en curso
          lista = (r.data ?? []).filter(p =>
            ['EnCurso', 'EnPropuestas', 'Publicado', 'Completado'].includes(p.estado)
          );
        }
        setProyectos(lista);
        if (lista.length > 0) setSelProyecto(String(lista[0].id));
      } catch { /* ignore */ } finally { setLoadingProy(false); }
    };
    loadProyectos();
  }, [esConstructor]);

  // Cargar fases del proyecto seleccionado
  const cargarFases = useCallback(async () => {
    if (!selProyecto) { setFases([]); return; }
    setLoadingFases(true);
    try {
      const r = await cronogramaApi.getByProyecto(Number(selProyecto));
      setFases(r.data ?? []);
    } catch { setFases([]); } finally { setLoadingFases(false); }
  }, [selProyecto]);

  useEffect(() => { cargarFases(); }, [cargarFases]);

  const handleDeleteFase = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      await cronogramaApi.deleteFase(deleteConfirm.id);
      setDeleteConfirm(null);
      cargarFases();
    } catch { /* ignore */ } finally { setDeleting(false); }
  };

  // ── Stats ─────────────────────────────────────────────────────────────────
  const totalFases      = fases.length;
  const fasesCompletadas = fases.filter(f => f.estado === 'Completada').length;
  const fasesEnProgreso = fases.filter(f => f.estado === 'EnProgreso').length;
  const fasesPendientes = fases.filter(f => f.estado === 'Pendiente').length;
  const progTotal       = totalFases > 0
    ? Math.round(fases.reduce((s, f) => s + f.porcentajeCompletado, 0) / totalFases)
    : 0;
  const proyInicio = fases.length ? new Date(Math.min(...fases.map(f => new Date(f.fechaInicio)))) : new Date();
  const proyFin    = fases.length ? new Date(Math.max(...fases.map(f => new Date(f.fechaFin))))    : new Date();

  const TH = ({ children, align, minWidth }) => (
    <TableCell align={align} sx={{
      fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase',
      letterSpacing: '0.06em', py: 1.25, borderBottom: '1px solid #F1F5F9', minWidth,
    }}>
      {children}
    </TableCell>
  );

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2.5, flexWrap: 'wrap', gap: 1 }}>
        <Box>
          <Typography variant="h5" sx={{ mb: 0.25 }}>Cronograma de obra</Typography>
          <Typography variant="body2" color="text.secondary">Fases, avances y plazos por proyecto</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Vista toggle */}
          <Box sx={{ display: 'flex', border: '1px solid #E2E8F0', borderRadius: '7px', overflow: 'hidden' }}>
            <Tooltip title="Vista tabla">
              <Button size="small" onClick={() => setVista('tabla')}
                startIcon={<TableChartIcon sx={{ fontSize: 14 }} />}
                sx={{ borderRadius: 0, fontSize: 12, px: 1.5,
                  bgcolor: vista === 'tabla' ? '#EFF6FF' : 'transparent',
                  color: vista === 'tabla' ? ACCENT : '#64748B',
                  borderRight: '1px solid #E2E8F0', '&:hover': { bgcolor: '#F8FAFC' } }}>
                Tabla
              </Button>
            </Tooltip>
            <Tooltip title="Vista Gantt">
              <Button size="small" onClick={() => setVista('gantt')}
                startIcon={<ViewTimelineIcon sx={{ fontSize: 14 }} />}
                sx={{ borderRadius: 0, fontSize: 12, px: 1.5,
                  bgcolor: vista === 'gantt' ? '#EFF6FF' : 'transparent',
                  color: vista === 'gantt' ? ACCENT : '#64748B',
                  '&:hover': { bgcolor: '#F8FAFC' } }}>
                Gantt
              </Button>
            </Tooltip>
          </Box>

          {esConstructor && (
            <Button variant="contained" size="small" startIcon={<AddIcon sx={{ fontSize: 14 }} />}
              disabled={!selProyecto}
              onClick={() => { setEditFase(null); setFaseModalOpen(true); }}
              sx={{ fontSize: 12.5 }}>
              Nueva fase
            </Button>
          )}
        </Box>
      </Box>

      {/* Project selector + summary */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '300px 1fr' }, gap: 2, mb: 2.5 }}>
        <Box sx={{ bgcolor: '#fff', border: '1px solid #E2E8F0', borderRadius: '8px', p: 2.5 }}>
          <Typography fontSize={12} fontWeight={600} color="text.secondary"
            sx={{ mb: 1, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Proyecto activo
          </Typography>
          {loadingProy ? <Skeleton height={40} /> : (
            <Select size="small" fullWidth value={selProyecto} onChange={e => setSelProyecto(e.target.value)}
              sx={{ fontSize: 13 }} displayEmpty>
              {proyectos.length === 0 && (
                <MenuItem value="" disabled>Sin proyectos activos</MenuItem>
              )}
              {proyectos.map(p => (
                <MenuItem key={p.id} value={String(p.id)} sx={{ fontSize: 13 }}>{p.titulo}</MenuItem>
              ))}
            </Select>
          )}
          {selProyecto && (
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                <Typography fontSize={12} color="text.secondary">Progreso general</Typography>
                <Typography fontSize={12} fontWeight={700} color={ACCENT}>{progTotal}%</Typography>
              </Box>
              <LinearProgress variant="determinate" value={progTotal}
                sx={{ height: 6, borderRadius: 3, bgcolor: '#E5E7EB',
                  '& .MuiLinearProgress-bar': { bgcolor: ACCENT, borderRadius: 3 } }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1.5, flexWrap: 'wrap', gap: 1 }}>
                {[
                  { label: 'Completadas', val: fasesCompletadas, color: '#10B981' },
                  { label: 'En progreso', val: fasesEnProgreso,  color: ACCENT },
                  { label: 'Pendientes',  val: fasesPendientes,  color: '#9CA3AF' },
                ].map(s => (
                  <Box key={s.label} sx={{ textAlign: 'center' }}>
                    <Typography fontSize={18} fontWeight={700} sx={{ color: s.color, lineHeight: 1.1 }}>{s.val}</Typography>
                    <Typography fontSize={11} color="text.secondary">{s.label}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          )}
        </Box>

        {/* Quick stats */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1.5 }}>
          {[
            { label: 'Total de fases',   value: totalFases,      accent: ACCENT },
            { label: 'Completadas',      value: fasesCompletadas, accent: '#10B981' },
            { label: 'Atrasadas',        value: fases.filter(f => estadoVis(f) === 'Atrasada').length, accent: '#EF4444' },
          ].map(s => (
            <Box key={s.label} sx={{
              bgcolor: '#fff', border: '1px solid #E8EDF3', borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              px: 2.5, pt: 2, pb: 1.75,
            }}>
              <Typography fontSize={26} fontWeight={800} lineHeight={1.1} sx={{ color: s.accent }}>
                {loadingFases ? <Skeleton width={40} /> : (s.value ?? '—')}
              </Typography>
              <Typography fontSize={12} color="text.secondary" sx={{ mt: 0.5, fontWeight: 500 }}>{s.label}</Typography>
            </Box>
          ))}
        </Box>
      </Box>

      {/* Fases panel */}
      <Box sx={{ bgcolor: '#fff', border: '1px solid #E2E8F0', borderRadius: '8px', overflow: 'hidden' }}>
        <Box sx={{ px: 2.5, py: 1.5, borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography fontSize={13} fontWeight={600}>
            {vista === 'gantt' ? 'Diagrama Gantt' : `Fases del proyecto (${fases.length})`}
          </Typography>
          {loadingFases && <CircularProgress size={14} />}
        </Box>

        {!selProyecto ? (
          <Box sx={{ py: 8, textAlign: 'center' }}>
            <ViewTimelineIcon sx={{ fontSize: 36, color: '#CBD5E1', mb: 1.5 }} />
            <Typography fontSize={13} color="text.secondary" sx={{ mb: 1 }}>
              Seleccioná un proyecto para ver su cronograma
            </Typography>
            <Button size="small" variant="outlined" onClick={() => navigate('/mis-proyectos')}>
              Ver mis proyectos
            </Button>
          </Box>
        ) : loadingFases ? (
          <Box sx={{ p: 3 }}>
            {[1, 2, 3].map(i => <Skeleton key={i} height={48} sx={{ mb: 1 }} />)}
          </Box>
        ) : fases.length === 0 ? (
          <Box sx={{ py: 8, textAlign: 'center' }}>
            <TaskAltIcon sx={{ fontSize: 36, color: '#CBD5E1', mb: 1.5 }} />
            <Typography fontSize={13} color="text.secondary" sx={{ mb: 1 }}>
              No hay fases registradas para este proyecto
            </Typography>
            {esConstructor && (
              <Button size="small" variant="contained" startIcon={<AddIcon />}
                onClick={() => { setEditFase(null); setFaseModalOpen(true); }}>
                Crear primera fase
              </Button>
            )}
          </Box>
        ) : vista === 'tabla' ? (
          // ── TABLA ──────────────────────────────────────────────────────────
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TH>#</TH>
                  <TH>Fase</TH>
                  <TH>Estado</TH>
                  <TH>Inicio</TH>
                  <TH>Fin</TH>
                  <TH align="right">Avance</TH>
                  {esConstructor && <TH align="right"></TH>}
                </TableRow>
              </TableHead>
              <TableBody>
                {fases.map((f, i) => {
                  const ev  = estadoVis(f);
                  const est = FASE_ESTADOS[ev] ?? FASE_ESTADOS.Pendiente;
                  const expanded = expandedFase === f.id;
                  const hasTareas = (f.tareas?.length ?? 0) > 0;
                  return (
                    <>
                      <TableRow key={f.id}
                        sx={{ '&:hover': { bgcolor: '#F8FAFC' }, cursor: 'pointer' }}
                        onClick={() => setExpandedFase(expanded ? null : f.id)}>
                        <TableCell>
                          <Typography fontSize={12} fontWeight={700} color="text.secondary">{String(i + 1).padStart(2, '0')}</Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: f.color ?? ACCENT, flexShrink: 0 }} />
                            <EstadoIcon estado={ev} />
                            <Typography fontSize={13} fontWeight={500}>{f.nombre}</Typography>
                            {(hasTareas || esConstructor) && (
                              expanded
                                ? <ExpandLessIcon sx={{ fontSize: 14, color: '#9CA3AF', ml: 'auto' }} />
                                : <ExpandMoreIcon sx={{ fontSize: 14, color: '#9CA3AF', ml: 'auto' }} />
                            )}
                          </Box>
                        </TableCell>
                        <TableCell onClick={e => e.stopPropagation()}>
                          <Chip label={est.label} size="small"
                            sx={{ bgcolor: est.bg, color: est.color, fontWeight: 600, fontSize: 11 }} />
                        </TableCell>
                        <TableCell>
                          <Typography fontSize={12} color="text.secondary">{fmtFecha(f.fechaInicio)}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography fontSize={12} color="text.secondary">{fmtFecha(f.fechaFin)}</Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'flex-end', minWidth: 90 }}>
                            <LinearProgress variant="determinate" value={f.porcentajeCompletado}
                              sx={{ flex: 1, height: 5, borderRadius: 3, bgcolor: '#E5E7EB', maxWidth: 60,
                                '& .MuiLinearProgress-bar': { bgcolor: ev === 'Completada' ? '#10B981' : (f.color || ACCENT), borderRadius: 3 } }} />
                            <Typography fontSize={12} fontWeight={700} color="text.secondary" sx={{ minWidth: 28 }}>
                              {f.porcentajeCompletado}%
                            </Typography>
                          </Box>
                        </TableCell>
                        {esConstructor && (
                          <TableCell align="right" onClick={e => e.stopPropagation()}>
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                              <Tooltip title="Editar">
                                <IconButton size="small" onClick={() => { setEditFase(f); setFaseModalOpen(true); }}>
                                  <EditIcon sx={{ fontSize: 14 }} />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Eliminar">
                                <IconButton size="small" onClick={() => setDeleteConfirm(f)} sx={{ color: '#EF4444' }}>
                                  <DeleteIcon sx={{ fontSize: 14 }} />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        )}
                      </TableRow>
                      {/* Tareas expandibles */}
                      {expanded && (
                        <TareasRow fase={f} esConstructor={esConstructor} onRefresh={cargarFases} />
                      )}
                    </>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          // ── GANTT ──────────────────────────────────────────────────────────
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small" sx={{ minWidth: 700 }}>
              <TableHead>
                <TableRow>
                  <TH minWidth={160}>Fase</TH>
                  <TH>Estado</TH>
                  <TableCell sx={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase',
                    letterSpacing: '0.06em', py: 1.25, borderBottom: '1px solid #F1F5F9', minWidth: 320 }}>
                    Timeline ({fmtFecha(fases[0]?.fechaInicio)} — {fmtFecha(fases[fases.length - 1]?.fechaFin)})
                  </TableCell>
                  <TH align="right">%</TH>
                  {esConstructor && <TH align="right"></TH>}
                </TableRow>
              </TableHead>
              <TableBody>
                {fases.map((f) => {
                  const ev  = estadoVis(f);
                  const est = FASE_ESTADOS[ev] ?? FASE_ESTADOS.Pendiente;
                  return (
                    <TableRow key={f.id} sx={{ '&:hover': { bgcolor: '#F8FAFC' } }}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: f.color ?? ACCENT, flexShrink: 0 }} />
                          <EstadoIcon estado={ev} />
                          <Typography fontSize={12.5} fontWeight={500} noWrap>{f.nombre}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip label={est.label} size="small"
                          sx={{ bgcolor: est.bg, color: est.color, fontWeight: 600, fontSize: 10 }} />
                      </TableCell>
                      <TableCell sx={{ px: 2, py: 1 }}>
                        <GanttBar
                          fechaInicio={f.fechaInicio} fechaFin={f.fechaFin}
                          proyInicio={proyInicio} proyFin={proyFin}
                          estadoVis={ev} avance={f.porcentajeCompletado} color={f.color} />
                      </TableCell>
                      <TableCell align="right">
                        <Typography fontSize={12} fontWeight={700} color="text.secondary">{f.porcentajeCompletado}%</Typography>
                      </TableCell>
                      {esConstructor && (
                        <TableCell align="right">
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                            <Tooltip title="Editar">
                              <IconButton size="small" onClick={() => { setEditFase(f); setFaseModalOpen(true); }}>
                                <EditIcon sx={{ fontSize: 14 }} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Eliminar">
                              <IconButton size="small" onClick={() => setDeleteConfirm(f)} sx={{ color: '#EF4444' }}>
                                <DeleteIcon sx={{ fontSize: 14 }} />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Box>
        )}
      </Box>

      {/* ── Modals ── */}
      <FaseModal
        open={faseModalOpen}
        onClose={() => { setFaseModalOpen(false); setEditFase(null); }}
        proyectoId={Number(selProyecto)}
        fase={editFase}
        onSaved={cargarFases}
      />

      {/* Delete confirm */}
      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontSize: 14, fontWeight: 700 }}>¿Eliminar fase?</DialogTitle>
        <DialogContent>
          <Typography fontSize={13}>
            Se eliminará <strong>{deleteConfirm?.nombre}</strong> y todas sus tareas. Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(null)} size="small">Cancelar</Button>
          <Button onClick={handleDeleteFase} variant="contained" color="error" size="small" disabled={deleting}>
            {deleting ? <CircularProgress size={14} sx={{ mr: 1 }} /> : null}
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
