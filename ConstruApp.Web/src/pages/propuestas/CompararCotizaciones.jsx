import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Alert, Box, Button, CircularProgress, MenuItem, Stack, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, TextField, Typography,
} from '@mui/material';
import { propuestasApi } from '../../api/endpoints';

const money = new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC' });
const empty = { montoMinimo: '', montoMaximo: '', plazoMaximoDias: '', estado: '', orden: 'menorPrecio' };

export default function CompararCotizaciones() {
  const { proyectoId } = useParams();
  return <Comparador key={proyectoId} proyectoId={proyectoId} />;
}

function Comparador({ proyectoId }) {
  const navigate = useNavigate();
  const [form, setForm] = useState(empty);
  const [aplicados, setAplicados] = useState({ params: { page: 1, size: 20 }, revision: 0 });
  const [error, setError] = useState('');
  const set = field => event => setForm(prev => ({ ...prev, [field]: event.target.value }));
  const aplicar = event => {
    event.preventDefault();
    const params = { page: 1, size: 20, orden: form.orden };
    for (const field of ['montoMinimo', 'montoMaximo', 'plazoMaximoDias']) {
      if (form[field].trim() === '') continue;
      const value = Number(form[field]);
      if (!Number.isFinite(value) || value < 0 || (field === 'plazoMaximoDias' && (!Number.isInteger(value) || value === 0))) {
        setError('Ingresá montos válidos y un plazo máximo entero mayor que cero.'); return;
      }
      params[field] = value;
    }
    if (params.montoMinimo != null && params.montoMaximo != null && params.montoMinimo > params.montoMaximo) {
      setError('El monto mínimo no puede superar al máximo.'); return;
    }
    if (form.estado) params.estado = form.estado;
    setError('');
    setAplicados(prev => ({ params, revision: prev.revision + 1 }));
  };

  return <Box sx={{ maxWidth: 1300, mx: 'auto' }}>
    <Button onClick={() => navigate('/mis-proyectos')} sx={{ mb: 2 }}>Volver a mis proyectos</Button>
    <Typography variant="h5" fontWeight={700} sx={{ mb: 1 }}>Comparar cotizaciones</Typography>
    <Typography color="text.secondary" sx={{ mb: 3 }}>Compará las propuestas recibidas de constructores para este proyecto.</Typography>
    <Box component="form" onSubmit={aplicar} sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
      <TextField label="Monto mínimo (CRC)" type="number" value={form.montoMinimo} onChange={set('montoMinimo')}
        size="small" slotProps={{ htmlInput: { min: 0, step: 'any' } }} />
      <TextField label="Monto máximo (CRC)" type="number" value={form.montoMaximo} onChange={set('montoMaximo')}
        size="small" slotProps={{ htmlInput: { min: 0, step: 'any' } }} />
      <TextField label="Plazo máximo (días)" type="number" value={form.plazoMaximoDias} onChange={set('plazoMaximoDias')}
        size="small" slotProps={{ htmlInput: { min: 1, step: 1 } }} />
      <TextField select label="Estado" size="small" sx={{ minWidth: 145 }} value={form.estado} onChange={set('estado')}>
        <MenuItem value="">Todos</MenuItem>
        {['Enviada', 'Vista', 'Aceptada', 'Rechazada', 'Retirada', 'Finalizada'].map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
      </TextField>
      <TextField select label="Ordenar por" size="small" sx={{ minWidth: 170 }} value={form.orden} onChange={set('orden')}>
        <MenuItem value="menorPrecio">Menor monto</MenuItem><MenuItem value="mayorPrecio">Mayor monto</MenuItem>
        <MenuItem value="menorPlazo">Menor plazo</MenuItem><MenuItem value="reciente">Más recientes</MenuItem>
      </TextField>
      <Button variant="contained" type="submit">Aplicar filtros</Button>
      <Button onClick={() => {
        setForm(empty); setError('');
        setAplicados(prev => ({ params: { page: 1, size: 20 }, revision: prev.revision + 1 }));
      }}>Limpiar</Button>
    </Box>
    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
    <Resultados key={JSON.stringify(aplicados)} proyectoId={proyectoId} params={aplicados.params}
      onPage={page => setAplicados(prev => ({ ...prev, params: { ...prev.params, page } }))} />
  </Box>;
}

function Resultados({ proyectoId, params, onPage }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    propuestasApi.comparar(proyectoId, params)
      .then(r => { if (active) setData(r.data); })
      .catch(e => { if (active) setError(e.response?.data?.message ?? 'No fue posible cargar las cotizaciones. Intentá aplicar los filtros otra vez.'); });
    return () => { active = false; };
  }, [proyectoId, params]);

  if (error) return <Alert severity="error">{error}</Alert>;
  if (!data) return <Box role="status" aria-label="Cargando cotizaciones" sx={{ p: 4 }}><CircularProgress /></Box>;
  return <>
    <Typography variant="h6" sx={{ mb: 1 }}>{data.titulo || 'Proyecto sin nombre'}</Typography>
    <Alert severity={data.puedeComparar ? 'success' : 'info'} sx={{ mb: 2 }}>{data.mensaje}</Alert>
    {data.items.length > 0 && <TableContainer sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
      <Table size="small" aria-label="Comparación de cotizaciones de constructores" sx={{ minWidth: 1000 }}>
        <TableHead><TableRow>{['Constructor', 'Monto (CRC)', 'Plazo estimado', 'Descripción y alcance', 'Incluye', 'Estado', 'Fecha de envío'].map(label =>
          <TableCell key={label}>{label}</TableCell>)}</TableRow></TableHead>
        <TableBody>{data.items.map(p => <TableRow key={p.id}>
          <TableCell>{p.constructor}</TableCell><TableCell sx={{ whiteSpace: 'nowrap' }}>{money.format(p.montoTotal)}</TableCell>
          <TableCell>{p.plazoEstimadoDias > 0 ? `${p.plazoEstimadoDias} días` : 'Sin plazo informado'}</TableCell>
          <TableCell sx={{ whiteSpace: 'pre-wrap', minWidth: 220, overflowWrap: 'anywhere' }}>{p.descripcion || 'Sin descripción'}</TableCell>
          <TableCell sx={{ whiteSpace: 'pre-wrap', minWidth: 180, overflowWrap: 'anywhere' }}>{p.incluye || 'Sin detalle'}</TableCell>
          <TableCell>{p.estado}</TableCell><TableCell>{new Date(p.fechaEnvio).toLocaleDateString('es-CR')}</TableCell>
        </TableRow>)}</TableBody>
      </Table>
    </TableContainer>}
    <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 2 }}>
      <Button disabled={data.page <= 1} onClick={() => onPage(data.page - 1)}>Anterior</Button>
      <Typography variant="body2">Página {data.page} · {data.total} coincidencias de {data.totalProyecto} propuestas</Typography>
      <Button disabled={data.page * data.size >= data.total} onClick={() => onPage(data.page + 1)}>Siguiente</Button>
    </Stack>
  </>;
}
