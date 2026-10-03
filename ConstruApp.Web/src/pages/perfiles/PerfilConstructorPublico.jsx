import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Card, CardContent, Grid, Chip, Avatar,
  Rating, Button, Divider, Skeleton, Tooltip, Stack,
  Dialog, DialogTitle, DialogContent, DialogActions,
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
import BusinessIcon     from '@mui/icons-material/Business';
import HandshakeIcon    from '@mui/icons-material/Handshake';
import AssignmentIcon   from '@mui/icons-material/Assignment';
import GroupsIcon       from '@mui/icons-material/Groups';
import { perfilesConstructorApi } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';

const ACCENT = '#2563EB';
const AVATAR_PALETTE = ['#4F46E5','#0EA5E9','#10B981','#2563EB','#8B5CF6','#EC4899','#EF4444'];
const avatarBg = (name) => AVATAR_PALETTE[(name?.charCodeAt(0) ?? 0) % AVATAR_PALETTE.length];

function SectionLabel({ children }) {
  return (
    <Typography variant="subtitle2" fontWeight={700} color="text.secondary"
      sx={{ textTransform:'uppercase', letterSpacing:'0.07em', fontSize:11, mb:1.5 }}>
      {children}
    </Typography>
  );
}

function StatBlock({ value, label, icon: Icon, color = 'text.primary' }) {
  return (
    <Box sx={{ textAlign:'center', flex:1 }}>
      {Icon && <Icon sx={{ fontSize:20, color:'text.disabled', mb:0.5 }} />}
      <Typography fontSize={26} fontWeight={800} color={color} lineHeight={1}>{value}</Typography>
      <Typography fontSize={12} color="text.secondary" mt={0.5}>{label}</Typography>
    </Box>
  );
}

function LoadingSkeleton() {
  return (
    <Box sx={{ maxWidth:920, mx:'auto' }}>
      <Skeleton variant="rounded" height={200} sx={{ borderRadius:2, mb:2 }} />
      <Grid container spacing={3}>
        <Grid size={{ xs:12, md:8 }}>
          <Skeleton variant="rounded" height={160} sx={{ borderRadius:2, mb:2 }} />
          <Skeleton variant="rounded" height={120} sx={{ borderRadius:2 }} />
        </Grid>
        <Grid size={{ xs:12, md:4 }}>
          <Skeleton variant="rounded" height={120} sx={{ borderRadius:2, mb:2 }} />
          <Skeleton variant="rounded" height={100} sx={{ borderRadius:2 }} />
        </Grid>
      </Grid>
    </Box>
  );
}

/* ── Modal Invitar a propuesta ──────────────────────────────────────── */
function InvitarPropostaModal({ perfil, open, onClose }) {
  if (!perfil) return null;
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight:700, pb:1 }}>Invitar a presentar propuesta</DialogTitle>
      <Divider />
      <DialogContent sx={{ pt:2.5 }}>
        <Box sx={{ display:'flex', alignItems:'center', gap:1.5, mb:2 }}>
          <Avatar sx={{ bgcolor:avatarBg(perfil.nombreEmpresa), width:44, height:44, fontWeight:700 }}>
            {perfil.nombreEmpresa?.[0]?.toUpperCase()}
          </Avatar>
          <Box>
            <Typography fontWeight={700} fontSize={14}>{perfil.nombreEmpresa}</Typography>
            {perfil.verificado && (
              <Chip icon={<VerifiedIcon sx={{ fontSize:'11px !important', color:`${ACCENT} !important` }} />}
                label="Verificada" size="small"
                sx={{ bgcolor:'#EFF6FF', color:ACCENT, fontSize:10, fontWeight:600, height:20, mt:0.25 }} />
            )}
          </Box>
        </Box>
        <Typography fontSize={13.5} color="text.secondary" mb={2}>
          Contactá directamente a esta empresa para invitarla a presentar una propuesta para tu proyecto:
        </Typography>
        {perfil.telefono && (
          <Box sx={{ display:'flex', alignItems:'center', gap:1.5, mb:1 }}>
            <PhoneIcon sx={{ fontSize:16, color:'text.disabled' }} />
            <Typography fontSize={13} fontWeight={700}>{perfil.telefono}</Typography>
          </Box>
        )}
        {perfil.emailContacto && (
          <Box sx={{ display:'flex', alignItems:'center', gap:1.5, mb:1 }}>
            <Typography fontSize={12} color="text.secondary" fontWeight={600} sx={{ minWidth:60 }}>Correo:</Typography>
            <Typography fontSize={13} fontWeight={700}>{perfil.emailContacto}</Typography>
          </Box>
        )}
        {!perfil.telefono && !perfil.emailContacto && (
          <Typography fontSize={13} color="text.disabled">
            Esta empresa no ha publicado datos de contacto público aún.
          </Typography>
        )}
      </DialogContent>
      <Divider />
      <DialogActions sx={{ px:3, py:2 }}>
        <Button onClick={onClose} color="inherit">Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
}

export default function PerfilConstructorPublico() {
  const { id }      = useParams();
  const navigate    = useNavigate();
  const { usuario } = useAuth();
  const esCliente   = usuario?.rol === 'Cliente';

  const [perfil, setPerfil]         = useState(null);
  const [loading, setLoading]       = useState(true);
  const [invitarOpen, setInvitar]   = useState(false);

  useEffect(() => {
    perfilesConstructorApi.getById(id)
      .then(r => setPerfil(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingSkeleton />;
  if (!perfil) return (
    <Box sx={{ textAlign:'center', py:10 }}>
      <BusinessIcon sx={{ fontSize:48, color:'text.disabled', mb:1.5 }} />
      <Typography fontWeight={700} fontSize={15} gutterBottom>Perfil no encontrado</Typography>
      <Typography color="text.secondary" fontSize={13} mb={3}>
        Esta constructora no existe o no tiene perfil público.
      </Typography>
      <Button variant="outlined" onClick={() => navigate('/marketplace')}>
        Volver al Directorio
      </Button>
    </Box>
  );

  const especialidades  = perfil.especialidades?.split(',').map(s => s.trim()).filter(Boolean) ?? [];
  const certificaciones = perfil.certificaciones?.split(',').map(s => s.trim()).filter(Boolean) ?? [];
  const bgColor = avatarBg(perfil.nombreEmpresa);

  return (
    <Box sx={{ maxWidth:940, mx:'auto' }}>
      {/* Back */}
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/marketplace')}
        sx={{ mb:2, color:'#64748B', fontWeight:600, fontSize:13,
          '&:hover': { bgcolor:'#F1F5F9', color:'#0F172A' } }}>
        Directorio de Constructoras
      </Button>

      {/* ── Cover card ─────────────────────────────────────────────── */}
      <Card elevation={0} sx={{ mb:3, borderRadius:2, overflow:'hidden', border:'1px solid #E2E8F0' }}>
        {/* Accent strip */}
        <Box sx={{ height:6, background:`linear-gradient(90deg, ${ACCENT} 0%, #7C3AED 100%)` }} />

        <CardContent sx={{ px:{ xs:2.5, sm:3 }, pt:3, pb:'24px !important' }}>
          <Box sx={{ display:'flex', alignItems:'flex-start', gap:{ xs:2, sm:3 }, flexWrap:'wrap' }}>
            {/* Avatar */}
            <Avatar sx={{
              bgcolor:bgColor, width:{ xs:64, sm:80 }, height:{ xs:64, sm:80 },
              fontSize:{ xs:24, sm:30 }, fontWeight:800, flexShrink:0,
              border:'3px solid white', boxShadow:'0 2px 16px rgba(0,0,0,0.12)',
            }}>
              {perfil.nombreEmpresa?.[0]?.toUpperCase()}
            </Avatar>

            {/* Info */}
            <Box sx={{ flex:1, minWidth:200 }}>
              <Box sx={{ display:'flex', alignItems:'center', gap:1, flexWrap:'wrap' }}>
                <Typography variant="h5" fontWeight={800} color="text.primary">
                  {perfil.nombreEmpresa}
                </Typography>
                {perfil.verificado && (
                  <Tooltip title="Constructor verificado por ConstruApp">
                    <Chip
                      icon={<VerifiedIcon sx={{ fontSize:'13px !important', color:`${ACCENT} !important` }} />}
                      label="Verificada" size="small"
                      sx={{ bgcolor:'#EFF6FF', color:ACCENT, fontWeight:700, fontSize:11,
                        border:`1px solid #BFDBFE` }}
                    />
                  </Tooltip>
                )}
              </Box>
              {/* Rating */}
              <Box sx={{ display:'flex', alignItems:'center', gap:1, mt:0.75, flexWrap:'wrap' }}>
                <Rating value={perfil.calificacionPromedio || 0} precision={0.5} size="small" readOnly />
                <Typography fontSize={14} fontWeight={700}>
                  {perfil.calificacionPromedio?.toFixed(1) || '—'}
                </Typography>
                <Typography fontSize={13} color="text.secondary">
                  · {perfil.totalProyectos ?? 0} proyectos completados
                </Typography>
              </Box>
              {/* Meta */}
              <Box sx={{ display:'flex', gap:2.5, mt:1, flexWrap:'wrap' }}>
                {perfil.zonasCobertura && (
                  <Box sx={{ display:'flex', alignItems:'center', gap:0.75 }}>
                    <LocationOnIcon sx={{ fontSize:15, color:'#64748B' }} />
                    <Typography fontSize={13} color="text.secondary">{perfil.zonasCobertura}</Typography>
                  </Box>
                )}
                {perfil.aniosExperiencia > 0 && (
                  <Box sx={{ display:'flex', alignItems:'center', gap:0.75 }}>
                    <WorkIcon sx={{ fontSize:15, color:'#64748B' }} />
                    <Typography fontSize={13} color="text.secondary">
                      {perfil.aniosExperiencia} años de experiencia
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>

            {/* CTA */}
            {esCliente && (
              <Box sx={{ display:'flex', flexDirection:'column', gap:1, flexShrink:0 }}>
                <Button variant="contained" startIcon={<HandshakeIcon />}
                  onClick={() => setInvitar(true)}
                  sx={{ bgcolor:ACCENT, '&:hover':{ bgcolor:'#1D4ED8' }, fontWeight:700,
                    whiteSpace:'nowrap', boxShadow:'none' }}>
                  Invitar a cotizar
                </Button>
              </Box>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* ── Indicadores ─────────────────────────────────────────────── */}
      <Card elevation={0} sx={{ mb:3, border:'1px solid #E2E8F0', borderRadius:2 }}>
        <CardContent sx={{ p:{ xs:2, sm:3 } }}>
          <SectionLabel>Indicadores</SectionLabel>
          <Box sx={{ display:'flex', gap:2, flexWrap:'wrap' }}>
            <Box sx={{ display:'flex', flex:1, gap:0, minWidth:240 }}>
              <StatBlock
                value={perfil.totalProyectos ?? 0}
                label="Proyectos completados"
                icon={AssignmentIcon}
              />
              <Divider orientation="vertical" flexItem sx={{ mx:2 }} />
              <StatBlock
                value={perfil.calificacionPromedio?.toFixed(1) || '—'}
                label="Calificación promedio"
                icon={StarIcon}
                color={perfil.calificacionPromedio >= 4 ? '#F59E0B' : 'text.primary'}
              />
              <Divider orientation="vertical" flexItem sx={{ mx:2 }} />
              <StatBlock
                value={perfil.aniosExperiencia > 0 ? `${perfil.aniosExperiencia}` : '—'}
                label="Años de experiencia"
                icon={WorkIcon}
              />
              {perfil.cantidadColaboradores > 0 && (
                <>
                  <Divider orientation="vertical" flexItem sx={{ mx:2 }} />
                  <StatBlock
                    value={perfil.cantidadColaboradores}
                    label="Colaboradores"
                    icon={GroupsIcon}
                  />
                </>
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* ── Content grid ─────────────────────────────────────────────── */}
      <Grid container spacing={3}>

        {/* Columna principal */}
        <Grid size={{ xs:12, md:8 }}>
          {/* Sobre la empresa */}
          {perfil.bio && (
            <Card elevation={0} sx={{ mb:3, border:'1px solid #E2E8F0', borderRadius:2 }}>
              <CardContent sx={{ p:3 }}>
                <SectionLabel>Sobre la empresa</SectionLabel>
                <Typography fontSize={13.5} color="text.secondary" lineHeight={1.75}>
                  {perfil.bio}
                </Typography>
              </CardContent>
            </Card>
          )}

          {/* Portafolio */}
          {perfil.portafolioItems?.length > 0 && (
            <Card elevation={0} sx={{ mb:3, border:'1px solid #E2E8F0', borderRadius:2 }}>
              <CardContent sx={{ p:3 }}>
                <SectionLabel>Portafolio de proyectos</SectionLabel>
                <Grid container spacing={2}>
                  {perfil.portafolioItems.map(item => (
                    <Grid size={{ xs:12, sm:6 }} key={item.id}>
                      <Box sx={{ borderRadius:1.5, overflow:'hidden', border:'1px solid #E2E8F0',
                        transition:'.15s', '&:hover':{ boxShadow:'0 4px 14px rgba(0,0,0,0.08)' } }}>
                        {item.imagenUrl && (
                          <Box component="img" src={item.imagenUrl} alt={item.titulo}
                            sx={{ width:'100%', height:170, objectFit:'cover', display:'block' }} />
                        )}
                        <Box sx={{ p:1.5 }}>
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

          {/* Certificaciones */}
          {certificaciones.length > 0 && (
            <Card elevation={0} sx={{ mb:3, border:'1px solid #E2E8F0', borderRadius:2 }}>
              <CardContent sx={{ p:3 }}>
                <SectionLabel>Certificaciones y licencias</SectionLabel>
                <Box sx={{ display:'flex', flexDirection:'column', gap:1 }}>
                  {certificaciones.map(c => (
                    <Box key={c} sx={{ display:'flex', alignItems:'center', gap:1.25 }}>
                      <Box sx={{ width:20, height:20, borderRadius:'50%',
                        bgcolor:'#DCFCE7', display:'flex', alignItems:'center', justifyContent:'center',
                        flexShrink:0 }}>
                        <CheckIcon sx={{ fontSize:12, color:'#166534' }} />
                      </Box>
                      <Typography fontSize={13} color="text.secondary">{c}</Typography>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          )}
        </Grid>

        {/* Sidebar */}
        <Grid size={{ xs:12, md:4 }}>
          {/* Especialidades */}
          <Card elevation={0} sx={{ mb:2.5, border:'1px solid #E2E8F0', borderRadius:2 }}>
            <CardContent sx={{ p:2.5 }}>
              <SectionLabel>Especialidades</SectionLabel>
              {especialidades.length > 0 ? (
                <Box sx={{ display:'flex', flexWrap:'wrap', gap:0.75 }}>
                  {especialidades.map(e => (
                    <Chip key={e} label={e} size="small"
                      sx={{ bgcolor:'#EFF6FF', color:'#1D4ED8', fontWeight:600, fontSize:11 }} />
                  ))}
                </Box>
              ) : (
                <Typography fontSize={13} color="text.disabled">No especificadas</Typography>
              )}
            </CardContent>
          </Card>

          {/* Contacto */}
          {(perfil.sitioWeb || perfil.instagram || perfil.telefono || perfil.emailContacto) && (
            <Card elevation={0} sx={{ mb:2.5, border:'1px solid #E2E8F0', borderRadius:2 }}>
              <CardContent sx={{ p:2.5 }}>
                <SectionLabel>Contacto</SectionLabel>
                <Box sx={{ display:'flex', flexDirection:'column', gap:1.5 }}>
                  {perfil.telefono && (
                    <Box sx={{ display:'flex', alignItems:'center', gap:1.25 }}>
                      <PhoneIcon sx={{ fontSize:16, color:'#64748B' }} />
                      <Typography fontSize={13} color="text.secondary">{perfil.telefono}</Typography>
                    </Box>
                  )}
                  {perfil.emailContacto && (
                    <Box sx={{ display:'flex', alignItems:'center', gap:1.25 }}>
                      <SendIcon sx={{ fontSize:16, color:'#64748B' }} />
                      <Typography fontSize={13} color="text.secondary">{perfil.emailContacto}</Typography>
                    </Box>
                  )}
                  {perfil.sitioWeb && (
                    <Box sx={{ display:'flex', alignItems:'center', gap:1.25 }}>
                      <LanguageIcon sx={{ fontSize:16, color:'#64748B' }} />
                      <a href={perfil.sitioWeb} target="_blank" rel="noreferrer"
                        style={{ fontSize:13, color:ACCENT, fontWeight:600, textDecoration:'none' }}>
                        {perfil.sitioWeb.replace(/^https?:\/\//, '')}
                      </a>
                    </Box>
                  )}
                  {perfil.instagram && (
                    <Box sx={{ display:'flex', alignItems:'center', gap:1.25 }}>
                      <InstagramIcon sx={{ fontSize:16, color:'#64748B' }} />
                      <Typography fontSize={13} color="text.secondary">
                        @{perfil.instagram.replace('@','')}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>
          )}

          {/* CTA sidebar */}
          {esCliente && (
            <Card elevation={0} sx={{ border:`1px solid #BFDBFE`, borderRadius:2, bgcolor:'#EFF6FF' }}>
              <CardContent sx={{ p:2.5 }}>
                <Typography fontWeight={700} fontSize={13} color={ACCENT} mb={0.75}>
                  ¿Te interesa esta empresa?
                </Typography>
                <Typography fontSize={12.5} color="text.secondary" mb={2}>
                  Invitala a presentar una propuesta para tu próximo proyecto.
                </Typography>
                <Button fullWidth variant="contained" startIcon={<HandshakeIcon />}
                  onClick={() => setInvitar(true)}
                  sx={{ bgcolor:ACCENT, '&:hover':{ bgcolor:'#1D4ED8' }, fontWeight:700,
                    fontSize:13, boxShadow:'none', mt:1 }}>
                  Invitar a cotizar
                </Button>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>

      <InvitarPropostaModal perfil={perfil} open={invitarOpen} onClose={() => setInvitar(false)} />
    </Box>
  );
}
