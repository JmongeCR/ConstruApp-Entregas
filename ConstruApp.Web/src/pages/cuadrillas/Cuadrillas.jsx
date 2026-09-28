import { useEffect, useState } from 'react';
import { Box, Card, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Alert, Grid, Typography } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { cuadrillasApi } from '../../api/endpoints';
import PageHeader from '../../components/common/PageHeader';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import LoadingScreen from '../../components/common/LoadingScreen';

const EMPTY = { proyectoId:'', nombre:'', descripcion:'' };

export default function Cuadrillas() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState('');
  const [confirmId, setConfirmId] = useState(null);

  const load = () => { setLoading(true); cuadrillasApi.getAll().then(r => setRows(r.data)).finally(() => setLoading(false)); };
  useEffect(load, []);
  const set = f => e => setForm({ ...form, [f]: e.target.value });

  const handleOpen = (row = null) => {
    setError('');
    if (row) { setForm({ proyectoId: row.proyectoId, nombre: row.nombre, descripcion: row.descripcion || '' }); setEditId(row.id); }
    else { setForm(EMPTY); setEditId(null); }
    setOpen(true);
  };

  const handleSave = async () => {
    setError('');
    try {
      const payload = { ...form, proyectoId: parseInt(form.proyectoId) };
      if (editId) await cuadrillasApi.update(editId, payload);
      else await cuadrillasApi.create(payload);
      setOpen(false); load();
    } catch (e) { setError(e.response?.data?.message || 'Error al guardar'); }
  };

  if (loading) return <LoadingScreen />;

  return (
    <Box>
      <PageHeader title="Cuadrillas" subtitle="Equipos de trabajo por proyecto" onAdd={() => handleOpen()} addLabel="Nueva cuadrilla" />
      <Card>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor:'#F5F5F5' }}>
                {['#','Nombre','Proyecto','Trabajadores','Acciones'].map(h => <TableCell key={h}><b>{h}</b></TableCell>)}
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow><TableCell colSpan={5} align="center" sx={{ py:4, color:'text.secondary' }}>No hay cuadrillas aún</TableCell></TableRow>
              ) : rows.map(r => (
                <TableRow key={r.id} hover>
                  <TableCell>{r.id}</TableCell>
                  <TableCell><Typography fontWeight={600} fontSize={14}>{r.nombre}</Typography></TableCell>
                  <TableCell>{r.tituloProyecto || r.proyectoId}</TableCell>
                  <TableCell>{r.totalTrabajadores ?? 0} personas</TableCell>
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
        <DialogTitle>{editId ? 'Editar cuadrilla' : 'Nueva cuadrilla'}</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb:2, mt:1 }}>{error}</Alert>}
          <Grid container spacing={2} sx={{ mt:0.5 }}>
            <Grid item xs={12}><TextField fullWidth label="ID Proyecto" type="number" value={form.proyectoId} onChange={set('proyectoId')} required /></Grid>
            <Grid item xs={12}><TextField fullWidth label="Nombre de la cuadrilla" value={form.nombre} onChange={set('nombre')} required /></Grid>
            <Grid item xs={12}><TextField fullWidth label="Descripción" value={form.descripcion} onChange={set('descripcion')} multiline rows={2} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px:3, pb:2 }}>
          <Button onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={handleSave} variant="contained">Guardar</Button>
        </DialogActions>
      </Dialog>
      <ConfirmDialog open={!!confirmId} message="¿Eliminar esta cuadrilla?" onConfirm={async () => { await cuadrillasApi.delete(confirmId); setConfirmId(null); load(); }} onCancel={() => setConfirmId(null)} />
    </Box>
  );
}
