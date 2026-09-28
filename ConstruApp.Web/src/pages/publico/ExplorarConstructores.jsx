import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Grid, Card, CardContent, CardActions,
  Button, Chip, TextField, InputAdornment, Select, MenuItem,
  Avatar, Rating, Skeleton, Divider, Container,
} from '@mui/material';
import SearchIcon      from '@mui/icons-material/Search';
import VerifiedIcon    from '@mui/icons-material/Verified';
import LocationOnIcon  from '@mui/icons-material/LocationOn';
import WorkIcon        from '@mui/icons-material/Work';
import ConstructionIcon from '@mui/icons-material/Construction';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { perfilesConstructorApi } from '../../api/endpoints';

const PROVINCIAS = ['Todas', 'San José', 'Alajuela', 'Cartago', 'Heredia', 'Guanacaste', 'Puntarenas', 'Limón'];
const ESPECIALIDADES = ['', 'Remodelación', 'Obra gris', 'Eléctrico', 'Plomería', 'Pintura', 'Pisos', 'Techos'];

const ACCENT = '#2563EB';
const AVATAR_COLORS = ['#1D4ED8', '#0F766E', '#6D28D9', '#BE123C', '#1E40AF', '#374151', '#047857'];
const avatarColor = (name) => AVATAR_COLORS[(name?.charCodeAt(0) ?? 0) % AVATAR_COLORS.length];

function ConstructorCard({ perfil, onContactar }) {
  const especialidades = perfil.especialidades?.split(',').map(s => s.trim()).filter(Boolean) ?? [];
  const color = avatarColor(perfil.nombreEmpresa);

  return (
    <Card sx={{
      height: '100%', display: 'flex', flexDirection: 'column',
      border: '1px solid rgba(0,0,0,0.07)',
      transition: 'transform .15s, box-shadow .15s',
      '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 12px 32px rgba(0,0,0,0.10)' },
    }}>
      <CardContent sx={{ flex: 1, p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', gap: 2, mb: 2.5 }}>
          <Avatar sx={{ width: 60, height: 60, bgcolor: color, fontWeight: 800, fontSize: 24, flexShrink: 0, borderRadius: 2 }}>
            {perfil.nombreEmpresa?.[0]?.toUpperCase()}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Typography fontWeight={700} noWrap sx={{ flex: 1 }}>{perfil.nombreEmpresa}</Typography>
              {perfil.verificado && (
                <VerifiedIcon sx={{ color: '#1B5E20', fontSize: 17 }} titleAccess="Constructor verificado" />
              )}
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.25 }}>
              <Rating value={perfil.calificacionPromedio || 0} precision={0.5} size="small" readOnly />
              <Typography variant="caption" fontWeight={700} color="text.secondary">
                {perfil.calificacionPromedio?.toFixed(1) || 'Nuevo'}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Bio */}
        {perfil.bio && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.6,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {perfil.bio}
          </Typography>
        )}

        {/* Especialidades */}
        {especialidades.length > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
            {especialidades.slice(0, 3).map(e => (
              <Chip key={e} label={e} size="small"
                sx={{ bgcolor: '#EFF6FF', color: '#1D4ED8', fontSize: 11, fontWeight: 600, border: '1px solid #BFDBFE' }} />
            ))}
          </Box>
        )}

        <Divider sx={{ mb: 1.5 }} />

        {/* Meta */}
        <Box sx={{ display: 'flex', gap: 2.5 }}>
          {perfil.zonasCobertura && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <LocationOnIcon sx={{ fontSize: 14, color: '#9CA3AF' }} />
              <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 100 }}>
                {perfil.zonasCobertura}
              </Typography>
            </Box>
          )}
          {perfil.aniosExperiencia > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <WorkIcon sx={{ fontSize: 14, color: '#9CA3AF' }} />
              <Typography variant="caption" color="text.secondary">
                {perfil.aniosExperiencia} años exp.
              </Typography>
            </Box>
          )}
        </Box>
      </CardContent>

      <CardActions sx={{ px: 3, pb: 2.5, pt: 0, gap: 1 }}>
        <Button size="small" fullWidth endIcon={<ArrowForwardIcon />}
          onClick={() => onContactar(perfil)}
          sx={{ bgcolor: ACCENT, color: 'white', '&:hover': { bgcolor: '#1D4ED8' } }}>
          Ver perfil
        </Button>
      </CardActions>
    </Card>
  );
}

export default function ExplorarConstructores() {
  const navigate = useNavigate();
  const [constructores, setConstr] = useState([]);
  const [loading, setLoading]      = useState(true);
  const [buscar, setBuscar]        = useState('');
  const [provincia, setProvincia]  = useState('Todas');
  const [espec, setEspec]          = useState('');

  useEffect(() => {
    setLoading(true);
    perfilesConstructorApi.getAll({
      ...(provincia !== 'Todas' && { zona: provincia }),
      ...(buscar && { especialidad: buscar }),
    }).then(r => setConstr(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [buscar, provincia]);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#F8F9FA' }}>

      {/* ── Navbar pública ──────────────────────────────────────── */}
      <Box sx={{ bgcolor: ACCENT, px: { xs: 2, md: 6 }, py: 1.75 }}>
        <Box sx={{ maxWidth: 1200, mx: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer' }}
            onClick={() => navigate('/')}>
            <Box sx={{ bgcolor: 'rgba(255,255,255,0.2)', borderRadius: 1.5, p: 0.55, display: 'flex' }}>
              <ConstructionIcon sx={{ color: '#fff', fontSize: 20 }} />
            </Box>
            <Typography fontWeight={800} fontSize={17} sx={{ color: '#fff' }}>ConstruApp</Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Button onClick={() => navigate('/login')} sx={{ color: 'rgba(255,255,255,0.8)', fontWeight: 500, '&:hover': { color: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }}>
              Iniciar sesión
            </Button>
            <Button onClick={() => navigate('/register')}
              sx={{ bgcolor: '#fff', color: ACCENT, fontWeight: 700, '&:hover': { bgcolor: '#F0F9FF' } }}>
              Registrarse
            </Button>
          </Box>
        </Box>
      </Box>

      {/* ── Hero ────────────────────────────────────────────────── */}
      <Box sx={{
        background: `linear-gradient(160deg, #1E40AF 0%, ${ACCENT} 55%, #3B82F6 100%)`,
        py: { xs: 6, md: 9 }, px: 2, position: 'relative', overflow: 'hidden',
      }}>
        {/* Decorative blobs */}
        <Box sx={{ position: 'absolute', right: -60, top: -60, width: 340, height: 340,
          borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 70%)' }} />
        <Box sx={{ position: 'absolute', left: '20%', bottom: -80, width: 260, height: 260,
          borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 70%)' }} />

        <Container maxWidth="md" sx={{ textAlign: 'center', position: 'relative' }}>
          <Chip label="🇨🇷 Costa Rica" size="small"
            sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', mb: 2.5, fontWeight: 700,
              border: '1px solid rgba(255,255,255,0.35)', fontSize: 13 }} />

          <Typography variant="h3" fontWeight={900}
            sx={{ mb: 2, lineHeight: 1.12, letterSpacing: '-0.5px', color: '#fff' }}>
            Encontrá el constructor ideal<br />
            <Box component="span" sx={{ color: 'rgba(255,255,255,0.85)' }}>para tu proyecto</Box>
          </Typography>

          <Typography sx={{ color: 'rgba(255,255,255,0.85)', fontSize: 16.5, mb: 4, maxWidth: 520, mx: 'auto' }}>
            Constructores verificados, con calificaciones reales y cotización IA incluida.
          </Typography>

          {/* Buscador */}
          <Box sx={{ bgcolor: 'white', borderRadius: 3, p: 1.5, display: 'flex',
            flexWrap: 'wrap', gap: 1, boxShadow: '0 12px 40px rgba(0,0,0,0.2)' }}>
            <TextField size="small" placeholder="Buscar por nombre o especialidad..."
              value={buscar} onChange={e => setBuscar(e.target.value)}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: '#9CA3AF', fontSize: 18 }} /></InputAdornment> }}
              sx={{ flex: 1, minWidth: 200, '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
            <Select size="small" value={provincia} displayEmpty onChange={e => setProvincia(e.target.value)}
              sx={{ minWidth: 155, borderRadius: 2 }}>
              {PROVINCIAS.map(p => <MenuItem key={p} value={p}>{p}</MenuItem>)}
            </Select>
            <Button variant="contained" size="small"
              sx={{ px: 3, borderRadius: 2, bgcolor: ACCENT, '&:hover': { bgcolor: '#1D4ED8' } }}>
              Buscar
            </Button>
          </Box>

          {/* Stats */}
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: { xs: 3, md: 5 }, mt: 4, flexWrap: 'wrap' }}>
            {[
              { v: `${constructores.length}+`, l: 'Constructores' },
              { v: '100%', l: 'Verificados' },
              { v: 'IA', l: 'Cotización automática' },
            ].map(s => (
              <Box key={s.l} sx={{ textAlign: 'center' }}>
                <Typography fontWeight={900} fontSize={26} sx={{ color: '#fff', lineHeight: 1 }}>{s.v}</Typography>
                <Typography fontSize={12.5} sx={{ color: 'rgba(255,255,255,0.7)', mt: 0.5 }}>{s.l}</Typography>
              </Box>
            ))}
          </Box>
        </Container>
      </Box>

      {/* ── Resultados ──────────────────────────────────────────── */}
      <Container maxWidth="lg" sx={{ py: 5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h6" fontWeight={700}>
              {loading ? 'Cargando...' : `${constructores.length} constructores disponibles`}
            </Typography>
            {provincia !== 'Todas' && (
              <Typography variant="body2" color="text.secondary">
                Mostrando resultados en {provincia}
              </Typography>
            )}
          </Box>
        </Box>

        {loading ? (
          <Grid container spacing={2.5}>
            {[1,2,3,4,5,6].map(i => (
              <Grid item xs={12} sm={6} md={4} key={i}>
                <Skeleton variant="rounded" height={280} sx={{ borderRadius: 2 }} />
              </Grid>
            ))}
          </Grid>
        ) : constructores.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 10 }}>
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              No se encontraron constructores con esos criterios.
            </Typography>
            <Button onClick={() => { setBuscar(''); setProvincia('Todas'); }}>
              Limpiar filtros
            </Button>
          </Box>
        ) : (
          <Grid container spacing={2.5}>
            {constructores.map(c => (
              <Grid item xs={12} sm={6} md={4} key={c.id}>
                <ConstructorCard perfil={c} onContactar={p => navigate(`/constructor/${p.id}`)} />
              </Grid>
            ))}
          </Grid>
        )}
      </Container>

      {/* ── CTA final ───────────────────────────────────────────── */}
      <Box sx={{
        background: `linear-gradient(135deg, #1E40AF 0%, ${ACCENT} 100%)`,
        py: 7, textAlign: 'center', px: 2,
        position: 'relative', overflow: 'hidden',
      }}>
        <Box sx={{ position: 'absolute', left: -60, top: -60, width: 240, height: 240,
          borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)' }} />
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Typography variant="h5" fontWeight={800} color="white" sx={{ mb: 1 }}>
            ¿Sos constructor o proveedor?
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.8)', mb: 3.5, fontSize: 15 }}>
            Registrate y comenzá a recibir proyectos hoy mismo. Es gratis.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button variant="contained" size="large" onClick={() => navigate('/register')}
              sx={{ bgcolor: '#fff', color: ACCENT, fontWeight: 800, px: 4,
                '&:hover': { bgcolor: '#F0F9FF' } }}>
              Crear cuenta gratis
            </Button>
            <Button variant="outlined" size="large" onClick={() => navigate('/login')}
              sx={{ borderColor: 'rgba(255,255,255,0.35)', color: 'rgba(255,255,255,0.9)',
                '&:hover': { borderColor: 'white', color: 'white', bgcolor: 'rgba(255,255,255,0.08)' } }}>
              Ya tengo cuenta
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
