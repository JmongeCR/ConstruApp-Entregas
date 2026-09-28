import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, Chip, LinearProgress, Divider,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, FormControl, InputLabel, Select, MenuItem, InputAdornment,
  Snackbar, Alert, IconButton, Tooltip, Avatar, Checkbox, FormControlLabel,
} from '@mui/material';
import ArrowBackIcon        from '@mui/icons-material/ArrowBack';
import PaymentsIcon         from '@mui/icons-material/Payments';
import DeleteIcon           from '@mui/icons-material/Delete';
import BlockIcon            from '@mui/icons-material/Block';
import PictureAsPdfIcon     from '@mui/icons-material/PictureAsPdf';
import SendIcon             from '@mui/icons-material/Send';
import ConstructionIcon     from '@mui/icons-material/Construction';
import ReceiptIcon          from '@mui/icons-material/Receipt';
import CheckCircleIcon      from '@mui/icons-material/CheckCircle';
import EmailIcon            from '@mui/icons-material/Email';
import ForumIcon            from '@mui/icons-material/Forum';
import PaidIcon             from '@mui/icons-material/Paid';
import GppGoodIcon          from '@mui/icons-material/GppGood';
import { PDFDownloadLink, pdf } from '@react-pdf/renderer';
import { FacturaPDF }           from '../../utils/pdf/FacturaPDF';
import { facturasApi, perfilesConstructorApi } from '../../api/endpoints';

const ACCENT = '#2563EB';

const ESTADO = {
  Borrador:    { label: 'Borrador',  color: '#64748B', bg: '#F1F5F9' },
  Enviada:     { label: 'Pendiente', color: '#92400E', bg: '#FEF3C7' },
  PagoParcial: { label: 'Parcial',   color: '#1E40AF', bg: '#DBEAFE' },
  Pagada:      { label: 'Pagada',    color: '#065F46', bg: '#D1FAE5' },
  Vencida:     { label: 'Vencida',   color: '#991B1B', bg: '#FEE2E2' },
  Cancelada:   { label: 'Anulada',   color: '#94A3B8', bg: '#F8FAFC' },
};

const METODOS = [
  { value: 'Transferencia', label: 'Transferencia' },
  { value: 'SINPE',         label: 'SINPE Móvil'   },
  { value: 'Efectivo',      label: 'Efectivo'       },
  { value: 'Cheque',        label: 'Cheque'         },
  { value: 'Tarjeta',       label: 'Tarjeta'        },
  { value: 'Otro',          label: 'Otro'           },
];

const fmt     = v => v != null ? `₡${Number(v).toLocaleString('es-CR')}` : '—';
const fmtDate = d => d ? new Date(d).toLocaleDateString('es-CR', { day:'2-digit', month:'long', year:'numeric' }) : '—';
const fmtTime = d => d ? new Date(d).toLocaleString('es-CR', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' }) : '—';
const toInput = () => new Date().toISOString().split('T')[0];

const METODO_ICON = { SINPE: '📱', Transferencia: '🏦', Efectivo: '💵', Cheque: '📄', Tarjeta: '💳', Otro: '💰' };

// ── Timeline ──────────────────────────────────────────────────────────────────
function TimelineItem({ icon, color, title, subtitle, done, last }) {
  return (
    <Box sx={{ display: 'flex', gap: 2, position: 'relative' }}>
      {/* Línea vertical */}
      {!last && (
        <Box sx={{
          position: 'absolute', left: 15, top: 32, bottom: -4,
          width: 2, bgcolor: done ? '#E2E8F0' : '#F1F5F9',
        }} />
      )}
      {/* Ícono */}
      <Box sx={{
        width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
        bgcolor: done ? color + '15' : '#F8FAFC',
        border: `2px solid ${done ? color : '#E2E8F0'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1,
      }}>
        <Box sx={{ fontSize: 15, color: done ? color : '#CBD5E1', display: 'flex' }}>{icon}</Box>
      </Box>
      {/* Texto */}
      <Box sx={{ pb: last ? 0 : 3, pt: 0.35 }}>
        <Typography fontSize={13} fontWeight={done ? 700 : 500}
          sx={{ color: done ? '#0F172A' : '#94A3B8' }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="caption" color="text.disabled">{subtitle}</Typography>
        )}
      </Box>
    </Box>
  );
}

// ── Helpers PDF ───────────────────────────────────────────────────────────────
async function generarPdfBase64(factura, perfil) {
  try {
    const blob   = await pdf(<FacturaPDF factura={factura} perfil={perfil} />).toBlob();
    return await new Promise((resolve, reject) => {
      const reader   = new FileReader();
      reader.onload  = () => resolve(reader.result);  // data:application/pdf;base64,...
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

// ── Modal: Enviar factura ─────────────────────────────────────────────────────
function ModalEnviar({ open, facturaId, factura, perfil, onClose, onEnviada, notify }) {
  const [opts,   setOpts]   = useState({ email: false, chat: true });
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!opts.email && !opts.chat) { notify('Seleccioná al menos una opción.', 'error'); return; }
    setSaving(true);
    try {
      // Si va al chat, generar PDF y adjuntarlo
      let pdfBase64 = null;
      if (opts.chat && factura && perfil) {
        pdfBase64 = await generarPdfBase64(factura, perfil);
      }

      await facturasApi.enviar(facturaId, {
        porEmail: opts.email,
        porChat:  opts.chat,
        pdfBase64,
      });
      onEnviada(); onClose();
    } catch { notify('Error al enviar la factura.', 'error'); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth
      PaperProps={{ sx: { borderRadius: 2.5 } }}>
      <DialogTitle sx={{ fontSize: 15, fontWeight: 800, pb: 0.5 }}>
        Distribuir factura
      </DialogTitle>
      <DialogContent sx={{ pt: '12px !important', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <Typography fontSize={13} color="text.secondary" sx={{ mb: 0.5 }}>
          Seleccioná cómo deseas distribuir esta factura al cliente:
        </Typography>

        <Box sx={{
          display: 'flex', alignItems: 'center', gap: 1.5, p: 2,
          border: '1px solid', borderColor: opts.email ? ACCENT : '#E2E8F0',
          borderRadius: 1.5, cursor: 'pointer', bgcolor: opts.email ? '#EFF6FF' : 'white',
        }} onClick={() => setOpts(o => ({ ...o, email: !o.email }))}>
          <Checkbox checked={opts.email} size="small" sx={{ p: 0 }}
            onChange={ev => { ev.stopPropagation(); setOpts(o => ({ ...o, email: ev.target.checked })); }} />
          <EmailIcon sx={{ fontSize: 20, color: opts.email ? ACCENT : '#94A3B8' }} />
          <Box>
            <Typography fontSize={13} fontWeight={700}>Correo electrónico
              <Chip label="Simulado" size="small"
                sx={{ ml: 1, height: 15, fontSize: 9, fontWeight: 700, bgcolor: '#FEF3C7', color: '#92400E' }} />
            </Typography>
            <Typography variant="caption" color="text.secondary">Registra fecha de envío para el timeline</Typography>
          </Box>
        </Box>

        <Box sx={{
          display: 'flex', alignItems: 'center', gap: 1.5, p: 2,
          border: '1px solid', borderColor: opts.chat ? ACCENT : '#E2E8F0',
          borderRadius: 1.5, cursor: 'pointer', bgcolor: opts.chat ? '#EFF6FF' : 'white',
        }} onClick={() => setOpts(o => ({ ...o, chat: !o.chat }))}>
          <Checkbox checked={opts.chat} size="small" sx={{ p: 0 }}
            onChange={ev => { ev.stopPropagation(); setOpts(o => ({ ...o, chat: ev.target.checked })); }} />
          <ForumIcon sx={{ fontSize: 20, color: opts.chat ? ACCENT : '#94A3B8' }} />
          <Box>
            <Typography fontSize={13} fontWeight={700}>Chat del proyecto</Typography>
            <Typography variant="caption" color="text.secondary">Publica el resumen en el canal Cliente</Typography>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 2.5, pb: 2.5, gap: 1 }}>
        <Button size="small" onClick={onClose}>Cancelar</Button>
        <Button size="small" variant="contained" onClick={submit} disabled={saving}
          sx={{ bgcolor: ACCENT, '&:hover': { bgcolor: '#1D4ED8' }, fontWeight: 700 }}>
          {saving ? (opts.chat ? 'Generando PDF…' : 'Enviando…') : 'Distribuir'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
export default function FacturaDetalle() {
  const { id }   = useParams();
  const navigate = useNavigate();

  const [detalle,  setDetalle]  = useState(null);
  const [perfil,   setPerfil]   = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [modalPago,    setModalPago]    = useState(false);
  const [modalEnviar,  setModalEnviar]  = useState(false);
  const [formPago, setFormPago] = useState({
    monto: '', metodoPago: 'Transferencia', fecha: toInput(), referencia: '', notas: '',
  });
  const [saving,  setSaving]  = useState(false);
  const [confirm, setConfirm] = useState({ open: false, type: '', pagoId: null });
  const [toast,   setToast]   = useState({ open: false, msg: '', severity: 'success' });

  const notify = (msg, severity = 'success') => setToast({ open: true, msg, severity });

  const cargar = () => {
    setLoading(true);
    facturasApi.getById(id)
      .then(r => {
        setDetalle(r.data);
        setFormPago(fp => ({ ...fp, monto: String(r.data.factura.montoTotal - r.data.factura.montoPagado) }));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    cargar();
    perfilesConstructorApi.getMio().then(r => setPerfil(r.data)).catch(() => {});
  }, [id]);

  const handlePago = async () => {
    if (!formPago.monto || Number(formPago.monto) <= 0) { notify('Monto inválido.', 'error'); return; }
    setSaving(true);
    try {
      await facturasApi.registrarPago(id, {
        monto: Number(formPago.monto), metodoPago: formPago.metodoPago,
        fecha: formPago.fecha || null, referencia: formPago.referencia || null, notas: formPago.notas || null,
      });
      cargar(); setModalPago(false); notify('Pago registrado correctamente.');
    } catch { notify('Error al registrar el pago.', 'error'); }
    finally { setSaving(false); }
  };

  const handleEliminarPago = async () => {
    try {
      await facturasApi.eliminarPago(id, confirm.pagoId);
      cargar(); notify('Pago eliminado.');
    } catch { notify('Error al eliminar el pago.', 'error'); }
    finally { setConfirm({ open: false, type: '', pagoId: null }); }
  };

  const handleAnular = async () => {
    try {
      await facturasApi.cancelar(id);
      cargar(); notify('Factura anulada.');
    } catch { notify('Error.', 'error'); }
    finally { setConfirm({ open: false, type: '', pagoId: null }); }
  };

  if (loading) return <LinearProgress />;
  if (!detalle) return <Typography color="error" sx={{ p: 3 }}>Factura no encontrada.</Typography>;

  const { factura: f, pagos } = detalle;
  const est      = ESTADO[f.estado] ?? ESTADO.Enviada;
  const saldo    = f.montoTotal - f.montoPagado;
  const pct      = f.montoTotal > 0 ? Math.round((f.montoPagado / f.montoTotal) * 100) : 0;
  const pagada   = f.estado === 'Pagada';
  const cancelada = f.estado === 'Cancelada';

  // Timeline events
  const timelineItems = [
    {
      icon: <ReceiptIcon sx={{ fontSize: 15 }} />,
      color: ACCENT,
      title: 'Factura creada',
      subtitle: fmtTime(f.fechaEmision),
      done: true,
    },
    {
      icon: <EmailIcon sx={{ fontSize: 15 }} />,
      color: '#7C3AED',
      title: 'Correo enviado',
      subtitle: f.fechaEnvioEmail ? fmtTime(f.fechaEnvioEmail) : 'Pendiente',
      done: !!f.fechaEnvioEmail,
    },
    {
      icon: <ForumIcon sx={{ fontSize: 15 }} />,
      color: '#059669',
      title: 'Compartida en chat',
      subtitle: f.fechaEnvioChat ? fmtTime(f.fechaEnvioChat) : 'Pendiente',
      done: !!f.fechaEnvioChat,
    },
    ...pagos.map((pago, i) => ({
      icon: <PaidIcon sx={{ fontSize: 15 }} />,
      color: '#065F46',
      title: `Pago recibido — ${fmt(pago.monto)}`,
      subtitle: `${pago.metodoPago} · ${fmtTime(pago.fecha)}${pago.referencia ? ` · Ref. ${pago.referencia}` : ''}`,
      done: true,
    })),
    {
      icon: <GppGoodIcon sx={{ fontSize: 15 }} />,
      color: '#065F46',
      title: 'Factura completada',
      subtitle: pagada ? '100% cobrado' : `${pct}% cobrado — saldo ${fmt(saldo)}`,
      done: pagada,
    },
  ];

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto' }}>
      {/* Breadcrumb */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
        <Button size="small" startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/facturacion')}
          sx={{ color: '#64748B', textTransform: 'none', fontWeight: 600 }}>
          Facturación
        </Button>
        <Typography color="text.disabled">/</Typography>
        <Typography fontWeight={700} fontSize={14} sx={{ color: '#0F172A', fontFamily: 'monospace' }}>
          {f.numero}
        </Typography>
        <Chip label={est.label} size="small"
          sx={{ bgcolor: est.bg, color: est.color, fontWeight: 700, fontSize: 10.5, height: 22, borderRadius: 1 }} />
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 260px' }, gap: 2.5, alignItems: 'start' }}>

        {/* ── Columna principal ── */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>

          {/* Documento de factura */}
          <Box sx={{ bgcolor: 'white', border: '1px solid #E2E8F0', borderRadius: 2, overflow: 'hidden' }}>
            {/* Toolbar */}
            <Box sx={{ px: 3, py: 1.75, borderBottom: '1px solid #F1F5F9',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#FAFAFA' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {f.proyectoTitulo && (
                  <>
                    <ConstructionIcon sx={{ fontSize: 13, color: '#94A3B8' }} />
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                      {f.proyectoTitulo}
                    </Typography>
                  </>
                )}
              </Box>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                {!cancelada && (
                  <Button size="small"
                    startIcon={<SendIcon sx={{ fontSize: 14 }} />}
                    onClick={() => setModalEnviar(true)}
                    sx={{
                      color: ACCENT, textTransform: 'none', fontWeight: 700,
                      fontSize: 12.5, border: '1px solid', borderColor: '#BFDBFE',
                      borderRadius: 1.5, px: 1.5, py: 0.6, bgcolor: '#EFF6FF',
                      '&:hover': { bgcolor: '#DBEAFE', borderColor: ACCENT },
                    }}>
                    Distribuir
                  </Button>
                )}
                <PDFDownloadLink
                  document={<FacturaPDF factura={f} perfil={perfil} />}
                  fileName={`${f.numero}.pdf`}
                  style={{ textDecoration: 'none' }}>
                  {({ loading: pdfLoading }) => (
                    <Button size="small"
                      startIcon={<PictureAsPdfIcon sx={{ fontSize: 15 }} />}
                      disabled={pdfLoading}
                      sx={{
                        color: '#64748B', textTransform: 'none', fontWeight: 600,
                        fontSize: 12.5, border: '1px solid #E2E8F0', borderRadius: 1.5,
                        px: 1.5, py: 0.6,
                        '&:hover': { bgcolor: '#F8FAFC', borderColor: '#CBD5E1', color: '#0F172A' },
                      }}>
                      {pdfLoading ? 'Generando…' : 'Descargar PDF'}
                    </Button>
                  )}
                </PDFDownloadLink>
                {!pagada && !cancelada && (
                  <Tooltip title="Anular factura">
                    <IconButton size="small"
                      onClick={() => setConfirm({ open: true, type: 'anular', pagoId: null })}
                      sx={{ color: '#94A3B8', '&:hover': { color: '#EF4444' } }}>
                      <BlockIcon sx={{ fontSize: 17 }} />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            </Box>

            {/* Contenido */}
            <Box sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3.5 }}>
                <Box>
                  <Typography fontWeight={900} fontSize={22} sx={{ color: '#0F172A', letterSpacing: -0.5, mb: 0.25 }}>
                    FACTURA
                  </Typography>
                  <Typography fontWeight={700} sx={{ color: '#94A3B8', fontFamily: 'monospace', fontSize: 13 }}>
                    {f.numero}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Box sx={{ mb: 0.75 }}>
                    <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 700, fontSize: 10 }}>EMISIÓN</Typography>
                    <Typography fontSize={13} fontWeight={600}>{fmtDate(f.fechaEmision)}</Typography>
                  </Box>
                  {f.fechaVencimiento && (
                    <Box>
                      <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 700, fontSize: 10 }}>VENCE</Typography>
                      <Typography fontSize={13} fontWeight={600} sx={{ color: '#DC2626' }}>
                        {fmtDate(f.fechaVencimiento)}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Box>

              <Divider sx={{ mb: 3 }} />

              <Box sx={{ bgcolor: '#F8FAFC', borderRadius: 1.5, p: 2.5, mb: 3 }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 140px', gap: 1, mb: 1.5,
                  borderBottom: '1px solid #F1F5F9', pb: 1 }}>
                  <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 700, fontSize: 10, letterSpacing: 0.5 }}>
                    DESCRIPCIÓN
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 700, fontSize: 10, textAlign: 'right', letterSpacing: 0.5 }}>
                    IMPORTE
                  </Typography>
                </Box>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 140px', gap: 1 }}>
                  <Typography fontSize={14} sx={{ color: '#0F172A' }}>
                    {f.concepto || 'Servicio de construcción'}
                  </Typography>
                  <Typography fontWeight={700} fontSize={14} sx={{ textAlign: 'right' }}>{fmt(f.montoTotal)}</Typography>
                </Box>
              </Box>

              {/* Totales */}
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
                <Box sx={{ width: 260 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>Total</Typography>
                    <Typography variant="caption" fontWeight={700}>{fmt(f.montoTotal)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>Cobrado</Typography>
                    <Typography variant="caption" fontWeight={700} sx={{ color: '#065F46' }}>{fmt(f.montoPagado)}</Typography>
                  </Box>
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <Typography fontWeight={800} fontSize={14}>SALDO</Typography>
                    <Typography fontWeight={900} fontSize={20} sx={{ color: pagada ? '#065F46' : '#0F172A' }}>
                      {fmt(saldo)}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {!cancelada && (
                <Box sx={{ mb: 1.5 }}>
                  <LinearProgress variant="determinate" value={pct} sx={{
                    height: 6, borderRadius: 6, bgcolor: '#F1F5F9',
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 6,
                      bgcolor: pagada ? '#10B981' : f.estado === 'Vencida' ? '#EF4444' : ACCENT,
                    },
                  }} />
                  <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5, display: 'block' }}>
                    {pct}% cobrado{pagada ? ' — completamente saldada ✓' : ''}
                  </Typography>
                </Box>
              )}

              {f.notas && (
                <>
                  <Divider sx={{ mb: 1.5 }} />
                  <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 700, fontSize: 10, letterSpacing: 0.5 }}>
                    NOTAS
                  </Typography>
                  <Typography fontSize={13} color="text.secondary" sx={{ mt: 0.5 }}>{f.notas}</Typography>
                </>
              )}
            </Box>

            <Box sx={{ px: 4, py: 1.5, borderTop: '1px solid #F1F5F9', bgcolor: '#FAFAFA' }}>
              <Typography variant="caption" color="text.disabled" sx={{ fontSize: 10.5 }}>
                ConstruApp · Documento generado el {fmtDate(new Date())}
              </Typography>
            </Box>
          </Box>

          {/* Historial de pagos */}
          <Box sx={{ bgcolor: 'white', border: '1px solid #E2E8F0', borderRadius: 2, overflow: 'hidden' }}>
            <Box sx={{ px: 3, py: 2, borderBottom: '1px solid #F1F5F9',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography fontWeight={700} fontSize={13.5} sx={{ color: '#0F172A' }}>
                Historial de pagos
                <Typography component="span" variant="caption" color="text.disabled" sx={{ ml: 1 }}>
                  {pagos.length} registro{pagos.length !== 1 ? 's' : ''}
                </Typography>
              </Typography>
              {!pagada && !cancelada && (
                <Button size="small" variant="contained"
                  startIcon={<PaymentsIcon sx={{ fontSize: 14 }} />}
                  onClick={() => setModalPago(true)}
                  sx={{ bgcolor: ACCENT, '&:hover': { bgcolor: '#1D4ED8' },
                    fontWeight: 700, textTransform: 'none', height: 32, fontSize: 12.5 }}>
                  Registrar pago
                </Button>
              )}
            </Box>

            {pagos.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 5 }}>
                <PaymentsIcon sx={{ fontSize: 36, color: '#E2E8F0', mb: 1 }} />
                <Typography variant="caption" color="text.disabled" display="block">Sin pagos registrados</Typography>
              </Box>
            ) : pagos.map((pago, i) => (
              <Box key={pago.id} sx={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                px: 3, py: 1.75,
                borderBottom: i < pagos.length - 1 ? '1px solid #F8FAFC' : 'none',
                '&:hover': { bgcolor: '#FAFAFA' },
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ width: 34, height: 34, bgcolor: '#F0FDF4', fontSize: 16 }}>
                    {METODO_ICON[pago.metodoPago] ?? '💰'}
                  </Avatar>
                  <Box>
                    <Typography fontWeight={700} fontSize={14} sx={{ color: '#065F46' }}>
                      {fmt(pago.monto)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {pago.metodoPago} · {fmtDate(pago.fecha)}
                      {pago.referencia && ` · Ref. ${pago.referencia}`}
                    </Typography>
                  </Box>
                </Box>
                <Tooltip title="Eliminar pago">
                  <IconButton size="small"
                    onClick={() => setConfirm({ open: true, type: 'pago', pagoId: pago.id })}
                    sx={{ color: '#CBD5E1', '&:hover': { color: '#EF4444', bgcolor: '#FEF2F2' } }}>
                    <DeleteIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>
              </Box>
            ))}
          </Box>
        </Box>

        {/* ── Timeline lateral ── */}
        <Box sx={{ bgcolor: 'white', border: '1px solid #E2E8F0', borderRadius: 2, p: 2.5,
          position: { lg: 'sticky' }, top: { lg: 72 } }}>
          <Typography fontWeight={700} fontSize={13} sx={{ color: '#0F172A', mb: 2.5 }}>
            Seguimiento
          </Typography>
          {timelineItems.map((item, i) => (
            <TimelineItem key={i} {...item} last={i === timelineItems.length - 1} />
          ))}
        </Box>
      </Box>

      {/* Modales */}
      <ModalEnviar open={modalEnviar} facturaId={id}
        factura={f} perfil={perfil}
        onClose={() => setModalEnviar(false)}
        onEnviada={() => { cargar(); notify('Factura distribuida correctamente.'); }}
        notify={notify} />

      <Dialog open={modalPago} onClose={() => setModalPago(false)} maxWidth="xs" fullWidth
        PaperProps={{ sx: { borderRadius: 2.5 } }}>
        <DialogTitle sx={{ fontSize: 15, fontWeight: 800 }}>Registrar pago</DialogTitle>
        <DialogContent sx={{ pt: '8px !important', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ bgcolor: '#F8FAFC', borderRadius: 1.5, p: 1.5, display: 'flex', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="caption" color="text.disabled">Saldo</Typography>
              <Typography fontWeight={800} color="#1D4ED8">{fmt(saldo)}</Typography>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="caption" color="text.disabled">Total factura</Typography>
              <Typography fontWeight={700}>{fmt(f.montoTotal)}</Typography>
            </Box>
          </Box>
          <TextField label="Monto (₡) *" value={formPago.monto}
            onChange={e => setFormPago(p => ({ ...p, monto: e.target.value }))}
            type="number" size="small" fullWidth
            InputProps={{ startAdornment: <InputAdornment position="start">₡</InputAdornment> }} />
          <FormControl fullWidth size="small">
            <InputLabel>Método</InputLabel>
            <Select value={formPago.metodoPago}
              onChange={e => setFormPago(p => ({ ...p, metodoPago: e.target.value }))}
              label="Método">
              {METODOS.map(m => <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField label="Fecha" value={formPago.fecha}
            onChange={e => setFormPago(p => ({ ...p, fecha: e.target.value }))}
            type="date" size="small" fullWidth InputLabelProps={{ shrink: true }} />
          <TextField label="Referencia / comprobante" value={formPago.referencia}
            onChange={e => setFormPago(p => ({ ...p, referencia: e.target.value }))}
            size="small" fullWidth />
        </DialogContent>
        <DialogActions sx={{ px: 2.5, pb: 2.5, gap: 1 }}>
          <Button size="small" onClick={() => setModalPago(false)}>Cancelar</Button>
          <Button size="small" variant="contained" onClick={handlePago} disabled={saving}
            sx={{ bgcolor: ACCENT, '&:hover': { bgcolor: '#1D4ED8' }, fontWeight: 700 }}>
            {saving ? 'Guardando…' : 'Confirmar pago'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={confirm.open} onClose={() => setConfirm({ open: false, type: '', pagoId: null })}
        PaperProps={{ sx: { borderRadius: 2.5, maxWidth: 360 } }}>
        <DialogTitle sx={{ fontWeight: 800, fontSize: 15 }}>
          {confirm.type === 'anular' ? 'Anular factura' : 'Eliminar pago'}
        </DialogTitle>
        <DialogContent>
          <Typography fontSize={13.5}>
            {confirm.type === 'anular'
              ? 'Esta factura quedará marcada como anulada. No se puede deshacer.'
              : 'Se eliminará este registro de pago y se actualizará el saldo.'}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 2.5, pb: 2.5, gap: 1 }}>
          <Button size="small" onClick={() => setConfirm({ open: false, type: '', pagoId: null })}>
            Cancelar
          </Button>
          <Button size="small" variant="contained" color="error"
            onClick={confirm.type === 'anular' ? handleAnular : handleEliminarPago}>
            {confirm.type === 'anular' ? 'Anular' : 'Eliminar'}
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
