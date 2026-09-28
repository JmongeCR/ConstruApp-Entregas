import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Box, TextField, Button, Typography, Alert, Grid,
} from '@mui/material';
import ConstructionIcon  from '@mui/icons-material/Construction';
import PersonAddIcon     from '@mui/icons-material/PersonAdd';
import CheckCircleIcon   from '@mui/icons-material/CheckCircle';
import { useAuth } from '../../context/AuthContext';

const ACCENT = '#2563EB';

export default function Register() {
  const [form, setForm]       = useState({ nombre: '', email: '', password: '', telefono: '', motivoRegistro: '' });
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');
  const { register, loading } = useAuth();

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    const result = await register({
      nombre:         form.nombre,
      email:          form.email,
      password:       form.password,
      telefono:       form.telefono || undefined,
      motivoRegistro: form.motivoRegistro || undefined,
    });
    if (result.ok && result.pending) {
      setSuccess(result.message);
    } else if (!result.ok) {
      setError(result.message);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex' }}>

      {/* ── Panel izquierdo ─── */}
      <Box sx={{
        display: { xs: 'none', md: 'flex' },
        width: '44%', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center',
        bgcolor: ACCENT, p: 6, position: 'relative', overflow: 'hidden', textAlign: 'center',
      }}>
        <Box sx={{ position: 'absolute', top: -80, right: -80, width: 280, height: 280,
          borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.06)' }} />
        <Box sx={{ position: 'absolute', bottom: 60, left: -60, width: 200, height: 200,
          borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.04)' }} />

        <Box sx={{ bgcolor: 'rgba(255,255,255,0.15)', borderRadius: 3, p: 1.5, display: 'inline-flex', mb: 3, zIndex: 1 }}>
          <ConstructionIcon sx={{ color: 'white', fontSize: 38 }} />
        </Box>
        <Typography variant="h4" fontWeight={800} color="white" sx={{ mb: 2, zIndex: 1 }}>
          Solicitá acceso<br />
          <Box component="span" sx={{ color: 'rgba(255,255,255,0.75)' }}>a ConstruApp.</Box>
        </Typography>
        <Typography sx={{ color: 'rgba(255,255,255,0.65)', fontSize: 15, lineHeight: 1.7, maxWidth: 300, mb: 5, zIndex: 1 }}>
          Completá el formulario y un administrador revisará tu solicitud. Te notificaremos por correo.
        </Typography>

        <Box sx={{ border: '1px solid rgba(255,255,255,0.2)', borderRadius: 3, p: 3, maxWidth: 280, zIndex: 1 }}>
          <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, mb: 0.5 }}>
            Ya confían en ConstruApp
          </Typography>
          <Typography variant="h3" fontWeight={800} sx={{ color: 'white' }}>500+</Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.65)', fontSize: 14 }}>proyectos publicados</Typography>
        </Box>
      </Box>

      {/* ── Panel derecho ─── */}
      <Box sx={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        bgcolor: '#FAFAFA', p: { xs: 3, md: 6 },
      }}>
        <Box sx={{ width: '100%', maxWidth: 420 }}>

          <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center', gap: 1.5, mb: 5 }}>
            <Box sx={{ bgcolor: ACCENT, borderRadius: 1.5, p: 0.7, display: 'flex' }}>
              <ConstructionIcon sx={{ color: 'white', fontSize: 22 }} />
            </Box>
            <Typography fontWeight={800} fontSize={18}>ConstruApp</Typography>
          </Box>

          <Typography variant="h4" fontWeight={800} color="text.primary" sx={{ mb: 1 }}>Solicitar acceso</Typography>
          <Typography color="text.secondary" sx={{ mb: 3, fontSize: 14 }}>
            Completá los datos y un administrador revisará tu solicitud.
          </Typography>

          {error   && <Alert severity="error"   sx={{ mb: 2 }}>{error}</Alert>}
          {success && (
            <Alert severity="success" icon={<CheckCircleIcon />} sx={{ mb: 2 }}>
              <Typography fontWeight={700} fontSize={14} mb={0.5}>¡Solicitud enviada!</Typography>
              {success}
            </Alert>
          )}

          {!success && (
            <Box component="form" onSubmit={handleSubmit}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12 }}>
                  <Typography variant="body2" fontWeight={600} color="text.primary" sx={{ mb: 0.75 }}>Nombre completo</Typography>
                  <TextField fullWidth placeholder="Juan Pérez" value={form.nombre}
                    onChange={set('nombre')} required autoFocus />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Typography variant="body2" fontWeight={600} color="text.primary" sx={{ mb: 0.75 }}>Correo electrónico</Typography>
                  <TextField fullWidth placeholder="tu@email.com" type="email"
                    value={form.email} onChange={set('email')} required />
                </Grid>
                <Grid size={{ xs: 12, sm: 7 }}>
                  <Typography variant="body2" fontWeight={600} color="text.primary" sx={{ mb: 0.75 }}>Contraseña</Typography>
                  <TextField fullWidth placeholder="••••••••" type="password"
                    value={form.password} onChange={set('password')} required
                    helperText="Mín. 6 caracteres, 1 mayúscula, 1 número" />
                </Grid>
                <Grid size={{ xs: 12, sm: 5 }}>
                  <Typography variant="body2" fontWeight={600} color="text.primary" sx={{ mb: 0.75 }}>Teléfono</Typography>
                  <TextField fullWidth placeholder="8888-8888"
                    value={form.telefono} onChange={set('telefono')} />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Typography variant="body2" fontWeight={600} color="text.primary" sx={{ mb: 0.75 }}>
                    ¿Qué buscás en ConstruApp? <Typography component="span" color="text.secondary" fontSize={12}>(opcional)</Typography>
                  </Typography>
                  <TextField fullWidth multiline rows={3}
                    placeholder="Ej: Soy constructor y quiero publicar mis servicios..."
                    value={form.motivoRegistro} onChange={set('motivoRegistro')} />
                </Grid>
              </Grid>

              <Button type="submit" variant="contained" fullWidth size="large"
                startIcon={<PersonAddIcon />} disabled={loading}
                sx={{ mt: 3, py: 1.5, fontSize: 15, mb: 2.5, bgcolor: ACCENT, '&:hover': { bgcolor: '#1D4ED8' } }}>
                {loading ? 'Enviando solicitud...' : 'Enviar solicitud'}
              </Button>
            </Box>
          )}

          <Typography variant="body2" textAlign="center" color="text.secondary">
            ¿Ya tenés cuenta?{' '}
            <Link to="/login" style={{ color: ACCENT, fontWeight: 700, textDecoration: 'none' }}>
              Iniciá sesión →
            </Link>
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
