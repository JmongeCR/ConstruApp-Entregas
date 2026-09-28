import { useEffect, useState } from 'react';
import {
  Box, Card, CardContent, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Rating, LinearProgress,
  Alert, Chip, Avatar, Skeleton,
} from '@mui/material';
import StarIcon          from '@mui/icons-material/Star';
import EmojiEventsIcon   from '@mui/icons-material/EmojiEvents';
import { calificacionesApi } from '../../api/endpoints';

const DARK = '#0F172A';
const GOLD = '#F59E0B';

const AVATAR_PALETTE = ['#4F46E5','#0EA5E9','#10B981','#F59E0B','#8B5CF6','#EC4899','#EF4444'];
const avatarBg = (name) => AVATAR_PALETTE[(name?.charCodeAt(0) ?? 0) % AVATAR_PALETTE.length];

/* ── Puntuación → colour ─────────────────────────────────────────── */
const scoreColor = (n) => {
  if (n >= 4.5) return { bg: '#DCFCE7', color: '#166534' };
  if (n >= 3.5) return { bg: '#FEF3C7', color: '#92400E' };
  return { bg: '#FEE2E2', color: '#991B1B' };
};

export default function Calificaciones() {
  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    calificacionesApi.getAll()
      .then(r => setRows(r.data))
      .catch(() => setError('Error al cargar calificaciones.'))
      .finally(() => setLoading(false));
  }, []);

  /* Promedio global */
  const promedio = rows.length
    ? (rows.reduce((a, r) => a + r.puntuacion, 0) / rows.length).toFixed(1)
    : null;

  return (
    <Box>
      {/* ── Encabezado ───────────────────────────────────────────── */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ bgcolor: '#2563EB', borderRadius: 2, p: 1, display: 'flex' }}>
            <EmojiEventsIcon sx={{ color: 'white', fontSize: 22 }} />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={800} color={DARK}>Calificaciones</Typography>
            <Typography fontSize={13} color="text.secondary">
              Evaluaciones recibidas y emitidas en la plataforma
            </Typography>
          </Box>
        </Box>

        {/* Promedio global badge */}
        {promedio && (
          <Card elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 2.5, px: 2.5, py: 1.5,
            display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <StarIcon sx={{ color: GOLD, fontSize: 24 }} />
            <Box>
              <Typography fontSize={22} fontWeight={800} color={DARK} lineHeight={1}>{promedio}</Typography>
              <Typography fontSize={11} color="text.secondary">{rows.length} evaluaciones</Typography>
            </Box>
          </Card>
        )}
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* ── Tabla ───────────────────────────────────────────────── */}
      <Card elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 2.5, overflow: 'hidden' }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#F8FAFC' }}>
                {['#', 'Proyecto', 'Evaluador', 'Evaluado', 'Puntuación', 'Comentario', 'Fecha'].map(h => (
                  <TableCell key={h} sx={{
                    fontWeight: 700, fontSize: 11.5, color: '#64748B',
                    textTransform: 'uppercase', letterSpacing: 0.4,
                    borderBottom: '2px solid #E2E8F0', py: 1.5,
                  }}>
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 7 }).map((__, j) => (
                      <TableCell key={j}><Skeleton height={26} /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                    <EmojiEventsIcon sx={{ fontSize: 44, color: 'text.disabled', mb: 1, display: 'block', mx: 'auto' }} />
                    <Typography color="text.secondary" fontSize={13}>
                      No hay calificaciones aún.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : rows.map(r => {
                const sc = scoreColor(r.puntuacion);
                return (
                  <TableRow key={r.id} hover sx={{ '&:hover': { bgcolor: '#F8FAFC' } }}>
                    <TableCell sx={{ color: '#94A3B8', fontSize: 12.5 }}>{r.id}</TableCell>

                    <TableCell>
                      <Typography fontSize={13} fontWeight={600} color={DARK} noWrap sx={{ maxWidth: 160 }}>
                        {r.tituloProyecto || `Proyecto #${r.proyectoId}`}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ bgcolor: avatarBg(r.nombreEvaluador), width: 24, height: 24,
                          fontSize: 11, fontWeight: 800 }}>
                          {r.nombreEvaluador?.[0]?.toUpperCase()}
                        </Avatar>
                        <Typography fontSize={12.5} noWrap>{r.nombreEvaluador || `#${r.evaluadorId}`}</Typography>
                      </Box>
                    </TableCell>

                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ bgcolor: avatarBg(r.nombreEvaluado), width: 24, height: 24,
                          fontSize: 11, fontWeight: 800 }}>
                          {r.nombreEvaluado?.[0]?.toUpperCase()}
                        </Avatar>
                        <Typography fontSize={12.5} noWrap>{r.nombreEvaluado || `#${r.evaluadoId}`}</Typography>
                      </Box>
                    </TableCell>

                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                        <Chip
                          icon={<StarIcon sx={{ fontSize: '13px !important', color: `${sc.color} !important` }} />}
                          label={r.puntuacion}
                          size="small"
                          sx={{ bgcolor: sc.bg, color: sc.color, fontWeight: 800, fontSize: 12.5 }}
                        />
                        <Rating value={r.puntuacion} max={5} size="small" readOnly
                          sx={{ '& .MuiRating-iconFilled': { color: GOLD } }} />
                      </Box>
                    </TableCell>

                    <TableCell sx={{ maxWidth: 220 }}>
                      <Typography fontSize={12.5} color="text.secondary" noWrap>
                        {r.comentario || '—'}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Typography fontSize={12} color="text.secondary">
                        {r.fecha ? new Date(r.fecha).toLocaleDateString('es-CR', {
                          day: 'numeric', month: 'short', year: 'numeric',
                        }) : '—'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
}
