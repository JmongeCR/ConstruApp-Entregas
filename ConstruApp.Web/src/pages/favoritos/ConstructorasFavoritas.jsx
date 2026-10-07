import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert, Avatar, Box, Button, Card, CardContent, Chip, Grid,
  IconButton, Rating, Skeleton, Stack, Tooltip, Typography,
} from '@mui/material';
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FavoriteIcon from '@mui/icons-material/Favorite';
import VerifiedIcon from '@mui/icons-material/Verified';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import { favoritosApi } from '../../api/endpoints';

const COLORS = ['#4F46E5', '#0EA5E9', '#10B981', '#2563EB', '#8B5CF6', '#EC4899'];
const avatarColor = (name) => COLORS[(name?.charCodeAt(0) ?? 0) % COLORS.length];

export default function ConstructorasFavoritas() {
  const navigate = useNavigate();
  const [favoritos, setFavoritos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    favoritosApi.getConstructoras()
      .then(({ data }) => setFavoritos(data ?? []))
      .catch(() => setError('No fue posible cargar tus constructoras favoritas.'))
      .finally(() => setLoading(false));
  }, []);

  const quitar = async (perfilId) => {
    try {
      await favoritosApi.quitarConstructora(perfilId);
      setFavoritos(items => items.filter(item => item.perfilConstructorId !== perfilId));
    } catch {
      setError('No fue posible quitar la constructora de favoritos.');
    }
  };

  return (
    <Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} gap={2} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={850}>Constructoras favoritas</Typography>
          <Typography color="text.secondary">Empresas que guardaste para futuros proyectos.</Typography>
        </Box>
        <Button variant="outlined" startIcon={<BusinessOutlinedIcon />} onClick={() => navigate('/marketplace')}>
          Explorar constructoras
        </Button>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      {loading ? (
        <Grid container spacing={2}>{[1, 2, 3].map(i => <Grid size={{ xs: 12, sm: 6, md: 4 }} key={i}><Skeleton variant="rounded" height={220} /></Grid>)}</Grid>
      ) : favoritos.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8, border: '1px dashed', borderColor: 'divider', borderRadius: 3 }}>
          <FavoriteBorderIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
          <Typography variant="h6" fontWeight={800}>Aún no tenés favoritos</Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5, mb: 2.5 }}>Guardá una constructora desde el directorio o desde su perfil.</Typography>
          <Button variant="contained" onClick={() => navigate('/marketplace')}>Ir al directorio</Button>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {favoritos.map(item => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={item.id}>
              <Card variant="outlined" sx={{ height: '100%', borderRadius: 2.5, cursor: 'pointer', '&:hover': { borderColor: 'primary.light', boxShadow: '0 8px 24px rgba(15,23,42,0.07)' } }} onClick={() => navigate(`/constructor/${item.perfilConstructorId}`)}>
                <CardContent sx={{ p: 2.5 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1.5}>
                    <Avatar sx={{ bgcolor: avatarColor(item.nombreEmpresa), width: 48, height: 48, fontWeight: 800 }}>{item.nombreEmpresa?.[0]}</Avatar>
                    <Tooltip title="Quitar de favoritos">
                      <IconButton size="small" color="error" onClick={e => { e.stopPropagation(); quitar(item.perfilConstructorId); }}>
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>

                  <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mt: 1.5 }}>
                    <Typography fontWeight={800} noWrap>{item.nombreEmpresa}</Typography>
                    {item.verificado && <VerifiedIcon sx={{ fontSize: 16, color: '#16A34A' }} />}
                  </Stack>
                  <Typography fontSize={12.5} color="text.secondary" sx={{ mt: 0.5, minHeight: 38, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {item.bio || item.especialidades || 'Empresa constructora registrada en ConstruApp.'}
                  </Typography>

                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 2 }}>
                    {item.calificacionPromedio > 0 ? <Rating value={item.calificacionPromedio} precision={0.5} size="small" readOnly /> : <Typography fontSize={12} color="text.disabled">Sin calificaciones</Typography>}
                    <Chip icon={<FavoriteIcon />} label="Favorita" size="small" sx={{ bgcolor: '#FFF1F2', color: '#BE123C', fontWeight: 700 }} />
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
