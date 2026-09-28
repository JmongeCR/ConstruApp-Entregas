import { useEffect, useState } from 'react';
import {
  Box, Card, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Alert, Grid, Typography, Chip,
} from '@mui/material';
import AddIcon     from '@mui/icons-material/Add';
import PriceChange from '@mui/icons-material/PriceChange';
import { materialesApi } from '../../api/endpoints';
import PageHeader    from '../../components/common/PageHeader';
import LoadingScreen from '../../components/common/LoadingScreen';
import { useAuth }   from '../../context/AuthContext';

const EMPTY_MAT   = { nombre: '', unidad: '', precioReferencia: '' };
const EMPTY_PRECIO = { precioUnitario: '', notas: '' };

export default function Materiales() {
  const { user } = useAuth();
  const esAdmin  = user?.rol === 'Admin';

  const [materiales, setMateriales]     = useState([]);
  const [precios, setPrecios]           = useState([]);
  const [selectedMat, setSelectedMat]   = useState(null);
  const [loading, setLoading]           = useState(true);
  const [openMat, setOpenMat]           = useState(false);
  const [openPrecio, setOpenPrecio]     = useState(false);
  const [formMat, setFormMat]           = useState(EMPTY_MAT);
  const [formPrecio, setFormPrecio]     = useState(EMPTY_PRECIO);
  const [error, setError]               = useState('');

  const loadMateriales = () => {
    setLoading(true);
    materialesApi.getAll().then(r => setMateriales(r.data ?? [])).finally(() => setLoading(false));
  };

  const loadPrecios = (mat) => {
    setSelectedMat(mat);
    materialesApi.getPrecios(mat.id).then(r => setPrecios(r.data ?? [])).catch(() => setPrecios([]));
  };

  useEffect(loadMateriales, []);

  const handleSaveMat = async () => {
    setError('');
    try {
      await materialesApi.create({ ...formMat, precioReferencia: parseFloat(formMat.precioReferencia) || 0 });
      setOpenMat(false);
      setFormMat(EMPTY_MAT);
      loadMateriales();
    } catch (e) { setError(e.response?.data?.message || 'Error al guardar'); }
  };

  const handleSavePrecio = async () => {
    setError('');
    try {
      await materialesApi.agregarPrecio(selectedMat.id, {
        precio: parseFloat(formPrecio.precioUnitario),
        urlProducto: null,
      });
      setOpenPrecio(false);
      setFormPrecio(EMPTY_PRECIO);
      loadPrecios(selectedMat);
    } catch (e) { setError(e.response?.data?.message || 'Error al guardar'); }
  };

  if (loading) return <LoadingScreen />;

  return (
    <Box>
      <PageHeader
        title="Catálogo de Materiales"
        subtitle={esAdmin ? 'Precios de referencia por material' : 'Seleccioná un material para publicar tu precio'}
        onAdd={esAdmin ? () => { setError(''); setOpenMat(true); } : undefined}
        addLabel="Nuevo material"
      />

      <Grid container spacing={2.5}>
        {/* Lista de materiales */}
        <Grid item xs={12} md={selectedMat ? 5 : 12}>
          <Card>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: '#F5F5F5' }}>
                    {['#', 'Nombre', 'Unidad', 'Categoría', 'Acciones'].map(h => (
                      <TableCell key={h}><b>{h}</b></TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {materiales.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                        No hay materiales registrados
                      </TableCell>
                    </TableRow>
                  ) : materiales.map(m => (
                    <TableRow key={m.id} hover selected={selectedMat?.id === m.id}
                      onClick={() => loadPrecios(m)} sx={{ cursor: 'pointer' }}>
                      <TableCell>{m.id}</TableCell>
                      <TableCell><Typography fontWeight={600} fontSize={13}>{m.nombre}</Typography></TableCell>
                      <TableCell><Chip label={m.unidad} size="small" sx={{ fontSize: 11 }} /></TableCell>
                      <TableCell>
                        <Chip label={m.categoria || m.unidadMedida} size="small" sx={{ fontSize: 11, bgcolor: '#EFF6FF', color: '#1D4ED8' }} />
                      </TableCell>
                      <TableCell>
                        <Tooltip title="Ver precios">
                          <IconButton size="small" color="primary" onClick={e => { e.stopPropagation(); loadPrecios(m); }}>
                            <PriceChange fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Grid>

        {/* Panel de precios del material seleccionado */}
        {selectedMat && (
          <Grid item xs={12} md={7}>
            <Card>
              <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E5E7EB' }}>
                <Box>
                  <Typography fontWeight={700} fontSize={15}>{selectedMat.nombre}</Typography>
                  <Typography fontSize={12} color="text.secondary">
                    {esAdmin ? 'Historial de precios' : 'Precios publicados por proveedores'} · {precios.length} registros
                  </Typography>
                </Box>
                <Button variant="contained" size="small" startIcon={<AddIcon />}
                  onClick={() => { setError(''); setOpenPrecio(true); }}>
                  Agregar precio
                </Button>
              </Box>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#F5F5F5' }}>
                      {['Precio unit.', 'Proveedor', 'Notas', 'Fecha'].map(h => (
                        <TableCell key={h}><b>{h}</b></TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {precios.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                          Sin precios registrados
                        </TableCell>
                      </TableRow>
                    ) : precios.map(p => (
                      <TableRow key={p.id} hover>
                        <TableCell>
                          <Typography fontWeight={700} fontSize={13} sx={{ color: '#065F46' }}>
                            ₡{Number(p.precio).toLocaleString('es-CR')}
                          </Typography>
                        </TableCell>
                        <TableCell>{p.proveedorNombre || '—'}</TableCell>
                        <TableCell>{p.notas || '—'}</TableCell>
                        <TableCell>{p.fechaActualizacion ? new Date(p.fechaActualizacion).toLocaleDateString('es-CR') : '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* Dialog nuevo material */}
      <Dialog open={openMat} onClose={() => setOpenMat(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Nuevo material</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2, mt: 1 }}>{error}</Alert>}
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField fullWidth label="Nombre del material" value={formMat.nombre}
                onChange={e => setFormMat(f => ({ ...f, nombre: e.target.value }))} required />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label="Unidad" value={formMat.unidad}
                onChange={e => setFormMat(f => ({ ...f, unidad: e.target.value }))}
                placeholder="m², kg, m³, unid." required />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label="Precio ref. (₡)" type="number" value={formMat.precioReferencia}
                onChange={e => setFormMat(f => ({ ...f, precioReferencia: e.target.value }))} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpenMat(false)}>Cancelar</Button>
          <Button onClick={handleSaveMat} variant="contained">Guardar</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog agregar precio */}
      <Dialog open={openPrecio} onClose={() => setOpenPrecio(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Agregar precio — {selectedMat?.nombre}</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2, mt: 1 }}>{error}</Alert>}
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField fullWidth label="Precio unitario (₡)" type="number" value={formPrecio.precioUnitario}
                onChange={e => setFormPrecio(f => ({ ...f, precioUnitario: e.target.value }))} required />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Notas" value={formPrecio.notas}
                onChange={e => setFormPrecio(f => ({ ...f, notas: e.target.value }))}
                placeholder="Proveedor, condiciones, etc." />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpenPrecio(false)}>Cancelar</Button>
          <Button onClick={handleSavePrecio} variant="contained">Guardar</Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={!!confirmId}
        message="¿Eliminar este material? Esta acción no se puede deshacer."
        onConfirm={handleDeleteMat}
        onCancel={() => setConfirmId(null)}
      />
    </Box>
  );
}
