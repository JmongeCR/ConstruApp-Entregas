import { useEffect, useState } from 'react';
import { Box, Card, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, Tooltip, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Button, Alert, Grid, Typography } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { cotizacionesApi } from '../../api/endpoints';
import PageHeader from '../../components/common/PageHeader';
import EstadoChip from '../../components/common/EstadoChip';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import LoadingScreen from '../../components/common/LoadingScreen';

const EMPTY = { proyectoId: '', montoTotal: '', diasEstimados: '', propuesta: '' };

export default function Cotizaciones() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const [confirmId, setConfirmId] = useState(null);

  const load = () => { setLoading(true); cotizacionesApi.getAll().then(r => setRows(r.data)).finally(() => setLoading(false)); };
  useEffect(load, []);

  const set = f => e => setForm({ ...form, [f]: e.target.value });

  const handleSave = async () => {
    setError('');
    try {
      await cotizacionesApi.create({
        ...form, montoTotal: parseFloat(form.montoTotal), diasEstimados: parseInt(form.diasEstimados),
        proyectoId: parseInt(form.proyectoId),
      });
      setOpen(false); setForm(EMPTY); load();
    } catch (e) { setError(e.response?.data?.message || 'Error al guardar'); }
  };

  if (loading) return <LoadingScreen />;

  return (
    <Box>
      <PageHeader title="Cotizaciones" subtitle={`${rows.length} cotizaciones`}
        onAdd={() => { setOpen(true); setError(''); }} addLabel="Nueva cotización" />
      <Card>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#F5F5F5' }}>
                <TableCell><b>#</b></TableCell>
                <TableCell><b>Proyecto</b></TableCell>
                <TableCell><b>Constructor</b></TableCell>
                <TableCell><b>Monto Total</b></TableCell>
                <TableCell><b>Días Est.</b></TableCell>
                <TableCell><b>Estado</b></TableCell>
                <TableCell><b>Fecha</b></TableCell>
                <TableCell align="center"><b>Acciones</b></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow><TableCell colSpan={8} align="center" sx={{ py: 4, color: 'text.secondary' }}>No hay cotizaciones aún</TableCell></TableRow>
              ) : rows.map(r => (
                <TableRow key={r.id} hover>
                  <TableCell>{r.id}</TableCell>
                  <TableCell><Typography fontWeight={600} fontSize={13}>{r.tituloProyecto}</Typography></TableCell>
                  <TableCell>{r.nombreEmpresaConstructor}</TableCell>
                  <TableCell>₡{r.montoTotal?.toLocaleString()}</TableCell>
                  <TableCell>{r.diasEstimados} días</TableCell>
                  <TableCell><EstadoChip estado={r.estado} /></TableCell>
                  <TableCell>{new Date(r.createdAt).toLocaleDateString('es-CR')}</TableCell>
                  <TableCell align="center">
                    <Tooltip title="Eliminar"><IconButton size="small" color="error" onClick={() => setConfirmId(r.id)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Nueva cotización</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2, mt: 1 }}>{error}</Alert>}
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}><TextField fullWidth label="ID del Proyecto" type="number" value={form.proyectoId} onChange={set('proyectoId')} required /></Grid>
            <Grid item xs={6}><TextField fullWidth label="Monto Total (₡)" type="number" value={form.montoTotal} onChange={set('montoTotal')} required /></Grid>
            <Grid item xs={6}><TextField fullWidth label="Días Estimados" type="number" value={form.diasEstimados} onChange={set('diasEstimados')} required /></Grid>
            <Grid item xs={12}><TextField fullWidth label="Propuesta" value={form.propuesta} onChange={set('propuesta')} multiline rows={4} required /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={handleSave} variant="contained">Guardar</Button>
        </DialogActions>
      </Dialog>
      <ConfirmDialog open={!!confirmId} message="¿Eliminar esta cotización?" onConfirm={async () => { await cotizacionesApi.delete(confirmId); setConfirmId(null); load(); }} onCancel={() => setConfirmId(null)} />
    </Box>
  );
}
