import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box, Typography, Button, Chip, Alert, Skeleton,
  IconButton, Tooltip,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions,
  Snackbar,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Select, MenuItem, FormControl, InputAdornment, TextField,
} from '@mui/material';
import AddIcon           from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import AutoAwesomeIcon   from '@mui/icons-material/AutoAwesome';
import PublishIcon       from '@mui/icons-material/Publish';
import SendIcon          from '@mui/icons-material/Send';
import ConstructionIcon  from '@mui/icons-material/Construction';
import SearchIcon        from '@mui/icons-material/Search';
import FilterListIcon    from '@mui/icons-material/FilterList';
import CloseIcon         from '@mui/icons-material/Close';
import { proyectosApi } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';

const ESTADO = {
  Borrador:     { bg: '#F1F5F9', color: '#64748B', label: 'Borrador'      },
  Publicado:    { bg: '#DCFCE7', color: '#166534', label: 'Publicado'     },
  EnPropuestas: { bg: '#FEF9C3', color: '#854D0E', label: 'En propuestas' },
  EnCurso:      { bg: '#DBEAFE', color: '#1D4ED8', label: 'En ejecución'  },
  Completado:   { bg: '#D1FAE5', color: '#065F46', label: 'Completado'    },
  Cancelado:    { bg: '#FEE2E2', color: '#991B1B', label: 'Cancelado'     },
};

const TIPO_LABEL = {
  Remodelacion:      'Remodelación',
  ObraGris:          'Obra gris',
  ElectricoPlomeria: 'Eléctrico / Plomería',
  Pintura:           'Pintura',
  Pisos:             'Pisos',
  Techos:            'Techos',
  PiscinaJardin:     'Piscina / Jardín',
  Otro:              'Otro',
};

const SORT_OPTIONS = [
  { value: 'fecha_desc',  label: 'Más recientes primero' },
  { value: 'fecha_asc',   label: 'Más antiguos primero'  },
  { value: 'nombre_asc',  label: 'Nombre A→Z'            },
  { value: 'nombre_desc', label: 'Nombre Z→A'            },
  { value: 'presup_desc', label: 'Mayor presupuesto'     },
];

const ACCENT = '#2563EB';

export default function MisProyectos() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { esRol, usuario } = useAuth();
  const [proyectos, setProyectos]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [buscar, setBuscar]         = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroTipo,   setFiltroTipo]   = useState('');
  const [sortBy, setSortBy]         = useState('fecha_desc');
  const [toast, setToast]           = useState({ open: false, msg: '', severity: 'success' });
  const [confirmDel, setConfirmDel] = useState({ open: false, id: null });

  const notify = (msg, severity = 'success') => setToast({ open: true, msg, severity });

  useEffect(() => {
    // Los constructores no tienen proyectos como clientes — redirigir a su vista de clientes/obras
    if (esRol('Constructor')) {
      navigate('/mis-clientes', { replace: true });
      return;
    }
    if (location.state?.success) notify(location.state.success);
    proyectosApi.getMios().then(r => setProyectos(r.data)).catch(() => {}).finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuario?.rol]);

  const handlePublicar = async (id) => {
    try {
      await proyectosApi.publicar(id);
      setProyectos(p => p.map(pr => pr.id === id ? { ...pr, estado: 'Publicado' } : pr));
      notify('Proyecto publicado. Los constructores ya pueden verlo.');
    } catch { notify('Error al publicar.', 'error'); }
  };

  const handleDelete = async () => {
    try {
      await proyectosApi.delete(confirmDel.id);
      setProyectos(p => p.filter(pr => pr.id !== confirmDel.id));
      notify('Proyecto eliminado.');
    } catch { notify('Error al eliminar.', 'error'); }
    finally { setConfirmDel({ open: false, id: null }); }
  };

  /* Conteos por estado para los chips rápidos */
  const conteoEstado = useMemo(() => {
    const c = {};
    proyectos.forEach(p => { c[p.estado] = (c[p.estado] || 0) + 1; });
    return c;
  }, [proyectos]);

  /* Tipos disponibles en los proyectos actuales */
  const tiposDisponibles = useMemo(() =>
    [...new Set(proyectos.map(p => p.tipoProyecto))].filter(Boolean),
    [proyectos]
  );

  /* Filtrado + ordenamiento */
  const proyectosFiltrados = useMemo(() => {
    let list = proyectos;
    if (buscar.trim())    list = list.filter(p => p.titulo?.toLowerCase().includes(buscar.toLowerCase()));
    if (filtroEstado)     list = list.filter(p => p.estado === filtroEstado);
    if (filtroTipo)       list = list.filter(p => p.tipoProyecto === filtroTipo);
    return [...list].sort((a, b) => {
      switch (sortBy) {
        case 'fecha_asc':   return new Date(a.fechaCreacion) - new Date(b.fechaCreacion);
        case 'nombre_asc':  return (a.titulo ?? '').localeCompare(b.titulo ?? '');
        case 'nombre_desc': return (b.titulo ?? '').localeCompare(a.titulo ?? '');
        case 'presup_desc': return (b.presupuestoMax ?? 0) - (a.presupuestoMax ?? 0);
        default:            return new Date(b.fechaCreacion ?? b.fechaPublicacion) - new Date(a.fechaCreacion ?? a.fechaPublicacion);
      }
    });
  }, [proyectos, buscar, filtroEstado, filtroTipo, sortBy]);

  const hayFiltros = buscar || filtroEstado || filtroTipo;
  const limpiar = () => { setBuscar(''); setFiltroEstado(''); setFiltroTipo(''); };

  /* Estado chips — solo los que tienen proyectos */
  const ESTADO_CHIPS = [
    { key: '',            label: 'Todos',          count: proyectos.length },
    ...Object.entries(conteoEstado).map(([k, v]) => ({
      key: k, label: ESTADO[k]?.label ?? k, count: v,
    })),
  ];

  return (
    <Box>
      {/* ── Header ── */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="h5" color="text.primary" sx={{ mb: 0.25 }}>Mis proyectos</Typography>
          <Typography variant="body2" color="text.secondary">
            {loading ? '...' : `${proyectos.length} proyectos en total`}
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/publicar')}>
          Nuevo proyecto
        </Button>
      </Box>

      {/* ── Chips rápidos de estado ── */}
      {!loading && proyectos.length > 0 && (
        <Box sx={{ display: 'flex', gap: 0.75, mb: 2, flexWrap: 'wrap' }}>
          {ESTADO_CHIPS.map(({ key, label, count }) => {
            const activo = filtroEstado === key;
            const est    = key ? ESTADO[key] : null;
            return (
              <Box
                key={key}
                onClick={() => setFiltroEstado(key)}
                sx={{
                  display: 'flex', alignItems: 'center', gap: 0.75,
                  px: 1.5, py: 0.6, borderRadius: 1, cursor: 'pointer',
                  border: activo ? `1.5px solid ${ACCENT}` : '1.5px solid #E5E7EB',
                  bgcolor: activo ? '#EFF6FF' : '#fff',
                  transition: '.1s',
                  '&:hover': { borderColor: activo ? ACCENT : '#9CA3AF' },
                }}
              >
                {est && (
                  <Box sx={{
                    width: 7, height: 7, borderRadius: '50%',
                    bgcolor: est.color,
                    flexShrink: 0,
                  }} />
                )}
                <Typography fontSize={12.5} fontWeight={activo ? 600 : 400}
                  color={activo ? ACCENT : 'text.primary'}>
                  {label}
                </Typography>
                <Typography fontSize={11.5} color={activo ? ACCENT : '#9CA3AF'} fontWeight={500}>
                  {count}
                </Typography>
              </Box>
            );
          })}
        </Box>
      )}

      {/* ── Barra de filtros ── */}
      {!loading && proyectos.length > 0 && (
        <Box sx={{
          display: 'flex', alignItems: 'center', gap: 1.25, mb: 2,
          bgcolor: '#fff', border: '1px solid #E5E7EB', borderRadius: 1.5,
          px: 1.75, py: 1.25, flexWrap: 'wrap',
        }}>
          <FilterListIcon sx={{ fontSize: 16, color: 'text.disabled', flexShrink: 0 }} />

          {/* Búsqueda */}
          <TextField
            size="small"
            placeholder="Buscar por nombre..."
            value={buscar}
            onChange={e => setBuscar(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start">
                <SearchIcon sx={{ fontSize: 15, color: 'text.disabled' }} />
              </InputAdornment>,
              endAdornment: buscar ? (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setBuscar('')}>
                    <CloseIcon sx={{ fontSize: 14 }} />
                  </IconButton>
                </InputAdornment>
              ) : null,
            }}
            sx={{ width: 240, '& .MuiOutlinedInput-root': { fontSize: 13 } }}
          />

          {/* Tipo */}
          <FormControl size="small" sx={{ minWidth: 170 }}>
            <Select
              value={filtroTipo}
              displayEmpty
              onChange={e => setFiltroTipo(e.target.value)}
              sx={{ fontSize: 13 }}
              renderValue={v => v ? (TIPO_LABEL[v] ?? v) : 'Tipo de proyecto'}
            >
              <MenuItem value="" sx={{ fontSize: 13 }}>Todos los tipos</MenuItem>
              {tiposDisponibles.map(t => (
                <MenuItem key={t} value={t} sx={{ fontSize: 13 }}>{TIPO_LABEL[t] ?? t}</MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Ordenar */}
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <Select value={sortBy} onChange={e => setSortBy(e.target.value)} sx={{ fontSize: 13 }}>
              {SORT_OPTIONS.map(o => (
                <MenuItem key={o.value} value={o.value} sx={{ fontSize: 13 }}>{o.label}</MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Resultado + limpiar */}
          <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography fontSize={12.5} color="text.secondary" fontWeight={500}>
              {proyectosFiltrados.length === proyectos.length
                ? `${proyectos.length} proyectos`
                : `${proyectosFiltrados.length} de ${proyectos.length}`}
            </Typography>
            {hayFiltros && (
              <Button size="small" startIcon={<CloseIcon sx={{ fontSize: 12 }} />}
                onClick={limpiar} sx={{ fontSize: 12, color: '#6B7280', py: 0.4 }}>
                Limpiar
              </Button>
            )}
          </Box>
        </Box>
      )}

      {/* ── Tabla ── */}
      <Box sx={{ bgcolor: '#fff', border: '1px solid #E5E7EB', borderRadius: 1.5, overflow: 'hidden' }}>
        {loading ? (
          <Box sx={{ p: 2 }}>
            {[1,2,3,4,5].map(i => <Skeleton key={i} height={44} sx={{ mb: 0.5 }} />)}
          </Box>
        ) : proyectos.length === 0 ? (
          <Box sx={{ py: 10, textAlign: 'center' }}>
            <ConstructionIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
            <Typography fontSize={15} fontWeight={600} color="text.secondary" mb={0.5}>
              No tenés proyectos aún
            </Typography>
            <Typography fontSize={13} color="text.disabled" mb={3}>
              Publicá tu primer proyecto y recibí cotizaciones de constructores verificados.
            </Typography>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/publicar')}>
              Publicar primer proyecto
            </Button>
          </Box>
        ) : proyectosFiltrados.length === 0 ? (
          <Box sx={{ py: 6, textAlign: 'center' }}>
            <Typography fontSize={13.5} color="text.secondary" sx={{ mb: 1.5 }}>
              No hay proyectos con esos filtros.
            </Typography>
            <Button size="small" onClick={limpiar} sx={{ fontSize: 12.5 }}>
              Limpiar filtros
            </Button>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: '36%' }}>Proyecto</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Ubicación</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Fecha</TableCell>
                  <TableCell align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {proyectosFiltrados.map(p => {
                  const est = ESTADO[p.estado] ?? ESTADO.Borrador;
                  const fecha = p.fechaPublicacion
                    ? new Date(p.fechaPublicacion).toLocaleDateString('es-CR', { day: 'numeric', month: 'short', year: 'numeric' })
                    : p.fechaCreacion
                    ? new Date(p.fechaCreacion).toLocaleDateString('es-CR', { day: 'numeric', month: 'short', year: 'numeric' })
                    : '—';

                  return (
                    <TableRow key={p.id}>
                      <TableCell>
                        <Typography fontSize={13.5} fontWeight={500} color="text.primary" sx={{
                          display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                        }}>
                          {p.titulo}
                        </Typography>
                        {p.presupuestoMax && (
                          <Typography fontSize={11.5} color="text.secondary">
                            ₡{(p.presupuestoMax / 1_000_000).toFixed(1)}M máx.
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography fontSize={12.5} color="text.secondary">
                          {TIPO_LABEL[p.tipoProyecto] ?? p.tipoProyecto}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography fontSize={12.5} color="text.secondary">
                          {[p.canton, p.provincia].filter(Boolean).join(', ') || '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={est.label} size="small"
                          sx={{ bgcolor: est.bg, color: est.color, fontWeight: 500 }} />
                      </TableCell>
                      <TableCell>
                        <Typography fontSize={12.5} color="text.secondary">{fecha}</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', gap: 0.25, justifyContent: 'flex-end' }}>
                          <Tooltip title="Cotización IA">
                            <IconButton size="small" onClick={() => navigate(`/cotizacion/${p.id}`)}
                              sx={{ color: '#6B7280', '&:hover': { color: '#2563EB', bgcolor: '#EFF6FF' } }}>
                              <AutoAwesomeIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Ver propuestas">
                            <IconButton size="small" onClick={() => navigate(`/propuestas/${p.id}`)}
                              sx={{ color: '#6B7280', '&:hover': { color: '#2563EB', bgcolor: '#EFF6FF' } }}>
                              <SendIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                          {p.estado === 'Borrador' && (
                            <Tooltip title="Publicar">
                              <IconButton size="small" onClick={() => handlePublicar(p.id)}
                                sx={{ color: '#6B7280', '&:hover': { color: '#16A34A', bgcolor: '#F0FDF4' } }}>
                                <PublishIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
                          )}
                          {['EnCurso','Completado'].includes(p.estado) && (
                            <Tooltip title="Workspace de obra">
                              <IconButton size="small" onClick={() => navigate(`/obra/${p.id}`)}
                                sx={{ color: '#6B7280', '&:hover': { color: '#D97706', bgcolor: '#FFFBEB' } }}>
                                <ConstructionIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
                          )}
                          <Tooltip title="Eliminar">
                            <IconButton size="small" onClick={() => setConfirmDel({ open: true, id: p.id })}
                              sx={{ color: '#6B7280', '&:hover': { color: '#DC2626', bgcolor: '#FEF2F2' } }}>
                              <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>

      {/* Confirm delete */}
      <Dialog open={confirmDel.open} onClose={() => setConfirmDel({ open: false, id: null })}
        maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 600, fontSize: 15 }}>Eliminar proyecto</DialogTitle>
        <DialogContent>
          <DialogContentText fontSize={13.5}>
            Esta acción es irreversible. Se eliminarán también las propuestas y cotizaciones asociadas.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setConfirmDel({ open: false, id: null })}>Cancelar</Button>
          <Button variant="contained" color="error" startIcon={<DeleteOutlineIcon />} onClick={handleDelete}>
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={toast.open} autoHideDuration={4000}
        onClose={() => setToast(t => ({ ...t, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={toast.severity} onClose={() => setToast(t => ({ ...t, open: false }))}>
          {toast.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
