import { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, TextField, Button,
  Grid, Alert, Snackbar, Chip, Stack, Divider,
} from '@mui/material';
import SaveIcon     from '@mui/icons-material/Save';
import BusinessIcon from '@mui/icons-material/Business';
import VerifiedIcon from '@mui/icons-material/Verified';
import PendingIcon  from '@mui/icons-material/HourglassEmpty';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import { perfilesConstructorApi } from '../../api/endpoints';
import LoadingScreen from '../../components/common/LoadingScreen';

const API_BASE = import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, '') ?? 'http://localhost:5115';
const assetUrl = (url) => url?.startsWith('/') ? `${API_BASE}${url}` : url;

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
  const [savingPortfolio, setSavingPortfolio] = useState(false);
  const [errors, setErrors]     = useState({});
  const [portfolio, setPortfolio] = useState({ titulo: '', descripcion: '', imagenes: [] });
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

  const handlePortfolioImages = (event) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length > 8) {
      setPortfolio(current => ({ ...current, imagenes: files.slice(0, 8) }));
      notify(`Seleccionaste ${files.length} imágenes. El límite es 8; se conservarán las primeras 8.`, 'warning');
      event.target.value = '';
      return;
    }
    setPortfolio(current => ({ ...current, imagenes: files.slice(0, 8) }));
    event.target.value = '';
  };

  const handlePortfolioSubmit = async () => {
    if (!portfolio.titulo.trim()) {
      notify('Ingresá el título del proyecto.', 'error');
      return;
    }
    if (portfolio.imagenes.length === 0) {
      notify('Adjuntá al menos una fotografía.', 'error');
      return;
    }

    const data = new FormData();
    data.append('Titulo', portfolio.titulo.trim());
    data.append('Descripcion', portfolio.descripcion.trim());
    portfolio.imagenes.forEach(image => data.append('Imagenes', image));

    setSavingPortfolio(true);
    try {
      const response = await perfilesConstructorApi.addPortafolio(perfil.id, data);
      setPerfil(current => ({
        ...current,
        portafolioItems: [response.data, ...(current.portafolioItems ?? [])],
      }));
      setPortfolio({ titulo: '', descripcion: '', imagenes: [] });
      notify('Proyecto publicado en tu portafolio.');
    } catch (err) {
      notify(err.response?.data?.message || 'No fue posible publicar el proyecto.', 'error');
    } finally {
      setSavingPortfolio(false);
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

      {/* Portafolio */}
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="subtitle2" fontWeight={700} color="text.secondary"
            sx={{ textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: 11, mb: 0.75 }}>
            Portafolio de trabajos
          </Typography>
          <Typography color="text.secondary" fontSize={13} mb={2.5}>
            Publicá fotografías y detalles de proyectos terminados para que los clientes conozcan tu experiencia.
          </Typography>

          {!perfil?.id ? (
            <Alert severity="info">Primero registrá la empresa para poder publicar trabajos.</Alert>
          ) : (
            <>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField fullWidth label="Título del proyecto *" value={portfolio.titulo}
                    inputProps={{ maxLength: 200 }}
                    onChange={event => setPortfolio(current => ({ ...current, titulo: event.target.value }))}
                    placeholder="Ej: Remodelación integral de cocina" />
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth multiline rows={3} label="Descripción"
                    value={portfolio.descripcion} inputProps={{ maxLength: 1000 }}
                    onChange={event => setPortfolio(current => ({ ...current, descripcion: event.target.value }))}
                    placeholder="Contá el alcance, los materiales utilizados y el resultado obtenido." />
                </Grid>
                <Grid item xs={12}>
                  <Button component="label" variant="outlined" startIcon={<AddPhotoAlternateIcon />}>
                    Seleccionar fotografías
                    <input hidden multiple type="file" accept="image/jpeg,image/png,image/webp"
                      onChange={handlePortfolioImages} />
                  </Button>
                  <Typography display="block" color="text.secondary" fontSize={11.5} mt={0.75}>
                    De 1 a 8 imágenes JPG, PNG o WebP; máximo 5 MB por archivo.
                  </Typography>
                  {portfolio.imagenes.length > 0 && (
                    <Stack direction="row" gap={0.75} flexWrap="wrap" mt={1.5}>
                      {portfolio.imagenes.map(image => (
                        <Chip key={`${image.name}-${image.lastModified}`} label={image.name} size="small" />
                      ))}
                    </Stack>
                  )}
                </Grid>
              </Grid>

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2.5 }}>
                <Button variant="contained" startIcon={<AddPhotoAlternateIcon />}
                  onClick={handlePortfolioSubmit} disabled={savingPortfolio}>
                  {savingPortfolio ? 'Publicando…' : 'Publicar proyecto'}
                </Button>
              </Box>

              {perfil.portafolioItems?.length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Divider sx={{ mb: 2 }} />
                  <Typography fontSize={13} fontWeight={700} mb={1.5}>Trabajos publicados</Typography>
                  <Grid container spacing={1.5}>
                    {perfil.portafolioItems.map(item => (
                      <Grid item xs={12} sm={6} key={item.id}>
                        <Box sx={{ display: 'flex', gap: 1.25, p: 1.25, border: '1px solid',
                          borderColor: 'divider', borderRadius: 1 }}>
                          <Box component="img" src={assetUrl(item.imagenUrl)} alt=""
                            sx={{ width: 72, height: 58, objectFit: 'cover', borderRadius: 0.75, flexShrink: 0 }} />
                          <Box sx={{ minWidth: 0 }}>
                            <Typography fontSize={13} fontWeight={700} noWrap>{item.titulo}</Typography>
                            <Typography fontSize={11.5} color="text.secondary">
                              {item.imagenUrls?.length ?? 1} fotografía{(item.imagenUrls?.length ?? 1) === 1 ? '' : 's'}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}
            </>
          )}
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
