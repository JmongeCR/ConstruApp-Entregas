/**
 * ConstruApp Field — PWA para uso en obra
 * Mobile-first · Offline-Ready · Botones grandes · Android & iPhone
 *
 * Usuarios: Maestro de Obra, Supervisor, Ingeniero, Arquitecto
 * Funciones:
 *   · Registrar avance + fotos
 *   · Subir fotos/videos
 *   · Ver tareas (avances)
 *   · Ver cronograma
 *   · Consultar planos (documentos)
 *   · Reportar incidencias (órdenes de cambio)
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, CircularProgress, Alert,
  TextField, Select, MenuItem, FormControl, InputLabel,
  Avatar, Chip, LinearProgress, IconButton, Snackbar,
  Dialog, DialogTitle, DialogContent, DialogActions,
  List, ListItem, ListItemText, ListItemAvatar, Divider,
} from '@mui/material';
import ArrowBackIcon         from '@mui/icons-material/ArrowBack';
import CameraAltIcon         from '@mui/icons-material/CameraAlt';
import VideoCallIcon         from '@mui/icons-material/VideoCall';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import CalendarMonthIcon     from '@mui/icons-material/CalendarMonth';
import FolderOpenIcon        from '@mui/icons-material/FolderOpen';
import ReportProblemIcon     from '@mui/icons-material/ReportProblem';
import AddCircleOutlineIcon  from '@mui/icons-material/AddCircleOutlined';
import ConstructionIcon      from '@mui/icons-material/Construction';
import TimelineIcon          from '@mui/icons-material/Timeline';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import CheckCircleIcon       from '@mui/icons-material/CheckCircle';
import DownloadIcon          from '@mui/icons-material/Download';
import { useAuth } from '../../context/AuthContext';
import { proyectosApi, avancesApi, documentosApi, ordenesApi } from '../../api/endpoints';

const ACCENT   = '#2563EB';
const API_BASE = 'http://localhost:5115';

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtDate = d => d ? new Date(d).toLocaleDateString('es-CR', { day:'2-digit', month:'short', year:'numeric' }) : '—';

// ── Action Button — grande, touch-friendly ────────────────────────────────────
function ActionBtn({ icon, label, sublabel, color = ACCENT, onClick, disabled }) {
  return (
    <Box
      onClick={disabled ? undefined : onClick}
      sx={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 1, p: 2.5, borderRadius: '16px',
        bgcolor: '#fff', border: `2px solid ${disabled ? '#E2E8F0' : color}20`,
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'all 0.15s',
        '&:active': { transform: disabled ? 'none' : 'scale(0.97)', bgcolor: `${color}08` },
        minHeight: 120,
      }}
    >
      <Box sx={{
        width: 52, height: 52, borderRadius: '14px',
        bgcolor: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {icon}
      </Box>
      <Box sx={{ textAlign: 'center' }}>
        <Typography fontSize={14} fontWeight={700} color="text.primary">{label}</Typography>
        {sublabel && <Typography fontSize={11.5} color="text.secondary">{sublabel}</Typography>}
      </Box>
    </Box>
  );
}

// ── View: Proyecto selector ───────────────────────────────────────────────────
function ProyectoSelector({ onSelect }) {
  const [proyectos, setProyectos] = useState([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    proyectosApi.getMios()
      .then(r => setProyectos(r.data?.filter(p => p.estado === 'EnCurso') ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
      <CircularProgress size={40} />
    </Box>
  );

  if (proyectos.length === 0) return (
    <Box sx={{ textAlign: 'center', mt: 6, px: 3 }}>
      <ConstructionIcon sx={{ fontSize: 56, color: '#CBD5E1', mb: 2 }} />
      <Typography fontSize={16} fontWeight={600} color="text.secondary">Sin proyectos en curso</Typography>
      <Typography fontSize={13.5} color="text.secondary" sx={{ mt: 1 }}>
        No tienes proyectos activos asignados en este momento.
      </Typography>
    </Box>
  );

  return (
    <Box>
      <Typography fontSize={16} fontWeight={700} sx={{ mb: 2, px: 1 }}>Seleccioná el proyecto</Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
        {proyectos.map(p => (
          <Box key={p.id} onClick={() => onSelect(p)}
            sx={{
              bgcolor: '#fff', border: '2px solid #E2E8F0', borderRadius: '12px',
              p: 2.5, cursor: 'pointer',
              '&:active': { borderColor: ACCENT, bgcolor: '#EFF6FF' },
              transition: 'all 0.1s',
            }}>
            <Typography fontSize={15} fontWeight={700}>{p.titulo}</Typography>
            <Typography fontSize={13} color="text.secondary" sx={{ mt: 0.3 }}>
              {[p.canton, p.provincia].filter(Boolean).join(', ')}
              {p.areaM2 && ` · ${p.areaM2} m²`}
            </Typography>
            <Chip label="En curso" size="small"
              sx={{ mt: 1, bgcolor: '#DBEAFE', color: '#1D4ED8', fontWeight: 700, fontSize: 11 }} />
          </Box>
        ))}
      </Box>
    </Box>
  );
}

// ── View: Registrar avance ────────────────────────────────────────────────────
function RegistrarAvance({ proyecto, onBack, notify }) {
  const fileRef  = useRef(null);
  const [form,   setForm]   = useState({ titulo:'', descripcion:'', responsable:'', porcentajeAvance:50 });
  const [fotos,  setFotos]  = useState([]);
  const [saving, setSaving] = useState(false);

  const handleFoto = (e) => {
    Array.from(e.target.files).forEach(file => {
      const reader = new FileReader();
      reader.onload = ev => setFotos(prev => [...prev, { file, preview: ev.target.result, base64: ev.target.result }]);
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const handleGuardar = async () => {
    if (!form.titulo) return;
    setSaving(true);
    try {
      await avancesApi.create({
        proyectoId:       proyecto.id,
        titulo:           form.titulo,
        descripcion:      form.descripcion,
        responsable:      form.responsable || null,
        porcentajeAvance: parseInt(form.porcentajeAvance),
        fotos: fotos.map(f => ({ base64: f.base64, nombre: f.file.name, tipo: f.file.type.startsWith('video') ? 'video' : 'foto', tamanioBytes: f.file.size })),
      });
      notify('✅ Avance registrado');
      onBack();
    } catch { notify('Error al guardar', 'error'); }
    finally { setSaving(false); }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography fontSize={16} fontWeight={700}>Registrar avance</Typography>
      <Typography fontSize={13} color="text.secondary" sx={{ mt: -1 }}>{proyecto.titulo}</Typography>

      <TextField fullWidth label="Título del avance *" placeholder="¿Qué se logró hoy?"
        value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
        inputProps={{ style: { fontSize: 16 } }} />

      <TextField fullWidth multiline rows={3} label="Descripción"
        placeholder="Detalle del trabajo realizado..."
        value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} />

      <TextField fullWidth label="Responsable" placeholder="Nombre del responsable"
        value={form.responsable} onChange={e => setForm(f => ({ ...f, responsable: e.target.value }))} />

      <Box>
        <Typography fontSize={13} fontWeight={600} sx={{ mb: 0.75 }}>
          % Avance total: <strong style={{ color: ACCENT }}>{form.porcentajeAvance}%</strong>
        </Typography>
        <input type="range" min={0} max={100} value={form.porcentajeAvance}
          onChange={e => setForm(f => ({ ...f, porcentajeAvance: e.target.value }))}
          style={{ width: '100%', accentColor: ACCENT, height: 6 }} />
      </Box>

      {/* Fotos */}
      <Box>
        <input ref={fileRef} type="file" accept="image/*,video/*" multiple hidden onChange={handleFoto} capture="environment" />
        <Button fullWidth variant="outlined" size="large" startIcon={<CameraAltIcon />}
          onClick={() => fileRef.current.click()}
          sx={{ py: 1.5, fontSize: 15, borderRadius: '12px', borderWidth: 2,
            '&:hover': { borderWidth: 2 } }}>
          Tomar foto / video
        </Button>
        {fotos.length > 0 && (
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
            {fotos.map((f, i) => (
              <Box key={i} sx={{ position: 'relative' }}>
                <Box component="img" src={f.preview}
                  sx={{ width: 72, height: 72, objectFit: 'cover', borderRadius: '10px', border: '2px solid #E2E8F0' }} />
                <IconButton size="small" onClick={() => setFotos(prev => prev.filter((_, idx) => idx !== i))}
                  sx={{ position: 'absolute', top: -8, right: -8, bgcolor: '#fff', p: '2px',
                    border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }}>
                  <Typography fontSize={11} fontWeight={700} sx={{ color: '#EF4444', lineHeight: 1, px: 0.25 }}>✕</Typography>
                </IconButton>
              </Box>
            ))}
          </Box>
        )}
      </Box>

      <Button fullWidth variant="contained" size="large" onClick={handleGuardar}
        disabled={saving || !form.titulo}
        sx={{ py: 2, fontSize: 16, fontWeight: 700, borderRadius: '14px',
          bgcolor: ACCENT, '&:hover': { bgcolor: '#1D4ED8' } }}>
        {saving ? <CircularProgress size={22} color="inherit" /> : '✅ Guardar avance'}
      </Button>
    </Box>
  );
}

// ── View: Ver avances ─────────────────────────────────────────────────────────
function VerAvances({ proyecto }) {
  const [avances,  setAvances]  = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    avancesApi.getByProyecto(proyecto.id)
      .then(r => setAvances(r.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [proyecto.id]);

  const ultimo = avances[0];
  const pct    = ultimo?.porcentajeAvance ?? 0;

  if (loading) return <LinearProgress />;

  return (
    <Box>
      <Box sx={{ bgcolor: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '12px', p: 2, mb: 2.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.75 }}>
          <Typography fontWeight={700} sx={{ color: '#1E40AF' }}>Progreso general</Typography>
          <Typography fontSize={28} fontWeight={800} sx={{ color: ACCENT, lineHeight: 1 }}>{pct}%</Typography>
        </Box>
        <LinearProgress variant="determinate" value={pct}
          sx={{ height: 10, borderRadius: 5, bgcolor: '#BFDBFE',
            '& .MuiLinearProgress-bar': { bgcolor: ACCENT, borderRadius: 5 } }} />
      </Box>
      {avances.length === 0 ? (
        <Typography color="text.secondary" textAlign="center" py={4}>Sin avances registrados.</Typography>
      ) : (
        avances.map(a => (
          <Box key={a.id} sx={{ bgcolor: '#fff', border: '1px solid #E2E8F0', borderRadius: '10px', p: 2, mb: 1.25 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box>
                <Chip label={`${a.porcentajeAvance}%`} size="small"
                  sx={{ bgcolor: '#DBEAFE', color: '#1D4ED8', fontWeight: 700, fontSize: 11, mb: 0.5 }} />
                <Typography fontSize={14} fontWeight={700}>{a.titulo}</Typography>
                <Typography fontSize={13} color="text.secondary" sx={{ mt: 0.25 }}>{a.descripcion}</Typography>
              </Box>
            </Box>
            <Typography fontSize={12} color="text.disabled" sx={{ mt: 0.75 }}>
              {a.responsable && `👤 ${a.responsable} · `}{fmtDate(a.fecha)}
            </Typography>
          </Box>
        ))
      )}
    </Box>
  );
}

// ── View: Ver documentos (planos) ─────────────────────────────────────────────
function VerPlanos({ proyecto }) {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    documentosApi.getByProyecto(proyecto.id, { categoria: 'Planos' })
      .then(r => setDocs(r.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [proyecto.id]);

  if (loading) return <LinearProgress />;

  return (
    <Box>
      <Typography fontSize={14} color="text.secondary" sx={{ mb: 2 }}>
        Planos y diseños disponibles para consulta
      </Typography>
      {docs.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 5 }}>
          <FolderOpenIcon sx={{ fontSize: 48, color: '#CBD5E1', mb: 1.5 }} />
          <Typography color="text.secondary">No hay planos cargados para este proyecto.</Typography>
        </Box>
      ) : (
        docs.map(d => (
          <Box key={d.id} sx={{ bgcolor: '#fff', border: '1px solid #E2E8F0', borderRadius: '10px', p: 2, mb: 1,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography fontSize={14} fontWeight={600}>{d.nombreArchivo}</Typography>
              <Typography fontSize={12} color="text.secondary">v{d.version} · {fmtDate(d.fechaSubida)}</Typography>
            </Box>
            <Button size="small" variant="outlined" startIcon={<DownloadIcon sx={{ fontSize: 14 }} />}
              onClick={() => window.open(`${API_BASE}${d.url}`, '_blank')}
              sx={{ fontSize: 12, borderRadius: '8px' }}>
              Ver
            </Button>
          </Box>
        ))
      )}
    </Box>
  );
}

// ── View: Reportar incidencia (orden de cambio) ───────────────────────────────
function ReportarIncidencia({ proyecto, onBack, notify }) {
  const [form,   setForm]   = useState({ titulo:'', descripcion:'', impactoEconomico:0, impactoCronogramaDias:0 });
  const [saving, setSaving] = useState(false);

  const handleGuardar = async () => {
    if (!form.titulo) return;
    setSaving(true);
    try {
      await ordenesApi.create({
        proyectoId:            proyecto.id,
        titulo:                form.titulo,
        descripcion:           form.descripcion,
        impactoEconomico:      parseFloat(form.impactoEconomico) || 0,
        impactoCronogramaDias: parseInt(form.impactoCronogramaDias) || 0,
      });
      notify('✅ Incidencia reportada');
      onBack();
    } catch { notify('Error al reportar', 'error'); }
    finally { setSaving(false); }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography fontSize={16} fontWeight={700}>Reportar incidencia</Typography>
      <Alert severity="info" sx={{ borderRadius: '10px', fontSize: 13 }}>
        Usá este formulario para reportar cambios, imprevistos o problemas que afecten el proyecto.
      </Alert>

      <TextField fullWidth label="Título de la incidencia *"
        placeholder="Ej: Daño en tubería, cambio en material..."
        value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))} />

      <TextField fullWidth multiline rows={4} label="Descripción detallada"
        placeholder="Explicá qué pasó, cómo afecta el proyecto y qué se necesita..."
        value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} />

      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
        <TextField label="Impacto económico (₡)" type="number"
          value={form.impactoEconomico}
          onChange={e => setForm(f => ({ ...f, impactoEconomico: e.target.value }))}
          helperText="Costo adicional estimado" />
        <TextField label="Días adicionales" type="number"
          value={form.impactoCronogramaDias}
          onChange={e => setForm(f => ({ ...f, impactoCronogramaDias: e.target.value }))}
          helperText="Días de retraso" />
      </Box>

      <Button fullWidth variant="contained" size="large" onClick={handleGuardar}
        disabled={saving || !form.titulo}
        sx={{ py: 2, fontSize: 16, fontWeight: 700, borderRadius: '14px',
          bgcolor: '#DC2626', '&:hover': { bgcolor: '#B91C1C' } }}>
        {saving ? <CircularProgress size={22} color="inherit" /> : '📤 Enviar reporte'}
      </Button>
    </Box>
  );
}

// ── Main Campo App ────────────────────────────────────────────────────────────
export default function CampoApp() {
  const { usuario }     = useAuth();
  const navigate        = useNavigate();
  const [proyecto,      setProyecto]    = useState(null);
  const [view,          setView]        = useState('menu');   // menu | avance | verAvances | planos | incidencia
  const [toast,         setToast]       = useState({ open: false, msg: '', severity: 'success' });
  const notify = (msg, severity = 'success') => setToast({ open: true, msg, severity });

  const handleBack = () => setView('menu');

  return (
    <Box sx={{
      minHeight: '100vh', bgcolor: '#F1F5F9',
      fontFamily: '"Roboto", sans-serif',
      maxWidth: 500, mx: 'auto',
    }}>
      {/* Header */}
      <Box sx={{
        bgcolor: '#0F1629', color: '#fff', px: 2, pt: 'env(safe-area-inset-top, 0px)',
        pb: 2, position: 'sticky', top: 0, zIndex: 100,
        boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pt: 1.5 }}>
          {(view !== 'menu' || proyecto) && (
            <IconButton size="small" onClick={proyecto && view !== 'menu' ? handleBack : () => setProyecto(null)}
              sx={{ color: '#fff', p: 0.5 }}>
              <ArrowBackIcon />
            </IconButton>
          )}
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ConstructionIcon sx={{ fontSize: 18, color: ACCENT }} />
              <Typography fontSize={16} fontWeight={800} sx={{ color: '#fff' }}>ConstruApp Field</Typography>
            </Box>
            {proyecto && (
              <Typography fontSize={12} sx={{ color: 'rgba(255,255,255,0.6)', mt: 0.1 }} noWrap>
                {proyecto.titulo}
              </Typography>
            )}
          </Box>
          {usuario && (
            <Avatar sx={{ width: 32, height: 32, bgcolor: ACCENT, fontSize: 13, fontWeight: 700 }}>
              {usuario.nombre?.[0]?.toUpperCase()}
            </Avatar>
          )}
        </Box>
      </Box>

      {/* Content */}
      <Box sx={{ px: 2, pt: 2.5, pb: 4 }}>
        {/* Paso 1: seleccionar proyecto */}
        {!proyecto && (
          <ProyectoSelector onSelect={(p) => { setProyecto(p); setView('menu'); }} />
        )}

        {/* Paso 2: menú principal */}
        {proyecto && view === 'menu' && (
          <Box>
            <Box sx={{ bgcolor: '#fff', border: '1px solid #E2E8F0', borderRadius: '12px', p: 2, mb: 3 }}>
              <Typography fontSize={12} color="text.secondary">Proyecto activo</Typography>
              <Typography fontSize={16} fontWeight={800}>{proyecto.titulo}</Typography>
              <Typography fontSize={13} color="text.secondary">{[proyecto.canton, proyecto.provincia].filter(Boolean).join(', ')}</Typography>
            </Box>

            <Typography fontSize={13} fontWeight={700} color="text.secondary"
              sx={{ textTransform: 'uppercase', letterSpacing: '0.07em', mb: 1.5 }}>
              ¿Qué querés hacer?
            </Typography>

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
              <ActionBtn
                icon={<AssignmentTurnedInIcon sx={{ fontSize: 26, color: ACCENT }} />}
                label="Registrar avance"
                sublabel="+ foto/video"
                color={ACCENT}
                onClick={() => setView('avance')}
              />
              <ActionBtn
                icon={<TimelineIcon sx={{ fontSize: 26, color: '#7C3AED' }} />}
                label="Ver avances"
                sublabel="Historial"
                color="#7C3AED"
                onClick={() => setView('verAvances')}
              />
              <ActionBtn
                icon={<FolderOpenIcon sx={{ fontSize: 26, color: '#059669' }} />}
                label="Ver planos"
                sublabel="Documentos"
                color="#059669"
                onClick={() => setView('planos')}
              />
              <ActionBtn
                icon={<ReportProblemIcon sx={{ fontSize: 26, color: '#DC2626' }} />}
                label="Reportar incidencia"
                sublabel="Orden de cambio"
                color="#DC2626"
                onClick={() => setView('incidencia')}
              />
              <ActionBtn
                icon={<CalendarMonthIcon sx={{ fontSize: 26, color: '#D97706' }} />}
                label="Cronograma"
                sublabel="Ir a la app"
                color="#D97706"
                onClick={() => navigate('/cronograma')}
              />
              <ActionBtn
                icon={<CameraAltIcon sx={{ fontSize: 26, color: '#DB2777' }} />}
                label="Subir fotos"
                sublabel="Galería del proyecto"
                color="#DB2777"
                onClick={() => navigate(`/obra/${proyecto.id}`, { state: { tab: 5 } })}
              />
            </Box>

            {/* Link a workspace completo */}
            <Button fullWidth variant="outlined" size="large"
              onClick={() => navigate(`/obra/${proyecto.id}`)}
              sx={{ mt: 3, py: 1.75, fontSize: 14, fontWeight: 700, borderRadius: '14px', borderWidth: 2,
                '&:hover': { borderWidth: 2 } }}>
              🏗️ Workspace completo del proyecto
            </Button>
          </Box>
        )}

        {/* Views */}
        {proyecto && view === 'avance'      && <RegistrarAvance proyecto={proyecto} onBack={handleBack} notify={notify} />}
        {proyecto && view === 'verAvances'  && <VerAvances     proyecto={proyecto} />}
        {proyecto && view === 'planos'      && <VerPlanos      proyecto={proyecto} />}
        {proyecto && view === 'incidencia'  && <ReportarIncidencia proyecto={proyecto} onBack={handleBack} notify={notify} />}
      </Box>

      {/* Toast */}
      <Snackbar open={toast.open} autoHideDuration={3500}
        onClose={() => setToast(t => ({ ...t, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={toast.severity} onClose={() => setToast(t => ({ ...t, open: false }))}
          sx={{ width: '100%', borderRadius: '12px', fontSize: 14 }}>
          {toast.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
