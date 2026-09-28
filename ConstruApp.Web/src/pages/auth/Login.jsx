import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  Box, TextField, Button, Typography, Alert,
  InputAdornment, IconButton,
} from '@mui/material';
import VisibilityIcon    from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import ConstructionIcon  from '@mui/icons-material/Construction';
import { useAuth } from '../../context/AuthContext';

export default function Login() {
  const [form, setForm]         = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [error, setError]       = useState({ msg: '', severity: 'error' });
  const { login, loading }      = useAuth();
  const navigate                = useNavigate();
  const [searchParams]          = useSearchParams();
  const redirectTo              = searchParams.get('redirect') || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError({ msg: '', severity: 'error' });
    const result = await login(form.email, form.password);
    if (result.ok) navigate(redirectTo);
    else setError({
      msg:      result.message,
      severity: result.status === 403 ? 'info' : 'error',
    });
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: { xs: 'column', md: 'row' },
    }}>

      {/* ── Columna izquierda: branding ── */}
      <Box sx={{
        flex: { xs: 'none', md: '0 0 52%' },
        minHeight: { xs: '220px', md: '100vh' },
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        p: { xs: 4, md: 6 },
        background: 'linear-gradient(160deg, #060D20 0%, #0B1A35 40%, #0E2040 100%)',
      }}>
        {/* SVG decorativo — skyline constructivo */}
        <Box sx={{ position: 'absolute', inset: 0, zIndex: 0, overflow: 'hidden', opacity: 0.18 }}>
          <svg width="100%" height="100%" viewBox="0 0 600 500" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
            {/* Grid */}
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="600" height="500" fill="url(#grid)" />
            {/* Edificios / grúa */}
            <rect x="50" y="300" width="60" height="200" fill="rgba(255,255,255,0.5)" />
            <rect x="55" y="310" width="12" height="12" fill="rgba(0,0,0,0.3)" />
            <rect x="73" y="310" width="12" height="12" fill="rgba(0,0,0,0.3)" />
            <rect x="55" y="330" width="12" height="12" fill="rgba(0,0,0,0.3)" />
            <rect x="73" y="330" width="12" height="12" fill="rgba(0,0,0,0.3)" />
            <rect x="55" y="350" width="12" height="12" fill="rgba(0,0,0,0.3)" />
            <rect x="73" y="350" width="12" height="12" fill="rgba(0,0,0,0.3)" />
            <rect x="130" y="250" width="80" height="250" fill="rgba(255,255,255,0.4)" />
            <rect x="138" y="260" width="14" height="14" fill="rgba(0,0,0,0.3)" />
            <rect x="160" y="260" width="14" height="14" fill="rgba(0,0,0,0.3)" />
            <rect x="182" y="260" width="14" height="14" fill="rgba(0,0,0,0.3)" />
            <rect x="138" y="285" width="14" height="14" fill="rgba(0,0,0,0.3)" />
            <rect x="160" y="285" width="14" height="14" fill="rgba(0,0,0,0.3)" />
            <rect x="182" y="285" width="14" height="14" fill="rgba(0,0,0,0.3)" />
            <rect x="138" y="310" width="14" height="14" fill="rgba(0,0,0,0.3)" />
            <rect x="160" y="310" width="14" height="14" fill="rgba(0,0,0,0.3)" />
            <rect x="230" y="180" width="100" height="320" fill="rgba(255,255,255,0.55)" />
            <rect x="240" y="195" width="18" height="18" fill="rgba(0,0,0,0.3)" />
            <rect x="268" y="195" width="18" height="18" fill="rgba(0,0,0,0.3)" />
            <rect x="296" y="195" width="18" height="18" fill="rgba(0,0,0,0.3)" />
            <rect x="240" y="225" width="18" height="18" fill="rgba(0,0,0,0.3)" />
            <rect x="268" y="225" width="18" height="18" fill="rgba(0,0,0,0.3)" />
            <rect x="296" y="225" width="18" height="18" fill="rgba(0,0,0,0.3)" />
            <rect x="240" y="255" width="18" height="18" fill="rgba(0,0,0,0.3)" />
            <rect x="268" y="255" width="18" height="18" fill="rgba(0,0,0,0.3)" />
            <rect x="296" y="255" width="18" height="18" fill="rgba(0,0,0,0.3)" />
            <rect x="350" y="220" width="70" height="280" fill="rgba(255,255,255,0.35)" />
            <rect x="358" y="235" width="14" height="14" fill="rgba(0,0,0,0.3)" />
            <rect x="380" y="235" width="14" height="14" fill="rgba(0,0,0,0.3)" />
            <rect x="400" y="220" width="14" height="14" fill="rgba(0,0,0,0.3)" />
            {/* Grúa */}
            <line x1="460" y1="80" x2="460" y2="350" stroke="rgba(255,255,255,0.7)" strokeWidth="4" />
            <line x1="460" y1="80" x2="560" y2="90" stroke="rgba(255,255,255,0.7)" strokeWidth="3" />
            <line x1="460" y1="80" x2="380" y2="88" stroke="rgba(255,255,255,0.5)" strokeWidth="2" />
            <line x1="540" y1="90" x2="540" y2="160" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeDasharray="4 4" />
            <rect x="450" y="75" width="20" height="20" fill="rgba(245,158,11,0.8)" />
            {/* Sol/Luna */}
            <circle cx="520" cy="60" r="25" fill="rgba(245,158,11,0.15)" />
            <circle cx="520" cy="60" r="14" fill="rgba(245,158,11,0.25)" />
          </svg>
        </Box>

        {/* Glow ámbar */}
        <Box sx={{
          position: 'absolute', top: -40, right: -60,
          width: 280, height: 280, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(245,158,11,0.1) 0%, transparent 70%)',
          zIndex: 0,
        }} />

        {/* Logo arriba */}
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
          <Typography sx={{
            fontWeight: 800, fontSize: 18, color: '#fff',
            letterSpacing: '-0.4px', textShadow: '0 1px 8px rgba(0,0,0,0.3)',
          }}>
            ConstruApp
          </Typography>
        </Box>

        {/* Hero copy abajo */}
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

          {/* Pills */}
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

        {/* Footer branding */}
        <Typography sx={{
          position: 'absolute', bottom: 20, right: 24, zIndex: 1,
          fontSize: 11, color: 'rgba(255,255,255,0.25)',
        }}>
          © 2025 ConstruApp
        </Typography>
      </Box>

      {/* ── Columna derecha: form ── */}
      <Box sx={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#FAFBFD',
        p: { xs: 3, sm: 4, md: 7 },
      }}>
        <Box sx={{ width: '100%', maxWidth: 380 }}>

          {/* Mobile logo */}
          <Box sx={{
            display: { xs: 'flex', md: 'none' },
            alignItems: 'center', gap: 1.5, mb: 4,
          }}>
            <Box sx={{ bgcolor: '#F59E0B', borderRadius: '8px', p: '5px', display: 'flex' }}>
              <ConstructionIcon sx={{ color: 'white', fontSize: 17 }} />
            </Box>
            <Typography sx={{ fontWeight: 800, fontSize: 15, color: '#0F172A' }}>ConstruApp</Typography>
          </Box>

          <Typography sx={{
            fontWeight: 800, fontSize: 24,
            color: '#0D1321', letterSpacing: '-0.5px', mb: 0.75,
          }}>
            Iniciar sesión
          </Typography>
          <Typography sx={{ color: '#7B8EA8', fontSize: 14, mb: 4 }}>
            Ingresá tus credenciales para continuar.
          </Typography>

          {error.msg && (
            <Alert severity={error.severity} sx={{ mb: 3, borderRadius: '10px', fontSize: 13 }}>
              {error.msg}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>

            <Box sx={{ mb: 2.5 }}>
              <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: '#3D4E63', mb: '6px', letterSpacing: '0.1px' }}>
                Correo electrónico
              </Typography>
              <TextField
                fullWidth
                placeholder="tu@email.com"
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                required
                autoFocus
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '10px',
                    bgcolor: '#fff',
                    fontSize: 14,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                    '& fieldset': { borderColor: '#E0E7EF', borderWidth: '1px' },
                    '&:hover fieldset': { borderColor: '#B8C8DA' },
                    '&.Mui-focused fieldset': { borderColor: '#3B82F6', borderWidth: '1.5px' },
                    '&.Mui-focused': { boxShadow: '0 0 0 3px rgba(59,130,246,0.1)' },
                  },
                  '& input': { py: '10.5px', px: '13px' },
                }}
              />
            </Box>

            <Box sx={{ mb: 4 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: '6px' }}>
                <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: '#3D4E63', letterSpacing: '0.1px' }}>
                  Contraseña
                </Typography>
                <Link to="/forgot-password" style={{ fontSize: 12, color: '#2563EB', textDecoration: 'none', fontWeight: 500 }}>
                  ¿Olvidaste tu contraseña?
                </Link>
              </Box>
              <TextField
                fullWidth
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                type={showPass ? 'text' : 'password'}
                required
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPass(p => !p)}
                        edge="end" size="small" tabIndex={-1}
                        sx={{ color: '#A0ADBF', mr: '-2px' }}
                      >
                        {showPass
                          ? <VisibilityOffIcon sx={{ fontSize: 17 }} />
                          : <VisibilityIcon sx={{ fontSize: 17 }} />
                        }
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '10px',
                    bgcolor: '#fff',
                    fontSize: 14,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                    '& fieldset': { borderColor: '#E0E7EF', borderWidth: '1px' },
                    '&:hover fieldset': { borderColor: '#B8C8DA' },
                    '&.Mui-focused fieldset': { borderColor: '#3B82F6', borderWidth: '1.5px' },
                    '&.Mui-focused': { boxShadow: '0 0 0 3px rgba(59,130,246,0.1)' },
                  },
                  '& input': { py: '10.5px', px: '13px' },
                }}
              />
            </Box>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              sx={{
                py: '11px',
                borderRadius: '10px',
                fontSize: 14,
                fontWeight: 700,
                letterSpacing: '0.1px',
                bgcolor: '#1B3B7A',
                boxShadow: '0 4px 14px rgba(27,59,122,0.3), 0 1px 3px rgba(0,0,0,0.1)',
                '&:hover': {
                  bgcolor: '#152F62',
                  boxShadow: '0 6px 20px rgba(27,59,122,0.4)',
                  transform: 'translateY(-1px)',
                },
                '&:active': { transform: 'translateY(0)', boxShadow: '0 2px 8px rgba(27,59,122,0.3)' },
                transition: 'all 0.18s ease',
              }}
            >
              {loading ? 'Ingresando...' : 'Ingresar'}
            </Button>
          </Box>

          <Box sx={{ mt: 5, pt: 4, borderTop: '1px solid #EDF1F7', textAlign: 'center' }}>
            <Typography sx={{ fontSize: 13.5, color: '#7B8EA8' }}>
              ¿No tenés cuenta?{' '}
              <Link to="/register" style={{
                color: '#2563EB', fontWeight: 700, textDecoration: 'none',
              }}>
                Registrate
              </Link>
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
