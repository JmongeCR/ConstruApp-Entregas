import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  Box, TextField, Button, Typography, Alert, InputAdornment, IconButton,
} from '@mui/material';
import VisibilityIcon    from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import ConstructionIcon  from '@mui/icons-material/Construction';
import { authApi } from '../../api/endpoints';

export default function ResetPassword() {
  const [searchParams]      = useSearchParams();
  const navigate             = useNavigate();
  const email                = searchParams.get('email') || '';
  const token                = searchParams.get('token') || '';

  const [form, setForm]      = useState({ nueva: '', confirmar: '' });
  const [showNew, setShowNew] = useState(false);
  const [showConf, setShowConf] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]    = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.nueva !== form.confirmar) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    if (!email || !token) {
      setError('El enlace es inválido o ha expirado.');
      return;
    }
    setLoading(true);
    try {
      await authApi.resetPassword({ email, token, nuevaContrasena: form.nueva });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'El enlace expiró o ya fue usado. Solicitá uno nuevo.');
    } finally {
      setLoading(false);
    }
  };

  if (!email || !token) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#FAFBFD', p: 3 }}>
        <Box sx={{ maxWidth: 380, textAlign: 'center' }}>
          <Alert severity="error" sx={{ mb: 3, borderRadius: '10px' }}>
            Enlace inválido o expirado. Solicitá uno nuevo.
          </Alert>
          <Link to="/forgot-password" style={{ color: '#2563EB', fontWeight: 600, textDecoration: 'none', fontSize: 14 }}>
            Solicitar enlace nuevo
          </Link>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      bgcolor: '#FAFBFD',
      p: 3,
    }}>
      <Box sx={{ width: '100%', maxWidth: 380 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 4 }}>
          <Box sx={{ bgcolor: '#F59E0B', borderRadius: '10px', width: 36, height: 36,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(245,158,11,0.4)' }}>
            <ConstructionIcon sx={{ color: '#fff', fontSize: 20 }} />
          </Box>
          <Typography sx={{ fontWeight: 800, fontSize: 18, color: '#0F172A' }}>ConstruApp</Typography>
        </Box>

        <Typography sx={{ fontWeight: 800, fontSize: 24, color: '#0D1321', letterSpacing: '-0.5px', mb: 0.75 }}>
          Nueva contraseña
        </Typography>
        <Typography sx={{ color: '#7B8EA8', fontSize: 14, mb: 4 }}>
          Ingresá tu nueva contraseña para <strong>{email}</strong>.
        </Typography>

        {success ? (
          <Box>
            <Alert severity="success" sx={{ mb: 3, borderRadius: '10px' }}>
              Contraseña restablecida correctamente. Redirigiendo al inicio de sesión…
            </Alert>
          </Box>
        ) : (
          <Box component="form" onSubmit={handleSubmit}>
            {error && <Alert severity="error" sx={{ mb: 3, borderRadius: '10px', fontSize: 13 }}>{error}</Alert>}

            {[
              { label: 'Nueva contraseña', key: 'nueva', show: showNew, toggle: () => setShowNew(p => !p) },
              { label: 'Confirmar contraseña', key: 'confirmar', show: showConf, toggle: () => setShowConf(p => !p) },
            ].map(({ label, key, show, toggle }) => (
              <Box key={key} sx={{ mb: 2.5 }}>
                <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: '#3D4E63', mb: '6px' }}>
                  {label}
                </Typography>
                <TextField
                  fullWidth
                  placeholder="••••••••"
                  type={show ? 'text' : 'password'}
                  value={form[key]}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  required
                  helperText={key === 'nueva' ? 'Mín. 6 caracteres, 1 mayúscula, 1 número' : undefined}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={toggle} edge="end" size="small" tabIndex={-1}
                          sx={{ color: '#A0ADBF', mr: '-2px' }}>
                          {show ? <VisibilityOffIcon sx={{ fontSize: 17 }} /> : <VisibilityIcon sx={{ fontSize: 17 }} />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '10px', bgcolor: '#fff', fontSize: 14,
                      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                      '& fieldset': { borderColor: '#E0E7EF' },
                      '&:hover fieldset': { borderColor: '#B8C8DA' },
                      '&.Mui-focused fieldset': { borderColor: '#3B82F6', borderWidth: '1.5px' },
                    },
                    '& input': { py: '10.5px', px: '13px' },
                  }}
                />
              </Box>
            ))}

            <Button type="submit" fullWidth variant="contained" disabled={loading}
              sx={{
                mt: 1.5, py: '11px', borderRadius: '10px', fontSize: 14, fontWeight: 700,
                bgcolor: '#1B3B7A',
                boxShadow: '0 4px 14px rgba(27,59,122,0.3)',
                '&:hover': { bgcolor: '#152F62', transform: 'translateY(-1px)' },
                transition: 'all 0.18s ease',
              }}>
              {loading ? 'Guardando…' : 'Restablecer contraseña'}
            </Button>

            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Link to="/login" style={{ color: '#7B8EA8', fontSize: 13.5, textDecoration: 'none' }}>
                ← Volver al inicio de sesión
              </Link>
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
}
