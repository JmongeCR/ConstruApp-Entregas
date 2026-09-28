import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box, Typography, Card, CardContent, Grid, Button, Chip,
  Divider, Avatar, Rating, LinearProgress, Alert, Snackbar,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  IconButton, Tooltip, ImageList, ImageListItem, InputBase,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
} from '@mui/material';
import SearchIcon   from '@mui/icons-material/Search';
import CloseIcon    from '@mui/icons-material/Close';
import FilterListIcon from '@mui/icons-material/FilterList';
import CheckCircleIcon        from '@mui/icons-material/CheckCircle';
import CancelIcon             from '@mui/icons-material/Cancel';
import ConstructionIcon       from '@mui/icons-material/Construction';
import SendIcon               from '@mui/icons-material/Send';
import ArrowBackIcon          from '@mui/icons-material/ArrowBack';
import StorefrontIcon         from '@mui/icons-material/Storefront';
import FlagIcon               from '@mui/icons-material/Flag';
import StarIcon               from '@mui/icons-material/Star';
import AddPhotoAlternateIcon  from '@mui/icons-material/AddPhotoAlternate';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlined';
import EmojiEventsIcon        from '@mui/icons-material/EmojiEvents';
import { propuestasApi, proyectosApi, calificacionesApi } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';

const ACCENT = '#2563EB';

const ESTADO_STYLE = {
  Enviada:    { bg: '#EFF6FF', color: '#1D4ED8', label: 'Enviada'    },
  Vista:      { bg: '#F5F3FF', color: '#6D28D9', label: 'Vista'      },
  Aceptada:   { bg: '#DCFCE7', color: '#166534', label: 'En curso ✓' },
  Rechazada:  { bg: '#FEE2E2', color: '#991B1B', label: 'Rechazada'  },
  Retirada:   { bg: '#F3F4F6', color: '#6B7280', label: 'Retirada'   },
  Finalizada: { bg: '#FEF9C3', color: '#854D0E', label: 'Finalizada' },
};

const PROYECTO_ESTADO = {
  Completado: { bg: '#DCFCE7', color: '#166534', label: 'Completado' },
  EnCurso:    { bg: '#DBEAFE', color: '#1D4ED8', label: 'En ejecución' },
};

// ── Uploader de fotos ──────────────────────────────────────────────────────
function FotoUploader({ proyectoId, onUploaded }) {
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [fotos, setFotos]         = useState([]);

  useEffect(() => {
    proyectosApi.getFotos(proyectoId).then(r => setFotos(r.data)).catch(() => {});
  }, [proyectoId]);

  const handleFile = async (e) => {
    const files = Array.from(e.target.files);
    setUploading(true);
    for (const file of files) {
      const reader = new FileReader();
      await new Promise(res => { reader.onload = res; reader.readAsDataURL(file); });
      const base64 = reader.result.split(',')[1];
      try {
        const { data } = await proyectosApi.subirFoto(proyectoId, {
          base64, mimeType: file.type, nombreOriginal: file.name,
        });
        setFotos(prev => [data, ...prev]);
        onUploaded?.();
      } catch {}
    }
    setUploading(false);
    e.target.value = '';
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.25 }}>
        <Typography fontSize={12.5} fontWeight={600} color="text.secondary">Fotos de avance</Typography>
        <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={handleFile} />
        <Tooltip title="Subir fotos">
          <IconButton size="small" onClick={() => fileRef.current.click()} disabled={uploading}
            sx={{ color: '#6B7280', '&:hover': { color: ACCENT, bgcolor: '#EFF6FF' } }}>
            <AddPhotoAlternateIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Tooltip>
        {uploading && <Typography variant="caption" color="text.secondary">Subiendo…</Typography>}
      </Box>
      {fotos.length > 0 ? (
        <ImageList cols={3} gap={4} sx={{ borderRadius: 1, overflow: 'hidden', mb: 0 }}>
          {fotos.map(f => (
            <ImageListItem key={f.id} sx={{ cursor: 'pointer' }}
              onClick={() => window.open(`http://localhost:5115${f.url}`, '_blank')}>
              <img src={`http://localhost:5115${f.url}`} alt={f.nombreArchivo}
                style={{ width: '100%', height: 70, objectFit: 'cover' }}
                onError={e => { e.target.style.display = 'none'; }} />
            </ImageListItem>
          ))}
        </ImageList>
      ) : (
        <Typography variant="caption" color="text.disabled">Sin fotos aún.</Typography>
      )}
    </Box>
  );
}

// ── Modal calificar ────────────────────────────────────────────────────────
function ModalCalificar({ open, onClose, propuesta, proyectoId, onCalificado }) {
  const [estrellas, setEstrellas] = useState(5);
  const [comentario, setComentario] = useState('');
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState('');

  const handleGuardar = async () => {
    setSaving(true); setError('');
    try {
      await calificacionesApi.create({
        proyectoId,
        propuestaId: propuesta.id,
        evaluadoId:  propuesta.constructorUsuarioId,
        puntuacion:  estrellas,
        comentario:  comentario || null,
      });
      onCalificado();
      onClose();
    } catch (e) {
      setError(e.response?.data?.message || 'Error al guardar.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, fontSize: 15 }}>Calificar al constructor</DialogTitle>
      <DialogContent sx={{ pt: '8px !important' }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Tu calificación es pública y ayuda a otros clientes a tomar mejores decisiones.
        </Typography>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
            ¿Cuántas estrellas le das?
          </Typography>
          <Rating value={estrellas} onChange={(_, v) => setEstrellas(v)} size="large" sx={{ fontSize: 40 }} />
          <Typography variant="body2" fontWeight={600} sx={{ mt: 0.5 }}>
            {['', 'Muy malo', 'Malo', 'Regular', 'Bueno', 'Excelente'][estrellas]}
          </Typography>
        </Box>
        <TextField fullWidth multiline rows={3}
          label="Comentario (opcional)"
          placeholder="¿Qué tal fue la experiencia? Puntualidad, calidad, comunicación…"
          value={comentario} onChange={e => setComentario(e.target.value)} />
        {error && <Alert severity="error" sx={{ mt: 1.5 }}>{error}</Alert>}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={handleGuardar} disabled={saving} startIcon={<StarIcon />}>
          {saving ? 'Guardando…' : 'Publicar calificación'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// VISTA CLIENTE: propuestas recibidas en un proyecto
// ═══════════════════════════════════════════════════════════════════════════
export function PropuestasProyecto() {
  const { proyectoId }  = useParams();
  const navigate        = useNavigate();
  const [propuestas,  setPropuestas]  = useState([]);
  const [proyecto,    setProyecto]    = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [calModal,    setCalModal]    = useState(null);
  const [calificadas, setCalificadas] = useState(new Set());
  const [toast, setToast] = useState({ open: false, msg: '', severity: 'success' });
  const notify = (msg, severity = 'success') => setToast({ open: true, msg, severity });

  const cargar = () => Promise.all([
    propuestasApi.getByProyecto(proyectoId).then(r => setPropuestas(r.data)),
    proyectosApi.getById(proyectoId).then(r => setProyecto(r.data)),
  ]).catch(() => {}).finally(() => setLoading(false));

  useEffect(() => { cargar(); }, [proyectoId]);

  useEffect(() => {
    calificacionesApi.getByProyecto(proyectoId)
      .then(r => setCalificadas(new Set(r.data.map(c => c.evaluadoId))))
      .catch(() => {});
  }, [proyectoId]);

  const handleEstado = async (id, estado) => {
    try {
      await propuestasApi.cambiarEstado(id, estado);
      await cargar();
      notify(estado === 'Aceptada' ? '¡Propuesta aceptada! El proyecto está en curso.' : 'Propuesta rechazada.');
    } catch { notify('Error al actualizar.', 'error'); }
  };

  if (loading) return <LinearProgress />;

  const proyectoCompletado = proyecto?.estado === 'Completado';
  const estadoProj = PROYECTO_ESTADO[proyecto?.estado];

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/mis-proyectos')}
          sx={{ color: '#6B7280' }}>
          Mis proyectos
        </Button>
        <Divider orientation="vertical" flexItem sx={{ my: 0.5 }} />
        <Box sx={{ flex: 1 }}>
          <Typography variant="h5" fontWeight={700}>{proyecto?.titulo}</Typography>
          <Typography color="text.secondary" fontSize={13}>
            {propuestas.length} propuesta(s) recibida(s)
          </Typography>
        </Box>
        {estadoProj && (
          <Chip label={estadoProj.label} size="small"
            sx={{ bgcolor: estadoProj.bg, color: estadoProj.color, fontWeight: 600 }} />
        )}
      </Box>

      {/* Banner completado */}
      {proyectoCompletado && (
        <Box sx={{
          display: 'flex', alignItems: 'center', gap: 2,
          bgcolor: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 1.5,
          px: 2.5, py: 1.75, mb: 2.5,
        }}>
          <EmojiEventsIcon sx={{ color: '#16A34A', flexShrink: 0 }} />
          <Box>
            <Typography fontWeight={600} fontSize={13.5} color="#166534">¡Proyecto completado!</Typography>
            <Typography fontSize={12.5} color="#166534" sx={{ opacity: 0.8 }}>
              Podés calificar al constructor. Tu opinión ayuda a la comunidad.
            </Typography>
          </Box>
        </Box>
      )}

      {propuestas.length === 0 ? (
        <Box sx={{ bgcolor: '#fff', border: '1px solid #E5E7EB', borderRadius: 1.5, py: 8, textAlign: 'center' }}>
          <SendIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
          <Typography color="text.secondary" fontSize={13}>Aún no recibiste propuestas.</Typography>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {propuestas.map(p => {
            const est = ESTADO_STYLE[p.estado] ?? { bg: '#F3F4F6', color: '#6B7280', label: p.estado };
            const yaCalificado = calificadas.has(p.constructorUsuarioId);
            const esActiva = p.estado === 'Aceptada' || p.estado === 'Finalizada';
            return (
              <Grid size={{ xs: 12, md: 6 }} key={p.id}>
                <Card sx={{
                  border: esActiva ? `1.5px solid ${ACCENT}` : '1px solid #E5E7EB',
                  '&:hover': { boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
                }}>
                  <CardContent>
                    {/* Header propuesta */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                        <Avatar sx={{ bgcolor: ACCENT, fontWeight: 700, width: 38, height: 38, fontSize: 14 }}>C</Avatar>
                        <Box>
                          <Typography fontWeight={600} fontSize={13.5}>Constructor #{p.constructorId}</Typography>
                          <Rating value={4.5} precision={0.5} size="small" readOnly />
                        </Box>
                      </Box>
                      <Chip label={est.label} size="small"
                        sx={{ bgcolor: est.bg, color: est.color, fontWeight: 600 }} />
                    </Box>

                    {/* Monto */}
                    <Box sx={{ bgcolor: '#F8FAFC', borderRadius: 1, px: 2, py: 1.25, mb: 2, textAlign: 'center' }}>
                      <Typography variant="caption" color="text.secondary">Monto total</Typography>
                      <Typography variant="h5" fontWeight={800} color="text.primary">
                        ₡{p.montoTotal?.toLocaleString('es-CR')}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Plazo: {p.plazoEstimadoDias} días
                      </Typography>
                    </Box>

                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{p.descripcion}</Typography>
                    {p.incluye && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
                        Incluye: {p.incluye}
                      </Typography>
                    )}

                    {esActiva && (
                      <>
                        <Divider sx={{ mb: 1.5 }} />
                        <FotoUploader proyectoId={p.proyectoId} />
                      </>
                    )}
                  </CardContent>

                  {(p.estado === 'Enviada' || p.estado === 'Vista') && (
                    <>
                      <Divider />
                      <Box sx={{ p: 2, display: 'flex', gap: 1 }}>
                        <Button variant="contained" color="success" size="small"
                          startIcon={<CheckCircleIcon />} onClick={() => handleEstado(p.id, 'Aceptada')}>
                          Aceptar
                        </Button>
                        <Button variant="outlined" color="error" size="small"
                          startIcon={<CancelIcon />} onClick={() => handleEstado(p.id, 'Rechazada')}>
                          Rechazar
                        </Button>
                      </Box>
                    </>
                  )}

                  {proyectoCompletado && esActiva && (
                    <>
                      <Divider />
                      <Box sx={{ p: 2 }}>
                        {yaCalificado ? (
                          <Chip icon={<CheckCircleOutlineIcon />} label="Ya calificaste a este constructor"
                            sx={{ bgcolor: '#DCFCE7', color: '#166534', fontWeight: 600 }} />
                        ) : (
                          <Button variant="contained" fullWidth startIcon={<StarIcon />}
                            onClick={() => setCalModal(p)}>
                            Calificar constructor
                          </Button>
                        )}
                      </Box>
                    </>
                  )}
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {calModal && (
        <ModalCalificar open={Boolean(calModal)} onClose={() => setCalModal(null)}
          propuesta={calModal} proyectoId={parseInt(proyectoId)}
          onCalificado={() => {
            notify('¡Calificación publicada!');
            setCalificadas(prev => new Set([...prev, calModal.constructorUsuarioId]));
          }} />
      )}

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

// ═══════════════════════════════════════════════════════════════════════════
// VISTA CONSTRUCTOR: mis propuestas enviadas → tabla
// ═══════════════════════════════════════════════════════════════════════════
export function MisPropuestas() {
  const navigate                        = useNavigate();
  const [searchParams]                  = useSearchParams();
  const [propuestas, setPropuestas]     = useState([]);
  const [proyectos,  setProyectos]      = useState({});
  const [loading,    setLoading]        = useState(true);
  const [openForm,   setOpenForm]       = useState(false);
  const [proyectoId, setProyectoId]     = useState('');
  const [proyectoInfo, setProyectoInfo] = useState(null);
  const [form, setForm]                 = useState({ montoTotal: '', descripcion: '', incluye: '', plazoEstimadoDias: '' });
  const [finDialog, setFinDialog]       = useState(null);
  const [toast, setToast]               = useState({ open: false, msg: '', severity: 'success' });
  const [search,    setSearch]          = useState('');
  const [estadoFilt, setEstadoFilt]     = useState('Todas');
  const notify = (msg, severity = 'success') => setToast({ open: true, msg, severity });

  const cargar = () =>
    propuestasApi.getMias().then(r => setPropuestas(r.data)).catch(() => {}).finally(() => setLoading(false));

  useEffect(() => { cargar(); }, []);

  useEffect(() => {
    const pid = searchParams.get('proyectoId');
    if (!pid) return;
    setProyectoId(pid);
    proyectosApi.getById(pid).then(r => setProyectoInfo(r.data)).catch(() => {});
    setOpenForm(true);
  }, [searchParams]);

  useEffect(() => {
    if (propuestas.length === 0) return;
    const ids = [...new Set(propuestas.map(p => p.proyectoId))];
    Promise.all(ids.map(id =>
      proyectosApi.getById(id)
        .then(r => ({ id, titulo: r.data.titulo, estado: r.data.estado }))
        .catch(() => ({ id, titulo: `Proyecto #${id}`, estado: '' }))
    )).then(results => setProyectos(Object.fromEntries(results.map(r => [r.id, r]))));
  }, [propuestas]);

  const filtradas = useMemo(() => {
    let list = propuestas;
    if (estadoFilt !== 'Todas') list = list.filter(p => p.estado === estadoFilt);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p => {
        const titulo = proyectos[p.proyectoId]?.titulo?.toLowerCase() ?? '';
        return titulo.includes(q) || p.descripcion?.toLowerCase().includes(q);
      });
    }
    return list;
  }, [propuestas, proyectos, estadoFilt, search]);

  // Conteo por estado para los filtros
  const conteos = useMemo(() => {
    const c = {};
    propuestas.forEach(p => { c[p.estado] = (c[p.estado] || 0) + 1; });
    return c;
  }, [propuestas]);

  const FILTROS = [
    { key: 'Todas', label: 'Todas' },
    { key: 'Enviada', label: 'Enviadas' },
    { key: 'Vista', label: 'Vistas' },
    { key: 'Aceptada', label: 'En curso' },
    { key: 'Finalizada', label: 'Finalizadas' },
    { key: 'Rechazada', label: 'Rechazadas' },
  ];

  const handleEnviar = async () => {
    try {
      const { data } = await propuestasApi.create({
        proyectoId:        parseInt(proyectoId),
        montoTotal:        parseFloat(form.montoTotal),
        descripcion:       form.descripcion,
        incluye:           form.incluye || null,
        plazoEstimadoDias: parseInt(form.plazoEstimadoDias),
      });
      setPropuestas(p => [data, ...p]);
      setOpenForm(false);
      setForm({ montoTotal: '', descripcion: '', incluye: '', plazoEstimadoDias: '' });
      setProyectoInfo(null);
      notify('¡Propuesta enviada con éxito!');
    } catch (e) {
      notify(e.response?.data?.message || 'Error al enviar.', 'error');
    }
  };

  const handleFinalizar = async (propuesta) => {
    try {
      await propuestasApi.finalizar(propuesta.id);
      await cargar();
      setFinDialog(null);
      notify('¡Obra finalizada! El cliente ya puede calificarte.');
    } catch (e) {
      notify(e.response?.data?.message || 'Error al finalizar.', 'error');
    }
  };

  if (loading) return <LinearProgress />;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2.5 }}>
        <Box>
          <Typography variant="h5" fontWeight={800} color="text.primary" sx={{ mb: 0.25, letterSpacing: '-0.3px' }}>
            Mis propuestas
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {propuestas.length} propuesta{propuestas.length !== 1 ? 's' : ''} enviada{propuestas.length !== 1 ? 's' : ''}
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<SendIcon />}
          onClick={() => { setProyectoId(''); setProyectoInfo(null); setOpenForm(true); }}>
          Enviar propuesta
        </Button>
      </Box>

      {propuestas.length === 0 ? (
        <Box sx={{
          bgcolor: '#fff', border: '1px solid #E2E8F0', borderRadius: '12px',
          py: 8, textAlign: 'center',
        }}>
          <Box sx={{
            width: 56, height: 56, borderRadius: '14px', bgcolor: '#F1F5F9',
            display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2,
          }}>
            <SendIcon sx={{ fontSize: 24, color: '#94A3B8' }} />
          </Box>
          <Typography fontWeight={700} fontSize={15} color="text.primary" gutterBottom>
            No has enviado propuestas aún
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 320, mx: 'auto' }}>
            Explorá el Marketplace y encontrá proyectos donde podés cotizar.
          </Typography>
          <Button variant="contained" startIcon={<StorefrontIcon />} onClick={() => navigate('/marketplace')}>
            Ir al Marketplace
          </Button>
        </Box>
      ) : (
        <Box sx={{ bgcolor: '#fff', border: '1px solid #E2E8F0', borderRadius: '12px', overflow: 'hidden' }}>

          {/* Toolbar */}
          <Box sx={{
            display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1.5,
            borderBottom: '1px solid #F1F5F9', flexWrap: 'wrap',
          }}>
            {/* Filtros de estado */}
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', flex: 1 }}>
              {FILTROS.map(f => {
                const count = f.key === 'Todas' ? propuestas.length : (conteos[f.key] ?? 0);
                if (f.key !== 'Todas' && count === 0) return null;
                const active = estadoFilt === f.key;
                return (
                  <Chip
                    key={f.key}
                    label={`${f.label}${count > 0 && f.key !== 'Todas' ? ` · ${count}` : ''}`}
                    size="small"
                    onClick={() => setEstadoFilt(f.key)}
                    sx={{
                      fontSize: 11.5, cursor: 'pointer', transition: 'all .12s',
                      bgcolor: active ? ACCENT : 'transparent',
                      color: active ? '#fff' : '#64748B',
                      border: `1px solid ${active ? ACCENT : '#E2E8F0'}`,
                      fontWeight: active ? 700 : 500,
                      '&:hover': { bgcolor: active ? '#1D4ED8' : '#F8FAFC' },
                    }}
                  />
                );
              })}
            </Box>

            {/* Búsqueda */}
            <Box sx={{
              display: 'flex', alignItems: 'center', gap: 0.75,
              bgcolor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px',
              px: 1.25, height: 32, minWidth: 180,
              transition: '.15s',
              '&:focus-within': { border: `1px solid ${ACCENT}`, bgcolor: '#fff', boxShadow: `0 0 0 3px ${ACCENT}15` },
            }}>
              <SearchIcon sx={{ fontSize: 14, color: '#94A3B8', flexShrink: 0 }} />
              <InputBase
                placeholder="Buscar proyecto…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                sx={{ fontSize: 12.5, flex: 1, '& input': { padding: 0 } }}
              />
              {search && (
                <IconButton size="small" onClick={() => setSearch('')} sx={{ p: 0.2 }}>
                  <CloseIcon sx={{ fontSize: 12, color: '#94A3B8' }} />
                </IconButton>
              )}
            </Box>
          </Box>

          {filtradas.length === 0 ? (
            <Box sx={{ py: 6, textAlign: 'center' }}>
              <FilterListIcon sx={{ fontSize: 28, color: '#CBD5E1', mb: 1 }} />
              <Typography fontSize={13.5} fontWeight={600} color="text.secondary">Sin resultados</Typography>
              <Typography fontSize={12.5} color="text.disabled" sx={{ mt: 0.5 }}>
                Probá ajustar los filtros o la búsqueda
              </Typography>
              <Button size="small" sx={{ mt: 1.5, fontSize: 12 }}
                onClick={() => { setSearch(''); setEstadoFilt('Todas'); }}>
                Limpiar filtros
              </Button>
            </Box>
          ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: '35%' }}>Proyecto</TableCell>
                  <TableCell>Monto</TableCell>
                  <TableCell>Plazo</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Fecha</TableCell>
                  <TableCell align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtradas.map(p => {
                  const est  = ESTADO_STYLE[p.estado] ?? { bg: '#F3F4F6', color: '#6B7280', label: p.estado };
                  const proj = proyectos[p.proyectoId];
                  const esActiva     = p.estado === 'Aceptada';
                  const esFinalizada = p.estado === 'Finalizada';
                  const fecha = p.fechaEnvio
                    ? new Date(p.fechaEnvio).toLocaleDateString('es-CR', { day: 'numeric', month: 'short' })
                    : '—';
                  return (
                    <TableRow key={p.id} sx={{
                      '&:hover': { bgcolor: '#F8FAFC' },
                      borderLeft: esActiva ? `3px solid ${ACCENT}` : '3px solid transparent',
                    }}>
                      <TableCell>
                        <Typography fontSize={13.5} fontWeight={600} sx={{
                          display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                          color: '#0F172A',
                        }}>
                          {proj?.titulo || `Proyecto #${p.proyectoId}`}
                        </Typography>
                        {p.descripcion && (
                          <Typography fontSize={11.5} color="text.secondary" sx={{
                            display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                            mt: 0.15,
                          }}>
                            {p.descripcion}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography fontSize={13.5} fontWeight={700} color={ACCENT}>
                          ₡{(p.montoTotal / 1e6).toFixed(2)}M
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography fontSize={12.5} color="text.secondary">{p.plazoEstimadoDias} días</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={est.label} size="small"
                          sx={{ bgcolor: est.bg, color: est.color, fontWeight: 700 }} />
                      </TableCell>
                      <TableCell>
                        <Typography fontSize={12.5} color="text.secondary">{fecha}</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', gap: 0.25, justifyContent: 'flex-end' }}>
                          {(esActiva || esFinalizada) && (
                            <Tooltip title="Workspace de obra">
                              <IconButton size="small" onClick={() => navigate(`/obra/${p.proyectoId}`)}
                                sx={{ color: '#94A3B8', '&:hover': { color: '#D97706', bgcolor: '#FFFBEB' } }}>
                                <ConstructionIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
                          )}
                          {esActiva && (
                            <Tooltip title="Marcar como finalizada">
                              <IconButton size="small" onClick={() => setFinDialog(p)}
                                sx={{ color: '#94A3B8', '&:hover': { color: '#16A34A', bgcolor: '#F0FDF4' } }}>
                                <FlagIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
          )}
        </Box>
      )}

      {/* Dialog confirmar finalizar */}
      <Dialog open={Boolean(finDialog)} onClose={() => setFinDialog(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, fontSize: 15 }}>¿Finalizar la obra?</DialogTitle>
        <DialogContent>
          <Typography fontSize={13.5} color="text.secondary">
            Esto marcará el proyecto como <strong>Completado</strong> y el cliente podrá calificarte.
            Asegurate de que la obra esté realmente terminada.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setFinDialog(null)}>Cancelar</Button>
          <Button variant="contained" onClick={() => handleFinalizar(finDialog)} startIcon={<FlagIcon />}>
            Finalizar obra
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog enviar propuesta */}
      <Dialog open={openForm} onClose={() => setOpenForm(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, fontSize: 15 }}>
          {proyectoInfo ? `Propuesta: ${proyectoInfo.titulo}` : 'Enviar propuesta'}
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '12px !important' }}>
          {!proyectoInfo && (
            <TextField label="ID del proyecto" value={proyectoId}
              onChange={e => setProyectoId(e.target.value)} type="number" required
              helperText="Encontrá el ID en el Marketplace o en la URL del proyecto" />
          )}
          {proyectoInfo && (
            <Box sx={{ bgcolor: '#F8FAFC', borderRadius: 1, p: 1.5 }}>
              <Typography variant="caption" color="text.secondary">Proyecto</Typography>
              <Typography fontWeight={600} fontSize={13.5}>{proyectoInfo.titulo}</Typography>
              <Typography variant="caption" color="text.secondary">
                {[proyectoInfo.canton, proyectoInfo.provincia].filter(Boolean).join(', ')}
                {proyectoInfo.presupuestoMax && ` · Máx: ₡${proyectoInfo.presupuestoMax?.toLocaleString('es-CR')}`}
              </Typography>
            </Box>
          )}
          <Grid container spacing={2}>
            <Grid size={{ xs: 7 }}>
              <TextField fullWidth label="Monto total (₡)" value={form.montoTotal}
                onChange={e => setForm(f => ({ ...f, montoTotal: e.target.value }))} type="number" required />
            </Grid>
            <Grid size={{ xs: 5 }}>
              <TextField fullWidth label="Plazo (días)" value={form.plazoEstimadoDias}
                onChange={e => setForm(f => ({ ...f, plazoEstimadoDias: e.target.value }))} type="number" required />
            </Grid>
          </Grid>
          <TextField label="Descripción de tu propuesta" multiline rows={3}
            value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
            required placeholder="Tu enfoque, experiencia, y por qué sos la mejor opción..." />
          <TextField label="¿Qué incluye? (materiales, garantía, etc.)" multiline rows={2}
            value={form.incluye} onChange={e => setForm(f => ({ ...f, incluye: e.target.value }))}
            placeholder="Materiales, mano de obra, garantía, planos..." />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setOpenForm(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleEnviar}
            disabled={!form.montoTotal || !form.descripcion || !form.plazoEstimadoDias || (!proyectoInfo && !proyectoId)}>
            Enviar propuesta
          </Button>
        </DialogActions>
      </Dialog>

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
