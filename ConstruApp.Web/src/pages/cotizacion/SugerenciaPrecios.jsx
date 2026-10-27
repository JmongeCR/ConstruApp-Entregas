import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Alert, Box, Button, CircularProgress, Paper, Stack, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { proyectosApi } from '../../api/endpoints';

const money = new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC', minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function SugerenciaPrecios() {
  const { proyectoId } = useParams();
  return <SugerenciaProyecto key={proyectoId} proyectoId={proyectoId} />;
}

function SugerenciaProyecto({ proyectoId }) {
  const navigate = useNavigate();
  const [proyecto, setProyecto] = useState(null);
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [calculando, setCalculando] = useState(false);

  useEffect(() => {
    let activa = true;
    proyectosApi.getById(proyectoId)
      .then(({ data }) => { if (activa) setProyecto(data); })
      .catch(() => { if (activa) setError('No fue posible cargar el proyecto.'); })
      .finally(() => { if (activa) setLoading(false); });
    return () => { activa = false; };
  }, [proyectoId]);

  const sugerir = async () => {
    setError('');
    setResultado(null);
    setCalculando(true);
    try {
      const { data } = await proyectosApi.sugerirPrecios(proyectoId);
      setResultado(data);
    } catch (e) {
      const errors = e.response?.data?.errors;
      setError(errors ? Object.values(errors).join(' ') : e.response?.data?.message ?? 'No fue posible generar la estimación.');
    } finally {
      setCalculando(false);
    }
  };

  if (loading) return <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box>;

  return (
    <Box sx={{ maxWidth: 760, mx: 'auto', p: { xs: 2, md: 4 } }}>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/mis-proyectos')} sx={{ mb: 2 }}>Mis proyectos</Button>
      <Paper variant="outlined" sx={{ p: { xs: 2.5, md: 4 }, borderRadius: 3 }}>
        <Stack spacing={2.5}>
          <Box>
            <Typography variant="h5" fontWeight={700}>Sugerencia de precios</Typography>
            <Typography color="text.secondary" sx={{ mt: 0.5 }}>{proyecto?.titulo}</Typography>
          </Box>
          <Alert severity="info">El rango se calcula con el área del proyecto y valores de referencia configurados por tipo. Es una estimación, no una cotización ni un precio garantizado.</Alert>
          {error && <Alert severity="warning" role="alert">{error}</Alert>}
          {resultado && <Paper variant="outlined" sx={{ p: 3, bgcolor: '#F8FAFC' }}>
            <Typography variant="overline" color="text.secondary">Rango estimado · {resultado.areaM2} m²</Typography>
            <Typography variant="h4" fontWeight={700} sx={{ my: 1 }}>{money.format(resultado.rangoMinimo)} – {money.format(resultado.rangoMaximo)}</Typography>
            <Typography color="text.secondary">Tipo de proyecto: {resultado.tipoProyecto}</Typography>
            <Typography color="text.secondary">Referencia por m²: {money.format(resultado.precioMinimoM2)} – {money.format(resultado.precioMaximoM2)}</Typography>
            <Typography variant="body2" color="text.secondary">Fuente: {resultado.fuente}</Typography>
            <Typography variant="body2" color="text.secondary">Generada: {new Date(resultado.fechaGeneracion).toLocaleString('es-CR')}</Typography>
            <Alert severity={resultado.tipoProyecto === 'Otro' ? 'warning' : 'info'} sx={{ mt: 2 }}>{resultado.advertencia}</Alert>
          </Paper>}
          <Button variant="contained" startIcon={calculando ? <CircularProgress size={18} color="inherit" /> : <AutoAwesomeIcon />}
            onClick={sugerir} disabled={calculando || !proyecto}>
            {calculando ? 'Calculando…' : resultado ? 'Actualizar estimación' : 'Sugerir precios'}
          </Button>
          {proyecto && <Button variant="outlined" onClick={() => navigate(`/publicar/${proyectoId}`)}>
            Completar o corregir datos del proyecto
          </Button>}
        </Stack>
      </Paper>
    </Box>
  );
}
