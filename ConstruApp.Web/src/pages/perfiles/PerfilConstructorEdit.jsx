import { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, TextField, Button,
  Grid, Alert, Snackbar, LinearProgress, Divider, Chip,
} from '@mui/material';
import SaveIcon        from '@mui/icons-material/Save';
import VerifiedIcon    from '@mui/icons-material/Verified';
import { perfilesConstructorApi } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';

const EMPTY = {
  nombreEmpresa: '', bio: '', especialidades: '', zonasCobertura: '',
  aniosExperiencia: '', cedulaJuridica: '', telefono: '', sitioWeb: '', instagram: '',
};

export default function PerfilConstructorEdit() {
  const { usuario } = useAuth();
  const [perfil, setPerfil]   = useState(null);
  const [form, setForm]       = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [toast, setToast]     = useState({ open: false, msg: '', severity: 'success' });

  const notify = (msg, severity = 'success') => setToast({ open: true, msg, severity });
  const set = f => e => setForm(p => ({ ...p, [f]: e.target.value }));

  useEffect(() => {
    perfilesConstructorApi.getMio()
      .then(r => {
        setPerfil(r.data);
        setForm({
          nombreEmpresa:    r.data.nombreEmpresa    || '',
          bio:              r.data.bio              || '',
          especialidades:   r.data.especialidades   || '',
          zonasCobertura:   r.data.zonasCobertura   || '',
          aniosExperiencia: r.data.aniosExperiencia ?? '',
          cedulaJuridica:   r.data.cedulaJuridica   || '',
          telefono:         r.data.telefono         || '',
          sitioWeb:         r.data.sitioWeb         || '',
          instagram:        r.data.instagram        || '',
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { ...form, aniosExperiencia: parseInt(form.aniosExperiencia) || 0 };
      const { data } = perfil?.id
        ? await perfilesConstructorApi.update(perfil.id, payload)
        : await perfilesConstructorApi.create(payload);
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
          <Typography variant="h5" fontWeight={800}>Mi perfil Constructor</Typography>
          <Typography color="text.secondary">
            Esta información es visible para los clientes en el marketplace.
          </Typography>
        </Box>
        {perfil?.verificado && (
          <Chip icon={<VerifiedIcon />} label="Verificado" color="success" />
        )}
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="subtitle1" fontWeight={700} gutterBottom>Información general</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Nombre de empresa / profesional" value={form.nombreEmpresa}
                onChange={set('nombreEmpresa')} required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Cédula jurídica (opcional)" value={form.cedulaJuridica}
                onChange={set('cedulaJuridica')} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth multiline rows={3} label="Descripción / bio"
                value={form.bio} onChange={set('bio')}
                placeholder="Describí tu experiencia, tipo de proyectos que realizás, etc." />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="subtitle1" fontWeight={700} gutterBottom>Experiencia y cobertura</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Especialidades" value={form.especialidades}
                onChange={set('especialidades')}
                placeholder="Ej: Remodelación, Obra gris, Pisos"
                helperText="Separadas por coma" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Años de experiencia" value={form.aniosExperiencia}
                onChange={set('aniosExperiencia')} type="number" inputProps={{ min: 0 }} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Zonas de cobertura" value={form.zonasCobertura}
                onChange={set('zonasCobertura')}
                placeholder="Ej: San José, Alajuela, Heredia"
                helperText="Provincias o cantones donde trabajás" />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="subtitle1" fontWeight={700} gutterBottom>Contacto y redes</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Teléfono de contacto" value={form.telefono}
                onChange={set('telefono')} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Sitio web (opcional)" value={form.sitioWeb}
                onChange={set('sitioWeb')} placeholder="https://..." />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Instagram (opcional)" value={form.instagram}
                onChange={set('instagram')} placeholder="@usuario" />
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
