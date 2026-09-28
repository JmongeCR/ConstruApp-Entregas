/**
 * Nueva Factura — Editor estilo Stripe/QuickBooks
 * Una sola pantalla: editor izquierda + preview derecha
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, TextField, FormControl, InputLabel,
  Select, MenuItem, Divider, Alert, InputAdornment, Switch,
  FormControlLabel, IconButton, Tooltip, Chip, CircularProgress, Skeleton,
} from '@mui/material';
import ArrowBackIcon       from '@mui/icons-material/ArrowBack';
import AddIcon             from '@mui/icons-material/Add';
import DeleteIcon          from '@mui/icons-material/Delete';
import SaveIcon            from '@mui/icons-material/Save';
import SendIcon            from '@mui/icons-material/Send';
import SettingsIcon        from '@mui/icons-material/Settings';
import ForumIcon           from '@mui/icons-material/Forum';
import PictureAsPdfIcon    from '@mui/icons-material/PictureAsPdf';
import DragIndicatorIcon   from '@mui/icons-material/DragIndicator';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { FacturaPDF }      from '../../utils/pdf/FacturaPDF';
import {
  facturasApi, propuestasApi, proyectosApi,
  perfilesConstructorApi,
} from '../../api/endpoints';

const ACCENT = '#2563EB';
const fmtCR = v => v != null ? `₡${Number(v).toLocaleString('es-CR', { minimumFractionDigits: 0 })}` : '₡0';
const todayStr = () => new Date().toLocaleDateString('es-CR', { day: '2-digit', month: 'long', year: 'numeric' });

// ── Generador de ID local para líneas ────────────────────────────────────────
let lineId = 0;
const newLine = (descripcion = '', cantidad = 1, precioUnit = '') => ({
  _id: ++lineId, descripcion, cantidad, precioUnit,
});

// ── Preview de factura ────────────────────────────────────────────────────────
function InvoicePreview({ perfil, proyecto, numero, lineas, ajustes, notas, fechaVencimiento, financiero }) {
  const subtotal   = lineas.reduce((s, l) => s + Number(l.cantidad || 1) * Number(l.precioUnit || 0), 0);
  const descMonto  = ajustes.descuentoTipo === 'pct'
    ? subtotal * (Number(ajustes.descuento || 0) / 100)
    : Number(ajustes.descuento || 0);
  const base   = subtotal - descMonto;
  const ivaMonto = ajustes.iva ? base * ((Number(financiero?.tasaIVA) || 13) / 100) : 0;
  const total  = base + ivaMonto;

  const venceStr = fechaVencimiento
    ? new Date(fechaVencimiento).toLocaleDateString('es-CR', { day: '2-digit', month: 'long', year: 'numeric' })
    : null;

  return (
    <Box sx={{
      bgcolor: 'white', border: '1px solid #E2E8F0', borderRadius: 2,
      p: '32px', boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
      fontSize: 13, color: '#1E293B',
    }}>
      {/* Empresa */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 0.5 }}>
            <Box sx={{ width: 32, height: 32, borderRadius: '8px', bgcolor: ACCENT,
              display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography fontWeight={900} sx={{ color: 'white', fontSize: 14 }}>
                {(perfil?.nombreEmpresa || 'E')[0]?.toUpperCase()}
              </Typography>
            </Box>
            <Box>
              <Typography fontWeight={800} fontSize={14} sx={{ color: '#0F172A' }}>
                {perfil?.nombreEmpresa || 'Mi empresa'}
              </Typography>
              {perfil?.cedulaJuridica && (
                <Typography fontSize={11} color="text.disabled">CJ {perfil.cedulaJuridica}</Typography>
              )}
            </Box>
          </Box>
          {financiero?.direccionFiscal && (
            <Typography fontSize={11.5} color="text.secondary">{financiero.direccionFiscal}</Typography>
          )}
          {financiero?.emailFacturacion && (
            <Typography fontSize={11.5} color="text.secondary">{financiero.emailFacturacion}</Typography>
          )}
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          <Typography fontWeight={900} fontSize={22} sx={{ color: '#0F172A', letterSpacing: -0.5 }}>
            FACTURA
          </Typography>
          <Typography fontWeight={700} fontSize={11} sx={{ color: '#94A3B8', fontFamily: 'monospace' }}>
            {numero || `${financiero?.prefijoFactura || 'FAC'}-2026-XXXX`}
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ mb: 2.5 }} />

      {/* Fechas + cliente */}
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 3 }}>
        <Box>
          <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 700, fontSize: 9.5, letterSpacing: 0.7 }}>
            COBRAR A
          </Typography>
          <Typography fontWeight={700} fontSize={13} sx={{ color: '#0F172A', mt: 0.5 }}>
            {proyecto?.clienteNombre || proyecto?.titulo || <span style={{ color: '#CBD5E1' }}>Cliente</span>}
          </Typography>
          {proyecto?.titulo && proyecto?.clienteNombre && (
            <Typography fontSize={11.5} color="text.secondary">{proyecto.titulo}</Typography>
          )}
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          <Box sx={{ mb: 1 }}>
            <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 700, fontSize: 9.5, letterSpacing: 0.7 }}>
              FECHA EMISIÓN
            </Typography>
            <Typography fontSize={12.5} fontWeight={600} sx={{ color: '#0F172A' }}>{todayStr()}</Typography>
          </Box>
          {venceStr && (
            <Box>
              <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 700, fontSize: 9.5, letterSpacing: 0.7 }}>
                VENCIMIENTO
              </Typography>
              <Typography fontSize={12.5} fontWeight={600} sx={{ color: '#DC2626' }}>{venceStr}</Typography>
            </Box>
          )}
        </Box>
      </Box>

      {/* Tabla de líneas */}
      <Box sx={{ border: '1px solid #F1F5F9', borderRadius: 1.5, overflow: 'hidden', mb: 2.5 }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 56px 80px 80px',
          bgcolor: '#F8FAFC', px: 2, py: 1, gap: 1 }}>
          {['DESCRIPCIÓN', 'CANT.', 'PRECIO', 'IMPORTE'].map((h, i) => (
            <Typography key={h} variant="caption" fontWeight={700}
              sx={{ color: '#94A3B8', fontSize: 9.5, letterSpacing: 0.6,
                textAlign: i > 0 ? 'right' : 'left' }}>{h}</Typography>
          ))}
        </Box>
        {lineas.length === 0 ? (
          <Box sx={{ px: 2, py: 2 }}>
            <Typography fontSize={12} color="text.disabled">Sin ítems…</Typography>
          </Box>
        ) : lineas.map((l, i) => {
          const sub = Number(l.cantidad || 1) * Number(l.precioUnit || 0);
          return (
            <Box key={l._id} sx={{
              display: 'grid', gridTemplateColumns: '1fr 56px 80px 80px',
              px: 2, py: 1.25, gap: 1,
              borderTop: i > 0 ? '1px solid #F8FAFC' : 'none',
            }}>
              <Typography fontSize={12.5}>{l.descripcion || <span style={{ color: '#CBD5E1' }}>—</span>}</Typography>
              <Typography fontSize={12.5} sx={{ textAlign: 'right' }}>{l.cantidad}</Typography>
              <Typography fontSize={12.5} sx={{ textAlign: 'right' }}>{fmtCR(l.precioUnit)}</Typography>
              <Typography fontSize={12.5} fontWeight={600} sx={{ textAlign: 'right' }}>{fmtCR(sub)}</Typography>
            </Box>
          );
        })}
      </Box>

      {/* Totales */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2.5 }}>
        <Box sx={{ width: 220 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography fontSize={12} color="text.secondary">Subtotal</Typography>
            <Typography fontSize={12} fontWeight={700}>{fmtCR(subtotal)}</Typography>
          </Box>
          {descMonto > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography fontSize={12} color="text.secondary">Descuento</Typography>
              <Typography fontSize={12} fontWeight={700} sx={{ color: '#DC2626' }}>-{fmtCR(descMonto)}</Typography>
            </Box>
          )}
          {ivaMonto > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography fontSize={12} color="text.secondary">IVA {financiero?.tasaIVA ?? 13}%</Typography>
              <Typography fontSize={12} fontWeight={700}>{fmtCR(ivaMonto)}</Typography>
            </Box>
          )}
          <Divider sx={{ my: 1 }} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <Typography fontWeight={800} fontSize={13}>TOTAL</Typography>
            <Typography fontWeight={900} fontSize={18} sx={{ color: '#0F172A' }}>{fmtCR(total)}</Typography>
          </Box>
        </Box>
      </Box>

      {/* Notas / términos */}
      {(notas || financiero?.terminosCondiciones) && (
        <>
          <Divider sx={{ mb: 1.5 }} />
          {notas && (
            <Box sx={{ mb: 1 }}>
              <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 700, fontSize: 9.5, letterSpacing: 0.7 }}>
                NOTAS
              </Typography>
              <Typography fontSize={11.5} color="text.secondary" sx={{ mt: 0.5 }}>{notas}</Typography>
            </Box>
          )}
          {financiero?.terminosCondiciones && (
            <Box>
              <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 700, fontSize: 9.5, letterSpacing: 0.7 }}>
                TÉRMINOS Y CONDICIONES
              </Typography>
              <Typography fontSize={11} color="text.disabled" sx={{ mt: 0.5, lineHeight: 1.5 }}>
                {financiero.terminosCondiciones}
              </Typography>
            </Box>
          )}
        </>
      )}

      {/* Formas de pago */}
      {financiero?.formasPago && (() => {
        try {
          const fp = JSON.parse(financiero.formasPago);
          if (fp.length === 0) return null;
          return (
            <>
              <Divider sx={{ my: 1.5 }} />
              <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 700, fontSize: 9.5, letterSpacing: 0.7 }}>
                FORMAS DE PAGO ACEPTADAS
              </Typography>
              <Typography fontSize={11.5} color="text.secondary" sx={{ mt: 0.5 }}>
                {fp.join(' · ')}
              </Typography>
            </>
          );
        } catch { return null; }
      })()}

      <Divider sx={{ mt: 2.5, mb: 1.5 }} />
      <Typography variant="caption" color="text.disabled" sx={{ display: 'block', textAlign: 'center', fontSize: 10 }}>
        Generado con ConstruApp · {new Date().getFullYear()}
      </Typography>
    </Box>
  );
}

// ── Tabla de líneas (editor) ──────────────────────────────────────────────────
function LineasEditor({ lineas, setLineas }) {
  const addLinea = () => setLineas(prev => [...prev, newLine()]);
  const remove   = (id) => setLineas(prev => prev.filter(l => l._id !== id));
  const update   = (id, field, val) =>
    setLineas(prev => prev.map(l => l._id === id ? { ...l, [field]: val } : l));

  return (
    <Box>
      {/* Cabecera */}
      <Box sx={{ display: 'grid', gridTemplateColumns: '32px 1fr 80px 120px 100px 36px',
        gap: 1, px: 1, pb: 1, borderBottom: '1px solid #F1F5F9' }}>
        {['', 'DESCRIPCIÓN', 'CANT.', 'PRECIO UNIT.', 'SUBTOTAL', ''].map((h, i) => (
          <Typography key={i} variant="caption" fontWeight={700}
            sx={{ color: '#94A3B8', fontSize: 10, letterSpacing: 0.5,
              textAlign: i >= 2 && i <= 4 ? 'right' : 'left' }}>{h}</Typography>
        ))}
      </Box>

      {/* Filas */}
      {lineas.map(l => {
        const sub = Number(l.cantidad || 1) * Number(l.precioUnit || 0);
        return (
          <Box key={l._id} sx={{
            display: 'grid', gridTemplateColumns: '32px 1fr 80px 120px 100px 36px',
            gap: 1, alignItems: 'center', py: 1,
            borderBottom: '1px solid #F8FAFC',
            '&:hover': { bgcolor: '#FAFAFA' },
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', color: '#CBD5E1', cursor: 'grab' }}>
              <DragIndicatorIcon sx={{ fontSize: 16 }} />
            </Box>
            <TextField size="small" placeholder="Descripción del concepto…"
              value={l.descripcion}
              onChange={e => update(l._id, 'descripcion', e.target.value)}
              sx={{ '& .MuiOutlinedInput-root': { fontSize: 13 } }} />
            <TextField size="small" type="number" value={l.cantidad}
              onChange={e => update(l._id, 'cantidad', e.target.value)}
              inputProps={{ min: 1, style: { textAlign: 'right' } }}
              sx={{ '& .MuiOutlinedInput-root': { fontSize: 13 } }} />
            <TextField size="small" type="number" value={l.precioUnit}
              onChange={e => update(l._id, 'precioUnit', e.target.value)}
              placeholder="0"
              InputProps={{ startAdornment: <InputAdornment position="start" sx={{ fontSize: 12 }}>₡</InputAdornment> }}
              sx={{ '& .MuiOutlinedInput-root': { fontSize: 13 } }} />
            <Typography fontSize={13} fontWeight={700}
              sx={{ textAlign: 'right', color: sub > 0 ? '#0F172A' : '#CBD5E1', pr: 0.5 }}>
              {fmtCR(sub)}
            </Typography>
            <IconButton size="small" onClick={() => remove(l._id)}
              sx={{ color: '#CBD5E1', '&:hover': { color: '#EF4444', bgcolor: '#FEF2F2' } }}>
              <DeleteIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Box>
        );
      })}

      {/* Agregar */}
      <Box sx={{ pt: 1.5 }}>
        <Button size="small" startIcon={<AddIcon sx={{ fontSize: 15 }} />}
          onClick={addLinea}
          sx={{ fontSize: 12.5, textTransform: 'none', fontWeight: 600,
            color: ACCENT, '&:hover': { bgcolor: '#EFF6FF' } }}>
          Agregar línea
        </Button>
      </Box>
    </Box>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
export default function FacturaNueva() {
  const navigate = useNavigate();

  const [perfil,      setPerfil]      = useState(null);
  const [financiero,  setFinanciero]  = useState(null);
  const [proyectos,   setProyectos]   = useState([]);
  const [numero,      setNumero]      = useState('');
  const [loadingInit, setLoadingInit] = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [sendingChat, setSendingChat] = useState(false);
  const [error,       setError]       = useState('');

  // Datos de la factura
  const [proyectoId,       setProyectoId]       = useState('');
  const [fechaVencimiento, setFechaVencimiento] = useState('');
  const [notas,            setNotas]            = useState('');
  const [lineas,           setLineas]           = useState([newLine()]);
  const [ajustes, setAjustes] = useState({
    descuentoTipo: 'ninguno', descuento: '', iva: false,
  });
  const [enviarChat, setEnviarChat] = useState(false);

  const proyectoSel = proyectos.find(p => p.id === Number(proyectoId)) ?? null;

  // Cálculos
  const subtotal  = lineas.reduce((s, l) => s + Number(l.cantidad || 1) * Number(l.precioUnit || 0), 0);
  const descMonto = ajustes.descuentoTipo === 'pct'
    ? subtotal * (Number(ajustes.descuento || 0) / 100)
    : Number(ajustes.descuento || 0);
  const base      = subtotal - descMonto;
  const tasaIVA   = Number(financiero?.tasaIVA) || 13;
  const ivaMonto  = ajustes.iva ? base * (tasaIVA / 100) : 0;
  const total     = base + ivaMonto;

  useEffect(() => {
    // Calcular fecha de vencimiento por defecto
    const diasVenc = financiero?.diasVencimiento || 30;
    const d = new Date();
    d.setDate(d.getDate() + diasVenc);
    setFechaVencimiento(d.toISOString().split('T')[0]);
  }, [financiero]);

  useEffect(() => {
    // Aplicar IVA por defecto desde config
    if (financiero?.aplicaIVADefault) {
      setAjustes(a => ({ ...a, iva: true }));
    }
  }, [financiero?.aplicaIVADefault]);

  useEffect(() => {
    Promise.all([
      perfilesConstructorApi.getMio().then(r => setPerfil(r.data)).catch(() => {}),
      perfilesConstructorApi.getFinanciero().then(r => setFinanciero(r.data)).catch(() => {}),
      propuestasApi.getMias()
        .then(r => {
          const activas = r.data.filter(p => p.estado === 'Aceptada' || p.estado === 'Finalizada');
          const pids    = [...new Set(activas.map(p => p.proyectoId))];
          return Promise.all(pids.map(id => proyectosApi.getById(id).then(r2 => r2.data)));
        })
        .then(ps => setProyectos(ps))
        .catch(() => {}),
      facturasApi.getMias()
        .then(r => {
          const pref = 'FAC'; // se actualiza con financiero
          setNumero(`${pref}-${new Date().getFullYear()}-${String(r.data.length + 1).padStart(4, '0')}`);
        })
        .catch(() => setNumero(`FAC-${new Date().getFullYear()}-0001`)),
    ]).finally(() => setLoadingInit(false));
  }, []);

  // Actualizar número cuando llega financiero
  useEffect(() => {
    if (financiero?.prefijoFactura && numero) {
      setNumero(prev => {
        const parts = prev.split('-');
        parts[0] = financiero.prefijoFactura;
        return parts.join('-');
      });
    }
  }, [financiero?.prefijoFactura]);

  const handleSave = useCallback(async (enviarPorChat = false) => {
    if (!proyectoId) { setError('Seleccioná un proyecto.'); return; }
    if (lineas.every(l => !l.descripcion.trim() || !l.precioUnit)) {
      setError('Completá al menos un ítem con descripción y precio.'); return;
    }
    if (total <= 0) { setError('El total debe ser mayor a cero.'); return; }
    setError('');

    enviarPorChat ? setSendingChat(true) : setSaving(true);

    const concepStr = lineas.map(l => l.descripcion).filter(Boolean).join(' / ') || 'Servicio de construcción';
    const lineasJson = JSON.stringify(lineas.map(l => ({
      descripcion: l.descripcion,
      cantidad:    Number(l.cantidad) || 1,
      precioUnit:  Number(l.precioUnit) || 0,
      subtotal:    (Number(l.cantidad) || 1) * (Number(l.precioUnit) || 0),
    })));

    try {
      const { data } = await facturasApi.create({
        proyectoId:       Number(proyectoId),
        propuestaId:      null,
        concepto:         concepStr,
        montoTotal:       total,
        fechaVencimiento: fechaVencimiento || null,
        notas:            notas || null,
        lineasJson,
        aplicaIVA:        ajustes.iva,
        montoIVA:         ivaMonto,
        montoDescuento:   descMonto,
      });

      if (enviarPorChat) {
        await facturasApi.enviar(data.id, { porEmail: false, porChat: true });
      }

      navigate(`/facturacion/${data.id}`);
    } catch {
      setError('Error al crear la factura. Verificá los datos e intentá de nuevo.');
    } finally {
      setSaving(false);
      setSendingChat(false);
    }
  }, [proyectoId, lineas, total, fechaVencimiento, notas, ajustes, ivaMonto, descMonto, navigate]);

  if (loadingInit) return (
    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: 3, alignItems: 'start', maxWidth: 1200, mx: 'auto' }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {[1, 2, 3].map(i => <Skeleton key={i} height={100} sx={{ borderRadius: 2 }} />)}
      </Box>
      <Skeleton height={600} sx={{ borderRadius: 2 }} />
    </Box>
  );

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
      {/* ── Topbar ── */}
      <Box sx={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        mb: 2.5, gap: 2, flexWrap: 'wrap',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Button size="small" startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/facturacion')}
            sx={{ color: '#64748B', textTransform: 'none', fontWeight: 600 }}>
            Facturación
          </Button>
          <Typography color="text.disabled">/</Typography>
          <Typography fontWeight={700} fontSize={14} sx={{ color: '#0F172A' }}>Nueva factura</Typography>
          <Chip label="Borrador" size="small"
            sx={{ height: 20, fontSize: 10.5, fontWeight: 700, bgcolor: '#F1F5F9', color: '#64748B' }} />
        </Box>

        {/* Acciones */}
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
          <Tooltip title="Configurar datos de empresa y facturación">
            <Button size="small" startIcon={<SettingsIcon sx={{ fontSize: 15 }} />}
              onClick={() => navigate('/configuracion/financiero')}
              sx={{ color: '#64748B', textTransform: 'none', fontWeight: 600, fontSize: 12.5,
                border: '1px solid #E2E8F0', '&:hover': { bgcolor: '#F8FAFC' } }}>
              Config. financiera
            </Button>
          </Tooltip>

          <Button
            size="small"
            startIcon={sendingChat ? <CircularProgress size={13} sx={{ color: ACCENT }} /> : <ForumIcon sx={{ fontSize: 15 }} />}
            disabled={saving || sendingChat}
            onClick={() => handleSave(true)}
            sx={{ color: ACCENT, textTransform: 'none', fontWeight: 700, fontSize: 12.5,
              border: '1px solid #BFDBFE', bgcolor: '#EFF6FF', borderRadius: 1.5,
              '&:hover': { bgcolor: '#DBEAFE' } }}>
            {sendingChat ? 'Guardando…' : 'Guardar y compartir en chat'}
          </Button>

          <Button
            variant="contained" size="small"
            startIcon={saving ? <CircularProgress size={13} sx={{ color: 'white' }} /> : <SaveIcon sx={{ fontSize: 15 }} />}
            disabled={saving || sendingChat}
            onClick={() => handleSave(false)}
            sx={{ bgcolor: ACCENT, '&:hover': { bgcolor: '#1D4ED8' },
              fontWeight: 700, textTransform: 'none', fontSize: 12.5 }}>
            {saving ? 'Guardando…' : 'Guardar factura'}
          </Button>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 1.5 }}>{error}</Alert>}

      {/* ── Layout principal ── */}
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', lg: '1fr 420px' },
        gap: 3,
        alignItems: 'start',
      }}>

        {/* ── Editor (columna izquierda) ── */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

          {/* Sección: Encabezado */}
          <Box sx={{ bgcolor: 'white', border: '1px solid #E2E8F0', borderRadius: 2 }}>
            <Box sx={{ px: 3, py: 2, borderBottom: '1px solid #F1F5F9' }}>
              <Typography fontWeight={700} fontSize={12} sx={{ color: '#64748B', letterSpacing: 0.5 }}>
                ENCABEZADO DE FACTURA
              </Typography>
            </Box>
            <Box sx={{ px: 3, py: 2.5, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <Box>
                <Typography variant="caption" color="text.disabled" fontWeight={600}>Número</Typography>
                <Typography fontWeight={700} fontSize={15} sx={{ color: '#0F172A', fontFamily: 'monospace', mt: 0.3 }}>
                  {numero}
                </Typography>
              </Box>
              <TextField
                label="Fecha de vencimiento"
                type="date" size="small"
                value={fechaVencimiento}
                onChange={e => setFechaVencimiento(e.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Box>
          </Box>

          {/* Sección: Proyecto / Cliente */}
          <Box sx={{ bgcolor: 'white', border: '1px solid #E2E8F0', borderRadius: 2 }}>
            <Box sx={{ px: 3, py: 2, borderBottom: '1px solid #F1F5F9' }}>
              <Typography fontWeight={700} fontSize={12} sx={{ color: '#64748B', letterSpacing: 0.5 }}>
                PROYECTO / CLIENTE
              </Typography>
            </Box>
            <Box sx={{ px: 3, py: 2.5 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Seleccioná el proyecto *</InputLabel>
                <Select value={proyectoId} onChange={e => setProyectoId(e.target.value)}
                  label="Seleccioná el proyecto *">
                  {proyectos.length === 0 && (
                    <MenuItem disabled value="">Sin proyectos activos</MenuItem>
                  )}
                  {proyectos.map(p => (
                    <MenuItem key={p.id} value={p.id}>
                      <Box>
                        <Typography fontSize={13} fontWeight={600}>{p.titulo}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {[p.canton, p.provincia].filter(Boolean).join(', ')}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              {proyectoSel && (
                <Box sx={{ mt: 1.5, p: 1.5, bgcolor: '#F8FAFC', borderRadius: 1.5,
                  border: '1px solid #F1F5F9' }}>
                  <Typography fontSize={12} color="text.secondary">
                    {proyectoSel.clienteNombre && <><strong>Cliente:</strong> {proyectoSel.clienteNombre} · </>}
                    <strong>Estado:</strong> {proyectoSel.estado}
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>

          {/* Sección: Partidas / Ítems */}
          <Box sx={{ bgcolor: 'white', border: '1px solid #E2E8F0', borderRadius: 2 }}>
            <Box sx={{ px: 3, py: 2, borderBottom: '1px solid #F1F5F9',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography fontWeight={700} fontSize={12} sx={{ color: '#64748B', letterSpacing: 0.5 }}>
                PARTIDAS / ÍTEMS
              </Typography>
              <Typography variant="caption" color="text.disabled">
                {lineas.length} ítem{lineas.length !== 1 ? 's' : ''}
              </Typography>
            </Box>
            <Box sx={{ px: 3, py: 2 }}>
              <LineasEditor lineas={lineas} setLineas={setLineas} />
            </Box>
          </Box>

          {/* Sección: Impuestos y descuentos */}
          <Box sx={{ bgcolor: 'white', border: '1px solid #E2E8F0', borderRadius: 2 }}>
            <Box sx={{ px: 3, py: 2, borderBottom: '1px solid #F1F5F9' }}>
              <Typography fontWeight={700} fontSize={12} sx={{ color: '#64748B', letterSpacing: 0.5 }}>
                AJUSTES
              </Typography>
            </Box>
            <Box sx={{ px: 3, py: 2.5, display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* IVA */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography fontSize={13} fontWeight={600}>IVA {tasaIVA}%</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Tasa configurada en Config. financiera
                  </Typography>
                </Box>
                <Switch checked={ajustes.iva}
                  onChange={e => setAjustes(a => ({ ...a, iva: e.target.checked }))}
                  size="small"
                  sx={{ '& .Mui-checked + .MuiSwitch-track': { bgcolor: ACCENT } }} />
              </Box>

              <Divider />

              {/* Descuento */}
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end' }}>
                <FormControl size="small" sx={{ minWidth: 140 }}>
                  <InputLabel>Descuento</InputLabel>
                  <Select value={ajustes.descuentoTipo}
                    onChange={e => setAjustes(a => ({ ...a, descuentoTipo: e.target.value, descuento: '' }))}
                    label="Descuento">
                    <MenuItem value="ninguno">Sin descuento</MenuItem>
                    <MenuItem value="pct">Porcentaje (%)</MenuItem>
                    <MenuItem value="fijo">Monto fijo (₡)</MenuItem>
                  </Select>
                </FormControl>
                {ajustes.descuentoTipo !== 'ninguno' && (
                  <TextField size="small" type="number" label="Valor"
                    value={ajustes.descuento}
                    onChange={e => setAjustes(a => ({ ...a, descuento: e.target.value }))}
                    sx={{ maxWidth: 140 }}
                    InputProps={ajustes.descuentoTipo === 'fijo'
                      ? { startAdornment: <InputAdornment position="start">₡</InputAdornment> }
                      : { endAdornment: <InputAdornment position="end">%</InputAdornment> }}
                  />
                )}
              </Box>
            </Box>

            {/* Totales */}
            <Box sx={{ px: 3, py: 2.5, bgcolor: '#F8FAFC', borderTop: '1px solid #F1F5F9' }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, maxWidth: 280, ml: 'auto' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography fontSize={13} color="text.secondary">Subtotal</Typography>
                  <Typography fontSize={13} fontWeight={600}>{fmtCR(subtotal)}</Typography>
                </Box>
                {descMonto > 0 && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography fontSize={13} color="text.secondary">Descuento</Typography>
                    <Typography fontSize={13} fontWeight={600} sx={{ color: '#DC2626' }}>-{fmtCR(descMonto)}</Typography>
                  </Box>
                )}
                {ajustes.iva && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography fontSize={13} color="text.secondary">IVA {tasaIVA}%</Typography>
                    <Typography fontSize={13} fontWeight={600}>{fmtCR(ivaMonto)}</Typography>
                  </Box>
                )}
                <Divider />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <Typography fontWeight={800} fontSize={14}>TOTAL</Typography>
                  <Typography fontWeight={900} fontSize={22} sx={{ color: '#0F172A' }}>{fmtCR(total)}</Typography>
                </Box>
              </Box>
            </Box>
          </Box>

          {/* Sección: Notas */}
          <Box sx={{ bgcolor: 'white', border: '1px solid #E2E8F0', borderRadius: 2 }}>
            <Box sx={{ px: 3, py: 2, borderBottom: '1px solid #F1F5F9' }}>
              <Typography fontWeight={700} fontSize={12} sx={{ color: '#64748B', letterSpacing: 0.5 }}>
                NOTAS ADICIONALES
              </Typography>
            </Box>
            <Box sx={{ px: 3, py: 2.5 }}>
              <TextField fullWidth multiline rows={3} size="small"
                placeholder="Condiciones de pago, instrucciones de depósito, notas para el cliente…"
                value={notas} onChange={e => setNotas(e.target.value)} />
              {financiero?.terminosCondiciones && (
                <Typography variant="caption" color="text.disabled" sx={{ mt: 1, display: 'block' }}>
                  Los términos y condiciones de tu Config. financiera se agregan automáticamente al PDF.
                </Typography>
              )}
            </Box>
          </Box>
        </Box>

        {/* ── Preview PDF (columna derecha, sticky) ── */}
        <Box sx={{ position: 'sticky', top: 70, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography fontWeight={700} fontSize={12} sx={{ color: '#94A3B8', letterSpacing: 0.5 }}>
                VISTA PREVIA
              </Typography>
              <Chip label="En vivo" size="small"
                sx={{ height: 18, fontSize: 9.5, fontWeight: 700, bgcolor: '#D1FAE5', color: '#065F46' }} />
            </Box>
            <PDFDownloadLink
              document={<FacturaPDF factura={{
                numero, concepto: lineas.map(l => l.descripcion).join(' / '),
                montoTotal: total, montoPagado: 0, estado: 'Enviada',
                fechaEmision: new Date().toISOString(),
                fechaVencimiento: fechaVencimiento || null, notas,
              }} perfil={perfil} />}
              fileName={`${numero || 'factura'}.pdf`}
              style={{ textDecoration: 'none' }}>
              {({ loading: pdfL }) => (
                <Button size="small"
                  startIcon={<PictureAsPdfIcon sx={{ fontSize: 14 }} />}
                  disabled={pdfL}
                  sx={{ fontSize: 11.5, textTransform: 'none', fontWeight: 600,
                    color: '#64748B', border: '1px solid #E2E8F0', borderRadius: 1.5,
                    '&:hover': { bgcolor: '#F8FAFC', color: '#0F172A' } }}>
                  {pdfL ? 'Generando…' : 'Descargar PDF'}
                </Button>
              )}
            </PDFDownloadLink>
          </Box>

          <InvoicePreview
            perfil={perfil}
            financiero={financiero}
            proyecto={proyectoSel}
            numero={numero}
            lineas={lineas}
            ajustes={ajustes}
            notas={notas}
            fechaVencimiento={fechaVencimiento}
          />
        </Box>
      </Box>
    </Box>
  );
}
