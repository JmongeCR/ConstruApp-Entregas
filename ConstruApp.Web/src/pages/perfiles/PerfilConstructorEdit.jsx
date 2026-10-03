import { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, TextField, Button,
  Grid, Alert, Snackbar, Chip, Stack, Divider,
} from '@mui/material';
import SaveIcon     from '@mui/icons-material/Save';
import BusinessIcon from '@mui/icons-material/Business';
import VerifiedIcon from '@mui/icons-material/Verified';
import PendingIcon  from '@mui/icons-material/HourglassEmpty';
import { perfilesConstructorApi } from '../../api/endpoints';
import LoadingScreen from '../../components/common/LoadingScreen';

const EMPTY = {
  nombreEmpresa: '', bio: '', especialidades: '', zonasCobertura: '',
  aniosExperiencia: '', cedulaJuridica: '', telefono: '', emailContacto: '',
  sitioWeb: '', instagram: '',
};

export default function PerfilConstructorEdit() {
  const [perfil, setPerfil]     = useState(null);
  const [form, setForm]         = useState(EMPTY);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [errors, setErrors]     = useState({});
  const [toast, setToast]       = useState({ open: false, msg: '', severity: 'success' });

  const notify = (msg, severity = 'success') => setToast({ open: true, msg, severity });
  const set = f => e => { setForm(p => ({ ...p, [f]: e.target.value })); setErrors(p => ({ ...p, [f]: '' })); };

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
          emailContacto:    r.data.emailContacto    || '',
          sitioWeb:         r.data.sitioWeb         || '',
          instagram:        r.data.instagram        || '',
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const validate = () => {
    const errs = {};
    if (!form.nombreEmpresa.trim()) errs.nombreEmpresa = 'El nombre de la empresa es requerido.';
    if (form.emailContacto && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.emailContacto))
      errs.emailContacto = 'Correo electrónico inválido.';
    if (form.aniosExperiencia !== '' && (isNaN(Number(form.aniosExperiencia)) || Number(form.aniosExperiencia) < 0))
      errs.aniosExperiencia = 'Debe ser un número positivo.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = { ...form, aniosExperiencia: parseInt(form.aniosExperiencia) || 0 };
      const { data } = perfil?.id
        ? await perfilesConstructorApi.update(perfil.id, payload)
        : await perfilesConstructorApi.create(payload);
      setPerfil(data);
      notify(perfil?.id ? 'Perfil actualizado correctamente.' : 'Empresa registrada correctamente.');
    } catch (err) {
      const msg = err.response?.data?.message || 'Error al guardar el perfil.';
      notify(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingScreen />;

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto' }}>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={1}>
        <Box>
          <Stack direction="row" alignItems="center" gap={1} mb={0.5}>
            <BusinessIcon color="primary" />
            <Typography variant="h5" fontWeight={800}>
              {perfil?.id ? 'Mi empresa' : 'Registrar empresa'}
            </Typography>
          </Stack>
          <Typography color="text.secondary" fontSize={14}>
            Esta información es visible para los clientes en el marketplace.
          </Typography>
        </Box>
        {perfil?.id && (
          perfil.verificado
            ? <Chip icon={<VerifiedIcon />} label="Empresa verificada" color="success" size="small"
                sx={{ fontWeight: 600 }} />
            : <Chip icon={<PendingIcon />} label="Pendiente de verificación" color="warning" size="small"
                sx={{ fontWeight: 600 }} />
        )}
      </Stack>

      {/* Sin perfil todavía */}
      {!perfil?.id && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Completá los datos de tu empresa para aparecer en el marketplace y recibir solicitudes de proyectos.
        </Alert>
      )}

      {/* Información general */}
      <Card variant="outlined" sx={{ mb: 2 }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="subtitle2" fontWeight={700} color="text.secondary"
            sx={{ textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: 11, mb: 2 }}>
            Información general
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Nombre de empresa *" value={form.nombreEmpresa}
                onChange={set('nombreEmpresa')} error={!!errors.nombreEmpresa}
                helperText={errors.nombreEmpresa} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Cédula jurídica" value={form.cedulaJuridica}
                onChange={set('cedulaJuridica')}
                helperText="Ej: 3-101-123456 (opcional)" />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth multiline rows={3} label="Descripción de la empresa"
                value={form.bio} onChange={set('bio')}
                placeholder="Describí tu experiencia, tipo de proyectos que realizás, metodología de trabajo, etc." />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Experiencia y cobertura */}
      <Card variant="outlined" sx={{ mb: 2 }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="subtitle2" fontWeight={700} color="text.secondary"
            sx={{ textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: 11, mb: 2 }}>
            Experiencia y cobertura
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={8}>
              <TextField fullWidth label="Especialidades" value={form.especialidades}
                onChange={set('especialidades')}
                placeholder="Ej: Remodelación, Obra gris, Pisos, Techado"
                helperText="Separadas por coma" />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="Años de experiencia" value={form.aniosExperiencia}
                onChange={set('aniosExperiencia')} type="number" inputProps={{ min: 0 }}
                error={!!errors.aniosExperiencia} helperText={errors.aniosExperiencia} />
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

      {/* Contacto */}
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="subtitle2" fontWeight={700} color="text.secondary"
            sx={{ textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: 11, mb: 2 }}>
            Información de contacto
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Teléfono" value={form.telefono}
                onChange={set('telefono')} placeholder="Ej: 8888-8888" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Correo electrónico" value={form.emailContacto}
                onChange={set('emailContacto')} type="email"
                error={!!errors.emailContacto} helperText={errors.emailContacto} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Sitio web" value={form.sitioWeb}
                onChange={set('sitioWeb')} placeholder="https://..." />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Instagram" value={form.instagram}
                onChange={set('instagram')} placeholder="@usuario" />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Divider sx={{ mb: 3 }} />

      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="contained" size="large" startIcon={<SaveIcon />}
          onClick={handleSave} disabled={saving}>
          {saving ? 'Guardando…' : perfil?.id ? 'Actualizar empresa' : 'Registrar empresa'}
        </Button>
      </Box>

      <Snackbar open={toast.open} autoHideDuration={4000}
        onClose={() => setToast(t => ({ ...t, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={toast.severity} onClose={() => setToast(t => ({ ...t, open: false }))}>
          {toast.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
