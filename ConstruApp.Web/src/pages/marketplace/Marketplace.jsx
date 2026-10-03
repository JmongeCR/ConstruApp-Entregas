import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Grid, Card, CardContent, CardActions,
  Button, Chip, TextField, InputAdornment, Select, MenuItem,
  FormControl, InputLabel, Avatar, Rating, Skeleton, Divider,
  ToggleButton, ToggleButtonGroup, Drawer, IconButton, Slider,
  FormControlLabel, Checkbox, Stack, Dialog, DialogTitle,
  DialogContent, DialogActions, Collapse, Tooltip, useTheme,
  useMediaQuery, Badge,
} from '@mui/material';
import SearchIcon            from '@mui/icons-material/Search';
import VerifiedIcon          from '@mui/icons-material/Verified';
import LocationOnIcon        from '@mui/icons-material/LocationOn';
import WorkIcon              from '@mui/icons-material/Work';
import SendIcon              from '@mui/icons-material/Send';
import BusinessIcon          from '@mui/icons-material/Business';
import PersonIcon            from '@mui/icons-material/Person';
import FilterListIcon        from '@mui/icons-material/FilterList';
import CloseIcon             from '@mui/icons-material/Close';
import TuneIcon              from '@mui/icons-material/Tune';
import CompareArrowsIcon     from '@mui/icons-material/CompareArrows';
import StarIcon              from '@mui/icons-material/Star';
import AutoAwesomeIcon       from '@mui/icons-material/AutoAwesome';
import GroupsIcon            from '@mui/icons-material/Groups';
import ExpandMoreIcon        from '@mui/icons-material/ExpandMore';
import ExpandLessIcon        from '@mui/icons-material/ExpandLess';
import { perfilesConstructorApi, proyectosApi } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';

/* ── Constantes ────────────────────────────────────────────────────── */
const ACCENT = '#2563EB';

const PROVINCIAS = ['Todas','San José','Alajuela','Cartago','Heredia','Guanacaste','Puntarenas','Limón'];

const CANTONES_CR = [
  'Todos','San José','Escazú','Desamparados','Puriscal','Tarrazú','Aserrí','Mora','Goicoechea',
  'Santa Ana','Alajuelita','Vásquez de Coronado','Acosta','Tibás','Moravia','Montes de Oca',
  'Dota','Curridabat','Pérez Zeledón','León Cortés',
  'Alajuela','San Ramón','Grecia','San Mateo','Atenas','Naranjo','Palmares','Poás',
  'Orotina','San Carlos','Zarcero','Upala','Los Chiles','Guatuso',
  'Cartago','Paraíso','La Unión','Jiménez','Turrialba','Alvarado','Oreamuno','El Guarco',
  'Heredia','Barva','Santo Domingo','Santa Bárbara','San Rafael','San Isidro','Belén',
  'Flores','San Pablo','Sarapiquí',
  'Liberia','Nicoya','Santa Cruz','Bagaces','Carrillo','Cañas','Abangares','Tilarán',
  'Nandayure','La Cruz','Hojancha',
  'Puntarenas','Esparza','Buenos Aires','Montes de Oro','Osa','Quepos','Golfito',
  'Coto Brus','Parrita','Corredores','Garabito',
  'Limón','Pococí','Siquirres','Talamanca','Matina','Guácimo',
];

const ESPECIALIDADES_COMUNES = [
  '','Remodelación','Obra gris','Eléctrico','Plomería','Pintura','Pisos','Techos',
  'Piscinas','Jardines','Demolición','Estructuras metálicas','Enchapes',
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

const TIPO_LABEL = {
  Remodelacion:'Remodelación', ObraGris:'Obra gris',
  ElectricoPlomeria:'Eléctrico / Plomería', Pintura:'Pintura',
  Pisos:'Pisos', Techos:'Techos', PiscinaJardin:'Piscina / Jardín', Otro:'Otro',
};

const AVATAR_PALETTE = ['#4F46E5','#0EA5E9','#10B981','#2563EB','#7C3AED','#DB2777'];
const avatarBg = (name) => AVATAR_PALETTE[(name?.charCodeAt(0) ?? 0) % AVATAR_PALETTE.length];

const FILTROS_INIT = {
  busqueda: '', provincia: 'Todas', canton: 'Todos',
  especialidad: '', soloVerificados: false, calificacionMin: 0, aniosExpMin: 0,
};

const activeCount = (f) => [
  f.busqueda, f.provincia !== 'Todas', f.canton !== 'Todos',
  f.especialidad, f.soloVerificados, f.calificacionMin > 0, f.aniosExpMin > 0,
].filter(Boolean).length;

/* ── Match score para recomendadas ─────────────────────────────────── */
function calcMatch(constructor, misProyectos) {
  if (!misProyectos?.length) return null;
  const proj = misProyectos.find(p => p.estado === 'Publicado') || misProyectos[0];
  if (!proj) return null;
  let score = 0;
  const especialidades = (constructor.especialidades || '').toLowerCase();
  const zonas = (constructor.zonasCobertura || '').toLowerCase();
  const tipoLabel = (TIPO_LABEL[proj.tipoProyecto] || '').toLowerCase();
  if (tipoLabel && especialidades.includes(tipoLabel.split(' ')[0])) score += 40;
  if (proj.provincia && zonas.includes(proj.provincia.toLowerCase())) score += 35;
  if (constructor.verificado) score += 15;
  if ((constructor.calificacionPromedio || 0) >= 4) score += 10;
  return Math.min(score, 100);
}

/* ── Panel de filtros ──────────────────────────────────────────────── */
function FilterPanel({ filtros, onChange, onReset, extraEspecialidades }) {
  const set = (key) => (e) => onChange({ ...filtros, [key]: e.target.value });

  const especialidades = [...new Set([...ESPECIALIDADES_COMUNES, ...extraEspecialidades])];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography fontWeight={700} fontSize={13} color="text.primary">Filtros</Typography>
        {activeCount(filtros) > 0 && (
          <Button size="small" sx={{ fontSize: 12, color: '#EF4444', p: 0, minWidth: 0 }}
            onClick={onReset}>
            Limpiar todo
          </Button>
        )}
      </Box>

      <TextField size="small" fullWidth label="Buscar empresa o especialidad"
        value={filtros.busqueda} onChange={set('busqueda')}
        slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 16, color: 'text.disabled' }} /></InputAdornment> } }}
      />

      <FormControl size="small" fullWidth>
        <InputLabel>Especialidad</InputLabel>
        <Select value={filtros.especialidad} onChange={set('especialidad')} label="Especialidad">
          {especialidades.map(e => (
            <MenuItem key={e} value={e} sx={{ fontSize: 13 }}>{e || 'Todas'}</MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl size="small" fullWidth>
        <InputLabel>Provincia</InputLabel>
        <Select value={filtros.provincia} onChange={set('provincia')} label="Provincia">
          {PROVINCIAS.map(p => <MenuItem key={p} value={p} sx={{ fontSize: 13 }}>{p}</MenuItem>)}
        </Select>
      </FormControl>

      <FormControl size="small" fullWidth>
        <InputLabel>Cantón</InputLabel>
        <Select value={filtros.canton} onChange={set('canton')} label="Cantón">
          {CANTONES_CR.map(c => <MenuItem key={c} value={c} sx={{ fontSize: 13 }}>{c}</MenuItem>)}
        </Select>
      </FormControl>

      <Divider />

      <FormControlLabel
        control={
          <Checkbox checked={filtros.soloVerificados}
            onChange={e => onChange({ ...filtros, soloVerificados: e.target.checked })}
            size="small" />
        }
        label={<Typography fontSize={13}>Solo verificadas</Typography>}
        sx={{ m: 0 }}
      />

      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography fontSize={12.5} color="text.secondary">Calificación mínima</Typography>
          <Typography fontSize={12} fontWeight={600} color="primary.main">
            {filtros.calificacionMin > 0 ? `${filtros.calificacionMin}★` : 'Todas'}
          </Typography>
        </Box>
        <Rating
          value={filtros.calificacionMin}
          onChange={(_, v) => onChange({ ...filtros, calificacionMin: v ?? 0 })}
          size="small"
        />
      </Box>

      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography fontSize={12.5} color="text.secondary">Experiencia mínima</Typography>
          <Typography fontSize={12} fontWeight={600} color="primary.main">
            {filtros.aniosExpMin > 0 ? `${filtros.aniosExpMin}+ años` : 'Todos'}
          </Typography>
        </Box>
        <Slider
          value={filtros.aniosExpMin}
          onChange={(_, v) => onChange({ ...filtros, aniosExpMin: v })}
          min={0} max={20} step={5}
          marks={[{value:0,label:'0'},{value:5,label:'5'},{value:10,label:'10'},{value:15,label:'15'},{value:20,label:'20+'}]}
          size="small"
          sx={{ '& .MuiSlider-markLabel': { fontSize: 10 } }}
        />
      </Box>
    </Box>
  );
}

/* ── Chips de filtros activos ─────────────────────────────────────── */
function ActiveChips({ filtros, onChange }) {
  const chips = [];
  if (filtros.busqueda) chips.push({ key:'busqueda', label:`"${filtros.busqueda}"`, clear: () => onChange({...filtros,busqueda:''}) });
  if (filtros.especialidad) chips.push({ key:'esp', label:filtros.especialidad, clear: () => onChange({...filtros,especialidad:''}) });
  if (filtros.provincia !== 'Todas') chips.push({ key:'prov', label:filtros.provincia, clear: () => onChange({...filtros,provincia:'Todas',canton:'Todos'}) });
  if (filtros.canton !== 'Todos') chips.push({ key:'cant', label:filtros.canton, clear: () => onChange({...filtros,canton:'Todos'}) });
  if (filtros.soloVerificados) chips.push({ key:'ver', label:'Verificadas', clear: () => onChange({...filtros,soloVerificados:false}) });
  if (filtros.calificacionMin > 0) chips.push({ key:'cal', label:`${filtros.calificacionMin}★ mín`, clear: () => onChange({...filtros,calificacionMin:0}) });
  if (filtros.aniosExpMin > 0) chips.push({ key:'exp', label:`${filtros.aniosExpMin}+ años`, clear: () => onChange({...filtros,aniosExpMin:0}) });
  if (!chips.length) return null;
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 2 }}>
      {chips.map(c => (
        <Chip key={c.key} label={c.label} size="small" onDelete={c.clear}
          sx={{ bgcolor:'#EFF6FF', color: ACCENT, border:`1px solid #BFDBFE`, fontWeight:500, fontSize:12 }} />
      ))}
    </Box>
  );
}

/* ── Tarjeta de constructor ────────────────────────────────────────── */
function ConstructorCard({ perfil, onVerPerfil, onInvitar, enComparando, onToggleComparar, puedoComparar }) {
  const especialidades = perfil.especialidades?.split(',').map(s => s.trim()).filter(Boolean) ?? [];
  const bg = avatarBg(perfil.nombreEmpresa);

  return (
    <Card elevation={0} sx={{
      height:'100%', display:'flex', flexDirection:'column',
      border: enComparando ? `2px solid ${ACCENT}` : '1px solid #E8EDF3',
      borderRadius:'12px',
      transition:'all .18s ease',
      '&:hover': { borderColor:'rgba(37,99,235,0.25)', boxShadow:'0 8px 28px rgba(37,99,235,0.08)', transform:'translateY(-2px)' },
    }}>
      <CardContent sx={{ flex:1, p:2.5 }}>
        {/* Header */}
        <Box sx={{ display:'flex', alignItems:'flex-start', gap:1.5, mb:1.5 }}>
          <Avatar sx={{ width:44, height:44, bgcolor:bg, fontWeight:700, fontSize:18, flexShrink:0 }}>
            {perfil.nombreEmpresa?.[0]?.toUpperCase()}
          </Avatar>
          <Box sx={{ flex:1, minWidth:0 }}>
            <Box sx={{ display:'flex', alignItems:'center', gap:0.5 }}>
              <Typography fontWeight={700} fontSize={13.5} noWrap sx={{ flex:1 }}>
                {perfil.nombreEmpresa}
              </Typography>
              {perfil.verificado && (
                <Tooltip title="Empresa verificada por ConstruApp">
                  <VerifiedIcon sx={{ color:ACCENT, fontSize:15, flexShrink:0 }} />
                </Tooltip>
              )}
            </Box>
            <Box sx={{ display:'flex', alignItems:'center', gap:0.75, mt:0.25 }}>
              <Rating value={perfil.calificacionPromedio || 0} precision={0.5} size="small" readOnly />
              <Typography fontSize={12} fontWeight={600}>
                {perfil.calificacionPromedio?.toFixed(1) || '—'}
              </Typography>
              {perfil.totalProyectos > 0 && (
                <Typography fontSize={11.5} color="text.secondary">· {perfil.totalProyectos} proy.</Typography>
              )}
            </Box>
          </Box>
          {/* Comparar toggle */}
          <Tooltip title={enComparando ? 'Quitar de comparación' : (puedoComparar ? 'Agregar para comparar' : 'Máximo 3 empresas')}>
            <span>
              <Checkbox
                checked={enComparando}
                disabled={!enComparando && !puedoComparar}
                onChange={() => onToggleComparar(perfil)}
                size="small"
                sx={{ p:0.25 }}
                icon={<Box sx={{ width:18, height:18, border:'1.5px solid #CBD5E1', borderRadius:'4px' }} />}
                checkedIcon={<Box sx={{ width:18, height:18, bgcolor:ACCENT, borderRadius:'4px',
                  display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <Box sx={{ width:10, height:10, bgcolor:'white', borderRadius:'2px' }} />
                </Box>}
              />
            </span>
          </Tooltip>
        </Box>

        {/* Descripción */}
        {perfil.bio && (
          <Typography fontSize={12.5} color="text.secondary" sx={{
            mb:1.5, display:'-webkit-box', WebkitLineClamp:2,
            WebkitBoxOrient:'vertical', overflow:'hidden', lineHeight:1.55,
          }}>
            {perfil.bio}
          </Typography>
        )}

        {/* Especialidades */}
        {especialidades.length > 0 && (
          <Box sx={{ display:'flex', flexWrap:'wrap', gap:0.5, mb:1.5 }}>
            {especialidades.slice(0,3).map(e => (
              <Chip key={e} label={e} size="small"
                sx={{ bgcolor:'#EFF6FF', color:'#1D4ED8', fontSize:11, fontWeight:500, borderRadius:'4px' }} />
            ))}
            {especialidades.length > 3 && (
              <Chip label={`+${especialidades.length-3}`} size="small"
                sx={{ bgcolor:'#F3F4F6', color:'#6B7280', fontSize:11 }} />
            )}
          </Box>
        )}

        {/* Meta */}
        <Box sx={{ display:'flex', gap:2, flexWrap:'wrap' }}>
          {perfil.zonasCobertura && (
            <Box sx={{ display:'flex', alignItems:'center', gap:0.4 }}>
              <LocationOnIcon sx={{ fontSize:12, color:'text.disabled' }} />
              <Typography fontSize={11.5} color="text.secondary" noWrap sx={{ maxWidth:100 }}>
                {perfil.zonasCobertura}
              </Typography>
            </Box>
          )}
          {perfil.aniosExperiencia > 0 && (
            <Box sx={{ display:'flex', alignItems:'center', gap:0.4 }}>
              <WorkIcon sx={{ fontSize:12, color:'text.disabled' }} />
              <Typography fontSize={11.5} color="text.secondary">{perfil.aniosExperiencia} años</Typography>
            </Box>
          )}
        </Box>
      </CardContent>

      <CardActions sx={{ px:2, pb:2, pt:0.5, gap:1 }}>
        <Button size="small" variant="outlined" onClick={() => onVerPerfil(perfil)}
          sx={{ flex:1, fontSize:12, fontWeight:600, borderColor:'#CBD5E1', color:'text.primary',
            '&:hover': { borderColor: ACCENT, color: ACCENT, bgcolor: '#EFF6FF' } }}>
          Ver Perfil
        </Button>
        <Button size="small" variant="contained" startIcon={<SendIcon sx={{ fontSize:13 }} />}
          onClick={() => onInvitar(perfil)}
          sx={{ flex:1, fontSize:12, fontWeight:700, bgcolor:ACCENT,
            '&:hover': { bgcolor:'#1D4ED8' }, boxShadow:'none' }}>
          Invitar
        </Button>
      </CardActions>
    </Card>
  );
}

/* ── Tarjeta de constructor — versión recomendada (con badge %) ─────── */
function RecomendadaCard({ perfil, matchPct, onVerPerfil, onInvitar }) {
  const especialidades = perfil.especialidades?.split(',').map(s => s.trim()).filter(Boolean) ?? [];
  const bg = avatarBg(perfil.nombreEmpresa);
  return (
    <Card elevation={0} sx={{
      width: { xs:260, sm:280 }, flexShrink:0,
      border:'1px solid #E8EDF3', borderRadius:'12px',
      transition:'all .18s ease',
      '&:hover': { borderColor:'rgba(37,99,235,0.2)', boxShadow:'0 8px 28px rgba(37,99,235,0.08)', transform:'translateY(-2px)' },
    }}>
      <CardContent sx={{ p:2 }}>
        {/* Match badge */}
        <Box sx={{ display:'flex', justifyContent:'space-between', mb:1.5 }}>
          <Box sx={{ display:'flex', gap:0.6, alignItems:'center' }}>
            <AutoAwesomeIcon sx={{ fontSize:13, color:'#F59E0B' }} />
            <Typography fontSize={11.5} fontWeight={700} sx={{ color:'#92400E' }}>
              {matchPct}% coincidencia
            </Typography>
          </Box>
          {perfil.verificado && (
            <Chip icon={<VerifiedIcon sx={{ fontSize:'11px !important', color:`${ACCENT} !important` }} />}
              label="Verificada" size="small"
              sx={{ bgcolor:'#EFF6FF', color:ACCENT, fontSize:10, fontWeight:600, border:`1px solid #BFDBFE`, height:20 }} />
          )}
        </Box>
        <Box sx={{ display:'flex', alignItems:'center', gap:1.25, mb:1 }}>
          <Avatar sx={{ width:40, height:40, bgcolor:bg, fontWeight:700, fontSize:16, flexShrink:0 }}>
            {perfil.nombreEmpresa?.[0]?.toUpperCase()}
          </Avatar>
          <Box sx={{ flex:1, minWidth:0 }}>
            <Typography fontWeight={700} fontSize={13} noWrap>{perfil.nombreEmpresa}</Typography>
            <Box sx={{ display:'flex', alignItems:'center', gap:0.5, mt:0.15 }}>
              <Rating value={perfil.calificacionPromedio || 0} precision={0.5} size="small" readOnly />
              <Typography fontSize={11.5} fontWeight={600}>{perfil.calificacionPromedio?.toFixed(1) || '—'}</Typography>
            </Box>
          </Box>
        </Box>
        {especialidades.length > 0 && (
          <Box sx={{ display:'flex', flexWrap:'wrap', gap:0.4, mb:1 }}>
            {especialidades.slice(0,2).map(e => (
              <Chip key={e} label={e} size="small"
                sx={{ bgcolor:'#F0FDF4', color:'#166534', fontSize:10, fontWeight:500, borderRadius:'4px', height:19 }} />
            ))}
          </Box>
        )}
        {perfil.zonasCobertura && (
          <Box sx={{ display:'flex', alignItems:'center', gap:0.4 }}>
            <LocationOnIcon sx={{ fontSize:11, color:'text.disabled' }} />
            <Typography fontSize={11} color="text.secondary" noWrap>{perfil.zonasCobertura}</Typography>
          </Box>
        )}
      </CardContent>
      <CardActions sx={{ px:2, pb:2, pt:0, gap:0.75 }}>
        <Button size="small" variant="outlined" onClick={() => onVerPerfil(perfil)}
          sx={{ flex:1, fontSize:11.5, fontWeight:600, borderColor:'#CBD5E1', color:'text.primary',
            '&:hover': { borderColor:ACCENT, color:ACCENT, bgcolor:'#EFF6FF' } }}>
          Ver Perfil
        </Button>
        <Button size="small" variant="contained" onClick={() => onInvitar(perfil)}
          sx={{ flex:1, fontSize:11.5, fontWeight:700, bgcolor:ACCENT,
            '&:hover': { bgcolor:'#1D4ED8' }, boxShadow:'none' }}>
          Invitar
        </Button>
      </CardActions>
    </Card>
  );
}

/* ── Modal Invitar a Cotizar ────────────────────────────────────────── */
function InvitarModal({ perfil, open, onClose }) {
  if (!perfil) return null;
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight:700, pb:1 }}>Invitar a cotizar</DialogTitle>
      <Divider />
      <DialogContent sx={{ pt:2.5 }}>
        <Box sx={{ display:'flex', alignItems:'center', gap:1.5, mb:2 }}>
          <Avatar sx={{ bgcolor:avatarBg(perfil.nombreEmpresa), width:44, height:44, fontWeight:700 }}>
            {perfil.nombreEmpresa?.[0]?.toUpperCase()}
          </Avatar>
          <Box>
            <Typography fontWeight={700} fontSize={14}>{perfil.nombreEmpresa}</Typography>
            {perfil.verificado && (
              <Chip icon={<VerifiedIcon sx={{ fontSize:'11px !important' }} />}
                label="Verificada" size="small"
                sx={{ bgcolor:'#EFF6FF', color:ACCENT, fontSize:10, fontWeight:600, height:20 }} />
            )}
          </Box>
        </Box>
        <Typography fontSize={13.5} color="text.secondary" mb={2}>
          Contactá directamente a esta empresa para invitarla a cotizar tu proyecto:
        </Typography>
        {perfil.telefono && (
          <Box sx={{ display:'flex', alignItems:'center', gap:1, mb:1 }}>
            <Typography fontSize={12} color="text.secondary" fontWeight={600}>Teléfono:</Typography>
            <Typography fontSize={13} fontWeight={700} color="text.primary">{perfil.telefono}</Typography>
          </Box>
        )}
        {perfil.emailContacto && (
          <Box sx={{ display:'flex', alignItems:'center', gap:1, mb:1 }}>
            <Typography fontSize={12} color="text.secondary" fontWeight={600}>Correo:</Typography>
            <Typography fontSize={13} fontWeight={700} color="text.primary">{perfil.emailContacto}</Typography>
          </Box>
        )}
        {!perfil.telefono && !perfil.emailContacto && (
          <Typography fontSize={13} color="text.disabled">
            Esta empresa no ha publicado datos de contacto. Podés ver su perfil completo para más información.
          </Typography>
        )}
      </DialogContent>
      <Divider />
      <DialogActions sx={{ px:3, py:2 }}>
        <Button onClick={onClose} color="inherit">Cerrar</Button>
        <Button variant="contained" onClick={() => { /* navigate to profile handled by caller */ onClose(); }}
          sx={{ bgcolor:ACCENT, '&:hover': { bgcolor:'#1D4ED8' } }}>
          Ver perfil completo
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/* ── Modal Comparar ─────────────────────────────────────────────────── */
function ComparadorModal({ empresas, open, onClose, onVerPerfil }) {
  if (!empresas.length) return null;

  const campos = [
    { label:'Calificación',   get: c => c.calificacionPromedio?.toFixed(1) || '—' },
    { label:'Proyectos',      get: c => c.totalProyectos ?? '—' },
    { label:'Experiencia',    get: c => c.aniosExperiencia ? `${c.aniosExperiencia} años` : '—' },
    { label:'Especialidades', get: c => c.especialidades || '—' },
    { label:'Cobertura',      get: c => c.zonasCobertura || '—' },
    { label:'Verificada',     get: c => c.verificado ? '✓ Sí' : 'No' },
  ];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight:700 }}>
        Comparar empresas
        <IconButton onClick={onClose} sx={{ position:'absolute', right:12, top:12, color:'text.secondary' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ p:0, overflowX:'auto' }}>
        <Box sx={{ minWidth:480 }}>
          {/* Empresa headers */}
          <Box sx={{ display:'grid', gridTemplateColumns:`140px repeat(${empresas.length}, 1fr)`,
            bgcolor:'#F8FAFC', borderBottom:'1px solid #E2E8F0' }}>
            <Box sx={{ p:2 }} />
            {empresas.map(e => (
              <Box key={e.id} sx={{ p:2, textAlign:'center', borderLeft:'1px solid #E2E8F0' }}>
                <Avatar sx={{ width:40, height:40, bgcolor:avatarBg(e.nombreEmpresa),
                  fontWeight:700, mx:'auto', mb:1, fontSize:16 }}>
                  {e.nombreEmpresa?.[0]?.toUpperCase()}
                </Avatar>
                <Typography fontWeight={700} fontSize={12.5} sx={{ lineHeight:1.3 }}>
                  {e.nombreEmpresa}
                </Typography>
                {e.verificado && (
                  <VerifiedIcon sx={{ color:ACCENT, fontSize:14, mt:0.25 }} />
                )}
              </Box>
            ))}
          </Box>

          {/* Filas de comparación */}
          {campos.map((campo, i) => (
            <Box key={campo.label} sx={{
              display:'grid', gridTemplateColumns:`140px repeat(${empresas.length}, 1fr)`,
              bgcolor: i % 2 === 0 ? '#fff' : '#FAFBFC',
              borderBottom:'1px solid #F1F5F9',
            }}>
              <Box sx={{ p:2, display:'flex', alignItems:'center' }}>
                <Typography fontSize={12.5} fontWeight={600} color="text.secondary">
                  {campo.label}
                </Typography>
              </Box>
              {empresas.map(e => (
                <Box key={e.id} sx={{ p:2, textAlign:'center', borderLeft:'1px solid #F1F5F9',
                  display:'flex', alignItems:'center', justifyContent:'center' }}>
                  {campo.label === 'Calificación' ? (
                    <Box sx={{ display:'flex', alignItems:'center', gap:0.5 }}>
                      <StarIcon sx={{ color:'#F59E0B', fontSize:14 }} />
                      <Typography fontSize={13} fontWeight={700}>{campo.get(e)}</Typography>
                    </Box>
                  ) : (
                    <Typography fontSize={12.5} color="text.secondary" textAlign="center">
                      {campo.get(e)}
                    </Typography>
                  )}
                </Box>
              ))}
            </Box>
          ))}
        </Box>
      </DialogContent>
      <Divider />
      <DialogActions sx={{ px:3, py:2 }}>
        <Button onClick={onClose} color="inherit">Cerrar</Button>
        {empresas.length === 1 && (
          <Button variant="contained" onClick={() => { onVerPerfil(empresas[0]); onClose(); }}
            sx={{ bgcolor:ACCENT, '&:hover':{ bgcolor:'#1D4ED8' } }}>
            Ver perfil
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

/* ── Proyectos card (Constructor view) ─────────────────────────────── */
function ProyectoCard({ proyecto, onEnviarPropuesta }) {
  return (
    <Card elevation={0} sx={{
      height:'100%', display:'flex', flexDirection:'column',
      border:'1px solid #E8EDF3', borderRadius:'12px',
      transition:'all .18s ease',
      '&:hover': { borderColor:'rgba(37,99,235,0.2)', boxShadow:'0 8px 28px rgba(37,99,235,0.08)', transform:'translateY(-2px)' },
    }}>
      <CardContent sx={{ flex:1, p:2.5 }}>
        <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', mb:1.25 }}>
          <Chip label={TIPO_LABEL[proyecto.tipoProyecto] || proyecto.tipoProyecto}
            size="small" sx={{ bgcolor:'#EFF6FF', color:'#1D4ED8', fontWeight:600, fontSize:11 }} />
          {proyecto.presupuestoMax && (
            <Typography fontSize={12} fontWeight={700} sx={{ color:'#065F46' }}>
              ₡{(proyecto.presupuestoMax/1e6).toFixed(1)}M máx.
            </Typography>
          )}
        </Box>
        <Typography fontWeight={600} fontSize={13.5} color="text.primary" gutterBottom sx={{
          display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden',
        }}>
          {proyecto.titulo}
        </Typography>
        <Typography fontSize={12.5} color="text.secondary" sx={{
          mb:1.75, display:'-webkit-box', WebkitLineClamp:2,
          WebkitBoxOrient:'vertical', overflow:'hidden', lineHeight:1.55,
        }}>
          {proyecto.descripcion}
        </Typography>
        <Box sx={{ display:'flex', alignItems:'center', gap:0.4 }}>
          <LocationOnIcon sx={{ fontSize:12, color:'text.disabled' }} />
          <Typography fontSize={12} color="text.secondary">
            {[proyecto.canton, proyecto.provincia].filter(Boolean).join(', ')}
          </Typography>
        </Box>
      </CardContent>
      <CardActions sx={{ px:2, pb:2, pt:0.5 }}>
        <Button variant="contained" size="small" fullWidth startIcon={<SendIcon sx={{ fontSize:14 }} />}
          onClick={() => onEnviarPropuesta(proyecto)}
          sx={{ fontSize:12.5, fontWeight:700, bgcolor:'#1B3B7A', '&:hover':{ bgcolor:'#0f2a5e' }, boxShadow:'none' }}>
          Enviar propuesta
        </Button>
      </CardActions>
    </Card>
  );
}

/* ══ Componente principal ════════════════════════════════════════════ */
export default function Marketplace() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile  = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet  = useMediaQuery(theme.breakpoints.down('md'));
  const { usuario } = useAuth();
  const esConstructor = usuario?.rol === 'Constructor';

  /* ── Estado global ─────────────────────────────────────────────── */
  const [constructores, setConstr] = useState([]);
  const [proyectos, setProyectos]  = useState([]);
  const [misProyectos, setMisProy] = useState([]);
  const [loading, setLoading]      = useState(true);
  const [filtros, setFiltros]      = useState(FILTROS_INIT);
  const [drawerOpen, setDrawer]    = useState(false);
  const [panelOpen, setPanelOpen]  = useState(true);
  const [comparando, setComparando] = useState([]); // max 3 IDs
  const [comparadorOpen, setComparadorOpen] = useState(false);
  const [invitarPerfil, setInvitarPerfil]   = useState(null);
  /* Vista Constructor */
  const [vistaConst, setVistaConst] = useState('proyectos');
  const [buscarConst, setBuscarConst] = useState('');
  const [provinciaConst, setProvConst] = useState('Todas');
  const [tipoConst, setTipoConst]     = useState('');
  const [cantonConst, setCantonConst] = useState('Todos');

  /* ── Carga de datos ──────────────────────────────────────────────── */
  useEffect(() => {
    setLoading(true);
    if (esConstructor) {
      proyectosApi.getPublicados({
        ...(provinciaConst !== 'Todas' && { provincia: provinciaConst }),
        ...(tipoConst && { tipo: tipoConst }),
        ...(buscarConst && { buscar: buscarConst }),
        ...(cantonConst !== 'Todos' && { canton: cantonConst }),
      }).then(r => setProyectos(r.data)).catch(() => {}).finally(() => setLoading(false));
    } else {
      Promise.all([
        perfilesConstructorApi.getAll().then(r => setConstr(r.data)).catch(() => {}),
        proyectosApi.getMios().then(r => setMisProy(r.data)).catch(() => {}),
      ]).finally(() => setLoading(false));
    }
  }, [esConstructor, provinciaConst, tipoConst, buscarConst, cantonConst]);

  /* ── Filtrado client-side (directorio) ──────────────────────────── */
  const constructoresFiltrados = useMemo(() => {
    return constructores.filter(c => {
      if (filtros.soloVerificados && !c.verificado) return false;
      if (filtros.calificacionMin > 0 && (c.calificacionPromedio || 0) < filtros.calificacionMin) return false;
      if (filtros.aniosExpMin > 0 && (c.aniosExperiencia || 0) < filtros.aniosExpMin) return false;
      if (filtros.busqueda) {
        const q = filtros.busqueda.toLowerCase();
        const match = (c.nombreEmpresa||'').toLowerCase().includes(q)
          || (c.especialidades||'').toLowerCase().includes(q)
          || (c.zonasCobertura||'').toLowerCase().includes(q)
          || (c.bio||'').toLowerCase().includes(q);
        if (!match) return false;
      }
      if (filtros.especialidad && !(c.especialidades||'').toLowerCase().includes(filtros.especialidad.toLowerCase())) return false;
      if (filtros.provincia !== 'Todas' && !(c.zonasCobertura||'').toLowerCase().includes(filtros.provincia.toLowerCase())) return false;
      if (filtros.canton !== 'Todos' && !(c.zonasCobertura||'').toLowerCase().includes(filtros.canton.toLowerCase())) return false;
      return true;
    });
  }, [constructores, filtros]);

  /* ── Recomendadas (top 4 con score > 0) ─────────────────────────── */
  const recomendadas = useMemo(() => {
    if (!misProyectos.length) return [];
    return constructores
      .map(c => ({ ...c, matchPct: calcMatch(c, misProyectos) }))
      .filter(c => (c.matchPct || 0) > 0)
      .sort((a,b) => (b.matchPct||0) - (a.matchPct||0))
      .slice(0,4);
  }, [constructores, misProyectos]);

  /* ── Especialidades derivadas del dataset ───────────────────────── */
  const extraEspecialidades = useMemo(() => {
    const all = constructores.flatMap(c =>
      (c.especialidades||'').split(',').map(s=>s.trim()).filter(Boolean)
    );
    return [...new Set(all)];
  }, [constructores]);

  /* ── Empresas seleccionadas para comparar ───────────────────────── */
  const empresasComparando = useMemo(
    () => constructores.filter(c => comparando.includes(c.id)),
    [constructores, comparando]
  );

  /* ── Handlers ─────────────────────────────────────────────────────── */
  const handleVerPerfil    = (perfil) => navigate(`/constructor/${perfil.id}`);
  const handleInvitar      = (perfil) => setInvitarPerfil(perfil);
  const handleEnviarProp   = (proy)   => navigate(`/mis-propuestas?proyectoId=${proy.id}`);

  const toggleComparar = (perfil) => {
    setComparando(prev =>
      prev.includes(perfil.id)
        ? prev.filter(id => id !== perfil.id)
        : prev.length < 3 ? [...prev, perfil.id] : prev
    );
  };

  const nFiltros = activeCount(filtros);
  const filterPanel = (
    <FilterPanel
      filtros={filtros}
      onChange={setFiltros}
      onReset={() => setFiltros(FILTROS_INIT)}
      extraEspecialidades={extraEspecialidades}
    />
  );

  /* ══ Vista Constructor ════════════════════════════════════════════ */
  if (esConstructor) {
    return (
      <Box>
        <Box sx={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', mb:3 }}>
          <Box>
            <Typography variant="h5" fontWeight={800} color="text.primary" mb={0.25}>Marketplace</Typography>
            <Typography variant="body2" color="text.secondary">
              {loading ? '...' : `${proyectos.length} proyecto${proyectos.length!==1?'s':''} disponible${proyectos.length!==1?'s':''}`}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ bgcolor:'#fff', border:'1px solid #E2E8F0', borderRadius:'10px',
          px:2, py:1.5, mb:2.5, display:'flex', alignItems:'center', gap:1.5, flexWrap:'wrap' }}>
          <FilterListIcon sx={{ fontSize:17, color:'text.disabled', flexShrink:0 }} />
          <TextField size="small" placeholder="Buscar..." value={buscarConst}
            onChange={e=>setBuscarConst(e.target.value)}
            slotProps={{ input: { startAdornment:<InputAdornment position="start"><SearchIcon sx={{ fontSize:16, color:'text.disabled' }} /></InputAdornment> } }}
            sx={{ width:220 }} />
          <FormControl size="small" sx={{ minWidth:140 }}>
            <Select value={provinciaConst} displayEmpty onChange={e=>setProvConst(e.target.value)}>
              {PROVINCIAS.map(p=><MenuItem key={p} value={p} sx={{ fontSize:13 }}>{p}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth:170 }}>
            <Select value={tipoConst} displayEmpty onChange={e=>setTipoConst(e.target.value)}>
              {TIPOS_PROYECTO.map(t=><MenuItem key={t.value} value={t.value} sx={{ fontSize:13 }}>{t.label}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth:160 }}>
            <Select value={cantonConst} displayEmpty onChange={e=>setCantonConst(e.target.value)}>
              {CANTONES_CR.map(c=><MenuItem key={c} value={c} sx={{ fontSize:13 }}>{c}</MenuItem>)}
            </Select>
          </FormControl>
          <Box sx={{ ml:'auto' }}>
            <Typography fontSize={12.5} color="text.secondary" fontWeight={500}>
              {loading ? '...' : `${proyectos.length} proyectos`}
            </Typography>
          </Box>
        </Box>

        {loading ? (
          <Grid container spacing={2}>
            {[1,2,3,4,5,6].map(i=>(
              <Grid size={{ xs:12, sm:6, md:4 }} key={i}>
                <Skeleton variant="rounded" height={240} sx={{ borderRadius:1.5 }} />
              </Grid>
            ))}
          </Grid>
        ) : proyectos.length === 0 ? (
          <Box sx={{ bgcolor:'#fff', border:'1px solid #E2E8F0', borderRadius:'10px', py:12, textAlign:'center' }}>
            <PersonIcon sx={{ fontSize:40, color:'#94A3B8', mb:1.5 }} />
            <Typography fontWeight={600} color="text.primary" fontSize={14} gutterBottom>Sin proyectos disponibles</Typography>
            <Typography color="text.secondary" fontSize={13}>No hay proyectos publicados con esos criterios.</Typography>
          </Box>
        ) : (
          <Grid container spacing={2}>
            {proyectos.map(p=>(
              <Grid size={{ xs:12, sm:6, md:4 }} key={p.id}>
                <ProyectoCard proyecto={p} onEnviarPropuesta={handleEnviarProp} />
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    );
  }

  /* ══ Vista Cliente / Admin — Directorio ══════════════════════════ */
  return (
    <Box>
      {/* ── Encabezado ─────────────────────────────────────────────── */}
      <Box sx={{ mb:3 }}>
        <Box sx={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', mb:1.5, flexWrap:'wrap', gap:1 }}>
          <Box>
            <Box sx={{ display:'flex', alignItems:'center', gap:1 }}>
              <BusinessIcon sx={{ color:ACCENT, fontSize:22 }} />
              <Typography variant="h5" fontWeight={800} color="text.primary">
                Directorio de Constructoras
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" mt={0.25}>
              {loading ? '...' : `${constructores.length} empresa${constructores.length!==1?'s':''} registrada${constructores.length!==1?'s':''} en Costa Rica`}
            </Typography>
          </Box>
          {/* Acciones: comparar y filtro (mobile) */}
          <Box sx={{ display:'flex', gap:1 }}>
            {comparando.length >= 2 && (
              <Badge badgeContent={comparando.length} color="primary">
                <Button variant="contained" size="small" startIcon={<CompareArrowsIcon />}
                  onClick={() => setComparadorOpen(true)}
                  sx={{ bgcolor:ACCENT, '&:hover':{ bgcolor:'#1D4ED8' }, fontWeight:700, fontSize:12 }}>
                  Comparar
                </Button>
              </Badge>
            )}
            {isTablet && (
              <Button variant="outlined" size="small"
                startIcon={<TuneIcon />}
                endIcon={nFiltros > 0 && <Chip label={nFiltros} size="small" sx={{ bgcolor:ACCENT, color:'white', height:18, fontSize:10 }} />}
                onClick={() => isMobile ? setDrawer(true) : setPanelOpen(p=>!p)}
                sx={{ fontWeight:600, fontSize:12, borderColor:'#CBD5E1' }}>
                Filtros
              </Button>
            )}
          </Box>
        </Box>

        {/* Search bar protagonista */}
        <TextField fullWidth size="medium"
          placeholder="Buscar por empresa, especialidad o ubicación..."
          value={filtros.busqueda}
          onChange={e => setFiltros(f=>({...f, busqueda:e.target.value}))}
          slotProps={{ input: {
            startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize:20, color:'text.disabled' }} /></InputAdornment>,
            sx: { bgcolor:'white', borderRadius:2 },
          } }}
          sx={{ '& .MuiOutlinedInput-root': { borderRadius:2 } }}
        />
      </Box>

      {/* ── Sección Recomendadas ─────────────────────────────────────── */}
      {!loading && recomendadas.length > 0 && (
        <Box sx={{ mb:3 }}>
          <Box sx={{ display:'flex', alignItems:'center', gap:0.75, mb:1.5 }}>
            <AutoAwesomeIcon sx={{ fontSize:18, color:'#F59E0B' }} />
            <Typography fontWeight={700} fontSize={15}>Constructoras recomendadas para ti</Typography>
            <Typography fontSize={12} color="text.secondary" ml={0.5}>
              — basadas en tus proyectos activos
            </Typography>
          </Box>
          <Box sx={{ display:'flex', gap:2, overflowX:'auto', pb:1,
            '&::-webkit-scrollbar': { height:4 },
            '&::-webkit-scrollbar-track': { bgcolor:'#F1F5F9', borderRadius:2 },
            '&::-webkit-scrollbar-thumb': { bgcolor:'#CBD5E1', borderRadius:2 },
          }}>
            {recomendadas.map(r => (
              <RecomendadaCard key={r.id} perfil={r} matchPct={r.matchPct}
                onVerPerfil={handleVerPerfil} onInvitar={handleInvitar} />
            ))}
          </Box>
          <Divider sx={{ mt:2.5 }} />
        </Box>
      )}

      {/* ── Layout dividido: panel izq + directorio der ─────────────── */}
      <Box sx={{ display:'flex', gap:3, alignItems:'flex-start' }}>

        {/* Panel de filtros — desktop */}
        {!isTablet && (
          <Box sx={{ width:256, flexShrink:0, position:'sticky', top:16 }}>
            <Box sx={{ bgcolor:'white', border:'1px solid #E2E8F0', borderRadius:2, p:2 }}>
              {filterPanel}
            </Box>
          </Box>
        )}

        {/* Panel de filtros — tablet collapsible */}
        {isTablet && !isMobile && (
          <Collapse in={panelOpen} sx={{ width:'100%' }}>
            <Box sx={{ bgcolor:'white', border:'1px solid #E2E8F0', borderRadius:2, p:2, mb:2 }}>
              {filterPanel}
            </Box>
          </Collapse>
        )}

        {/* Drawer filtros — mobile */}
        <Drawer anchor="bottom" open={drawerOpen} onClose={() => setDrawer(false)}
          PaperProps={{ sx: { borderTopLeftRadius:16, borderTopRightRadius:16, p:3, maxHeight:'85vh' } }}>
          <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center', mb:2 }}>
            <Typography fontWeight={700} fontSize={15}>Filtros</Typography>
            <IconButton size="small" onClick={() => setDrawer(false)}><CloseIcon /></IconButton>
          </Box>
          {filterPanel}
          <Button fullWidth variant="contained" onClick={() => setDrawer(false)} sx={{ mt:2, bgcolor:ACCENT }}>
            Ver {constructoresFiltrados.length} resultado{constructoresFiltrados.length!==1?'s':''}
          </Button>
        </Drawer>

        {/* Columna principal */}
        <Box sx={{ flex:1, minWidth:0 }}>
          {/* Chips de filtros activos */}
          <ActiveChips filtros={filtros} onChange={setFiltros} />

          {/* Resultado count + nota comparar */}
          {!loading && (
            <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center', mb:1.5 }}>
              <Typography fontSize={13} color="text.secondary" fontWeight={500}>
                {constructoresFiltrados.length} empresa{constructoresFiltrados.length!==1?'s':''} encontrada{constructoresFiltrados.length!==1?'s':''}
              </Typography>
              {comparando.length > 0 && (
                <Typography fontSize={12} color="text.secondary">
                  {comparando.length}/3 seleccionada{comparando.length!==1?'s':''} para comparar
                </Typography>
              )}
            </Box>
          )}

          {/* Skeletons */}
          {loading ? (
            <Grid container spacing={2}>
              {[1,2,3,4,5,6].map(i=>(
                <Grid size={{ xs:12, sm:6, lg:4 }} key={i}>
                  <Skeleton variant="rounded" height={260} sx={{ borderRadius:'12px' }} />
                </Grid>
              ))}
            </Grid>
          ) : constructoresFiltrados.length === 0 ? (
            <Box sx={{ bgcolor:'#fff', border:'1px solid #E2E8F0', borderRadius:'10px', py:10, textAlign:'center' }}>
              <BusinessIcon sx={{ fontSize:40, color:'#94A3B8', mb:1.5 }} />
              <Typography fontWeight={600} color="text.primary" fontSize={14} gutterBottom>Sin resultados</Typography>
              <Typography color="text.secondary" fontSize={13} mb={2}>
                No se encontraron constructoras con esos criterios.
              </Typography>
              {nFiltros > 0 && (
                <Button size="small" variant="outlined" onClick={() => setFiltros(FILTROS_INIT)}>
                  Limpiar filtros
                </Button>
              )}
            </Box>
          ) : (
            <Grid container spacing={2}>
              {constructoresFiltrados.map(c=>(
                <Grid size={{ xs:12, sm:6, lg:4 }} key={c.id}>
                  <ConstructorCard
                    perfil={c}
                    onVerPerfil={handleVerPerfil}
                    onInvitar={handleInvitar}
                    enComparando={comparando.includes(c.id)}
                    onToggleComparar={toggleComparar}
                    puedoComparar={comparando.length < 3}
                  />
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      </Box>

      {/* ── Modales ─────────────────────────────────────────────────── */}
      <InvitarModal
        perfil={invitarPerfil}
        open={!!invitarPerfil}
        onClose={() => setInvitarPerfil(null)}
      />
      <ComparadorModal
        empresas={empresasComparando}
        open={comparadorOpen}
        onClose={() => setComparadorOpen(false)}
        onVerPerfil={handleVerPerfil}
      />

      {/* Sticky compare button (desktop, when 2+ selected) */}
      {!isTablet && comparando.length >= 2 && (
        <Box sx={{ position:'fixed', bottom:24, right:24, zIndex:1200 }}>
          <Button variant="contained" size="large"
            startIcon={<CompareArrowsIcon />}
            onClick={() => setComparadorOpen(true)}
            sx={{ bgcolor:ACCENT, '&:hover':{ bgcolor:'#1D4ED8' }, fontWeight:700,
              boxShadow:'0 4px 20px rgba(37,99,235,0.35)', borderRadius:3 }}>
            Comparar ({comparando.length})
          </Button>
        </Box>
      )}
    </Box>
  );
}
