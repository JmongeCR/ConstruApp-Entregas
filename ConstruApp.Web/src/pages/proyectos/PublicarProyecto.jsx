import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, TextField, Button, Grid, Alert,
  CircularProgress, InputAdornment, Divider, Chip, Avatar,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
} from '@mui/material';
import HomeWorkIcon     from '@mui/icons-material/HomeWork';
import FoundationIcon   from '@mui/icons-material/Foundation';
import BoltIcon         from '@mui/icons-material/Bolt';
import BrushIcon        from '@mui/icons-material/Brush';
import ViewModuleIcon   from '@mui/icons-material/ViewModule';
import RoofingIcon      from '@mui/icons-material/Roofing';
import SpaIcon          from '@mui/icons-material/Spa';
import HandymanIcon     from '@mui/icons-material/Handyman';
import ArrowBackIcon    from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import AutoAwesomeIcon  from '@mui/icons-material/AutoAwesome';
import PublishIcon      from '@mui/icons-material/Publish';
import BookmarkIcon     from '@mui/icons-material/Bookmark';
import LocationOnIcon   from '@mui/icons-material/LocationOn';
import AttachMoneyIcon  from '@mui/icons-material/AttachMoney';
import EditIcon         from '@mui/icons-material/Edit';
import VerifiedIcon     from '@mui/icons-material/Verified';
import { proyectosApi, cotizacionIAApi } from '../../api/endpoints';

const ACCENT = '#2563EB';

const TIPOS = [
  { value: 'Remodelacion',      label: 'Remodelación',        desc: 'Cocinas, baños, ampliaciones internas',         Icon: HomeWorkIcon,   color: '#EA580C', bg: '#FFF7ED', border: '#FED7AA' },
  { value: 'ObraGris',          label: 'Obra gris',            desc: 'Cimentación, columnas, paredes, losas',         Icon: FoundationIcon, color: '#475569', bg: '#F8FAFC', border: '#E2E8F0' },
  { value: 'ElectricoPlomeria', label: 'Eléctrico / Plomería', desc: 'Instalaciones, reparaciones, certificaciones',  Icon: BoltIcon,       color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
  { value: 'Pintura',           label: 'Pintura',              desc: 'Interior, exterior, texturas y acabados',        Icon: BrushIcon,      color: '#7C3AED', bg: '#FAF5FF', border: '#DDD6FE' },
  { value: 'Pisos',             label: 'Pisos',                desc: 'Cerámica, porcelanato, madera, vinilo',          Icon: ViewModuleIcon, color: '#92400E', bg: '#FFFBEB', border: '#FDE68A' },
  { value: 'Techos',            label: 'Techos',               desc: 'Cubiertas, estructura, impermeabilización',      Icon: RoofingIcon,    color: '#1D4ED8', bg: '#EFF6FF', border: '#BFDBFE' },
  { value: 'PiscinaJardin',     label: 'Piscina / Jardín',     desc: 'Diseño, construcción, mantenimiento',           Icon: SpaIcon,        color: '#059669', bg: '#ECFDF5', border: '#A7F3D0' },
  { value: 'Otro',              label: 'Otro',                 desc: 'Proyectos especiales o mixtos',                  Icon: HandymanIcon,   color: '#6B7280', bg: '#F9FAFB', border: '#E5E7EB' },
];

const PROVINCIAS = ['San José','Alajuela','Cartago','Heredia','Guanacaste','Puntarenas','Limón'];

const PLAN_META = {
  economico: { accent: '#16A34A', bg: '#F0FDF4', border: '#BBF7D0', badge: 'Económico',  desc: 'Materiales básicos, sin acabados premium' },
  estandar:  { accent: ACCENT,    bg: '#EFF6FF', border: '#BFDBFE', badge: 'Estándar',   desc: 'Balance calidad-precio recomendado' },
  premium:   { accent: '#7C3AED', bg: '#FAF5FF', border: '#E9D5FF', badge: 'Premium',    desc: 'Materiales de alta gama, acabados superiores' },
};

const STEPS = [
  { label: 'Tipo',        title: '¿Qué tipo de trabajo necesitás?',     desc: 'Elegí la categoría que mejor describe tu proyecto.',          time: '< 1 min' },
  { label: 'Información', title: 'Contanos sobre tu proyecto',           desc: 'Ponele un nombre y describí qué querés hacer.',               time: '~ 2 min' },
  { label: 'Ubicación',   title: '¿Dónde se realiza el trabajo?',        desc: 'Ayudá a los constructores de tu zona a encontrarte.',         time: '< 1 min' },
  { label: 'Alcance',     title: 'Alcance y presupuesto',                desc: 'Información opcional que mejora la cotización y los filtros.', time: '< 1 min' },
  { label: 'Revisión',    title: 'Todo listo para publicar',             desc: 'Revisá los datos antes de crear tu proyecto.',                time: '< 1 min' },
];

/* ── Stepper horizontal ──────────────────────────────────────────────────── */
function WizardStepper({ current }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 3.5 }}>
      {STEPS.map((s, i) => {
        const state = i < current ? 'done' : i === current ? 'active' : 'pending';
        const isLast = i === STEPS.length - 1;
        return (
          <Box key={i} sx={{ display: 'flex', alignItems: 'flex-start', flex: isLast ? 'none' : 1 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{
                width: 30, height: 30, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                bgcolor: state === 'done' ? ACCENT : state === 'active' ? '#fff' : '#F1F5F9',
                border: `2px solid ${state === 'pending' ? '#E2E8F0' : ACCENT}`,
                transition: 'all .25s',
              }}>
                {state === 'done'
                  ? <Box component="span" sx={{ fontSize: 13, color: '#fff', lineHeight: 1 }}>✓</Box>
                  : <Typography fontSize={12} fontWeight={700}
                      color={state === 'active' ? ACCENT : '#94A3B8'}>{i + 1}</Typography>}
              </Box>
              <Typography fontSize={11} fontWeight={state === 'active' ? 700 : 400}
                sx={{
                  display: { xs: 'none', sm: 'block' }, whiteSpace: 'nowrap',
                  color: state === 'pending' ? '#94A3B8' : state === 'done' ? ACCENT : 'text.primary',
                }}>
                {s.label}
              </Typography>
            </Box>
            {!isLast && (
              <Box sx={{
                flex: 1, height: 2, mt: '14px', mx: 1,
                bgcolor: i < current ? ACCENT : '#E2E8F0', transition: 'background-color .25s',
              }} />
            )}
          </Box>
        );
      })}
    </Box>
  );
}

/* ── Chip del tipo activo (contexto visual en pasos posteriores) ─────────── */
function TipoContextChip({ tipoProyecto }) {
  if (!tipoProyecto) return null;
  const t = TIPOS.find(x => x.value === tipoProyecto);
  if (!t) return null;
  return (
    <Chip icon={<t.Icon style={{ fontSize: 13, color: t.color }} />}
      label={t.label} size="small" variant="outlined"
      sx={{ fontSize: 11.5, height: 22, color: t.color, borderColor: t.border, bgcolor: t.bg }} />
  );
}

/* ── Sección del resumen ─────────────────────────────────────────────────── */
function ReviewSection({ label, onEdit, children }) {
  return (
    <Box sx={{ py: 2, borderBottom: '1px solid #F1F5F9' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.25 }}>
        <Typography fontSize={11} fontWeight={700} color="text.disabled"
          sx={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {label}
        </Typography>
        <Button size="small" onClick={onEdit} startIcon={<EditIcon sx={{ fontSize: 12 }} />}
          sx={{ fontSize: 11.5, color: ACCENT, minHeight: 'auto', py: 0.25, px: 1 }}>
          Editar
        </Button>
      </Box>
      {children}
    </Box>
  );
}

/* ── Preview live ────────────────────────────────────────────────────────── */
function PreviewPanel({ form }) {
  const tipo    = TIPOS.find(t => t.value === form.tipoProyecto);
  const sinTit  = !form.titulo.trim();
  const sinDesc = !form.descripcion.trim();

  return (
    <Box sx={{
      width: 320, flexShrink: 0,
      bgcolor: '#0F172A',
      display: 'flex', flexDirection: 'column',
      borderLeft: '1px solid rgba(255,255,255,0.06)',
    }}>
      <Box sx={{ px: 3, pt: 3, pb: 2, borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <Typography fontSize={10} fontWeight={700}
          sx={{ color: 'rgba(255,255,255,0.35)', letterSpacing: '0.1em', textTransform: 'uppercase', mb: 0.5 }}>
          Vista previa
        </Typography>
        <Typography fontSize={12.5} sx={{ color: 'rgba(255,255,255,0.45)' }}>
          Así verá tu proyecto un constructor
        </Typography>
      </Box>

      <Box sx={{ p: 2.5 }}>
        <Box sx={{ bgcolor: '#fff', borderRadius: 1.5, overflow: 'hidden' }}>
          {/* Tipo badge */}
          <Box sx={{
            bgcolor: tipo?.bg ?? '#F9FAFB', px: 2, py: 1.25,
            borderBottom: `1px solid ${tipo?.border ?? '#E5E7EB'}`,
            display: 'flex', alignItems: 'center', gap: 0.75,
          }}>
            {tipo?.Icon && <tipo.Icon sx={{ fontSize: 14, color: tipo.color }} />}
            <Typography fontSize={11.5} fontWeight={600} sx={{ color: tipo?.color ?? '#6B7280' }}>
              {tipo?.label ?? 'Proyecto'}
            </Typography>
          </Box>

          <Box sx={{ p: 2 }}>
            {sinTit
              ? <Box sx={{ bgcolor: '#F1F5F9', borderRadius: 0.75, height: 18, width: '70%', mb: 1 }} />
              : <Typography fontSize={13.5} fontWeight={700} sx={{
                  mb: 0.75, display: '-webkit-box',
                  WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                }}>{form.titulo}</Typography>
            }
            {sinDesc
              ? <Box sx={{ mb: 1.5 }}>
                  <Box sx={{ bgcolor: '#F1F5F9', borderRadius: 0.5, height: 12, width: '100%', mb: 0.5 }} />
                  <Box sx={{ bgcolor: '#F1F5F9', borderRadius: 0.5, height: 12, width: '80%', mb: 0.5 }} />
                  <Box sx={{ bgcolor: '#F1F5F9', borderRadius: 0.5, height: 12, width: '55%' }} />
                </Box>
              : <Typography fontSize={12} color="text.secondary" sx={{
                  mb: 1.5, display: '-webkit-box',
                  WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.55,
                }}>{form.descripcion}</Typography>
            }

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

            <Box sx={{ mt: 1.75, bgcolor: ACCENT, borderRadius: 1, py: 0.9, textAlign: 'center' }}>
              <Typography fontSize={12.5} fontWeight={600} color="#fff">Enviar propuesta</Typography>
            </Box>
          </Box>
        </Box>

        {/* Constructores verificados */}
        <Box sx={{ mt: 2, px: 0.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5 }}>
            <VerifiedIcon sx={{ fontSize: 13, color: ACCENT }} />
            <Typography fontSize={12} fontWeight={600} sx={{ color: 'rgba(255,255,255,0.65)' }}>
              Constructores verificados lo verán
            </Typography>
          </Box>
          <Typography fontSize={11.5} sx={{ color: 'rgba(255,255,255,0.35)' }}>
            y podrán enviarte su propuesta
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   PUBLICAR PROYECTO — Wizard
══════════════════════════════════════════════════════════════════════════ */
export default function PublicarProyecto() {
  const navigate = useNavigate();

  const [step,     setStep]     = useState(0);
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [proyecto, setProyecto] = useState(null);
  const [planes,   setPlanes]   = useState([]);

  const [form, setForm] = useState({
    titulo:         '',
    descripcion:    '',
    tipoProyecto:   '',
    canton:         '',
    provincia:      'San José',
    presupuestoMax: '',
    areaM2:         '',
  });

  const set    = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }));
  const setVal = (f, v) => setForm(p => ({ ...p, [f]: v }));

  const validate = () => {
    if (step === 0 && !form.tipoProyecto)
      return 'Elegí el tipo de proyecto para continuar.';
    if (step === 1 && !form.titulo.trim())
      return 'El nombre del proyecto es obligatorio.';
    if (step === 1 && form.descripcion.trim().length < 20)
      return 'La descripción debe tener al menos 20 caracteres.';
    return '';
  };

  const handleNext = async () => {
    const err = validate();
    if (err) return setError(err);
    setError('');

    if (step < 4) {
      setStep(s => s + 1);
      return;
    }

    /* Paso 4 → llamada API */
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
      arr.sort((a, b) =>
        ({ economico: 0, estandar: 1, premium: 2 }[a.plan] -
         { economico: 0, estandar: 1, premium: 2 }[b.plan]));
      setPlanes(arr);
      setStep(5);
    } catch {
      setError('Error al crear el proyecto. Intentá de nuevo.');
    } finally {
      setLoading(false);
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

  const showPreview = step >= 1 && step <= 3;

  /* ── Layout del wizard (pasos 0–4) ─────────────────────────────────── */
  if (step < 5) return (
    <Box sx={{ maxWidth: 1060, mx: 'auto' }}>
      {/* Cabecera */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <Button size="small" startIcon={<ArrowBackIcon sx={{ fontSize: 14 }} />}
          onClick={() => navigate('/mis-proyectos')}
          sx={{ color: 'text.secondary', fontSize: 12.5 }}>
          Mis proyectos
        </Button>
        <Typography color="divider">·</Typography>
        <Typography fontSize={12.5} color="text.primary">Nuevo proyecto</Typography>
      </Box>

      {/* Stepper */}
      <WizardStepper current={step} />

      {/* Tarjeta principal */}
      <Box sx={{
        display: 'flex', border: '1px solid', borderColor: 'divider',
        borderRadius: 2, overflow: 'hidden', bgcolor: '#fff',
      }}>

        {/* Panel del formulario */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 500 }}>

          {/* Encabezado del paso */}
          <Box sx={{ px: { xs: 3, sm: 4 }, pt: { xs: 3, sm: 4 }, pb: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75, flexWrap: 'wrap' }}>
              <Typography fontSize={11} fontWeight={700} color="primary.main"
                sx={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Paso {step + 1} de {STEPS.length}
              </Typography>
              <Chip label={STEPS[step].time} size="small" variant="outlined"
                sx={{ fontSize: 11, height: 20, borderColor: '#E2E8F0', color: 'text.secondary' }} />
              {step > 0 && <TipoContextChip tipoProyecto={form.tipoProyecto} />}
            </Box>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 0.5 }}>
              {STEPS[step].title}
            </Typography>
            <Typography fontSize={13} color="text.secondary" sx={{ mb: 3.5 }}>
              {STEPS[step].desc}
            </Typography>
          </Box>

          {/* Contenido del paso */}
          <Box sx={{ flex: 1, px: { xs: 3, sm: 4 }, pb: 1 }}>

            {/* ── Paso 0: Tipo ── */}
            {step === 0 && (
              <Grid container spacing={1.5}>
                {TIPOS.map(({ value, label, desc, Icon, color, bg, border }) => {
                  const sel = form.tipoProyecto === value;
                  return (
                    <Grid size={{ xs: 6, sm: 3 }} key={value}>
                      <Box onClick={() => setVal('tipoProyecto', value)} sx={{
                        p: 2, borderRadius: 1.5, cursor: 'pointer', height: '100%',
                        border: sel ? `2px solid ${ACCENT}` : `1.5px solid ${border}`,
                        bgcolor: sel ? '#EFF6FF' : bg, transition: 'all .15s',
                        '&:hover': {
                          borderColor: sel ? ACCENT : color,
                          transform: 'translateY(-1px)',
                          boxShadow: '0 3px 10px rgba(0,0,0,0.07)',
                        },
                      }}>
                        <Icon sx={{ fontSize: 22, color: sel ? ACCENT : color, mb: 1, display: 'block' }} />
                        <Typography fontSize={13} fontWeight={700}
                          color={sel ? ACCENT : 'text.primary'} sx={{ mb: 0.25 }}>
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
            )}

            {/* ── Paso 1: Información ── */}
            {step === 1 && (
              <Box>
                <TextField fullWidth label="Nombre del proyecto"
                  value={form.titulo} onChange={set('titulo')}
                  placeholder='Ej: "Remodelación de cocina y comedor — Escazú"'
                  inputProps={{ maxLength: 120 }}
                  helperText={`${form.titulo.length}/120 caracteres`}
                  sx={{ mb: 3 }} />
                <TextField fullWidth multiline rows={5}
                  label="Describí el trabajo en detalle"
                  value={form.descripcion} onChange={set('descripcion')}
                  placeholder={
                    'Incluí: estado actual del espacio, qué querés construir o modificar, '
                    + 'materiales que preferís, medidas aproximadas y cualquier condición especial.\n\n'
                    + 'Cuanto más detalle des, más precisas serán la cotización y las propuestas que recibás.'
                  }
                  helperText={`${form.descripcion.length} caracteres · Mínimo 20`} />
              </Box>
            )}

            {/* ── Paso 2: Ubicación ── */}
            {step === 2 && (
              <Box>
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid size={{ xs: 12, sm: 5 }}>
                    <TextField select fullWidth label="Provincia"
                      value={form.provincia} onChange={set('provincia')}
                      SelectProps={{ native: true }}>
                      {PROVINCIAS.map(p => <option key={p} value={p}>{p}</option>)}
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 7 }}>
                    <TextField fullWidth label="Cantón"
                      value={form.canton} onChange={set('canton')}
                      placeholder='Ej: "Escazú", "Desamparados", "Cartago centro"'
                      helperText="Opcional — mejora los resultados de búsqueda" />
                  </Grid>
                </Grid>

                <Box sx={{
                  display: 'flex', alignItems: 'flex-start', gap: 1.25, p: 2,
                  bgcolor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 1,
                }}>
                  <LocationOnIcon sx={{ fontSize: 15, color: 'text.disabled', mt: 0.15, flexShrink: 0 }} />
                  <Typography fontSize={12.5} color="text.secondary" lineHeight={1.6}>
                    Los constructores buscan proyectos por zona. Una ubicación precisa aumenta la cantidad de propuestas que recibís.
                  </Typography>
                </Box>
              </Box>
            )}

            {/* ── Paso 3: Alcance ── */}
            {step === 3 && (
              <Box>
                <Typography fontSize={13} color="text.secondary" sx={{ mb: 3, lineHeight: 1.65 }}>
                  Estos datos son opcionales. Si aún no tenés un presupuesto definido, podés indicar un rango aproximado o dejarlo en blanco.
                </Typography>
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField fullWidth label="Área aproximada"
                      value={form.areaM2} onChange={set('areaM2')} type="number"
                      slotProps={{ input: { endAdornment: <InputAdornment position="end">m²</InputAdornment> } }}
                      helperText="Ej: 25 m² para una cocina estándar" />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField fullWidth label="Presupuesto máximo"
                      value={form.presupuestoMax} onChange={set('presupuestoMax')} type="number"
                      slotProps={{ input: { startAdornment: <InputAdornment position="start">₡</InputAdornment> } }}
                      helperText="Filtra constructores dentro de tu rango" />
                  </Grid>
                </Grid>

                <Box sx={{
                  display: 'flex', gap: 1.5, p: 2,
                  bgcolor: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 1,
                }}>
                  <AutoAwesomeIcon sx={{ color: ACCENT, fontSize: 17, flexShrink: 0, mt: '2px' }} />
                  <Box>
                    <Typography fontSize={13} fontWeight={600} color={ACCENT} sx={{ mb: 0.25 }}>
                      La IA generará tu cotización al finalizar
                    </Typography>
                    <Typography fontSize={12.5} color="#1D4ED8">
                      Análisis de materiales y mano de obra en 3 planes según precios actuales en Costa Rica.
                    </Typography>
                  </Box>
                </Box>
              </Box>
            )}

            {/* ── Paso 4: Revisión ── */}
            {step === 4 && (
              <Box>
                {/* Tipo */}
                <ReviewSection label="Tipo de proyecto" onEdit={() => setStep(0)}>
                  {(() => {
                    const t = TIPOS.find(x => x.value === form.tipoProyecto);
                    return t ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                        <Box sx={{ p: 0.75, borderRadius: 1, bgcolor: t.bg, display: 'flex' }}>
                          <t.Icon sx={{ fontSize: 18, color: t.color }} />
                        </Box>
                        <Box>
                          <Typography fontSize={13.5} fontWeight={700}>{t.label}</Typography>
                          <Typography fontSize={12} color="text.secondary">{t.desc}</Typography>
                        </Box>
                      </Box>
                    ) : null;
                  })()}
                </ReviewSection>

                {/* Información */}
                <ReviewSection label="Información" onEdit={() => setStep(1)}>
                  <Typography fontSize={14} fontWeight={700} sx={{ mb: 0.5 }}>{form.titulo}</Typography>
                  <Typography fontSize={13} color="text.secondary" lineHeight={1.65}
                    sx={{ display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {form.descripcion}
                  </Typography>
                </ReviewSection>

                {/* Ubicación */}
                <ReviewSection label="Ubicación" onEdit={() => setStep(2)}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <LocationOnIcon sx={{ fontSize: 15, color: 'text.disabled' }} />
                    <Typography fontSize={13.5}>
                      {[form.canton, form.provincia].filter(Boolean).join(', ')}
                    </Typography>
                  </Box>
                </ReviewSection>

                {/* Alcance */}
                <ReviewSection label="Alcance" onEdit={() => setStep(3)}>
                  {form.areaM2 || form.presupuestoMax ? (
                    <Box sx={{ display: 'flex', gap: 4 }}>
                      {form.areaM2 && (
                        <Box>
                          <Typography fontSize={11} color="text.secondary"
                            sx={{ textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.25 }}>
                            Área
                          </Typography>
                          <Typography fontSize={14} fontWeight={700}>{form.areaM2} m²</Typography>
                        </Box>
                      )}
                      {form.presupuestoMax && (
                        <Box>
                          <Typography fontSize={11} color="text.secondary"
                            sx={{ textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.25 }}>
                            Presupuesto máx.
                          </Typography>
                          <Typography fontSize={14} fontWeight={700}>
                            ₡{parseFloat(form.presupuestoMax).toLocaleString('es-CR')}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  ) : (
                    <Typography fontSize={13} color="text.secondary">
                      Sin definir — se puede completar después
                    </Typography>
                  )}
                </ReviewSection>
              </Box>
            )}
          </Box>

          {/* Error */}
          {error && (
            <Box sx={{ px: { xs: 3, sm: 4 }, pb: 1 }}>
              <Alert severity="error" sx={{ fontSize: 12.5 }}>{error}</Alert>
            </Box>
          )}

          {/* Navegación */}
          <Box sx={{
            px: { xs: 3, sm: 4 }, py: 2.5,
            borderTop: '1px solid #F1F5F9',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <Button
              onClick={() => { setError(''); step > 0 ? setStep(s => s - 1) : navigate('/mis-proyectos'); }}
              sx={{ color: 'text.secondary' }}>
              {step === 0 ? 'Cancelar' : '← Atrás'}
            </Button>
            <Button variant="contained" onClick={handleNext} disabled={loading}
              endIcon={loading
                ? <CircularProgress size={14} color="inherit" />
                : step === 4 ? <AutoAwesomeIcon sx={{ fontSize: 16 }} /> : <ArrowForwardIcon />}
              sx={{ px: 3, boxShadow: 'none' }}>
              {loading ? 'Creando proyecto…'
                : step === 4 ? 'Crear y ver cotización'
                : 'Continuar'}
            </Button>
          </Box>
        </Box>

        {/* Preview — solo desktop, pasos 1–3 */}
        {showPreview && (
          <Box sx={{ display: { xs: 'none', md: 'block' } }}>
            <PreviewPanel form={form} />
          </Box>
        )}
      </Box>
    </Box>
  );

  /* ── Paso 5: Cotización IA + Publicar ──────────────────────────────── */
  return (
    <Box sx={{ maxWidth: 1060, mx: 'auto' }}>
      {/* Header resultado */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Box sx={{ bgcolor: '#EFF6FF', borderRadius: 1.5, p: 1.25, display: 'flex' }}>
          <AutoAwesomeIcon sx={{ color: ACCENT, fontSize: 22 }} />
        </Box>
        <Box>
          <Typography fontWeight={700} fontSize={17}>Cotización generada</Typography>
          <Typography fontSize={12.5} color="text.secondary">
            Estimación basada en precios de mercado en Costa Rica · Los montos reales pueden variar
          </Typography>
        </Box>
      </Box>

      {/* Planes */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {planes.map((plan) => {
          const meta = PLAN_META[plan.plan] ?? PLAN_META.estandar;
          return (
            <Grid size={{ xs: 12, md: 4 }} key={plan.plan}>
              <Box sx={{ border: `1.5px solid ${meta.border}`, borderRadius: 1.5, overflow: 'hidden', height: '100%' }}>
                <Box sx={{ bgcolor: meta.bg, px: 2.5, py: 1.75, borderBottom: `1px solid ${meta.border}` }}>
                  <Typography fontWeight={700} fontSize={13} sx={{ color: meta.accent }}>{meta.badge}</Typography>
                  <Typography fontSize={11.5} color="text.secondary">{meta.desc}</Typography>
                </Box>
                <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid #F3F4F6' }}>
                  <Typography fontSize={10.5} fontWeight={600} color="text.secondary"
                    sx={{ textTransform: 'uppercase', letterSpacing: '0.05em', mb: 0.25 }}>
                    Rango estimado
                  </Typography>
                  <Typography fontWeight={800} fontSize={19} sx={{ color: meta.accent, lineHeight: 1.2 }}>
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

      {/* Desglose plan estándar */}
      {(() => {
        const pe = planes.find(p => p.plan === 'estandar') ?? planes[0];
        if (!pe?.lineas?.length) return null;
        return (
          <Box sx={{ border: '1px solid #E5E7EB', borderRadius: 1.5, overflow: 'hidden', mb: 3 }}>
            <Box sx={{
              px: 2.5, py: 1.25, borderBottom: '1px solid #E5E7EB', bgcolor: '#F9FAFB',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
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
        display: 'flex', gap: 3, alignItems: 'flex-start', flexWrap: 'wrap',
        bgcolor: '#F8FAFC', border: '1px solid #E5E7EB', borderRadius: 1.5, p: 3,
      }}>
        <Box sx={{ flex: 1, minWidth: 200 }}>
          <Typography fontWeight={700} fontSize={15} sx={{ mb: 0.5 }}>
            ¿Listo para recibir propuestas?
          </Typography>
          <Typography fontSize={13} color="text.secondary">
            Al publicar, constructores verificados pueden ver tu proyecto y enviarte cotizaciones reales.
            Podés publicarlo ahora o guardarlo como borrador.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, flexShrink: 0 }}>
          <Button variant="contained" startIcon={<PublishIcon />}
            onClick={handlePublicar} disabled={loading} sx={{ boxShadow: 'none', whiteSpace: 'nowrap' }}>
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
  );
}
