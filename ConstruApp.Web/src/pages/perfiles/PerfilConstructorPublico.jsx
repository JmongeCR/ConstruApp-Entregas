import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Box, Typography, Grid, Chip, Avatar, Rating,
  Button, Divider, Skeleton, Dialog, DialogTitle,
  DialogContent, DialogActions, Alert,
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
import AssignmentIcon from '@mui/icons-material/Assignment';
import { perfilesConstructorApi } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';

const AVATAR_PALETTE = ['#4F46E5','#0EA5E9','#10B981','#2563EB','#8B5CF6','#EC4899','#EF4444'];
const avatarBg = (name) => AVATAR_PALETTE[(name?.charCodeAt(0) ?? 0) % AVATAR_PALETTE.length];

const TIPO_LABEL = {
  Remodelacion:'Remodelación', ObraGris:'Obra gris',
  ElectricoPlomeria:'Eléctrico / Plomería', Pintura:'Pintura',
  Pisos:'Pisos', Techos:'Techos', PiscinaJardin:'Piscina / Jardín', Otro:'Otro',
};

/* ── Sección con título ──────────────────────────────────────────────────── */
function Section({ title, children }) {
  return (
    <Box sx={{ mb: 2.5, p: 2.5, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
      <Typography fontSize={11} fontWeight={700} color="text.secondary"
        sx={{ textTransform: 'uppercase', letterSpacing: '0.07em', mb: 1.5 }}>
        {title}
      </Typography>
      {children}
    </Box>
  );
}

/* ── Modal Solicitar propuesta ───────────────────────────────────────────── */
function SolicitarPropuestaModal({ perfil, proyectoTitulo, open, onClose }) {
  if (!perfil) return null;
  const tieneContacto = perfil.telefono || perfil.emailContacto;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, fontSize: 15, pb: 1 }}>
        Solicitar propuesta
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ pt: 2.5 }}>
        {proyectoTitulo && (
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 2,
            p: 1.5, bgcolor: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 1 }}>
            <AssignmentIcon sx={{ fontSize: 15, color: '#2563EB', mt: 0.15, flexShrink: 0 }} />
            <Box>
              <Typography fontSize={11.5} color="#1E40AF" fontWeight={600}>Proyecto seleccionado</Typography>
              <Typography fontSize={13} color="#1D4ED8">{proyectoTitulo}</Typography>
            </Box>
          </Box>
        )}

        <Typography fontSize={13} color="text.secondary" mb={2} lineHeight={1.6}>
          Contactá a <strong>{perfil.nombreEmpresa}</strong> para que revise tu proyecto y presente una propuesta formal:
        </Typography>

        {tieneContacto ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {perfil.telefono && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <PhoneIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
                <Box>
                  <Typography fontSize={11.5} color="text.secondary">Teléfono</Typography>
                  <Typography fontSize={14} fontWeight={600}>{perfil.telefono}</Typography>
                </Box>
              </Box>
            )}
            {perfil.emailContacto && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <EmailIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
                <Box>
                  <Typography fontSize={11.5} color="text.secondary">Correo</Typography>
                  <Typography fontSize={13.5} fontWeight={600}>{perfil.emailContacto}</Typography>
                </Box>
              </Box>
            )}
          </Box>
        ) : (
          <Alert severity="info" sx={{ fontSize: 12.5 }}>
            Esta empresa aún no ha publicado datos de contacto.
          </Alert>
        )}
      </DialogContent>
      <Divider />
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} color="inherit" size="small">Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   PERFIL PÚBLICO DE CONSTRUCTORA
══════════════════════════════════════════════════════════════════════════ */
export default function PerfilConstructorPublico() {
  const { id }      = useParams();
  const navigate    = useNavigate();
  const location    = useLocation();
  const { usuario } = useAuth();

  /* Contexto del proyecto (viene desde el directorio via navigate state) */
  const { proyectoTitulo, proyectoTipo } = location.state ?? {};

  const esCliente = usuario?.rol === 'Cliente';

  const [perfil,  setPerfil]  = useState(null);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(false);

  useEffect(() => {
    perfilesConstructorApi.getById(id)
      .then(r => setPerfil(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  /* ── Loading ───────────────────────────────────────────────────────── */
  if (loading) return (
    <Box sx={{ maxWidth: 920, mx: 'auto' }}>
      <Skeleton width={160} height={28} sx={{ mb: 2 }} />
      <Skeleton variant="rounded" height={120} sx={{ mb: 2 }} />
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Skeleton variant="rounded" height={160} sx={{ mb: 2 }} />
          <Skeleton variant="rounded" height={100} />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Skeleton variant="rounded" height={140} sx={{ mb: 2 }} />
          <Skeleton variant="rounded" height={110} />
        </Grid>
      </Grid>
    </Box>
  );

  /* ── Not found ─────────────────────────────────────────────────────── */
  if (!perfil) return (
    <Box sx={{ textAlign: 'center', py: 10 }}>
      <BusinessIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1.5 }} />
      <Typography fontWeight={700} fontSize={15} gutterBottom>Perfil no encontrado</Typography>
      <Typography color="text.secondary" fontSize={13} mb={3}>
        Esta constructora no existe o no tiene perfil público.
      </Typography>
      <Button variant="outlined" size="small" onClick={() => navigate('/marketplace')}>
        Volver al directorio
      </Button>
    </Box>
  );

  const especialidades  = perfil.especialidades?.split(/[,;]+/).map(s => s.trim()).filter(Boolean) ?? [];
  const certificaciones = perfil.certificaciones?.split(/[,;]+/).map(s => s.trim()).filter(Boolean) ?? [];

  return (
    <Box sx={{ maxWidth: 920, mx: 'auto' }}>
      {/* ── Back ──────────────────────────────────────────────────────── */}
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/marketplace')} size="small"
        sx={{ mb: 2, color: 'text.secondary', fontSize: 13,
          '&:hover': { bgcolor: '#F1F5F9', color: 'text.primary' } }}>
        Directorio de Constructoras
      </Button>

      {/* ── Contexto del proyecto ─────────────────────────────────────── */}
      {proyectoTitulo && (
        <Box sx={{
          display: 'flex', alignItems: 'center', gap: 1.25, px: 1.75, py: 1, mb: 2,
          bgcolor: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 1,
        }}>
          <AssignmentIcon sx={{ fontSize: 14, color: '#2563EB' }} />
          <Typography fontSize={12.5} color="#1E40AF">
            Revisando para: <strong>{proyectoTitulo}</strong>
            {proyectoTipo && <Typography component="span" fontSize={12} color="#3B82F6"> · {TIPO_LABEL[proyectoTipo] || proyectoTipo}</Typography>}
          </Typography>
        </Box>
      )}

      {/* ── Header ────────────────────────────────────────────────────── */}
      <Box sx={{
        p: { xs: 2.5, sm: 3 }, mb: 3,
        border: '1px solid', borderColor: 'divider', borderRadius: 1,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2.5, flexWrap: 'wrap' }}>
          <Avatar sx={{
            bgcolor: avatarBg(perfil.nombreEmpresa),
            width: { xs: 52, sm: 64 }, height: { xs: 52, sm: 64 },
            fontSize: { xs: 20, sm: 24 }, fontWeight: 700, flexShrink: 0,
          }}>
            {perfil.nombreEmpresa?.[0]?.toUpperCase()}
          </Avatar>

          <Box sx={{ flex: 1, minWidth: 180 }}>
            {/* Nombre + verificada */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 0.75 }}>
              <Typography fontWeight={700} fontSize={{ xs: 17, sm: 20 }} lineHeight={1.2}>
                {perfil.nombreEmpresa}
              </Typography>
              {perfil.verificado && (
                <Chip icon={<VerifiedIcon style={{ fontSize: 12 }} />}
                  label="Verificada" size="small"
                  sx={{ fontSize: 11, height: 20, bgcolor: '#F0FDF4', color: '#16A34A', border: '1px solid #BBF7D0' }} />
              )}
            </Box>

            {/* Especialidades — primera línea de decisión */}
            {especialidades.length > 0 && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                {especialidades.map(e => (
                  <Chip key={e} label={e} size="small"
                    sx={{ fontSize: 11.5, bgcolor: '#F1F5F9', color: '#334155' }} />
                ))}
              </Box>
            )}

            {/* Meta: ubicación + experiencia + rating */}
            <Box sx={{ display: 'flex', gap: 2.5, flexWrap: 'wrap' }}>
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
                  <Rating value={perfil.calificacionPromedio} precision={0.5} size="small" readOnly sx={{ fontSize: 14 }} />
                  <Typography fontSize={13} fontWeight={600}>{perfil.calificacionPromedio?.toFixed(1)}</Typography>
                  {perfil.totalProyectos > 0 && (
                    <Typography fontSize={12} color="text.secondary">· {perfil.totalProyectos} proy.</Typography>
                  )}
                </Box>
              )}
            </Box>
          </Box>

          {/* CTA — única acción principal */}
          {esCliente && (
            <Button variant="contained" size="small" onClick={() => setModal(true)}
              sx={{ flexShrink: 0, fontWeight: 600, boxShadow: 'none', alignSelf: { xs: 'flex-start', sm: 'center' } }}>
              Solicitar propuesta
            </Button>
          )}
        </Box>
      </Box>

      {/* ── Contenido ─────────────────────────────────────────────────── */}
      <Grid container spacing={3}>

        {/* Columna principal — evidencia y decisión */}
        <Grid size={{ xs: 12, md: 8 }}>

          {/* Portafolio primero — evidencia visual más rápida */}
          {perfil.portafolioItems?.length > 0 && (
            <Section title="Portafolio">
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
            </Section>
          )}

          {/* Descripción */}
          {perfil.bio && (
            <Section title="Sobre la empresa">
              <Typography fontSize={13.5} color="text.secondary" lineHeight={1.75}>
                {perfil.bio}
              </Typography>
            </Section>
          )}

          {/* Certificaciones */}
          {certificaciones.length > 0 && (
            <Section title="Certificaciones y licencias">
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {certificaciones.map(c => (
                  <Box key={c} sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                    <CheckIcon sx={{ fontSize: 14, color: '#16A34A' }} />
                    <Typography fontSize={13} color="text.secondary">{c}</Typography>
                  </Box>
                ))}
              </Box>
            </Section>
          )}

          {/* Calificaciones */}
          {perfil.calificaciones?.length > 0 && (
            <Section title="Calificaciones">
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {perfil.calificaciones.map((cal, i) => (
                  <Box key={i}>
                    {i > 0 && <Divider sx={{ mb: 2 }} />}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Rating value={cal.puntuacion} size="small" readOnly sx={{ fontSize: 14 }} />
                      <Typography fontSize={12.5} fontWeight={600}>{cal.puntuacion?.toFixed(1)}</Typography>
                    </Box>
                    {cal.comentario && (
                      <Typography fontSize={13} color="text.secondary" lineHeight={1.6}>{cal.comentario}</Typography>
                    )}
                    {cal.nombreCliente && (
                      <Typography fontSize={11.5} color="text.disabled" mt={0.5}>— {cal.nombreCliente}</Typography>
                    )}
                  </Box>
                ))}
              </Box>
            </Section>
          )}
        </Grid>

        {/* Sidebar — datos rápidos para decidir */}
        <Grid size={{ xs: 12, md: 4 }}>

          {/* Datos clave */}
          {(perfil.totalProyectos > 0 || perfil.aniosExperiencia > 0 || perfil.cantidadColaboradores > 0) && (
            <Section title="Datos de la empresa">
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {perfil.totalProyectos > 0 && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography fontSize={13} color="text.secondary">Proyectos completados</Typography>
                    <Typography fontSize={13} fontWeight={700}>{perfil.totalProyectos}</Typography>
                  </Box>
                )}
                {perfil.aniosExperiencia > 0 && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography fontSize={13} color="text.secondary">Años de experiencia</Typography>
                    <Typography fontSize={13} fontWeight={700}>{perfil.aniosExperiencia}</Typography>
                  </Box>
                )}
                {perfil.calificacionPromedio > 0 && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography fontSize={13} color="text.secondary">Calificación</Typography>
                    <Typography fontSize={13} fontWeight={700}>{perfil.calificacionPromedio?.toFixed(1)} / 5.0</Typography>
                  </Box>
                )}
                {perfil.cantidadColaboradores > 0 && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography fontSize={13} color="text.secondary">Colaboradores</Typography>
                    <Typography fontSize={13} fontWeight={700}>{perfil.cantidadColaboradores}</Typography>
                  </Box>
                )}
              </Box>
            </Section>
          )}

          {/* Zona de cobertura */}
          {perfil.zonasCobertura && (
            <Section title="Zonas de cobertura">
              <Typography fontSize={13} color="text.secondary" lineHeight={1.6}>
                {perfil.zonasCobertura}
              </Typography>
            </Section>
          )}

          {/* Contacto */}
          {(perfil.telefono || perfil.emailContacto || perfil.sitioWeb || perfil.instagram) && (
            <Section title="Información de contacto">
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
            </Section>
          )}
        </Grid>
      </Grid>

      <SolicitarPropuestaModal
        perfil={perfil}
        proyectoTitulo={proyectoTitulo}
        open={modal}
        onClose={() => setModal(false)}
      />
    </Box>
  );
}
