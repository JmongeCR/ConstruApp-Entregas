import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert, Box, Button, MenuItem, Paper, TextField, Typography } from '@mui/material';
import api from '../../api/axios';
import { propiedadesApi } from '../../api/endpoints';

const ruta = '/cotizacion-ia/entrevistas';
const moneda = new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC' });
const secciones = {
  objetivo: 'Objetivo', entregables: 'Entregables', exclusiones: 'Exclusiones',
  supuestos: 'Supuestos', personal: 'Perfiles de personal', pendientes: 'Pendientes',
};
const nombresCampo = { titulo: 'el nombre', tipoProyecto: 'el tipo de trabajo', descripcion: 'la descripción' };
const tipos = {
  Remodelacion: 'Remodelación', ObraGris: 'Obra gris', ElectricoPlomeria: 'Electricidad o plomería',
  Pintura: 'Pintura', Pisos: 'Pisos', Techos: 'Techos', PiscinaJardin: 'Piscina o jardín', Otro: 'Otro',
};

function VistaAlcance({ alcance }) {
  const { contenido, estimacion, areaM2 } = alcance;
  return (
    <Box sx={{ my: 2 }}>
      <Typography variant="h6">Alcance del proyecto</Typography>
      {Object.entries(secciones).map(([campo, titulo]) => (
        <Box key={campo} sx={{ mb: 1 }}>
          <Typography variant="subtitle2">{titulo}</Typography>
          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{contenido[campo] || 'Sin datos'}</Typography>
        </Box>
      ))}
      <Typography variant="subtitle2">Proyecciones preliminares</Typography>
      <Typography variant="body2">Área confirmada {areaM2 != null ? `${areaM2} m²` : 'pendiente'}</Typography>
      <Typography variant="body2">Costo {estimacion.costoMinCrc != null
        ? `${moneda.format(estimacion.costoMinCrc)} a ${moneda.format(estimacion.costoMaxCrc)}` : 'pendiente de estimar'}</Typography>
      {estimacion.fuente && <Typography variant="caption">Referencia {estimacion.fuente}</Typography>}
      <Typography variant="body2">Plazo de trabajo {estimacion.diasMin != null
        ? `${estimacion.diasMin} a ${estimacion.diasMax} días` : 'pendiente de estimar'}</Typography>
      <Typography variant="body2">Cuadrilla {estimacion.personas != null
        ? `${estimacion.personas} personas de referencia` : 'pendiente de estimar'}</Typography>
    </Box>
  );
}

export default function EntrevistaProyecto() {
  const [lista, setLista] = useState([]);
  const [entrevista, setEntrevista] = useState(null);
  const [texto, setTexto] = useState('');
  const [area, setArea] = useState('');
  const [propiedad, setPropiedad] = useState('');
  const [propiedades, setPropiedades] = useState([]);
  const [ocupada, setOcupada] = useState(false);
  const [error, setError] = useState('');
  const datos = entrevista?.datos;
  const cerrada = Boolean(entrevista?.proyectoId);
  const limite = (datos?.turnos.length ?? 0) >= 20;
  const areaModificada = datos?.alcance && (area === '' ? null : Number(area)) !== datos.alcance.areaM2;

  useEffect(() => {
    let activa = true;
    api.get(ruta).then(({ data }) => { if (activa) setLista(data); })
      .catch(() => { if (activa) setError('No se pudo cargar el historial de entrevistas.'); });
    propiedadesApi.getMias().then(({ data }) => { if (activa) setPropiedades(data); })
      .catch(() => { if (activa) setError('No se pudieron cargar tus propiedades.'); });
    return () => { activa = false; };
  }, []);

  async function ejecutar(operacion, cambioEntrevista = false) {
    if (ocupada) return;
    setOcupada(true);
    setError('');
    try {
      const { data } = await operacion();
      setEntrevista(data);
      setLista(prev => [{ id: data.id, actualizadaUtc: data.actualizadaUtc, proyectoId: data.proyectoId },
        ...prev.filter(item => item.id !== data.id)].sort((a, b) => b.actualizadaUtc.localeCompare(a.actualizadaUtc)));
      if (cambioEntrevista) {
        setTexto('');
        setArea(data.datos.alcance?.areaM2 ?? '');
        setPropiedad('');
      }
      return data;
    } catch (err) {
      setError(err.response?.data?.message ?? (err.response?.status === 429
        ? 'Esperá un minuto antes de volver a intentar.' : 'No se pudo completar la acción. Intentá de nuevo.'));
    } finally {
      setOcupada(false);
    }
  }

  async function nueva() {
    await ejecutar(() => api.post(ruta), true);
  }

  async function enviar(event) {
    event.preventDefault();
    if (!texto.trim() || limite || cerrada) return;
    const respuesta = await ejecutar(() => api.post(`${ruta}/${entrevista.id}/mensajes`,
      { version: entrevista.version, texto: texto.trim() }));
    if (respuesta) setTexto('');
  }

  function adjuntar(event) {
    const archivo = event.target.files?.[0];
    event.target.value = '';
    if (!archivo) return;
    const form = new FormData();
    form.append('archivo', archivo);
    form.append('version', entrevista.version);
    ejecutar(() => api.post(`${ruta}/${entrevista.id}/adjuntos`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }));
  }

  return (
    <Paper variant="outlined" sx={{ p: 2.5, mb: 3 }}>
      <Typography variant="h6">Validá tu proyecto con IA</Typography>
      <Typography color="text.secondary" sx={{ mb: 2 }}>
        Contame qué querés construir o remodelar y en qué parte del inmueble.
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
        <Button variant="outlined" onClick={nueva} disabled={ocupada}>Nueva entrevista</Button>
        {lista.length > 0 && <TextField select size="small" label="Retomar entrevista" value={entrevista?.id ?? ''}
          sx={{ minWidth: 235 }} disabled={ocupada}
          onChange={e => ejecutar(() => api.get(`${ruta}/${e.target.value}`), true)}>
          {lista.map((item, i) => <MenuItem key={item.id} value={item.id}>
            {i + 1}. {new Date(item.actualizadaUtc).toLocaleString('es-CR')}{item.proyectoId ? ' · Borrador' : ''}
          </MenuItem>)}
        </TextField>}
        {entrevista && <Button disabled={ocupada}
          onClick={() => ejecutar(() => api.get(`${ruta}/${entrevista.id}`))}>Recargar</Button>}
      </Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {ocupada && <Typography role="status" sx={{ mb: 1 }}>Procesando…</Typography>}
      {datos && <>
        <Box role="log" aria-label="Conversación del proyecto" sx={{ maxHeight: 360, overflow: 'auto' }}>
          {datos.turnos.map((turno, i) => (
            <Box key={i} sx={{ p: 1.5, mb: 1, borderRadius: 1, bgcolor: turno.rol === 'cliente' ? 'action.hover' : 'background.default' }}>
              <Typography variant="subtitle2">{turno.rol === 'cliente' ? 'Vos' : 'Asistente'}</Typography>
              <Typography sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{turno.texto}</Typography>
            </Box>
          ))}
        </Box>
        {datos.ficha && (
          <Box sx={{ my: 2 }}>
            <Typography variant="subtitle2">Ficha de la entrevista</Typography>
            <Typography variant="body2">{datos.ficha.titulo || 'Nombre pendiente'}</Typography>
            <Typography variant="body2">{tipos[datos.ficha.tipoProyecto] ?? 'Tipo de trabajo pendiente'}</Typography>
            <Typography variant="body2">{datos.ficha.descripcion || 'Descripción pendiente'}</Typography>
            {Object.keys(datos.faltantes).length > 0 && (
              <Typography variant="body2">Falta completar {Object.keys(datos.faltantes).map(campo => nombresCampo[campo]).join(', ')}.</Typography>
            )}
          </Box>
        )}
        {!cerrada && <Box component="form" onSubmit={enviar} sx={{ mb: 2 }}>
          {limite && <Alert severity="info" sx={{ mb: 1 }}>Llegaste al límite de mensajes de esta entrevista.</Alert>}
          <TextField label="Tu mensaje" multiline minRows={2} fullWidth value={texto}
            onChange={e => setTexto(e.target.value)} inputProps={{ maxLength: 1500 }} disabled={ocupada || limite} />
          <Button sx={{ mt: 1 }} type="submit" variant="contained" disabled={ocupada || limite || !texto.trim()}>Validar con IA</Button>
        </Box>}
        {!cerrada && <Box sx={{ mb: 2 }}>
          <Button component="label" variant="outlined" disabled={ocupada || datos.fuentes.length >= 5}>
            Analizar foto o PDF
            <input hidden type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={adjuntar} />
          </Button>
          <Typography variant="caption" display="block">Se envía el archivo a la IA para analizarlo. Máximo 4 MB por archivo.</Typography>
        </Box>}
        {datos.fuentes.map((fuente, i) => <Box key={i} sx={{ mb: 1 }}>
          <Typography variant="subtitle2">{fuente.nombre}</Typography>
          <Typography variant="body2">{fuente.hallazgo.observaciones}</Typography>
          <Typography variant="body2">Por confirmar {fuente.hallazgo.porConfirmar || 'sin observaciones adicionales'}</Typography>
        </Box>)}
        {!cerrada && datos.completo && <Box component="form" sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}
          onSubmit={e => {
            e.preventDefault();
            ejecutar(() => api.post(`${ruta}/${entrevista.id}/alcance`, {
              version: entrevista.version, areaM2: area === '' ? null : Number(area),
            }));
          }}>
          <TextField type="number" size="small" label="Área confirmada (m²)" value={area} disabled={ocupada}
            onChange={e => setArea(e.target.value)} inputProps={{ min: 0.01, step: '0.01', max: 99999999.99 }}
            helperText="Opcional. Se usa para las estimaciones." />
          <Button type="submit" variant="contained" disabled={ocupada}>Generar alcance</Button>
        </Box>}
        {datos.alcance && <VistaAlcance alcance={datos.alcance} />}
        {!cerrada && datos.alcance && <Box component="form" sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}
          onSubmit={e => {
            e.preventDefault();
            ejecutar(() => api.post(`${ruta}/${entrevista.id}/borrador`, { version: entrevista.version, propiedadId: Number(propiedad) }));
          }}>
          <TextField select required size="small" label="Propiedad del proyecto" sx={{ minWidth: 220 }}
            value={propiedad} onChange={e => setPropiedad(e.target.value)} disabled={ocupada}>
            {propiedades.map(p => <MenuItem key={p.id} value={p.id}>{p.nombre}</MenuItem>)}
          </TextField>
          <Button type="submit" variant="contained" disabled={ocupada || !propiedad || areaModificada}>Confirmar y crear borrador</Button>
        </Box>}
        {cerrada && <Button component={Link} to={`/publicar/${entrevista.proyectoId}`}>Abrir proyecto en borrador</Button>}
      </>}
    </Paper>
  );
}
