import { useEffect, useState } from 'react';
import { Box, Card, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Alert, Grid, MenuItem, Select, FormControl, InputLabel, Typography } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { trabajadoresApi } from '../../api/endpoints';
import PageHeader from '../../components/common/PageHeader';
import EstadoChip from '../../components/common/EstadoChip';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import LoadingScreen from '../../components/common/LoadingScreen';

const ESTADOS = ['Activo','Inactivo'];
const EMPTY = { nombre:'', especialidad:'', tarifaDiaria:'', estado:'Activo' };

export default function Trabajadores() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState('');
  const [confirmId, setConfirmId] = useState(null);

  const load = () => { setLoading(true); trabajadoresApi.getAll().then(r => setRows(r.data)).finally(() => setLoading(false)); };
  useEffect(load, []);
  const set = f => e => setForm({ ...form, [f]: e.target.value });

  const handleOpen = (row = null) => {
    setError('');
    if (row) { setForm({ nombre: row.nombre, especialidad: row.especialidad, tarifaDiaria: row.tarifaDiaria, estado: row.estado }); setEditId(row.id); }
    else { setForm(EMPTY); setEditId(null); }
    setOpen(true);
  };

  const handleSave = async () => {
    setError('');
    try {
      const payload = { ...form, tarifaDiaria: parseFloat(form.tarifaDiaria) };
      if (editId) await trabajadoresApi.update(editId, payload);
      else await trabajadoresApi.create(payload);
      setOpen(false); load();
    } catch (e) { setError(e.response?.data?.message || 'Error al guardar'); }
  };

  if (loading) return <LoadingScreen />;

  return (
    <Box>
      <PageHeader title="Trabajadores" subtitle={`${rows.length} trabajadores registrados`} onAdd={() => handleOpen()} addLabel="Nuevo trabajador" />
      <Card>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#F5F5F5' }}>
                {['#','Nombre','Especialidad','Tarifa Diaria','Estado','Acciones'].map(h => <TableCell key={h}><b>{h}</b></TableCell>)}
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>No hay trabajadores aún</TableCell></TableRow>
              ) : rows.map(r => (
                <TableRow key={r.id} hover>
                  <TableCell>{r.id}</TableCell>
                  <TableCell><Typography fontWeight={600} fontSize={14}>{r.nombre}</Typography></TableCell>
                  <TableCell>{r.especialidad}</TableCell>
                  <TableCell>₡{r.tarifaDiaria?.toLocaleString()}/día</TableCell>
                  <TableCell><EstadoChip estado={r.estado} /></TableCell>
                  <TableCell>
                    <Tooltip title="Editar"><IconButton size="small" color="primary" onClick={() => handleOpen(r)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                    <Tooltip title="Eliminar"><IconButton size="small" color="error" onClick={() => setConfirmId(r.id)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editId ? 'Editar trabajador' : 'Nuevo trabajador'}</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2, mt: 1 }}>{error}</Alert>}
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}><TextField fullWidth label="Nombre" value={form.nombre} onChange={set('nombre')} required /></Grid>
            <Grid item xs={12}><TextField fullWidth label="Especialidad" value={form.especialidad} onChange={set('especialidad')} required /></Grid>
            <Grid item xs={6}><TextField fullWidth label="Tarifa Diaria (₡)" type="number" value={form.tarifaDiaria} onChange={set('tarifaDiaria')} required /></Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Estado</InputLabel>
                <Select value={form.estado} onChange={set('estado')} label="Estado">
                  {ESTADOS.map(e => <MenuItem key={e} value={e}>{e}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={handleSave} variant="contained">Guardar</Button>
        </DialogActions>
      </Dialog>
      <ConfirmDialog open={!!confirmId} message="¿Eliminar este trabajador?" onConfirm={async () => { await trabajadoresApi.delete(confirmId); setConfirmId(null); load(); }} onCancel={() => setConfirmId(null)} />
    </Box>
  );
}
