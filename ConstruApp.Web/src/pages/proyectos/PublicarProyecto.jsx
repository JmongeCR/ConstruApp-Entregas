import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, TextField, Button, Grid, Alert,
  CircularProgress, InputAdornment, Divider, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Avatar,
} from '@mui/material';
import HomeWorkIcon       from '@mui/icons-material/HomeWork';
import FoundationIcon     from '@mui/icons-material/Foundation';
import BoltIcon           from '@mui/icons-material/Bolt';
import BrushIcon          from '@mui/icons-material/Brush';
import ViewModuleIcon     from '@mui/icons-material/ViewModule';
import RoofingIcon        from '@mui/icons-material/Roofing';
import SpaIcon            from '@mui/icons-material/Spa';
import HandymanIcon       from '@mui/icons-material/Handyman';
import ArrowBackIcon      from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon   from '@mui/icons-material/ArrowForward';
import AutoAwesomeIcon    from '@mui/icons-material/AutoAwesome';
import PublishIcon        from '@mui/icons-material/Publish';
import BookmarkIcon       from '@mui/icons-material/Bookmark';
import LocationOnIcon     from '@mui/icons-material/LocationOn';
import AttachMoneyIcon    from '@mui/icons-material/AttachMoney';
import VerifiedIcon       from '@mui/icons-material/Verified';
import { proyectosApi, cotizacionIAApi } from '../../api/endpoints';

const ACCENT = '#2563EB';

const TIPOS = [
  {
    value: 'Remodelacion',
    label: 'Remodelación',
    desc: 'Cocinas, baños, ampliaciones internas',
    Icon: HomeWorkIcon,
    color: '#EA580C',
    bg: '#FFF7ED',
    border: '#FED7AA',
  },
  {
    value: 'ObraGris',
    label: 'Obra gris',
    desc: 'Cimentación, columnas, paredes, losas',
    Icon: FoundationIcon,
    color: '#475569',
    bg: '#F8FAFC',
    border: '#E2E8F0',
  },
  {
    value: 'ElectricoPlomeria',
    label: 'Eléctrico / Plomería',
    desc: 'Instalaciones, reparaciones, certificaciones',
    Icon: BoltIcon,
    color: '#D97706',
    bg: '#FFFBEB',
    border: '#FDE68A',
  },
  {
    value: 'Pintura',
    label: 'Pintura',
    desc: 'Interior, exterior, texturas y acabados',
    Icon: BrushIcon,
    color: '#7C3AED',
    bg: '#FAF5FF',
    border: '#DDD6FE',
  },
  {
    value: 'Pisos',
    label: 'Pisos',
    desc: 'Cerámica, porcelanato, madera, vinilo',
    Icon: ViewModuleIcon,
    color: '#92400E',
    bg: '#FFFBEB',
    border: '#FDE68A',
  },
  {
    value: 'Techos',
    label: 'Techos',
    desc: 'Cubiertas, estructura, impermeabilización',
    Icon: RoofingIcon,
    color: '#1D4ED8',
    bg: '#EFF6FF',
    border: '#BFDBFE',
  },
  {
    value: 'PiscinaJardin',
    label: 'Piscina / Jardín',
    desc: 'Diseño, construcción, mantenimiento',
    Icon: SpaIcon,
    color: '#059669',
    bg: '#ECFDF5',
    border: '#A7F3D0',
  },
  {
    value: 'Otro',
    label: 'Otro',
    desc: 'Proyectos especiales o mixtos',
    Icon: HandymanIcon,
    color: '#6B7280',
    bg: '#F9FAFB',
    border: '#E5E7EB',
  },
];

const PROVINCIAS = ['San José','Alajuela','Cartago','Heredia','Guanacaste','Puntarenas','Limón'];

const PLAN_META = {
  economico: { accent: '#16A34A', bg: '#F0FDF4', border: '#BBF7D0', badge: 'Económico',  desc: 'Materiales básicos, sin acabados premium' },
  estandar:  { accent: ACCENT,    bg: '#EFF6FF', border: '#BFDBFE', badge: 'Estándar',   desc: 'Balance calidad-precio recomendado' },
  premium:   { accent: '#7C3AED', bg: '#FAF5FF', border: '#E9D5FF', badge: 'Premium',    desc: 'Materiales de alta gama, acabados superiores' },
};

/* ── Step dot ── */
function StepDot({ n, label, state }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Box sx={{
        width: 28, height: 28, borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        bgcolor: state === 'done' ? ACCENT : state === 'active' ? '#fff' : '#F1F5F9',
        border: state === 'active' ? `2px solid ${ACCENT}` : state === 'done' ? `2px solid ${ACCENT}` : '2px solid #E2E8F0',
        flexShrink: 0,
      }}>
        {state === 'done'
          ? <Box component="span" sx={{ fontSize: 13, color: '#fff' }}>✓</Box>
          : <Typography fontSize={12} fontWeight={700}
              color={state === 'active' ? ACCENT : '#94A3B8'}>{n}</Typography>
        }
      </Box>
      <Typography fontSize={12.5} fontWeight={state === 'active' ? 600 : 400}
        color={state === 'active' ? 'text.primary' : state === 'done' ? ACCENT : '#94A3B8'}>
        {label}
      </Typography>
    </Box>
  );
}

/* ── Preview panel — cómo lo ve un constructor ── */
function PreviewPanel({ form }) {
  const tipo = TIPOS.find(t => t.value === form.tipoProyecto);
  const sinTitulo = !form.titulo.trim();
  const sinDesc   = !form.descripcion.trim();

  return (
    <Box sx={{
      width: 340, flexShrink: 0,
      bgcolor: '#0F172A',
      display: 'flex', flexDirection: 'column',
      borderLeft: '1px solid rgba(255,255,255,0.06)',
    }}>
      {/* Header del preview */}
      <Box sx={{ px: 3, pt: 3, pb: 2, borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <Typography fontSize={10} fontWeight={700}
          sx={{ color: 'rgba(255,255,255,0.35)', letterSpacing: '0.1em', textTransform: 'uppercase', mb: 0.5 }}>
          Vista previa
        </Typography>
        <Typography fontSize={12.5} sx={{ color: 'rgba(255,255,255,0.5)' }}>
          Así verá tu proyecto un constructor
        </Typography>
      </Box>

      {/* Tarjeta simulada */}
      <Box sx={{ p: 2.5, flex: 1 }}>
        <Box sx={{
          bgcolor: '#fff', borderRadius: 1.5, overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.08)',
        }}>
          {/* Tipo badge */}
          <Box sx={{
            bgcolor: tipo?.bg ?? '#F9FAFB',
            px: 2, py: 1.25,
            borderBottom: `1px solid ${tipo?.border ?? '#E5E7EB'}`,
            display: 'flex', alignItems: 'center', gap: 0.75,
          }}>
            {tipo?.Icon && <tipo.Icon sx={{ fontSize: 14, color: tipo.color }} />}
            <Typography fontSize={11.5} fontWeight={600} sx={{ color: tipo?.color ?? '#6B7280' }}>
              {tipo?.label ?? 'Proyecto'}
            </Typography>
          </Box>

          <Box sx={{ p: 2 }}>
            {/* Título */}
            {sinTitulo ? (
              <Box sx={{ bgcolor: '#F1F5F9', borderRadius: 0.75, height: 18, width: '70%', mb: 1 }} />
            ) : (
              <Typography fontSize={13.5} fontWeight={700} color="text.primary" sx={{
                mb: 0.75, display: '-webkit-box',
                WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
              }}>
                {form.titulo}
              </Typography>
            )}

            {/* Descripción */}
            {sinDesc ? (
              <Box sx={{ mb: 1.5 }}>
                <Box sx={{ bgcolor: '#F1F5F9', borderRadius: 0.5, height: 12, width: '100%', mb: 0.5 }} />
                <Box sx={{ bgcolor: '#F1F5F9', borderRadius: 0.5, height: 12, width: '85%', mb: 0.5 }} />
                <Box sx={{ bgcolor: '#F1F5F9', borderRadius: 0.5, height: 12, width: '60%' }} />
              </Box>
            ) : (
              <Typography fontSize={12} color="text.secondary" sx={{
                mb: 1.5, display: '-webkit-box',
                WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                lineHeight: 1.55,
              }}>
                {form.descripcion}
              </Typography>
            )}

            {/* Meta */}
            <Divider sx={{ mb: 1.25 }} />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.6 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <LocationOnIcon sx={{ fontSize: 13, color: 'text.disabled' }} />
                <Typography fontSize={12} color="text.secondary">
                  {[form.canton, form.provincia].filter(Boolean).join(', ') || '—'}
                </Typography>
              </Box>
              {form.presupuestoMax && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <AttachMoneyIcon sx={{ fontSize: 13, color: 'text.disabled' }} />
                  <Typography fontSize={12} color="text.secondary">
                    Máx: ₡{parseFloat(form.presupuestoMax || 0).toLocaleString('es-CR')}
                  </Typography>
                </Box>
              )}
            </Box>

            {/* CTA simulado */}
            <Box sx={{
              mt: 1.75, bgcolor: ACCENT, borderRadius: 1,
              py: 0.9, textAlign: 'center',
            }}>
              <Typography fontSize={12.5} fontWeight={600} color="#fff">Enviar propuesta</Typography>
            </Box>
          </Box>
        </Box>

        {/* Constructor simulado */}
        <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1.25 }}>
          <Avatar sx={{ width: 32, height: 32, bgcolor: '#1D4ED8', fontSize: 12, fontWeight: 700 }}>C</Avatar>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Typography fontSize={12} fontWeight={600} sx={{ color: 'rgba(255,255,255,0.7)' }}>
                Constructor verificado
              </Typography>
              <VerifiedIcon sx={{ fontSize: 12, color: ACCENT }} />
            </Box>
            <Typography fontSize={11} sx={{ color: 'rgba(255,255,255,0.35)' }}>
              verá tu proyecto y podrá cotizar
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

/* ══════════════════════════════════════════════════════════════════
   Main
══════════════════════════════════════════════════════════════════ */
export default function PublicarProyecto() {
  const navigate = useNavigate();
  const [step, setStep]       = useState(0);
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const [proyecto, setProyecto] = useState(null);
  const [planes,   setPlanes]   = useState([]);

  const [form, setForm] = useState({
    titulo:         '',
    descripcion:    '',
    tipoProyecto:   '',          // sin preselección forzada
    canton:         '',
    provincia:      'San José',
    presupuestoMax: '',
    areaM2:         '',
  });

  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }));

  const handleNext = async () => {
    setError('');
    if (step === 0) {
      if (!form.tipoProyecto)
        return setError('Seleccioná el tipo de proyecto.');
      if (!form.titulo.trim() || !form.descripcion.trim())
        return setError('Completá el nombre y la descripción.');
      setStep(1);
    } else if (step === 1) {
      setLoading(true);
      try {
        const { data } = await proyectosApi.create({
          titulo:         form.titulo,
          descripcion:    form.descripcion,
          tipoProyecto:   form.tipoProyecto,
          canton:         form.canton || null,
          provincia:      form.provincia,
          presupuestoMax: form.presupuestoMax ? parseFloat(form.presupuestoMax) : null,
          areaM2:         form.areaM2 ? parseFloat(form.areaM2) : null,
        });
        setProyecto(data);
        const { data: cot } = await cotizacionIAApi.generar(data.id);
        const arr = Array.isArray(cot) ? cot : [cot];
        arr.sort((a, b) => ({ economico: 0, estandar: 1, premium: 2 }[a.plan] - { economico: 0, estandar: 1, premium: 2 }[b.plan]));
        setPlanes(arr);
        setStep(2);
      } catch {
        setError('Error al crear el proyecto. Intentá de nuevo.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handlePublicar = async () => {
    setLoading(true);
    try {
      await proyectosApi.publicar(proyecto.id);
      navigate('/mis-proyectos', { state: { success: 'Proyecto publicado. Los constructores ya pueden verlo.' } });
    } catch {
      setError('Error al publicar el proyecto.');
    } finally {
      setLoading(false);
    }
  };

  const stepState = (i) => i < step ? 'done' : i === step ? 'active' : 'pending';

  return (
    <Box sx={{ maxWidth: 1100, mx: 'auto' }}>

      {/* Breadcrumb + pasos */}
      <Box sx={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        mb: 2.5,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button size="small" startIcon={<ArrowBackIcon sx={{ fontSize: 14 }} />}
            onClick={() => navigate('/mis-proyectos')} sx={{ color: '#6B7280', fontSize: 12.5 }}>
            Mis proyectos
          </Button>
          <Typography color="#D1D5DB">/</Typography>
          <Typography fontSize={12.5} color="text.primary" fontWeight={500}>Nuevo proyecto</Typography>
        </Box>

        {/* Step dots */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <StepDot n={1} label="Descripción" state={stepState(0)} />
          <Box sx={{ width: 32, height: 1, bgcolor: step > 0 ? ACCENT : '#E2E8F0', transition: '.3s' }} />
          <StepDot n={2} label="Ubicación"   state={stepState(1)} />
          <Box sx={{ width: 32, height: 1, bgcolor: step > 1 ? ACCENT : '#E2E8F0', transition: '.3s' }} />
          <StepDot n={3} label="Cotización"  state={stepState(2)} />
        </Box>
      </Box>

      {/* Panel */}
      <Box sx={{
        display: 'flex', border: '1px solid #E5E7EB', borderRadius: 2,
        overflow: 'hidden', bgcolor: '#fff',
        minHeight: step === 2 ? 'auto' : 560,
      }}>

        {/* ═══════════ PASOS 0 y 1 ═══════════ */}
        {step < 2 && (
          <>
            {/* Formulario */}
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>

              {/* ── PASO 0 ── */}
              {step === 0 && (
                <Box sx={{ flex: 1, p: 4 }}>
                  <Typography variant="h6" fontWeight={700} sx={{ mb: 0.5 }}>
                    ¿Qué tipo de trabajo necesitás?
                  </Typography>
                  <Typography fontSize={13} color="text.secondary" sx={{ mb: 3 }}>
                    Seleccioná la categoría que mejor describe tu proyecto.
                  </Typography>

                  <Grid container spacing={1.5} sx={{ mb: 4 }}>
                    {TIPOS.map(({ value, label, desc, Icon, color, bg, border }) => {
                      const sel = form.tipoProyecto === value;
                      return (
                        <Grid size={{ xs: 6, sm: 3 }} key={value}>
                          <Box
                            onClick={() => setForm(p => ({ ...p, tipoProyecto: value }))}
                            sx={{
                              p: 2, borderRadius: 1.5, cursor: 'pointer',
                              border: sel ? `2px solid ${ACCENT}` : `1.5px solid ${border}`,
                              bgcolor: sel ? '#EFF6FF' : bg,
                              transition: '.1s',
                              '&:hover': {
                                borderColor: sel ? ACCENT : color,
                                transform: 'translateY(-1px)',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.07)',
                              },
                            }}
                          >
                            <Icon sx={{ fontSize: 22, color: sel ? ACCENT : color, mb: 1, display: 'block' }} />
                            <Typography fontSize={13} fontWeight={700} color={sel ? ACCENT : 'text.primary'} sx={{ mb: 0.25 }}>
                              {label}
                            </Typography>
                            <Typography fontSize={11} color={sel ? '#1D4ED8' : 'text.secondary'} lineHeight={1.4}>
                              {desc}
                            </Typography>
                          </Box>
                        </Grid>
                      );
                    })}
                  </Grid>

                  <Divider sx={{ mb: 3.5 }} />

                  <Typography fontSize={13} fontWeight={600} color="text.primary" sx={{ mb: 1 }}>
                    Nombre del proyecto
                  </Typography>
                  <TextField
                    fullWidth
                    value={form.titulo}
                    onChange={set('titulo')}
                    placeholder='Ej: "Remodelación de cocina y comedor — Escazú"'
                    sx={{
                      mb: 3,
                      '& .MuiOutlinedInput-root': { fontSize: 15 },
                    }}
                    inputProps={{ maxLength: 120 }}
                    helperText={`${form.titulo.length}/120 caracteres`}
                  />

                  <Typography fontSize={13} fontWeight={600} color="text.primary" sx={{ mb: 1 }}>
                    Describí el trabajo en detalle
                  </Typography>
                  <TextField
                    fullWidth multiline rows={4}
                    value={form.descripcion}
                    onChange={set('descripcion')}
                    placeholder={
                      'Incluí: estado actual del espacio, qué querés demoler o construir, '
                      + 'materiales que preferís, medidas aproximadas, y cualquier condición especial.\n\n'
                      + 'Cuanto más detalle, más precisa será la cotización IA y mejores propuestas vas a recibir.'
                    }
                    helperText={`${form.descripcion.length} caracteres`}
                  />
                </Box>
              )}

              {/* ── PASO 1 ── */}
              {step === 1 && (
                <Box sx={{ flex: 1, p: 4 }}>
                  <Typography variant="h6" fontWeight={700} sx={{ mb: 0.5 }}>
                    ¿Dónde es el proyecto?
                  </Typography>
                  <Typography fontSize={13} color="text.secondary" sx={{ mb: 3.5 }}>
                    Ayuda a los constructores de tu zona a encontrarte.
                  </Typography>

                  <Grid container spacing={2} sx={{ mb: 4 }}>
                    <Grid size={{ xs: 12, sm: 5 }}>
                      <TextField select fullWidth label="Provincia" value={form.provincia}
                        onChange={set('provincia')} SelectProps={{ native: true }}>
                        {PROVINCIAS.map(p => <option key={p} value={p}>{p}</option>)}
                      </TextField>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 7 }}>
                      <TextField fullWidth label="Cantón" value={form.canton}
                        onChange={set('canton')} placeholder='Ej: "Escazú", "Desamparados"'
                        helperText="Opcional — mejora los resultados de búsqueda" />
                    </Grid>
                  </Grid>

                  <Divider sx={{ mb: 3.5 }} />

                  <Typography variant="h6" fontWeight={700} sx={{ mb: 0.5 }}>
                    Alcance y presupuesto
                  </Typography>
                  <Typography fontSize={13} color="text.secondary" sx={{ mb: 3 }}>
                    Datos opcionales que mejoran la cotización IA y los filtros del marketplace.
                  </Typography>

                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth label="Área aproximada del proyecto"
                        value={form.areaM2} onChange={set('areaM2')} type="number"
                        InputProps={{ endAdornment: <InputAdornment position="end">m²</InputAdornment> }}
                        helperText="Ej: 25 m² para una cocina estándar"
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth label="Presupuesto máximo"
                        value={form.presupuestoMax} onChange={set('presupuestoMax')} type="number"
                        InputProps={{ startAdornment: <InputAdornment position="start">₡</InputAdornment> }}
                        helperText="Filtra constructores dentro de tu rango"
                      />
                    </Grid>
                  </Grid>

                  {/* Info IA */}
                  <Box sx={{
                    mt: 3.5, display: 'flex', gap: 1.5, bgcolor: '#EFF6FF',
                    border: '1px solid #BFDBFE', borderRadius: 1.5, p: 2,
                  }}>
                    <AutoAwesomeIcon sx={{ color: ACCENT, fontSize: 18, flexShrink: 0, mt: '1px' }} />
                    <Box>
                      <Typography fontSize={13} fontWeight={600} color={ACCENT} sx={{ mb: 0.25 }}>
                        La IA generará tu cotización al continuar
                      </Typography>
                      <Typography fontSize={12.5} color="#1D4ED8">
                        Análisis de materiales, mano de obra y costos para 3 planes (económico, estándar y premium)
                        según precios actuales de Costa Rica.
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              )}

              {/* Error */}
              {error && (
                <Box sx={{ px: 4, pb: 1 }}>
                  <Alert severity="error" sx={{ fontSize: 12.5 }}>{error}</Alert>
                </Box>
              )}

              {/* Footer nav */}
              <Box sx={{
                px: 4, py: 2.5, borderTop: '1px solid #F1F5F9',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <Button onClick={() => step > 0 ? setStep(s => s - 1) : navigate('/mis-proyectos')}
                  sx={{ color: '#6B7280' }}>
                  {step === 0 ? 'Cancelar' : '← Atrás'}
                </Button>
                <Button variant="contained" onClick={handleNext} disabled={loading}
                  endIcon={loading ? <CircularProgress size={14} color="inherit" /> : <ArrowForwardIcon />}
                  sx={{ px: 3 }}>
                  {step === 1 ? 'Generar cotización IA' : 'Continuar'}
                </Button>
              </Box>
            </Box>

            {/* Preview en vivo */}
            <PreviewPanel form={form} />
          </>
        )}

        {/* ═══════════ PASO 2: Cotización IA ═══════════ */}
        {step === 2 && planes.length > 0 && (
          <Box sx={{ flex: 1, p: 4 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
              <Box sx={{ bgcolor: '#EFF6FF', borderRadius: 1, p: 1, display: 'flex' }}>
                <AutoAwesomeIcon sx={{ color: ACCENT, fontSize: 20 }} />
              </Box>
              <Box>
                <Typography fontWeight={700} fontSize={15.5}>Cotización generada</Typography>
                <Typography fontSize={12.5} color="text.secondary">
                  Estimación basada en precios de mercado en Costa Rica · Los montos reales pueden variar
                </Typography>
              </Box>
            </Box>

            {/* 3 columnas de planes */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              {planes.map((plan) => {
                const meta = PLAN_META[plan.plan] ?? PLAN_META.estandar;
                return (
                  <Grid size={{ xs: 12, md: 4 }} key={plan.plan}>
                    <Box sx={{
                      border: `1.5px solid ${meta.border}`,
                      borderRadius: 1.5, overflow: 'hidden', height: '100%',
                    }}>
                      <Box sx={{ bgcolor: meta.bg, px: 2.5, py: 1.75, borderBottom: `1px solid ${meta.border}` }}>
                        <Typography fontWeight={700} fontSize={13} sx={{ color: meta.accent }}>{meta.badge}</Typography>
                        <Typography fontSize={11.5} color="text.secondary">{meta.desc}</Typography>
                      </Box>
                      <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid #F3F4F6' }}>
                        <Typography fontSize={10.5} fontWeight={600} color="text.secondary"
                          sx={{ textTransform: 'uppercase', letterSpacing: '0.05em', mb: 0.25 }}>
                          Rango estimado
                        </Typography>
                        <Typography fontWeight={800} fontSize={20} sx={{ color: meta.accent, lineHeight: 1.2 }}>
                          ₡{((plan.rangoMinimo ?? 0) / 1e6).toFixed(1)}M – ₡{((plan.rangoMaximo ?? 0) / 1e6).toFixed(1)}M
                        </Typography>
                      </Box>
                      <Box sx={{ px: 2.5, py: 1.75 }}>
                        <Typography fontSize={12.5} color="text.secondary" lineHeight={1.55}>
                          {plan.resumenIA}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                );
              })}
            </Grid>

            {/* Desglose */}
            {(() => {
              const pe = planes.find(p => p.plan === 'estandar') ?? planes[0];
              if (!pe?.lineas?.length) return null;
              return (
                <Box sx={{ border: '1px solid #E5E7EB', borderRadius: 1.5, overflow: 'hidden', mb: 3 }}>
                  <Box sx={{ px: 2.5, py: 1.25, borderBottom: '1px solid #E5E7EB', bgcolor: '#F9FAFB',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography fontSize={13} fontWeight={600}>Desglose — Plan Estándar</Typography>
                    <Typography fontSize={11.5} color="text.secondary">{pe.lineas.length} ítems</Typography>
                  </Box>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Descripción</TableCell>
                          <TableCell>Categoría</TableCell>
                          <TableCell align="right">Cant.</TableCell>
                          <TableCell align="right">P. Unit.</TableCell>
                          <TableCell align="right">Total</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {pe.lineas.slice(0, 10).map((l, i) => (
                          <TableRow key={i}>
                            <TableCell sx={{ fontWeight: 500 }}>{l.descripcion}</TableCell>
                            <TableCell>
                              <Typography fontSize={11.5} color={l.esManoDeObra ? '#92400E' : 'text.secondary'}>
                                {l.categoria}
                              </Typography>
                            </TableCell>
                            <TableCell align="right" sx={{ fontSize: 12.5 }}>{l.cantidad} {l.unidad}</TableCell>
                            <TableCell align="right" sx={{ fontSize: 12.5 }}>₡{l.precioUnitario?.toLocaleString('es-CR')}</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 600, fontSize: 12.5 }}>₡{l.precioTotal?.toLocaleString('es-CR')}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              );
            })()}

            {/* CTA publicar */}
            <Box sx={{
              display: 'flex', gap: 3, alignItems: 'flex-start',
              bgcolor: '#F8FAFC', border: '1px solid #E5E7EB', borderRadius: 1.5, p: 3,
            }}>
              <Box sx={{ flex: 1 }}>
                <Typography fontWeight={700} fontSize={14.5} sx={{ mb: 0.5 }}>
                  ¿Listo para recibir propuestas?
                </Typography>
                <Typography fontSize={13} color="text.secondary">
                  Al publicar, constructores verificados pueden ver tu proyecto y enviarte cotizaciones reales.
                  Podés publicarlo ahora o guardarlo como borrador.
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, flexShrink: 0 }}>
                <Button variant="contained" startIcon={<PublishIcon />}
                  onClick={handlePublicar} disabled={loading} sx={{ whiteSpace: 'nowrap' }}>
                  {loading ? <CircularProgress size={16} color="inherit" /> : 'Publicar proyecto'}
                </Button>
                <Button variant="outlined" startIcon={<BookmarkIcon />}
                  onClick={() => navigate('/mis-proyectos', { state: { success: 'Proyecto guardado como borrador.' } })}
                  sx={{ whiteSpace: 'nowrap' }}>
                  Guardar borrador
                </Button>
              </Box>
            </Box>

            {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
          </Box>
        )}
      </Box>
    </Box>
  );
}
