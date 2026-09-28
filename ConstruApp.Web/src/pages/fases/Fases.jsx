import { useEffect, useState } from 'react';
import { Box, Card, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Alert, Grid, LinearProgress, Typography,
  MenuItem, Select, FormControl, InputLabel } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { fasesApi } from '../../api/endpoints';
import PageHeader from '../../components/common/PageHeader';
import EstadoChip from '../../components/common/EstadoChip';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import LoadingScreen from '../../components/common/LoadingScreen';

const ESTADOS = ['Pendiente','EnProgreso','Completada'];
const EMPTY = { proyectoId:'', nombre:'', orden:1, fechaInicioPlan:'', fechaFinPlan:'', avancePorcentaje:0, estado:'Pendiente' };

export default function Fases() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState('');
  const [confirmId, setConfirmId] = useState(null);

  const load = () => { setLoading(true); fasesApi.getAll().then(r => setRows(r.data)).finally(() => setLoading(false)); };
  useEffect(load, []);
  const set = f => e => setForm({ ...form, [f]: e.target.value });

  const handleOpen = (row = null) => {
    setError('');
    if (row) {
      setForm({ proyectoId: row.proyectoId, nombre: row.nombre, orden: row.orden,
        fechaInicioPlan: row.fechaInicioPlan?.slice(0,10), fechaFinPlan: row.fechaFinPlan?.slice(0,10),
        avancePorcentaje: row.avancePorcentaje, estado: row.estado });
      setEditId(row.id);
    } else { setForm(EMPTY); setEditId(null); }
    setOpen(true);
  };

  const handleSave = async () => {
    setError('');
    try {
      const payload = { ...form, proyectoId: parseInt(form.proyectoId), orden: parseInt(form.orden), avancePorcentaje: parseFloat(form.avancePorcentaje) };
      if (editId) await fasesApi.update(editId, payload);
      else await fasesApi.create(payload);
      setOpen(false); load();
    } catch (e) { setError(e.response?.data?.message || 'Error al guardar'); }
  };

  if (loading) return <LoadingScreen />;

  return (
    <Box>
      <PageHeader title="Fases de Proyecto" subtitle="Planificación y seguimiento de fases" onAdd={() => handleOpen()} addLabel="Nueva fase" />
      <Card>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor:'#F5F5F5' }}>
                {['#','Proyecto','Nombre','Orden','Avance','Estado','Inicio Plan','Fin Plan','Acciones'].map(h => <TableCell key={h}><b>{h}</b></TableCell>)}
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow><TableCell colSpan={9} align="center" sx={{ py:4, color:'text.secondary' }}>No hay fases aún</TableCell></TableRow>
              ) : rows.map(r => (
                <TableRow key={r.id} hover>
                  <TableCell>{r.id}</TableCell>
                  <TableCell>{r.tituloProyecto || r.proyectoId}</TableCell>
                  <TableCell><Typography fontWeight={600} fontSize={13}>{r.nombre}</Typography></TableCell>
                  <TableCell>{r.orden}</TableCell>
                  <TableCell sx={{ minWidth: 120 }}>
                    <Box sx={{ display:'flex', alignItems:'center', gap:1 }}>
                      <LinearProgress variant="determinate" value={r.avancePorcentaje}
                        sx={{ flex:1, height:6, borderRadius:3 }} />
                      <Typography variant="caption">{r.avancePorcentaje}%</Typography>
                    </Box>
                  </TableCell>
                  <TableCell><EstadoChip estado={r.estado} /></TableCell>
                  <TableCell>{r.fechaInicioPlan?.slice(0,10)}</TableCell>
                  <TableCell>{r.fechaFinPlan?.slice(0,10)}</TableCell>
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
        <DialogTitle>{editId ? 'Editar fase' : 'Nueva fase'}</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb:2, mt:1 }}>{error}</Alert>}
          <Grid container spacing={2} sx={{ mt:0.5 }}>
            <Grid item xs={8}><TextField fullWidth label="ID Proyecto" type="number" value={form.proyectoId} onChange={set('proyectoId')} required /></Grid>
            <Grid item xs={4}><TextField fullWidth label="Orden" type="number" value={form.orden} onChange={set('orden')} required /></Grid>
            <Grid item xs={12}><TextField fullWidth label="Nombre de la fase" value={form.nombre} onChange={set('nombre')} required /></Grid>
            <Grid item xs={6}><TextField fullWidth label="Inicio plan" type="date" value={form.fechaInicioPlan} onChange={set('fechaInicioPlan')} InputLabelProps={{ shrink:true }} required /></Grid>
            <Grid item xs={6}><TextField fullWidth label="Fin plan" type="date" value={form.fechaFinPlan} onChange={set('fechaFinPlan')} InputLabelProps={{ shrink:true }} required /></Grid>
            <Grid item xs={6}><TextField fullWidth label="Avance (%)" type="number" value={form.avancePorcentaje} onChange={set('avancePorcentaje')} inputProps={{ min:0, max:100 }} /></Grid>
            <Grid item xs={6}>
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
      <ConfirmDialog open={!!confirmId} message="¿Eliminar esta fase?" onConfirm={async () => { await fasesApi.delete(confirmId); setConfirmId(null); load(); }} onCancel={() => setConfirmId(null)} />
    </Box>
  );
}
