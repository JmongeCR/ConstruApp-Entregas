import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, Chip, TextField, Select, MenuItem, FormControl,
  InputLabel, InputAdornment, Tooltip, IconButton, Menu, Divider,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Alert, Snackbar, Dialog, DialogTitle, DialogContent,
  DialogActions, ToggleButton, ToggleButtonGroup, Card, CardContent,
  Skeleton, Checkbox,
} from '@mui/material';
import AutoAwesomeIcon          from '@mui/icons-material/AutoAwesome';
import SearchIcon               from '@mui/icons-material/Search';
import FilterListIcon           from '@mui/icons-material/FilterList';
import MoreVertIcon             from '@mui/icons-material/MoreVert';
import VisibilityIcon           from '@mui/icons-material/Visibility';
import ContentCopyIcon          from '@mui/icons-material/ContentCopy';
import RefreshIcon              from '@mui/icons-material/Refresh';
import ArchiveIcon              from '@mui/icons-material/Archive';
import UnarchiveIcon            from '@mui/icons-material/Unarchive';
import PostAddIcon              from '@mui/icons-material/PostAdd';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import PictureAsPdfIcon         from '@mui/icons-material/PictureAsPdf';
import CompareArrowsIcon        from '@mui/icons-material/CompareArrows';
import CloseIcon                from '@mui/icons-material/Close';
import CalendarTodayIcon        from '@mui/icons-material/CalendarToday';
import { PDFDownloadLink }      from '@react-pdf/renderer';
import { CotizacionPDF }        from '../../utils/pdf/CotizacionPDF';
import { cotizacionIAApi }      from '../../api/endpoints';

// ── Helpers ────────────────────────────────────────────────────────────────────
const fmt  = n => (n ?? 0).toLocaleString('es-CR', { style: 'currency', currency: 'CRC', maximumFractionDigits: 0 });
const fmtD = d => d ? new Date(d).toLocaleDateString('es-CR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const PLAN_COLORS = {
  economico: { bg: '#F0FDF4', color: '#166534', border: '#BBF7D0', label: 'Económico' },
  estandar:  { bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE', label: 'Estándar'  },
  premium:   { bg: '#FDF4FF', color: '#7E22CE', border: '#E9D5FF', label: 'Premium'   },
};
const ESTADO_COLORS = {
  Activa:                { bg: '#DCFCE7', color: '#166534' },
  Archivada:             { bg: '#F1F5F9', color: '#64748B' },
  ConvertidaPresupuesto: { bg: '#FEF3C7', color: '#92400E' },
  ConvertidaPropuesta:   { bg: '#EFF6FF', color: '#1D4ED8' },
};

function PlanChip({ plan }) {
  const c = PLAN_COLORS[plan] ?? PLAN_COLORS.estandar;
  return (
    <Chip label={c.label} size="small" sx={{
      bgcolor: c.bg, color: c.color, border: `1px solid ${c.border}`,
      fontWeight: 700, fontSize: 11, height: 22, borderRadius: '5px',
    }} />
  );
}

function EstadoChipLocal({ estado }) {
  const c = ESTADO_COLORS[estado] ?? ESTADO_COLORS.Activa;
  const labels = {
    Activa: 'Activa', Archivada: 'Archivada',
    ConvertidaPresupuesto: 'Presupuesto', ConvertidaPropuesta: 'Propuesta',
  };
  return (
    <Chip label={labels[estado] ?? estado} size="small" sx={{
      bgcolor: c.bg, color: c.color, fontWeight: 700, fontSize: 11, height: 22, borderRadius: '5px',
    }} />
  );
}

// ── Menú de acciones por fila ──────────────────────────────────────────────────
function AccionesMenu({ row, onRefresh, onToast, onComparar, comparando }) {
  const navigate  = useNavigate();
  const [anchor, setAnchor]     = useState(null);
  const [pdfData, setPdfData]   = useState(null);
  const [loadPdf, setLoadPdf]   = useState(false);

  const accion = async (fn, msg) => {
    setAnchor(null);
    try { await fn(); onToast(msg); onRefresh(); }
    catch (e) { onToast(e.response?.data?.message || 'Error', 'error'); }
  };

  const cargarPDF = async () => {
    if (pdfData) return;
    setLoadPdf(true);
    try {
      const r = await cotizacionIAApi.getById(row.id);
      setPdfData(r.data);
    } catch {}
    finally { setLoadPdf(false); }
  };

  return (
    <>
      <IconButton size="small" onClick={e => { setAnchor(e.currentTarget); cargarPDF(); }}>
        <MoreVertIcon fontSize="small" />
      </IconButton>
      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}
        PaperProps={{ sx: { minWidth: 200, borderRadius: 1.5, border: '1px solid #E5E7EB' } }}>

        <MenuItem dense onClick={() => { setAnchor(null); navigate(`/cotizacion/${row.proyectoId}`); }}>
          <VisibilityIcon sx={{ fontSize: 16, mr: 1.5, color: '#64748B' }} /> Ver cotización
        </MenuItem>

        <MenuItem dense onClick={() => accion(() => cotizacionIAApi.duplicar(row.id), 'Cotización duplicada')}>
          <ContentCopyIcon sx={{ fontSize: 16, mr: 1.5, color: '#64748B' }} /> Duplicar
        </MenuItem>

        <MenuItem dense onClick={() => { setAnchor(null); navigate(`/cotizacion/${row.proyectoId}`); }}>
          <RefreshIcon sx={{ fontSize: 16, mr: 1.5, color: '#64748B' }} /> Regenerar
        </MenuItem>

        <Divider />

        {!comparando.includes(row.id) ? (
          <MenuItem dense onClick={() => { setAnchor(null); onComparar(row.id, 'add'); }}>
            <CompareArrowsIcon sx={{ fontSize: 16, mr: 1.5, color: '#2563EB' }} />
            <Typography fontSize={13} color="#2563EB">Agregar a comparación</Typography>
          </MenuItem>
        ) : (
          <MenuItem dense onClick={() => { setAnchor(null); onComparar(row.id, 'remove'); }}>
            <CloseIcon sx={{ fontSize: 16, mr: 1.5, color: '#DC2626' }} />
            <Typography fontSize={13} color="#DC2626">Quitar de comparación</Typography>
          </MenuItem>
        )}

        <Divider />

        <MenuItem dense onClick={() => accion(() => cotizacionIAApi.convertirPropuesta(row.id), 'Propuesta creada')}>
          <PostAddIcon sx={{ fontSize: 16, mr: 1.5, color: '#64748B' }} /> Convertir a Propuesta
        </MenuItem>

        <MenuItem dense onClick={() => accion(() => cotizacionIAApi.convertirPresupuesto(row.id), 'Partidas de presupuesto creadas')}>
          <AccountBalanceWalletIcon sx={{ fontSize: 16, mr: 1.5, color: '#64748B' }} /> Convertir a Presupuesto
        </MenuItem>

        <Divider />

        {pdfData && !loadPdf ? (
          <PDFDownloadLink
            document={<CotizacionPDF cotizacion={pdfData} analisisIA={pdfData.analisisIA} proyecto={{ titulo: row.proyecto?.titulo }} />}
            fileName={`cotizacion-${row.id}-${row.plan}.pdf`}
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            {({ loading: pl }) => (
              <MenuItem dense disabled={pl}>
                <PictureAsPdfIcon sx={{ fontSize: 16, mr: 1.5, color: '#64748B' }} />
                {pl ? 'Preparando PDF…' : 'Exportar PDF'}
              </MenuItem>
            )}
          </PDFDownloadLink>
        ) : (
          <MenuItem dense disabled>
            <PictureAsPdfIcon sx={{ fontSize: 16, mr: 1.5, color: '#CBD5E1' }} />
            {loadPdf ? 'Cargando…' : 'Exportar PDF'}
          </MenuItem>
        )}

        <Divider />

        {row.estado === 'Activa' ? (
          <MenuItem dense onClick={() => accion(() => cotizacionIAApi.cambiarEstado(row.id, 'Archivada'), 'Cotización archivada')}>
            <ArchiveIcon sx={{ fontSize: 16, mr: 1.5, color: '#94A3B8' }} />
            <Typography fontSize={13} color="text.secondary">Archivar</Typography>
          </MenuItem>
        ) : (
          <MenuItem dense onClick={() => accion(() => cotizacionIAApi.cambiarEstado(row.id, 'Activa'), 'Cotización reactivada')}>
            <UnarchiveIcon sx={{ fontSize: 16, mr: 1.5, color: '#2563EB' }} />
            <Typography fontSize={13} color="#2563EB">Reactivar</Typography>
          </MenuItem>
        )}
      </Menu>
    </>
  );
}

// ── Modal de comparación ────────────────────────────────────────────────────────
function ComparacionModal({ ids, onClose }) {
  const [datos, setDatos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all(ids.map(id => cotizacionIAApi.getById(id).then(r => r.data)))
      .then(setDatos)
      .finally(() => setLoading(false));
  }, [ids]);

  const cols = datos.length;

  return (
    <Dialog open maxWidth="lg" fullWidth onClose={onClose}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CompareArrowsIcon sx={{ color: '#2563EB' }} />
          <Typography fontWeight={700}>Comparación de cotizaciones</Typography>
        </Box>
        <IconButton size="small" onClick={onClose}><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ p: 0 }}>
        {loading ? (
          <Box sx={{ p: 3 }}><Skeleton height={200} /></Box>
        ) : (
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#F8FAFC' }}>
                  <TableCell sx={{ fontWeight: 700, color: '#64748B', fontSize: 12, width: 160 }}>Campo</TableCell>
                  {datos.map(d => (
                    <TableCell key={d.id} align="center" sx={{ fontWeight: 700, fontSize: 12 }}>
                      <PlanChip plan={d.plan} />
                      <Typography fontSize={11} color="text.secondary" sx={{ mt: 0.3 }}>#{d.id}</Typography>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {[
                  { label: 'Rango mínimo', fn: d => fmt(d.rangoMinimo) },
                  { label: 'Rango máximo', fn: d => fmt(d.rangoMaximo) },
                  { label: 'Duración',     fn: d => d.analisisIA?.duracionEstimada || '—' },
                  { label: 'Tipo',         fn: d => d.analisisIA?.tipoProyecto || '—' },
                  { label: 'Estado',       fn: d => <EstadoChipLocal estado={d.estado} /> },
                  { label: 'Generado',     fn: d => fmtD(d.fechaGeneracion) },
                  { label: 'Total líneas', fn: d => `${d.lineas?.length ?? 0} ítems` },
                  { label: 'Mano de obra', fn: d => `${d.lineas?.filter(l => l.esManoDeObra)?.length ?? 0} puestos` },
                  {
                    label: 'Recomendaciones', fn: d => (
                      <Box sx={{ maxWidth: 220, fontSize: 12, color: '#475569' }}>
                        {(d.analisisIA?.recomendaciones ?? []).slice(0,3).map((r,i) => (
                          <Typography key={i} fontSize={11} color="text.secondary">• {r}</Typography>
                        ))}
                      </Box>
                    )
                  },
                ].map(row => (
                  <TableRow key={row.label} sx={{ '&:hover': { bgcolor: '#F8FAFC' } }}>
                    <TableCell sx={{ fontWeight: 600, fontSize: 12, color: '#64748B', py: 1.5 }}>
                      {row.label}
                    </TableCell>
                    {datos.map(d => (
                      <TableCell key={d.id} align="center" sx={{ fontSize: 13, py: 1.5 }}>
                        {row.fn(d)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} size="small">Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
export default function CotizacionesIA() {
  const navigate    = useNavigate();
  const [rows,      setRows]      = useState([]);
  const [total,     setTotal]     = useState(0);
  const [loading,   setLoading]   = useState(true);
  const [page,      setPage]      = useState(1);
  const [toast,     setToast]     = useState({ open: false, msg: '', severity: 'success' });
  const [comparando, setComparando] = useState([]);
  const [showComp,  setShowComp]  = useState(false);

  // Filtros
  const [busqueda,  setBusqueda]  = useState('');
  const [filtPlan,  setFiltPlan]  = useState('');
  const [filtEstado,setFiltEstado]= useState('');
  const [filtFechaD,setFiltFechaD]= useState('');
  const [filtFechaH,setFiltFechaH]= useState('');
  const [showFilt,  setShowFilt]  = useState(false);

  const notify = (msg, severity = 'success') => setToast({ open: true, msg, severity });

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page, size: 20,
        ...(filtPlan   && { plan:   filtPlan }),
        ...(filtEstado && { estado: filtEstado }),
        ...(filtFechaD && { fechaDesde: filtFechaD }),
        ...(filtFechaH && { fechaHasta: filtFechaH }),
      };
      const r = await cotizacionIAApi.getAll(params);
      let items = r.data.items;
      // Filtro local por búsqueda de texto
      if (busqueda.trim()) {
        const q = busqueda.toLowerCase();
        items = items.filter(i =>
          i.proyecto?.titulo?.toLowerCase().includes(q) ||
          i.cliente?.nombre?.toLowerCase().includes(q) ||
          i.nombrePlan?.toLowerCase().includes(q)
        );
      }
      setRows(items);
      setTotal(r.data.total);
    } catch { notify('Error al cargar cotizaciones', 'error'); }
    finally { setLoading(false); }
  }, [page, filtPlan, filtEstado, filtFechaD, filtFechaH, busqueda]);

  useEffect(() => { cargar(); }, [cargar]);

  const handleComparar = (id, action) => {
    if (action === 'add') {
      if (comparando.length >= 3) { notify('Máximo 3 cotizaciones para comparar', 'warning'); return; }
      setComparando(prev => [...prev, id]);
    } else {
      setComparando(prev => prev.filter(x => x !== id));
    }
  };

  const limpiarFiltros = () => {
    setFiltPlan(''); setFiltEstado(''); setFiltFechaD(''); setFiltFechaH('');
    setBusqueda(''); setPage(1);
  };

  const hayFiltros = filtPlan || filtEstado || filtFechaD || filtFechaH || busqueda;

  return (
    <Box>
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
            <Box sx={{ width: 36, height: 36, borderRadius: '9px', bgcolor: 'rgba(37,99,235,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <AutoAwesomeIcon sx={{ color: '#2563EB', fontSize: 19 }} />
            </Box>
            <Typography variant="h5" fontWeight={800} sx={{ color: '#0F172A' }}>
              Cotizaciones IA
            </Typography>
            <Chip label={`${total} registros`} size="small"
              sx={{ bgcolor: '#EFF6FF', color: '#1D4ED8', fontWeight: 700, fontSize: 11 }} />
          </Box>
          <Typography fontSize={13.5} color="text.secondary">
            Historial completo de cotizaciones generadas con inteligencia artificial
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {comparando.length >= 2 && (
            <Button variant="contained" size="small" startIcon={<CompareArrowsIcon />}
              onClick={() => setShowComp(true)}
              sx={{ bgcolor: '#7C3AED', '&:hover': { bgcolor: '#6D28D9' },
                fontWeight: 700, textTransform: 'none', fontSize: 12.5 }}>
              Comparar ({comparando.length})
            </Button>
          )}
          {comparando.length > 0 && (
            <Button variant="outlined" size="small" onClick={() => setComparando([])}
              sx={{ textTransform: 'none', fontSize: 12.5 }}>
              Limpiar selección
            </Button>
          )}
        </Box>
      </Box>

      {/* ── Barra de búsqueda y filtros ──────────────────────────────────────── */}
      <Box sx={{ bgcolor: 'white', border: '1px solid #E2E8F0', borderRadius: 2, p: 2, mb: 2.5 }}>
        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            size="small" placeholder="Buscar por proyecto, cliente o plan…"
            value={busqueda} onChange={e => setBusqueda(e.target.value)}
            sx={{ flex: 1, minWidth: 220 }}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18, color: '#94A3B8' }} /></InputAdornment> }}
          />
          <Button variant={showFilt ? 'contained' : 'outlined'} size="small"
            startIcon={<FilterListIcon sx={{ fontSize: 15 }} />}
            onClick={() => setShowFilt(f => !f)}
            sx={{ textTransform: 'none', fontSize: 12.5,
              ...(showFilt ? { bgcolor: '#2563EB' } : { color: '#475569', borderColor: '#CBD5E1' }) }}>
            Filtros {hayFiltros && '●'}
          </Button>
          {hayFiltros && (
            <Button size="small" onClick={limpiarFiltros}
              sx={{ textTransform: 'none', fontSize: 12, color: '#DC2626' }}>
              Limpiar
            </Button>
          )}
        </Box>

        {showFilt && (
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mt: 2, pt: 2,
            borderTop: '1px solid #F1F5F9' }}>
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Plan</InputLabel>
              <Select value={filtPlan} label="Plan" onChange={e => setFiltPlan(e.target.value)}>
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="economico">Económico</MenuItem>
                <MenuItem value="estandar">Estándar</MenuItem>
                <MenuItem value="premium">Premium</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Estado</InputLabel>
              <Select value={filtEstado} label="Estado" onChange={e => setFiltEstado(e.target.value)}>
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="Activa">Activa</MenuItem>
                <MenuItem value="Archivada">Archivada</MenuItem>
                <MenuItem value="ConvertidaPresupuesto">Convertida a Presupuesto</MenuItem>
                <MenuItem value="ConvertidaPropuesta">Convertida a Propuesta</MenuItem>
              </Select>
            </FormControl>
            <TextField size="small" label="Desde" type="date" value={filtFechaD}
              onChange={e => setFiltFechaD(e.target.value)}
              InputLabelProps={{ shrink: true }}
              InputProps={{ startAdornment: <InputAdornment position="start"><CalendarTodayIcon sx={{ fontSize: 14, color: '#94A3B8' }} /></InputAdornment> }}
              sx={{ minWidth: 165 }}
            />
            <TextField size="small" label="Hasta" type="date" value={filtFechaH}
              onChange={e => setFiltFechaH(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ minWidth: 165 }}
            />
          </Box>
        )}
      </Box>

      {/* ── Tabla principal ──────────────────────────────────────────────────── */}
      <Paper sx={{ border: '1px solid #E2E8F0', borderRadius: 2, overflow: 'hidden' }} elevation={0}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#F8FAFC' }}>
                <TableCell sx={{ fontWeight: 700, fontSize: 12, color: '#64748B', width: 40, pl: 1 }} />
                <TableCell sx={{ fontWeight: 700, fontSize: 12, color: '#64748B' }}>Proyecto</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: 12, color: '#64748B' }}>Cliente</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: 12, color: '#64748B' }}>Plan</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: 12, color: '#64748B' }}>Estado</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: 12, color: '#64748B' }}>Monto estimado</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: 12, color: '#64748B' }}>Fecha</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: 12, color: '#64748B' }}>Versión</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, fontSize: 12, color: '#64748B', pr: 1 }}>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 9 }).map((_, j) => (
                      <TableCell key={j}><Skeleton height={20} /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} sx={{ py: 6, textAlign: 'center' }}>
                    <AutoAwesomeIcon sx={{ fontSize: 40, color: '#CBD5E1', mb: 1, display: 'block', mx: 'auto' }} />
                    <Typography fontSize={14} color="text.secondary">
                      No hay cotizaciones IA {hayFiltros ? 'que coincidan con los filtros' : 'todavía'}
                    </Typography>
                    {!hayFiltros && (
                      <Button variant="contained" size="small" sx={{ mt: 1.5, textTransform: 'none' }}
                        onClick={() => navigate('/mis-proyectos')}>
                        Ir a mis proyectos
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ) : rows.map(row => {
                const seleccionado = comparando.includes(row.id);
                return (
                  <TableRow key={row.id} hover
                    sx={{ bgcolor: seleccionado ? '#EFF6FF' : 'transparent',
                      '&:hover': { bgcolor: seleccionado ? '#DBEAFE' : '#FAFAFA' } }}>

                    {/* Checkbox comparación */}
                    <TableCell sx={{ pl: 1 }}>
                      <Checkbox
                        size="small"
                        checked={seleccionado}
                        onChange={() => handleComparar(row.id, seleccionado ? 'remove' : 'add')}
                        sx={{ p: 0.25 }}
                      />
                    </TableCell>

                    {/* Proyecto */}
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 32, height: 32, borderRadius: 1, bgcolor: '#EFF6FF',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <AutoAwesomeIcon sx={{ fontSize: 16, color: '#2563EB' }} />
                        </Box>
                        <Box>
                          <Typography fontSize={13} fontWeight={600} sx={{ color: '#0F172A' }}>
                            {row.proyecto?.titulo ?? '—'}
                          </Typography>
                          <Typography fontSize={11} color="text.secondary">
                            {row.tipoProyectoIA ?? row.proyecto?.tipoProyecto ?? ''}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>

                    <TableCell>
                      <Typography fontSize={13}>{row.cliente?.nombre ?? '—'}</Typography>
                      <Typography fontSize={11} color="text.secondary">{row.cliente?.email ?? ''}</Typography>
                    </TableCell>

                    <TableCell><PlanChip plan={row.plan} /></TableCell>
                    <TableCell><EstadoChipLocal estado={row.estado} /></TableCell>

                    <TableCell>
                      <Typography fontSize={13} fontWeight={600} sx={{ color: '#0F172A' }}>
                        {fmt(row.rangoMinimo)} – {fmt(row.rangoMaximo)}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Typography fontSize={12.5} color="text.secondary">{fmtD(row.fechaGeneracion)}</Typography>
                    </TableCell>

                    <TableCell>
                      <Chip label={`v${row.version}`} size="small"
                        sx={{ bgcolor: '#F1F5F9', color: '#475569', fontWeight: 700, fontSize: 11, height: 20 }} />
                    </TableCell>

                    <TableCell align="center" sx={{ pr: 1 }}>
                      <AccionesMenu
                        row={row}
                        onRefresh={cargar}
                        onToast={notify}
                        onComparar={handleComparar}
                        comparando={comparando}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Paginación simple */}
        {total > 20 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, p: 2, borderTop: '1px solid #F1F5F9' }}>
            <Button size="small" disabled={page === 1} onClick={() => setPage(p => p - 1)}
              sx={{ textTransform: 'none' }}>← Anterior</Button>
            <Typography fontSize={13} sx={{ display: 'flex', alignItems: 'center', px: 1 }}>
              Página {page}
            </Typography>
            <Button size="small" disabled={rows.length < 20} onClick={() => setPage(p => p + 1)}
              sx={{ textTransform: 'none' }}>Siguiente →</Button>
          </Box>
        )}
      </Paper>

      {/* ── Modal comparación ────────────────────────────────────────────────── */}
      {showComp && (
        <ComparacionModal ids={comparando} onClose={() => setShowComp(false)} />
      )}

      {/* ── Snackbar ─────────────────────────────────────────────────────────── */}
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
