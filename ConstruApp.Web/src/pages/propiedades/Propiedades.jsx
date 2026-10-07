import { useEffect, useState } from 'react';
import {
  Alert, Box, Button, Card, CardContent, Chip, CircularProgress,
  Dialog, DialogActions, DialogContent, DialogTitle, IconButton,
  Snackbar, TextField, Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import HomeWorkOutlinedIcon from '@mui/icons-material/HomeWorkOutlined';
import PhotoCameraOutlinedIcon from '@mui/icons-material/PhotoCameraOutlined';
import { propiedadesApi } from '../../api/endpoints';

const EMPTY = {
  nombre: '', direccion: '', provincia: '', canton: '', distrito: '', caracteristicas: '',
};

export default function Propiedades() {
  const [propiedades, setPropiedades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modal, setModal] = useState({ open: false, propiedad: null });
  const [form, setForm] = useState(EMPTY);
  const [foto, setFoto] = useState(null);
  const [errors, setErrors] = useState({});
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

  const notify = (message, severity = 'success') => setToast({ open: true, message, severity });

  const cargar = async () => {
    try {
      const { data } = await propiedadesApi.getMias();
      setPropiedades(data);
    } catch {
      notify('No fue posible cargar las propiedades.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    propiedadesApi.getMias()
      .then(({ data }) => setPropiedades(data))
      .catch(() => notify('No fue posible cargar las propiedades.', 'error'))
      .finally(() => setLoading(false));
  }, []);

  const abrir = (propiedad = null) => {
    setModal({ open: true, propiedad });
    setForm(propiedad ? {
      nombre: propiedad.nombre ?? '',
      direccion: propiedad.direccion ?? '',
      provincia: propiedad.provincia ?? '',
      canton: propiedad.canton ?? '',
      distrito: propiedad.distrito ?? '',
      caracteristicas: propiedad.caracteristicas ?? '',
    } : EMPTY);
    setFoto(null);
    setErrors({});
  };

  const cerrar = () => !saving && setModal({ open: false, propiedad: null });
  const set = (field) => (event) => setForm(prev => ({ ...prev, [field]: event.target.value }));

  const validar = () => {
    const next = {};
    if (!form.nombre.trim()) next.nombre = 'El nombre es requerido.';
    if (!form.direccion.trim()) next.direccion = 'La dirección es requerida.';
    if (!form.provincia.trim()) next.provincia = 'La provincia es requerida.';
    if (!form.canton.trim()) next.canton = 'El cantón es requerido.';
    if (!form.distrito.trim()) next.distrito = 'El distrito es requerido.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const guardar = async () => {
    if (!validar()) return;
    setSaving(true);
    let datosGuardados = false;
    try {
      const payload = {
        ...form,
        nombre: form.nombre.trim(),
        direccion: form.direccion.trim(),
        provincia: form.provincia.trim(),
        canton: form.canton.trim(),
        distrito: form.distrito.trim(),
        caracteristicas: form.caracteristicas.trim() || null,
      };
      const { data } = modal.propiedad
        ? await propiedadesApi.update(modal.propiedad.id, payload)
        : await propiedadesApi.create(payload);
      datosGuardados = true;

      if (foto) {
        const formData = new FormData();
        formData.append('archivo', foto);
        await propiedadesApi.subirFoto(data.id, formData);
      }

      setModal({ open: false, propiedad: null });
      setLoading(true);
      await cargar();
      notify(modal.propiedad ? 'Propiedad actualizada.' : 'Propiedad registrada.');
    } catch (error) {
      const detalleValidacion = Object.values(error.response?.data?.errors ?? {})
        .flat()
        .find(Boolean);
      const message = error.response?.data?.message || detalleValidacion;
      notify(message || (datosGuardados && foto
        ? 'Los datos se guardaron, pero no fue posible subir la fotografía.'
        : 'No fue posible guardar la propiedad.'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const eliminar = async () => {
    try {
      await propiedadesApi.delete(confirmDelete.id);
      setPropiedades(prev => prev.filter(item => item.id !== confirmDelete.id));
      notify('Propiedad eliminada.');
    } catch (error) {
      notify(error.response?.data?.message || 'No fue posible eliminar la propiedad.', 'error');
    } finally {
      setConfirmDelete(null);
    }
  };

  const eliminarFoto = async (fotoId) => {
    if (!modal.propiedad) return;
    setSaving(true);
    try {
      await propiedadesApi.eliminarFoto(modal.propiedad.id, fotoId);
      const fotos = modal.propiedad.fotos.filter(item => item.id !== fotoId);
      const propiedadActualizada = { ...modal.propiedad, fotos };
      setModal(prev => ({ ...prev, propiedad: propiedadActualizada }));
      setPropiedades(prev => prev.map(item =>
        item.id === propiedadActualizada.id ? propiedadActualizada : item));
      notify('Fotografía eliminada.');
    } catch (error) {
      notify(error.response?.data?.message || 'No fue posible eliminar la fotografía.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, gap: 2 }}>
        <Box>
          <Typography variant="h5">Mis propiedades</Typography>
          <Typography variant="body2" color="text.secondary">
            Guardá las ubicaciones que utilizás al crear proyectos.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => abrir()}>
          Nueva propiedad
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ py: 10, textAlign: 'center' }}><CircularProgress size={32} /></Box>
      ) : propiedades.length === 0 ? (
        <Box sx={{ py: 10, px: 3, textAlign: 'center', bgcolor: '#fff', border: '1px solid #E5E7EB', borderRadius: 2 }}>
          <HomeWorkOutlinedIcon sx={{ fontSize: 52, color: 'text.disabled', mb: 2 }} />
          <Typography fontWeight={600} mb={0.5}>Todavía no tenés propiedades registradas</Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Registrá una para reutilizar su ubicación en tus próximos proyectos.
          </Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => abrir()}>
            Registrar propiedad
          </Button>
        </Box>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 2 }}>
          {propiedades.map(propiedad => {
            const portada = propiedad.fotos?.[0];
            return (
              <Card key={propiedad.id} variant="outlined" sx={{ overflow: 'hidden' }}>
                {portada ? (
                  <Box component="img" src={portada.url} alt={propiedad.nombre}
                    sx={{ width: '100%', height: 150, objectFit: 'cover', display: 'block' }} />
                ) : (
                  <Box sx={{ height: 110, bgcolor: '#F8FAFC', display: 'grid', placeItems: 'center' }}>
                    <HomeWorkOutlinedIcon sx={{ fontSize: 40, color: '#94A3B8' }} />
                  </Box>
                )}
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1 }}>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography fontWeight={650} noWrap>{propiedad.nombre}</Typography>
                      <Typography fontSize={13} color="text.secondary" sx={{ mt: 0.5 }}>
                        {propiedad.direccion}
                      </Typography>
                      <Typography fontSize={12.5} color="text.disabled" sx={{ mt: 0.25 }}>
                        {[propiedad.distrito, propiedad.canton, propiedad.provincia].filter(Boolean).join(', ')}
                      </Typography>
                    </Box>
                    <Box sx={{ flexShrink: 0 }}>
                      <IconButton size="small" aria-label={`Editar ${propiedad.nombre}`} onClick={() => abrir(propiedad)}>
                        <EditOutlinedIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" color="error" aria-label={`Eliminar ${propiedad.nombre}`}
                        onClick={() => setConfirmDelete(propiedad)}>
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                  {propiedad.caracteristicas && (
                    <Typography fontSize={12.5} color="text.secondary" sx={{ mt: 1.5 }}>
                      {propiedad.caracteristicas}
                    </Typography>
                  )}
                  <Chip size="small" variant="outlined" label={`${propiedad.fotos?.length ?? 0} fotografías`}
                    sx={{ mt: 1.5, fontSize: 11 }} />
                </CardContent>
              </Card>
            );
          })}
        </Box>
      )}

      <Dialog open={modal.open} onClose={cerrar} maxWidth="sm" fullWidth>
        <DialogTitle>{modal.propiedad ? 'Editar propiedad' : 'Nueva propiedad'}</DialogTitle>
        <DialogContent sx={{ display: 'grid', gap: 2, pt: '12px !important' }}>
          <TextField label="Nombre" placeholder="Casa principal" value={form.nombre} onChange={set('nombre')}
            error={!!errors.nombre} helperText={errors.nombre} required />
          <TextField label="Dirección exacta" value={form.direccion} onChange={set('direccion')}
            error={!!errors.direccion} helperText={errors.direccion} required />
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 1.5 }}>
            <TextField label="Provincia" value={form.provincia} onChange={set('provincia')}
              error={!!errors.provincia} helperText={errors.provincia} required />
            <TextField label="Cantón" value={form.canton} onChange={set('canton')}
              error={!!errors.canton} helperText={errors.canton} required />
            <TextField label="Distrito" value={form.distrito} onChange={set('distrito')}
              error={!!errors.distrito} helperText={errors.distrito} required />
          </Box>
          <TextField label="Características" value={form.caracteristicas} onChange={set('caracteristicas')}
            multiline minRows={3} placeholder="Área, número de plantas, condiciones de acceso..." />
          {modal.propiedad?.fotos?.length > 0 && (
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Fotografías guardadas</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {modal.propiedad.fotos.map(item => (
                  <Box key={item.id} sx={{ position: 'relative' }}>
                    <Box component="img" src={item.url} alt={item.nombreArchivo}
                      sx={{ width: 88, height: 72, objectFit: 'cover', borderRadius: 1 }} />
                    <IconButton size="small" color="error" aria-label={`Eliminar ${item.nombreArchivo}`}
                      disabled={saving} onClick={() => eliminarFoto(item.id)}
                      sx={{ position: 'absolute', top: 3, right: 3, bgcolor: 'background.paper', '&:hover': { bgcolor: 'background.paper' } }}>
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </Box>
                ))}
              </Box>
            </Box>
          )}
          <Button component="label" variant="outlined" startIcon={<PhotoCameraOutlinedIcon />} sx={{ justifySelf: 'start' }}>
            {foto ? foto.name : 'Agregar fotografía'}
            <input hidden type="file" accept="image/jpeg,image/png,image/webp"
              onChange={event => setFoto(event.target.files?.[0] ?? null)} />
          </Button>
          <Typography fontSize={11.5} color="text.disabled">JPG, PNG o WebP. Máximo 5 MB.</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={cerrar} disabled={saving}>Cancelar</Button>
          <Button variant="contained" onClick={guardar} disabled={saving}>
            {saving ? <CircularProgress size={20} color="inherit" /> : 'Guardar propiedad'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!confirmDelete} onClose={() => setConfirmDelete(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Eliminar propiedad</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            ¿Querés eliminar “{confirmDelete?.nombre}”? No se podrá eliminar si ya está asociada a un proyecto.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setConfirmDelete(null)}>Cancelar</Button>
          <Button color="error" variant="contained" onClick={eliminar}>Eliminar</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={toast.open} autoHideDuration={4000}
        onClose={() => setToast(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={toast.severity} onClose={() => setToast(prev => ({ ...prev, open: false }))}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
