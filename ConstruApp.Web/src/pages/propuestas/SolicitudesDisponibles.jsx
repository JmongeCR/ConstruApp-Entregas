import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert, Box, Button, Typography } from '@mui/material';
import api from '../../api/axios';

export default function SolicitudesDisponibles() {
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  async function cargar() {
    setLoading(true); setError('');
    try { const { data } = await api.get('/propuestas/solicitudes'); setSolicitudes(data); }
    catch { setError('No se pudieron cargar las solicitudes disponibles.'); }
    finally { setLoading(false); }
  }
  useEffect(() => { cargar(); }, []);
  return (
    <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2, mb: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
        <Typography variant="h6">Solicitudes de cotización disponibles</Typography>
        <Button disabled={loading} onClick={cargar}>{loading ? 'Cargando…' : 'Actualizar solicitudes'}</Button>
      </Box>
      {error && <Alert severity="error">{error}</Alert>}
      {!loading && !error && solicitudes.length === 0 &&
        <Typography color="text.secondary">No hay solicitudes nuevas disponibles para cotizar.</Typography>}
      {solicitudes.map(p => <Box key={p.id} sx={{ borderTop: '1px solid', borderColor: 'divider', py: 1.5 }}>
        <Typography fontWeight={600}>{p.titulo}</Typography>
        <Typography variant="body2">{[p.canton, p.provincia].filter(Boolean).join(', ')}</Typography>
        <details><summary>Ver alcance solicitado</summary>
          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{p.descripcion}</Typography>
        </details>
        <Button component={Link} to={`/cotizacion/${p.id}`}>Preparar con IA</Button>
        <Button component={Link} to={`/propuestas?proyectoId=${p.id}`}>Crear propuesta</Button>
      </Box>)}
    </Box>
  );
}
