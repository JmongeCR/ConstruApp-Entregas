import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Box, TextField, Button, Typography, Alert,
} from '@mui/material';
import ConstructionIcon from '@mui/icons-material/Construction';
import { authApi } from '../../api/endpoints';

export default function ForgotPassword() {
  const [email, setEmail]   = useState('');
  const [sent, setSent]     = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authApi.forgotPassword({ email });
      setSent(true);
    } catch {
      setError('Ocurrió un error. Intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  };

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
          Recuperar contraseña
        </Typography>
        <Typography sx={{ color: '#7B8EA8', fontSize: 14, mb: 4 }}>
          Ingresá tu correo y te enviaremos un enlace para restablecer tu contraseña.
        </Typography>

        {sent ? (
          <Box>
            <Alert severity="success" sx={{ mb: 3, borderRadius: '10px' }}>
              Si el correo está registrado, recibirás un enlace en breve. Revisá tu bandeja de entrada.
            </Alert>
            <Link to="/login" style={{ display: 'block', textAlign: 'center', color: '#2563EB', fontWeight: 600, textDecoration: 'none', fontSize: 14 }}>
              ← Volver al inicio de sesión
            </Link>
          </Box>
        ) : (
          <Box component="form" onSubmit={handleSubmit}>
            {error && <Alert severity="error" sx={{ mb: 3, borderRadius: '10px', fontSize: 13 }}>{error}</Alert>}

            <Box sx={{ mb: 3 }}>
              <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: '#3D4E63', mb: '6px' }}>
                Correo electrónico
              </Typography>
              <TextField
                fullWidth
                placeholder="tu@email.com"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
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

            <Button type="submit" fullWidth variant="contained" disabled={loading}
              sx={{
                py: '11px', borderRadius: '10px', fontSize: 14, fontWeight: 700,
                bgcolor: '#1B3B7A',
                boxShadow: '0 4px 14px rgba(27,59,122,0.3)',
                '&:hover': { bgcolor: '#152F62', transform: 'translateY(-1px)' },
                transition: 'all 0.18s ease',
              }}>
              {loading ? 'Enviando…' : 'Enviar enlace'}
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
