import { useEffect, useState } from 'react';
import { Box, Card, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Alert, Grid, Chip, Typography } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import VerifiedIcon from '@mui/icons-material/Verified';
import StarIcon from '@mui/icons-material/Star';
import { perfilesConstructorApi } from '../../api/endpoints';
import PageHeader from '../../components/common/PageHeader';
import LoadingScreen from '../../components/common/LoadingScreen';

const EMPTY = { nombreEmpresa:'', descripcion:'', especialidades:'', zonasCobertura:'', portafolioUrl:'' };

export default function PerfilesConstructor() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState('');

  const load = () => { setLoading(true); perfilesConstructorApi.getAll().then(r => setRows(r.data)).finally(() => setLoading(false)); };
  useEffect(load, []);
  const set = f => e => setForm({ ...form, [f]: e.target.value });

  const handleOpen = (row = null) => {
    setError('');
    if (row) { setForm({ nombreEmpresa: row.nombreEmpresa, descripcion: row.descripcion||'', especialidades: row.especialidades, zonasCobertura: row.zonasCobertura, portafolioUrl: row.portafolioUrl||'' }); setEditId(row.id); }
    else { setForm(EMPTY); setEditId(null); }
    setOpen(true);
  };

  const handleSave = async () => {
    setError('');
    try {
      if (editId) await perfilesConstructorApi.update(editId, form);
      else await perfilesConstructorApi.create(form);
      setOpen(false); load();
    } catch (e) { setError(e.response?.data?.message || 'Error al guardar'); }
  };

  if (loading) return <LoadingScreen />;

  return (
    <Box>
      <PageHeader title="Perfiles Constructor" subtitle="Empresas constructoras registradas" onAdd={() => handleOpen()} addLabel="Nuevo perfil" />
      <Card>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor:'#F5F5F5' }}>
                {['#','Empresa','Especialidades','Zonas','Calif.','Verificado','Acciones'].map(h => <TableCell key={h}><b>{h}</b></TableCell>)}
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow><TableCell colSpan={7} align="center" sx={{ py:4, color:'text.secondary' }}>No hay perfiles de constructor aún</TableCell></TableRow>
              ) : rows.map(r => (
                <TableRow key={r.id} hover>
                  <TableCell>{r.id}</TableCell>
                  <TableCell><Typography fontWeight={600} fontSize={14}>{r.nombreEmpresa}</Typography></TableCell>
                  <TableCell sx={{ maxWidth:150 }}><Typography noWrap fontSize={12}>{r.especialidades}</Typography></TableCell>
                  <TableCell sx={{ maxWidth:120 }}><Typography noWrap fontSize={12}>{r.zonasCobertura}</Typography></TableCell>
                  <TableCell>
                    <Box sx={{ display:'flex', alignItems:'center', gap:0.5 }}>
                      <StarIcon sx={{ color:'#FFB300', fontSize:14 }} />
                      <Typography fontSize={13} fontWeight={600}>{r.calificacionPromedio}</Typography>
                    </Box>
                  </TableCell>
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
        <DialogTitle>{editId ? 'Editar perfil' : 'Nuevo perfil constructor'}</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb:2, mt:1 }}>{error}</Alert>}
          <Grid container spacing={2} sx={{ mt:0.5 }}>
            <Grid item xs={12}><TextField fullWidth label="Nombre de la empresa" value={form.nombreEmpresa} onChange={set('nombreEmpresa')} required /></Grid>
            <Grid item xs={12}><TextField fullWidth label="Descripción" value={form.descripcion} onChange={set('descripcion')} multiline rows={2} /></Grid>
            <Grid item xs={12}><TextField fullWidth label="Especialidades (separadas por coma)" value={form.especialidades} onChange={set('especialidades')} placeholder="Residencial, Comercial, Remodelación" /></Grid>
            <Grid item xs={12}><TextField fullWidth label="Zonas de cobertura (separadas por coma)" value={form.zonasCobertura} onChange={set('zonasCobertura')} placeholder="San José, Heredia, Alajuela" /></Grid>
            <Grid item xs={12}><TextField fullWidth label="URL del portafolio" value={form.portafolioUrl} onChange={set('portafolioUrl')} /></Grid>
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
