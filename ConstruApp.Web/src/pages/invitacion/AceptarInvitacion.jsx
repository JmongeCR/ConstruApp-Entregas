import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Box, Typography, Button, CircularProgress, Chip, Alert,
} from '@mui/material';
import CheckCircleIcon  from '@mui/icons-material/CheckCircle';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import GroupsIcon       from '@mui/icons-material/Groups';
import LoginIcon        from '@mui/icons-material/Login';
import { useAuth }          from '../../context/AuthContext';
import { invitacionesApi }  from '../../api/endpoints';

const ROLES_WORKSPACE = {
  Administrador: { color: '#1D4ED8', bg: '#DBEAFE' },
  Supervisor:    { color: '#065F46', bg: '#D1FAE5' },
  Contador:      { color: '#6D28D9', bg: '#EDE9FE' },
  Dueño:         { color: '#92400E', bg: '#FEF3C7' },
};

export default function AceptarInvitacion() {
  const { token }       = useParams();
  const { usuario }     = useAuth();
  const navigate        = useNavigate();
  const [info,          setInfo]          = useState(null);
  const [loadingInfo,   setLoadingInfo]   = useState(true);
  const [infoError,     setInfoError]     = useState(null);
  const [aceptando,     setAceptando]     = useState(false);
  const [resultado,     setResultado]     = useState(null); // { ok, mensaje }

  useEffect(() => {
    invitacionesApi.getInfo(token)
      .then(r => setInfo(r.data))
      .catch(e => setInfoError(e?.response?.data?.error ?? 'No se pudo cargar la invitación.'))
      .finally(() => setLoadingInfo(false));
  }, [token]);

  const handleAceptar = async () => {
    setAceptando(true);
    try {
      const r = await invitacionesApi.aceptar(token);
      setResultado({ ok: true, mensaje: r.data.message, empresa: r.data.nombreEmpresa, rol: r.data.rol });
    } catch (e) {
      setResultado({ ok: false, mensaje: e?.response?.data?.error ?? 'Error al aceptar la invitación.' });
    } finally { setAceptando(false); }
  };

  const rolInfo = info ? (ROLES_WORKSPACE[info.rolWorkspace] ?? ROLES_WORKSPACE.Supervisor) : null;

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
          px: 4, py: 3,
          display: 'flex', alignItems: 'center', gap: 1.5,
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
              <Typography fontSize={13.5} color="text.secondary">Verificando invitación…</Typography>
            </Box>
          )}

          {/* Error al cargar */}
          {!loadingInfo && infoError && (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, py: 2 }}>
              <HighlightOffIcon sx={{ fontSize: 48, color: '#E2E8F0' }} />
              <Typography fontWeight={700} fontSize={16} textAlign="center">
                Invitación no válida
              </Typography>
              <Typography fontSize={13.5} color="text.secondary" textAlign="center">
                {infoError}
              </Typography>
              <Button variant="outlined" size="small" component={Link} to="/"
                sx={{ mt: 1, textTransform: 'none', fontWeight: 700 }}>
                Ir al inicio
              </Button>
            </Box>
          )}

          {/* Invitación expirada/cancelada */}
          {!loadingInfo && info && info.estado !== 'Pendiente' && !resultado && (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, py: 2 }}>
              <HighlightOffIcon sx={{ fontSize: 48, color: '#FCA5A5' }} />
              <Typography fontWeight={700} fontSize={16} textAlign="center">
                Invitación {info.estado === 'Expirada' ? 'expirada' : info.estado.toLowerCase()}
              </Typography>
              <Typography fontSize={13.5} color="text.secondary" textAlign="center">
                {info.estado === 'Expirada'
                  ? 'Esta invitación ya no es válida. Pedile al dueño de la empresa que te envíe una nueva.'
                  : 'Esta invitación fue cancelada por el dueño del workspace.'}
              </Typography>
            </Box>
          )}

          {/* Resultado de aceptar */}
          {resultado && (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2.5, py: 2 }}>
              {resultado.ok ? (
                <>
                  <CheckCircleIcon sx={{ fontSize: 56, color: '#22C55E' }} />
                  <Typography fontWeight={800} fontSize={18} textAlign="center" sx={{ color: '#0F172A' }}>
                    ¡Bienvenido al equipo!
                  </Typography>
                  <Typography fontSize={13.5} color="text.secondary" textAlign="center">
                    Ahora sos parte del workspace de <strong>{resultado.empresa}</strong> como <strong>{resultado.rol}</strong>.
                  </Typography>
                  <Button variant="contained" fullWidth
                    onClick={() => navigate('/')}
                    sx={{ bgcolor: '#0F172A', '&:hover': { bgcolor: '#1E293B' },
                      fontWeight: 700, textTransform: 'none', borderRadius: 2, mt: 1 }}>
                    Ir al dashboard →
                  </Button>
                </>
              ) : (
                <>
                  <HighlightOffIcon sx={{ fontSize: 48, color: '#FCA5A5' }} />
                  <Typography fontWeight={700} fontSize={15} textAlign="center">
                    No se pudo aceptar
                  </Typography>
                  <Alert severity="error" sx={{ width: '100%', fontSize: 12.5 }}>
                    {resultado.mensaje}
                  </Alert>
                </>
              )}
            </Box>
          )}

          {/* Invitación válida — pendiente */}
          {!loadingInfo && info && info.estado === 'Pendiente' && !resultado && (
            <>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, mb: 3 }}>
                <GroupsIcon sx={{ fontSize: 44, color: '#2563EB', mb: 0.5 }} />
                <Typography fontWeight={800} fontSize={18} textAlign="center" sx={{ color: '#0F172A' }}>
                  Invitación al workspace
                </Typography>
                <Typography fontSize={13.5} color="text.secondary" textAlign="center">
                  <strong>{info.invitadoPorNombre}</strong> te invitó a unirte al equipo de
                </Typography>
              </Box>

              {/* Detalles */}
              <Box sx={{ bgcolor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 2, p: 2.5, mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                  <Typography fontSize={12} color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.4 }}>
                    Empresa
                  </Typography>
                  <Typography fontWeight={700} fontSize={13.5}>{info.nombreEmpresa}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                  <Typography fontSize={12} color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.4 }}>
                    Tu rol
                  </Typography>
                  <Chip label={info.rolWorkspace} size="small"
                    sx={{ bgcolor: rolInfo?.bg, color: rolInfo?.color, fontWeight: 700, fontSize: 12, height: 24, borderRadius: 1.5 }} />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography fontSize={12} color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.4 }}>
                    Válida hasta
                  </Typography>
                  <Typography fontSize={13} fontWeight={600}>
                    {new Date(info.fechaExpiracion).toLocaleDateString('es-CR')}
                  </Typography>
                </Box>
              </Box>

              {/* Acciones */}
              {usuario ? (
                <>
                  <Typography fontSize={12.5} color="text.secondary" textAlign="center" sx={{ mb: 2 }}>
                    Sesión iniciada como <strong>{usuario.nombre}</strong> ({usuario.email})
                  </Typography>
                  <Button variant="contained" fullWidth
                    startIcon={<CheckCircleIcon />}
                    onClick={handleAceptar}
                    disabled={aceptando}
                    sx={{ bgcolor: '#16A34A', '&:hover': { bgcolor: '#15803D' },
                      fontWeight: 700, textTransform: 'none', borderRadius: 2, fontSize: 14 }}>
                    {aceptando ? 'Procesando…' : 'Aceptar invitación'}
                  </Button>
                  <Typography fontSize={11.5} color="text.disabled" textAlign="center" sx={{ mt: 1.5 }}>
                    ¿No es tu cuenta?{' '}
                    <Box component="span"
                      onClick={() => navigate(`/login?redirect=/invitacion/${token}`)}
                      sx={{ color: '#2563EB', cursor: 'pointer', textDecoration: 'underline' }}>
                      Cambiar sesión
                    </Box>
                  </Typography>
                </>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  <Typography fontSize={13} color="text.secondary" textAlign="center" sx={{ mb: 0.5 }}>
                    Necesitás una cuenta para aceptar la invitación.
                  </Typography>
                  <Button variant="contained" fullWidth
                    startIcon={<LoginIcon />}
                    onClick={() => navigate(`/login?redirect=/invitacion/${token}`)}
                    sx={{ bgcolor: '#2563EB', '&:hover': { bgcolor: '#1D4ED8' },
                      fontWeight: 700, textTransform: 'none', borderRadius: 2 }}>
                    Iniciar sesión
                  </Button>
                  <Button variant="outlined" fullWidth
                    onClick={() => navigate(`/register?redirect=/invitacion/${token}`)}
                    sx={{ fontWeight: 700, textTransform: 'none', borderRadius: 2,
                      borderColor: '#E2E8F0', color: '#64748B',
                      '&:hover': { borderColor: '#0F172A', color: '#0F172A' } }}>
                    Crear cuenta nueva
                  </Button>
                </Box>
              )}
            </>
          )}
        </Box>
      </Box>
    </Box>
  );
}
