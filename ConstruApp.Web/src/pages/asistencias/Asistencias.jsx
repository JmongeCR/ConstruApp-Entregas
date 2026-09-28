import { useEffect, useState } from 'react';
import { Box, Card, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Alert, Grid, MenuItem, Select, FormControl, InputLabel } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { asistenciasApi } from '../../api/endpoints';
import PageHeader from '../../components/common/PageHeader';
import EstadoChip from '../../components/common/EstadoChip';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import LoadingScreen from '../../components/common/LoadingScreen';

const ESTADOS = ['Presente','Ausente','Tardanza'];
const hoy = new Date().toISOString().split('T')[0];
const EMPTY = { trabajadorId:'', proyectoId:'', fecha: hoy, horaEntrada:'08:00', horaSalida:'', estado:'Presente' };

export default function Asistencias() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const [confirmId, setConfirmId] = useState(null);

  const load = () => { setLoading(true); asistenciasApi.getAll().then(r => setRows(r.data)).finally(() => setLoading(false)); };
  useEffect(load, []);
  const set = f => e => setForm({ ...form, [f]: e.target.value });

  const handleSave = async () => {
    setError('');
    try {
      await asistenciasApi.create({ ...form, trabajadorId: parseInt(form.trabajadorId), proyectoId: parseInt(form.proyectoId) });
      setOpen(false); setForm(EMPTY); load();
    } catch (e) { setError(e.response?.data?.message || 'Error al guardar'); }
  };

  if (loading) return <LoadingScreen />;

  return (
    <Box>
      <PageHeader title="Asistencias" subtitle="Control de asistencia diaria" onAdd={() => { setOpen(true); setError(''); setForm(EMPTY); }} addLabel="Registrar asistencia" />
      <Card>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#F5F5F5' }}>
                {['#','Trabajador','Proyecto','Fecha','Entrada','Salida','Estado','Acciones'].map(h => <TableCell key={h}><b>{h}</b></TableCell>)}
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow><TableCell colSpan={8} align="center" sx={{ py:4, color:'text.secondary' }}>No hay registros de asistencia</TableCell></TableRow>
              ) : rows.map(r => (
                <TableRow key={r.id} hover>
                  <TableCell>{r.id}</TableCell>
                  <TableCell>{r.nombreTrabajador || r.trabajadorId}</TableCell>
                  <TableCell>{r.tituloProyecto || r.proyectoId}</TableCell>
                  <TableCell>{r.fecha}</TableCell>
                  <TableCell>{r.horaEntrada}</TableCell>
                  <TableCell>{r.horaSalida || '—'}</TableCell>
                  <TableCell><EstadoChip estado={r.estado} /></TableCell>
                  <TableCell>
                    <Tooltip title="Eliminar"><IconButton size="small" color="error" onClick={() => setConfirmId(r.id)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Registrar asistencia</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb:2, mt:1 }}>{error}</Alert>}
          <Grid container spacing={2} sx={{ mt:0.5 }}>
            <Grid item xs={6}><TextField fullWidth label="ID Trabajador" type="number" value={form.trabajadorId} onChange={set('trabajadorId')} required /></Grid>
            <Grid item xs={6}><TextField fullWidth label="ID Proyecto" type="number" value={form.proyectoId} onChange={set('proyectoId')} required /></Grid>
            <Grid item xs={12}><TextField fullWidth label="Fecha" type="date" value={form.fecha} onChange={set('fecha')} InputLabelProps={{ shrink: true }} required /></Grid>
            <Grid item xs={6}><TextField fullWidth label="Hora Entrada" type="time" value={form.horaEntrada} onChange={set('horaEntrada')} InputLabelProps={{ shrink: true }} required /></Grid>
            <Grid item xs={6}><TextField fullWidth label="Hora Salida" type="time" value={form.horaSalida} onChange={set('horaSalida')} InputLabelProps={{ shrink: true }} /></Grid>
            <Grid item xs={12}>
              <FormControl fullWidth><InputLabel>Estado</InputLabel>
                <Select value={form.estado} onChange={set('estado')} label="Estado">
                  {ESTADOS.map(e => <MenuItem key={e} value={e}>{e}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px:3, pb:2 }}>
          <Button onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={handleSave} variant="contained">Guardar</Button>
        </DialogActions>
      </Dialog>
      <ConfirmDialog open={!!confirmId} message="¿Eliminar este registro?" onConfirm={async () => { await asistenciasApi.delete(confirmId); setConfirmId(null); load(); }} onCancel={() => setConfirmId(null)} />
    </Box>
  );
}
