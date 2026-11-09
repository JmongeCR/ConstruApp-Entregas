import { useEffect, useState } from 'react';
import { Alert, Box, Button, MenuItem, TextField, Typography } from '@mui/material';
import { empleadosApi } from '../../api/endpoints';

export default function PersonalObra({ proyectoId, puedeEditar, notify }) {
  const [personal, setPersonal] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [seleccionado, setSeleccionado] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState('');
  const disponibles = empleados.filter(e => e.estado === 'Activo' && !personal.some(a => a.empleadoId === e.id));

  useEffect(() => {
    let activo = true;
    setError('');
    Promise.all([
      empleadosApi.getByProyecto(proyectoId),
      puedeEditar ? empleadosApi.getMios() : Promise.resolve({ data: [] }),
    ]).then(([asignaciones, propios]) => {
      if (activo) { setPersonal(asignaciones.data); setEmpleados(propios.data); }
    }).catch(() => { if (activo) setError('No se pudo cargar el personal de la obra.'); });
    return () => { activo = false; };
  }, [proyectoId, puedeEditar]);

  async function asignar(event) {
    event.preventDefault();
    setOcupado(true); setError('');
    try {
      await empleadosApi.asignar({ proyectoId: Number(proyectoId), empleadoId: Number(seleccionado) });
      const { data } = await empleadosApi.getByProyecto(proyectoId);
      setPersonal(data); setSeleccionado('');
      notify('Personal asignado a la obra.');
    } catch (err) { setError(err.response?.data?.message ?? 'No se pudo asignar el trabajador.'); }
    finally { setOcupado(false); }
  }

  async function quitar(id) {
    setOcupado(true); setError('');
    try {
      await empleadosApi.desasignar(id);
      setPersonal(prev => prev.filter(a => a.id !== id));
      notify('Asignación removida.');
    } catch (err) { setError(err.response?.data?.message ?? 'No se pudo quitar la asignación.'); }
    finally { setOcupado(false); }
  }

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h6" sx={{ mb: 1 }}>Personal de la empresa</Typography>
      {error && <Alert severity="error" sx={{ mb: 1 }}>{error}</Alert>}
      {personal.length === 0 && <Typography color="text.secondary">Todavía no hay trabajadores asignados.</Typography>}
      {personal.map(a => <Box key={a.id} sx={{ display: 'flex', gap: 2, alignItems: 'center', py: 1 }}>
        <Typography>{a.nombre}{a.rol ? ` · ${a.rol}` : ''}</Typography>
        {puedeEditar && <Button disabled={ocupado} onClick={() => quitar(a.id)}>Quitar</Button>}
      </Box>)}
      {puedeEditar && <Box component="form" onSubmit={asignar} sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
        <TextField select label="Trabajador de mi empresa" size="small" value={seleccionado}
          sx={{ minWidth: 250 }} disabled={ocupado} onChange={e => setSeleccionado(e.target.value)}>
          {disponibles.map(e => <MenuItem value={e.id} key={e.id}>{e.nombre}</MenuItem>)}
        </TextField>
        <Button type="submit" variant="outlined" disabled={ocupado || !seleccionado}>Asignar personal</Button>
        {disponibles.length === 0 && <Typography variant="body2" color="text.secondary">No hay más trabajadores activos para asignar.</Typography>}
      </Box>}
    </Box>
  );
}
