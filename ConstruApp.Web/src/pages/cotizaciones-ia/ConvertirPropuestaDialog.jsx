import { useState } from 'react';
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from '@mui/material';
import { cotizacionIAApi } from '../../api/endpoints';

export default function ConvertirPropuestaDialog({ cotizacion, onClose, onConverted }) {
  const [form, setForm] = useState({
    montoTotal: String(cotizacion.lineas?.reduce((total, l) => total + l.precioTotal, 0) || cotizacion.rangoMinimo || ''),
    plazoEstimadoDias: '', descripcion: cotizacion.resumenIA ?? '',
  });
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState('');
  const campo = nombre => event => setForm(prev => ({ ...prev, [nombre]: event.target.value }));
  async function confirmar(event) {
    event.preventDefault();
    setOcupado(true); setError('');
    try {
      await cotizacionIAApi.convertirPropuesta(cotizacion.id, {
        montoTotal: Number(form.montoTotal), plazoEstimadoDias: Number(form.plazoEstimadoDias),
        descripcion: form.descripcion,
      });
      onConverted();
    } catch (err) { setError(err.response?.data?.message ?? 'No se pudo enviar la propuesta.'); }
    finally { setOcupado(false); }
  }
  return (
    <Dialog open onClose={ocupado ? undefined : onClose} fullWidth maxWidth="sm">
      <form onSubmit={confirmar}>
        <DialogTitle>Revisar y enviar propuesta</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          <Alert severity="info">Confirmá tus precios y el plazo antes de enviar la propuesta al cliente.</Alert>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField required label="Monto total (CRC)" type="number" value={form.montoTotal}
            onChange={campo('montoTotal')} inputProps={{ min: 0.01, step: '0.01' }} disabled={ocupado} />
          <TextField required label="Plazo en días" type="number" value={form.plazoEstimadoDias}
            onChange={campo('plazoEstimadoDias')} inputProps={{ min: 1, step: 1 }} disabled={ocupado} />
          <TextField required label="Descripción" multiline minRows={3} value={form.descripcion}
            onChange={campo('descripcion')} inputProps={{ maxLength: 3000 }} disabled={ocupado} />
        </DialogContent>
        <DialogActions>
          <Button disabled={ocupado} onClick={onClose}>Cancelar</Button>
          <Button disabled={ocupado} variant="contained" type="submit">{ocupado ? 'Enviando…' : 'Confirmar y enviar'}</Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
