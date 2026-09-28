import { useState, useEffect } from 'react';
import {
  Box, Typography, Button, TextField, Divider, Chip, IconButton,
  Switch, FormControlLabel, Snackbar, Alert, CircularProgress,
  InputAdornment, Tooltip,
} from '@mui/material';
import SaveIcon          from '@mui/icons-material/Save';
import AddIcon           from '@mui/icons-material/Add';
import DeleteIcon        from '@mui/icons-material/Delete';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import ReceiptIcon       from '@mui/icons-material/Receipt';
import PercentIcon       from '@mui/icons-material/Percent';
import PaymentsIcon      from '@mui/icons-material/Payments';
import GavelIcon         from '@mui/icons-material/Gavel';
import BadgeIcon         from '@mui/icons-material/Badge';
import CheckIcon         from '@mui/icons-material/Check';
import { perfilesConstructorApi } from '../../api/endpoints';

const ACCENT = '#2563EB';

const METODOS_PAGO = ['Transferencia', 'SINPE Móvil', 'Efectivo', 'Cheque', 'Tarjeta'];

// ── Sección con título ─────────────────────────────────────────────────────────
function Section({ icon, title, subtitle, children }) {
  return (
    <Box sx={{ bgcolor: 'white', border: '1px solid #E2E8F0', borderRadius: 2, overflow: 'hidden' }}>
      <Box sx={{ px: 3, py: 2.5, borderBottom: '1px solid #F1F5F9',
        display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box sx={{ color: ACCENT, display: 'flex' }}>{icon}</Box>
        <Box>
          <Typography fontWeight={700} fontSize={14} sx={{ color: '#0F172A' }}>{title}</Typography>
          {subtitle && <Typography variant="caption" color="text.secondary">{subtitle}</Typography>}
        </Box>
      </Box>
      <Box sx={{ px: 3, py: 3 }}>{children}</Box>
    </Box>
  );
}

// ── Campo de formulario ────────────────────────────────────────────────────────
function Field({ label, helper, children }) {
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '200px 1fr' },
      gap: { xs: 0.5, sm: 2 }, alignItems: 'start', py: 1.75,
      borderBottom: '1px solid #F8FAFC', '&:last-child': { borderBottom: 'none' } }}>
      <Box>
        <Typography fontSize={13} fontWeight={600} sx={{ color: '#374151' }}>{label}</Typography>
        {helper && <Typography variant="caption" color="text.disabled" sx={{ lineHeight: 1.3 }}>{helper}</Typography>}
      </Box>
      <Box>{children}</Box>
    </Box>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
export default function ConfiguracionFinanciero() {
  const [config,   setConfig]   = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);
  const [toast,    setToast]    = useState({ open: false, msg: '', severity: 'success' });

  // Cuentas bancarias locales (parsed del JSON)
  const [cuentas, setCuentas] = useState([]);
  // Formas de pago seleccionadas
  const [formasPago, setFormasPago] = useState([]);

  const notify = (msg, severity = 'success') => setToast({ open: true, msg, severity });

  useEffect(() => {
    perfilesConstructorApi.getFinanciero()
      .then(r => {
        const d = r.data;
        setConfig(d);
        try { setFormasPago(JSON.parse(d.formasPago || '[]')); } catch { setFormasPago([]); }
        try { setCuentas(JSON.parse(d.cuentasBancarias || '[]')); } catch { setCuentas([]); }
      })
      .catch(() => notify('Error al cargar la configuración.', 'error'))
      .finally(() => setLoading(false));
  }, []);

  const set = (field, value) => setConfig(c => ({ ...c, [field]: value }));

  const toggleMetodo = (m) => {
    setFormasPago(prev =>
      prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]
    );
  };

  const addCuenta = () => setCuentas(prev => [...prev, { banco: '', iban: '', tipo: 'Corriente' }]);
  const removeCuenta = (i) => setCuentas(prev => prev.filter((_, idx) => idx !== i));
  const updateCuenta = (i, field, val) =>
    setCuentas(prev => prev.map((c, idx) => idx === i ? { ...c, [field]: val } : c));

  const handleSave = async () => {
    setSaving(true);
    try {
      await perfilesConstructorApi.updateFinanciero({
        emailFacturacion:    config.emailFacturacion    || null,
        direccionFiscal:     config.direccionFiscal     || null,
        telefonoFiscal:      config.telefonoFiscal      || null,
        prefijoFactura:      config.prefijoFactura      || 'FAC',
        diasVencimiento:     Number(config.diasVencimiento) || 30,
        tasaIVA:             Number(config.tasaIVA)     || 13,
        aplicaIVADefault:    config.aplicaIVADefault    || false,
        terminosCondiciones: config.terminosCondiciones || null,
        formasPago:          JSON.stringify(formasPago),
        cuentasBancarias:    JSON.stringify(cuentas),
      });
      setSaved(true);
      notify('Configuración guardada.');
      setTimeout(() => setSaved(false), 3000);
    } catch {
      notify('Error al guardar.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
      <CircularProgress size={28} />
    </Box>
  );

  if (!config) return (
    <Box sx={{ p: 4, textAlign: 'center' }}>
      <Typography color="text.secondary">
        Primero creá tu perfil de constructor para configurar la facturación.
      </Typography>
    </Box>
  );

  return (
    <Box sx={{ maxWidth: 780, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={800} sx={{ color: '#0F172A' }}>
            Configuración Financiera
          </Typography>
          <Typography fontSize={13.5} color="text.secondary" sx={{ mt: 0.3 }}>
            Datos que se usan en todas tus facturas · Configura una sola vez
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={saved ? <CheckIcon /> : saving ? <CircularProgress size={14} sx={{ color: 'white' }} /> : <SaveIcon />}
          onClick={handleSave}
          disabled={saving}
          sx={{
            bgcolor: saved ? '#059669' : ACCENT,
            '&:hover': { bgcolor: saved ? '#047857' : '#1D4ED8' },
            fontWeight: 700, textTransform: 'none', transition: 'background .3s',
          }}>
          {saved ? 'Guardado' : saving ? 'Guardando…' : 'Guardar cambios'}
        </Button>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>

        {/* Datos fiscales */}
        <Section icon={<BadgeIcon />} title="Datos fiscales"
          subtitle="Aparecen en el encabezado de todas tus facturas">
          <Field label="Razón social" helper="Nombre de tu empresa">
            <TextField size="small" fullWidth
              value={config.nombreEmpresa || ''}
              disabled
              helperText="Editable desde Mi empresa"
              sx={{ '& .MuiInputBase-root': { bgcolor: '#F8FAFC' } }} />
          </Field>
          <Field label="Cédula jurídica" helper="CJ de la empresa">
            <TextField size="small" fullWidth placeholder="3-101-XXXXXX"
              value={config.cedulaJuridica || ''}
              disabled
              helperText="Editable desde Mi empresa"
              sx={{ '& .MuiInputBase-root': { bgcolor: '#F8FAFC' } }} />
          </Field>
          <Field label="Email de facturación" helper="Para el remitente del correo">
            <TextField size="small" fullWidth placeholder="facturacion@tuempresa.cr"
              value={config.emailFacturacion || ''}
              onChange={e => set('emailFacturacion', e.target.value)} />
          </Field>
          <Field label="Dirección fiscal" helper="Dirección que aparece en la factura">
            <TextField size="small" fullWidth placeholder="San José, Costa Rica"
              value={config.direccionFiscal || ''}
              onChange={e => set('direccionFiscal', e.target.value)} />
          </Field>
          <Field label="Teléfono" helper="Teléfono de contacto en la factura">
            <TextField size="small" fullWidth placeholder="(506) 2222-3333"
              value={config.telefonoFiscal || ''}
              onChange={e => set('telefonoFiscal', e.target.value)} />
          </Field>
        </Section>

        {/* Numeración */}
        <Section icon={<ReceiptIcon />} title="Numeración de facturas"
          subtitle="Define el formato del número de factura">
          <Field label="Prefijo" helper='Ej: "FAC", "INV", "CONS"'>
            <TextField size="small" sx={{ maxWidth: 120 }}
              value={config.prefijoFactura || 'FAC'}
              onChange={e => set('prefijoFactura', e.target.value.toUpperCase().slice(0, 5))}
              inputProps={{ maxLength: 5 }}
              helperText={`Formato: ${config.prefijoFactura || 'FAC'}-2026-0001`} />
          </Field>
          <Field label="Días de vencimiento" helper="Plazo por defecto al crear facturas">
            <TextField size="small" sx={{ maxWidth: 120 }}
              type="number" value={config.diasVencimiento || 30}
              onChange={e => set('diasVencimiento', e.target.value)}
              InputProps={{ endAdornment: <InputAdornment position="end">días</InputAdornment> }} />
          </Field>
        </Section>

        {/* Impuestos */}
        <Section icon={<PercentIcon />} title="Impuestos"
          subtitle="Configuración de IVA para Costa Rica">
          <Field label="Tasa de IVA" helper="13% es la tasa estándar en Costa Rica">
            <TextField size="small" sx={{ maxWidth: 120 }}
              type="number" value={config.tasaIVA ?? 13}
              onChange={e => set('tasaIVA', e.target.value)}
              InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }} />
          </Field>
          <Field label="Aplicar IVA por defecto" helper="Al crear una nueva factura, IVA ya estará activado">
            <FormControlLabel
              control={
                <Switch checked={config.aplicaIVADefault || false}
                  onChange={e => set('aplicaIVADefault', e.target.checked)}
                  size="small" sx={{ '& .MuiSwitch-thumb': { bgcolor: 'white' },
                    '& .Mui-checked .MuiSwitch-thumb': { bgcolor: 'white' },
                    '& .Mui-checked + .MuiSwitch-track': { bgcolor: ACCENT } }} />
              }
              label={<Typography fontSize={13}>{config.aplicaIVADefault ? 'Activado' : 'Desactivado'}</Typography>}
            />
          </Field>
        </Section>

        {/* Formas de pago */}
        <Section icon={<PaymentsIcon />} title="Formas de pago aceptadas"
          subtitle="Se muestran en el pie de la factura">
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', pt: 0.5 }}>
            {METODOS_PAGO.map(m => {
              const sel = formasPago.includes(m);
              return (
                <Chip key={m} label={m} clickable onClick={() => toggleMetodo(m)}
                  icon={sel ? <CheckIcon sx={{ fontSize: 14 }} /> : undefined}
                  sx={{
                    fontWeight: 600, fontSize: 12.5,
                    bgcolor: sel ? '#EFF6FF' : 'white',
                    color: sel ? ACCENT : '#374151',
                    border: '1px solid', borderColor: sel ? ACCENT : '#E5E7EB',
                    '& .MuiChip-icon': { color: ACCENT },
                  }} />
              );
            })}
          </Box>
        </Section>

        {/* Cuentas bancarias */}
        <Section icon={<AccountBalanceIcon />} title="Cuentas bancarias"
          subtitle="Información de depósito para tus clientes">
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {cuentas.length === 0 && (
              <Typography variant="caption" color="text.disabled">
                Sin cuentas configuradas. Agregá al menos una para incluirla en las facturas.
              </Typography>
            )}
            {cuentas.map((c, i) => (
              <Box key={i} sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto',
                gap: 1.5, alignItems: 'center',
                bgcolor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 1.5, p: 2 }}>
                <TextField size="small" label="Banco" value={c.banco}
                  onChange={e => updateCuenta(i, 'banco', e.target.value)}
                  placeholder="Banco Nacional" />
                <TextField size="small" label="IBAN / Cuenta" value={c.iban}
                  onChange={e => updateCuenta(i, 'iban', e.target.value)}
                  placeholder="CR05 0152 0200 1026 2840 66" />
                <Tooltip title="Eliminar cuenta">
                  <IconButton size="small" onClick={() => removeCuenta(i)}
                    sx={{ color: '#CBD5E1', '&:hover': { color: '#EF4444' } }}>
                    <DeleteIcon sx={{ fontSize: 17 }} />
                  </IconButton>
                </Tooltip>
              </Box>
            ))}
            <Button size="small" startIcon={<AddIcon />} onClick={addCuenta}
              sx={{ alignSelf: 'flex-start', textTransform: 'none', fontWeight: 600,
                color: ACCENT, border: '1px dashed #BFDBFE', borderRadius: 1.5, px: 2, py: 0.75,
                '&:hover': { bgcolor: '#EFF6FF' } }}>
              Agregar cuenta
            </Button>
          </Box>
        </Section>

        {/* Términos y condiciones */}
        <Section icon={<GavelIcon />} title="Términos y condiciones"
          subtitle="Aparecen en el pie de cada factura">
          <TextField
            fullWidth multiline rows={4} size="small"
            placeholder="Ej: El pago debe realizarse dentro de los 30 días naturales de la fecha de emisión. Después de ese plazo se cobrarán intereses moratorios del 2% mensual..."
            value={config.terminosCondiciones || ''}
            onChange={e => set('terminosCondiciones', e.target.value)} />
        </Section>

      </Box>

      {/* Bottom save bar */}
      <Box sx={{ position: 'sticky', bottom: 24, mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="contained"
          startIcon={saved ? <CheckIcon /> : saving ? <CircularProgress size={14} sx={{ color: 'white' }} /> : <SaveIcon />}
          onClick={handleSave} disabled={saving}
          sx={{ bgcolor: saved ? '#059669' : ACCENT,
            '&:hover': { bgcolor: saved ? '#047857' : '#1D4ED8' },
            fontWeight: 700, textTransform: 'none', px: 3,
            boxShadow: '0 4px 14px rgba(37,99,235,0.35)', transition: 'background .3s' }}>
          {saved ? 'Guardado' : saving ? 'Guardando…' : 'Guardar configuración'}
        </Button>
      </Box>

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
