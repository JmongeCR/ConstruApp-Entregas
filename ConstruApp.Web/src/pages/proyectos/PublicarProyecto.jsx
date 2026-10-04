import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, TextField, Button, Grid, Alert,
  CircularProgress, InputAdornment, Divider, Chip, MenuItem,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
} from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import PublishIcon     from '@mui/icons-material/Publish';
import BookmarkIcon    from '@mui/icons-material/Bookmark';
import CheckIcon       from '@mui/icons-material/Check';
import { proyectosApi, cotizacionIAApi } from '../../api/endpoints';
import PageHeader from '../../components/common/PageHeader';

const ACCENT = '#2563EB';

const TIPOS = [
  { value: 'Remodelacion',      label: 'Remodelación' },
  { value: 'ObraGris',          label: 'Obra gris' },
  { value: 'ElectricoPlomeria', label: 'Eléctrico / Plomería' },
  { value: 'Pintura',           label: 'Pintura' },
  { value: 'Pisos',             label: 'Pisos' },
  { value: 'Techos',            label: 'Techos' },
  { value: 'PiscinaJardin',     label: 'Piscina / Jardín' },
  { value: 'Otro',              label: 'Otro' },
];

const PROVINCIAS = ['San José','Alajuela','Cartago','Heredia','Guanacaste','Puntarenas','Limón'];

const PLAN_META = {
  economico: { accent: '#16A34A', bg: '#F0FDF4', border: '#BBF7D0', badge: 'Económico',  desc: 'Materiales básicos, sin acabados premium' },
  estandar:  { accent: ACCENT,    bg: '#EFF6FF', border: '#BFDBFE', badge: 'Estándar',   desc: 'Balance calidad-precio recomendado' },
  premium:   { accent: '#7C3AED', bg: '#FAF5FF', border: '#E9D5FF', badge: 'Premium',    desc: 'Materiales de alta gama, acabados superiores' },
};

/* ── Sección del formulario ──────────────────────────────────────────────── */
function FormSection({ title, badge, sectionRef, children }) {
  return (
    <Box ref={sectionRef} sx={{ mb: 4.5, scrollMarginTop: 16 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.25 }}>
        <Typography fontWeight={700} fontSize={13.5} color="text.primary">{title}</Typography>
        {badge && (
          <Chip label={badge} size="small" variant="outlined"
            sx={{ fontSize: 10.5, height: 18, color: '#64748B', borderColor: '#CBD5E1' }} />
        )}
      </Box>
      <Divider sx={{ mb: 2.5 }} />
      {children}
    </Box>
  );
}

/* ── Navegación lateral ──────────────────────────────────────────────────── */
function SectionNav({ sections }) {
  return (
    <Box sx={{ position: 'sticky', top: 16 }}>
      <Typography fontSize={10.5} fontWeight={700} color="text.disabled"
        sx={{ textTransform: 'uppercase', letterSpacing: '0.09em', mb: 1.25, px: 0.5 }}>
        Secciones
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
        {sections.map((s, i) => (
          <Box key={i} onClick={s.onNav}
            sx={{
              display: 'flex', alignItems: 'center', gap: 1.25,
              px: 1, py: 0.75, borderRadius: 0.75, cursor: 'pointer',
              '&:hover': { bgcolor: '#F1F5F9' },
            }}>
            {s.done
              ? <CheckIcon sx={{ fontSize: 13, color: ACCENT, flexShrink: 0 }} />
              : <Box sx={{
                  width: 13, height: 13, borderRadius: '50%',
                  border: '1.5px solid #CBD5E1', flexShrink: 0,
                }} />
            }
            <Typography fontSize={12.5} color={s.done ? 'text.primary' : '#64748B'}
              fontWeight={s.done ? 500 : 400}>
              {s.label}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

/* ── Panel de resumen ────────────────────────────────────────────────────── */
function SummaryPanel({ form }) {
  const tipo = TIPOS.find(t => t.value === form.tipoProyecto);
  const rows = [
    { label: 'Tipo',        value: tipo?.label ?? null },
    { label: 'Provincia',   value: form.provincia },
    { label: 'Cantón',      value: form.canton || null },
    { label: 'Área',        value: form.areaM2 ? `${form.areaM2} m²` : null },
    { label: 'Presupuesto', value: form.presupuestoMax
        ? `₡ ${parseFloat(form.presupuestoMax).toLocaleString('es-CR')}` : null },
  ];

  return (
    <Box sx={{ position: 'sticky', top: 16 }}>
      <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
        <Box sx={{
          px: 2, py: 1.5, bgcolor: '#F8FAFC',
          borderBottom: '1px solid', borderColor: 'divider',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <Typography fontSize={11} fontWeight={700} color="text.disabled"
            sx={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Resumen
          </Typography>
          <Chip label="Borrador" size="small"
            sx={{ fontSize: 10.5, height: 20, bgcolor: '#FEF3C7', color: '#92400E' }} />
        </Box>

        <Box sx={{ px: 2, py: 2 }}>
          <Typography fontSize={13} fontWeight={700}
            color={form.titulo ? 'text.primary' : 'text.disabled'}
            sx={{ mb: 2, lineHeight: 1.35 }}>
            {form.titulo || 'Sin nombre'}
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.875 }}>
            {rows.map(r => (
              <Box key={r.label}
                sx={{ display: 'flex', justifyContent: 'space-between', gap: 1.5 }}>
                <Typography fontSize={12} color="text.disabled" sx={{ flexShrink: 0 }}>
                  {r.label}
                </Typography>
                <Typography fontSize={12} fontWeight={r.value ? 500 : 400}
                  color={r.value ? 'text.secondary' : 'text.disabled'}
                  sx={{ textAlign: 'right' }}>
                  {r.value ?? '—'}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   PUBLICAR PROYECTO
══════════════════════════════════════════════════════════════════════════ */
export default function PublicarProyecto() {
  const navigate = useNavigate();

  const [step,     setStep]     = useState(0); /* 0 = form, 1 = resultado IA */
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
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

  const [touched, setTouched] = useState({});

  const set = (f) => (e) => {
    setTouched(p => ({ ...p, [f]: true }));
    setForm(p => ({ ...p, [f]: e.target.value }));
  };

  /* Refs para scroll */
  const infoRef    = useRef(null);
  const ubicRef    = useRef(null);
  const alcanceRef = useRef(null);
  const presuRef   = useRef(null);

  const scrollTo = (ref) =>
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  /* Completitud de secciones */
  const infoDone    = !!form.tipoProyecto && !!form.titulo.trim() && form.descripcion.trim().length >= 20;
  const ubicDone    = !!form.canton;
  const alcanceDone = !!form.areaM2;
  const presuDone   = !!form.presupuestoMax;

  const sections = [
    { label: 'Información general', done: infoDone,    onNav: () => scrollTo(infoRef) },
    { label: 'Ubicación',           done: ubicDone,    onNav: () => scrollTo(ubicRef) },
    { label: 'Alcance',             done: alcanceDone, onNav: () => scrollTo(alcanceRef) },
    { label: 'Presupuesto',         done: presuDone,   onNav: () => scrollTo(presuRef) },
  ];

  /* Validaciones inline */
  const err = {
    titulo:       touched.titulo && !form.titulo.trim()
                    ? 'El nombre es requerido.' : '',
    tipoProyecto: touched.tipoProyecto && !form.tipoProyecto
                    ? 'Seleccioná un tipo.' : '',
    descripcion:  touched.descripcion && form.descripcion.trim().length < 20
                    ? 'Mínimo 20 caracteres.' : '',
  };

  const handlePublicar = async () => {
    /* Mostrar todos los errores de campos obligatorios */
    setTouched({ titulo: true, tipoProyecto: true, descripcion: true });
    if (!form.tipoProyecto || !form.titulo.trim() || form.descripcion.trim().length < 20) {
      scrollTo(infoRef);
      return;
    }
    setError('');
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
      setStep(1);
    } catch {
      setError('Error al crear el proyecto. Intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmarPublicar = async () => {
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

  /* ── Paso 1: resultado cotización IA ──────────────────────────────── */
  if (step === 1) return (
    <Box sx={{ maxWidth: 900, mx: 'auto' }}>
      <PageHeader title="Cotización estimada" subtitle="Revisá los rangos antes de publicar el proyecto." />

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
                  <Typography fontWeight={800} fontSize={18} sx={{ color: meta.accent, lineHeight: 1.25 }}>
                    ₡{((plan.rangoMinimo ?? 0) / 1e6).toFixed(1)}M – ₡{((plan.rangoMaximo ?? 0) / 1e6).toFixed(1)}M
                  </Typography>
                </Box>
                <Box sx={{ px: 2.5, py: 1.75 }}>
                  <Typography fontSize={12.5} color="text.secondary" lineHeight={1.55}>{plan.resumenIA}</Typography>
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
              px: 2.5, py: 1.25, bgcolor: '#F9FAFB', borderBottom: '1px solid #E5E7EB',
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

      {/* Acciones */}
      <Box sx={{
        display: 'flex', gap: 3, alignItems: 'flex-start', flexWrap: 'wrap',
        bgcolor: '#F8FAFC', border: '1px solid #E5E7EB', borderRadius: 1.5, p: 3,
      }}>
        <Box sx={{ flex: 1, minWidth: 200 }}>
          <Typography fontWeight={700} fontSize={14.5} sx={{ mb: 0.5 }}>
            ¿Listo para recibir propuestas?
          </Typography>
          <Typography fontSize={13} color="text.secondary">
            Al publicar, constructores verificados pueden ver tu proyecto y enviarte cotizaciones.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, flexShrink: 0 }}>
          <Button variant="contained" startIcon={<PublishIcon />}
            onClick={handleConfirmarPublicar} disabled={loading}
            sx={{ whiteSpace: 'nowrap', boxShadow: 'none' }}>
            {loading ? <CircularProgress size={16} color="inherit" /> : 'Publicar proyecto'}
          </Button>
          <Button variant="outlined" startIcon={<BookmarkIcon />}
            onClick={() => navigate('/mis-proyectos', { state: { success: 'Proyecto guardado como borrador.' } })}
            sx={{ whiteSpace: 'nowrap' }}>
            Guardar borrador
          </Button>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mt: 2, fontSize: 12.5 }}>{error}</Alert>}
    </Box>
  );

  /* ── Paso 0: formulario principal ─────────────────────────────────── */
  return (
    <Box sx={{ maxWidth: 1060, mx: 'auto' }}>
      {/* Header */}
      <PageHeader
        title="Nuevo proyecto"
        subtitle="Registrá la información principal de la obra."
        actions={
          <Button variant="outlined" size="small" startIcon={<BookmarkIcon sx={{ fontSize: 14 }} />}
            onClick={() => navigate('/mis-proyectos', { state: { success: 'Proyecto guardado como borrador.' } })}
            disabled={loading}>
            Guardar borrador
          </Button>
        }
      />

      {/* Layout 3 columnas */}
      <Box sx={{ display: 'flex', gap: { xs: 0, md: 4 }, alignItems: 'flex-start' }}>

        {/* ── Columna izquierda: navegación ── */}
        <Box sx={{ width: 180, flexShrink: 0, display: { xs: 'none', md: 'block' } }}>
          <SectionNav sections={sections} />
        </Box>

        {/* ── Columna centro: formulario ── */}
        <Box sx={{ flex: 1, minWidth: 0 }}>

          {/* Sección: Información general */}
          <FormSection title="Información general" sectionRef={infoRef}>
            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12 }}>
                <TextField fullWidth required
                  label="Nombre del proyecto"
                  value={form.titulo}
                  onChange={set('titulo')}
                  onBlur={() => setTouched(p => ({ ...p, titulo: true }))}
                  error={!!err.titulo}
                  helperText={err.titulo || `${form.titulo.length}/120 · Ej: "Remodelación de cocina — Escazú"`}
                  inputProps={{ maxLength: 120 }} />
              </Grid>
              <Grid size={{ xs: 12, sm: 5 }}>
                <TextField select fullWidth required
                  label="Tipo de proyecto"
                  value={form.tipoProyecto}
                  onChange={set('tipoProyecto')}
                  onBlur={() => setTouched(p => ({ ...p, tipoProyecto: true }))}
                  error={!!err.tipoProyecto}
                  helperText={err.tipoProyecto || 'Categoría que mejor describe la obra'}>
                  <MenuItem value="" disabled><em>Seleccioná una opción</em></MenuItem>
                  {TIPOS.map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField fullWidth required multiline rows={5}
                  label="Descripción del proyecto"
                  value={form.descripcion}
                  onChange={set('descripcion')}
                  onBlur={() => setTouched(p => ({ ...p, descripcion: true }))}
                  error={!!err.descripcion}
                  helperText={err.descripcion
                    || `${form.descripcion.length} caracteres · Incluí estado actual, qué querés hacer, medidas y materiales preferidos`} />
              </Grid>
            </Grid>
          </FormSection>

          {/* Sección: Ubicación */}
          <FormSection title="Ubicación" badge="Opcional" sectionRef={ubicRef}>
            <Grid container spacing={2.5}>
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
                  placeholder='Ej: "Escazú", "Desamparados"'
                  helperText="Mejora los resultados de búsqueda y filtra constructores por zona" />
              </Grid>
            </Grid>
          </FormSection>

          {/* Sección: Alcance */}
          <FormSection title="Alcance" badge="Opcional" sectionRef={alcanceRef}>
            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth label="Área aproximada"
                  value={form.areaM2} onChange={set('areaM2')} type="number"
                  slotProps={{ input: { endAdornment: <InputAdornment position="end">m²</InputAdornment> } }}
                  helperText="Superficie total del área de trabajo" />
              </Grid>
            </Grid>
          </FormSection>

          {/* Sección: Presupuesto */}
          <FormSection title="Presupuesto" badge="Opcional" sectionRef={presuRef}>
            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth label="Presupuesto máximo"
                  value={form.presupuestoMax} onChange={set('presupuestoMax')} type="number"
                  slotProps={{ input: { startAdornment: <InputAdornment position="start">₡</InputAdornment> } }}
                  helperText="Podés dejarlo vacío si aún no tenés un monto definido" />
              </Grid>
            </Grid>
          </FormSection>

          {/* Error global */}
          {error && (
            <Alert severity="error" sx={{ mb: 2.5, fontSize: 12.5 }}>{error}</Alert>
          )}

          {/* Acciones */}
          <Box sx={{
            display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
            gap: 1.5, pt: 2.5, borderTop: '1px solid', borderColor: 'divider',
          }}>
            <Button onClick={() => navigate('/mis-proyectos')} sx={{ color: 'text.secondary' }}>
              Cancelar
            </Button>
            <Button variant="outlined" startIcon={<BookmarkIcon sx={{ fontSize: 15 }} />}
              onClick={() => navigate('/mis-proyectos', { state: { success: 'Proyecto guardado como borrador.' } })}
              disabled={loading}>
              Guardar borrador
            </Button>
            <Button variant="contained" startIcon={<AutoAwesomeIcon sx={{ fontSize: 15 }} />}
              onClick={handlePublicar} disabled={loading}
              sx={{ boxShadow: 'none' }}>
              {loading
                ? <><CircularProgress size={14} color="inherit" sx={{ mr: 1 }} />Creando…</>
                : 'Publicar proyecto'}
            </Button>
          </Box>
        </Box>

        {/* ── Columna derecha: resumen ── */}
        <Box sx={{ width: 240, flexShrink: 0, display: { xs: 'none', lg: 'block' } }}>
          <SummaryPanel form={form} />
        </Box>
      </Box>
    </Box>
  );
}
