import { useState } from 'react';
import { Alert, Box, Button, Paper, TextField, Typography } from '@mui/material';
import api from '../../api/axios';

const tipos = {
  Remodelacion: 'Remodelación', ObraGris: 'Obra gris', ElectricoPlomeria: 'Electricidad o plomería',
  Pintura: 'Pintura', Pisos: 'Pisos', Techos: 'Techos', PiscinaJardin: 'Piscina o jardín', Otro: 'Otro',
};

export default function EntrevistaProyecto() {
  const [turnos, setTurnos] = useState([]);
  const [texto, setTexto] = useState('');
  const [revision, setRevision] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const limite = turnos.length >= 20;

  async function enviar(event) {
    event.preventDefault();
    if (cargando || limite || !texto.trim()) return;

    const historial = [...turnos, { rol: 'cliente', texto: texto.trim() }];
    setCargando(true);
    setError('');
    try {
      const { data } = await api.post('/cotizacion-ia/entrevista', { turnos: historial });
      setTurnos([...historial, { rol: 'asistente', texto: data.mensaje }]);
      setRevision(data);
      setTexto('');
    } catch (err) {
      setError(err.response?.data?.message ?? (err.response?.status === 429
        ? 'Esperá un minuto antes de enviar otro mensaje.'
        : 'No se pudo revisar el mensaje. Podés volver a enviarlo.'));
    } finally {
      setCargando(false);
    }
  }

  function reiniciar() {
    setTurnos([]);
    setTexto('');
    setRevision(null);
    setError('');
  }

  return (
    <Paper variant="outlined" sx={{ p: 2.5, mb: 3 }}>
      <Typography variant="h6">Validá tu proyecto con IA</Typography>
      <Typography color="text.secondary" sx={{ mb: 2 }}>
        Contame qué querés construir o remodelar y en qué parte del inmueble.
      </Typography>
      <Box role="log" aria-label="Conversación del proyecto" sx={{ maxHeight: 360, overflow: 'auto' }}>
        {turnos.map((turno, i) => (
          <Box key={i} sx={{ p: 1.5, mb: 1, borderRadius: 1, bgcolor: turno.rol === 'cliente' ? 'action.hover' : 'background.default' }}>
            <Typography variant="subtitle2">{turno.rol === 'cliente' ? 'Vos' : 'Asistente'}</Typography>
            <Typography sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{turno.texto}</Typography>
          </Box>
        ))}
      </Box>
      {revision && (
        <Box sx={{ my: 2 }}>
          <Typography variant="subtitle2">Ficha de la entrevista</Typography>
          <Typography variant="body2">{revision.ficha.titulo || 'Nombre pendiente'}</Typography>
          <Typography variant="body2">{tipos[revision.ficha.tipoProyecto] ?? 'Tipo de trabajo pendiente'}</Typography>
          <Typography variant="body2">{revision.ficha.descripcion || 'Descripción pendiente'}</Typography>
          {Object.keys(revision.faltantes).length > 0 && (
            <Typography variant="body2" color="text.secondary">
              Falta completar {Object.keys(revision.faltantes).map(campo => ({
                titulo: 'el nombre', tipoProyecto: 'el tipo de trabajo', descripcion: 'la descripción',
              })[campo]).join(', ')}.
            </Typography>
          )}
        </Box>
      )}
      {revision?.completo && <Alert severity="success" sx={{ mb: 2 }}>La ficha ya tiene información para una revisión inicial.</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {limite && <Alert severity="info" sx={{ mb: 2 }}>Llegaste al límite de mensajes de esta entrevista.</Alert>}
      <Box component="form" onSubmit={enviar}>
        <TextField label="Tu mensaje" multiline minRows={2} fullWidth value={texto}
          onChange={event => setTexto(event.target.value)} inputProps={{ maxLength: 1500 }}
          disabled={cargando || limite} />
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1.5 }}>
          <Button type="submit" variant="contained" disabled={cargando || limite || !texto.trim()}>
            {cargando ? 'Validando…' : 'Enviar mensaje'}
          </Button>
          {turnos.length > 0 && <Button onClick={reiniciar} disabled={cargando}>Nueva entrevista</Button>}
        </Box>
      </Box>
    </Paper>
  );
}
