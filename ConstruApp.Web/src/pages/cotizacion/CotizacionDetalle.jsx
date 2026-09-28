import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Card, CardContent, Chip, Button,
  LinearProgress, Alert, Divider, Avatar, Tooltip,
  Accordion, AccordionSummary, AccordionDetails, Tab, Tabs,
} from '@mui/material';
import ArrowBackIcon          from '@mui/icons-material/ArrowBack';
import AutoAwesomeIcon        from '@mui/icons-material/AutoAwesome';
import RefreshIcon            from '@mui/icons-material/Refresh';
import AddPhotoAlternateIcon  from '@mui/icons-material/AddPhotoAlternate';
import ExpandMoreIcon         from '@mui/icons-material/ExpandMore';
import EngineeringIcon        from '@mui/icons-material/Engineering';
import ConstructionIcon       from '@mui/icons-material/Construction';
import TipsAndUpdatesIcon     from '@mui/icons-material/TipsAndUpdates';
import AccessTimeIcon         from '@mui/icons-material/AccessTime';
import VerifiedIcon           from '@mui/icons-material/Verified';
import EmojiEventsIcon        from '@mui/icons-material/EmojiEvents';
import PictureAsPdfIcon       from '@mui/icons-material/PictureAsPdf';
import { PDFDownloadLink }    from '@react-pdf/renderer';
import { CotizacionPDF }      from '../../utils/pdf/CotizacionPDF';
import { cotizacionIAApi, proyectosApi } from '../../api/endpoints';

const ACCENT = '#2563EB';

const CAT_COLORS = {
  Estructura:  { bg: '#EFF6FF', color: '#1E40AF', border: '#BFDBFE' },
  Acabados:    { bg: '#F0FDF4', color: '#166534', border: '#BBF7D0' },
  Electrico:   { bg: '#FFFBEB', color: '#92400E', border: '#FDE68A' },
  Plomeria:    { bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE' },
  Pintura:     { bg: '#FDF4FF', color: '#7E22CE', border: '#E9D5FF' },
  Madera:      { bg: '#FFF7ED', color: '#C2410C', border: '#FED7AA' },
  Ferreteria:  { bg: '#F8FAFC', color: '#475569', border: '#CBD5E1' },
  ManoDeObra:  { bg: '#FEF9C3', color: '#854D0E', border: '#FDE047' },
  Otro:        { bg: '#F8FAFC', color: '#64748B', border: '#E2E8F0' },
};

function fmt(n) {
  return (n ?? 0).toLocaleString('es-CR', { style: 'currency', currency: 'CRC', maximumFractionDigits: 0 });
}

export default function CotizacionDetalle() {
  const { proyectoId } = useParams();
  const navigate       = useNavigate();
  const fileRef        = useRef(null);

  const [planes,      setPlanes]      = useState([]);    // array de 3 cotizaciones
  const [tabActivo,   setTabActivo]   = useState(1);    // 0=eco, 1=std, 2=premium
  const [proyecto,    setProyecto]    = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [regenerando, setRegenerando] = useState(false);
  const [error,       setError]       = useState('');
  const [imagenes,    setImagenes]    = useState([]);

  const cargarPlanes = (data) => {
    // El API devuelve array; si es objeto único lo envolvemos
    const arr = Array.isArray(data) ? data : [data];
    const orden = { economico: 0, estandar: 1, premium: 2 };
    arr.sort((a, b) => (orden[a.plan] ?? 1) - (orden[b.plan] ?? 1));
    setPlanes(arr);
    // Seleccionar pestaña "estandar" por defecto
    const idx = arr.findIndex(p => p.plan === 'estandar');
    setTabActivo(idx >= 0 ? idx : 0);
  };

  useEffect(() => {
    Promise.all([
      cotizacionIAApi.getByProyecto(proyectoId)
        .then(r => cargarPlanes(r.data))
        .catch(() => {}),
      proyectosApi.getById(proyectoId).then(r => setProyecto(r.data)).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, [proyectoId]);

  // Plan actualmente visible
  const cotizacion = planes[tabActivo] ?? null;
  const analisisIA = cotizacion?.analisisIA ?? null;

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = ev => setImagenes(prev => [...prev, ev.target.result.split(',')[1]]); // base64 sin prefijo
      reader.readAsDataURL(file);
    });
  };

  const handleGenerar = async () => {
    setRegenerando(true);
    setError('');
    try {
      const payload = imagenes.length > 0 ? { imagenesBase64: imagenes } : undefined;
      const { data } = await cotizacionIAApi.generar(proyectoId, payload);
      cargarPlanes(data);
      setImagenes([]);
    } catch {
      setError('Error al generar la cotización. Intente de nuevo.');
    } finally {
      setRegenerando(false);
    }
  };

  if (loading) return <LinearProgress />;

  const proyectoCompletado = proyecto?.estado === 'Completado';
  const lineas      = cotizacion?.lineas ?? cotizacion?.Lineas ?? [];
  const materiales  = lineas.filter(l => !l.esManoDeObra);
  const manoObra    = lineas.filter(l => l.esManoDeObra);
  const totalLineas = lineas.reduce((s, l) => s + (l.precioTotal || 0), 0);

  return (
    <Box sx={{ maxWidth: 980, mx: 'auto' }}>
      {/* ── Back + Header ─────────────────────────────────────────── */}
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/mis-proyectos')}
        sx={{ mb: 2, color: 'text.secondary' }}>
        Mis proyectos
      </Button>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
            <Box sx={{ bgcolor: ACCENT, borderRadius: 1.5, p: 0.6, display: 'flex' }}>
              <AutoAwesomeIcon sx={{ color: '#fff', fontSize: 20 }} />
            </Box>
            <Typography variant="h5" fontWeight={800}>Cotización con IA</Typography>
            <Chip label="Llama 3.3 · Groq" size="small"
              sx={{ bgcolor: '#EFF6FF', color: '#1D4ED8', fontWeight: 700,
                border: '1px solid #BFDBFE', fontSize: 11 }} />
          </Box>
          <Typography color="text.secondary" fontSize={14}>{proyecto?.titulo}</Typography>
        </Box>

        {/* Acciones */}
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* PDF download (visible si hay cotización) */}
          {cotizacion && (
            <PDFDownloadLink
              document={<CotizacionPDF cotizacion={cotizacion} analisisIA={analisisIA} proyecto={proyecto} />}
              fileName={`cotizacion-${proyecto?.titulo?.replace(/\s+/g, '-').toLowerCase() ?? 'ia'}.pdf`}
              style={{ textDecoration: 'none' }}
            >
              {({ loading: pdfLoading }) => (
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<PictureAsPdfIcon />}
                  disabled={pdfLoading}
                  sx={{
                    borderColor: '#E2E8F0', color: '#64748B',
                    fontWeight: 600, textTransform: 'none',
                    '&:hover': { borderColor: ACCENT, color: ACCENT, bgcolor: 'transparent' },
                  }}
                >
                  {pdfLoading ? 'Generando…' : 'Descargar PDF'}
                </Button>
              )}
            </PDFDownloadLink>
          )}

          {!proyectoCompletado && (
            <>
              <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={handleFileChange} />
              <Tooltip title={imagenes.length > 0 ? `${imagenes.length} imagen(es) lista(s)` : 'Adjuntar fotos del lugar para análisis más preciso'}>
                <Button variant="outlined" size="small"
                  startIcon={<AddPhotoAlternateIcon />}
                  onClick={() => fileRef.current.click()}
                  sx={{ borderColor: imagenes.length > 0 ? ACCENT : undefined,
                    color: imagenes.length > 0 ? ACCENT : undefined }}>
                  {imagenes.length > 0 ? `${imagenes.length} foto(s)` : 'Adjuntar fotos'}
                </Button>
              </Tooltip>
              <Button variant="contained" startIcon={cotizacion ? <RefreshIcon /> : <AutoAwesomeIcon />}
                onClick={handleGenerar} disabled={regenerando}
                sx={{ bgcolor: ACCENT, '&:hover': { bgcolor: '#1D4ED8' } }}>
                {regenerando ? 'Analizando con IA…' : cotizacion ? 'Regenerar' : 'Generar con IA'}
              </Button>
            </>
          )}
        </Box>
      </Box>

      {/* Banner proyecto completado */}
      {proyectoCompletado && (
        <Card sx={{ mb: 2.5, bgcolor: '#F0FDF4', border: '1px solid #BBF7D0' }} elevation={0}>
          <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: '12px !important' }}>
            <EmojiEventsIcon sx={{ color: '#16A34A', fontSize: 32 }} />
            <Box>
              <Typography fontWeight={800} color="text.primary">Proyecto completado</Typography>
              <Typography variant="body2" color="text.secondary">
                Este proyecto ya está finalizado. La cotización generada es solo de consulta — no se pueden crear nuevas estimaciones.
              </Typography>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* ── Tabs de propuestas ───────────────────────────────────── */}
      {planes.length > 1 && (
        <Card sx={{ mb: 2.5, border: '1px solid rgba(0,0,0,0.07)', overflow: 'hidden' }}>
          <Tabs
            value={tabActivo}
            onChange={(_, v) => setTabActivo(v)}
            variant="fullWidth"
            sx={{
              '& .MuiTab-root': { fontWeight: 700, textTransform: 'none', fontSize: 14, py: 1.5 },
              '& .Mui-selected': { color: ACCENT },
              '& .MuiTabs-indicator': { bgcolor: ACCENT, height: 3 },
            }}
          >
            {planes.map((p, i) => {
              const iconos = { economico: '🟢', estandar: '🟡', premium: '🔴' };
              return (
                <Tab
                  key={p.plan}
                  label={
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.3 }}>
                      <Typography fontSize={18}>{iconos[p.plan] ?? '⚪'}</Typography>
                      <Typography fontSize={13} fontWeight={700}>{p.nombrePlan}</Typography>
                      <Typography fontSize={11} color="text.secondary">
                        {p.rangoMinimo?.toLocaleString('es-CR', { style: 'currency', currency: 'CRC', maximumFractionDigits: 0 })}
                      </Typography>
                    </Box>
                  }
                  value={i}
                />
              );
            })}
          </Tabs>
        </Card>
      )}

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {regenerando && (
        <Box sx={{ mb: 2 }}>
          <LinearProgress sx={{ borderRadius: 2, '& .MuiLinearProgress-bar': { bgcolor: ACCENT } }} />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
            Llama 3.3 está generando 3 propuestas para tu proyecto…
          </Typography>
        </Box>
      )}

      {/* ── Estado vacío ─────────────────────────────────────────── */}
      {planes.length === 0 ? (
        <Card sx={{ textAlign: 'center', py: 8, border: '2px dashed #BFDBFE', bgcolor: '#EFF6FF' }} elevation={0}>
          <Box sx={{ bgcolor: ACCENT, borderRadius: 3, p: 1.5, display: 'inline-flex', mb: 2 }}>
            <AutoAwesomeIcon sx={{ color: '#fff', fontSize: 36 }} />
          </Box>
          <Typography fontWeight={700} fontSize={18} gutterBottom>
            Aún no hay cotización para este proyecto
          </Typography>
          {proyectoCompletado ? (
            <Typography color="text.secondary" sx={{ mb: 3, maxWidth: 440, mx: 'auto' }}>
              El proyecto está completado. Ya no es posible generar nuevas cotizaciones con IA.
            </Typography>
          ) : (
            <>
              <Typography color="text.secondary" sx={{ mb: 3, maxWidth: 440, mx: 'auto' }}>
                La IA generará 3 propuestas (Económica, Estándar y Premium) con
                materiales, mano de obra y precios estimados. Podés adjuntar fotos
                del lugar para un análisis más preciso.
              </Typography>
              <Button variant="contained" size="large" startIcon={<AutoAwesomeIcon />}
                onClick={handleGenerar} disabled={regenerando}
                sx={{ bgcolor: ACCENT, '&:hover': { bgcolor: '#1D4ED8' }, px: 4 }}>
                Generar cotización IA
              </Button>
            </>
          )}
        </Card>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>

          {/* ── Tarjeta de rango + metadatos ─────────────────────── */}
          <Card sx={{ border: '1px solid #BFDBFE', bgcolor: '#EFF6FF' }} elevation={0}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, alignItems: 'center' }}>
                {/* Rango */}
                <Box sx={{ flex: 1, minWidth: 220 }}>
                  <Typography variant="caption" sx={{ color: '#64748B', letterSpacing: 1 }}>
                    RANGO ESTIMADO (CRC)
                  </Typography>
                  <Typography variant="h3" fontWeight={900} sx={{ color: '#1E40AF', lineHeight: 1.1, mt: 0.5 }}>
                    {fmt(cotizacion.rangoMinimo)}
                    <Typography component="span" variant="h5" fontWeight={400} sx={{ color: '#94A3B8', mx: 1 }}>–</Typography>
                    {fmt(cotizacion.rangoMaximo)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Incluye ±15% de variación por imprevistos
                  </Typography>
                </Box>

                {/* Meta badges */}
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  {analisisIA?.tipoProyecto && (
                    <Box sx={{ bgcolor: '#fff', border: '1px solid #BFDBFE', borderRadius: 2, px: 2, py: 1.5, textAlign: 'center' }}>
                      <ConstructionIcon sx={{ color: ACCENT, fontSize: 18, mb: 0.25 }} />
                      <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block', fontSize: 10 }}>TIPO</Typography>
                      <Typography fontSize={12} fontWeight={700} color="text.primary" sx={{ textTransform: 'capitalize' }}>
                        {analisisIA.tipoProyecto.replace('_', ' ')}
                      </Typography>
                    </Box>
                  )}
                  {analisisIA?.duracionEstimada && (
                    <Box sx={{ bgcolor: '#fff', border: '1px solid #BFDBFE', borderRadius: 2, px: 2, py: 1.5, textAlign: 'center' }}>
                      <AccessTimeIcon sx={{ color: ACCENT, fontSize: 18, mb: 0.25 }} />
                      <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block', fontSize: 10 }}>DURACIÓN</Typography>
                      <Typography fontSize={12} fontWeight={700} color="text.primary">
                        {analisisIA.duracionEstimada}
                      </Typography>
                    </Box>
                  )}
                  <Box sx={{ bgcolor: '#fff', border: '1px solid #BFDBFE', borderRadius: 2, px: 2, py: 1.5, textAlign: 'center' }}>
                    <VerifiedIcon sx={{ color: ACCENT, fontSize: 18, mb: 0.25 }} />
                    <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block', fontSize: 10 }}>GENERADO</Typography>
                    <Typography fontSize={12} fontWeight={700} color="text.primary">
                      {new Date(cotizacion.fechaGeneracion).toLocaleDateString('es-CR')}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {cotizacion.resumenIA && (
                <>
                  <Divider sx={{ borderColor: '#BFDBFE', my: 2 }} />
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.65 }}>
                    {cotizacion.resumenIA}
                  </Typography>
                </>
              )}
            </CardContent>
          </Card>

          {/* ── Mano de obra identificada ─────────────────────────── */}
          {analisisIA?.manoDeObra?.length > 0 && (
            <Card sx={{ border: '1px solid rgba(0,0,0,0.07)' }}>
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                  <EngineeringIcon sx={{ color: ACCENT, fontSize: 18 }} />
                  <Typography fontWeight={700} fontSize={14}>Especialistas necesarios</Typography>
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {analisisIA.manoDeObra.map(mo => (
                    <Chip key={mo} label={mo} size="small"
                      sx={{ bgcolor: '#DBEAFE', color: '#1D4ED8', fontWeight: 600,
                      border: '1px solid #BFDBFE', fontSize: 12 }} />
                  ))}
                </Box>
              </CardContent>
            </Card>
          )}

          {/* ── Desglose de materiales ────────────────────────────── */}
          <Card sx={{ border: '1px solid rgba(0,0,0,0.07)' }}>
            <CardContent sx={{ p: 0 }}>
              <Box sx={{ px: 3, py: 2, borderBottom: '1px solid', borderColor: 'divider',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography fontWeight={700}>Desglose detallado</Typography>
                <Typography variant="caption" color="text.secondary">
                  {lineas.length} ítems • Precios en CRC 2025
                </Typography>
              </Box>

              {/* Cabecera tabla */}
              <Box sx={{ display: 'grid', gridTemplateColumns: '3fr 0.8fr 1.1fr 1.1fr',
                gap: 1, px: 2.5, py: 1.5, bgcolor: '#F8FAFC',
                borderBottom: '1px solid', borderColor: 'divider' }}>
                {['Material / Ítem', 'Cant.', 'P. Unit.', 'Total'].map(h => (
                  <Typography key={h} variant="caption" fontWeight={700}
                    sx={{ color: '#64748B', textTransform: 'uppercase', fontSize: 11 }}>
                    {h}
                  </Typography>
                ))}
              </Box>

              {/* Materiales */}
              {materiales.map((l, i) => {
                const cat = CAT_COLORS[l.categoria] ?? CAT_COLORS.Otro;
                return (
                  <Box key={i} sx={{ display: 'grid', gridTemplateColumns: '3fr 0.8fr 1.1fr 1.1fr',
                    gap: 1, px: 2.5, py: 1.5,
                    borderBottom: '1px solid', borderColor: 'divider',
                    '&:hover': { bgcolor: '#FAFAFA' } }}>
                    <Box>
                      <Typography variant="body2" fontWeight={500}>{l.descripcion}</Typography>
                      <Chip label={l.categoria} size="small"
                        sx={{ mt: 0.5, bgcolor: cat.bg, color: cat.color,
                          border: `1px solid ${cat.border}`, fontSize: 10, fontWeight: 600, height: 18 }} />
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {l.cantidad} <span style={{ fontSize: 11 }}>{l.unidad}</span>
                    </Typography>
                    <Typography variant="body2">{fmt(l.precioUnitario)}</Typography>
                    <Typography variant="body2" fontWeight={700}>{fmt(l.precioTotal)}</Typography>
                  </Box>
                );
              })}

              {/* Mano de obra */}
              {manoObra.length > 0 && (
                <>
                  <Box sx={{ px: 2.5, py: 1, bgcolor: '#EFF6FF',
                    borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="caption" fontWeight={700} sx={{ color: '#1E40AF' }}>
                      MANO DE OBRA
                    </Typography>
                  </Box>
                  {manoObra.map((l, i) => (
                    <Box key={i} sx={{ display: 'grid', gridTemplateColumns: '3fr 0.8fr 1.1fr 1.1fr',
                      gap: 1, px: 2.5, py: 1.5,
                      borderBottom: '1px solid', borderColor: 'divider',
                      bgcolor: '#F0F9FF' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <EngineeringIcon sx={{ fontSize: 15, color: '#92400E' }} />
                        <Typography variant="body2" fontWeight={500}>{l.descripcion}</Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {l.cantidad} <span style={{ fontSize: 11 }}>{l.unidad}</span>
                      </Typography>
                      <Typography variant="body2">{fmt(l.precioUnitario)}</Typography>
                      <Typography variant="body2" fontWeight={700}>{fmt(l.precioTotal)}</Typography>
                    </Box>
                  ))}
                </>
              )}

              {/* Total */}
              <Box sx={{ display: 'grid', gridTemplateColumns: '3fr 0.8fr 1.1fr 1.1fr',
                gap: 1, px: 2.5, py: 2,
                bgcolor: ACCENT, borderBottomLeftRadius: 8, borderBottomRightRadius: 8 }}>
                <Typography fontWeight={800} sx={{ color: '#fff' }}>TOTAL BASE ESTIMADO</Typography>
                <Box /><Box />
                <Typography fontWeight={900} fontSize={16} sx={{ color: '#fff' }}>
                  {fmt(totalLineas)}
                </Typography>
              </Box>
            </CardContent>
          </Card>

          {/* ── Recomendaciones IA ───────────────────────────────── */}
          {analisisIA?.recomendaciones?.length > 0 && (
            <Accordion sx={{ border: '1px solid rgba(0,0,0,0.07)', borderRadius: '8px !important',
              '&:before': { display: 'none' } }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TipsAndUpdatesIcon sx={{ color: ACCENT, fontSize: 18 }} />
                  <Typography fontWeight={700} fontSize={14}>
                    Recomendaciones de la IA ({analisisIA.recomendaciones.length})
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 3, pb: 2.5 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {analisisIA.recomendaciones.map((r, i) => (
                    <Box key={i} sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                      <Avatar sx={{ width: 22, height: 22, bgcolor: '#DBEAFE',
                        color: '#1D4ED8', fontSize: 11, fontWeight: 800, flexShrink: 0, mt: 0.25 }}>
                        {i + 1}
                      </Avatar>
                      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                        {r}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </AccordionDetails>
            </Accordion>
          )}

          {/* ── Aviso legal ──────────────────────────────────────── */}
          <Typography variant="caption" color="text.disabled" sx={{ textAlign: 'center', pb: 1 }}>
            * Estimación generada por IA. Los precios son orientativos y pueden variar según proveedor,
            disponibilidad y especificaciones finales. Verificar con el constructor antes de comprometerse.
          </Typography>
        </Box>
      )}
    </Box>
  );
}
