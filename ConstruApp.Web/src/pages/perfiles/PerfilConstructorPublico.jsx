import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Grid, Chip, Avatar, Rating,
  Button, Divider, Skeleton, Dialog, DialogTitle,
  DialogContent, DialogActions,
} from '@mui/material';
import ArrowBackIcon  from '@mui/icons-material/ArrowBack';
import VerifiedIcon   from '@mui/icons-material/Verified';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import WorkIcon       from '@mui/icons-material/Work';
import PhoneIcon      from '@mui/icons-material/Phone';
import EmailIcon      from '@mui/icons-material/Email';
import LanguageIcon   from '@mui/icons-material/Language';
import InstagramIcon  from '@mui/icons-material/Instagram';
import CheckIcon      from '@mui/icons-material/Check';
import BusinessIcon   from '@mui/icons-material/Business';
import { perfilesConstructorApi } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';

const AVATAR_PALETTE = ['#4F46E5','#0EA5E9','#10B981','#2563EB','#8B5CF6','#EC4899','#EF4444'];
const avatarBg = (name) => AVATAR_PALETTE[(name?.charCodeAt(0) ?? 0) % AVATAR_PALETTE.length];

const SECTION = ({ title, children }) => (
  <Box sx={{ mb: 3 }}>
    <Typography fontSize={11.5} fontWeight={600} color="text.secondary"
      sx={{ textTransform: 'uppercase', letterSpacing: '0.06em', mb: 1.5 }}>
      {title}
    </Typography>
    {children}
  </Box>
);

function InvitarModal({ perfil, open, onClose }) {
  if (!perfil) return null;
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, fontSize: 15, pb: 1 }}>
        Invitar a presentar propuesta
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ pt: 2.5 }}>
        <Typography fontSize={13} color="text.secondary" mb={2}>
          Contactá directamente a <strong>{perfil.nombreEmpresa}</strong> para invitarla a cotizar tu proyecto:
        </Typography>
        {perfil.telefono && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.25 }}>
            <PhoneIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
            <Typography fontSize={13.5} fontWeight={600}>{perfil.telefono}</Typography>
          </Box>
        )}
        {perfil.emailContacto && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.25 }}>
            <EmailIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
            <Typography fontSize={13.5} fontWeight={600}>{perfil.emailContacto}</Typography>
          </Box>
        )}
        {!perfil.telefono && !perfil.emailContacto && (
          <Typography fontSize={13} color="text.disabled">
            Esta empresa no ha publicado datos de contacto aún.
          </Typography>
        )}
      </DialogContent>
      <Divider />
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} color="inherit" size="small">Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
}

export default function PerfilConstructorPublico() {
  const { id }      = useParams();
  const navigate    = useNavigate();
  const { usuario } = useAuth();
  const esCliente   = usuario?.rol === 'Cliente';

  const [perfil,  setPerfil]  = useState(null);
  const [loading, setLoading] = useState(true);
  const [invitar, setInvitar] = useState(false);

  useEffect(() => {
    perfilesConstructorApi.getById(id)
      .then(r => setPerfil(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <Box sx={{ maxWidth: 920, mx: 'auto' }}>
      <Skeleton width={160} height={28} sx={{ mb: 2 }} />
      <Skeleton variant="rounded" height={120} sx={{ mb: 2 }} />
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Skeleton variant="rounded" height={140} sx={{ mb: 2 }} />
          <Skeleton variant="rounded" height={100} />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Skeleton variant="rounded" height={120} sx={{ mb: 2 }} />
          <Skeleton variant="rounded" height={100} />
        </Grid>
      </Grid>
    </Box>
  );

  if (!perfil) return (
    <Box sx={{ textAlign: 'center', py: 10 }}>
      <BusinessIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1.5 }} />
      <Typography fontWeight={700} fontSize={15} gutterBottom>Perfil no encontrado</Typography>
      <Typography color="text.secondary" fontSize={13} mb={3}>
        Esta constructora no existe o no tiene perfil público.
      </Typography>
      <Button variant="outlined" size="small" onClick={() => navigate('/marketplace')}>
        Volver al Directorio
      </Button>
    </Box>
  );

  const especialidades  = perfil.especialidades?.split(/[,;]+/).map(s => s.trim()).filter(Boolean) ?? [];
  const certificaciones = perfil.certificaciones?.split(/[,;]+/).map(s => s.trim()).filter(Boolean) ?? [];

  return (
    <Box sx={{ maxWidth: 920, mx: 'auto' }}>
      {/* Back */}
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/marketplace')} size="small"
        sx={{ mb: 2.5, color: 'text.secondary', fontWeight: 500, fontSize: 13,
          '&:hover': { bgcolor: '#F1F5F9', color: 'text.primary' } }}>
        Directorio de Constructoras
      </Button>

      {/* ── Header ────────────────────────────────────────────────────── */}
      <Box sx={{
        display: 'flex', alignItems: 'flex-start', gap: 2.5, flexWrap: 'wrap',
        p: { xs: 2.5, sm: 3 }, mb: 3,
        border: '1px solid', borderColor: 'divider', borderRadius: 1,
        bgcolor: 'background.paper',
      }}>
        <Avatar sx={{
          bgcolor: avatarBg(perfil.nombreEmpresa),
          width: { xs: 56, sm: 68 }, height: { xs: 56, sm: 68 },
          fontSize: { xs: 22, sm: 26 }, fontWeight: 700, flexShrink: 0,
        }}>
          {perfil.nombreEmpresa?.[0]?.toUpperCase()}
        </Avatar>

        <Box sx={{ flex: 1, minWidth: 180 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 0.5 }}>
            <Typography fontWeight={700} fontSize={{ xs: 18, sm: 21 }} lineHeight={1.2}>
              {perfil.nombreEmpresa}
            </Typography>
            {perfil.verificado && (
              <Chip
                icon={<VerifiedIcon style={{ fontSize: 12 }} />}
                label="Verificada" size="small"
                sx={{ fontSize: 11, height: 20, bgcolor: '#F0FDF4', color: '#16A34A', border: '1px solid #BBF7D0' }}
              />
            )}
          </Box>

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 0.75 }}>
            {(perfil.canton || perfil.provincia) && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <LocationOnIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
                <Typography fontSize={13} color="text.secondary">
                  {[perfil.canton, perfil.provincia].filter(Boolean).join(', ')}
                </Typography>
              </Box>
            )}
            {perfil.aniosExperiencia > 0 && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <WorkIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
                <Typography fontSize={13} color="text.secondary">
                  {perfil.aniosExperiencia} años de experiencia
                </Typography>
              </Box>
            )}
            {perfil.calificacionPromedio > 0 && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Rating value={perfil.calificacionPromedio} precision={0.5} size="small" readOnly
                  sx={{ fontSize: 14 }} />
                <Typography fontSize={13} fontWeight={600}>{perfil.calificacionPromedio?.toFixed(1)}</Typography>
                {perfil.totalProyectos > 0 && (
                  <Typography fontSize={12} color="text.secondary">
                    · {perfil.totalProyectos} proy.
                  </Typography>
                )}
              </Box>
            )}
          </Box>
        </Box>

        {esCliente && (
          <Button variant="contained" size="small" onClick={() => setInvitar(true)}
            sx={{ flexShrink: 0, fontWeight: 600, boxShadow: 'none', alignSelf: { xs: 'flex-start', sm: 'center' } }}>
            Invitar a cotizar
          </Button>
        )}
      </Box>

      {/* ── Contenido ─────────────────────────────────────────────────── */}
      <Grid container spacing={3}>

        {/* Columna principal */}
        <Grid size={{ xs: 12, md: 8 }}>
          {perfil.bio && (
            <Box sx={{ mb: 3, p: 2.5, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
              <SECTION title="Sobre la empresa">
                <Typography fontSize={13.5} color="text.secondary" lineHeight={1.75}>
                  {perfil.bio}
                </Typography>
              </SECTION>
            </Box>
          )}

          {perfil.portafolioItems?.length > 0 && (
            <Box sx={{ mb: 3, p: 2.5, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
              <SECTION title="Portafolio">
                <Grid container spacing={1.5}>
                  {perfil.portafolioItems.map(item => (
                    <Grid size={{ xs: 12, sm: 6 }} key={item.id}>
                      <Box sx={{ borderRadius: 1, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
                        {item.imagenUrl && (
                          <Box component="img" src={item.imagenUrl} alt={item.titulo}
                            sx={{ width: '100%', height: 150, objectFit: 'cover', display: 'block' }} />
                        )}
                        <Box sx={{ p: 1.5 }}>
                          <Typography fontSize={13} fontWeight={600}>{item.titulo}</Typography>
                          {item.descripcion && (
                            <Typography fontSize={12} color="text.secondary" mt={0.25}>{item.descripcion}</Typography>
                          )}
                        </Box>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </SECTION>
            </Box>
          )}

          {certificaciones.length > 0 && (
            <Box sx={{ mb: 3, p: 2.5, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
              <SECTION title="Certificaciones y licencias">
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {certificaciones.map(c => (
                    <Box key={c} sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                      <CheckIcon sx={{ fontSize: 14, color: '#16A34A' }} />
                      <Typography fontSize={13} color="text.secondary">{c}</Typography>
                    </Box>
                  ))}
                </Box>
              </SECTION>
            </Box>
          )}

          {perfil.calificaciones?.length > 0 && (
            <Box sx={{ p: 2.5, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
              <SECTION title="Calificaciones">
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {perfil.calificaciones.map((cal, i) => (
                    <Box key={i}>
                      {i > 0 && <Divider sx={{ mb: 2 }} />}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Rating value={cal.puntuacion} size="small" readOnly sx={{ fontSize: 14 }} />
                        <Typography fontSize={12.5} fontWeight={600}>{cal.puntuacion?.toFixed(1)}</Typography>
                      </Box>
                      {cal.comentario && (
                        <Typography fontSize={13} color="text.secondary" lineHeight={1.6}>
                          {cal.comentario}
                        </Typography>
                      )}
                      {cal.nombreCliente && (
                        <Typography fontSize={11.5} color="text.disabled" mt={0.5}>
                          — {cal.nombreCliente}
                        </Typography>
                      )}
                    </Box>
                  ))}
                </Box>
              </SECTION>
            </Box>
          )}
        </Grid>

        {/* Sidebar */}
        <Grid size={{ xs: 12, md: 4 }}>
          {especialidades.length > 0 && (
            <Box sx={{ mb: 2.5, p: 2.5, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
              <SECTION title="Especialidades">
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                  {especialidades.map(e => (
                    <Chip key={e} label={e} size="small"
                      sx={{ fontSize: 11.5, bgcolor: '#F1F5F9', color: '#475569' }} />
                  ))}
                </Box>
              </SECTION>
            </Box>
          )}

          {(perfil.telefono || perfil.emailContacto || perfil.sitioWeb || perfil.instagram) && (
            <Box sx={{ mb: 2.5, p: 2.5, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
              <SECTION title="Información de contacto">
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                  {perfil.telefono && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                      <PhoneIcon sx={{ fontSize: 15, color: 'text.disabled' }} />
                      <Typography fontSize={13}>{perfil.telefono}</Typography>
                    </Box>
                  )}
                  {perfil.emailContacto && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                      <EmailIcon sx={{ fontSize: 15, color: 'text.disabled' }} />
                      <Typography fontSize={13}>{perfil.emailContacto}</Typography>
                    </Box>
                  )}
                  {perfil.sitioWeb && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                      <LanguageIcon sx={{ fontSize: 15, color: 'text.disabled' }} />
                      <a href={perfil.sitioWeb} target="_blank" rel="noreferrer"
                        style={{ fontSize: 13, color: '#2563EB', textDecoration: 'none' }}>
                        {perfil.sitioWeb.replace(/^https?:\/\//, '')}
                      </a>
                    </Box>
                  )}
                  {perfil.instagram && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                      <InstagramIcon sx={{ fontSize: 15, color: 'text.disabled' }} />
                      <Typography fontSize={13}>@{perfil.instagram.replace('@', '')}</Typography>
                    </Box>
                  )}
                </Box>
              </SECTION>
            </Box>
          )}

          {(perfil.totalProyectos > 0 || perfil.aniosExperiencia > 0 || perfil.cantidadColaboradores > 0) && (
            <Box sx={{ p: 2.5, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
              <SECTION title="Datos de la empresa">
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {perfil.totalProyectos > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography fontSize={13} color="text.secondary">Proyectos completados</Typography>
                      <Typography fontSize={13} fontWeight={600}>{perfil.totalProyectos}</Typography>
                    </Box>
                  )}
                  {perfil.aniosExperiencia > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography fontSize={13} color="text.secondary">Años de experiencia</Typography>
                      <Typography fontSize={13} fontWeight={600}>{perfil.aniosExperiencia}</Typography>
                    </Box>
                  )}
                  {perfil.cantidadColaboradores > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography fontSize={13} color="text.secondary">Colaboradores</Typography>
                      <Typography fontSize={13} fontWeight={600}>{perfil.cantidadColaboradores}</Typography>
                    </Box>
                  )}
                </Box>
              </SECTION>
            </Box>
          )}
        </Grid>
      </Grid>

      <InvitarModal perfil={perfil} open={invitar} onClose={() => setInvitar(false)} />
    </Box>
  );
}
