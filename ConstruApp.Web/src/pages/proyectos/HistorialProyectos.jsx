import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert, Box, Button, Chip, Dialog, DialogActions,
  DialogContent, DialogTitle, Divider, FormControl, InputAdornment,
  MenuItem, Paper, Select, Skeleton, Stack, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TextField, Typography,
} from '@mui/material';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import SearchIcon from '@mui/icons-material/Search';
import FolderOpenOutlinedIcon from '@mui/icons-material/FolderOpenOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import ConstructionOutlinedIcon from '@mui/icons-material/ConstructionOutlined';
import RequestQuoteOutlinedIcon from '@mui/icons-material/RequestQuoteOutlined';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { proyectosApi } from '../../api/endpoints';

const ESTADOS = {
  Borrador:     { label: 'Borrador',       bg: '#F1F5F9', color: '#475569' },
  Publicado:    { label: 'Publicado',      bg: '#DCFCE7', color: '#166534' },
  EnPropuestas: { label: 'En propuestas',  bg: '#FEF3C7', color: '#92400E' },
  EnCurso:      { label: 'En ejecución',   bg: '#DBEAFE', color: '#1D4ED8' },
  Completado:   { label: 'Completado',     bg: '#D1FAE5', color: '#065F46' },
  Cancelado:    { label: 'Cancelado',      bg: '#FEE2E2', color: '#991B1B' },
};

const money = new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC', maximumFractionDigits: 0 });
const date = (value) => value
  ? new Intl.DateTimeFormat('es-CR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value))
  : '—';

function EstadoChip({ estado }) {
  const config = ESTADOS[estado] ?? ESTADOS.Borrador;
  return <Chip size="small" label={config.label} sx={{ bgcolor: config.bg, color: config.color, fontWeight: 700 }} />;
}

function Metric({ label, value }) {
  return (
    <Box sx={{ minWidth: 120 }}>
      <Typography fontSize={11} color="text.secondary" textTransform="uppercase" letterSpacing={0.5}>{label}</Typography>
      <Typography fontSize={14} fontWeight={700} color="text.primary">{value}</Typography>
    </Box>
  );
}

function Section({ title, icon, count, children, empty }) {
  return (
    <Box sx={{ py: 2 }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.25 }}>
        {icon}
        <Typography fontWeight={800}>{title}</Typography>
        <Chip size="small" label={count} sx={{ height: 20, fontSize: 11 }} />
      </Stack>
      {count ? children : <Typography fontSize={13} color="text.secondary">{empty}</Typography>}
    </Box>
  );
}

function DetailDialog({ projectId, onClose }) {
  const navigate = useNavigate();
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    proyectosApi.getHistorialDetalle(projectId)
      .then(({ data }) => setDetail(data))
      .catch(() => setError('No fue posible cargar el detalle del proyecto.'))
      .finally(() => setLoading(false));
  }, [projectId]);

  const p = detail?.proyecto;
  return (
    <Dialog open fullWidth maxWidth="md" onClose={onClose}>
      <DialogTitle sx={{ pb: 1 }}>
        {loading ? 'Cargando historial…' : p?.titulo}
        {p && <Typography variant="body2" color="text.secondary">{p.resultado}</Typography>}
      </DialogTitle>
      <DialogContent dividers sx={{ minHeight: 320 }}>
        {loading && <Stack spacing={1.5}>{[1, 2, 3, 4].map(i => <Skeleton key={i} height={42} />)}</Stack>}
        {error && <Alert severity="error">{error}</Alert>}
        {detail && (
          <>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} sx={{ py: 1 }}>
              <Metric label="Estado final" value={<EstadoChip estado={p.estado} />} />
              <Metric label="Publicado" value={date(p.fechaPublicacion)} />
              <Metric label="Presupuesto" value={p.presupuestoMax ? money.format(p.presupuestoMax) : 'Sin definir'} />
              <Metric label="Contratación" value={p.montoContratado ? money.format(p.montoContratado) : 'Sin adjudicar'} />
            </Stack>
            <Typography sx={{ mt: 1.5, mb: 1 }} color="text.secondary">{p.descripcion}</Typography>
            <Divider />

            <Section title="Propuestas y proveedores" icon={<RequestQuoteOutlinedIcon color="primary" />} count={detail.propuestas.length} empty="Este proyecto no recibió propuestas.">
              <Stack spacing={1}>
                {detail.propuestas.map(item => (
                  <Paper variant="outlined" key={item.id} sx={{ p: 1.5, borderRadius: 2 }}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" gap={1}>
                      <Box>
                        <Typography fontWeight={700}>{item.proveedor}</Typography>
                        <Typography fontSize={12.5} color="text.secondary">{item.descripcion}</Typography>
                      </Box>
                      <Box sx={{ textAlign: { sm: 'right' } }}>
                        <Typography fontWeight={800}>{money.format(item.montoTotal)}</Typography>
                        <Chip size="small" label={item.estado} variant="outlined" />
                      </Box>
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            </Section>
            <Divider />

            <Section title="Cotizaciones IA" icon={<RequestQuoteOutlinedIcon color="primary" />} count={detail.cotizaciones.length} empty="No se generaron cotizaciones con IA.">
              <Stack spacing={1}>
                {detail.cotizaciones.map(item => (
                  <Paper variant="outlined" key={item.id} sx={{ p: 1.5, borderRadius: 2 }}>
                    <Stack direction="row" justifyContent="space-between" gap={2}>
                      <Box><Typography fontWeight={700}>{item.nombrePlan || item.plan || `Versión ${item.version}`}</Typography><Typography fontSize={12.5} color="text.secondary">{date(item.fechaGeneracion)}</Typography></Box>
                      <Typography fontWeight={800}>{money.format(item.rangoMinimo)} – {money.format(item.rangoMaximo)}</Typography>
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            </Section>
            <Divider />

            <Section title="Avances de obra" icon={<ConstructionOutlinedIcon color="primary" />} count={detail.avances.length} empty="No hay avances registrados.">
              <Stack spacing={1}>
                {detail.avances.map(item => (
                  <Paper variant="outlined" key={item.id} sx={{ p: 1.5, borderRadius: 2 }}>
                    <Stack direction="row" justifyContent="space-between"><Typography fontWeight={700}>{item.titulo}</Typography><Typography fontWeight={800} color="primary">{item.porcentajeAvance}%</Typography></Stack>
                    <Typography fontSize={12.5} color="text.secondary">{item.descripcion} · {date(item.fecha)}</Typography>
                  </Paper>
                ))}
              </Stack>
            </Section>
            <Divider />

            <Section title="Documentos" icon={<DescriptionOutlinedIcon color="primary" />} count={detail.documentos.length} empty="No hay documentos asociados.">
              <Stack spacing={0.75}>
                {detail.documentos.map(item => (
                  <Button key={item.id} component="a" href={item.url} target="_blank" rel="noreferrer" variant="text" endIcon={<OpenInNewIcon />} sx={{ justifyContent: 'space-between' }}>
                    {item.nombreArchivo}
                  </Button>
                ))}
              </Stack>
            </Section>
            <Divider />

            <Section title="Facturación" icon={<RequestQuoteOutlinedIcon color="primary" />} count={detail.facturas.length} empty="No hay facturas asociadas.">
              <Stack spacing={1}>
                {detail.facturas.map(item => (
                  <Paper variant="outlined" key={item.id} sx={{ p: 1.5, borderRadius: 2 }}>
                    <Stack direction="row" justifyContent="space-between"><Typography fontWeight={700}>{item.numero}</Typography><Typography fontWeight={800}>{money.format(item.montoTotal)}</Typography></Stack>
                    <Typography fontSize={12.5} color="text.secondary">{item.estado} · Saldo {money.format(item.saldo)}</Typography>
                  </Paper>
                ))}
              </Stack>
            </Section>
          </>
        )}
      </DialogContent>
      <DialogActions>
        {p && ['EnCurso', 'Completado'].includes(p.estado) && <Button onClick={() => navigate(`/obra/${p.id}`)}>Abrir obra</Button>}
        {p && p.cantidadPropuestas > 0 && <Button onClick={() => navigate(`/propuestas/${p.id}`)}>Ver propuestas</Button>}
        <Button variant="contained" onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
}

export default function HistorialProyectos() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    proyectosApi.getHistorial()
      .then(({ data }) => setProjects(data ?? []))
      .catch(() => setError('No fue posible cargar el historial. Intentá nuevamente.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => projects.filter(p => {
    const text = `${p.titulo} ${p.descripcion} ${p.proveedoresParticipantes.join(' ')}`.toLowerCase();
    return (!search || text.includes(search.toLowerCase())) && (!status || p.estado === status);
  }), [projects, search, status]);

  const completed = projects.filter(p => p.estado === 'Completado').length;
  const contracted = projects.filter(p => p.proveedorSeleccionado).length;

  return (
    <Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} gap={2} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={850}>Historial de proyectos</Typography>
          <Typography color="text.secondary">Proyectos, cotizaciones y contrataciones en un solo lugar.</Typography>
        </Box>
        <Button variant="outlined" startIcon={<FolderOpenOutlinedIcon />} onClick={() => navigate('/mis-proyectos')}>Mis proyectos</Button>
      </Stack>

      {!loading && projects.length > 0 && (
        <Stack direction="row" spacing={1.5} sx={{ mb: 2.5, overflowX: 'auto', pb: 0.5 }}>
          {[['Proyectos', projects.length], ['Contrataciones', contracted], ['Completados', completed]].map(([label, value]) => (
            <Paper key={label} variant="outlined" sx={{ px: 2, py: 1.25, minWidth: 140, borderRadius: 2 }}>
              <Typography fontSize={11} color="text.secondary" textTransform="uppercase">{label}</Typography>
              <Typography variant="h6" fontWeight={850}>{value}</Typography>
            </Paper>
          ))}
        </Stack>
      )}

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {!loading && projects.length > 0 && (
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 2 }}>
          <TextField size="small" fullWidth placeholder="Buscar por proyecto o proveedor" value={search} onChange={e => setSearch(e.target.value)} InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }} />
          <FormControl size="small" sx={{ minWidth: 190 }}>
            <Select value={status} displayEmpty onChange={e => setStatus(e.target.value)}>
              <MenuItem value="">Todos los estados</MenuItem>
              {Object.entries(ESTADOS).map(([key, value]) => <MenuItem key={key} value={key}>{value.label}</MenuItem>)}
            </Select>
          </FormControl>
        </Stack>
      )}

      {loading && <Paper variant="outlined" sx={{ p: 2 }}>{[1, 2, 3].map(i => <Skeleton key={i} height={58} />)}</Paper>}

      {!loading && projects.length === 0 && !error && (
        <Paper variant="outlined" sx={{ py: 8, px: 3, textAlign: 'center', borderRadius: 3 }}>
          <HistoryOutlinedIcon sx={{ fontSize: 54, color: '#CBD5E1', mb: 1 }} />
          <Typography variant="h6" fontWeight={800}>Todavía no hay historial</Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5, mb: 2.5 }}>Cuando creés tu primer proyecto, aparecerá aquí sin que tengás que hacer nada más.</Typography>
          <Button variant="contained" onClick={() => navigate('/publicar')}>Crear proyecto</Button>
        </Paper>
      )}

      {!loading && projects.length > 0 && (
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2.5 }}>
          <Table>
            <TableHead><TableRow sx={{ bgcolor: '#F8FAFC' }}>
              <TableCell>Proyecto</TableCell><TableCell>Fecha</TableCell><TableCell>Proveedores</TableCell><TableCell>Resultado</TableCell><TableCell>Estado</TableCell>
            </TableRow></TableHead>
            <TableBody>
              {filtered.map(p => (
                <TableRow key={p.id} hover onClick={() => setSelected(p.id)} sx={{ cursor: 'pointer' }}>
                  <TableCell><Typography fontWeight={750}>{p.titulo}</Typography><Typography fontSize={12} color="text.secondary">{p.tipoProyecto} · {[p.canton, p.provincia].filter(Boolean).join(', ') || 'Sin ubicación'}</Typography></TableCell>
                  <TableCell>{date(p.fechaPublicacion)}</TableCell>
                  <TableCell><Typography fontSize={13}>{p.proveedorSeleccionado || p.proveedoresParticipantes.slice(0, 2).join(', ') || 'Sin propuestas'}</Typography><Typography fontSize={11.5} color="text.secondary">{p.cantidadPropuestas} propuesta{p.cantidadPropuestas === 1 ? '' : 's'}</Typography></TableCell>
                  <TableCell><Typography fontSize={13}>{p.resultado}</Typography>{p.montoContratado && <Typography fontSize={12} color="text.secondary">{money.format(p.montoContratado)}</Typography>}</TableCell>
                  <TableCell><EstadoChip estado={p.estado} /></TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && <TableRow><TableCell colSpan={5} align="center" sx={{ py: 5, color: 'text.secondary' }}>No hay proyectos que coincidan con los filtros.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {selected && <DetailDialog projectId={selected} onClose={() => setSelected(null)} />}
    </Box>
  );
}
