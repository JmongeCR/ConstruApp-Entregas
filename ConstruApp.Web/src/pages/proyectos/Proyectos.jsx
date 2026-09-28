import { useEffect, useState } from 'react';
import { Box, Card, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, Tooltip, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Button, MenuItem,
  Select, FormControl, InputLabel, Alert, Grid, Typography } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { proyectosApi } from '../../api/endpoints';
import PageHeader from '../../components/common/PageHeader';
import EstadoChip from '../../components/common/EstadoChip';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import LoadingScreen from '../../components/common/LoadingScreen';

const ESTADOS = ['Publicado','EnCotizacion','Contratado','EnProgreso','Finalizado'];
const EMPTY = { titulo:'', descripcion:'', presupuesto:'', ubicacion:'', estado:'Publicado', fechaLimite:'' };

export default function Proyectos() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState('');
  const [confirmId, setConfirmId] = useState(null);

  const load = () => {
    setLoading(true);
    proyectosApi.getAll().then(r => setRows(r.data)).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const set = f => e => setForm({ ...form, [f]: e.target.value });

  const handleOpen = (row = null) => {
    setError('');
    if (row) {
      setForm({ titulo: row.titulo, descripcion: row.descripcion || '',
        presupuesto: row.presupuesto, ubicacion: row.ubicacion,
        estado: row.estado, fechaLimite: row.fechaLimite?.slice(0,10) || '' });
      setEditId(row.id);
    } else {
      setForm(EMPTY);
      setEditId(null);
    }
    setOpen(true);
  };

  const handleSave = async () => {
    setError('');
    const payload = { ...form, presupuesto: parseFloat(form.presupuesto) || 0,
      fechaLimite: form.fechaLimite || null };
    try {
      if (editId) await proyectosApi.update(editId, payload);
      else await proyectosApi.create(payload);
      setOpen(false);
      load();
    } catch (e) {
      setError(e.response?.data?.message || 'Error al guardar');
    }
  };

  const handleDelete = async () => {
    await proyectosApi.delete(confirmId);
    setConfirmId(null);
    load();
  };

  if (loading) return <LoadingScreen />;

  return (
    <Box>
      <PageHeader title="Proyectos" subtitle={`${rows.length} proyectos registrados`}
        onAdd={() => handleOpen()} addLabel="Nuevo proyecto" />

      <Card>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#F5F5F5' }}>
                <TableCell><b>#</b></TableCell>
                <TableCell><b>Título</b></TableCell>
                <TableCell><b>Ubicación</b></TableCell>
                <TableCell><b>Presupuesto</b></TableCell>
                <TableCell><b>Estado</b></TableCell>
                <TableCell><b>Fecha Límite</b></TableCell>
                <TableCell align="center"><b>Acciones</b></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                  No hay proyectos aún. ¡Crea el primero!
                </TableCell></TableRow>
              ) : rows.map(r => (
                <TableRow key={r.id} hover>
                  <TableCell>{r.id}</TableCell>
                  <TableCell><Typography fontWeight={600} fontSize={14}>{r.titulo}</Typography></TableCell>
                  <TableCell>{r.ubicacion}</TableCell>
                  <TableCell>₡{r.presupuesto?.toLocaleString()}</TableCell>
                  <TableCell><EstadoChip estado={r.estado} /></TableCell>
                  <TableCell>{r.fechaLimite ? new Date(r.fechaLimite).toLocaleDateString('es-CR') : '—'}</TableCell>
                  <TableCell align="center">
                    <Tooltip title="Editar"><IconButton size="small" color="primary" onClick={() => handleOpen(r)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                    <Tooltip title="Eliminar"><IconButton size="small" color="error" onClick={() => setConfirmId(r.id)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Formulario */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editId ? 'Editar proyecto' : 'Nuevo proyecto'}</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2, mt: 1 }}>{error}</Alert>}
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField fullWidth label="Título" value={form.titulo} onChange={set('titulo')} required />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Descripción" value={form.descripcion}
                onChange={set('descripcion')} multiline rows={3} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Presupuesto (₡)" type="number"
                value={form.presupuesto} onChange={set('presupuesto')} required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Ubicación" value={form.ubicacion} onChange={set('ubicacion')} required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Estado</InputLabel>
                <Select value={form.estado} onChange={set('estado')} label="Estado">
                  {ESTADOS.map(e => <MenuItem key={e} value={e}>{e}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Fecha límite" type="date"
                value={form.fechaLimite} onChange={set('fechaLimite')}
                InputLabelProps={{ shrink: true }} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={handleSave} variant="contained">Guardar</Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog open={!!confirmId} message="¿Eliminar este proyecto?"
        onConfirm={handleDelete} onCancel={() => setConfirmId(null)} />
    </Box>
  );
}
