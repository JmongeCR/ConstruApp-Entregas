import { useEffect, useState } from 'react';
import { Box, Card, CardContent, Grid, Typography, IconButton, Tooltip,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Alert, Chip } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import { bitacoraApi } from '../../api/endpoints';
import PageHeader from '../../components/common/PageHeader';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import LoadingScreen from '../../components/common/LoadingScreen';

const EMPTY = { proyectoId:'', descripcion:'', fotoUrl:'' };

export default function Bitacora() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const [confirmId, setConfirmId] = useState(null);

  const load = () => { setLoading(true); bitacoraApi.getAll().then(r => setRows(r.data)).finally(() => setLoading(false)); };
  useEffect(load, []);
  const set = f => e => setForm({ ...form, [f]: e.target.value });

  const handleSave = async () => {
    setError('');
    try {
      await bitacoraApi.create({ ...form, proyectoId: parseInt(form.proyectoId) });
      setOpen(false); setForm(EMPTY); load();
    } catch (e) { setError(e.response?.data?.message || 'Error al guardar'); }
  };

  if (loading) return <LoadingScreen />;

  return (
    <Box>
      <PageHeader title="Bitácora" subtitle="Registro de avances y novedades" onAdd={() => { setOpen(true); setError(''); }} addLabel="Nueva entrada" />

      {rows.length === 0 ? (
        <Card><CardContent sx={{ textAlign:'center', py:6 }}>
          <MenuBookIcon sx={{ fontSize:60, color:'#E0E0E0', mb:1 }} />
          <Typography color="text.secondary">No hay entradas en la bitácora aún</Typography>
        </CardContent></Card>
      ) : (
        <Grid container spacing={2}>
          {rows.map(r => (
            <Grid item xs={12} md={6} lg={4} key={r.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', mb:1 }}>
                    <Box>
                      <Chip label={`Proyecto #${r.proyectoId}`} size="small" color="primary" sx={{ mb:1 }} />
                      <Typography variant="caption" color="text.secondary" display="block">
                        {new Date(r.createdAt).toLocaleString('es-CR')}
                      </Typography>
                    </Box>
                    <Tooltip title="Eliminar">
                      <IconButton size="small" color="error" onClick={() => setConfirmId(r.id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  <Typography variant="body2" sx={{ mb:1 }}>{r.descripcion}</Typography>
                  {r.fotoUrl && (
                    <Box component="a" href={r.fotoUrl} target="_blank" rel="noopener noreferrer"
                      sx={{ fontSize:12, color:'primary.main' }}>
                      📷 Ver foto
                    </Box>
                  )}
                  <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                    Por: {r.nombreUsuario || `Usuario #${r.usuarioId}`}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Nueva entrada de bitácora</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb:2, mt:1 }}>{error}</Alert>}
          <Box sx={{ display:'flex', flexDirection:'column', gap:2, mt:1 }}>
            <TextField fullWidth label="ID del Proyecto" type="number" value={form.proyectoId} onChange={set('proyectoId')} required />
            <TextField fullWidth label="Descripción" value={form.descripcion} onChange={set('descripcion')} multiline rows={4} required />
            <TextField fullWidth label="URL de foto (opcional)" value={form.fotoUrl} onChange={set('fotoUrl')} />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px:3, pb:2 }}>
          <Button onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={handleSave} variant="contained">Guardar</Button>
        </DialogActions>
      </Dialog>
      <ConfirmDialog open={!!confirmId} message="¿Eliminar esta entrada?" onConfirm={async () => { await bitacoraApi.delete(confirmId); setConfirmId(null); load(); }} onCancel={() => setConfirmId(null)} />
    </Box>
  );
}
