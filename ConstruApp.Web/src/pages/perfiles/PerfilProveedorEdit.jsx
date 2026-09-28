import { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, TextField, Button,
  Grid, Alert, Snackbar, LinearProgress, Chip,
} from '@mui/material';
import SaveIcon     from '@mui/icons-material/Save';
import VerifiedIcon from '@mui/icons-material/Verified';
import { perfilesProveedorApi } from '../../api/endpoints';

const PROVINCIAS = ['San José','Alajuela','Cartago','Heredia','Guanacaste','Puntarenas','Limón'];

const EMPTY = {
  nombreComercial: '', descripcion: '', direccion: '', canton: '', provincia: 'San José',
  telefonoNegocio: '', sitioWeb: '', horarioAtencion: '',
};

export default function PerfilProveedorEdit() {
  const [perfil, setPerfil]   = useState(null);
  const [form, setForm]       = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [toast, setToast]     = useState({ open: false, msg: '', severity: 'success' });

  const notify = (msg, severity = 'success') => setToast({ open: true, msg, severity });
  const set = f => e => setForm(p => ({ ...p, [f]: e.target.value }));

  useEffect(() => {
    perfilesProveedorApi.getMio()
      .then(r => {
        setPerfil(r.data);
        setForm({
          nombreComercial: r.data.nombreComercial || '',
          descripcion:     r.data.descripcion     || '',
          direccion:       r.data.direccion       || '',
          canton:          r.data.canton          || '',
          provincia:       r.data.provincia       || 'San José',
          telefonoNegocio: r.data.telefonoNegocio || '',
          sitioWeb:        r.data.sitioWeb        || '',
          horarioAtencion: r.data.horarioAtencion || '',
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = perfil?.id
        ? await perfilesProveedorApi.update(perfil.id, form)
        : await perfilesProveedorApi.create(form);
      setPerfil(data);
      notify('Perfil guardado correctamente.');
    } catch {
      notify('Error al guardar el perfil.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LinearProgress />;

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={800}>Mi perfil Proveedor</Typography>
          <Typography color="text.secondary">
            Esta información es visible para constructores y clientes.
          </Typography>
        </Box>
        {perfil?.verificado && (
          <Chip icon={<VerifiedIcon />} label="Verificado" color="success" />
        )}
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="subtitle1" fontWeight={700} gutterBottom>Información del negocio</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Nombre comercial" value={form.nombreComercial}
                onChange={set('nombreComercial')} required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Teléfono del negocio" value={form.telefonoNegocio}
                onChange={set('telefonoNegocio')} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth multiline rows={3} label="Descripción"
                value={form.descripcion} onChange={set('descripcion')}
                placeholder="Describí tu negocio, productos que ofrecés, etc." />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="subtitle1" fontWeight={700} gutterBottom>Ubicación</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField select fullWidth label="Provincia" value={form.provincia}
                onChange={set('provincia')} SelectProps={{ native: true }}>
                {PROVINCIAS.map(p => <option key={p} value={p}>{p}</option>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Cantón" value={form.canton} onChange={set('canton')} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Dirección" value={form.direccion} onChange={set('direccion')} />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="subtitle1" fontWeight={700} gutterBottom>Web y horario</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Sitio web" value={form.sitioWeb}
                onChange={set('sitioWeb')} placeholder="https://..." />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Horario de atención" value={form.horarioAtencion}
                onChange={set('horarioAtencion')} placeholder="Lun-Vie 8am-5pm" />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="contained" size="large" startIcon={<SaveIcon />}
          onClick={handleSave} disabled={saving}>
          {saving ? 'Guardando…' : 'Guardar perfil'}
        </Button>
      </Box>

      <Snackbar open={toast.open} autoHideDuration={3000}
        onClose={() => setToast(t => ({ ...t, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={toast.severity} onClose={() => setToast(t => ({ ...t, open: false }))}>
          {toast.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
