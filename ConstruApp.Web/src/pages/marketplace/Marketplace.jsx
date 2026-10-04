import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, TextField, InputAdornment, Select, MenuItem,
  FormControl, InputLabel, Button, Chip, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow,
  Skeleton, Alert, useTheme, useMediaQuery,
} from '@mui/material';
import SearchIcon     from '@mui/icons-material/Search';
import VerifiedIcon   from '@mui/icons-material/Verified';
import { perfilesConstructorApi, proyectosApi } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';

/* ── Constantes ─────────────────────────────────────────────────────────── */
const PROVINCIAS = ['Todas','San José','Alajuela','Cartago','Heredia','Guanacaste','Puntarenas','Limón'];

const TIPOS_PROYECTO = [
  { value: '', label: 'Todos los tipos' },
  { value: 'Remodelacion',      label: 'Remodelación' },
  { value: 'ObraGris',          label: 'Obra gris' },
  { value: 'ElectricoPlomeria', label: 'Eléctrico / Plomería' },
  { value: 'Pintura',           label: 'Pintura' },
  { value: 'Pisos',             label: 'Pisos' },
  { value: 'Techos',            label: 'Techos' },
];

const ESPECIALIDADES_BASE = [
  '','Remodelación','Obra gris','Eléctrico','Plomería','Pintura','Pisos','Techos',
  'Piscinas','Jardines','Demolición','Estructuras metálicas','Enchapes',
];

const TH = ({ children, hide }) => (
  <TableCell sx={{
    fontSize: 12, fontWeight: 600, color: 'text.secondary', py: 1.25,
    display: hide ? { xs: 'none', [hide]: 'table-cell' } : undefined,
  }}>
    {children}
  </TableCell>
);

/* ── Marketplace principal ──────────────────────────────────────────────── */
export default function Marketplace() {
  const { usuario } = useAuth();
  const navigate    = useNavigate();
  const theme       = useTheme();
  const isMobile    = useMediaQuery(theme.breakpoints.down('sm'));

  const esConstructor = usuario?.rol === 'Constructor';

  /* Estado: Directorio (Cliente / Admin) */
  const [constructores, setConstructores] = useState([]);
  const [loading,  setLoading]            = useState(true);
  const [error,    setError]              = useState('');
  const [busqueda,      setBusqueda]      = useState('');
  const [provincia,     setProvincia]     = useState('Todas');
  const [especialidad,  setEspecialidad]  = useState('');
  const [soloVerif,     setSoloVerif]     = useState(false);

  /* Estado: Proyectos disponibles (Constructor) */
  const [proyectos,       setProyectos]     = useState([]);
  const [loadingProy,     setLoadingProy]   = useState(false);
  const [buscarProy,      setBuscarProy]    = useState('');
  const [tipoProy,        setTipoProy]      = useState('');
  const [provinciaProy,   setProvinciaProy] = useState('Todas');

  /* Carga de datos */
  useEffect(() => {
    if (esConstructor) {
      setLoadingProy(true);
      proyectosApi.getAll?.()
        .then(r => setProyectos(r.data ?? []))
        .catch(() => {})
        .finally(() => setLoadingProy(false));
      return;
    }
    setLoading(true);
    perfilesConstructorApi.getAll()
      .then(r => setConstructores(r.data ?? []))
      .catch(() => setError('No se pudo cargar el directorio.'))
      .finally(() => setLoading(false));
  }, [esConstructor]);

  /* Especialidades dinámicas */
  const especialidades = useMemo(() => {
    const extra = constructores
      .flatMap(c => (c.especialidades || '').split(/[,;]+/).map(s => s.trim()))
      .filter(Boolean);
    return [...new Set([...ESPECIALIDADES_BASE, ...extra])];
  }, [constructores]);

  /* Filtrado */
  const filtrados = useMemo(() => {
    const q = busqueda.toLowerCase();
    return constructores.filter(c => {
      if (q && !c.nombreEmpresa?.toLowerCase().includes(q)
           && !(c.especialidades || '').toLowerCase().includes(q)
           && !(c.canton || '').toLowerCase().includes(q)) return false;
      if (provincia !== 'Todas' && c.provincia !== provincia) return false;
      if (especialidad && !(c.especialidades || '').toLowerCase().includes(especialidad.toLowerCase())) return false;
      if (soloVerif && !c.verificado) return false;
      return true;
    });
  }, [constructores, busqueda, provincia, especialidad, soloVerif]);

  const filtrosActivos = [busqueda, provincia !== 'Todas', especialidad, soloVerif].filter(Boolean).length;
  const resetFiltros   = () => { setBusqueda(''); setProvincia('Todas'); setEspecialidad(''); setSoloVerif(false); };

  /* ── Vista Constructor: proyectos disponibles ─────────────────────── */
  if (esConstructor) {
    const filtradosProy = proyectos.filter(p => {
      if (p.estado !== 'Publicado') return false;
      if (buscarProy && !p.titulo?.toLowerCase().includes(buscarProy.toLowerCase())) return false;
      if (tipoProy && p.tipoProyecto !== tipoProy) return false;
      if (provinciaProy !== 'Todas' && p.provincia !== provinciaProy) return false;
      return true;
    });

    return (
      <Box>
        <Box sx={{ mb: 2.5 }}>
          <Typography fontWeight={700} fontSize={20}>Proyectos disponibles</Typography>
          <Typography color="text.secondary" fontSize={13.5} mt={0.25}>
            Proyectos publicados por clientes en ConstruApp.
          </Typography>
        </Box>

        <Box sx={{
          display: 'flex', gap: 1.5, mb: 2.5, flexWrap: 'wrap', alignItems: 'center',
          p: 2, bgcolor: '#F8FAFC', border: '1px solid', borderColor: 'divider', borderRadius: 1,
        }}>
          <TextField size="small" placeholder="Buscar proyecto..." value={buscarProy}
            onChange={e => setBuscarProy(e.target.value)}
            slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 15, color: 'text.disabled' }} /></InputAdornment> } }}
            sx={{ flex: 1, minWidth: 180 }} />
          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel>Provincia</InputLabel>
            <Select value={provinciaProy} onChange={e => setProvinciaProy(e.target.value)} label="Provincia">
              {PROVINCIAS.map(p => <MenuItem key={p} value={p} sx={{ fontSize: 13 }}>{p}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Tipo de proyecto</InputLabel>
            <Select value={tipoProy} onChange={e => setTipoProy(e.target.value)} label="Tipo de proyecto">
              {TIPOS_PROYECTO.map(t => <MenuItem key={t.value} value={t.value} sx={{ fontSize: 13 }}>{t.label}</MenuItem>)}
            </Select>
          </FormControl>
        </Box>

        <TableContainer sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#F8FAFC' }}>
                <TH>Proyecto</TH>
                <TH hide="sm">Ubicación</TH>
                <TH hide="md">Tipo</TH>
                <TH hide="sm">Presupuesto</TH>
                <TableCell align="right" sx={{ fontSize: 12, fontWeight: 600, color: 'text.secondary', py: 1.25, pr: 2 }}>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loadingProy ? (
                [1,2,3,4,5].map(i => (
                  <TableRow key={i}>
                    <TableCell colSpan={5}><Skeleton height={36} /></TableCell>
                  </TableRow>
                ))
              ) : filtradosProy.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5}>
                    <Box sx={{ py: 6, textAlign: 'center' }}>
                      <Typography color="text.secondary" fontSize={13.5}>
                        No hay proyectos disponibles con los filtros seleccionados.
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : filtradosProy.map(p => (
                <TableRow key={p.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/obra/${p.id}`)}>
                  <TableCell sx={{ py: 1.5, pl: 2 }}>
                    <Typography fontSize={13.5} fontWeight={600}>{p.titulo}</Typography>
                    {p.descripcion && (
                      <Typography fontSize={12} color="text.secondary">
                        {p.descripcion.slice(0, 70)}{p.descripcion.length > 70 ? '…' : ''}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell sx={{ fontSize: 13, color: 'text.secondary', display: { xs: 'none', sm: 'table-cell' } }}>
                    {[p.canton, p.provincia].filter(Boolean).join(', ') || '—'}
                  </TableCell>
                  <TableCell sx={{ fontSize: 13, display: { xs: 'none', md: 'table-cell' } }}>
                    {TIPOS_PROYECTO.find(t => t.value === p.tipoProyecto)?.label || p.tipoProyecto || '—'}
                  </TableCell>
                  <TableCell sx={{ fontSize: 13, display: { xs: 'none', sm: 'table-cell' } }}>
                    {p.presupuesto ? `₡${Number(p.presupuesto).toLocaleString('es-CR')}` : '—'}
                  </TableCell>
                  <TableCell align="right" sx={{ pr: 2 }}>
                    <Button size="small" variant="outlined"
                      onClick={e => { e.stopPropagation(); navigate(`/obra/${p.id}`); }}
                      sx={{ fontSize: 12, py: 0.3, px: 1.5 }}>
                      Ver detalle
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    );
  }

  /* ── Vista Cliente / Admin: Directorio ──────────────────────────────── */
  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 2.5 }}>
        <Typography fontWeight={700} fontSize={20}>Empresas Constructoras</Typography>
        <Typography color="text.secondary" fontSize={13.5} mt={0.25}>
          Consulta empresas registradas en ConstruApp.
        </Typography>
      </Box>

      {/* Barra de filtros */}
      <Box sx={{
        display: 'flex', gap: 1.5, mb: 2, flexWrap: 'wrap', alignItems: 'center',
        p: 1.75, bgcolor: '#F8FAFC', border: '1px solid', borderColor: 'divider', borderRadius: 1,
      }}>
        <TextField size="small" placeholder="Nombre, especialidad o ubicación..."
          value={busqueda} onChange={e => setBusqueda(e.target.value)}
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 15, color: 'text.disabled' }} /></InputAdornment> } }}
          sx={{ flex: 1, minWidth: 200 }} />
        <FormControl size="small" sx={{ minWidth: 130 }}>
          <InputLabel>Provincia</InputLabel>
          <Select value={provincia} onChange={e => setProvincia(e.target.value)} label="Provincia">
            {PROVINCIAS.map(p => <MenuItem key={p} value={p} sx={{ fontSize: 13 }}>{p}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 155 }}>
          <InputLabel>Especialidad</InputLabel>
          <Select value={especialidad} onChange={e => setEspecialidad(e.target.value)} label="Especialidad">
            {especialidades.map(e => <MenuItem key={e} value={e} sx={{ fontSize: 13 }}>{e || 'Todas'}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Estado</InputLabel>
          <Select
            value={soloVerif ? 'verificadas' : 'todas'}
            onChange={e => setSoloVerif(e.target.value === 'verificadas')}
            label="Estado">
            <MenuItem value="todas" sx={{ fontSize: 13 }}>Todas</MenuItem>
            <MenuItem value="verificadas" sx={{ fontSize: 13 }}>Solo verificadas</MenuItem>
          </Select>
        </FormControl>
        {filtrosActivos > 0 && (
          <Button size="small" onClick={resetFiltros}
            sx={{ fontSize: 12, color: 'text.secondary', whiteSpace: 'nowrap', flexShrink: 0 }}>
            Limpiar ({filtrosActivos})
          </Button>
        )}
      </Box>

      {/* Conteo */}
      <Typography fontSize={12.5} color="text.secondary" sx={{ mb: 1.5 }}>
        {loading ? '…' : `${filtrados.length} empresa${filtrados.length !== 1 ? 's' : ''} encontrada${filtrados.length !== 1 ? 's' : ''}`}
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Resultados — mobile: bloques apilados */}
      {isMobile ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {loading ? (
            [1,2,3,4].map(i => <Skeleton key={i} height={72} sx={{ borderRadius: 1 }} />)
          ) : filtrados.length === 0 ? (
            <Box sx={{ py: 8, textAlign: 'center', border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
              <Typography color="text.secondary" fontSize={13.5}>
                No se encontraron empresas con los filtros aplicados.
              </Typography>
            </Box>
          ) : filtrados.map(c => (
            <Box key={c.id} onClick={() => navigate(`/constructor/${c.id}`)}
              sx={{ p: 1.75, border: '1px solid', borderColor: 'divider', borderRadius: 1, cursor: 'pointer',
                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1.5,
                '&:hover': { bgcolor: '#F8FAFC' } }}>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.25 }}>
                  <Typography fontSize={14} fontWeight={600} noWrap>{c.nombreEmpresa}</Typography>
                  {c.verificado && <VerifiedIcon sx={{ fontSize: 13, color: '#16A34A', flexShrink: 0 }} />}
                </Box>
                <Typography fontSize={12} color="text.secondary" noWrap>
                  {[c.canton, c.provincia].filter(Boolean).join(', ')}
                </Typography>
                {c.especialidades && (
                  <Typography fontSize={11.5} color="text.secondary"
                    sx={{ mt: 0.25, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {c.especialidades}
                  </Typography>
                )}
              </Box>
              <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                {c.calificacionPromedio > 0 && (
                  <Typography fontSize={12.5} fontWeight={600}>{c.calificacionPromedio?.toFixed(1)} ★</Typography>
                )}
                <Button size="small" variant="outlined" sx={{ fontSize: 11, py: 0.2, px: 1, mt: 0.5 }}
                  onClick={e => { e.stopPropagation(); navigate(`/constructor/${c.id}`); }}>
                  Ver perfil
                </Button>
              </Box>
            </Box>
          ))}
        </Box>
      ) : (
        /* Resultados — desktop: tabla */
        <TableContainer sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#F8FAFC' }}>
                <TableCell sx={{ fontSize: 12, fontWeight: 600, color: 'text.secondary', py: 1.25, pl: 2 }}>Empresa</TableCell>
                <TH hide="md">Ubicación</TH>
                <TH hide="lg">Especialidades</TH>
                <TH>Estado</TH>
                <TH hide="sm">Cal.</TH>
                <TH hide="md">Exp.</TH>
                <TableCell align="right" sx={{ fontSize: 12, fontWeight: 600, color: 'text.secondary', py: 1.25, pr: 2 }}>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                [1,2,3,4,5].map(i => (
                  <TableRow key={i}>
                    <TableCell colSpan={7}><Skeleton height={36} /></TableCell>
                  </TableRow>
                ))
              ) : filtrados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7}>
                    <Box sx={{ py: 6, textAlign: 'center' }}>
                      <Typography color="text.secondary" fontSize={13.5}>
                        No se encontraron empresas con los filtros aplicados.
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : filtrados.map(c => (
                <TableRow key={c.id} hover sx={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/constructor/${c.id}`)}>
                  <TableCell sx={{ py: 1.5, pl: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                      <Typography fontSize={13.5} fontWeight={600}>{c.nombreEmpresa}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ fontSize: 13, color: 'text.secondary', display: { xs: 'none', md: 'table-cell' } }}>
                    {[c.canton, c.provincia].filter(Boolean).join(', ') || '—'}
                  </TableCell>
                  <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {(c.especialidades || '').split(/[,;]+/).filter(Boolean).slice(0, 3).map((e, i) => (
                        <Chip key={i} label={e.trim()} size="small"
                          sx={{ fontSize: 11, height: 20, bgcolor: '#F1F5F9', color: '#475569' }} />
                      ))}
                    </Box>
                  </TableCell>
                  <TableCell>
                    {c.verificado ? (
                      <Chip label="Verificada" size="small"
                        icon={<VerifiedIcon style={{ fontSize: 12 }} />}
                        sx={{ fontSize: 11, height: 20, bgcolor: '#F0FDF4', color: '#16A34A', border: '1px solid #BBF7D0' }} />
                    ) : (
                      <Chip label="Pendiente" size="small"
                        sx={{ fontSize: 11, height: 20, bgcolor: '#F8FAFC', color: '#94A3B8', border: '1px solid #E2E8F0' }} />
                    )}
                  </TableCell>
                  <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                    {c.calificacionPromedio > 0 ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Typography fontSize={13} fontWeight={600}>{c.calificacionPromedio?.toFixed(1)}</Typography>
                        <Typography fontSize={12} color="text.secondary">★</Typography>
                      </Box>
                    ) : <Typography fontSize={12} color="text.disabled">—</Typography>}
                  </TableCell>
                  <TableCell sx={{ fontSize: 13, color: 'text.secondary', display: { xs: 'none', md: 'table-cell' } }}>
                    {c.aniosExperiencia > 0 ? `${c.aniosExperiencia} años` : '—'}
                  </TableCell>
                  <TableCell align="right" sx={{ pr: 2 }}>
                    <Button size="small" variant="outlined"
                      onClick={e => { e.stopPropagation(); navigate(`/constructor/${c.id}`); }}
                      sx={{ fontSize: 12, py: 0.3, px: 1.5, whiteSpace: 'nowrap' }}>
                      Ver perfil
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
