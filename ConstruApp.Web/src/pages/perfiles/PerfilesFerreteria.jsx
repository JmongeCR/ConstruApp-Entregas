import { useEffect, useState } from 'react';
import { Box, Card, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Alert, Grid, Chip, Typography } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import VerifiedIcon from '@mui/icons-material/Verified';
import { perfilesFerreteriaApi } from '../../api/endpoints';
import PageHeader from '../../components/common/PageHeader';
import LoadingScreen from '../../components/common/LoadingScreen';

const EMPTY = { nombreComercial:'', direccion:'', canton:'', provincia:'', horarioAtencion:'' };

export default function PerfilesFerreteria() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState('');

  const load = () => { setLoading(true); perfilesFerreteriaApi.getAll().then(r => setRows(r.data)).finally(() => setLoading(false)); };
  useEffect(load, []);
  const set = f => e => setForm({ ...form, [f]: e.target.value });

  const handleOpen = (row = null) => {
    setError('');
    if (row) {
      setForm({ nombreComercial: row.nombreComercial, direccion: row.direccion || '', canton: row.canton || '', provincia: row.provincia || '', horarioAtencion: row.horarioAtencion || '' });
      setEditId(row.id);
    } else { setForm(EMPTY); setEditId(null); }
    setOpen(true);
  };

  const handleSave = async () => {
    setError('');
    try {
      if (editId) await perfilesFerreteriaApi.update(editId, form);
      else await perfilesFerreteriaApi.create(form);
      setOpen(false); load();
    } catch (e) { setError(e.response?.data?.message || 'Error al guardar'); }
  };

  if (loading) return <LoadingScreen />;

  return (
    <Box>
      <PageHeader title="Perfiles Ferretería" subtitle="Negocios ferreteros registrados" onAdd={() => handleOpen()} addLabel="Nuevo perfil" />
      <Card>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor:'#F5F5F5' }}>
                {['#','Negocio','Dirección','Cantón','Provincia','Horario','Verificado','Acciones'].map(h => <TableCell key={h}><b>{h}</b></TableCell>)}
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow><TableCell colSpan={8} align="center" sx={{ py:4, color:'text.secondary' }}>No hay ferreterías registradas aún</TableCell></TableRow>
              ) : rows.map(r => (
                <TableRow key={r.id} hover>
                  <TableCell>{r.id}</TableCell>
                  <TableCell><Typography fontWeight={600} fontSize={14}>{r.nombreComercial}</Typography></TableCell>
                  <TableCell>{r.direccion || '—'}</TableCell>
                  <TableCell>{r.canton || '—'}</TableCell>
                  <TableCell>{r.provincia || '—'}</TableCell>
                  <TableCell>{r.horarioAtencion || '—'}</TableCell>
                  <TableCell>{r.verificado ? <Chip icon={<VerifiedIcon />} label="Verificado" size="small" color="success" /> : <Chip label="Pendiente" size="small" />}</TableCell>
                  <TableCell>
                    <Tooltip title="Editar"><IconButton size="small" color="primary" onClick={() => handleOpen(r)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editId ? 'Editar ferretería' : 'Nueva ferretería'}</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb:2, mt:1 }}>{error}</Alert>}
          <Grid container spacing={2} sx={{ mt:0.5 }}>
            <Grid item xs={12}><TextField fullWidth label="Nombre comercial" value={form.nombreComercial} onChange={set('nombreComercial')} required /></Grid>
            <Grid item xs={12}><TextField fullWidth label="Dirección" value={form.direccion} onChange={set('direccion')} /></Grid>
            <Grid item xs={6}><TextField fullWidth label="Cantón" value={form.canton} onChange={set('canton')} /></Grid>
            <Grid item xs={6}><TextField fullWidth label="Provincia" value={form.provincia} onChange={set('provincia')} /></Grid>
            <Grid item xs={12}><TextField fullWidth label="Horario de atención" value={form.horarioAtencion} onChange={set('horarioAtencion')} placeholder="Lun-Vie 8am-5pm" /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px:3, pb:2 }}>
          <Button onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={handleSave} variant="contained">Guardar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
