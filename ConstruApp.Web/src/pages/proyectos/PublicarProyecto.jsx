import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, TextField, Button, Grid, Alert,
  CircularProgress, InputAdornment, Divider, Chip, Autocomplete,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import PublishIcon           from '@mui/icons-material/Publish';
import BookmarkIcon          from '@mui/icons-material/Bookmark';
import CheckIcon             from '@mui/icons-material/Check';
import { proyectosApi, propiedadesApi } from '../../api/endpoints';
import PageHeader from '../../components/common/PageHeader';

const ACCENT = '#2563EB';

const TIPOS = [
  { value: 'Remodelacion',      label: 'Remodelación',        desc: 'Cocinas, baños, ampliaciones internas' },
  { value: 'ObraGris',          label: 'Obra gris',            desc: 'Cimentación, columnas, paredes, losas' },
  { value: 'ElectricoPlomeria', label: 'Eléctrico / Plomería', desc: 'Instalaciones, reparaciones, certificaciones' },
  { value: 'Pintura',           label: 'Pintura',              desc: 'Interior, exterior, texturas y acabados' },
  { value: 'Pisos',             label: 'Pisos',                desc: 'Cerámica, porcelanato, madera, vinilo' },
  { value: 'Techos',            label: 'Techos',               desc: 'Cubiertas, estructura, impermeabilización' },
  { value: 'PiscinaJardin',     label: 'Piscina / Jardín',     desc: 'Diseño, construcción, mantenimiento' },
  { value: 'Otro',              label: 'Otro',                 desc: 'Proyectos especiales o mixtos' },
];


const PLAN_META = {
  economico: { accent: '#16A34A', bg: '#F0FDF4', border: '#BBF7D0', badge: 'Económico',  desc: 'Materiales básicos, sin acabados premium' },
  estandar:  { accent: ACCENT,    bg: '#EFF6FF', border: '#BFDBFE', badge: 'Estándar',   desc: 'Balance calidad-precio recomendado' },
  premium:   { accent: '#7C3AED', bg: '#FAF5FF', border: '#E9D5FF', badge: 'Premium',    desc: 'Materiales de alta gama, acabados superiores' },
};

/* ── Sección del formulario ──────────────────────────────────────────────── */
function FormSection({ title, badge, sectionRef, children }) {
  return (
    <Box ref={sectionRef} sx={{ mb: 3, scrollMarginTop: 16 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <Typography fontWeight={700} fontSize={13.5}>{title}</Typography>
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
              : <Box sx={{ width: 13, height: 13, borderRadius: '50%', border: '1.5px solid #CBD5E1', flexShrink: 0 }} />
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
  const tipo     = TIPOS.find(t => t.value === form.tipoProyecto);
  const ubicacion = [form.distrito, form.canton, form.provincia].filter(Boolean).join(', ');

  const rows = [
    { label: 'Tipo',        value: tipo?.label ?? null },
    { label: 'Ubicación',   value: ubicacion || null },
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
          <Typography fontSize={13.5} fontWeight={700} lineHeight={1.35}
            color={form.titulo ? 'text.primary' : 'text.disabled'}
            sx={{ mb: 2 }}>
            {form.titulo || 'Sin nombre'}
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.875 }}>
            {rows.map(r => (
              <Box key={r.label} sx={{ display: 'flex', justifyContent: 'space-between', gap: 1.5 }}>
                <Typography fontSize={12} color="text.disabled" sx={{ flexShrink: 0 }}>{r.label}</Typography>
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

  const [step]                  = useState(0); /* 0 = form, 1 = resultado IA */
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [proyecto, setProyecto] = useState(null);
  const [planes]                = useState([]);

  const [form, setForm] = useState({
    titulo:         '',
    propiedadId:    null,
    descripcion:    '',
    tipoProyecto:   '',
    canton:         '',
    distrito:       '',
    provincia:      '',
    presupuestoMax: '',
    areaM2:         '',
  });

  const [touched, setTouched] = useState({});

  /* Ubicaciones API */
  const [provincias,      setProvincias]      = useState([]);
  const [cantones,        setCantones]        = useState([]);
  const [distritos,       setDistritos]       = useState([]);
  const [loadingCantones, setLoadingCantones] = useState(false);
  const [loadingDistritos,setLoadingDistritos]= useState(false);
  const [provinciaId,     setProvinciaId]     = useState('');
  const [cantonId,        setCantonId]        = useState('');
  const [propiedades,     setPropiedades]     = useState([]);

  useEffect(() => {
    propiedadesApi.getMias()
      .then(({ data }) => setPropiedades(data))
      .catch(() => setPropiedades([]));
  }, []);

  const toOptions = (obj) => Object.entries(obj).map(([id, name]) => ({ id, name }));

  useEffect(() => {
    fetch('https://ubicaciones.paginasweb.cr/provincias.json')
      .then(r => r.json())
      .then(data => setProvincias(toOptions(data)))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!provinciaId) return;
    fetch(`https://ubicaciones.paginasweb.cr/provincia/${provinciaId}/cantones.json`)
      .then(r => r.json())
      .then(data => setCantones(toOptions(data)))
      .catch(() => setCantones([]))
      .finally(() => setLoadingCantones(false));
  }, [provinciaId]);

  useEffect(() => {
    if (!provinciaId || !cantonId) return;
    fetch(`https://ubicaciones.paginasweb.cr/provincia/${provinciaId}/canton/${cantonId}/distritos.json`)
      .then(r => r.json())
      .then(data => setDistritos(toOptions(data)))
      .catch(() => setDistritos([]))
      .finally(() => setLoadingDistritos(false));
  }, [provinciaId, cantonId]);

  const set = (f) => (e) => {
    setTouched(p => ({ ...p, [f]: true }));
    setForm(p => ({ ...p, [f]: e.target.value }));
  };
  const touch = (f) => () => setTouched(p => ({ ...p, [f]: true }));

  /* Refs para scroll de secciones */
  const proyectoRef = useRef(null);
  const ubicRef     = useRef(null);
  const detallesRef = useRef(null);

  const scrollTo = (ref) =>
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  /* Completitud de secciones */
  const proyectoDone  = !!form.tipoProyecto && !!form.titulo.trim() && form.descripcion.trim().length >= 20;
  const ubicDone      = !!form.canton;
  const detallesDone  = !!form.areaM2 || !!form.presupuestoMax;

  const sections = [
    { label: 'Proyecto',   done: proyectoDone, onNav: () => scrollTo(proyectoRef) },
    { label: 'Ubicación',  done: ubicDone,     onNav: () => scrollTo(ubicRef) },
    { label: 'Detalles',   done: detallesDone, onNav: () => scrollTo(detallesRef) },
  ];

  /* Validaciones inline (solo post-touch) */
  const err = {
    titulo:       touched.titulo       && !form.titulo.trim()                  ? 'El nombre es requerido.'    : '',
    tipoProyecto: touched.tipoProyecto && !form.tipoProyecto                   ? 'Seleccioná un tipo.'        : '',
    descripcion:  touched.descripcion  && form.descripcion.trim().length < 20  ? 'Mínimo 20 caracteres.'      : '',
  };

  /* Acción principal del formulario — crea proyecto */
  const handleCrearProyecto = async () => {
    setTouched({ titulo: true, tipoProyecto: true, descripcion: true });
    if (!form.tipoProyecto || !form.titulo.trim() || form.descripcion.trim().length < 20) {
      scrollTo(proyectoRef);
      return;
    }
    setError('');
    setLoading(true);
    try {
      const { data } = await proyectosApi.create({
        titulo:         form.titulo,
        propiedadId:    form.propiedadId,
        descripcion:    form.descripcion,
        tipoProyecto:   form.tipoProyecto,
        canton:         form.canton    || null,
        distrito:       form.distrito  || null,
        provincia:      form.provincia || null,
        presupuestoMax: form.presupuestoMax ? parseFloat(form.presupuestoMax) : null,
        areaM2:         form.areaM2 ? parseFloat(form.areaM2) : null,
      });
      setProyecto(data);
      navigate('/mis-proyectos', {
        state: { success: 'El proyecto se guardó como borrador. Puedes revisarlo y publicarlo cuando esté listo.' },
      });
    } catch {
      setError('No fue posible crear el proyecto. Revisá tu conexión e intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  /* Acción final — publica el proyecto ya creado */
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

  /* ── Paso 1: Cotización IA — revisar antes de publicar ───────────── */
  if (step === 1) return (
    <Box sx={{ maxWidth: 900, mx: 'auto' }}>
      <PageHeader
        title="Estimación de costos"
        subtitle="Revisá los rangos estimados antes de publicar tu proyecto."
      />

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

      {/* Acciones finales */}
      <Box sx={{
        display: 'flex', gap: 3, alignItems: 'flex-start', flexWrap: 'wrap',
        bgcolor: '#F8FAFC', border: '1px solid #E5E7EB', borderRadius: 1.5, p: 3,
      }}>
        <Box sx={{ flex: 1, minWidth: 200 }}>
          <Typography fontWeight={700} fontSize={14.5} sx={{ mb: 0.5 }}>
            ¿Listo para recibir propuestas?
          </Typography>
          <Typography fontSize={13} color="text.secondary">
            Al publicar, constructores verificados podrán ver tu proyecto y enviarte cotizaciones.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, flexShrink: 0 }}>
          <Button variant="contained" startIcon={<PublishIcon />}
            onClick={handlePublicar} disabled={loading}
            sx={{ whiteSpace: 'nowrap', boxShadow: 'none' }}>
            {loading ? <CircularProgress size={16} color="inherit" /> : 'Publicar proyecto'}
          </Button>
          <Button variant="outlined" startIcon={<BookmarkIcon />}
            onClick={() => navigate('/mis-proyectos', { state: { success: 'Proyecto guardado como borrador.' } })}
            sx={{ whiteSpace: 'nowrap' }}>
            Guardar como borrador
          </Button>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mt: 2, fontSize: 12.5 }}>{error}</Alert>}
    </Box>
  );

  /* ── Paso 0: Formulario principal ─────────────────────────────────── */
  return (
    <Box sx={{ maxWidth: 1060, mx: 'auto' }}>
      <PageHeader
        title="Nuevo proyecto"
        subtitle="Completá la información para recibir propuestas de constructores verificados."
      />

      {/* Layout 3 columnas */}
      <Box sx={{ display: 'flex', gap: { xs: 0, md: 4 }, alignItems: 'flex-start' }}>

        {/* ── Nav lateral — solo md+ ── */}
        <Box sx={{ width: 176, flexShrink: 0, display: { xs: 'none', md: 'block' } }}>
          <SectionNav sections={sections} />
        </Box>

        {/* ── Formulario ── */}
        <Box sx={{ flex: 1, minWidth: 0 }}>

          {/* SECCIÓN: Proyecto */}
          <FormSection title="Proyecto" sectionRef={proyectoRef}>
            <Grid container spacing={2}>

              {/* Nombre — campo principal, fila 1 izquierda */}
              <Grid size={{ xs: 12, sm: 8 }}>
                <TextField fullWidth required
                  label="Nombre del proyecto"
                  value={form.titulo}
                  onChange={set('titulo')}
                  onBlur={touch('titulo')}
                  error={!!err.titulo}
                  helperText={err.titulo || `${form.titulo.length}/120`}
                  inputProps={{ maxLength: 120 }}
                  placeholder='Ej: "Remodelación de cocina y comedor — Escazú"' />
              </Grid>

              {/* Tipo — Autocomplete compacto, fila 1 derecha */}
              <Grid size={{ xs: 12, sm: 4 }}>
                <Autocomplete
                  fullWidth
                  options={TIPOS}
                  getOptionLabel={(o) => (typeof o === 'string' ? o : o.label)}
                  value={TIPOS.find(t => t.value === form.tipoProyecto) ?? null}
                  onChange={(_, val) => {
                    setTouched(p => ({ ...p, tipoProyecto: true }));
                    setForm(p => ({ ...p, tipoProyecto: val?.value ?? '' }));
                  }}
                  onBlur={touch('tipoProyecto')}
                  isOptionEqualToValue={(o, v) => o.value === v.value}
                  noOptionsText="Sin resultados"
                  renderInput={(params) => (
                    <TextField {...params} required
                      label="Tipo de trabajo"
                      error={!!err.tipoProyecto}
                      helperText={err.tipoProyecto || ' '} />
                  )}
                />
              </Grid>

              {/* Descripción — fila 2, ancho completo */}
              <Grid size={{ xs: 12 }}>
                <TextField fullWidth required multiline rows={4}
                  label="¿Qué trabajo querés realizar?"
                  value={form.descripcion}
                  onChange={set('descripcion')}
                  onBlur={touch('descripcion')}
                  error={!!err.descripcion}
                  helperText={err.descripcion || `${form.descripcion.length} caracteres`}
                  placeholder="Ej: Remodelación de cocina de aproximadamente 25 m². Se requiere cambio de muebles, sobres de cuarzo e instalación eléctrica nueva." />
              </Grid>
            </Grid>
          </FormSection>

          {/* SECCIÓN: Ubicación */}
          <FormSection title="Ubicación" badge="Opcional" sectionRef={ubicRef}>
            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12 }}>
                <Autocomplete
                  fullWidth
                  options={propiedades}
                  getOptionLabel={(o) => o.nombre ?? ''}
                  value={propiedades.find(p => p.id === form.propiedadId) ?? null}
                  onChange={(_, val) => {
                    setProvinciaId('');
                    setCantonId('');
                    setCantones([]);
                    setDistritos([]);
                    setLoadingCantones(false);
                    setLoadingDistritos(false);
                    setForm(p => ({
                      ...p,
                      propiedadId: val?.id ?? null,
                      provincia: val?.provincia ?? '',
                      canton: val?.canton ?? '',
                      distrito: val?.distrito ?? '',
                    }));
                  }}
                  isOptionEqualToValue={(o, v) => o.id === v.id}
                  noOptionsText="No tenés propiedades registradas"
                  renderInput={(params) => (
                    <TextField {...params} label="Usar una propiedad guardada"
                      helperText="La ubicación se completará automáticamente" />
                  )}
                />
              </Grid>
              {form.propiedadId && (
                <Grid size={{ xs: 12 }}>
                  <Alert severity="info">
                    {(() => {
                      const seleccionada = propiedades.find(p => p.id === form.propiedadId);
                      return seleccionada
                        ? `${seleccionada.direccion} · ${seleccionada.distrito}, ${seleccionada.canton}, ${seleccionada.provincia}`
                        : 'Ubicación cargada desde la propiedad seleccionada.';
                    })()}
                  </Alert>
                </Grid>
              )}
              {!form.propiedadId && <>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Autocomplete
                  fullWidth
                  options={provincias}
                  getOptionLabel={(o) => (typeof o === 'string' ? o : o.name)}
                  value={provincias.find(p => p.id === provinciaId) ?? null}
                  onChange={(_, val) => {
                    setProvinciaId(val?.id ?? '');
                    setCantonId('');
                    setCantones([]);
                    setDistritos([]);
                    setLoadingCantones(!!val);
                    setLoadingDistritos(false);
                    setForm(p => ({ ...p, provincia: val?.name ?? '', canton: '', distrito: '' }));
                  }}
                  isOptionEqualToValue={(o, v) => o.id === v.id}
                  loading={provincias.length === 0}
                  loadingText="Cargando…"
                  noOptionsText="Sin resultados"
                  renderInput={(params) => (
                    <TextField {...params} label="Provincia" />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Autocomplete
                  fullWidth
                  options={cantones}
                  getOptionLabel={(o) => (typeof o === 'string' ? o : o.name)}
                  value={cantones.find(c => c.id === cantonId) ?? null}
                  onChange={(_, val) => {
                    setCantonId(val?.id ?? '');
                    setDistritos([]);
                    setLoadingDistritos(!!val);
                    setForm(p => ({ ...p, canton: val?.name ?? '', distrito: '' }));
                  }}
                  disabled={!provinciaId}
                  loading={loadingCantones}
                  loadingText="Cargando…"
                  noOptionsText="Sin resultados"
                  isOptionEqualToValue={(o, v) => o.id === v.id}
                  renderInput={(params) => (
                    <TextField {...params} label="Cantón" />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Autocomplete
                  fullWidth
                  options={distritos}
                  getOptionLabel={(o) => (typeof o === 'string' ? o : o.name)}
                  value={distritos.find(d => d.name === form.distrito) ?? null}
                  onChange={(_, val) => {
                    setForm(p => ({ ...p, distrito: val?.name ?? '' }));
                  }}
                  disabled={!cantonId}
                  loading={loadingDistritos}
                  loadingText="Cargando…"
                  noOptionsText="Sin resultados"
                  isOptionEqualToValue={(o, v) => o.id === v.id}
                  renderInput={(params) => (
                    <TextField {...params} label="Distrito"
                      helperText="Ayuda a los constructores de tu zona a encontrar tu proyecto" />
                  )}
                />
              </Grid>
              </>}
            </Grid>
          </FormSection>

          {/* SECCIÓN: Detalles (área + presupuesto juntos) */}
          <FormSection title="Detalles del proyecto" badge="Opcional" sectionRef={detallesRef}>
            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth label="Área aproximada"
                  value={form.areaM2} onChange={set('areaM2')} type="number"
                  slotProps={{ input: { endAdornment: <InputAdornment position="end">m²</InputAdornment> } }}
                  helperText="Metros cuadrados del área de trabajo" />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth label="Presupuesto máximo"
                  value={form.presupuestoMax} onChange={set('presupuestoMax')} type="number"
                  slotProps={{ input: { startAdornment: <InputAdornment position="start">₡</InputAdornment> } }}
                  helperText={
                    form.presupuestoMax
                      ? `₡ ${parseFloat(form.presupuestoMax).toLocaleString('es-CR')} · Podés ajustarlo luego`
                      : 'Podés dejarlo vacío si aún no contás con un monto definido'
                  } />
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
            flexWrap: 'wrap',
          }}>
            <Button onClick={() => navigate('/mis-proyectos')} sx={{ color: 'text.secondary' }}>
              Cancelar
            </Button>
            <Button variant="outlined" startIcon={<BookmarkIcon sx={{ fontSize: 15 }} />}
              onClick={() => navigate('/mis-proyectos', { state: { success: 'Proyecto guardado como borrador.' } })}
              disabled={loading} sx={{ whiteSpace: 'nowrap' }}>
              Guardar borrador
            </Button>
            <Button variant="contained" startIcon={<AddIcon sx={{ fontSize: 15 }} />}
              onClick={handleCrearProyecto} disabled={loading}
              sx={{ boxShadow: 'none' }}>
              {loading
                ? <><CircularProgress size={14} color="inherit" sx={{ mr: 1 }} />Creando proyecto…</>
                : 'Crear proyecto'}
            </Button>
          </Box>
        </Box>

        {/* ── Resumen — solo lg+ ── */}
        <Box sx={{ width: 236, flexShrink: 0, display: { xs: 'none', lg: 'block' } }}>
          <SummaryPanel form={form} />
        </Box>
      </Box>
    </Box>
  );
}
