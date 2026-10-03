import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Card, CardContent, Button, Chip,
  Tabs, Tab, LinearProgress, Alert, Snackbar, Divider,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Avatar, IconButton, Tooltip, ImageList, ImageListItem,
  List, ListItem, ListItemAvatar, ListItemText, ListItemSecondaryAction,
  CircularProgress, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Select, MenuItem, InputAdornment, Grid,
} from '@mui/material';
import ArrowBackIcon         from '@mui/icons-material/ArrowBack';
import AddIcon               from '@mui/icons-material/Add';
import DeleteIcon            from '@mui/icons-material/Delete';
import CheckCircleIcon       from '@mui/icons-material/CheckCircle';
import PeopleIcon            from '@mui/icons-material/People';
import TimelineIcon          from '@mui/icons-material/Timeline';
import PhotoLibraryIcon      from '@mui/icons-material/PhotoLibrary';
import DescriptionIcon       from '@mui/icons-material/Description';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import PersonAddIcon         from '@mui/icons-material/PersonAdd';
import EmojiEventsIcon       from '@mui/icons-material/EmojiEvents';
import PrintIcon             from '@mui/icons-material/Print';
import PhoneIcon             from '@mui/icons-material/Phone';
import FlagIcon              from '@mui/icons-material/Flag';
import ChatIcon              from '@mui/icons-material/Chat';
import SendIcon              from '@mui/icons-material/Send';
import AccountBalanceIcon    from '@mui/icons-material/AccountBalance';
import AttachMoneyIcon       from '@mui/icons-material/AttachMoney';
import WarningAmberIcon      from '@mui/icons-material/WarningAmber';
import TrendingUpIcon        from '@mui/icons-material/TrendingUp';
import AttachFileIcon        from '@mui/icons-material/AttachFile';
import ChangeCircleIcon    from '@mui/icons-material/ChangeCircle';
import GroupAddIcon         from '@mui/icons-material/GroupAdd';
import EmailIcon            from '@mui/icons-material/Email';
import BadgeIcon            from '@mui/icons-material/Badge';
import {
  proyectosApi, avancesApi, empleadosApi, cartaApi, propuestasApi,
  mensajesApi, presupuestoApi, ordenesApi, equipoProyectoApi,
} from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';

const ACCENT   = '#2563EB';
const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') ?? 'http://localhost:5115';

// ── helpers ───────────────────────────────────────────────────────────────────
const fmtDate  = d => d ? new Date(d).toLocaleDateString('es-CR',
  { day:'2-digit', month:'short', year:'numeric' }) : '—';
const fmtTime  = d => d ? new Date(d).toLocaleTimeString('es-CR',
  { hour: '2-digit', minute: '2-digit' }) : '';
const fmtMonto = v => v != null ? `₡${Number(v).toLocaleString('es-CR')}` : '—';
const fmtMontoK = v => {
  if (!v && v !== 0) return '₡0';
  if (v >= 1e6) return `₡${(v/1e6).toFixed(1)}M`;
  if (v >= 1e3) return `₡${(v/1e3).toFixed(0)}K`;
  return `₡${v}`;
};

function TabPanel({ children, value, index }) {
  return value === index ? <Box sx={{ py: 2 }}>{children}</Box> : null;
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 0 — AVANCES (enhanced: photos, responsable, titulo)
// ═══════════════════════════════════════════════════════════════════════════════
function TabAvances({ proyectoId, esConstructor, proyectoEstado, notify }) {
  const fileRef     = useRef(null);
  const [avances,   setAvances]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [open,      setOpen]      = useState(false);
  const [form,      setForm]      = useState({ titulo: '', descripcion: '', responsable: '', porcentajeAvance: 50 });
  const [fotos,     setFotos]     = useState([]);   // array de {file, preview}
  const [saving,    setSaving]    = useState(false);
  const [lightbox,  setLightbox]  = useState(null); // URL de foto ampliada

  const cargar = () =>
    avancesApi.getByProyecto(proyectoId)
      .then(r => setAvances(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));

  useEffect(() => { cargar(); }, [proyectoId]);

  const porcentajeMax = avances.length > 0
    ? Math.max(...avances.map(a => a.porcentajeAvance))
    : 0;

  const handleFotoSelect = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => setFotos(prev => [...prev, { file, preview: ev.target.result, base64: ev.target.result }]);
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const handleCrear = async () => {
    setSaving(true);
    try {
      const fotosPayload = fotos.map(f => ({
        base64: f.base64,
        nombre: f.file.name,
        tipo: f.file.type.startsWith('video') ? 'video' : 'foto',
        tamanioBytes: f.file.size,
      }));

      await avancesApi.create({
        proyectoId:       parseInt(proyectoId),
        titulo:           form.titulo || 'Avance registrado',
        descripcion:      form.descripcion,
        responsable:      form.responsable || null,
        porcentajeAvance: parseInt(form.porcentajeAvance),
        fotos:            fotosPayload.length > 0 ? fotosPayload : null,
      });
      await cargar();
      setOpen(false);
      setForm({ titulo: '', descripcion: '', responsable: '', porcentajeAvance: 50 });
      setFotos([]);
      notify('Avance registrado con éxito.');
    } catch (e) {
      notify(e.response?.data?.message || 'Error al guardar.', 'error');
    } finally { setSaving(false); }
  };

  const handleEliminar = async (id) => {
    try {
      await avancesApi.delete(id);
      setAvances(prev => prev.filter(a => a.id !== id));
      notify('Avance eliminado.');
    } catch { notify('Error al eliminar.', 'error'); }
  };

  if (loading) return <LinearProgress />;

  return (
    <Box>
      {/* Progress banner */}
      <Box sx={{ bgcolor: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '8px', p: 2.5, mb: 2.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography fontWeight={700} sx={{ color: '#1E40AF' }}>Progreso general</Typography>
          <Typography fontWeight={800} fontSize={28} sx={{ color: ACCENT, lineHeight: 1 }}>{porcentajeMax}%</Typography>
        </Box>
        <LinearProgress variant="determinate" value={porcentajeMax}
          sx={{ height: 10, borderRadius: 5, bgcolor: '#BFDBFE',
            '& .MuiLinearProgress-bar': { bgcolor: ACCENT, borderRadius: 5 } }} />
        <Typography fontSize={12} color="text.secondary" sx={{ mt: 0.75 }}>
          {avances.length} avance{avances.length !== 1 ? 's' : ''} registrado{avances.length !== 1 ? 's' : ''}
        </Typography>
      </Box>

      {esConstructor && proyectoEstado !== 'Completado' && (
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)}
          sx={{ mb: 2.5, bgcolor: ACCENT, '&:hover': { bgcolor: '#1D4ED8' } }}>
          Registrar avance
        </Button>
      )}

      {/* Timeline */}
      {avances.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <TimelineIcon sx={{ fontSize: 40, color: '#CBD5E1', mb: 1 }} />
          <Typography color="text.secondary">Sin avances registrados aún.</Typography>
        </Box>
      ) : (
        <Box sx={{ position: 'relative', pl: 3.5,
          '&::before': { content: '""', position: 'absolute', left: 14, top: 0, bottom: 0,
            width: 2, bgcolor: '#BFDBFE' } }}>
          {avances.map((a, i) => (
            <Box key={a.id} sx={{ position: 'relative', mb: 2.5,
              '&::before': { content: '""', position: 'absolute', left: -22, top: 18,
                width: 12, height: 12, borderRadius: '50%',
                bgcolor: i === 0 ? ACCENT : '#94A3B8', border: '2px solid #fff', boxShadow: '0 0 0 2px #BFDBFE' } }}>
              <Card sx={{ border: i === 0 ? '1px solid #BFDBFE' : '1px solid #E2E8F0' }} elevation={0}>
                <CardContent sx={{ py: '14px !important', px: 2.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75, flexWrap: 'wrap' }}>
                        <Chip label={`${a.porcentajeAvance}%`} size="small"
                          sx={{ bgcolor: '#DBEAFE', color: '#1D4ED8', fontWeight: 700, fontSize: 11 }} />
                        <Typography fontSize={13} fontWeight={700} color="text.primary">
                          {a.titulo}
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: a.responsable || a.fotos?.length ? 1 : 0 }}>
                        {a.descripcion}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                        {a.responsable && (
                          <Typography fontSize={11.5} color="text.secondary">
                            👤 {a.responsable}
                          </Typography>
                        )}
                        <Typography fontSize={11.5} color="text.secondary">
                          📅 {fmtDate(a.fecha)}
                        </Typography>
                      </Box>
                      {/* Photo grid */}
                      {a.fotos?.length > 0 && (
                        <Box sx={{ mt: 1.5 }}>
                          <ImageList cols={Math.min(a.fotos.length, 4)} gap={6} sx={{ m: 0 }}>
                            {a.fotos.map(f => (
                              <ImageListItem key={f.id}
                                sx={{ borderRadius: '6px', overflow: 'hidden', cursor: 'pointer', maxHeight: 120 }}
                                onClick={() => setLightbox(`${API_BASE}${f.url}`)}>
                                <img src={`${API_BASE}${f.url}`} alt={f.nombreArchivo}
                                  style={{ width: '100%', height: 120, objectFit: 'cover' }}
                                  onError={e => { e.target.style.display = 'none'; }} />
                              </ImageListItem>
                            ))}
                          </ImageList>
                        </Box>
                      )}
                    </Box>
                    {esConstructor && (
                      <IconButton size="small" onClick={() => handleEliminar(a.id)}
                        sx={{ color: '#CBD5E1', ml: 1, '&:hover': { color: '#EF4444' } }}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Box>
          ))}
        </Box>
      )}

      {/* Dialog nuevo avance */}
      <Dialog open={open} onClose={() => { setOpen(false); setFotos([]); }} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Registrar avance de obra</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '12px !important' }}>
          <TextField fullWidth label="Título del avance *"
            placeholder="Fundación completada, instalaciones eléctricas, etc."
            value={form.titulo}
            onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))} />
          <TextField fullWidth multiline rows={3}
            label="Descripción"
            placeholder="¿Qué trabajo se realizó? Detalle materiales, personal..."
            value={form.descripcion}
            onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} />
          <TextField fullWidth label="Responsable"
            placeholder="Nombre del responsable del avance"
            value={form.responsable}
            onChange={e => setForm(f => ({ ...f, responsable: e.target.value }))} />
          <Box>
            <Typography variant="body2" fontWeight={600} gutterBottom>
              % avance total: <strong style={{ color: ACCENT }}>{form.porcentajeAvance}%</strong>
            </Typography>
            <input type="range" min={0} max={100} value={form.porcentajeAvance}
              onChange={e => setForm(f => ({ ...f, porcentajeAvance: e.target.value }))}
              style={{ width: '100%', accentColor: ACCENT }} />
          </Box>
          {/* Foto upload */}
          <Box>
            <input ref={fileRef} type="file" accept="image/*,video/*" multiple hidden onChange={handleFotoSelect} />
            <Button variant="outlined" size="small" startIcon={<AddPhotoAlternateIcon />}
              onClick={() => fileRef.current.click()}>
              Adjuntar fotos / videos
            </Button>
            {fotos.length > 0 && (
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                {fotos.map((f, i) => (
                  <Box key={i} sx={{ position: 'relative' }}>
                    <Box component="img" src={f.preview} alt={f.file.name}
                      sx={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 1,
                        border: '1px solid #E2E8F0' }} />
                    <IconButton size="small"
                      sx={{ position: 'absolute', top: -6, right: -6, bgcolor: '#fff', p: '2px',
                        border: '1px solid #E2E8F0', '&:hover': { bgcolor: '#FEE2E2' } }}
                      onClick={() => setFotos(prev => prev.filter((_, idx) => idx !== i))}>
                      <DeleteIcon sx={{ fontSize: 12, color: '#EF4444' }} />
                    </IconButton>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => { setOpen(false); setFotos([]); }}>Cancelar</Button>
          <Button variant="contained" onClick={handleCrear} disabled={saving || !form.titulo}
            sx={{ bgcolor: ACCENT, '&:hover': { bgcolor: '#1D4ED8' } }}>
            {saving ? 'Guardando…' : 'Registrar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Lightbox */}
      <Dialog open={Boolean(lightbox)} onClose={() => setLightbox(null)} maxWidth="lg">
        {lightbox && <img src={lightbox} alt="Evidencia" style={{ maxWidth: '90vw', maxHeight: '85vh', display: 'block' }} />}
      </Dialog>
    </Box>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 1 — CHAT DE PROYECTO
// ═══════════════════════════════════════════════════════════════════════════════
function TabChat({ proyectoId, usuario, notify }) {
  const bottomRef   = useRef(null);
  const fileRef     = useRef(null);
  const [msgs,      setMsgs]      = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [texto,     setTexto]     = useState('');
  const [sending,   setSending]   = useState(false);
  const [adjunto,   setAdjunto]   = useState(null); // {url, nombre}

  const cargar = () =>
    mensajesApi.getChatProyecto(proyectoId)
      .then(r => setMsgs(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));

  useEffect(() => { cargar(); }, [proyectoId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs]);

  const handleAdjunto = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setAdjunto({ nombre: file.name, base64: ev.target.result });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSend = async () => {
    if (!texto.trim() && !adjunto) return;
    setSending(true);
    try {
      await mensajesApi.sendChat(proyectoId, {
        contenido:     texto.trim() || (adjunto ? `📎 ${adjunto.nombre}` : ''),
        adjuntoUrl:    adjunto?.base64 ?? null,
        adjuntoNombre: adjunto?.nombre ?? null,
      });
      setTexto('');
      setAdjunto(null);
      await cargar();
    } catch { notify('Error al enviar mensaje.', 'error'); }
    finally { setSending(false); }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const COLOR_MAP = ['#1D4ED8','#7C3AED','#059669','#D97706','#DC2626','#0F766E'];
  const colorFor  = (id) => COLOR_MAP[id % COLOR_MAP.length];

  if (loading) return <LinearProgress />;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: 520 }}>
      {/* Messages area */}
      <Box sx={{ flex: 1, overflowY: 'auto', px: 0.5, pb: 1 }}>
        {msgs.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <ChatIcon sx={{ fontSize: 40, color: '#CBD5E1', mb: 1 }} />
            <Typography color="text.secondary" fontSize={13}>
              No hay mensajes aún. Iniciá la conversación con el equipo del proyecto.
            </Typography>
          </Box>
        ) : (
          msgs.map((m, i) => {
            const esMio = m.remitenteId === usuario?.id;
            const mismoRemitente = i > 0 && msgs[i-1].remitenteId === m.remitenteId;
            return (
              <Box key={m.id} sx={{ display: 'flex', flexDirection: 'column',
                alignItems: esMio ? 'flex-end' : 'flex-start', mb: 0.5, px: 1 }}>
                {!mismoRemitente && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.35,
                    flexDirection: esMio ? 'row-reverse' : 'row' }}>
                    <Avatar sx={{ width: 22, height: 22, bgcolor: colorFor(m.remitenteId),
                      fontSize: 10, fontWeight: 700 }}>
                      {(m.remitenteNombre ?? 'U')[0].toUpperCase()}
                    </Avatar>
                    <Typography fontSize={11.5} fontWeight={600} color="text.secondary">
                      {m.remitenteNombre}
                    </Typography>
                    <Typography fontSize={10.5} color="text.disabled">{fmtTime(m.fechaEnvio)}</Typography>
                  </Box>
                )}
                <Box sx={{
                  maxWidth: '72%', bgcolor: esMio ? ACCENT : '#F1F5F9',
                  color: esMio ? '#fff' : 'text.primary',
                  borderRadius: esMio ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                  px: 1.75, py: 1, fontSize: 13.5,
                  boxShadow: '0 1px 2px rgba(0,0,0,0.07)',
                }}>
                  {m.contenido}
                  {m.adjuntoNombre && (
                    <Box sx={{ mt: 0.5, display: 'flex', alignItems: 'center', gap: 0.5,
                      opacity: 0.85, fontSize: 12 }}>
                      <AttachFileIcon sx={{ fontSize: 13 }} />
                      {m.adjuntoNombre}
                    </Box>
                  )}
                </Box>
              </Box>
            );
          })
        )}
        <div ref={bottomRef} />
      </Box>

      {/* Adjunto preview */}
      {adjunto && (
        <Box sx={{ px: 2, py: 0.75, bgcolor: '#EFF6FF', borderTop: '1px solid #BFDBFE',
          display: 'flex', alignItems: 'center', gap: 1 }}>
          <AttachFileIcon sx={{ fontSize: 15, color: ACCENT }} />
          <Typography fontSize={12.5} sx={{ flex: 1, color: ACCENT }}>{adjunto.nombre}</Typography>
          <IconButton size="small" onClick={() => setAdjunto(null)}>
            <DeleteIcon sx={{ fontSize: 14, color: '#94A3B8' }} />
          </IconButton>
        </Box>
      )}

      {/* Input area */}
      <Box sx={{ borderTop: '1px solid #E2E8F0', pt: 1.5, display: 'flex', gap: 1, alignItems: 'flex-end' }}>
        <input ref={fileRef} type="file" hidden onChange={handleAdjunto} />
        <Tooltip title="Adjuntar archivo">
          <IconButton size="small" onClick={() => fileRef.current.click()}
            sx={{ color: '#9CA3AF', '&:hover': { color: ACCENT } }}>
            <AttachFileIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <TextField
          fullWidth multiline maxRows={4} size="small"
          placeholder="Escribí un mensaje... (Enter para enviar)"
          value={texto} onChange={e => setTexto(e.target.value)} onKeyDown={handleKey}
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', fontSize: 13.5 } }}
        />
        <IconButton
          onClick={handleSend}
          disabled={sending || (!texto.trim() && !adjunto)}
          sx={{ bgcolor: ACCENT, color: '#fff', width: 38, height: 38, flexShrink: 0,
            '&:hover': { bgcolor: '#1D4ED8' },
            '&.Mui-disabled': { bgcolor: '#E2E8F0', color: '#9CA3AF' } }}>
          <SendIcon sx={{ fontSize: 17 }} />
        </IconButton>
      </Box>
    </Box>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 2 — PRESUPUESTO
// ═══════════════════════════════════════════════════════════════════════════════
const CATS_PRESUP = ['Materiales','ManoDeObra','Equipos','SubContratos','Administracion','Otros'];

function TabPresupuesto({ proyectoId, notify }) {
  const [resumen,   setResumen]    = useState(null);
  const [partidas,  setPartidas]   = useState([]);
  const [gastos,    setGastos]     = useState([]);
  const [loading,   setLoading]    = useState(true);
  const [tabLocal,  setTabLocal]   = useState(0); // 0=dashboard 1=partidas 2=gastos
  const [openP,     setOpenP]      = useState(false);
  const [openG,     setOpenG]      = useState(false);
  const [formP,     setFormP]      = useState({ nombre: '', categoria: 'Materiales', presupuestoEstimado: '', descripcion: '' });
  const [formG,     setFormG]      = useState({ descripcion: '', categoria: 'Materiales', monto: '', fecha: '', referencia: '', partidaId: '' });
  const [saving,    setSaving]     = useState(false);

  const cargar = async () => {
    setLoading(true);
    await Promise.all([
      presupuestoApi.getResumen(proyectoId).then(r => setResumen(r.data)).catch(() => {}),
      presupuestoApi.getPartidas(proyectoId).then(r => setPartidas(r.data)).catch(() => {}),
      presupuestoApi.getGastos(proyectoId).then(r => setGastos(r.data)).catch(() => {}),
    ]);
    setLoading(false);
  };

  useEffect(() => { cargar(); }, [proyectoId]);

  const handleCrearPartida = async () => {
    setSaving(true);
    try {
      await presupuestoApi.createPartida({
        proyectoId: parseInt(proyectoId),
        nombre: formP.nombre,
        categoria: formP.categoria,
        presupuestoEstimado: parseFloat(formP.presupuestoEstimado),
        descripcion: formP.descripcion || null,
      });
      await cargar();
      setOpenP(false);
      setFormP({ nombre: '', categoria: 'Materiales', presupuestoEstimado: '', descripcion: '' });
      notify('Partida creada.');
    } catch { notify('Error al crear.', 'error'); }
    finally { setSaving(false); }
  };

  const handleCrearGasto = async () => {
    setSaving(true);
    try {
      await presupuestoApi.createGasto({
        proyectoId:  parseInt(proyectoId),
        descripcion: formG.descripcion,
        categoria:   formG.categoria,
        monto:       parseFloat(formG.monto),
        fecha:       formG.fecha || null,
        referencia:  formG.referencia || null,
        partidaId:   formG.partidaId ? parseInt(formG.partidaId) : null,
      });
      await cargar();
      setOpenG(false);
      setFormG({ descripcion: '', categoria: 'Materiales', monto: '', fecha: '', referencia: '', partidaId: '' });
      notify('Gasto registrado.');
    } catch { notify('Error al registrar.', 'error'); }
    finally { setSaving(false); }
  };

  const handleDeletePartida = async (id) => {
    try { await presupuestoApi.deletePartida(id); await cargar(); notify('Partida eliminada.'); }
    catch { notify('Error.', 'error'); }
  };

  const handleDeleteGasto = async (id) => {
    try { await presupuestoApi.deleteGasto(id); await cargar(); notify('Gasto eliminado.'); }
    catch { notify('Error.', 'error'); }
  };

  const TH = ({ children }) => (
    <TableCell sx={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase',
      letterSpacing: '0.05em', py: 1.25, borderBottom: '1px solid #F1F5F9' }}>
      {children}
    </TableCell>
  );

  if (loading) return <LinearProgress />;

  const ejecucionPct = resumen?.presupuestoOriginal > 0
    ? Math.min(100, Math.round((resumen.gastoEjecutado / resumen.presupuestoOriginal) * 100))
    : 0;

  return (
    <Box>
      {/* Alertas de sobrecosto */}
      {resumen?.alertas?.length > 0 && (
        <Box sx={{ bgcolor: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '7px',
          px: 2, py: 1.25, mb: 2, display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
          <WarningAmberIcon sx={{ color: '#D97706', fontSize: 16, mt: 0.1, flexShrink: 0 }} />
          <Typography fontSize={13} sx={{ color: '#92400E' }}>
            <strong>{resumen.alertas.length} partida{resumen.alertas.length > 1 ? 's' : ''} con sobrecosto:</strong>{' '}
            {resumen.alertas.map(a => a.nombre).join(', ')}
          </Typography>
        </Box>
      )}

      {/* KPIs */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2,1fr)', sm: 'repeat(4,1fr)' }, gap: 1.5, mb: 2 }}>
        {[
          { label: 'Presupuesto', value: fmtMontoK(resumen?.presupuestoOriginal), color: ACCENT },
          { label: 'Ejecutado',   value: fmtMontoK(resumen?.gastoEjecutado),      color: resumen?.variacion > 0 ? '#DC2626' : '#059669' },
          { label: 'Disponible',  value: fmtMontoK(resumen?.disponible),          color: (resumen?.disponible ?? 0) < 0 ? '#DC2626' : '#064E3B' },
          { label: 'Ejecución',   value: `${ejecucionPct}%`,                      color: '#7C3AED' },
        ].map(s => (
          <Box key={s.label} sx={{ bgcolor: '#fff', border: '1px solid #E8EDF3', borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)', px: 2.5, pt: 2, pb: 1.75 }}>
            <Typography fontSize={22} fontWeight={800} sx={{ color: s.color, lineHeight: 1.1 }}>{s.value}</Typography>
            <Typography fontSize={12} color="text.secondary" sx={{ mt: 0.5, fontWeight: 500 }}>{s.label}</Typography>
          </Box>
        ))}
      </Box>

      {/* Progress bar */}
      {resumen?.presupuestoOriginal > 0 && (
        <Box sx={{ mb: 2.5, bgcolor: '#fff', border: '1px solid #E2E8F0', borderRadius: '8px', p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
            <Typography fontSize={12.5} color="text.secondary">Ejecución presupuestaria</Typography>
            <Typography fontSize={12.5} fontWeight={700} sx={{ color: resumen.variacion > 0 ? '#DC2626' : ACCENT }}>
              {resumen.variacion > 0 ? `+${fmtMontoK(resumen.variacion)} SOBRECOSTO` : `${fmtMontoK(Math.abs(resumen.variacion))} disponible`}
            </Typography>
          </Box>
          <LinearProgress variant="determinate" value={ejecucionPct}
            sx={{ height: 8, borderRadius: 4, bgcolor: '#E5E7EB',
              '& .MuiLinearProgress-bar': { bgcolor: ejecucionPct > 100 ? '#DC2626' : ACCENT, borderRadius: 4 } }} />
        </Box>
      )}

      {/* Sub-tabs */}
      <Box sx={{ display: 'flex', gap: 1, mb: 2, borderBottom: '1px solid #E2E8F0', pb: 0.5 }}>
        {['Dashboard', 'Partidas', 'Gastos'].map((t, i) => (
          <Button key={t} size="small" onClick={() => setTabLocal(i)}
            sx={{ fontSize: 12.5, fontWeight: tabLocal === i ? 700 : 400,
              color: tabLocal === i ? ACCENT : '#64748B',
              bgcolor: tabLocal === i ? '#EFF6FF' : 'transparent',
              borderRadius: '6px', px: 1.5, py: 0.5,
              '&:hover': { bgcolor: '#F8FAFC' } }}>
            {t}
          </Button>
        ))}
      </Box>

      {/* Dashboard */}
      {tabLocal === 0 && (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
          {/* Por categoría */}
          <Box sx={{ bgcolor: '#fff', border: '1px solid #E2E8F0', borderRadius: '8px', overflow: 'hidden' }}>
            <Box sx={{ px: 2.5, py: 1.25, borderBottom: '1px solid #F1F5F9' }}>
              <Typography fontSize={13} fontWeight={600}>Gasto por categoría</Typography>
            </Box>
            {resumen?.porCategoria?.length === 0 ? (
              <Box sx={{ px: 2.5, py: 3, textAlign: 'center' }}>
                <Typography fontSize={12.5} color="text.secondary">Sin gastos registrados.</Typography>
              </Box>
            ) : (
              resumen?.porCategoria?.map((cat, i) => (
                <Box key={cat.categoria}>
                  {i > 0 && <Divider sx={{ mx: 2.5 }} />}
                  <Box sx={{ px: 2.5, py: 1.1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: ACCENT }} />
                      <Typography fontSize={12.5} color="text.secondary">{cat.categoria}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                      <Typography fontSize={11} color="text.secondary">{cat.count} registros</Typography>
                      <Typography fontSize={13} fontWeight={700}>{fmtMontoK(cat.total)}</Typography>
                    </Box>
                  </Box>
                </Box>
              ))
            )}
          </Box>
          {/* Partidas con alerta */}
          <Box sx={{ bgcolor: '#fff', border: '1px solid #E2E8F0', borderRadius: '8px', overflow: 'hidden' }}>
            <Box sx={{ px: 2.5, py: 1.25, borderBottom: '1px solid #F1F5F9' }}>
              <Typography fontSize={13} fontWeight={600}>Estado de partidas</Typography>
            </Box>
            {partidas.length === 0 ? (
              <Box sx={{ px: 2.5, py: 3, textAlign: 'center' }}>
                <Typography fontSize={12.5} color="text.secondary">Sin partidas creadas.</Typography>
                <Button size="small" variant="outlined" sx={{ mt: 1, fontSize: 12 }} onClick={() => { setTabLocal(1); setOpenP(true); }}>
                  Crear primera partida
                </Button>
              </Box>
            ) : (
              partidas.slice(0, 5).map((p, i) => (
                <Box key={p.id}>
                  {i > 0 && <Divider sx={{ mx: 2.5 }} />}
                  <Box sx={{ px: 2.5, py: 1.25 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography fontSize={12.5} fontWeight={500} noWrap sx={{ maxWidth: 160 }}>{p.nombre}</Typography>
                      {p.sobrecosto && (
                        <Chip label="Sobrecosto" size="small"
                          sx={{ fontSize: 10, bgcolor: '#FEE2E2', color: '#DC2626', fontWeight: 700 }} />
                      )}
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LinearProgress variant="determinate"
                        value={Math.min(100, p.presupuestoEstimado > 0 ? Math.round((p.gastoReal/p.presupuestoEstimado)*100) : 0)}
                        sx={{ flex: 1, height: 5, borderRadius: 3, bgcolor: '#E5E7EB',
                          '& .MuiLinearProgress-bar': { bgcolor: p.sobrecosto ? '#DC2626' : ACCENT, borderRadius: 3 } }} />
                      <Typography fontSize={11} color="text.secondary" sx={{ minWidth: 60, textAlign: 'right' }}>
                        {fmtMontoK(p.gastoReal)} / {fmtMontoK(p.presupuestoEstimado)}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              ))
            )}
          </Box>
        </Box>
      )}

      {/* Partidas */}
      {tabLocal === 1 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1.5 }}>
            <Button variant="contained" size="small" startIcon={<AddIcon />}
              onClick={() => setOpenP(true)} sx={{ fontSize: 12.5 }}>
              Nueva partida
            </Button>
          </Box>
          <Box sx={{ bgcolor: '#fff', border: '1px solid #E2E8F0', borderRadius: '8px', overflow: 'hidden' }}>
            {partidas.length === 0 ? (
              <Box sx={{ py: 5, textAlign: 'center' }}>
                <Typography fontSize={13} color="text.secondary">Sin partidas presupuestarias.</Typography>
              </Box>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead><TableRow>
                    <TH>Partida</TH><TH>Categoría</TH><TH>Estimado</TH><TH>Ejecutado</TH><TH>Disponible</TH><TH />
                  </TableRow></TableHead>
                  <TableBody>
                    {partidas.map(p => (
                      <TableRow key={p.id} sx={{ '&:hover': { bgcolor: '#F8FAFC' } }}>
                        <TableCell><Typography fontSize={13} fontWeight={500}>{p.nombre}</Typography></TableCell>
                        <TableCell><Chip label={p.categoria} size="small" sx={{ fontSize: 11, bgcolor: '#F1F5F9', color: '#64748B' }} /></TableCell>
                        <TableCell><Typography fontSize={13} fontWeight={600}>{fmtMontoK(p.presupuestoEstimado)}</Typography></TableCell>
                        <TableCell>
                          <Typography fontSize={13} fontWeight={600} sx={{ color: p.sobrecosto ? '#DC2626' : 'text.primary' }}>
                            {fmtMontoK(p.gastoReal)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography fontSize={13} sx={{ color: (p.disponible ?? 0) < 0 ? '#DC2626' : '#059669' }}>
                            {fmtMontoK(p.disponible)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <IconButton size="small" onClick={() => handleDeletePartida(p.id)}
                            sx={{ color: '#CBD5E1', '&:hover': { color: '#EF4444' } }}>
                            <DeleteIcon sx={{ fontSize: 14 }} />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        </Box>
      )}

      {/* Gastos */}
      {tabLocal === 2 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1.5 }}>
            <Button variant="contained" size="small" startIcon={<AddIcon />}
              onClick={() => setOpenG(true)} sx={{ fontSize: 12.5 }}>
              Registrar gasto
            </Button>
          </Box>
          <Box sx={{ bgcolor: '#fff', border: '1px solid #E2E8F0', borderRadius: '8px', overflow: 'hidden' }}>
            {gastos.length === 0 ? (
              <Box sx={{ py: 5, textAlign: 'center' }}>
                <Typography fontSize={13} color="text.secondary">Sin gastos registrados.</Typography>
              </Box>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead><TableRow>
                    <TH>Descripción</TH><TH>Categoría</TH><TH>Monto</TH><TH>Fecha</TH><TH>Referencia</TH><TH />
                  </TableRow></TableHead>
                  <TableBody>
                    {gastos.map(g => (
                      <TableRow key={g.id} sx={{ '&:hover': { bgcolor: '#F8FAFC' } }}>
                        <TableCell><Typography fontSize={13}>{g.descripcion}</Typography></TableCell>
                        <TableCell><Chip label={g.categoria} size="small" sx={{ fontSize: 11, bgcolor: '#F1F5F9', color: '#64748B' }} /></TableCell>
                        <TableCell><Typography fontSize={13} fontWeight={700}>{fmtMontoK(g.monto)}</Typography></TableCell>
                        <TableCell><Typography fontSize={12} color="text.secondary">{fmtDate(g.fecha)}</Typography></TableCell>
                        <TableCell><Typography fontSize={12} color="text.secondary">{g.referencia || '—'}</Typography></TableCell>
                        <TableCell align="right">
                          <IconButton size="small" onClick={() => handleDeleteGasto(g.id)}
                            sx={{ color: '#CBD5E1', '&:hover': { color: '#EF4444' } }}>
                            <DeleteIcon sx={{ fontSize: 14 }} />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        </Box>
      )}

      {/* Dialog nueva partida */}
      <Dialog open={openP} onClose={() => setOpenP(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Nueva partida presupuestaria</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '12px !important' }}>
          <TextField fullWidth label="Nombre *" value={formP.nombre}
            onChange={e => setFormP(f => ({ ...f, nombre: e.target.value }))} />
          <Select size="small" value={formP.categoria}
            onChange={e => setFormP(f => ({ ...f, categoria: e.target.value }))}>
            {CATS_PRESUP.map(c => <MenuItem key={c} value={c} sx={{ fontSize: 13 }}>{c}</MenuItem>)}
          </Select>
          <TextField fullWidth label="Presupuesto estimado (₡) *" type="number"
            value={formP.presupuestoEstimado}
            onChange={e => setFormP(f => ({ ...f, presupuestoEstimado: e.target.value }))}
            InputProps={{ startAdornment: <InputAdornment position="start">₡</InputAdornment> }} />
          <TextField fullWidth label="Descripción" multiline rows={2} value={formP.descripcion}
            onChange={e => setFormP(f => ({ ...f, descripcion: e.target.value }))} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpenP(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleCrearPartida}
            disabled={saving || !formP.nombre || !formP.presupuestoEstimado}
            sx={{ bgcolor: ACCENT, '&:hover': { bgcolor: '#1D4ED8' } }}>
            {saving ? 'Guardando…' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog nuevo gasto */}
      <Dialog open={openG} onClose={() => setOpenG(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Registrar gasto</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '12px !important' }}>
          <TextField fullWidth label="Descripción *" value={formG.descripcion}
            onChange={e => setFormG(f => ({ ...f, descripcion: e.target.value }))} />
          <Select size="small" value={formG.categoria}
            onChange={e => setFormG(f => ({ ...f, categoria: e.target.value }))}>
            {CATS_PRESUP.map(c => <MenuItem key={c} value={c} sx={{ fontSize: 13 }}>{c}</MenuItem>)}
          </Select>
          <TextField fullWidth label="Monto (₡) *" type="number" value={formG.monto}
            onChange={e => setFormG(f => ({ ...f, monto: e.target.value }))}
            InputProps={{ startAdornment: <InputAdornment position="start">₡</InputAdornment> }} />
          <TextField fullWidth label="Fecha" type="date"
            value={formG.fecha} onChange={e => setFormG(f => ({ ...f, fecha: e.target.value }))}
            InputLabelProps={{ shrink: true }} />
          <TextField fullWidth label="Referencia (Nº factura, recibo)" value={formG.referencia}
            onChange={e => setFormG(f => ({ ...f, referencia: e.target.value }))} />
          {partidas.length > 0 && (
            <Select size="small" displayEmpty value={formG.partidaId}
              onChange={e => setFormG(f => ({ ...f, partidaId: e.target.value }))}>
              <MenuItem value="">Sin partida asignada</MenuItem>
              {partidas.map(p => <MenuItem key={p.id} value={p.id} sx={{ fontSize: 13 }}>{p.nombre}</MenuItem>)}
            </Select>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpenG(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleCrearGasto}
            disabled={saving || !formG.descripcion || !formG.monto}
            sx={{ bgcolor: ACCENT, '&:hover': { bgcolor: '#1D4ED8' } }}>
            {saving ? 'Guardando…' : 'Registrar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 3 — EQUIPO DEL PROYECTO (PROMPT 9)
// ═══════════════════════════════════════════════════════════════════════════════
const ROLES_EQUIPO = ['Arquitecto','Ingeniero','Supervisor','Maestro de Obra','Electricista','Fontanero','Proveedor','Otro'];
const ROL_COLORS   = {
  'Arquitecto':    '#7C3AED', 'Ingeniero':     '#2563EB',
  'Supervisor':    '#0891B2', 'Maestro de Obra':'#059669',
  'Electricista':  '#D97706', 'Fontanero':      '#DC2626',
  'Proveedor':     '#DB2777', 'Otro':           '#64748B',
};
const PERMISOS_OPT = [
  { key: 'verAvances',     label: 'Ver avances' },
  { key: 'verPresupuesto', label: 'Ver presupuesto' },
  { key: 'chat',           label: 'Chat del proyecto' },
  { key: 'verDocumentos',  label: 'Ver documentos' },
];

function TabEquipo({ proyectoId, esConstructor, notify }) {
  const [miembros,  setMiembros]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [openNew,   setOpenNew]   = useState(false);
  const [editMiembro, setEditMiembro] = useState(null);
  const [confirmDel,  setConfirmDel]  = useState(null);
  const [form,      setForm]      = useState({ nombre:'', rol:'Arquitecto', empresa:'', email:'', telefono:'', responsabilidades:'', permisos:[] });
  const [saving,    setSaving]    = useState(false);

  const cargar = () => equipoProyectoApi.getByProyecto(proyectoId).then(r => setMiembros(r.data ?? [])).catch(() => {}).finally(() => setLoading(false));
  useEffect(() => { cargar(); }, [proyectoId]);

  const resetForm = () => setForm({ nombre:'', rol:'Arquitecto', empresa:'', email:'', telefono:'', responsabilidades:'', permisos:[] });

  const openEdit = (m) => {
    setForm({
      nombre: m.nombre, rol: m.rol, empresa: m.empresa ?? '',
      email: m.email ?? '', telefono: m.telefono ?? '',
      responsabilidades: m.responsabilidades ?? '',
      permisos: m.permisos ? m.permisos.split(',').filter(Boolean) : [],
    });
    setEditMiembro(m);
    setOpenNew(true);
  };

  const handleGuardar = async () => {
    setSaving(true);
    try {
      const payload = {
        proyectoId:       parseInt(proyectoId),
        nombre:           form.nombre,
        rol:              form.rol,
        empresa:          form.empresa || null,
        email:            form.email || null,
        telefono:         form.telefono || null,
        responsabilidades: form.responsabilidades || null,
        permisos:         form.permisos.length > 0 ? form.permisos.join(',') : null,
      };
      if (editMiembro) {
        await equipoProyectoApi.update(editMiembro.id, payload);
        notify('Miembro actualizado.');
      } else {
        await equipoProyectoApi.create(payload);
        notify('Miembro agregado al equipo.');
      }
      await cargar();
      setOpenNew(false);
      setEditMiembro(null);
      resetForm();
    } catch { notify('Error al guardar.', 'error'); }
    finally { setSaving(false); }
  };

  const handleEliminar = async (id) => {
    try {
      await equipoProyectoApi.delete(id);
      setMiembros(prev => prev.filter(m => m.id !== id));
      setConfirmDel(null);
      notify('Miembro removido.');
    } catch { notify('Error.', 'error'); }
  };

  const togglePermiso = (key) =>
    setForm(f => ({ ...f, permisos: f.permisos.includes(key) ? f.permisos.filter(p => p !== key) : [...f.permisos, key] }));

  if (loading) return <LinearProgress />;

  // Agrupar por rol
  const porRol = ROLES_EQUIPO.reduce((acc, r) => {
    const lista = miembros.filter(m => m.rol === r);
    if (lista.length > 0) acc[r] = lista;
    return acc;
  }, {});

  return (
    <Box>
      {esConstructor && (
        <Button variant="contained" startIcon={<GroupAddIcon />} size="small"
          onClick={() => { resetForm(); setEditMiembro(null); setOpenNew(true); }}
          sx={{ mb: 2.5, bgcolor: ACCENT, '&:hover': { bgcolor: '#1D4ED8' } }}>
          Agregar miembro
        </Button>
      )}

      {miembros.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <PeopleIcon sx={{ fontSize: 48, color: '#CBD5E1', mb: 1.5 }} />
          <Typography color="text.secondary" fontSize={14} fontWeight={500}>Sin equipo asignado aún.</Typography>
          <Typography color="text.secondary" fontSize={12.5} sx={{ mt: 0.5 }}>
            Agregá los responsables del proyecto: arquitecto, ingeniero, supervisor y más.
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {Object.entries(porRol).map(([rol, lista]) => (
            <Box key={rol}>
              <Typography fontSize={12} fontWeight={700} sx={{
                color: ROL_COLORS[rol] ?? '#64748B', textTransform: 'uppercase',
                letterSpacing: '0.07em', mb: 1 }}>
                {rol}
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2,1fr)', md: 'repeat(3,1fr)' }, gap: 1.5 }}>
                {lista.map(m => (
                  <Box key={m.id} sx={{
                    bgcolor: '#fff', border: '1px solid #E2E8F0', borderRadius: '10px',
                    borderLeft: `4px solid ${ROL_COLORS[m.rol] ?? '#64748B'}`,
                    p: 2, position: 'relative',
                  }}>
                    {esConstructor && (
                      <Box sx={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 0.5 }}>
                        <Tooltip title="Editar">
                          <IconButton size="small" onClick={() => openEdit(m)}
                            sx={{ color: '#CBD5E1', '&:hover': { color: '#D97706' } }}>
                            <BadgeIcon sx={{ fontSize: 14 }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Remover">
                          <IconButton size="small" onClick={() => setConfirmDel(m)}
                            sx={{ color: '#CBD5E1', '&:hover': { color: '#EF4444' } }}>
                            <DeleteIcon sx={{ fontSize: 14 }} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    )}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 1, pr: 5 }}>
                      <Avatar sx={{ width: 34, height: 34, bgcolor: `${ROL_COLORS[m.rol] ?? '#64748B'}22`,
                        color: ROL_COLORS[m.rol] ?? '#64748B', fontWeight: 700, fontSize: 14 }}>
                        {m.nombre[0]?.toUpperCase()}
                      </Avatar>
                      <Box>
                        <Typography fontSize={13.5} fontWeight={700} lineHeight={1.2}>{m.nombre}</Typography>
                        {m.empresa && <Typography fontSize={11.5} color="text.secondary">{m.empresa}</Typography>}
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      {m.email && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                          <EmailIcon sx={{ fontSize: 12, color: '#94A3B8' }} />
                          <Typography fontSize={12} color="text.secondary" noWrap>{m.email}</Typography>
                        </Box>
                      )}
                      {m.telefono && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                          <PhoneIcon sx={{ fontSize: 12, color: '#94A3B8' }} />
                          <Typography fontSize={12} color="text.secondary">{m.telefono}</Typography>
                        </Box>
                      )}
                      {m.responsabilidades && (
                        <Typography fontSize={11.5} color="text.secondary" sx={{ mt: 0.25,
                          overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box',
                          WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                          {m.responsabilidades}
                        </Typography>
                      )}
                      {m.permisos && (
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
                          {m.permisos.split(',').filter(Boolean).map(p => (
                            <Chip key={p} label={PERMISOS_OPT.find(o => o.key === p)?.label ?? p}
                              size="small" sx={{ fontSize: 10, bgcolor: '#EFF6FF', color: ACCENT, fontWeight: 500 }} />
                          ))}
                        </Box>
                      )}
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          ))}
        </Box>
      )}

      {/* Dialog agregar / editar miembro */}
      <Dialog open={openNew} onClose={() => { setOpenNew(false); setEditMiembro(null); }} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>
          {editMiembro ? 'Editar miembro del equipo' : 'Agregar al equipo del proyecto'}
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '12px !important' }}>
          <TextField fullWidth label="Nombre completo *" value={form.nombre}
            onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} />

          <Select size="small" value={form.rol}
            onChange={e => setForm(f => ({ ...f, rol: e.target.value }))}>
            {ROLES_EQUIPO.map(r => <MenuItem key={r} value={r} sx={{ fontSize: 13 }}>{r}</MenuItem>)}
          </Select>

          <TextField fullWidth label="Empresa / organización" value={form.empresa}
            onChange={e => setForm(f => ({ ...f, empresa: e.target.value }))} />

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <TextField label="Email" type="email" value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            <TextField label="Teléfono" value={form.telefono}
              onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))} />
          </Box>

          <TextField fullWidth label="Responsabilidades" multiline rows={2}
            placeholder="¿Qué actividades tiene a cargo en este proyecto?"
            value={form.responsabilidades}
            onChange={e => setForm(f => ({ ...f, responsabilidades: e.target.value }))} />

          <Box>
            <Typography fontSize={12.5} fontWeight={600} color="text.secondary" sx={{ mb: 1 }}>
              Permisos de acceso
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
              {PERMISOS_OPT.map(p => (
                <Chip key={p.key} label={p.label} size="small" clickable
                  onClick={() => togglePermiso(p.key)}
                  sx={{
                    fontSize: 11.5,
                    bgcolor: form.permisos.includes(p.key) ? '#EFF6FF' : 'transparent',
                    color:   form.permisos.includes(p.key) ? ACCENT      : '#64748B',
                    border:  `1px solid ${form.permisos.includes(p.key) ? '#BFDBFE' : '#E2E8F0'}`,
                    fontWeight: form.permisos.includes(p.key) ? 700 : 400,
                  }} />
              ))}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => { setOpenNew(false); setEditMiembro(null); }}>Cancelar</Button>
          <Button variant="contained" onClick={handleGuardar} disabled={saving || !form.nombre}
            sx={{ bgcolor: ACCENT, '&:hover': { bgcolor: '#1D4ED8' } }}>
            {saving ? 'Guardando…' : editMiembro ? 'Actualizar' : 'Agregar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirm delete */}
      <Dialog open={!!confirmDel} onClose={() => setConfirmDel(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>¿Remover miembro?</DialogTitle>
        <DialogContent>
          <Typography fontSize={13.5} color="text.secondary">
            ¿Eliminar a <strong>{confirmDel?.nombre}</strong> ({confirmDel?.rol}) del equipo del proyecto?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setConfirmDel(null)}>Cancelar</Button>
          <Button variant="contained" color="error" size="small" onClick={() => handleEliminar(confirmDel.id)}>
            Remover
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 4 — ÓRDENES DE CAMBIO (PROMPT 8)
// ═══════════════════════════════════════════════════════════════════════════════
const ESTADO_ORDEN_STYLE = {
  Pendiente: { bg: '#FEF3C7', color: '#D97706' },
  Aprobada:  { bg: '#DCFCE7', color: '#166534' },
  Rechazada: { bg: '#FEE2E2', color: '#991B1B' },
};

function TabOrdenes({ proyectoId, esConstructor, notify }) {
  const [ordenes,  setOrdenes]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [openNew,  setOpenNew]  = useState(false);
  const [detalle,  setDetalle]  = useState(null);
  const [saving,   setSaving]   = useState(false);
  const [form, setForm] = useState({ titulo:'', descripcion:'', impactoEconomico:'', impactoCronogramaDias:0, notas:'' });

  const cargar = () => ordenesApi.getByProyecto(proyectoId).then(r => setOrdenes(r.data ?? [])).catch(() => {}).finally(() => setLoading(false));
  useEffect(() => { cargar(); }, [proyectoId]);

  const handleCrear = async () => {
    setSaving(true);
    try {
      await ordenesApi.create({
        proyectoId:            parseInt(proyectoId),
        titulo:                form.titulo,
        descripcion:           form.descripcion,
        impactoEconomico:      parseFloat(form.impactoEconomico) || 0,
        impactoCronogramaDias: parseInt(form.impactoCronogramaDias) || 0,
        notas:                 form.notas || null,
      });
      await cargar();
      setOpenNew(false);
      setForm({ titulo:'', descripcion:'', impactoEconomico:'', impactoCronogramaDias:0, notas:'' });
      notify('Orden de cambio creada.');
    } catch { notify('Error al crear.', 'error'); }
    finally { setSaving(false); }
  };

  const handleEstado = async (id, estado) => {
    try {
      await ordenesApi.cambiarEstado(id, { estado });
      await cargar();
      setDetalle(null);
      notify(`Orden marcada como ${estado}.`);
    } catch { notify('Error.', 'error'); }
  };

  const handleEliminar = async (id) => {
    try {
      await ordenesApi.delete(id);
      setOrdenes(prev => prev.filter(o => o.id !== id));
      notify('Orden eliminada.');
    } catch { notify('Error.', 'error'); }
  };

  // KPIs
  const kpis = {
    total:     ordenes.length,
    pendiente: ordenes.filter(o => o.estado === 'Pendiente').length,
    aprobada:  ordenes.filter(o => o.estado === 'Aprobada').length,
    impacto:   ordenes.filter(o => o.estado === 'Aprobada').reduce((s, o) => s + (o.impactoEconomico ?? 0), 0),
  };

  if (loading) return <LinearProgress />;

  return (
    <Box>
      {/* KPIs strip */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 1.5, mb: 2.5 }}>
        {[
          { label: 'Total',     value: kpis.total,              color: ACCENT },
          { label: 'Pendientes',value: kpis.pendiente,          color: '#D97706' },
          { label: 'Aprobadas', value: kpis.aprobada,           color: '#059669' },
          { label: 'Impacto ₡', value: fmtMontoK(kpis.impacto), color: '#7C3AED' },
        ].map(k => (
          <Box key={k.label} sx={{ bgcolor: '#fff', border: '1px solid #E8EDF3', borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)', px: 2, pt: 1.75, pb: 1.25 }}>
            <Typography fontSize={20} fontWeight={800} sx={{ color: k.color, lineHeight: 1.1 }}>{k.value}</Typography>
            <Typography fontSize={12} color="text.secondary" sx={{ mt: 0.4, fontWeight: 500 }}>{k.label}</Typography>
          </Box>
        ))}
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1.5 }}>
        <Button variant="contained" size="small" startIcon={<AddIcon />}
          onClick={() => setOpenNew(true)} sx={{ bgcolor: ACCENT, '&:hover': { bgcolor: '#1D4ED8' } }}>
          Nueva orden de cambio
        </Button>
      </Box>

      {ordenes.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <ChangeCircleIcon sx={{ fontSize: 48, color: '#CBD5E1', mb: 1.5 }} />
          <Typography color="text.secondary" fontSize={13.5} fontWeight={500}>Sin órdenes de cambio registradas.</Typography>
          <Typography color="text.secondary" fontSize={12.5} sx={{ mt: 0.5 }}>
            Registrá aquí cualquier cambio al alcance original del proyecto.
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
          {ordenes.map(o => {
            const estilo = ESTADO_ORDEN_STYLE[o.estado] ?? ESTADO_ORDEN_STYLE.Pendiente;
            return (
              <Box key={o.id} sx={{
                bgcolor: '#fff', border: '1px solid #E2E8F0', borderRadius: '8px',
                p: 2, cursor: 'pointer', '&:hover': { borderColor: '#BFDBFE' },
              }} onClick={() => setDetalle(o)}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Chip label={o.estado} size="small"
                        sx={{ bgcolor: estilo.bg, color: estilo.color, fontWeight: 700, fontSize: 11 }} />
                      <Typography fontSize={13.5} fontWeight={700} noWrap>{o.titulo}</Typography>
                    </Box>
                    <Typography fontSize={12.5} color="text.secondary"
                      sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {o.descripcion}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                    <Typography fontSize={13} fontWeight={700} sx={{ color: o.impactoEconomico > 0 ? '#DC2626' : '#059669' }}>
                      {o.impactoEconomico !== 0 ? fmtMontoK(o.impactoEconomico) : '₡0'}
                    </Typography>
                    {o.impactoCronogramaDias !== 0 && (
                      <Typography fontSize={11.5} color="text.secondary">
                        {o.impactoCronogramaDias > 0 ? '+' : ''}{o.impactoCronogramaDias} días
                      </Typography>
                    )}
                    <Typography fontSize={11} color="text.disabled">{fmtDate(o.fechaSolicitud)}</Typography>
                  </Box>
                </Box>
              </Box>
            );
          })}
        </Box>
      )}

      {/* Dialog crear orden */}
      <Dialog open={openNew} onClose={() => setOpenNew(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Nueva orden de cambio</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '12px !important' }}>
          <TextField fullWidth label="Título *" placeholder="Resumen breve del cambio"
            value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))} />
          <TextField fullWidth multiline rows={3} label="Descripción detallada *"
            placeholder="Explicá el cambio solicitado, motivo y justificación"
            value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} />
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <TextField label="Impacto económico (₡)" type="number"
              InputProps={{ startAdornment: <InputAdornment position="start">₡</InputAdornment> }}
              helperText="+ si es costo adicional"
              value={form.impactoEconomico}
              onChange={e => setForm(f => ({ ...f, impactoEconomico: e.target.value }))} />
            <TextField label="Impacto en cronograma (días)" type="number"
              helperText="+ días adicionales"
              value={form.impactoCronogramaDias}
              onChange={e => setForm(f => ({ ...f, impactoCronogramaDias: e.target.value }))} />
          </Box>
          <TextField fullWidth label="Notas adicionales" multiline rows={2}
            value={form.notas} onChange={e => setForm(f => ({ ...f, notas: e.target.value }))} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpenNew(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleCrear}
            disabled={saving || !form.titulo || !form.descripcion}
            sx={{ bgcolor: ACCENT, '&:hover': { bgcolor: '#1D4ED8' } }}>
            {saving ? 'Creando…' : 'Crear orden'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog detalle / aprobación */}
      <Dialog open={!!detalle} onClose={() => setDetalle(null)} maxWidth="sm" fullWidth>
        {detalle && (
          <>
            <DialogTitle sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
              <ChangeCircleIcon sx={{ color: ACCENT, fontSize: 20 }} />
              Orden de cambio
            </DialogTitle>
            <DialogContent>
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', gap: 1, mb: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
                  <Chip label={detalle.estado} size="small"
                    sx={{ bgcolor: ESTADO_ORDEN_STYLE[detalle.estado]?.bg, color: ESTADO_ORDEN_STYLE[detalle.estado]?.color, fontWeight: 700 }} />
                  <Typography fontSize={15} fontWeight={700}>{detalle.titulo}</Typography>
                </Box>
                <Typography fontSize={13.5} color="text.secondary" sx={{ mb: 2 }}>{detalle.descripcion}</Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
                  <Box sx={{ bgcolor: '#F8FAFC', borderRadius: '7px', p: 1.5 }}>
                    <Typography fontSize={11} color="text.secondary" sx={{ mb: 0.25 }}>Impacto económico</Typography>
                    <Typography fontSize={16} fontWeight={700} sx={{ color: detalle.impactoEconomico > 0 ? '#DC2626' : '#059669' }}>
                      {detalle.impactoEconomico > 0 ? '+' : ''}{fmtMonto(detalle.impactoEconomico)}
                    </Typography>
                  </Box>
                  <Box sx={{ bgcolor: '#F8FAFC', borderRadius: '7px', p: 1.5 }}>
                    <Typography fontSize={11} color="text.secondary" sx={{ mb: 0.25 }}>Impacto cronograma</Typography>
                    <Typography fontSize={16} fontWeight={700}>
                      {detalle.impactoCronogramaDias > 0 ? '+' : ''}{detalle.impactoCronogramaDias} días
                    </Typography>
                  </Box>
                </Box>
                {detalle.notas && (
                  <Box sx={{ bgcolor: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '7px', p: 1.5 }}>
                    <Typography fontSize={12.5} color="text.secondary">📝 {detalle.notas}</Typography>
                  </Box>
                )}
                <Typography fontSize={11.5} color="text.disabled" sx={{ mt: 1.5 }}>
                  Solicitada: {fmtDate(detalle.fechaSolicitud)}
                  {detalle.fechaResolucion && ` · Resuelta: ${fmtDate(detalle.fechaResolucion)}`}
                </Typography>
              </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2, justifyContent: 'space-between' }}>
              <Button color="error" size="small" startIcon={<DeleteIcon sx={{ fontSize: 14 }} />}
                onClick={() => handleEliminar(detalle.id)}>
                Eliminar
              </Button>
              <Box sx={{ display: 'flex', gap: 1 }}>
                {detalle.estado === 'Pendiente' && esConstructor && (
                  <>
                    <Button variant="outlined" color="error" size="small"
                      onClick={() => handleEstado(detalle.id, 'Rechazada')}>
                      Rechazar
                    </Button>
                    <Button variant="contained" size="small"
                      onClick={() => handleEstado(detalle.id, 'Aprobada')}
                      sx={{ bgcolor: '#059669', '&:hover': { bgcolor: '#047857' } }}>
                      Aprobar
                    </Button>
                  </>
                )}
                <Button onClick={() => setDetalle(null)} size="small">Cerrar</Button>
              </Box>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 4 — FOTOS
// ═══════════════════════════════════════════════════════════════════════════════
function TabFotos({ proyectoId, notify }) {
  const fileRef = useRef(null);
  const [fotos, setFotos]       = useState([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    proyectosApi.getFotos(proyectoId)
      .then(r => setFotos(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
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
      } catch { notify('Error al subir foto.', 'error'); }
    }
    setUploading(false);
    e.target.value = '';
  };

  if (loading) return <LinearProgress />;

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <Typography fontWeight={700}>{fotos.length} foto(s)</Typography>
        <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={handleFile} />
        <Button variant="outlined" startIcon={<AddPhotoAlternateIcon />}
          onClick={() => fileRef.current.click()} disabled={uploading} size="small">
          {uploading ? 'Subiendo…' : 'Subir fotos'}
        </Button>
      </Box>
      {fotos.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 6, cursor: 'pointer' }} onClick={() => fileRef.current.click()}>
          <PhotoLibraryIcon sx={{ fontSize: 52, color: 'text.disabled', mb: 1 }} />
          <Typography color="text.disabled">Subí la primera foto de la obra.</Typography>
        </Box>
      ) : (
        <ImageList cols={3} gap={8}>
          {fotos.map(f => (
            <ImageListItem key={f.id} sx={{ borderRadius: 2, overflow: 'hidden', cursor: 'pointer' }}
              onClick={() => window.open(`${API_BASE}${f.url}`, '_blank')}>
              <img src={`${API_BASE}${f.url}`} alt={f.nombreArchivo}
                style={{ width: '100%', height: 160, objectFit: 'cover' }}
                onError={e => { e.target.style.display = 'none'; }} />
            </ImageListItem>
          ))}
        </ImageList>
      )}
    </Box>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 5 — CARTA DE ACEPTACIÓN
// ═══════════════════════════════════════════════════════════════════════════════
function TabCarta({ proyectoId, esConstructor, esCliente, notify }) {
  const [carta,      setCarta]      = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [generando,  setGenerando]  = useState(false);
  const [aceptDialog,setAceptDialog]= useState(false);
  const [observacion,setObservacion]= useState('');
  const [aceptando,  setAceptando]  = useState(false);

  const cargar = () =>
    cartaApi.getByProyecto(proyectoId).then(r => setCarta(r.data)).catch(() => setCarta(null))
      .finally(() => setLoading(false));

  useEffect(() => { cargar(); }, [proyectoId]);

  const handleGenerar = async () => {
    setGenerando(true);
    try {
      const { data } = await cartaApi.generar(proyectoId); setCarta(data);
      notify('Carta de aceptación generada.');
    } catch (e) { notify(e.response?.data?.message || 'Error.', 'error'); }
    finally { setGenerando(false); }
  };

  const handleAceptar = async () => {
    setAceptando(true);
    try {
      await cartaApi.aceptar(carta.id, { observaciones: observacion || null });
      await cargar(); setAceptDialog(false); notify('¡Obra aceptada oficialmente! 🎉');
    } catch (e) { notify(e.response?.data?.message || 'Error.', 'error'); }
    finally { setAceptando(false); }
  };

  if (loading) return <LinearProgress />;

  if (!carta) {
    return (
      <Box sx={{ textAlign: 'center', py: 6 }}>
        <DescriptionIcon sx={{ fontSize: 52, color: 'text.disabled', mb: 1 }} />
        <Typography color="text.secondary" gutterBottom>La carta de aceptación aún no ha sido generada.</Typography>
        {esConstructor && (
          <Button variant="contained" startIcon={<DescriptionIcon />} onClick={handleGenerar} disabled={generando}
            sx={{ mt: 1, bgcolor: ACCENT, '&:hover': { bgcolor: '#1D4ED8' } }}>
            {generando ? 'Generando…' : 'Generar carta'}
          </Button>
        )}
      </Box>
    );
  }

  const { proyecto, propuesta, avances, equipo } = carta;
  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
        <Button variant="outlined" startIcon={<PrintIcon />} onClick={() => window.print()} size="small">Imprimir / PDF</Button>
        {esCliente && !carta.aceptado && (
          <Button variant="contained" startIcon={<CheckCircleIcon />} onClick={() => setAceptDialog(true)}
            sx={{ bgcolor: '#2E7D32', '&:hover': { bgcolor: '#1B5E20' } }} size="small">
            Firmar y aceptar
          </Button>
        )}
        {carta.aceptado && (
          <Chip icon={<CheckCircleIcon />} label={`Aceptada el ${fmtDate(carta.fechaAceptacion)}`}
            sx={{ bgcolor: '#E8F5E9', color: '#2E7D32', fontWeight: 700 }} />
        )}
      </Box>
      <Card id="carta-impresion" sx={{ border: '2px solid #E2E8F0', fontFamily: 'serif', maxWidth: 760, mx: 'auto' }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Typography variant="h5" fontWeight={900} sx={{ fontFamily: 'serif', letterSpacing: 1 }}>
              CARTA DE ACEPTACIÓN DE OBRA
            </Typography>
            <Typography variant="caption" color="text.secondary">Fecha: {fmtDate(carta.fechaEmision)}</Typography>
          </Box>
          <Divider sx={{ mb: 3 }} />
          <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1 }}>Datos del proyecto</Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mb: 2 }}>
            {[['Proyecto', proyecto?.titulo], ['Tipo', proyecto?.tipoProyecto],
              ['Ubicación', [proyecto?.canton, proyecto?.provincia].filter(Boolean).join(', ')],
              ['Inicio', fmtDate(proyecto?.fechaInicio)], ['Fin', fmtDate(proyecto?.fechaFin)]
            ].map(([l, v]) => (
              <Box key={l}>
                <Typography variant="caption" color="text.secondary">{l}</Typography>
                <Typography variant="body2" fontWeight={600}>{v || '—'}</Typography>
              </Box>
            ))}
          </Box>
          <Divider sx={{ mb: 2 }} />
          <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1 }}>Trabajo realizado</Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>{propuesta?.descripcion}</Typography>
          <Box sx={{ bgcolor: '#F8FAFC', borderRadius: 1, p: 1.5, mb: 2, display: 'inline-block' }}>
            <Typography variant="caption" color="text.secondary">Monto acordado</Typography>
            <Typography variant="h6" fontWeight={800}>{fmtMonto(propuesta?.montoTotal)}</Typography>
          </Box>
          <Divider sx={{ my: 3 }} />
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
            <Box sx={{ borderTop: '1px solid #333', pt: 1, textAlign: 'center' }}>
              <Typography variant="caption" fontWeight={700}>CONSTRUCTOR</Typography>
            </Box>
            <Box sx={{ borderTop: carta.aceptado ? '2px solid #2E7D32' : '1px solid #333', pt: 1, textAlign: 'center' }}>
              {carta.aceptado ? (
                <>
                  <CheckCircleIcon sx={{ color: '#2E7D32', fontSize: 18 }} />
                  <Typography variant="caption" fontWeight={700} display="block">CLIENTE — ACEPTADO</Typography>
                  <Typography variant="caption" color="text.secondary">{fmtDate(carta.fechaAceptacion)}</Typography>
                </>
              ) : <Typography variant="caption" fontWeight={700}>CLIENTE</Typography>}
            </Box>
          </Box>
        </CardContent>
      </Card>
      <Dialog open={aceptDialog} onClose={() => setAceptDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, display: 'flex', gap: 1, alignItems: 'center' }}>
          <EmojiEventsIcon sx={{ color: ACCENT }} /> Firmar carta de aceptación
        </DialogTitle>
        <DialogContent sx={{ pt: '8px !important' }}>
          <Alert severity="info" sx={{ mb: 2 }}>
            Al firmar confirmás que el trabajo fue entregado a tu satisfacción.
          </Alert>
          <TextField fullWidth multiline rows={3} label="Observaciones (opcional)"
            value={observacion} onChange={e => setObservacion(e.target.value)} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setAceptDialog(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleAceptar} disabled={aceptando} startIcon={<CheckCircleIcon />}
            sx={{ bgcolor: '#2E7D32', '&:hover': { bgcolor: '#1B5E20' } }}>
            {aceptando ? 'Firmando…' : 'Firmar y aceptar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PÁGINA PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════
export default function ObraDetalle() {
  const { proyectoId } = useParams();
  const navigate       = useNavigate();
  const { usuario }    = useAuth();
  const [proyecto,    setProyecto]    = useState(null);
  const [propActiva,  setPropActiva]  = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [tab,         setTab]         = useState(0);
  const [finDialog,   setFinDialog]   = useState(false);
  const [finalizando, setFinalizando] = useState(false);
  const [toast,       setToast]       = useState({ open: false, msg: '', severity: 'success' });
  const notify = (msg, severity = 'success') => setToast({ open: true, msg, severity });

  const cargarProyecto = () => proyectosApi.getById(proyectoId).then(r => setProyecto(r.data));

  useEffect(() => {
    Promise.all([
      cargarProyecto(),
      propuestasApi.getMias().then(r => {
        const prop = r.data.find(p =>
          String(p.proyectoId) === String(proyectoId) && p.estado === 'Aceptada');
        setPropActiva(prop ?? null);
      }).catch(() => {}),
    ]).catch(() => {}).finally(() => setLoading(false));
  }, [proyectoId]);

  const handleFinalizar = async () => {
    if (!propActiva) return;
    setFinalizando(true);
    try {
      await propuestasApi.finalizar(propActiva.id);
      setPropActiva(null); await cargarProyecto(); setFinDialog(false);
      notify('🎉 ¡Obra finalizada!');
    } catch (e) { notify(e.response?.data?.message || 'Error.', 'error'); }
    finally { setFinalizando(false); }
  };

  if (loading) return <LinearProgress />;
  if (!proyecto) return <Alert severity="error">Proyecto no encontrado.</Alert>;

  const esCliente     = proyecto.clienteId === usuario?.id;
  const esConstructor = usuario?.rol === 'Constructor';

  const TABS = [
    { label: 'Avances',       icon: <TimelineIcon /> },
    { label: 'Chat',          icon: <ChatIcon /> },
    { label: 'Presupuesto',   icon: <AccountBalanceIcon /> },
    { label: 'Equipo',        icon: <PeopleIcon /> },
    { label: 'Cambios',       icon: <ChangeCircleIcon /> },
    { label: 'Fotos',         icon: <PhotoLibraryIcon /> },
    { label: 'Carta',         icon: <DescriptionIcon /> },
  ];

  const estadoMap = {
    EnCurso:    { bg: '#DBEAFE', color: '#1D4ED8' },
    Completado: { bg: '#DCFCE7', color: '#166534' },
  };
  const estadoStyle = estadoMap[proyecto.estado] ?? { bg: '#F1F5F9', color: '#64748B' };

  return (
    <Box>

      {/* ── Operations Center Header ─────────────────────────────────────────── */}
      <Box sx={{
        bgcolor: '#0F1629',
        borderRadius: '12px',
        mb: 2,
        border: '1px solid rgba(255,255,255,0.08)',
        overflow: 'hidden',
      }}>
        {/* Accent bar */}
        <Box sx={{ height: 3, background: `linear-gradient(90deg, ${ACCENT} 0%, #60A5FA 100%)` }} />

        <Box sx={{ px: 3, pt: 2.5, pb: 2.5 }}>
          {/* Breadcrumb */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 2 }}>
            <Button
              size="small"
              startIcon={<ArrowBackIcon sx={{ fontSize: 13 }} />}
              onClick={() => navigate(esConstructor ? '/mis-propuestas' : '/mis-proyectos')}
              sx={{
                fontSize: 11.5, color: 'rgba(255,255,255,0.45)', textTransform: 'none',
                py: 0.3, px: 1, fontWeight: 600, minWidth: 0,
                '&:hover': { color: 'rgba(255,255,255,0.75)', bgcolor: 'rgba(255,255,255,0.06)' },
              }}>
              {esConstructor ? 'Mis propuestas' : 'Mis proyectos'}
            </Button>
            <Typography sx={{ color: 'rgba(255,255,255,0.18)', fontSize: 12 }}>/</Typography>
            <Typography sx={{ fontSize: 11.5, color: 'rgba(255,255,255,0.32)', fontWeight: 500 }}>
              Workspace de obra
            </Typography>
          </Box>

          {/* Title row */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 0.5 }}>
                <Box sx={{
                  width: 9, height: 9, borderRadius: '50%', flexShrink: 0,
                  bgcolor: proyecto.estado === 'EnCurso' ? '#22C55E' : proyecto.estado === 'Completado' ? '#10B981' : '#6B7280',
                  boxShadow: proyecto.estado === 'EnCurso' ? '0 0 10px rgba(34,197,94,0.6)' : 'none',
                }} />
                <Typography sx={{ fontSize: 21, fontWeight: 800, color: '#fff', lineHeight: 1.15 }}>
                  {proyecto.titulo}
                </Typography>
              </Box>
              {(proyecto.canton || proyecto.provincia || proyecto.areaM2) && (
                <Typography sx={{ fontSize: 12.5, color: 'rgba(255,255,255,0.38)', ml: 2.75 }}>
                  {[proyecto.canton, proyecto.provincia].filter(Boolean).join(', ')}
                  {proyecto.areaM2 && ` · ${proyecto.areaM2} m²`}
                </Typography>
              )}
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
              <Chip
                label={proyecto.estado === 'EnCurso' ? 'En ejecución' : proyecto.estado === 'Completado' ? 'Completado' : proyecto.estado}
                sx={{
                  bgcolor: 'rgba(255,255,255,0.08)',
                  color: proyecto.estado === 'EnCurso' ? '#4ADE80' : proyecto.estado === 'Completado' ? '#34D399' : '#94A3B8',
                  border: `1px solid ${proyecto.estado === 'EnCurso' ? 'rgba(74,222,128,0.25)' : 'rgba(148,163,184,0.2)'}`,
                  fontWeight: 700, fontSize: 12, height: 26,
                }}
              />
              {esConstructor && propActiva && proyecto.estado === 'EnCurso' && (
                <Button variant="contained" size="small" startIcon={<FlagIcon sx={{ fontSize: 14 }} />}
                  onClick={() => setFinDialog(true)}
                  sx={{ bgcolor: ACCENT, '&:hover': { bgcolor: '#1D4ED8' }, fontWeight: 700, fontSize: 12.5 }}>
                  Finalizar obra
                </Button>
              )}
            </Box>
          </Box>

          {/* Metrics strip — when propActiva has data */}
          {propActiva && (propActiva.montoTotal || propActiva.plazoMeses) && (
            <Box sx={{ display: 'flex', gap: 4, mt: 2.5, pt: 2, borderTop: '1px solid rgba(255,255,255,0.07)', flexWrap: 'wrap' }}>
              {propActiva.montoTotal > 0 && (
                <Box>
                  <Typography sx={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.07em', mb: 0.3 }}>
                    Monto contratado
                  </Typography>
                  <Typography sx={{ fontSize: 16, fontWeight: 700, color: '#60A5FA' }}>
                    {fmtMontoK(propActiva.montoTotal)}
                  </Typography>
                </Box>
              )}
              {propActiva.plazoMeses > 0 && (
                <Box>
                  <Typography sx={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.07em', mb: 0.3 }}>
                    Plazo
                  </Typography>
                  <Typography sx={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>
                    {propActiva.plazoMeses} {propActiva.plazoMeses === 1 ? 'mes' : 'meses'}
                  </Typography>
                </Box>
              )}
              {proyecto.tipoObra && (
                <Box>
                  <Typography sx={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.07em', mb: 0.3 }}>
                    Tipo de obra
                  </Typography>
                  <Typography sx={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>
                    {proyecto.tipoObra}
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </Box>
      </Box>

      {/* Dialog finalizar */}
      <Dialog open={finDialog} onClose={() => setFinDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>¿Finalizar la obra?</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary">
            Esto marcará el proyecto como <strong>Completado</strong> y el cliente podrá calificarte.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setFinDialog(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleFinalizar} disabled={finalizando} startIcon={<FlagIcon />}
            sx={{ bgcolor: ACCENT, '&:hover': { bgcolor: '#1D4ED8' } }}>
            {finalizando ? 'Finalizando…' : 'Sí, finalizar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Tabs — clean card */}
      <Box sx={{ bgcolor: '#fff', border: '1px solid #E2E8F0', borderRadius: '8px', mb: 2, overflow: 'hidden' }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto"
          sx={{
            '& .MuiTab-root': {
              fontWeight: 600, textTransform: 'none', fontSize: 13,
              minHeight: 46, px: 2.25, color: '#64748B',
              '& .MuiTab-iconWrapper': { mr: 0.75 },
            },
            '& .Mui-selected': { color: ACCENT, fontWeight: 700 },
            '& .MuiTabs-indicator': { bgcolor: ACCENT, height: 2.5 },
          }}>
          {TABS.map(t => <Tab key={t.label} icon={t.icon} iconPosition="start" label={t.label} />)}
        </Tabs>
      </Box>

      <TabPanel value={tab} index={0}>
        <TabAvances proyectoId={proyectoId} esConstructor={esConstructor} proyectoEstado={proyecto.estado} notify={notify} />
      </TabPanel>
      <TabPanel value={tab} index={1}>
        <TabChat proyectoId={proyectoId} usuario={usuario} notify={notify} />
      </TabPanel>
      <TabPanel value={tab} index={2}>
        <TabPresupuesto proyectoId={proyectoId} notify={notify} />
      </TabPanel>
      <TabPanel value={tab} index={3}>
        <TabEquipo proyectoId={proyectoId} esConstructor={esConstructor} notify={notify} />
      </TabPanel>
      <TabPanel value={tab} index={4}>
        <TabOrdenes proyectoId={proyectoId} esConstructor={esConstructor} notify={notify} />
      </TabPanel>
      <TabPanel value={tab} index={5}>
        <TabFotos proyectoId={proyectoId} notify={notify} />
      </TabPanel>
      <TabPanel value={tab} index={6}>
        <TabCarta proyectoId={proyectoId} esConstructor={esConstructor} esCliente={esCliente} notify={notify} />
      </TabPanel>

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
