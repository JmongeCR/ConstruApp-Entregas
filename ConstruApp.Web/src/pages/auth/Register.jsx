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
        flex: { xs: 'none', md: '0 0 52%' },
        minHeight: { xs: '220px', md: '100vh' },
        display: { xs: 'none', md: 'flex' },
        position: 'relative',
        overflow: 'hidden',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        p: { xs: 4, md: 6 },
        background: 'linear-gradient(160deg, #060D20 0%, #0B1A35 40%, #0E2040 100%)',
      }}>
        <Box sx={{ position: 'absolute', inset: 0, zIndex: 0, overflow: 'hidden', opacity: 0.18 }}>
          <svg width="100%" height="100%" viewBox="0 0 600 500" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid2" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="600" height="500" fill="url(#grid2)" />
            <rect x="50" y="300" width="60" height="200" fill="rgba(255,255,255,0.5)" />
            <rect x="130" y="250" width="80" height="250" fill="rgba(255,255,255,0.4)" />
            <rect x="230" y="180" width="100" height="320" fill="rgba(255,255,255,0.55)" />
            <rect x="350" y="220" width="70" height="280" fill="rgba(255,255,255,0.35)" />
            <line x1="460" y1="80" x2="460" y2="350" stroke="rgba(255,255,255,0.7)" strokeWidth="4" />
            <line x1="460" y1="80" x2="560" y2="90" stroke="rgba(255,255,255,0.7)" strokeWidth="3" />
            <line x1="460" y1="80" x2="380" y2="88" stroke="rgba(255,255,255,0.5)" strokeWidth="2" />
            <rect x="450" y="75" width="20" height="20" fill="rgba(245,158,11,0.8)" />
            <circle cx="520" cy="60" r="25" fill="rgba(245,158,11,0.15)" />
            <circle cx="520" cy="60" r="14" fill="rgba(245,158,11,0.25)" />
          </svg>
        </Box>

        <Box sx={{
          position: 'absolute', top: -40, right: -60,
          width: 280, height: 280, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(245,158,11,0.1) 0%, transparent 70%)',
          zIndex: 0,
        }} />

        <Box sx={{
          position: 'absolute', top: { xs: 24, md: 32 }, left: { xs: 24, md: 36 },
          display: 'flex', alignItems: 'center', gap: 1.5, zIndex: 1,
        }}>
          <Box sx={{
            bgcolor: '#F59E0B', borderRadius: '10px',
            width: 36, height: 36,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(245,158,11,0.4)',
          }}>
            <ConstructionIcon sx={{ color: '#fff', fontSize: 20 }} />
          </Box>
          <Typography sx={{ fontWeight: 800, fontSize: 18, color: '#fff', letterSpacing: '-0.4px' }}>
            ConstruApp
          </Typography>
        </Box>

        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Typography sx={{
            fontWeight: 800,
            fontSize: { xs: 28, md: 42 },
            color: '#fff',
            lineHeight: 1.15,
            letterSpacing: '-1px',
            mb: 2,
            textShadow: '0 2px 20px rgba(0,0,0,0.4)',
          }}>
            Gestión de obra<br />para Costa Rica.
          </Typography>
          <Typography sx={{
            color: 'rgba(255,255,255,0.62)',
            fontSize: { xs: 14, md: 15.5 },
            lineHeight: 1.7,
            maxWidth: 420,
          }}>
            Conectamos proyectos de construcción con los mejores constructores y proveedores del país.
          </Typography>

          <Box sx={{ display: 'flex', gap: 1, mt: 3, flexWrap: 'wrap' }}>
            {['Cotización IA', 'Marketplace', 'Seguimiento en obra'].map(t => (
              <Box key={t} sx={{
                px: 1.5, py: 0.5,
                borderRadius: '20px',
                bgcolor: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.15)',
                backdropFilter: 'blur(8px)',
              }}>
                <Typography sx={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>
                  {t}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>

        <Typography sx={{
          position: 'absolute', bottom: 20, right: 24, zIndex: 1,
          fontSize: 11, color: 'rgba(255,255,255,0.25)',
        }}>
          © 2025 ConstruApp
        </Typography>
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
