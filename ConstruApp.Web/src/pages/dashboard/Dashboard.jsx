import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, Chip, LinearProgress, Skeleton, Divider, Avatar,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Tooltip,
} from '@mui/material';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as ChartTooltip, ResponsiveContainer, Cell,
} from 'recharts';

import AddIcon                from '@mui/icons-material/Add';
import ArrowForwardIcon       from '@mui/icons-material/ArrowForward';
import FolderOpenIcon         from '@mui/icons-material/FolderOpen';
import SendIcon               from '@mui/icons-material/Send';
import AutoAwesomeIcon        from '@mui/icons-material/AutoAwesome';
import WarningAmberIcon       from '@mui/icons-material/WarningAmber';
import InfoOutlinedIcon       from '@mui/icons-material/InfoOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlined';
import PublishIcon            from '@mui/icons-material/Publish';
import StorefrontIcon         from '@mui/icons-material/Storefront';
import TrendingUpIcon         from '@mui/icons-material/TrendingUp';
import PeopleIcon             from '@mui/icons-material/People';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import ConstructionIcon       from '@mui/icons-material/Construction';
import ReceiptIcon            from '@mui/icons-material/Receipt';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import AccountBalanceIcon     from '@mui/icons-material/AccountBalance';
import WorkIcon               from '@mui/icons-material/Work';
import CheckCircleIcon        from '@mui/icons-material/CheckCircle';
import GppMaybeIcon           from '@mui/icons-material/GppMaybe';
import BusinessIcon           from '@mui/icons-material/Business';
import PeopleAltIcon          from '@mui/icons-material/PeopleAlt';
import CloseIcon              from '@mui/icons-material/Close';

import { useAuth }               from '../../context/AuthContext';
import { useNotificaciones }     from '../../context/NotificacionesContext';
import { proyectosApi, propuestasApi, adminApi, constructorApi, facturasApi, cronogramaApi, cotizacionIAApi } from '../../api/endpoints';

const ACCENT = '#2563EB';

const ESTADO = {
  Borrador:     { bg: '#F1F5F9', color: '#64748B', dot: '#94A3B8',  label: 'Borrador'      },
  Publicado:    { bg: '#DCFCE7', color: '#166534', dot: '#22C55E',  label: 'Publicado'     },
  EnPropuestas: { bg: '#FEF9C3', color: '#854D0E', dot: '#EAB308',  label: 'En propuestas' },
  EnCurso:      { bg: '#DBEAFE', color: '#1D4ED8', dot: '#3B82F6',  label: 'En ejecución'  },
  Completado:   { bg: '#D1FAE5', color: '#065F46', dot: '#10B981',  label: 'Completado'    },
  Cancelado:    { bg: '#FEE2E2', color: '#991B1B', dot: '#EF4444',  label: 'Cancelado'     },
};

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Math.abs(Date.now() - new Date(dateStr).getTime());
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 60)  return `hace ${mins}m`;
  if (hours < 24) return `hace ${hours}h`;
  if (days === 1) return 'ayer';
  if (days < 7)   return `hace ${days} días`;
  if (days < 30)  return `hace ${Math.floor(days / 7)} sem.`;
  return `hace ${Math.floor(days / 30)} meses`;
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos días';
  if (h < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

// ── Shared primitives ─────────────────────────────────────────────────────────

function StatCard({ label, value, sub, icon: Icon, iconBg, iconColor, onClick }) {
  return (
    <Box
      onClick={onClick}
      sx={{
        bgcolor: '#fff', border: '1px solid #E2E8F0', borderRadius: '12px',
        p: '20px 24px',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
        '&:hover': onClick ? {
          boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
          transform: 'translateY(-2px)',
          borderColor: '#CBD5E1',
        } : {},
      }}
    >
      {Icon && (
        <Box sx={{
          width: 44, height: 44, borderRadius: '10px',
          bgcolor: iconBg ?? '#EFF6FF',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          mb: 2,
        }}>
          <Icon sx={{ fontSize: 22, color: iconColor ?? ACCENT }} />
        </Box>
      )}
      <Typography sx={{ fontSize: 30, fontWeight: 800, color: '#0F172A', lineHeight: 1.1, letterSpacing: '-0.5px' }}>
        {value ?? '—'}
      </Typography>
      <Typography sx={{ fontSize: 13, color: '#64748B', fontWeight: 500, mt: 0.5 }}>
        {label}
      </Typography>
      {sub && (
        <Typography sx={{ fontSize: 12, mt: 0.4, color: sub.startsWith('⚠') ? '#D97706' : '#22C55E', display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {sub}
        </Typography>
      )}
    </Box>
  );
}

function Panel({ title, action, children, noPad }) {
  return (
    <Box sx={{ bgcolor: '#fff', border: '1px solid #E2E8F0', borderRadius: '12px', overflow: 'hidden' }}>
      <Box sx={{
        px: 2.5, py: 1.5, borderBottom: '1px solid #F1F5F9',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        bgcolor: '#FAFBFC',
      }}>
        <Typography fontSize={13} fontWeight={700} color="text.primary">{title}</Typography>
        {action}
      </Box>
      <Box sx={noPad ? {} : { px: 2.5, py: 2 }}>{children}</Box>
    </Box>
  );
}

function AlertBand({ type = 'info', message, onAction, actionLabel }) {
  const themes = {
    info:    { bg: '#EFF6FF', border: '#BFDBFE', icon: ACCENT,    text: '#1E40AF', Icon: InfoOutlinedIcon    },
    warning: { bg: '#FFFBEB', border: '#FDE68A', icon: '#D97706', text: '#92400E', Icon: WarningAmberIcon    },
    success: { bg: '#ECFDF5', border: '#A7F3D0', icon: '#059669', text: '#065F46', Icon: CheckCircleOutlineIcon },
  };
  const t = themes[type];
  return (
    <Box sx={{
      bgcolor: t.bg, border: `1px solid ${t.border}`, borderRadius: '8px',
      px: 2, py: 1.25, mb: 2, display: 'flex', alignItems: 'center', gap: 1.5,
    }}>
      <t.Icon sx={{ color: t.icon, fontSize: 16, flexShrink: 0 }} />
      <Typography fontSize={13} sx={{ flex: 1, color: t.text }}>{message}</Typography>
      {onAction && (
        <Button size="small" onClick={onAction}
          sx={{ fontSize: 12, py: 0.3, color: t.icon, whiteSpace: 'nowrap', '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' }, flexShrink: 0 }}>
          {actionLabel}
        </Button>
      )}
    </Box>
  );
}

function ActivityRow({ p, onClick }) {
  const est = ESTADO[p.estado] ?? ESTADO.Borrador;
  return (
    <Box sx={{ px: 2.5, py: 1.25, display: 'flex', alignItems: 'center', gap: 2,
      cursor: 'pointer', '&:hover': { bgcolor: '#F8FAFC' } }} onClick={onClick}>
      <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: est.dot, flexShrink: 0 }} />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography fontSize={13} fontWeight={500} color="text.primary" noWrap>{p.titulo}</Typography>
        <Typography fontSize={11.5} color="text.secondary">
          {[p.canton, p.provincia].filter(Boolean).join(', ') || 'Sin ubicación'}
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexShrink: 0 }}>
        <Chip label={est.label} size="small" sx={{ bgcolor: est.bg, color: est.color, fontWeight: 500, fontSize: 11 }} />
        <Typography fontSize={11} color="#9CA3AF" sx={{ minWidth: 52, textAlign: 'right' }}>
          {timeAgo(p.fechaPublicacion ?? p.fechaCreacion)}
        </Typography>
      </Box>
    </Box>
  );
}

function PendingItem({ color, title, sub, icon: Icon, onClick }) {
  return (
    <Box sx={{ px: 2.5, py: 1.4, display: 'flex', alignItems: 'center', gap: 1.75,
      cursor: 'pointer', '&:hover': { bgcolor: '#F8FAFC' } }} onClick={onClick}>
      <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: color, flexShrink: 0, mt: 0.2 }} />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography fontSize={12.5} fontWeight={600} color="text.primary" noWrap>{title}</Typography>
        <Typography fontSize={11.5} color="text.secondary" noWrap>{sub}</Typography>
      </Box>
      <Icon sx={{ fontSize: 14, color: '#CBD5E1', flexShrink: 0 }} />
    </Box>
  );
}

// ── Bar chart ─────────────────────────────────────────────────────────────────

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <Box sx={{
      bgcolor: '#fff', border: '1px solid #E2E8F0',
      borderRadius: '8px', px: 1.5, py: 1,
      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    }}>
      <Typography fontSize={12} fontWeight={600} color="text.primary">{label}</Typography>
      <Typography fontSize={13} fontWeight={700} color="text.primary">{payload[0].value}</Typography>
    </Box>
  );
};

function StatusBarChart({ data, title }) {
  return (
    <Panel title={title}>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11, fill: '#94A3B8' }}
            axisLine={false} tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#94A3B8' }}
            axisLine={false} tickLine={false}
            allowDecimals={false}
          />
          <ChartTooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {data.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Panel>
  );
}

// ── Actividad reciente widget ─────────────────────────────────────────────────

const TIPO_EMOJI = {
  nueva_propuesta: '📋', propuesta_aceptada: '✅', propuesta_rechazada: '❌',
  proyecto_creado: '🏗️', proyecto_asignado: '👷', proyecto_finalizado: '🏆',
  fase_iniciada: '▶️', fase_completada: '✅', fase_atrasada: '⏰',
  avance_registrado: '📸', foto_subida: '🖼️',
  factura_creada: '🧾', factura_enviada: '📤', factura_vencida: '⚠️', pago_recibido: '💰',
  orden_creada: '📝', orden_aprobada: '✅', orden_rechazada: '❌',
  documento_agregado: '📄', documento_actualizado: '📄',
  nuevo_mensaje: '💬', mencion_directa: '@',
};

function ActividadRecienteWidget() {
  const navigate = useNavigate();
  const { notificaciones } = useNotificaciones();
  const recientes = notificaciones.slice(0, 5);

  return (
    <Panel
      title="Actividad reciente"
      action={
        <Button size="small" endIcon={<ArrowForwardIcon sx={{ fontSize: 11 }} />}
          onClick={() => navigate('/notificaciones')}
          sx={{ fontSize: 11, textTransform: 'none', color: ACCENT, py: 0 }}>
          Ver todo
        </Button>
      }
      noPad
    >
      {recientes.length === 0 ? (
        <Box sx={{ px: 2.5, py: 2.5, textAlign: 'center' }}>
          <Typography fontSize={12} color="text.secondary">Sin actividad reciente</Typography>
        </Box>
      ) : (
        recientes.map((n, i) => (
          <Box key={n.id}>
            {i > 0 && <Divider sx={{ mx: 2 }} />}
            <Box
              onClick={() => n.urlDestino && navigate(n.urlDestino)}
              sx={{
                px: 2, py: 1.25, display: 'flex', alignItems: 'flex-start', gap: 1.25,
                cursor: n.urlDestino ? 'pointer' : 'default',
                bgcolor: n.leida ? 'transparent' : '#F0F9FF',
                '&:hover': { bgcolor: n.urlDestino ? '#F8FAFC' : 'transparent' },
              }}
            >
              <Box sx={{
                fontSize: 14, width: 28, height: 28, borderRadius: '50%', bgcolor: '#F1F5F9',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                {TIPO_EMOJI[n.tipo] ?? '🔔'}
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontSize: 12, fontWeight: n.leida ? 400 : 600, color: '#0F172A',
                  overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                  {n.titulo}
                </Typography>
                <Typography sx={{ fontSize: 11, color: '#94A3B8' }}>
                  {new Date(n.fechaCreacion).toLocaleDateString('es-CR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </Typography>
              </Box>
              {!n.leida && <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#2563EB', flexShrink: 0, mt: 0.75 }} />}
            </Box>
          </Box>
        ))
      )}
    </Panel>
  );
}

// ── Cotizaciones IA widget ────────────────────────────────────────────────────

function CotizacionesIAWidget() {
  const navigate = useNavigate();
  const [items, setItems]   = useState([]);
  const [loading, setLoading] = useState(true);

  const PLAN_COLORS = {
    economico: { bg: '#F0FDF4', color: '#166534', label: 'Económico' },
    estandar:  { bg: '#EFF6FF', color: '#1D4ED8', label: 'Estándar'  },
    premium:   { bg: '#FDF4FF', color: '#7E22CE', label: 'Premium'   },
  };

  useEffect(() => {
    cotizacionIAApi.dashboard(5)
      .then(r => setItems(r.data))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  if (!loading && items.length === 0) return null;

  return (
    <Box sx={{ bgcolor: '#131929', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden' }}>
      <Box sx={{ px: 2, pt: 2, pb: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AutoAwesomeIcon sx={{ fontSize: 15, color: '#60A5FA' }} />
          <Typography fontSize={13} fontWeight={700} sx={{ color: '#fff' }}>Cotizaciones IA recientes</Typography>
        </Box>
        <Button size="small" onClick={() => navigate('/cotizaciones-ia')}
          sx={{ fontSize: 11, color: '#60A5FA', textTransform: 'none', p: 0, minWidth: 0 }}>
          Ver todas →
        </Button>
      </Box>
      <Box sx={{ px: 1.5, pb: 1.5 }}>
        {loading
          ? [1,2,3].map(i => (
              <Box key={i} sx={{ p: 1, borderRadius: 1 }}>
                <Skeleton variant="text" width="80%" sx={{ bgcolor: 'rgba(255,255,255,0.08)' }} />
                <Skeleton variant="text" width="50%" sx={{ bgcolor: 'rgba(255,255,255,0.05)' }} />
              </Box>
            ))
          : items.map((item, idx) => {
              const plan = PLAN_COLORS[item.plan] ?? PLAN_COLORS.estandar;
              return (
                <Box key={item.id}
                  onClick={() => navigate(`/cotizacion/${item.proyectoId}`)}
                  sx={{
                    px: 1, py: 1, borderRadius: 1, cursor: 'pointer',
                    borderBottom: idx < items.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.04)' },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                    <Typography fontSize={12.5} fontWeight={600} sx={{ color: 'rgba(255,255,255,0.82)' }} noWrap>
                      {item.proyectoTitulo}
                    </Typography>
                    <Chip label={plan.label} size="small" sx={{
                      bgcolor: plan.bg, color: plan.color, fontWeight: 700,
                      fontSize: 10, height: 18, borderRadius: '4px', flexShrink: 0,
                    }} />
                  </Box>
                  <Typography fontSize={11} sx={{ color: 'rgba(255,255,255,0.38)', mt: 0.2 }}>
                    {item.clienteNombre} · {(item.rangoMaximo ?? 0).toLocaleString('es-CR', { style: 'currency', currency: 'CRC', maximumFractionDigits: 0 })}
                  </Typography>
                </Box>
              );
            })
        }
      </Box>
    </Box>
  );
}

// ── Cronograma widget ─────────────────────────────────────────────────────────

function CronogramaWidget() {
  const navigate = useNavigate();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cronogramaApi.dashboard()
      .then(r => setData(r.data))
      .catch(() => setData({ proximas: [], atrasadas: [], completadas: [] }))
      .finally(() => setLoading(false));
  }, []);

  const fmtFecha = (s) => s ? new Date(s).toLocaleDateString('es-CR', { day: 'numeric', month: 'short' }) : '—';

  const proximas  = data?.proximas  ?? [];
  const atrasadas = data?.atrasadas ?? [];
  const todas     = [...atrasadas, ...proximas];

  if (loading) {
    return (
      <Panel title="Cronograma de fases">
        {[1,2,3].map(i => <Skeleton key={i} height={40} sx={{ mb: 0.5, mx: 2 }} />)}
      </Panel>
    );
  }
  if (todas.length === 0) return null;

  return (
    <Panel
      title="Estado de fases"
      action={
        <Button size="small" endIcon={<ArrowForwardIcon sx={{ fontSize: 11 }} />}
          onClick={() => navigate('/cronograma')}
          sx={{ fontSize: 11, textTransform: 'none', color: ACCENT, py: 0 }}>
          Ver cronograma
        </Button>
      }
      noPad
    >
      {atrasadas.length > 0 && (
        <Box sx={{ px: 2.5, pt: 1.5, pb: 0.5 }}>
          <Typography sx={{ fontSize: 10.5, fontWeight: 700, color: '#EF4444', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 0.75 }}>
            ⚠ Fases atrasadas ({atrasadas.length})
          </Typography>
          {atrasadas.slice(0, 3).map(f => (
            <Box key={f.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75, cursor: 'pointer', '&:hover': { opacity: 0.75 } }}
              onClick={() => navigate('/cronograma')}>
              <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: f.color ?? '#EF4444', flexShrink: 0 }} />
              <Typography fontSize={12} fontWeight={500} sx={{ flex: 1, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                {f.nombre}
              </Typography>
              <Chip label={fmtFecha(f.fechaFin)} size="small"
                sx={{ fontSize: 10, height: 18, bgcolor: '#FEE2E2', color: '#991B1B', '& .MuiChip-label': { px: 0.8 } }} />
            </Box>
          ))}
        </Box>
      )}
      {atrasadas.length > 0 && proximas.length > 0 && <Divider sx={{ my: 0.5 }} />}
      {proximas.length > 0 && (
        <Box sx={{ px: 2.5, pt: atrasadas.length > 0 ? 0.5 : 1.5, pb: 1.5 }}>
          <Typography sx={{ fontSize: 10.5, fontWeight: 700, color: '#D97706', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 0.75 }}>
            📅 Próximas 7 días ({proximas.length})
          </Typography>
          {proximas.slice(0, 3).map(f => (
            <Box key={f.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75, cursor: 'pointer', '&:hover': { opacity: 0.75 } }}
              onClick={() => navigate('/cronograma')}>
              <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: f.color ?? ACCENT, flexShrink: 0 }} />
              <Typography fontSize={12} fontWeight={500} sx={{ flex: 1, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                {f.nombre}
              </Typography>
              <Chip label={fmtFecha(f.fechaFin)} size="small"
                sx={{ fontSize: 10, height: 18, bgcolor: '#FEF9C3', color: '#854D0E', '& .MuiChip-label': { px: 0.8 } }} />
            </Box>
          ))}
        </Box>
      )}
      <Divider />
      <Box sx={{ px: 2.5, py: 1 }}>
        <Button fullWidth size="small" onClick={() => navigate('/cronograma')}
          sx={{ fontSize: 12, color: ACCENT, '&:hover': { bgcolor: '#EFF6FF' } }}>
          Ver cronograma completo →
        </Button>
      </Box>
    </Panel>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// DASHBOARD CLIENTE
// ═══════════════════════════════════════════════════════════════════════════════

function DashboardCliente({ usuario }) {
  const navigate = useNavigate();
  const [proyectos, setProyectos] = useState([]);
  const [loading, setLoading]     = useState(true);
  const nombre = usuario?.nombre?.split(' ')[0] ?? 'Usuario';

  useEffect(() => {
    proyectosApi.getMios()
      .then(r => setProyectos(r.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const activos      = proyectos.filter(p => ['Publicado','EnPropuestas','EnCurso'].includes(p.estado));
  const borradores   = proyectos.filter(p => p.estado === 'Borrador');
  const enPropuestas = proyectos.filter(p => p.estado === 'EnPropuestas');
  const enCurso      = proyectos.filter(p => p.estado === 'EnCurso');
  const completados  = proyectos.filter(p => p.estado === 'Completado');

  const recientes = [...proyectos]
    .sort((a, b) => new Date(b.fechaPublicacion ?? b.fechaCreacion ?? 0) - new Date(a.fechaPublicacion ?? a.fechaCreacion ?? 0))
    .slice(0, 6);

  const chartData = [
    { name: 'Borrador',    count: borradores.length,   fill: '#94A3B8' },
    { name: 'Publicado',   count: proyectos.filter(p => p.estado === 'Publicado').length, fill: '#22C55E' },
    { name: 'Propuestas',  count: enPropuestas.length, fill: '#F59E0B' },
    { name: 'En curso',    count: enCurso.length,      fill: '#3B82F6' },
    { name: 'Completado',  count: completados.length,  fill: '#10B981' },
  ];

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ mb: 0.3, fontWeight: 800 }}>Panel de proyectos</Typography>
          <Typography variant="body2" color="text.secondary">
            {greeting()}, <strong>{nombre}</strong> &middot;{' '}
            {new Date().toLocaleDateString('es-CR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/publicar')} sx={{ flexShrink: 0 }}>
          Nuevo proyecto
        </Button>
      </Box>

      {/* Alerts */}
      {!loading && enPropuestas.length > 0 && (
        <AlertBand type="info"
          message={`Tenés ${enPropuestas.length} proyecto${enPropuestas.length > 1 ? 's' : ''} con propuestas pendientes de revisión.`}
          onAction={() => navigate('/mis-proyectos')} actionLabel="Revisar ahora →" />
      )}
      {!loading && borradores.length > 0 && (
        <AlertBand type="warning"
          message={`${borradores.length} proyecto${borradores.length > 1 ? 's' : ''} en borrador sin publicar.`}
          onAction={() => navigate('/mis-proyectos')} actionLabel="Ver borradores →" />
      )}

      {/* Stats */}
      {loading ? (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1.5, mb: 3 }}>
          {[1,2,3,4].map(i => <Skeleton key={i} height={110} variant="rounded" sx={{ borderRadius: '12px' }} />)}
        </Box>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' }, gap: 1.5, mb: 3 }}>
          <StatCard label="Total proyectos"  value={proyectos.length}    icon={FolderOpenIcon}   iconBg="#EFF6FF"  iconColor={ACCENT}    onClick={() => navigate('/mis-proyectos')} />
          <StatCard label="En propuestas"    value={enPropuestas.length} icon={SendIcon}          iconBg="#FFFBEB"  iconColor="#D97706"   sub={enPropuestas.length > 0 ? 'Pendientes de revisión' : undefined} onClick={() => navigate('/mis-proyectos')} />
          <StatCard label="En ejecución"     value={enCurso.length}      icon={ConstructionIcon}  iconBg="#ECFDF5"  iconColor="#16A34A"   onClick={() => navigate('/mis-proyectos')} />
          <StatCard label="Completados"      value={completados.length}  icon={CheckCircleIcon}   iconBg="#F1F5F9"  iconColor="#64748B"   onClick={() => navigate('/mis-proyectos')} />
        </Box>
      )}

      {/* Chart + main grid */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 300px' }, gap: 2 }}>

        {/* LEFT */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

          {/* Bar chart */}
          {!loading && proyectos.length > 0 && (
            <StatusBarChart data={chartData} title="Distribución por estado" />
          )}

          {/* Active projects */}
          <Panel
            title={`Proyectos activos (${activos.length})`}
            noPad
            action={
              <Button size="small" endIcon={<ArrowForwardIcon sx={{ fontSize: 13 }} />}
                onClick={() => navigate('/mis-proyectos')}
                sx={{ fontSize: 12, color: 'text.secondary', py: 0.3 }}>
                Ver todos
              </Button>
            }
          >
            {loading ? (
              <Box sx={{ p: 2.5 }}>{[1,2,3].map(i => <Skeleton key={i} height={44} sx={{ mb: 0.5 }} />)}</Box>
            ) : activos.length === 0 ? (
              <Box sx={{ py: 6, textAlign: 'center', px: 2 }}>
                <FolderOpenIcon sx={{ fontSize: 32, color: '#CBD5E1', mb: 1 }} />
                <Typography fontSize={13} color="text.secondary" sx={{ mb: 2 }}>
                  No hay proyectos activos. Publicá uno para recibir propuestas.
                </Typography>
                <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={() => navigate('/publicar')}>
                  Publicar proyecto
                </Button>
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Proyecto</TableCell>
                      <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Ubicación</TableCell>
                      <TableCell>Estado</TableCell>
                      <TableCell align="right" />
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {activos.map(p => {
                      const est = ESTADO[p.estado] ?? ESTADO.Borrador;
                      return (
                        <TableRow key={p.id} sx={{ cursor: 'pointer' }} onClick={() => navigate('/mis-proyectos')}>
                          <TableCell>
                            <Typography fontSize={13} fontWeight={500}>{p.titulo}</Typography>
                            {p.presupuestoMax && (
                              <Typography fontSize={11.5} color="text.secondary">
                                ₡{(p.presupuestoMax / 1e6).toFixed(1)}M
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                            <Typography fontSize={12.5} color="text.secondary">
                              {[p.canton, p.provincia].filter(Boolean).join(', ') || '—'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip label={est.label} size="small" sx={{ bgcolor: est.bg, color: est.color, fontWeight: 500 }} />
                          </TableCell>
                          <TableCell align="right">
                            <Box sx={{ display: 'flex', gap: 0.25, justifyContent: 'flex-end' }}>
                              <Tooltip title="Cotización IA">
                                <IconButton size="small"
                                  onClick={e => { e.stopPropagation(); navigate(`/cotizacion/${p.id}`); }}
                                  sx={{ color: '#CBD5E1', '&:hover': { color: ACCENT, bgcolor: '#EFF6FF' } }}>
                                  <AutoAwesomeIcon sx={{ fontSize: 15 }} />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Propuestas">
                                <IconButton size="small"
                                  onClick={e => { e.stopPropagation(); navigate(`/propuestas/${p.id}`); }}
                                  sx={{ color: '#CBD5E1', '&:hover': { color: ACCENT, bgcolor: '#EFF6FF' } }}>
                                  <SendIcon sx={{ fontSize: 15 }} />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Panel>

          {/* Activity feed */}
          {!loading && recientes.length > 0 && (
            <Panel title="Actividad reciente" noPad
              action={
                <Button size="small" endIcon={<ArrowForwardIcon sx={{ fontSize: 13 }} />}
                  onClick={() => navigate('/mis-proyectos')} sx={{ fontSize: 12, color: 'text.secondary', py: 0.3 }}>
                  Ver proyectos
                </Button>
              }
            >
              {recientes.map((p, i) => (
                <Box key={p.id}>
                  {i > 0 && <Divider sx={{ mx: 2.5 }} />}
                  <ActivityRow p={p} onClick={() => navigate('/mis-proyectos')} />
                </Box>
              ))}
            </Panel>
          )}
        </Box>

        {/* RIGHT */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

          {/* Pending actions */}
          <Panel title="Acciones pendientes" noPad>
            {loading ? (
              <Box sx={{ p: 2 }}>{[1,2].map(i => <Skeleton key={i} height={40} sx={{ mb: 0.5 }} />)}</Box>
            ) : borradores.length === 0 && enPropuestas.length === 0 ? (
              <Box sx={{ px: 2.5, py: 3, textAlign: 'center' }}>
                <CheckCircleOutlineIcon sx={{ fontSize: 26, color: '#10B981', mb: 0.5 }} />
                <Typography fontSize={12.5} color="text.secondary">Todo al día — sin acciones pendientes</Typography>
              </Box>
            ) : (
              <Box>
                {enPropuestas.slice(0, 3).map((p, i) => (
                  <Box key={p.id}>
                    {i > 0 && <Divider sx={{ mx: 2.5 }} />}
                    <PendingItem color="#D97706" icon={SendIcon}
                      title="Revisar propuestas" sub={p.titulo}
                      onClick={() => navigate(`/propuestas/${p.id}`)} />
                  </Box>
                ))}
                {borradores.slice(0, 2).map((p, i) => (
                  <Box key={p.id}>
                    <Divider sx={{ mx: 2.5 }} />
                    <PendingItem color="#64748B" icon={PublishIcon}
                      title="Publicar proyecto" sub={p.titulo}
                      onClick={() => navigate('/mis-proyectos')} />
                  </Box>
                ))}
              </Box>
            )}
          </Panel>

          {/* Status breakdown */}
          <Panel title="Resumen por estado" noPad>
            {[
              { key: 'Publicado',    label: 'Publicados',    count: proyectos.filter(p => p.estado === 'Publicado').length },
              { key: 'EnPropuestas', label: 'En propuestas', count: enPropuestas.length },
              { key: 'EnCurso',      label: 'En ejecución',  count: enCurso.length },
              { key: 'Borrador',     label: 'Borradores',    count: borradores.length },
              { key: 'Completado',   label: 'Completados',   count: completados.length },
            ].map((item, i) => {
              const est = ESTADO[item.key];
              return (
                <Box key={item.key}>
                  {i > 0 && <Divider sx={{ mx: 2.5 }} />}
                  <Box sx={{ px: 2.5, py: 1.1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                      <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: est?.dot }} />
                      <Typography fontSize={12.5} color="text.secondary">{item.label}</Typography>
                    </Box>
                    <Typography fontSize={13} fontWeight={600} color="text.primary">{loading ? '—' : item.count}</Typography>
                  </Box>
                </Box>
              );
            })}
            <Divider />
            <Box sx={{ px: 2.5, py: 1.1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography fontSize={12.5} fontWeight={600} color="text.primary">Total</Typography>
              <Typography fontSize={13} fontWeight={700} color="text.primary">{loading ? '—' : proyectos.length}</Typography>
            </Box>
          </Panel>

          <ActividadRecienteWidget />
          <CotizacionesIAWidget />

          {/* Marketplace CTA */}
          <Box sx={{ bgcolor: '#1E3A5F', borderRadius: '12px', p: 2.5, border: '1px solid rgba(37,99,235,0.2)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <StorefrontIcon sx={{ color: '#60A5FA', fontSize: 16 }} />
              <Typography fontSize={13} fontWeight={700} sx={{ color: '#fff' }}>Encontrá constructores</Typography>
            </Box>
            <Typography fontSize={12.5} sx={{ color: 'rgba(255,255,255,0.6)', mb: 2, lineHeight: 1.5 }}>
              Conectate con profesionales verificados en tu zona y recibí propuestas reales.
            </Typography>
            <Button fullWidth size="small" onClick={() => navigate('/marketplace')}
              sx={{ bgcolor: ACCENT, color: '#fff', fontSize: 12.5, fontWeight: 600, '&:hover': { bgcolor: '#1D4ED8' } }}>
              Explorar marketplace
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// DASHBOARD CONSTRUCTOR
// ═══════════════════════════════════════════════════════════════════════════════

function DashboardConstructor({ usuario }) {
  const navigate = useNavigate();
  const [propuestas, setPropuestas] = useState([]);
  const [facturas,   setFacturas]   = useState([]);
  const [dashData,   setDashData]   = useState(null);
  const [loading, setLoading]       = useState(true);
  const nombre = usuario?.nombre?.split(' ')[0] ?? 'Constructor';

  useEffect(() => {
    Promise.all([
      propuestasApi.getMias().then(r => setPropuestas(r.data ?? [])).catch(() => {}),
      facturasApi.getMias().then(r => setFacturas(r.data ?? [])).catch(() => {}),
      constructorApi.dashboard().then(r => setDashData(r.data)).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  const obrasActivas = (dashData?.clientes ?? []).flatMap(c =>
    (c.proyectos ?? [])
      .filter(p => p.estadoPropuesta === 'Aceptada')
      .map(p => ({ ...p, clienteNombre: c.clienteNombre }))
  );
  const atrasadas = obrasActivas.filter(o => (o.diasRestantes ?? 0) < 0);

  const cobrado        = facturas.filter(f => f.estado === 'Pagada').reduce((s, f) => s + (f.monto ?? 0), 0);
  const pendiente      = facturas.filter(f => ['Pendiente','Emitida'].includes(f.estado)).reduce((s, f) => s + (f.monto ?? 0), 0);
  const totalFacturado = facturas.filter(f => f.estado !== 'Cancelada').reduce((s, f) => s + (f.monto ?? 0), 0);

  const pipeline   = propuestas.filter(p => ['Enviada','Vista'].includes(p.estado));
  const aceptadas  = propuestas.filter(p => p.estado === 'Aceptada');
  const rechazadas = propuestas.filter(p => p.estado === 'Rechazada');
  const winRate    = propuestas.length > 0 ? Math.round((aceptadas.length / propuestas.length) * 100) : 0;

  const fmt = (v) => {
    if (!v) return '₡0';
    if (v >= 1e6) return `₡${(v / 1e6).toFixed(1)}M`;
    if (v >= 1e3) return `₡${(v / 1e3).toFixed(0)}K`;
    return `₡${v}`;
  };

  const diasBadge = (dias) => {
    if ((dias ?? 0) < 0)  return { bg: '#FEF2F2', border: '#FECACA', color: '#DC2626', label: `${Math.abs(dias)}d vencido` };
    if ((dias ?? 0) <= 7) return { bg: '#FFFBEB', border: '#FDE68A', color: '#D97706', label: `${dias}d restantes` };
    return { bg: '#ECFDF5', border: '#A7F3D0', color: '#059669', label: `${dias}d restantes` };
  };

  const obraProgress = (o) => {
    const total = (o.diasTranscurridos ?? 0) + Math.max(0, o.diasRestantes ?? 0);
    if (!total) return 0;
    return Math.min(100, Math.round(((o.diasTranscurridos ?? 0) / total) * 100));
  };

  const chartData = [
    { name: 'Enviadas',   count: propuestas.length, fill: '#94A3B8' },
    { name: 'En revisión', count: pipeline.length,   fill: '#3B82F6' },
    { name: 'Aceptadas',  count: aceptadas.length,  fill: '#10B981' },
    { name: 'Rechazadas', count: rechazadas.length,  fill: '#EF4444' },
  ];

  const TH = ({ children, hide }) => (
    <TableCell sx={{
      fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase',
      letterSpacing: '0.06em', py: 1.25, borderBottom: '1px solid #F1F5F9',
      display: hide ? { xs: 'none', [hide]: 'table-cell' } : undefined,
    }}>
      {children}
    </TableCell>
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 1 }}>
        <Box>
          <Typography variant="h5" sx={{ mb: 0.3, fontWeight: 800 }}>Panel de trabajo</Typography>
          <Typography variant="body2" color="text.secondary">
            {greeting()}, <strong>{nombre}</strong> &middot;{' '}
            {new Date().toLocaleDateString('es-CR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" size="small" startIcon={<StorefrontIcon sx={{ fontSize: 14 }} />}
            onClick={() => navigate('/marketplace')} sx={{ fontSize: 12.5 }}>
            Marketplace
          </Button>
          <Button variant="contained" size="small" startIcon={<AddIcon sx={{ fontSize: 14 }} />}
            onClick={() => navigate('/mis-propuestas')} sx={{ fontSize: 12.5 }}>
            Nueva propuesta
          </Button>
        </Box>
      </Box>

      {!loading && atrasadas.length > 0 && (
        <AlertBand type="warning"
          message={`${atrasadas.length} obra${atrasadas.length > 1 ? 's' : ''} con retraso: ${atrasadas.map(o => o.proyectoTitulo).join(', ')}.`}
          onAction={() => navigate('/mis-clientes')} actionLabel="Ver obras →" />
      )}
      {!loading && pipeline.length > 0 && (
        <AlertBand type="info"
          message={`${pipeline.length} propuesta${pipeline.length > 1 ? 's' : ''} esperando respuesta del cliente.`}
          onAction={() => navigate('/mis-propuestas')} actionLabel="Ver propuestas →" />
      )}

      {loading ? (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 1.5, mb: 3 }}>
          {[1,2,3,4].map(i => <Skeleton key={i} height={110} variant="rounded" sx={{ borderRadius: '12px' }} />)}
        </Box>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2,1fr)', sm: 'repeat(4,1fr)' }, gap: 1.5, mb: 3 }}>
          <StatCard label="Obras activas"   value={obrasActivas.length}   icon={ConstructionIcon}        iconBg="#EFF6FF"  iconColor={ACCENT}    sub={atrasadas.length > 0 ? `⚠ ${atrasadas.length} con retraso` : 'Al día'} onClick={() => navigate('/mis-clientes')} />
          <StatCard label="Total facturado" value={fmt(totalFacturado)}   icon={ReceiptIcon}             iconBg="#ECFDF5"  iconColor="#16A34A"   sub={`${facturas.filter(f=>f.estado!=='Cancelada').length} facturas`} onClick={() => navigate('/facturacion')} />
          <StatCard label="Por cobrar"      value={fmt(pendiente)}        icon={AccountBalanceWalletIcon} iconBg="#FFFBEB"  iconColor="#D97706"   sub={pendiente > 0 ? 'Pendiente de pago' : 'Sin pendientes'} />
          <StatCard label="Pipeline activo" value={pipeline.length}       icon={TrendingUpIcon}           iconBg="#F5F3FF"  iconColor="#7C3AED"   sub={`${winRate}% tasa de éxito`} onClick={() => navigate('/mis-propuestas')} />
        </Box>
      )}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 284px' }, gap: 2 }}>

        {/* LEFT */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

          {/* Chart */}
          {!loading && <StatusBarChart data={chartData} title="Pipeline de propuestas" />}

          {/* Obras */}
          <Panel
            title={`Obras en ejecución (${obrasActivas.length})`}
            noPad
            action={
              <Button size="small" endIcon={<ArrowForwardIcon sx={{ fontSize: 13 }} />}
                onClick={() => navigate('/mis-clientes')} sx={{ fontSize: 12, color: 'text.secondary', py: 0.3 }}>
                Mis clientes
              </Button>
            }
          >
            {loading ? (
              <Box sx={{ p: 2.5 }}>{[1,2,3].map(i => <Skeleton key={i} height={56} sx={{ mb: 0.75 }} />)}</Box>
            ) : obrasActivas.length === 0 ? (
              <Box sx={{ py: 6, textAlign: 'center', px: 2 }}>
                <ConstructionIcon sx={{ fontSize: 32, color: '#CBD5E1', mb: 1 }} />
                <Typography fontSize={13} color="text.secondary" sx={{ mb: 2 }}>
                  No hay obras activas. Explorá el marketplace para encontrar proyectos.
                </Typography>
                <Button size="small" variant="outlined" startIcon={<StorefrontIcon />}
                  onClick={() => navigate('/marketplace')}>
                  Ver proyectos disponibles
                </Button>
              </Box>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TH>Proyecto / Cliente</TH>
                      <TH hide="md">Avance</TH>
                      <TH>Plazo</TH>
                      <TH hide="sm">Monto</TH>
                      <TableCell sx={{ borderBottom: '1px solid #F1F5F9' }} />
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {obrasActivas.map(o => {
                      const prog  = obraProgress(o);
                      const badge = diasBadge(o.diasRestantes ?? 0);
                      const late  = (o.diasRestantes ?? 0) < 0;
                      return (
                        <TableRow key={`${o.propuestaId}-${o.proyectoId}`}
                          sx={{ cursor: 'pointer', '&:hover': { bgcolor: '#F8FAFC' } }}
                          onClick={() => navigate(`/obra/${o.proyectoId}`)}>
                          <TableCell sx={{ py: 1.5 }}>
                            <Typography fontSize={13} fontWeight={600} color="text.primary" noWrap sx={{ maxWidth: 220 }}>
                              {o.proyectoTitulo}
                            </Typography>
                            <Typography fontSize={11.5} color="text.secondary">{o.clienteNombre}</Typography>
                          </TableCell>
                          <TableCell sx={{ display: { xs: 'none', md: 'table-cell' }, minWidth: 130 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <LinearProgress variant="determinate" value={prog}
                                sx={{ flex: 1, height: 5, borderRadius: 3, bgcolor: '#E5E7EB',
                                  '& .MuiLinearProgress-bar': { bgcolor: late ? '#DC2626' : ACCENT, borderRadius: 3 } }} />
                              <Typography fontSize={11} fontWeight={600} color="text.secondary" sx={{ minWidth: 28, textAlign: 'right' }}>
                                {prog}%
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5,
                              bgcolor: badge.bg, border: `1px solid ${badge.border}`,
                              borderRadius: '5px', px: 0.9, py: 0.25 }}>
                              <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: badge.color, flexShrink: 0 }} />
                              <Typography fontSize={11} fontWeight={600} sx={{ color: badge.color, whiteSpace: 'nowrap' }}>
                                {badge.label}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                            <Typography fontSize={12.5} fontWeight={700} color="text.primary">{fmt(o.montoTotal)}</Typography>
                          </TableCell>
                          <TableCell align="right" sx={{ pr: 1.5 }}>
                            <Tooltip title="Ver obra">
                              <IconButton size="small"
                                sx={{ color: '#CBD5E1', '&:hover': { color: ACCENT, bgcolor: '#EFF6FF' } }}>
                                <ArrowForwardIcon sx={{ fontSize: 14 }} />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Panel>
        </Box>

        {/* RIGHT */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

          {/* Financial summary */}
          <Panel title="Resumen financiero" noPad>
            {loading ? (
              <Box sx={{ p: 2 }}>{[1,2,3].map(i => <Skeleton key={i} height={36} sx={{ mb: 0.5 }} />)}</Box>
            ) : (
              <Box>
                {[
                  { label: 'Cobrado',        value: cobrado,        color: '#059669', dot: '#10B981' },
                  { label: 'Por cobrar',      value: pendiente,      color: '#D97706', dot: '#F59E0B' },
                  { label: 'Total facturado', value: totalFacturado, color: 'text.primary', dot: ACCENT },
                ].map((item, i) => (
                  <Box key={item.label}>
                    {i > 0 && <Divider sx={{ mx: 2.5 }} />}
                    <Box sx={{ px: 2.5, py: 1.25, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: item.dot }} />
                        <Typography fontSize={12.5} color="text.secondary">{item.label}</Typography>
                      </Box>
                      <Typography fontSize={13} fontWeight={700} sx={{ color: item.color }}>{fmt(item.value)}</Typography>
                    </Box>
                  </Box>
                ))}
                <Divider />
                <Box sx={{ px: 2.5, py: 1 }}>
                  <Button fullWidth size="small" onClick={() => navigate('/facturacion')}
                    sx={{ fontSize: 12, color: ACCENT, '&:hover': { bgcolor: '#EFF6FF' } }}>
                    Ver facturación →
                  </Button>
                </Box>
              </Box>
            )}
          </Panel>

          {/* Pipeline */}
          <Panel title="Pipeline de propuestas" noPad>
            {loading ? (
              <Box sx={{ p: 2 }}>{[1,2,3,4].map(i => <Skeleton key={i} height={32} sx={{ mb: 0.5 }} />)}</Box>
            ) : (
              <Box>
                {[
                  { label: 'Total enviadas', value: propuestas.length,  dot: '#94A3B8' },
                  { label: 'En revisión',    value: pipeline.length,    dot: '#3B82F6' },
                  { label: 'Aceptadas',      value: aceptadas.length,   dot: '#10B981' },
                  { label: 'Rechazadas',     value: rechazadas.length,  dot: '#EF4444' },
                ].map((s, i) => (
                  <Box key={s.label}>
                    {i > 0 && <Divider sx={{ mx: 2.5 }} />}
                    <Box sx={{ px: 2.5, py: 1.1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: s.dot }} />
                        <Typography fontSize={12.5} color="text.secondary">{s.label}</Typography>
                      </Box>
                      <Typography fontSize={13} fontWeight={700} color="text.primary">{s.value}</Typography>
                    </Box>
                  </Box>
                ))}
                <Divider sx={{ mx: 2.5 }} />
                <Box sx={{ px: 2.5, py: 1.25 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography fontSize={12.5} fontWeight={600} color="text.secondary">Tasa de éxito</Typography>
                    <Chip label={`${winRate}%`} size="small"
                      sx={{ bgcolor: winRate >= 50 ? '#DCFCE7' : '#FEE2E2',
                        color: winRate >= 50 ? '#166534' : '#991B1B', fontWeight: 700, fontSize: 12 }} />
                  </Box>
                </Box>
                <Divider />
                <Box sx={{ px: 2.5, py: 1 }}>
                  <Button fullWidth size="small" onClick={() => navigate('/mis-propuestas')}
                    sx={{ fontSize: 12, color: ACCENT, '&:hover': { bgcolor: '#EFF6FF' } }}>
                    Ver propuestas →
                  </Button>
                </Box>
              </Box>
            )}
          </Panel>

          <CronogramaWidget />
          <CotizacionesIAWidget />

          <Box sx={{ bgcolor: '#1E3A5F', borderRadius: '12px', p: 2.5, border: '1px solid rgba(37,99,235,0.2)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <StorefrontIcon sx={{ color: '#60A5FA', fontSize: 16 }} />
              <Typography fontSize={13} fontWeight={700} sx={{ color: '#fff' }}>Proyectos disponibles</Typography>
            </Box>
            <Typography fontSize={12} sx={{ color: 'rgba(255,255,255,0.55)', mb: 2, lineHeight: 1.5 }}>
              Encontrá proyectos que se ajusten a tu especialidad y zona.
            </Typography>
            <Button fullWidth size="small" onClick={() => navigate('/marketplace')}
              sx={{ bgcolor: ACCENT, color: '#fff', fontSize: 12.5, fontWeight: 600, '&:hover': { bgcolor: '#1D4ED8' } }}>
              Explorar marketplace
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// DASHBOARD ADMIN
// ═══════════════════════════════════════════════════════════════════════════════

const ROL_OPTIONS = ['Cliente','Constructor','Proveedor','Admin','Supervisor','MaestroObra','Arquitecto','Ingeniero','Contador'];

function SolicitudRow({ s, onAprobar, onRechazar, actioning }) {
  const [rol, setRol] = useState(s.rol ?? 'Cliente');
  const dias = s.createdAt ? Math.floor((Date.now() - new Date(s.createdAt)) / 86400000) : null;
  const cuandoStr = dias === 0 ? 'hoy' : dias === 1 ? 'ayer' : dias != null ? `${dias}d` : '—';

  return (
    <Box sx={{
      display: 'flex', alignItems: 'center', gap: 2,
      py: 1.75,
      borderBottom: '1px solid #F8FAFC',
      '&:last-child': { borderBottom: 'none' },
    }}>
      <Avatar sx={{ width: 32, height: 32, bgcolor: '#1B3B7A', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
        {s.nombre?.charAt(0).toUpperCase()}
      </Avatar>

      <Box sx={{ minWidth: 0, flex: '0 0 155px' }}>
        <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#0F172A', lineHeight: 1.3 }} noWrap>{s.nombre}</Typography>
        <Typography sx={{ fontSize: 11.5, color: '#94A3B8' }} noWrap>{s.email}</Typography>
      </Box>

      <Typography sx={{ fontSize: 12.5, color: '#94A3B8', flex: 1, minWidth: 0, fontStyle: s.motivoRegistro ? 'italic' : 'normal' }} noWrap>
        {s.motivoRegistro || '—'}
      </Typography>

      <Box sx={{ flexShrink: 0, textAlign: 'right', minWidth: 44 }}>
        <Typography sx={{ fontSize: 11.5, color: '#CBD5E1' }}>{cuandoStr}</Typography>
        {!s.emailConfirmed && (
          <Typography sx={{ fontSize: 9.5, color: '#F59E0B', fontWeight: 700, letterSpacing: '0.4px' }}>SIN VERIFICAR</Typography>
        )}
      </Box>

      <Box
        component="select"
        value={rol}
        onChange={e => setRol(e.target.value)}
        sx={{
          flexShrink: 0, fontSize: 12, fontWeight: 500,
          border: '1px solid #E2E8F0', borderRadius: '6px',
          px: 1, py: 0.5, bgcolor: '#F8FAFC', color: '#334155',
          outline: 'none', cursor: 'pointer',
          '&:focus': { borderColor: ACCENT },
        }}
      >
        {ROL_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
      </Box>

      <Button
        size="small"
        disabled={actioning}
        onClick={() => onAprobar(s.id, rol)}
        sx={{
          flexShrink: 0, fontSize: 12, fontWeight: 700,
          bgcolor: '#DCFCE7', color: '#166534', borderRadius: '6px',
          px: 1.5, py: 0.5, minWidth: 0,
          '&:hover': { bgcolor: '#BBF7D0' },
          '&.Mui-disabled': { opacity: 0.4 },
        }}
      >
        Aprobar
      </Button>

      <IconButton
        size="small"
        disabled={actioning}
        onClick={() => onRechazar(s.id)}
        sx={{ flexShrink: 0, color: '#CBD5E1', p: 0.5, '&:hover': { color: '#EF4444', bgcolor: 'rgba(239,68,68,0.06)' } }}
      >
        <CloseIcon sx={{ fontSize: 16 }} />
      </IconButton>
    </Box>
  );
}

function DashboardAdmin() {
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const [stats,       setStats]       = useState(null);
  const [solicitudes, setSolicitudes] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingSol,   setLoadingSol]   = useState(true);
  const [actioning, setActioning] = useState(false);
  const nombre = usuario?.nombre?.split(' ')[0] ?? 'Admin';

  const fetchData = () => {
    adminApi.getStats()
      .then(r => setStats(r.data))
      .catch(() => {})
      .finally(() => setLoadingStats(false));

    adminApi.getSolicitudes()
      .then(r => setSolicitudes(r.data ?? []))
      .catch(() => setSolicitudes([]))
      .finally(() => setLoadingSol(false));
  };

  useEffect(() => { fetchData(); }, []);

  const handleAprobar = async (id, rol) => {
    setActioning(true);
    try {
      await adminApi.aprobarSolicitud(id, rol);
      setSolicitudes(prev => prev.filter(s => s.id !== id));
      setStats(prev => prev ? {
        ...prev,
        usuarios: {
          ...prev.usuarios,
          pendientes: (prev.usuarios.pendientes ?? 1) - 1,
          activos:    (prev.usuarios.activos    ?? 0) + 1,
        }
      } : prev);
    } catch {
      // silencioso
    } finally {
      setActioning(false);
    }
  };

  const handleRechazar = async (id) => {
    setActioning(true);
    try {
      await adminApi.rechazarSolicitud(id, 'Rechazado por administrador');
      setSolicitudes(prev => prev.filter(s => s.id !== id));
      setStats(prev => prev ? {
        ...prev,
        usuarios: { ...prev.usuarios, pendientes: (prev.usuarios.pendientes ?? 1) - 1 }
      } : prev);
    } catch {
      // silencioso
    } finally {
      setActioning(false);
    }
  };

  const u = stats?.usuarios ?? {};
  const loading = loadingStats;
  const pct = u.total ? Math.round((u.activos / u.total) * 100) : 0;

  const chartData = [
    { name: 'Activos',    count: u.activos       ?? 0, fill: '#10B981' },
    { name: 'Bloqueados', count: u.bloqueados    ?? 0, fill: '#EF4444' },
    { name: 'Nuevos 30d', count: u.nuevosEste30d ?? 0, fill: '#F59E0B' },
    { name: 'Pendientes', count: u.pendientes    ?? 0, fill: '#F59E0B' },
  ];

  return (
    <Box>
      {/* ── HERO ── dark full-bleed banner */}
      <Box sx={{
        bgcolor: '#0F172A',
        mx: { xs: -2, sm: -3 },
        mt: -3,
        px: { xs: 2, sm: 3 },
        pt: 3, pb: 3.5,
        mb: 3.5,
      }}>
        <Typography sx={{ color: '#334155', fontSize: 11.5, letterSpacing: '0.3px', mb: 1.5 }}>
          {new Date().toLocaleDateString('es-CR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, mb: 3 }}>
          <Box>
            <Typography sx={{ color: '#94A3B8', fontSize: 13, mb: 0.4 }}>
              {greeting()}, {nombre}
            </Typography>
            <Typography sx={{ color: '#F8FAFC', fontSize: 28, fontWeight: 800, letterSpacing: '-0.5px', lineHeight: 1.1 }}>
              Administración
              {!loadingSol && solicitudes.length > 0 && (
                <Box component="span" sx={{
                  ml: 2, fontSize: 12, fontWeight: 700, px: 1, py: 0.3,
                  bgcolor: '#F59E0B', color: '#0F172A', borderRadius: '5px',
                  verticalAlign: 'middle',
                }}>
                  {solicitudes.length} pendiente{solicitudes.length > 1 ? 's' : ''}
                </Box>
              )}
            </Typography>
          </Box>
          <Button
            onClick={() => navigate('/admin')}
            sx={{
              flexShrink: 0, fontSize: 12, color: '#94A3B8', mt: 0.5,
              border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px',
              px: 2, py: 0.75, textTransform: 'none',
              '&:hover': { borderColor: 'rgba(255,255,255,0.2)', color: '#F8FAFC', bgcolor: 'transparent' },
            }}
          >
            Gestionar usuarios
          </Button>
        </Box>

        {/* Inline stat strip */}
        <Box sx={{
          display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' },
          borderTop: '1px solid rgba(255,255,255,0.06)', pt: 2.5,
        }}>
          {[
            { label: 'TOTAL',      value: u.total,          note: 'usuarios',          color: '#F8FAFC' },
            { label: 'ACTIVOS',    value: u.activos,        note: `${pct}% del total`, color: '#34D399' },
            { label: 'PENDIENTES', value: u.pendientes,     note: 'esperan revisión',  color: (u.pendientes ?? 0) > 0 ? '#FCD34D' : '#475569' },
            { label: 'NUEVOS 30D', value: u.nuevosEste30d,  note: 'últimos 30 días',   color: '#F8FAFC' },
          ].map(({ label, value, note, color }, i) => (
            <Box key={label} sx={{
              pl: i > 0 ? { xs: 0, sm: 2.5 } : 0,
              borderLeft: i > 0 ? { xs: 'none', sm: '1px solid rgba(255,255,255,0.06)' } : 'none',
              mb: { xs: 1.5, sm: 0 },
            }}>
              <Typography sx={{ color: '#475569', fontSize: 10, fontWeight: 600, letterSpacing: '0.8px', mb: 0.75, textTransform: 'uppercase' }}>
                {label}
              </Typography>
              {loading
                ? <Skeleton width={40} height={28} sx={{ bgcolor: 'rgba(255,255,255,0.08)' }} />
                : <Typography sx={{ color, fontSize: 26, fontWeight: 800, lineHeight: 1, letterSpacing: '-0.5px' }}>
                    {value ?? 0}
                  </Typography>
              }
              <Typography sx={{ color: '#334155', fontSize: 11, mt: 0.4 }}>{note}</Typography>
            </Box>
          ))}
        </Box>
      </Box>

      {/* ── COLA DE APROBACIONES ── */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.75 }}>
          <Typography sx={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>
            Cola de aprobaciones
          </Typography>
          {!loadingSol && solicitudes.length > 0 && (
            <Box sx={{
              width: 20, height: 20, borderRadius: '50%',
              bgcolor: '#FEF3C7', color: '#92400E',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700,
            }}>
              {solicitudes.length}
            </Box>
          )}
        </Box>

        <Box sx={{ bgcolor: '#fff', border: '1px solid #E2E8F0', borderRadius: '12px', overflow: 'hidden' }}>
          {loadingSol ? (
            <Box sx={{ px: 2.5, py: 1.5, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {[1, 2, 3].map(i => <Skeleton key={i} height={52} variant="rounded" sx={{ borderRadius: '8px' }} />)}
            </Box>
          ) : solicitudes.length === 0 ? (
            <Box sx={{ py: 6, textAlign: 'center' }}>
              <CheckCircleOutlineIcon sx={{ fontSize: 30, color: '#10B981', mb: 1 }} />
              <Typography fontSize={13.5} fontWeight={600} color="text.primary">Sin solicitudes pendientes</Typography>
              <Typography fontSize={12.5} color="text.secondary" sx={{ mt: 0.5 }}>
                Todas las solicitudes han sido procesadas.
              </Typography>
            </Box>
          ) : (
            <Box sx={{ px: 2.5 }}>
              {solicitudes.map(s => (
                <SolicitudRow
                  key={s.id}
                  s={s}
                  onAprobar={handleAprobar}
                  onRechazar={handleRechazar}
                  actioning={actioning}
                />
              ))}
            </Box>
          )}
        </Box>
      </Box>

      {/* ── CHART ── */}
      {!loading && (
        <StatusBarChart data={chartData} title="Distribución de usuarios" />
      )}
    </Box>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// DASHBOARD PROVEEDOR
// ═══════════════════════════════════════════════════════════════════════════════

function DashboardProveedor({ usuario }) {
  const navigate = useNavigate();
  const nombre   = usuario?.nombre?.split(' ')[0] ?? 'Proveedor';
  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ mb: 0.3, fontWeight: 800 }}>Bienvenido, {nombre}</Typography>
        <Typography variant="body2" color="text.secondary">
          {new Date().toLocaleDateString('es-CR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </Typography>
      </Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
        <Panel title="Tu perfil de proveedor">
          <Typography fontSize={13} color="text.secondary" sx={{ mb: 2.5, lineHeight: 1.6 }}>
            Un perfil completo genera más confianza entre constructores y aumenta tus posibilidades de ser contactado.
          </Typography>
          <Button variant="contained" onClick={() => navigate('/mi-perfil-proveedor')}>
            Completar mi perfil
          </Button>
        </Panel>
        <Panel title="Calificaciones">
          <Typography fontSize={13} color="text.secondary" sx={{ mb: 2.5 }}>
            Tus calificaciones de constructores aparecerán aquí una vez que estés conectado con ellos.
          </Typography>
          <Button variant="outlined" onClick={() => navigate('/calificaciones')}>
            Ver calificaciones
          </Button>
        </Panel>
      </Box>
    </Box>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ROOT
// ═══════════════════════════════════════════════════════════════════════════════

export default function Dashboard() {
  const { usuario } = useAuth();
  const rol = usuario?.rol;
  if (rol === 'Admin')       return <DashboardAdmin />;
  if (rol === 'Constructor') return <DashboardConstructor usuario={usuario} />;
  if (rol === 'Proveedor')   return <DashboardProveedor usuario={usuario} />;
  return <DashboardCliente usuario={usuario} />;
}
