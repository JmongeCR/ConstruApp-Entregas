import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, Grid, Button, Chip,
  IconButton, Tooltip, Skeleton, Alert,
} from '@mui/material';
import DeleteOutlineIcon  from '@mui/icons-material/DeleteOutlined';
import LocationOnIcon     from '@mui/icons-material/LocationOn';
import VerifiedIcon       from '@mui/icons-material/Verified';
import FavoriteIcon       from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import StoreIcon          from '@mui/icons-material/Store';
import { favoritosApi } from '../../api/endpoints';
import PageHeader        from '../../components/common/PageHeader';

export default function ProveedoresFavoritos() {
  const navigate = useNavigate();
  const [favoritos, setFavoritos] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');

  const cargar = () => {
    setLoading(true);
    favoritosApi.getProveedores()
      .then(r => setFavoritos(r.data))
      .catch(() => setError('No se pudieron cargar los favoritos.'))
      .finally(() => setLoading(false));
  };

  useEffect(cargar, []);

  const quitar = async (perfilId) => {
    try {
      await favoritosApi.quitarProveedor(perfilId);
      setFavoritos(prev => prev.filter(f => f.perfilProveedorId !== perfilId));
    } catch {
      setError('Error al quitar el favorito.');
    }
  };

  return (
    <Box>
      <PageHeader
        title="Proveedores favoritos"
        subtitle={loading ? '' : `${favoritos.length} guardados`}
        Icon={FavoriteIcon}
      />

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      {loading ? (
        <Grid container spacing={2}>
          {[1, 2, 3].map(i => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <Skeleton variant="rounded" height={160} />
            </Grid>
          ))}
        </Grid>
      ) : favoritos.length === 0 ? (
        <Box sx={{
          textAlign: 'center', py: 10,
          border: '1px dashed', borderColor: 'divider', borderRadius: 2,
          bgcolor: 'action.hover',
        }}>
          <FavoriteBorderIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
          <Typography color="text.secondary" fontWeight={600} fontSize={15} mb={0.5}>
            Aún no tenés proveedores favoritos
          </Typography>
          <Typography color="text.disabled" fontSize={13} mb={3}>
            Guardá proveedores del marketplace para acceder rápido a sus datos de contacto.
          </Typography>
          <Button variant="outlined" startIcon={<StoreIcon />} onClick={() => navigate('/marketplace')}>
            Explorar proveedores
          </Button>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {favoritos.map(f => (
            <Grid item xs={12} sm={6} md={4} key={f.id}>
              <Card variant="outlined" sx={{ borderRadius: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ p: 2.5, flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {/* Nombre + quitar */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Typography fontWeight={700} fontSize={14} noWrap>
                          {f.proveedor?.nombreComercial ?? '—'}
                        </Typography>
                        {f.proveedor?.verificado && (
                          <Tooltip title="Proveedor verificado">
                            <VerifiedIcon sx={{ fontSize: 15, color: '#16A34A', flexShrink: 0 }} />
                          </Tooltip>
                        )}
                      </Box>
                    </Box>
                    <Tooltip title="Quitar de favoritos">
                      <IconButton size="small" onClick={() => quitar(f.perfilProveedorId)}
                        sx={{ color: 'text.disabled', ml: 0.5, flexShrink: 0,
                          '&:hover': { color: 'error.main', bgcolor: 'error.50' } }}>
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>

                  {/* Descripción */}
                  {f.proveedor?.descripcion && (
                    <Typography variant="body2" color="text.secondary" fontSize={12.5}
                      sx={{ display: '-webkit-box', WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.5 }}>
                      {f.proveedor.descripcion}
                    </Typography>
                  )}

                  {/* Metadatos */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 'auto' }}>
                    {(f.proveedor?.canton || f.proveedor?.provincia) && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <LocationOnIcon sx={{ fontSize: 13, color: 'text.disabled' }} />
                        <Typography fontSize={12} color="text.secondary">
                          {[f.proveedor.canton, f.proveedor.provincia].filter(Boolean).join(', ')}
                        </Typography>
                      </Box>
                    )}
                  </Box>

                  {/* Footer */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    pt: 1, borderTop: '1px solid', borderColor: 'divider', mt: 0.5 }}>
                    <Typography fontSize={11} color="text.disabled">
                      Guardado {new Date(f.fechaAgregado).toLocaleDateString('es-CR', { day: 'numeric', month: 'short' })}
                    </Typography>
                    <Chip label="Proveedor" size="small"
                      sx={{ bgcolor: '#F0FDF4', color: '#16A34A', fontSize: 10, fontWeight: 600,
                        border: '1px solid #BBF7D0', height: 20 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
