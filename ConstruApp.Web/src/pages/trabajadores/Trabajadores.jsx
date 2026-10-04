import { useEffect, useState } from 'react';
import {
  Box, Card, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Alert, Grid, MenuItem, Select, FormControl, InputLabel,
  Typography, Stack, Chip, Divider,
} from '@mui/material';
import EditIcon        from '@mui/icons-material/Edit';
import DeleteIcon      from '@mui/icons-material/Delete';
import PeopleAltIcon   from '@mui/icons-material/PeopleAlt';
import PersonAddIcon   from '@mui/icons-material/PersonAdd';
import { trabajadoresApi } from '../../api/endpoints';
import PageHeader      from '../../components/common/PageHeader';
import EstadoChip      from '../../components/common/EstadoChip';
import ConfirmDialog   from '../../components/common/ConfirmDialog';
import LoadingScreen   from '../../components/common/LoadingScreen';

const ESTADOS = ['Activo', 'Inactivo'];
const EMPTY   = { nombre: '', puesto: '', especialidad: '', cedula: '', email: '', telefono: '', estado: 'Activo' };

export default function Trabajadores() {
  const [rows, setRows]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [open, setOpen]         = useState(false);
  const [form, setForm]         = useState(EMPTY);
  const [editId, setEditId]     = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [confirmId, setConfirmId] = useState(null);

  const load = () => {
    setLoading(true);
    trabajadoresApi.getAll()
      .then(r => setRows(r.data))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const set = f => e => {
    setForm(p => ({ ...p, [f]: e.target.value }));
    setFieldErrors(p => ({ ...p, [f]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.nombre.trim()) errs.nombre = 'El nombre es requerido.';
    if (!form.especialidad?.trim() && !form.puesto?.trim())
      errs.especialidad = 'Ingresá al menos la especialidad o el puesto.';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = 'Correo inválido.';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleOpen = (row = null) => {
    setApiError('');
    setFieldErrors({});
    if (row) {
      setForm({
        nombre: row.nombre, puesto: row.puesto, especialidad: row.especialidad,
        cedula: row.cedula, email: row.email, telefono: row.telefono, estado: row.estado,
      });
      setEditId(row.id);
    } else {
      setForm(EMPTY);
      setEditId(null);
    }
    setOpen(true);
  };

  const handleSave = async () => {
    if (!validate()) return;
    setApiError('');
    try {
      if (editId) await trabajadoresApi.update(editId, form);
      else        await trabajadoresApi.create(form);
      setOpen(false);
      load();
    } catch (e) {
      setApiError(e.response?.data?.message || 'Error al guardar el colaborador.');
    }
  };

  const handleDelete = async () => {
    await trabajadoresApi.delete(confirmId);
    setConfirmId(null);
    load();
  };

  if (loading) return <LoadingScreen />;

  const activos   = rows.filter(r => r.estado === 'Activo').length;
  const inactivos = rows.length - activos;

  return (
    <Box>
      <PageHeader
        title="Personal de la empresa"
        subtitle={`${rows.length} colaboradores · ${activos} activos`}
        onAdd={() => handleOpen()}
        addLabel="Agregar colaborador"
      />

      {/* Contadores */}
      {rows.length > 0 && (
        <Stack direction="row" spacing={1.5} mb={2}>
          <Chip label={`${activos} activos`}   color="success" size="small" variant="outlined" />
          <Chip label={`${inactivos} inactivos`} color="default" size="small" variant="outlined" />
        </Stack>
      )}

      <Card variant="outlined" sx={{ overflowX: 'auto' }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'action.hover' }}>
                {['Nombre', 'Puesto / Especialidad', 'Cédula', 'Contacto', 'Estado', ''].map(h => (
                  <TableCell key={h}>
                    <Typography fontWeight={700} fontSize={11} color="text.secondary"
                      sx={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {h}
                    </Typography>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 8, borderBottom: 'none' }}>
                    <Stack alignItems="center" spacing={1.5}>
                      <PeopleAltIcon sx={{ fontSize: 44, color: 'text.disabled' }} />
                      <Box>
                        <Typography color="text.secondary" fontWeight={600} fontSize={14}>
                          No hay colaboradores registrados
                        </Typography>
                        <Typography color="text.disabled" fontSize={13} mt={0.5}>
                          Agregá el personal de tu empresa para asignarlo a proyectos.
                        </Typography>
                      </Box>
                      <Button size="small" variant="outlined" startIcon={<PersonAddIcon />}
                        onClick={() => handleOpen()} sx={{ mt: 0.5 }}>
                        Agregar primer colaborador
                      </Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              ) : rows.map(r => (
                <TableRow key={r.id} hover sx={{ '&:last-child td': { borderBottom: 0 } }}>
                  <TableCell>
                    <Typography fontWeight={600} fontSize={13.5}>{r.nombre}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography fontSize={13}>{r.puesto || r.especialidad || '—'}</Typography>
                    {r.puesto && r.especialidad && (
                      <Typography fontSize={11} color="text.secondary">{r.especialidad}</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography fontSize={13} color="text.secondary">{r.cedula || '—'}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography fontSize={13}>{r.telefono || r.email || '—'}</Typography>
                    {r.telefono && r.email && (
                      <Typography fontSize={11} color="text.secondary">{r.email}</Typography>
                    )}
                  </TableCell>
                  <TableCell><EstadoChip estado={r.estado} /></TableCell>
                  <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                    <Tooltip title="Editar" aria-label="Editar">
                      <IconButton size="small" aria-label="Editar" onClick={() => handleOpen(r)}
                        sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main', bgcolor: 'primary.50' } }}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Eliminar">
                      <IconButton size="small" onClick={() => setConfirmId(r.id)}
                        sx={{ color: 'text.secondary', '&:hover': { color: 'error.main', bgcolor: 'error.50' } }}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Diálogo crear/editar */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
          {editId ? 'Editar colaborador' : 'Agregar colaborador'}
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 2.5 }}>
          {apiError && <Alert severity="error" sx={{ mb: 2 }}>{apiError}</Alert>}

          {/* Identificación */}
          <Typography variant="caption" fontWeight={700} color="text.secondary"
            sx={{ textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', mb: 1.5 }}>
            Identificación
          </Typography>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12}>
              <TextField fullWidth label="Nombre completo *" value={form.nombre}
                onChange={set('nombre')} error={!!fieldErrors.nombre} helperText={fieldErrors.nombre} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Puesto" value={form.puesto}
                onChange={set('puesto')} placeholder="Ej: Maestro de obras"
                helperText="Cargo dentro de la empresa" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Especialidad" value={form.especialidad}
                onChange={set('especialidad')} placeholder="Ej: Electricista"
                error={!!fieldErrors.especialidad} helperText={fieldErrors.especialidad || 'Oficio o habilidad técnica'} />
            </Grid>
          </Grid>

          <Divider sx={{ mb: 2 }} />

          {/* Contacto y estado */}
          <Typography variant="caption" fontWeight={700} color="text.secondary"
            sx={{ textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', mb: 1.5 }}>
            Contacto y estado
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Cédula de identidad" value={form.cedula}
                onChange={set('cedula')} placeholder="Ej: 1-1234-5678"
                helperText="Se valida unicidad en la empresa" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Teléfono" value={form.telefono}
                onChange={set('telefono')} placeholder="Ej: 8888-8888" />
            </Grid>
            <Grid item xs={12} sm={8}>
              <TextField fullWidth label="Correo electrónico" value={form.email}
                onChange={set('email')} type="email"
                error={!!fieldErrors.email} helperText={fieldErrors.email} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Estado</InputLabel>
                <Select value={form.estado} onChange={set('estado')} label="Estado">
                  {ESTADOS.map(e => <MenuItem key={e} value={e}>{e}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setOpen(false)} color="inherit">Cancelar</Button>
          <Button onClick={handleSave} variant="contained">
            {editId ? 'Actualizar' : 'Guardar colaborador'}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={!!confirmId}
        message="¿Eliminar este colaborador? Esta acción no se puede deshacer."
        onConfirm={handleDelete}
        onCancel={() => setConfirmId(null)}
      />
    </Box>
  );
}
