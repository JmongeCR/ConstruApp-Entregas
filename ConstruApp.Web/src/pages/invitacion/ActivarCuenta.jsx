import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, CircularProgress, Chip, Alert, TextField,
} from '@mui/material';
import CheckCircleIcon  from '@mui/icons-material/CheckCircle';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import LockIcon         from '@mui/icons-material/Lock';
import { invitacionesApi } from '../../api/endpoints';

const ROLES_COLOR = {
  Administrador: { color: '#1D4ED8', bg: '#DBEAFE' },
  Supervisor:    { color: '#065F46', bg: '#D1FAE5' },
  Contador:      { color: '#6D28D9', bg: '#EDE9FE' },
  MaestroObra:   { color: '#0E7490', bg: '#CFFAFE' },
  Arquitecto:    { color: '#7C3AED', bg: '#EDE9FE' },
  Ingeniero:     { color: '#0369A1', bg: '#E0F2FE' },
  Dueño:         { color: '#92400E', bg: '#FEF3C7' },
};

export default function ActivarCuenta() {
  const { token }     = useParams();
  const navigate      = useNavigate();
  const [info,        setInfo]        = useState(null);
  const [loadingInfo, setLoadingInfo] = useState(true);
  const [infoError,   setInfoError]   = useState(null);

  const [password,     setPassword]     = useState('');
  const [confirmar,    setConfirmar]    = useState('');
  const [activando,    setActivando]    = useState(false);
  const [resultado,    setResultado]    = useState(null);
  const [formError,    setFormError]    = useState('');

  useEffect(() => {
    invitacionesApi.getActivarInfo(token)
      .then(r => setInfo(r.data))
      .catch(e => setInfoError(e?.response?.data?.error ?? 'No se pudo cargar la información.'))
      .finally(() => setLoadingInfo(false));
  }, [token]);

  const handleActivar = async () => {
    setFormError('');
    if (!password || password.length < 6) { setFormError('La contraseña debe tener al menos 6 caracteres.'); return; }
    if (password !== confirmar) { setFormError('Las contraseñas no coinciden.'); return; }

    setActivando(true);
    try {
      const r = await invitacionesApi.activar(token, { password, confirmarPassword: confirmar });
      setResultado({ ok: true, mensaje: r.data.message, email: r.data.email });
    } catch (e) {
      setResultado({ ok: false, mensaje: e?.response?.data?.error ?? 'Error al activar la cuenta.' });
    } finally { setActivando(false); }
  };

  const rolInfo = info ? (ROLES_COLOR[info.rolWorkspace] ?? ROLES_COLOR.Supervisor) : null;

  return (
    <Box sx={{
      minHeight: '100vh', bgcolor: '#F1F5F9',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      px: 2, py: 4,
    }}>
      <Box sx={{
        width: '100%', maxWidth: 440,
        bgcolor: 'white', borderRadius: 3,
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <Box sx={{
          background: 'linear-gradient(135deg, #0F1629 0%, #1E3A5F 100%)',
          px: 4, py: 3, display: 'flex', alignItems: 'center', gap: 1.5,
        }}>
          <Box sx={{ bgcolor: '#2563EB', borderRadius: 1.5, width: 32, height: 32,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
            🏗️
          </Box>
          <Typography fontWeight={800} fontSize={17} color="white">ConstruApp</Typography>
        </Box>

        <Box sx={{ px: 4, py: 4 }}>
          {/* Loading */}
          {loadingInfo && (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4, gap: 2 }}>
              <CircularProgress size={36} sx={{ color: '#2563EB' }} />
              <Typography fontSize={13.5} color="text.secondary">Verificando enlace…</Typography>
            </Box>
          )}

          {/* Error al cargar */}
          {!loadingInfo && infoError && (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, py: 2 }}>
              <HighlightOffIcon sx={{ fontSize: 48, color: '#FCA5A5' }} />
              <Typography fontWeight={700} fontSize={16} textAlign="center">Enlace no válido</Typography>
              <Typography fontSize={13.5} color="text.secondary" textAlign="center">{infoError}</Typography>
              <Button variant="outlined" size="small" onClick={() => navigate('/login')}
                sx={{ mt: 1, textTransform: 'none', fontWeight: 700 }}>
                Ir al login
              </Button>
            </Box>
          )}

          {/* Cuenta expirada o ya activada */}
          {!loadingInfo && info && info.estado !== 'Pendiente' && !resultado && (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, py: 2 }}>
              <HighlightOffIcon sx={{ fontSize: 48, color: '#FCA5A5' }} />
              <Typography fontWeight={700} fontSize={16} textAlign="center">
                {info.estado === 'Aceptada' ? 'Cuenta ya activada' : 'Enlace expirado'}
              </Typography>
              <Typography fontSize={13.5} color="text.secondary" textAlign="center">
                {info.estado === 'Aceptada'
                  ? 'Tu cuenta ya fue activada. Podés iniciar sesión directamente.'
                  : 'El enlace de activación venció. Contactá al administrador para que genere uno nuevo.'}
              </Typography>
              {info.estado === 'Aceptada' && (
                <Button variant="contained" size="small" onClick={() => navigate('/login')}
                  sx={{ bgcolor: '#2563EB', fontWeight: 700, textTransform: 'none', mt: 1 }}>
                  Ir al login →
                </Button>
              )}
            </Box>
          )}

          {/* Resultado de activar */}
          {resultado && (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2.5, py: 2 }}>
              {resultado.ok ? (
                <>
                  <CheckCircleIcon sx={{ fontSize: 56, color: '#22C55E' }} />
                  <Typography fontWeight={800} fontSize={18} textAlign="center" sx={{ color: '#0F172A' }}>
                    ¡Cuenta activada!
                  </Typography>
                  <Typography fontSize={13.5} color="text.secondary" textAlign="center">
                    {resultado.mensaje}
                  </Typography>
                  <Box sx={{ bgcolor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 2, p: 2, width: '100%' }}>
                    <Typography fontSize={12} color="text.secondary" fontWeight={600} sx={{ mb: 0.3 }}>Email de acceso</Typography>
                    <Typography fontSize={13.5} fontWeight={700}>{resultado.email}</Typography>
                  </Box>
                  <Button variant="contained" fullWidth onClick={() => navigate('/login')}
                    sx={{ bgcolor: '#0F172A', '&:hover': { bgcolor: '#1E293B' },
                      fontWeight: 700, textTransform: 'none', borderRadius: 2, mt: 0.5 }}>
                    Iniciar sesión →
                  </Button>
                </>
              ) : (
                <>
                  <HighlightOffIcon sx={{ fontSize: 48, color: '#FCA5A5' }} />
                  <Typography fontWeight={700} fontSize={15} textAlign="center">No se pudo activar</Typography>
                  <Alert severity="error" sx={{ width: '100%', fontSize: 12.5 }}>{resultado.mensaje}</Alert>
                  <Button variant="outlined" size="small" onClick={() => { setResultado(null); setPassword(''); setConfirmar(''); }}
                    sx={{ fontWeight: 700, textTransform: 'none' }}>
                    Intentar de nuevo
                  </Button>
                </>
              )}
            </Box>
          )}

          {/* Formulario de activación */}
          {!loadingInfo && info && info.estado === 'Pendiente' && !resultado && (
            <>
              <Box sx={{ mb: 3, textAlign: 'center' }}>
                <LockIcon sx={{ fontSize: 40, color: '#2563EB', mb: 1 }} />
                <Typography fontWeight={800} fontSize={18} sx={{ color: '#0F172A', mb: 0.5 }}>
                  Definí tu contraseña
                </Typography>
                <Typography fontSize={13} color="text.secondary">
                  Fuiste agregado al equipo de <strong>{info.nombreEmpresa}</strong>
                </Typography>
              </Box>

              <Box sx={{ bgcolor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 2, p: 2, mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography fontSize={12} color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.4 }}>
                    Email de acceso
                  </Typography>
                  <Typography fontWeight={700} fontSize={13}>{info.email}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography fontSize={12} color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.4 }}>
                    Tu rol
                  </Typography>
                  <Chip label={info.rolWorkspace} size="small"
                    sx={{ bgcolor: rolInfo?.bg, color: rolInfo?.color, fontWeight: 700, fontSize: 12, height: 24, borderRadius: 1.5 }} />
                </Box>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField label="Nueva contraseña" type="password" size="small" fullWidth
                  value={password} onChange={e => setPassword(e.target.value)}
                  helperText="Mínimo 6 caracteres" />
                <TextField label="Confirmar contraseña" type="password" size="small" fullWidth
                  value={confirmar} onChange={e => setConfirmar(e.target.value)} />

                {formError && (
                  <Alert severity="error" sx={{ fontSize: 12.5 }}>{formError}</Alert>
                )}

                <Button variant="contained" fullWidth
                  onClick={handleActivar}
                  disabled={activando || !password || !confirmar}
                  sx={{ bgcolor: '#16A34A', '&:hover': { bgcolor: '#15803D' },
                    fontWeight: 700, textTransform: 'none', borderRadius: 2, fontSize: 14, mt: 0.5 }}>
                  {activando ? 'Activando…' : 'Activar mi cuenta →'}
                </Button>
              </Box>
            </>
          )}
        </Box>
      </Box>
    </Box>
  );
}
