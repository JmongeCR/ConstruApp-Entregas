import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, Chip, Tabs, Tab, Skeleton,
  Snackbar, Alert, Tooltip, IconButton, Divider,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, FormControl, InputLabel, Select, MenuItem, InputAdornment,
  InputBase,
} from '@mui/material';
import AddIcon           from '@mui/icons-material/Add';
import ReceiptLongIcon   from '@mui/icons-material/ReceiptLong';
import PaymentsIcon      from '@mui/icons-material/Payments';
import ArrowForwardIcon  from '@mui/icons-material/ArrowForward';
import BlockIcon         from '@mui/icons-material/Block';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import SearchIcon        from '@mui/icons-material/Search';
import CloseIcon         from '@mui/icons-material/Close';
import { facturasApi } from '../../api/endpoints';

const ESTADO = {
  Borrador:    { label: 'Borrador',     color: '#64748B', bg: '#F1F5F9' },
  Enviada:     { label: 'Pendiente',    color: '#92400E', bg: '#FEF3C7' },
  PagoParcial: { label: 'Parcial',      color: '#1E40AF', bg: '#DBEAFE' },
  Pagada:      { label: 'Pagada',       color: '#065F46', bg: '#D1FAE5' },
  Vencida:     { label: 'Vencida',      color: '#991B1B', bg: '#FEE2E2' },
  Cancelada:   { label: 'Anulada',      color: '#94A3B8', bg: '#F8FAFC' },
};

const METODOS = [
  { value: 'Transferencia', label: 'Transferencia' },
  { value: 'SINPE',         label: 'SINPE Móvil'   },
  { value: 'Efectivo',      label: 'Efectivo'       },
  { value: 'Cheque',        label: 'Cheque'         },
  { value: 'Tarjeta',       label: 'Tarjeta'        },
  { value: 'Otro',          label: 'Otro'           },
];

const fmt     = v  => v != null ? `₡${Number(v).toLocaleString('es-CR')}` : '—';
const fmtDate = d  => d ? new Date(d).toLocaleDateString('es-CR', { day:'2-digit', month:'short', year:'numeric' }) : '—';
const toInput = d  => d ? new Date(d).toISOString().split('T')[0] : '';

// ── Stat pill ─────────────────────────────────────────────────────────────────
function StatPill({ label, value, color = '#0F172A', icon: Icon, accentColor }) {
  const accent = accentColor ?? '#94A3B8';
  return (
    <Box sx={{
      display: 'flex', alignItems: 'center', gap: 1.5,
      px: 2, py: 1.75,
      bgcolor: 'white', border: '1px solid #E8EDF3', borderRadius: '12px', minWidth: 148,
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      transition: '.15s',
      '&:hover': { boxShadow: '0 4px 16px rgba(0,0,0,0.08)', transform: 'translateY(-1px)', borderColor: '#D8E1EE' },
    }}>
      {Icon && (
        <Box sx={{
          width: 36, height: 36, borderRadius: '9px', flexShrink: 0,
          bgcolor: `${accent}18`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon sx={{ fontSize: 17, color: accent }} />
        </Box>
      )}
      <Box>
        <Typography sx={{ color: '#7B8EA8', fontWeight: 600, letterSpacing: 0.3, fontSize: 10.5, textTransform: 'uppercase', lineHeight: 1, mb: 0.5 }}>
          {label}
        </Typography>
        <Typography fontWeight={800} fontSize={19} sx={{ color, lineHeight: 1.1 }}>{value}</Typography>
      </Box>
    </Box>
  );
}

// ── Fila de factura ───────────────────────────────────────────────────────────
function FacturaRow({ f, onPago, onCancelar, onVer }) {
  const est   = ESTADO[f.estado] ?? ESTADO.Enviada;
  const saldo = f.montoTotal - f.montoPagado;
  const pct   = f.montoTotal > 0 ? Math.round((f.montoPagado / f.montoTotal) * 100) : 0;

  const diasVence = f.fechaVencimiento
    ? Math.ceil((new Date(f.fechaVencimiento) - new Date()) / 86_400_000) : null;

  const pagada   = f.estado === 'Pagada';
  const cancelada = f.estado === 'Cancelada';
  const vencida  = f.estado === 'Vencida';

  return (
    <Box
      onClick={() => onVer(f)}
      sx={{
        display: 'grid',
        gridTemplateColumns: '130px 1fr 110px 110px 110px 100px 110px 120px',
        alignItems: 'center',
        gap: 1.5,
        px: 2.5, py: 1.75,
        borderBottom: '1px solid #F1F5F9',
        cursor: 'pointer',
        transition: '.1s',
        opacity: cancelada ? 0.5 : 1,
        '&:hover': { bgcolor: cancelada ? 'transparent' : '#FAFAFA' },
      }}
    >
      {/* Número */}
      <Typography fontWeight={700} fontSize={12.5} sx={{ color: '#0F172A', fontFamily: 'monospace' }}>
        {f.numero}
      </Typography>

      {/* Proyecto + concepto */}
      <Box sx={{ minWidth: 0 }}>
        <Typography fontWeight={600} fontSize={13} noWrap sx={{ color: '#0F172A' }}>
          {f.proyectoTitulo ?? `Proyecto #${f.proyectoId}`}
        </Typography>
        {f.concepto && (
          <Typography variant="caption" color="text.disabled" noWrap sx={{ display: 'block' }}>
            {f.concepto}
          </Typography>
        )}
      </Box>

      {/* Total */}
      <Typography fontWeight={700} fontSize={13} sx={{ color: '#0F172A', textAlign: 'right' }}>
        {fmt(f.montoTotal)}
      </Typography>

      {/* Cobrado */}
      <Typography fontWeight={600} fontSize={13}
        sx={{ color: f.montoPagado > 0 ? '#065F46' : '#94A3B8', textAlign: 'right' }}>
        {fmt(f.montoPagado)}
      </Typography>

      {/* Saldo */}
      <Typography fontWeight={700} fontSize={13}
        sx={{ color: saldo > 0 ? (vencida ? '#DC2626' : '#1D4ED8') : '#065F46', textAlign: 'right' }}>
        {fmt(saldo)}
      </Typography>

      {/* Estado */}
      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <Chip label={est.label} size="small"
          sx={{ bgcolor: est.bg, color: est.color, fontWeight: 700, fontSize: 10.5,
            height: 22, borderRadius: 1 }} />
      </Box>

      {/* Vencimiento */}
      <Box>
        {f.fechaVencimiento ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
            <CalendarTodayIcon sx={{ fontSize: 11,
              color: diasVence !== null && diasVence < 0 ? '#DC2626'
                   : diasVence !== null && diasVence < 4 ? '#F59E0B' : '#94A3B8' }} />
            <Typography variant="caption" fontWeight={600}
              sx={{ color: diasVence !== null && diasVence < 0 ? '#DC2626'
                         : diasVence !== null && diasVence < 4 ? '#F59E0B' : '#64748B' }}>
              {fmtDate(f.fechaVencimiento)}
            </Typography>
          </Box>
        ) : (
          <Typography variant="caption" color="text.disabled">—</Typography>
        )}
      </Box>

      {/* Acciones */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}
        onClick={e => e.stopPropagation()}>
        {!pagada && !cancelada && (
          <Tooltip title="Registrar pago">
            <IconButton size="small" onClick={() => onPago(f)}
              sx={{ color: '#3B82F6', bgcolor: '#EFF6FF', borderRadius: 1, width: 28, height: 28,
                '&:hover': { bgcolor: '#DBEAFE' } }}>
              <PaymentsIcon sx={{ fontSize: 14 }} />
            </IconButton>
          </Tooltip>
        )}
        {!pagada && !cancelada && (
          <Tooltip title="Anular factura">
            <IconButton size="small" onClick={() => onCancelar(f)}
              sx={{ color: '#94A3B8', borderRadius: 1, width: 28, height: 28,
                '&:hover': { color: '#EF4444', bgcolor: '#FEF2F2' } }}>
              <BlockIcon sx={{ fontSize: 14 }} />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    </Box>
  );
}

// ── Modal: registrar pago ─────────────────────────────────────────────────────
function ModalPago({ open, factura, onClose, onPagado, notify }) {
  const saldo = factura ? factura.montoTotal - factura.montoPagado : 0;
  const [form, setForm] = useState({
    monto: '', metodoPago: 'Transferencia',
    fecha: toInput(new Date()), referencia: '', notas: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && factura) setForm(f => ({ ...f, monto: saldo.toString() }));
  }, [open, factura]);

  const set = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async () => {
    if (!form.monto || Number(form.monto) <= 0) { notify('Ingresá un monto válido.', 'error'); return; }
    setSaving(true);
    try {
      await facturasApi.registrarPago(factura.id, {
        monto: Number(form.monto), metodoPago: form.metodoPago,
        fecha: form.fecha || null, referencia: form.referencia || null, notas: form.notas || null,
      });
      onPagado(); onClose();
    } catch { notify('Error al registrar el pago.', 'error'); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth
      PaperProps={{ sx: { borderRadius: 2.5, boxShadow: '0 20px 60px rgba(0,0,0,0.12)' } }}>
      <DialogTitle sx={{ fontSize: 15, fontWeight: 800, pb: 0.5 }}>
        Registrar pago — <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{factura?.numero}</span>
      </DialogTitle>
      <DialogContent sx={{ pt: '12px !important', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Box sx={{ bgcolor: '#F8FAFC', borderRadius: 1.5, p: 1.5, display: 'flex', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="caption" color="text.disabled">Saldo por cobrar</Typography>
            <Typography fontWeight={800} color="#1D4ED8">{fmt(saldo)}</Typography>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="caption" color="text.disabled">Total factura</Typography>
            <Typography fontWeight={700}>{fmt(factura?.montoTotal)}</Typography>
          </Box>
        </Box>
        <TextField label="Monto recibido (₡) *" name="monto" value={form.monto}
          onChange={set} type="number" size="small" fullWidth
          InputProps={{ startAdornment: <InputAdornment position="start">₡</InputAdornment> }} />
        <FormControl fullWidth size="small">
          <InputLabel>Método de pago</InputLabel>
          <Select name="metodoPago" value={form.metodoPago} onChange={set} label="Método de pago">
            {METODOS.map(m => <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>)}
          </Select>
        </FormControl>
        <TextField label="Fecha del pago" name="fecha" value={form.fecha}
          onChange={set} type="date" size="small" fullWidth InputLabelProps={{ shrink: true }} />
        <TextField label="Referencia / comprobante" name="referencia" value={form.referencia}
          onChange={set} size="small" fullWidth placeholder="Ej: 202506230001" />
      </DialogContent>
      <DialogActions sx={{ px: 2.5, pb: 2.5, gap: 1 }}>
        <Button onClick={onClose} size="small">Cancelar</Button>
        <Button variant="contained" onClick={submit} disabled={saving} size="small"
          sx={{ bgcolor: '#2563EB', '&:hover': { bgcolor: '#1D4ED8' }, fontWeight: 700 }}>
          {saving ? 'Guardando…' : 'Confirmar pago'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
export default function Facturacion() {
  const navigate = useNavigate();
  const [facturas, setFacturas]     = useState([]);
  const [loading,  setLoading]      = useState(true);
  const [tab,      setTab]          = useState(0);
  const [search,   setSearch]       = useState('');
  const [modalPago, setModalPago]   = useState({ open: false, factura: null });
  const [confirmAnular, setConfirmAnular] = useState({ open: false, f: null });
  const [toast, setToast]           = useState({ open: false, msg: '', severity: 'success' });

  const notify  = (msg, severity = 'success') => setToast({ open: true, msg, severity });

  const cargar = () => {
    setLoading(true);
    facturasApi.getMias().then(r => setFacturas(r.data)).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { cargar(); }, []);

  const TABS = [
    { label: 'Todas',        fn: () => true },
    { label: 'Pendientes',   fn: f => f.estado === 'Enviada' || f.estado === 'PagoParcial' },
    { label: 'Pagadas',      fn: f => f.estado === 'Pagada' },
    { label: 'Vencidas',     fn: f => f.estado === 'Vencida' },
    { label: 'Anuladas',     fn: f => f.estado === 'Cancelada' },
  ];

  const q = search.toLowerCase().trim();
  const filtradas = facturas
    .filter(TABS[tab].fn)
    .filter(f => !q ||
      f.numero?.toLowerCase().includes(q) ||
      (f.proyectoTitulo ?? '').toLowerCase().includes(q) ||
      (f.concepto ?? '').toLowerCase().includes(q)
    );
  const activas   = facturas.filter(f => f.estado !== 'Cancelada');

  const totalFacturado = activas.reduce((s, f) => s + (f.montoTotal || 0), 0);
  const totalCobrado   = activas.reduce((s, f) => s + (f.montoPagado || 0), 0);
  const totalPendiente = activas
    .filter(f => f.estado !== 'Pagada')
    .reduce((s, f) => s + (f.montoTotal - f.montoPagado), 0);

  const fmtK = v => v >= 1_000_000
    ? `₡${(v / 1_000_000).toFixed(1)}M`
    : `₡${Number(v).toLocaleString('es-CR')}`;

  const handleAnular = async () => {
    try {
      await facturasApi.cancelar(confirmAnular.f.id);
      cargar(); notify('Factura anulada.');
    } catch { notify('Error al anular.', 'error'); }
    finally { setConfirmAnular({ open: false, f: null }); }
  };

  return (
    <Box>
      {/* ── Header ── */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={800} sx={{ color: '#0F172A' }}>Facturación</Typography>
          <Typography fontSize={13.5} color="text.secondary" sx={{ mt: 0.3 }}>
            Registro de cobros por proyecto
          </Typography>
        </Box>
        <Button variant="contained" size="small" startIcon={<AddIcon />}
          onClick={() => navigate('/facturacion/nueva')}
          sx={{ bgcolor: '#2563EB', '&:hover': { bgcolor: '#1D4ED8' }, fontWeight: 700, height: 36 }}>
          Nueva factura
        </Button>
      </Box>

      {/* ── Stats ── */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2,1fr)', sm: 'repeat(4,1fr)' }, gap: 1.5, mb: 3 }}>
        <StatPill label="Total facturado"  value={loading ? '…' : fmtK(totalFacturado)} accentColor="#2563EB" icon={ReceiptLongIcon} />
        <StatPill label="Cobrado"          value={loading ? '…' : fmtK(totalCobrado)}   color="#065F46" accentColor="#16A34A" icon={PaymentsIcon} />
        <StatPill label="Por cobrar"       value={loading ? '…' : fmtK(totalPendiente)} color="#1D4ED8" accentColor="#D97706" icon={CalendarTodayIcon} />
        <StatPill label="Facturas activas" value={loading ? '…' : activas.length.toString()} accentColor="#7C3AED" icon={ReceiptLongIcon} />
      </Box>

      {/* ── Cobro progress bar ── */}
      {!loading && totalFacturado > 0 && (
        <Box sx={{ bgcolor: 'white', border: '1px solid #E2E8F0', borderRadius: '8px', px: 2.5, py: 1.75, mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.75 }}>
            <Typography fontSize={12} fontWeight={600} color="text.secondary">Porcentaje cobrado</Typography>
            <Typography fontSize={13} fontWeight={700} color="#065F46">
              {Math.round((totalCobrado / totalFacturado) * 100)}%
            </Typography>
          </Box>
          <Box sx={{ height: 6, bgcolor: '#F1F5F9', borderRadius: 3, overflow: 'hidden' }}>
            <Box sx={{
              height: '100%', borderRadius: 3,
              width: `${Math.min(100, Math.round((totalCobrado / totalFacturado) * 100))}%`,
              background: 'linear-gradient(90deg, #16A34A, #22C55E)',
              transition: 'width 0.6s ease',
            }} />
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
            <Typography fontSize={10.5} color="text.disabled">₡0</Typography>
            <Typography fontSize={10.5} color="text.disabled">{fmtK(totalFacturado)}</Typography>
          </Box>
        </Box>
      )}

      {/* ── Tabla ── */}
      <Box sx={{ bgcolor: 'white', border: '1px solid #E2E8F0', borderRadius: 2, overflow: 'hidden' }}>
        {/* Tabs + search toolbar */}
        <Box sx={{ px: 2, borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
          <Tabs value={tab} onChange={(_, v) => { setTab(v); setSearch(''); }}
            sx={{
              minHeight: 44,
              '& .MuiTab-root':       { minHeight: 44, fontSize: 13, fontWeight: 600, textTransform: 'none', px: 1.5, py: 0 },
              '& .Mui-selected':      { color: '#2563EB', fontWeight: 700 },
              '& .MuiTabs-indicator': { bgcolor: '#2563EB', height: 2 },
            }}>
            {TABS.map((t, i) => {
              const count = facturas.filter(t.fn).length;
              return (
                <Tab key={i} label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                    {t.label}
                    {count > 0 && (
                      <Box sx={{
                        bgcolor: tab === i ? '#2563EB' : '#F1F5F9',
                        color: tab === i ? 'white' : '#64748B',
                        borderRadius: '99px', px: 0.7, lineHeight: '16px',
                        fontSize: 10, fontWeight: 800,
                      }}>{count}</Box>
                    )}
                  </Box>
                } />
              );
            })}
          </Tabs>

          {/* Search */}
          <Box sx={{
            display: 'flex', alignItems: 'center', gap: 0.75,
            bgcolor: search ? '#fff' : '#F8FAFC',
            border: `1px solid ${search ? '#2563EB' : '#E2E8F0'}`,
            borderRadius: '7px', px: 1.25, height: 33,
            transition: '.15s',
            '&:focus-within': { border: '1px solid #2563EB', bgcolor: '#fff' },
          }}>
            <SearchIcon sx={{ fontSize: 15, color: '#94A3B8', flexShrink: 0 }} />
            <InputBase
              placeholder="Buscar factura, proyecto..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              sx={{ fontSize: 12.5, width: { xs: 120, sm: 180 }, '& input': { padding: 0 } }}
            />
            {search && (
              <IconButton size="small" onClick={() => setSearch('')} sx={{ p: '2px', mr: -0.5 }}>
                <CloseIcon sx={{ fontSize: 13, color: '#94A3B8' }} />
              </IconButton>
            )}
          </Box>
        </Box>

        {/* Cabecera tabla */}
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: '130px 1fr 110px 110px 110px 100px 110px 120px',
          gap: 1.5, px: 2.5, py: 1.2,
          bgcolor: '#F8FAFC', borderBottom: '1px solid #F1F5F9',
        }}>
          {['N° FACTURA', 'PROYECTO / CONCEPTO', 'TOTAL', 'COBRADO', 'SALDO', 'ESTADO', 'VENCE', ''].map((h, i) => (
            <Typography key={i} variant="caption" fontWeight={700}
              sx={{ color: '#94A3B8', fontSize: 10.5, letterSpacing: 0.5,
                textAlign: i >= 2 && i <= 4 ? 'right' : 'left' }}>
              {h}
            </Typography>
          ))}
        </Box>

        {/* Filas */}
        {loading ? (
          <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {[1,2,3,4].map(i => <Skeleton key={i} height={42} sx={{ borderRadius: 1 }} />)}
          </Box>
        ) : filtradas.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 10 }}>
            <ReceiptLongIcon sx={{ fontSize: 40, color: '#E2E8F0', mb: 1.5 }} />
            <Typography fontWeight={600} color="#94A3B8" gutterBottom>
              {search
                ? `Sin resultados para "${search}"`
                : tab === 0 ? 'Aún no hay facturas' : `Sin facturas ${TABS[tab].label.toLowerCase()}`
              }
            </Typography>
            {search ? (
              <Button size="small" onClick={() => setSearch('')}
                sx={{ mt: 1, color: '#2563EB', fontWeight: 600, textTransform: 'none' }}>
                Limpiar búsqueda
              </Button>
            ) : tab === 0 && (
              <Button size="small" startIcon={<AddIcon />}
                onClick={() => navigate('/facturacion/nueva')}
                sx={{ mt: 1, color: '#0F172A', fontWeight: 700, textTransform: 'none' }}>
                Crear primera factura
              </Button>
            )}
          </Box>
        ) : (
          filtradas.map(f => (
            <FacturaRow key={f.id} f={f}
              onVer={fac => navigate(`/facturacion/${fac.id}`)}
              onPago={fac => setModalPago({ open: true, factura: fac })}
              onCancelar={fac => setConfirmAnular({ open: true, f: fac })}
            />
          ))
        )}
      </Box>

      {/* Modales */}
      <ModalPago open={modalPago.open} factura={modalPago.factura}
        onClose={() => setModalPago({ open: false, factura: null })}
        onPagado={() => { cargar(); notify('Pago registrado.'); }} notify={notify} />

      <Dialog open={confirmAnular.open} onClose={() => setConfirmAnular({ open: false, f: null })}
        PaperProps={{ sx: { borderRadius: 2.5, maxWidth: 360 } }}>
        <DialogTitle sx={{ fontWeight: 800, fontSize: 15 }}>Anular factura</DialogTitle>
        <DialogContent>
          <Typography fontSize={13.5}>
            ¿Anular <strong style={{ fontFamily: 'monospace' }}>{confirmAnular.f?.numero}</strong>?
            Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 2.5, pb: 2.5, gap: 1 }}>
          <Button size="small" onClick={() => setConfirmAnular({ open: false, f: null })}>Cancelar</Button>
          <Button size="small" variant="contained" color="error" onClick={handleAnular}>Anular</Button>
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
