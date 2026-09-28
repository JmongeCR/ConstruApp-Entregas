import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Card, CardContent, Grid, Chip, Avatar,
  Rating, Button, Divider, Skeleton, Tooltip,
} from '@mui/material';
import ArrowBackIcon    from '@mui/icons-material/ArrowBack';
import VerifiedIcon     from '@mui/icons-material/Verified';
import LocationOnIcon   from '@mui/icons-material/LocationOn';
import WorkIcon         from '@mui/icons-material/Work';
import SendIcon         from '@mui/icons-material/Send';
import PhoneIcon        from '@mui/icons-material/Phone';
import LanguageIcon     from '@mui/icons-material/Language';
import InstagramIcon    from '@mui/icons-material/Instagram';
import StarIcon         from '@mui/icons-material/Star';
import CheckIcon        from '@mui/icons-material/Check';
import { perfilesConstructorApi } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';

const ACCENT = '#2563EB';
const AVATAR_PALETTE = ['#4F46E5','#0EA5E9','#10B981','#2563EB','#8B5CF6','#EC4899','#EF4444'];
const avatarBg = (name) => AVATAR_PALETTE[(name?.charCodeAt(0) ?? 0) % AVATAR_PALETTE.length];

function LoadingSkeleton() {
  return (
    <Box sx={{ maxWidth: 920, mx: 'auto' }}>
      <Skeleton variant="rounded" height={160} sx={{ borderRadius: 2, mb: 2 }} />
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Skeleton variant="rounded" height={200} sx={{ borderRadius: 2, mb: 2 }} />
          <Skeleton variant="rounded" height={120} sx={{ borderRadius: 2 }} />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Skeleton variant="rounded" height={140} sx={{ borderRadius: 2, mb: 2 }} />
          <Skeleton variant="rounded" height={120} sx={{ borderRadius: 2 }} />
        </Grid>
      </Grid>
    </Box>
  );
}

export default function PerfilConstructorPublico() {
  const { id }      = useParams();
  const navigate    = useNavigate();
  const { usuario } = useAuth();
  const esCliente   = usuario?.rol === 'Cliente';

  const [perfil, setPerfil]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    perfilesConstructorApi.getById(id)
      .then(r => setPerfil(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingSkeleton />;
  if (!perfil) return (
    <Box sx={{ textAlign: 'center', py: 10 }}>
      <Typography fontWeight={700} gutterBottom>Perfil no encontrado</Typography>
      <Typography color="text.secondary" fontSize={13} sx={{ mb: 3 }}>
        Este constructor no existe o no tiene perfil público.
      </Typography>
      <Button variant="outlined" onClick={() => navigate('/marketplace')}>
        Volver al Marketplace
      </Button>
    </Box>
  );

  const especialidades  = perfil.especialidades?.split(',').map(s => s.trim()).filter(Boolean) ?? [];
  const certificaciones = perfil.certificaciones?.split(',').map(s => s.trim()).filter(Boolean) ?? [];
  const bgColor = avatarBg(perfil.nombreEmpresa);

  return (
    <Box sx={{ maxWidth: 920, mx: 'auto' }}>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/marketplace')}
        sx={{ mb: 2.5, color: '#64748B', fontWeight: 600, fontSize: 13,
          '&:hover': { bgcolor: '#F1F5F9', color: '#0F172A' } }}>
        Volver al Marketplace
      </Button>

      {/* ── Cover card ─── */}
      <Card sx={{ mb: 3, borderRadius: 2, overflow: 'hidden', border: '1px solid #E2E8F0' }} elevation={0}>
        {/* Header strip */}
        <Box sx={{ height: 8, bgcolor: ACCENT }} />

        <CardContent sx={{ px: 3, pt: 3, pb: '24px !important' }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2.5, mb: 2, flexWrap: 'wrap' }}>
            <Avatar sx={{
              bgcolor: bgColor, width: 72, height: 72,
              fontSize: 26, fontWeight: 800, flexShrink: 0,
              border: '3px solid white', boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
            }}>
              {perfil.nombreEmpresa?.[0]?.toUpperCase()}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 200 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Typography variant="h5" fontWeight={800} color="text.primary">
                  {perfil.nombreEmpresa}
                </Typography>
                {perfil.verificado && (
                  <Tooltip title="Constructor verificado por ConstruApp">
                    <VerifiedIcon sx={{ color: ACCENT, fontSize: 20 }} />
                  </Tooltip>
                )}
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
                <Rating value={perfil.calificacionPromedio || 0} precision={0.5} size="small" readOnly />
                <Typography fontSize={13} fontWeight={700}>
                  {perfil.calificacionPromedio?.toFixed(1) || '—'}
                </Typography>
                <Typography fontSize={12} color="text.secondary">
                  · {perfil.totalProyectos ?? 0} proyectos completados
                </Typography>
              </Box>
              {perfil.verificado && (
                <Chip
                  icon={<VerifiedIcon sx={{ fontSize: '13px !important', color: `${ACCENT} !important` }} />}
                  label="Constructor verificado"
                  size="small"
                  sx={{ mt: 1, bgcolor: '#EFF6FF', color: ACCENT, fontWeight: 700, fontSize: 11,
                    border: `1px solid #BFDBFE` }}
                />
              )}
            </Box>

            {esCliente && (
              <Button variant="contained" startIcon={<SendIcon />}
                onClick={() => navigate('/marketplace')}
                sx={{ bgcolor: ACCENT, '&:hover': { bgcolor: '#1D4ED8' }, fontWeight: 700, whiteSpace: 'nowrap' }}>
                Ver proyectos
              </Button>
            )}
          </Box>

          <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
            {perfil.zonasCobertura && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <LocationOnIcon sx={{ fontSize: 15, color: '#64748B' }} />
                <Typography fontSize={13} color="text.secondary">{perfil.zonasCobertura}</Typography>
              </Box>
            )}
            {perfil.aniosExperiencia > 0 && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <WorkIcon sx={{ fontSize: 15, color: '#64748B' }} />
                <Typography fontSize={13} color="text.secondary">
                  {perfil.aniosExperiencia} años de experiencia
                </Typography>
              </Box>
            )}
            {perfil.calificacionPromedio > 0 && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <StarIcon sx={{ fontSize: 15, color: '#F59E0B' }} />
                <Typography fontSize={13} color="text.secondary" fontWeight={600}>
                  {perfil.calificacionPromedio?.toFixed(1)} promedio
                </Typography>
              </Box>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* ── Content grid ─── */}
      <Grid container spacing={3}>

        {/* Left column */}
        <Grid size={{ xs: 12, md: 8 }}>
          {perfil.bio && (
            <Card elevation={0} sx={{ mb: 3, border: '1px solid #E2E8F0', borderRadius: 2 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography fontWeight={700} fontSize={14} color="text.primary" mb={1.5}>
                  Sobre nosotros
                </Typography>
                <Typography fontSize={13.5} color="text.secondary" lineHeight={1.7}>
                  {perfil.bio}
                </Typography>
              </CardContent>
            </Card>
          )}

          {perfil.portafolioItems?.length > 0 && (
            <Card elevation={0} sx={{ mb: 3, border: '1px solid #E2E8F0', borderRadius: 2 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography fontWeight={700} fontSize={14} color="text.primary" mb={2}>
                  Portafolio de proyectos
                </Typography>
                <Grid container spacing={2}>
                  {perfil.portafolioItems.map(item => (
                    <Grid size={{ xs: 12, sm: 6 }} key={item.id}>
                      <Box sx={{ borderRadius: 1.5, overflow: 'hidden',
                        border: '1px solid #E2E8F0', transition: '.15s',
                        '&:hover': { boxShadow: '0 4px 14px rgba(0,0,0,0.08)' } }}>
                        {item.imagenUrl && (
                          <Box component="img" src={item.imagenUrl} alt={item.titulo}
                            sx={{ width: '100%', height: 170, objectFit: 'cover', display: 'block' }} />
                        )}
                        <Box sx={{ p: 1.5 }}>
                          <Typography fontSize={13} fontWeight={700}>{item.titulo}</Typography>
                          {item.descripcion && (
                            <Typography fontSize={12} color="text.secondary" mt={0.25}>{item.descripcion}</Typography>
                          )}
                        </Box>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          )}

          {certificaciones.length > 0 && (
            <Card elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 2 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography fontWeight={700} fontSize={14} color="text.primary" mb={1.5}>
                  Certificaciones y licencias
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {certificaciones.map(c => (
                    <Box key={c} sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                      <Box sx={{ width: 20, height: 20, borderRadius: '50%',
                        bgcolor: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0 }}>
                        <CheckIcon sx={{ fontSize: 12, color: '#166534' }} />
                      </Box>
                      <Typography fontSize={13} color="text.secondary">{c}</Typography>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          )}
        </Grid>

        {/* Right sidebar */}
        <Grid size={{ xs: 12, md: 4 }}>
          {/* Especialidades */}
          <Card elevation={0} sx={{ mb: 2.5, border: '1px solid #E2E8F0', borderRadius: 2 }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography fontWeight={700} fontSize={13} color="text.primary" mb={1.5}>
                Especialidades
              </Typography>
              {especialidades.length > 0 ? (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                  {especialidades.map(e => (
                    <Chip key={e} label={e} size="small"
                      sx={{ bgcolor: '#EFF6FF', color: '#1D4ED8', fontWeight: 600, fontSize: 11 }} />
                  ))}
                </Box>
              ) : (
                <Typography fontSize={13} color="text.disabled">No especificadas</Typography>
              )}
            </CardContent>
          </Card>

          {/* Stats */}
          <Card elevation={0} sx={{ mb: 2.5, border: '1px solid #E2E8F0', borderRadius: 2 }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography fontWeight={700} fontSize={12} color="text.secondary" mb={2}
                textTransform="uppercase" letterSpacing={0.5}>
                Estadísticas
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography fontSize={24} fontWeight={800} color="text.primary">
                    {perfil.totalProyectos ?? 0}
                  </Typography>
                  <Typography fontSize={12} color="text.secondary">Proyectos completados</Typography>
                </Box>
                <Divider />
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <StarIcon sx={{ color: '#F59E0B', fontSize: 20 }} />
                    <Typography fontSize={24} fontWeight={800} color="text.primary">
                      {perfil.calificacionPromedio?.toFixed(1) || '—'}
                    </Typography>
                  </Box>
                  <Typography fontSize={12} color="text.secondary">Calificación promedio</Typography>
                </Box>
                <Divider />
                <Box>
                  <Typography fontSize={24} fontWeight={800} color="text.primary">
                    {perfil.aniosExperiencia ?? '—'}
                  </Typography>
                  <Typography fontSize={12} color="text.secondary">Años de experiencia</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Contacto */}
          {(perfil.sitioWeb || perfil.instagram || perfil.telefono) && (
            <Card elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 2 }}>
              <CardContent sx={{ p: 2.5 }}>
                <Typography fontWeight={700} fontSize={13} color="text.primary" mb={1.5}>Contacto</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {perfil.telefono && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                      <PhoneIcon sx={{ fontSize: 16, color: '#64748B' }} />
                      <Typography fontSize={13} color="text.secondary">{perfil.telefono}</Typography>
                    </Box>
                  )}
                  {perfil.sitioWeb && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                      <LanguageIcon sx={{ fontSize: 16, color: '#64748B' }} />
                      <a href={perfil.sitioWeb} target="_blank" rel="noreferrer"
                        style={{ fontSize: 13, color: ACCENT, fontWeight: 600, textDecoration: 'none' }}>
                        {perfil.sitioWeb.replace(/^https?:\/\//, '')}
                      </a>
                    </Box>
                  )}
                  {perfil.instagram && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                      <InstagramIcon sx={{ fontSize: 16, color: '#64748B' }} />
                      <Typography fontSize={13} color="text.secondary">@{perfil.instagram.replace('@','')}</Typography>
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>
    </Box>
  );
}
