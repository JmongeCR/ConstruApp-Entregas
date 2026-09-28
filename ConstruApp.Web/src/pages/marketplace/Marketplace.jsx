import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Grid, Card, CardContent, CardActions,
  Button, Chip, TextField, InputAdornment, Select, MenuItem,
  FormControl, Avatar, Rating, Skeleton, Divider,
  ToggleButton, ToggleButtonGroup,
} from '@mui/material';
import SearchIcon     from '@mui/icons-material/Search';
import VerifiedIcon   from '@mui/icons-material/Verified';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import WorkIcon       from '@mui/icons-material/Work';
import SendIcon       from '@mui/icons-material/Send';
import BusinessIcon   from '@mui/icons-material/Business';
import PersonIcon     from '@mui/icons-material/Person';
import FilterListIcon from '@mui/icons-material/FilterList';
import { perfilesConstructorApi, proyectosApi } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';

const ACCENT = '#2563EB';

const PROVINCIAS = ['Todas','San José','Alajuela','Cartago','Heredia','Guanacaste','Puntarenas','Limón'];

const CANTONES_CR = [
  'Todos','San José','Escazú','Desamparados','Puriscal','Tarrazú','Aserrí','Mora','Goicoechea',
  'Santa Ana','Alajuelita','Vásquez de Coronado','Acosta','Tibás','Moravia','Montes de Oca',
  'Turrubares','Dota','Curridabat','Pérez Zeledón','León Cortés',
  'Alajuela','San Ramón','Grecia','San Mateo','Atenas','Naranjo','Palmares','Poás',
  'Orotina','San Carlos','Zarcero','Sarchí','Upala','Los Chiles','Guatuso',
  'Cartago','Paraíso','La Unión','Jiménez','Turrialba','Alvarado','Oreamuno','El Guarco',
  'Heredia','Barva','Santo Domingo','Santa Bárbara','San Rafael','San Isidro','Belén',
  'Flores','San Pablo','Sarapiquí',
  'Liberia','Nicoya','Santa Cruz','Bagaces','Carrillo','Cañas','Abangares','Tilarán',
  'Nandayure','La Cruz','Hojancha',
  'Puntarenas','Esparza','Buenos Aires','Montes de Oro','Osa','Quepos','Golfito',
  'Coto Brus','Parrita','Corredores','Garabito',
  'Limón','Pococí','Siquirres','Talamanca','Matina','Guácimo',
];
const TIPOS_PROYECTO = [
  { value: '', label: 'Todos los tipos' },
  { value: 'Remodelacion',      label: 'Remodelación' },
  { value: 'ObraGris',          label: 'Obra gris' },
  { value: 'ElectricoPlomeria', label: 'Eléctrico / Plomería' },
  { value: 'Pintura',           label: 'Pintura' },
  { value: 'Pisos',             label: 'Pisos' },
  { value: 'Techos',            label: 'Techos' },
];

const AVATAR_PALETTE = ['#4F46E5','#0EA5E9','#10B981','#2563EB','#7C3AED','#DB2777'];
const avatarBg = (name) => AVATAR_PALETTE[(name?.charCodeAt(0) ?? 0) % AVATAR_PALETTE.length];

const TIPO_LABEL = {
  Remodelacion: 'Remodelación', ObraGris: 'Obra gris',
  ElectricoPlomeria: 'Eléctrico / Plomería', Pintura: 'Pintura',
  Pisos: 'Pisos', Techos: 'Techos', PiscinaJardin: 'Piscina / Jardín', Otro: 'Otro',
};

/* ── Constructor card ─────────────────────────────────────────────── */
function ConstructorCard({ perfil, onVerPerfil }) {
  const especialidades = perfil.especialidades?.split(',').map(s => s.trim()).filter(Boolean) ?? [];
  const bg = avatarBg(perfil.nombreEmpresa);

  return (
    <Card elevation={0} sx={{
      height: '100%', display: 'flex', flexDirection: 'column',
      border: '1px solid #E8EDF3', borderRadius: '12px',
      transition: 'all .18s ease',
      '&:hover': {
        borderColor: 'rgba(37,99,235,0.2)',
        boxShadow: '0 8px 28px rgba(37,99,235,0.08)',
        transform: 'translateY(-2px)',
      },
    }}>
      <CardContent sx={{ flex: 1, p: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 1.5 }}>
          <Avatar sx={{ width: 44, height: 44, bgcolor: bg, fontWeight: 700, fontSize: 18, flexShrink: 0 }}>
            {perfil.nombreEmpresa?.[0]?.toUpperCase()}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Typography fontWeight={600} fontSize={13.5} noWrap sx={{ flex: 1 }}>
                {perfil.nombreEmpresa}
              </Typography>
              {perfil.verificado && (
                <VerifiedIcon sx={{ color: ACCENT, fontSize: 15, flexShrink: 0 }} titleAccess="Verificado" />
              )}
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.25 }}>
              <Rating value={perfil.calificacionPromedio || 0} precision={0.5} size="small" readOnly />
              <Typography fontSize={12} fontWeight={600} color="text.primary">
                {perfil.calificacionPromedio?.toFixed(1) || '—'}
              </Typography>
              {perfil.totalProyectos > 0 && (
                <Typography fontSize={11.5} color="text.secondary">· {perfil.totalProyectos} proy.</Typography>
              )}
            </Box>
          </Box>
        </Box>

        {perfil.bio && (
          <Typography fontSize={12.5} color="text.secondary" sx={{
            mb: 1.5, display: '-webkit-box', WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.55,
          }}>
            {perfil.bio}
          </Typography>
        )}

        {especialidades.length > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1.5 }}>
            {especialidades.slice(0, 3).map(e => (
              <Chip key={e} label={e} size="small"
                sx={{ bgcolor: '#EFF6FF', color: '#1D4ED8', fontSize: 11, fontWeight: 500, borderRadius: '4px' }} />
            ))}
            {especialidades.length > 3 && (
              <Chip label={`+${especialidades.length - 3}`} size="small"
                sx={{ bgcolor: '#F3F4F6', color: '#6B7280', fontSize: 11 }} />
            )}
          </Box>
        )}

        <Box sx={{ display: 'flex', gap: 2 }}>
          {perfil.zonasCobertura && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
              <LocationOnIcon sx={{ fontSize: 12, color: 'text.disabled' }} />
              <Typography fontSize={11.5} color="text.secondary" noWrap sx={{ maxWidth: 100 }}>
                {perfil.zonasCobertura}
              </Typography>
            </Box>
          )}
          {perfil.aniosExperiencia > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
              <WorkIcon sx={{ fontSize: 12, color: 'text.disabled' }} />
              <Typography fontSize={11.5} color="text.secondary">{perfil.aniosExperiencia} años</Typography>
            </Box>
          )}
        </Box>
      </CardContent>

      <CardActions sx={{ px: 2, pb: 2, pt: 0.5 }}>
        <Button size="small" variant="contained" fullWidth onClick={() => onVerPerfil(perfil)}
          sx={{ fontSize: 12.5, fontWeight: 700, bgcolor: '#1B3B7A', '&:hover': { bgcolor: '#0f2a5e' }, boxShadow: 'none' }}>
          Ver perfil
        </Button>
      </CardActions>
    </Card>
  );
}

/* ── Proyecto card ────────────────────────────────────────────────── */
function ProyectoCard({ proyecto, esConstructor, onEnviarPropuesta }) {
  return (
    <Card elevation={0} sx={{
      height: '100%', display: 'flex', flexDirection: 'column',
      border: '1px solid #E8EDF3', borderRadius: '12px',
      transition: 'all .18s ease',
      '&:hover': {
        borderColor: 'rgba(37,99,235,0.2)',
        boxShadow: '0 8px 28px rgba(37,99,235,0.08)',
        transform: 'translateY(-2px)',
      },
    }}>
      <CardContent sx={{ flex: 1, p: 2.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.25 }}>
          <Chip label={TIPO_LABEL[proyecto.tipoProyecto] || proyecto.tipoProyecto}
            size="small" sx={{ bgcolor: '#EFF6FF', color: '#1D4ED8', fontWeight: 600, fontSize: 11 }} />
          {proyecto.presupuestoMax && (
            <Typography fontSize={12} fontWeight={700} sx={{ color: '#065F46' }}>
              ₡{(proyecto.presupuestoMax / 1e6).toFixed(1)}M máx.
            </Typography>
          )}
        </Box>
        <Typography fontWeight={600} fontSize={13.5} color="text.primary" gutterBottom sx={{
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {proyecto.titulo}
        </Typography>
        <Typography fontSize={12.5} color="text.secondary" sx={{
          mb: 1.75, display: '-webkit-box', WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.55,
        }}>
          {proyecto.descripcion}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
          <LocationOnIcon sx={{ fontSize: 12, color: 'text.disabled' }} />
          <Typography fontSize={12} color="text.secondary">
            {[proyecto.canton, proyecto.provincia].filter(Boolean).join(', ')}
          </Typography>
        </Box>
      </CardContent>

      <CardActions sx={{ px: 2, pb: 2, pt: 0.5 }}>
        {esConstructor ? (
          <Button variant="contained" size="small" fullWidth startIcon={<SendIcon sx={{ fontSize: 14 }} />}
            onClick={() => onEnviarPropuesta(proyecto)}
            sx={{ fontSize: 12.5, fontWeight: 700, bgcolor: '#1B3B7A', '&:hover': { bgcolor: '#0f2a5e' }, boxShadow: 'none' }}>
            Enviar propuesta
          </Button>
        ) : (
          <Typography fontSize={11.5} color="text.secondary">
            Publicado {new Date(proyecto.fechaPublicacion).toLocaleDateString('es-CR', { day: 'numeric', month: 'short' })}
          </Typography>
        )}
      </CardActions>
    </Card>
  );
}

/* ── Main ─────────────────────────────────────────────────────────── */
export default function Marketplace() {
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const esConstructor = usuario?.rol === 'Constructor';

  const [vista, setVista]          = useState(esConstructor ? 'proyectos' : 'constructores');
  const [constructores, setConstr] = useState([]);
  const [proyectos, setProyectos]  = useState([]);
  const [loading, setLoading]      = useState(true);
  const [buscar, setBuscar]        = useState('');
  const [provincia, setProvincia]  = useState('Todas');
  const [canton, setCanton]        = useState('Todos');
  const [tipoFiltro, setTipo]      = useState('');

  useEffect(() => {
    setLoading(true);
    Promise.all([
      perfilesConstructorApi.getAll({
        ...(provincia !== 'Todas' && { zona: provincia }),
        ...(buscar && { especialidad: buscar }),
      }).then(r => setConstr(r.data)).catch(() => {}),
      proyectosApi.getPublicados({
        ...(provincia !== 'Todas' && { provincia }),
        ...(tipoFiltro && { tipo: tipoFiltro }),
        ...(buscar && { buscar }),
        ...(canton !== 'Todos' && { canton }),
      }).then(r => setProyectos(r.data)).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, [buscar, provincia, canton, tipoFiltro]);

  const handleEnviarPropuesta = (proyecto) => navigate(`/mis-propuestas?proyectoId=${proyecto.id}`);
  const handleVerPerfil       = (perfil)   => navigate(`/constructor/${perfil.id}`);

  const totalItems = vista === 'constructores' ? constructores.length : proyectos.length;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="h5" color="text.primary" fontWeight={800} sx={{ mb: 0.25 }}>Marketplace</Typography>
          <Typography variant="body2" color="text.secondary">
            {loading ? '...' : esConstructor
              ? `${proyectos.length} proyecto${proyectos.length !== 1 ? 's' : ''} publicado${proyectos.length !== 1 ? 's' : ''} disponible${proyectos.length !== 1 ? 's' : ''}`
              : `${constructores.length} constructor${constructores.length !== 1 ? 'es' : ''} verificado${constructores.length !== 1 ? 's' : ''} en Costa Rica`
            }
          </Typography>
        </Box>
      </Box>

      {/* Filtros + toggle */}
      <Box sx={{
        bgcolor: '#fff', border: '1px solid #E2E8F0', borderRadius: '10px',
        px: 2, py: 1.5, mb: 2.5,
        display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap',
      }}>
        <FilterListIcon sx={{ fontSize: 17, color: 'text.disabled', flexShrink: 0 }} />

        {(esConstructor || usuario?.rol === 'Admin') && (
          <>
            <ToggleButtonGroup value={vista} exclusive onChange={(_, v) => v && setVista(v)} size="small"
              sx={{
                '& .MuiToggleButton-root': {
                  px: 1.75, fontWeight: 500, textTransform: 'none', fontSize: 12.5,
                  borderColor: '#E5E7EB', color: '#6B7280', py: '5px',
                  '&.Mui-selected': { bgcolor: '#EFF6FF', color: ACCENT, borderColor: '#BFDBFE', fontWeight: 600 },
                },
              }}>
              <ToggleButton value="constructores">
                <BusinessIcon sx={{ fontSize: 14, mr: 0.6 }} /> Constructores
              </ToggleButton>
              <ToggleButton value="proyectos">
                <PersonIcon sx={{ fontSize: 14, mr: 0.6 }} /> Proyectos
              </ToggleButton>
            </ToggleButtonGroup>
            <Divider orientation="vertical" flexItem sx={{ mx: 0.25 }} />
          </>
        )}

        <TextField
          size="small" placeholder="Buscar..."
          value={buscar} onChange={e => setBuscar(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 16, color: 'text.disabled' }} /></InputAdornment> }}
          sx={{ width: 220 }}
        />

        <FormControl size="small" sx={{ minWidth: 140 }}>
          <Select value={provincia} displayEmpty onChange={e => setProvincia(e.target.value)}>
            {PROVINCIAS.map(p => <MenuItem key={p} value={p} sx={{ fontSize: 13 }}>{p}</MenuItem>)}
          </Select>
        </FormControl>

        {vista === 'proyectos' && (
          <>
            <FormControl size="small" sx={{ minWidth: 170 }}>
              <Select value={tipoFiltro} displayEmpty onChange={e => setTipo(e.target.value)}>
                {TIPOS_PROYECTO.map(t => (
                  <MenuItem key={t.value} value={t.value} sx={{ fontSize: 13 }}>{t.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <Select value={canton} displayEmpty onChange={e => setCanton(e.target.value)}>
                {CANTONES_CR.map(c => (
                  <MenuItem key={c} value={c} sx={{ fontSize: 13 }}>{c}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </>
        )}

        <Box sx={{ ml: 'auto' }}>
          <Typography fontSize={12.5} color="text.secondary" fontWeight={500}>
            {loading ? '...' : `${totalItems} ${vista === 'constructores' ? 'constructores' : 'proyectos'}`}
          </Typography>
        </Box>
      </Box>

      {/* Grid */}
      {loading ? (
        <Grid container spacing={2}>
          {[1,2,3,4,5,6].map(i => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={i}>
              <Skeleton variant="rounded" height={240} sx={{ borderRadius: 1.5 }} />
            </Grid>
          ))}
        </Grid>
      ) : vista === 'constructores' ? (
        constructores.length === 0 ? (
          <Box sx={{ bgcolor: '#fff', border: '1px solid #E2E8F0', borderRadius: '10px', py: 12, textAlign: 'center' }}>
            <Box sx={{ width: 56, height: 56, borderRadius: '14px', bgcolor: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 1.5 }}>
              <BusinessIcon sx={{ fontSize: 26, color: '#94A3B8' }} />
            </Box>
            <Typography fontWeight={600} color="text.primary" fontSize={14} gutterBottom>Sin resultados</Typography>
            <Typography color="text.secondary" fontSize={13}>
              No se encontraron constructores con esos criterios.
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={2}>
            {constructores.map(c => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={c.id}>
                <ConstructorCard perfil={c} onVerPerfil={handleVerPerfil} />
              </Grid>
            ))}
          </Grid>
        )
      ) : (
        proyectos.length === 0 ? (
          <Box sx={{ bgcolor: '#fff', border: '1px solid #E2E8F0', borderRadius: '10px', py: 12, textAlign: 'center' }}>
            <Box sx={{ width: 56, height: 56, borderRadius: '14px', bgcolor: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 1.5 }}>
              <PersonIcon sx={{ fontSize: 26, color: '#94A3B8' }} />
            </Box>
            <Typography fontWeight={600} color="text.primary" fontSize={14} gutterBottom>Sin proyectos disponibles</Typography>
            <Typography color="text.secondary" fontSize={13}>
              No hay proyectos publicados con esos criterios.
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={2}>
            {proyectos.map(p => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={p.id}>
                <ProyectoCard proyecto={p} esConstructor={esConstructor}
                  onEnviarPropuesta={handleEnviarPropuesta} />
              </Grid>
            ))}
          </Grid>
        )
      )}
    </Box>
  );
}
