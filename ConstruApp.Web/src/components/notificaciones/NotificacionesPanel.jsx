import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Popover, Box, Typography, IconButton, Tooltip, Chip,
  Divider, CircularProgress, Button, Badge,
} from '@mui/material';
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined';
import NotificationsIcon         from '@mui/icons-material/Notifications';
import DoneAllIcon               from '@mui/icons-material/DoneAll';
import DeleteSweepIcon           from '@mui/icons-material/DeleteSweep';
import OpenInNewIcon             from '@mui/icons-material/OpenInNew';
import DeleteOutlineIcon         from '@mui/icons-material/DeleteOutlined';
import SettingsIcon              from '@mui/icons-material/Settings';
import { useNotificaciones }     from '../../context/NotificacionesContext';

// ── Tipo → metadata ─────────────────────────────────────────────────────────
const TIPOS = {
  nueva_propuesta:      { emoji: '📋', color: '#2563EB', bg: '#EFF6FF', cat: 'Propuestas'      },
  propuesta_aceptada:   { emoji: '✅', color: '#059669', bg: '#ECFDF5', cat: 'Propuestas'      },
  propuesta_rechazada:  { emoji: '❌', color: '#DC2626', bg: '#FEF2F2', cat: 'Propuestas'      },
  proyecto_creado:      { emoji: '🏗️', color: '#7C3AED', bg: '#F5F3FF', cat: 'Proyectos'       },
  proyecto_asignado:    { emoji: '👷', color: '#D97706', bg: '#FFFBEB', cat: 'Proyectos'       },
  proyecto_finalizado:  { emoji: '🏆', color: '#059669', bg: '#ECFDF5', cat: 'Proyectos'       },
  fase_iniciada:        { emoji: '▶️', color: '#2563EB', bg: '#EFF6FF', cat: 'Cronograma'      },
  fase_completada:      { emoji: '✅', color: '#059669', bg: '#ECFDF5', cat: 'Cronograma'      },
  fase_atrasada:        { emoji: '⏰', color: '#DC2626', bg: '#FEF2F2', cat: 'Cronograma'      },
  avance_registrado:    { emoji: '📸', color: '#D97706', bg: '#FFFBEB', cat: 'Avances'         },
  foto_subida:          { emoji: '🖼️', color: '#D97706', bg: '#FFFBEB', cat: 'Avances'         },
  factura_creada:       { emoji: '🧾', color: '#2563EB', bg: '#EFF6FF', cat: 'Facturación'     },
  factura_enviada:      { emoji: '📤', color: '#2563EB', bg: '#EFF6FF', cat: 'Facturación'     },
  factura_vencida:      { emoji: '⚠️', color: '#DC2626', bg: '#FEF2F2', cat: 'Facturación'     },
  pago_recibido:        { emoji: '💰', color: '#059669', bg: '#ECFDF5', cat: 'Facturación'     },
  orden_creada:         { emoji: '📝', color: '#7C3AED', bg: '#F5F3FF', cat: 'Órdenes'         },
  orden_aprobada:       { emoji: '✅', color: '#059669', bg: '#ECFDF5', cat: 'Órdenes'         },
  orden_rechazada:      { emoji: '❌', color: '#DC2626', bg: '#FEF2F2', cat: 'Órdenes'         },
  documento_agregado:   { emoji: '📄', color: '#6B7280', bg: '#F9FAFB', cat: 'Documentos'      },
  documento_actualizado:{ emoji: '📄', color: '#6B7280', bg: '#F9FAFB', cat: 'Documentos'      },
  nuevo_mensaje:        { emoji: '💬', color: '#DB2777', bg: '#FDF2F8', cat: 'Chat'            },
  mencion_directa:      { emoji: '@',  color: '#DB2777', bg: '#FDF2F8', cat: 'Chat'            },
};

function tipoMeta(tipo) {
  return TIPOS[tipo] ?? { emoji: '🔔', color: '#6B7280', bg: '#F9FAFB', cat: '' };
}

function fmtTiempo(fecha) {
  const diff = Date.now() - new Date(fecha).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  if (mins  < 1)  return 'Ahora';
  if (mins  < 60) return `Hace ${mins} min`;
  if (hours < 24) return `Hace ${hours}h`;
  if (days  < 7)  return `Hace ${days}d`;
  return new Date(fecha).toLocaleDateString('es-CR', { day: 'numeric', month: 'short' });
}

function agruparPorFecha(notifs) {
  const hoy   = new Date(); hoy.setHours(0,0,0,0);
  const ayer  = new Date(hoy); ayer.setDate(ayer.getDate() - 1);
  const semana= new Date(hoy); semana.setDate(semana.getDate() - 7);

  const grupos = { 'Hoy': [], 'Ayer': [], 'Esta semana': [], 'Anteriores': [] };
  notifs.forEach(n => {
    const d = new Date(n.fechaCreacion); d.setHours(0,0,0,0);
    if (d >= hoy)      grupos['Hoy'].push(n);
    else if (d >= ayer) grupos['Ayer'].push(n);
    else if (d >= semana) grupos['Esta semana'].push(n);
    else grupos['Anteriores'].push(n);
  });
  return grupos;
}

// ── Item individual ──────────────────────────────────────────────────────────
function NotifItem({ notif, onLeer, onEliminar, onNavegar }) {
  const meta = tipoMeta(notif.tipo);
  return (
    <Box
      sx={{
        display: 'flex', gap: 1.5, px: 2, py: 1.5, cursor: 'pointer',
        bgcolor: notif.leida ? 'transparent' : `${meta.bg}`,
        borderLeft: notif.leida ? '3px solid transparent' : `3px solid ${meta.color}`,
        transition: 'background .15s',
        '&:hover': { bgcolor: '#F8FAFC' },
        position: 'relative',
      }}
      onClick={() => {
        if (!notif.leida) onLeer(notif.id);
        if (notif.urlDestino) onNavegar(notif.urlDestino);
      }}
    >
      {/* Emoji/ícono */}
      <Box sx={{
        width: 36, height: 36, borderRadius: '50%', bgcolor: `${meta.color}15`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 16, flexShrink: 0, border: `1px solid ${meta.color}20`,
      }}>
        {meta.emoji}
      </Box>

      {/* Contenido */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontSize: 12.5, fontWeight: notif.leida ? 500 : 700, color: '#0F172A', lineHeight: 1.3 }}>
          {notif.titulo}
        </Typography>
        <Typography sx={{ fontSize: 11.5, color: '#64748B', mt: 0.3, lineHeight: 1.4,
          overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
          {notif.mensaje}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
          <Typography sx={{ fontSize: 10.5, color: '#94A3B8' }}>
            {fmtTiempo(notif.fechaCreacion)}
          </Typography>
          <Chip label={meta.cat} size="small"
            sx={{ fontSize: 9.5, height: 16, px: 0.3, bgcolor: `${meta.color}15`, color: meta.color,
              '& .MuiChip-label': { px: 0.8 } }} />
        </Box>
      </Box>

      {/* Dot no leída */}
      {!notif.leida && (
        <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: meta.color,
          position: 'absolute', top: 12, right: 38, flexShrink: 0 }} />
      )}

      {/* Acción eliminar (hover) */}
      <IconButton
        size="small"
        onClick={e => { e.stopPropagation(); onEliminar(notif.id); }}
        sx={{ opacity: 0, transition: '.15s', color: '#94A3B8', p: 0.25,
          '.MuiBox-root:hover > &': { opacity: 1 },
          '&:hover': { color: '#EF4444' }, position: 'absolute', right: 8, top: 10 }}
      >
        <DeleteOutlineIcon sx={{ fontSize: 14 }} />
      </IconButton>
    </Box>
  );
}

// ── Componente principal: campana + panel ────────────────────────────────────
export default function NotificacionesPanel() {
  const navigate = useNavigate();
  const { notificaciones, noLeidas, cargando, marcarLeida, marcarTodas, eliminar, limpiarLeidas, cargarNotificaciones } = useNotificaciones();
  const buttonRef = useRef(null);
  const [open, setOpen] = useState(false);

  const handleOpen = () => {
    setOpen(true);
    cargarNotificaciones(); // refresca al abrir
  };
  const handleClose = () => setOpen(false);

  const handleNavegar = (url) => {
    handleClose();
    navigate(url);
  };

  const grupos = agruparPorFecha(notificaciones);
  const hayNotifs = notificaciones.length > 0;

  return (
    <>
      {/* ── Campana ── */}
      <Tooltip title="Notificaciones">
        <IconButton
          ref={buttonRef}
          size="small"
          onClick={handleOpen}
          aria-label="Notificaciones"
          sx={{ color: open ? '#fff' : 'rgba(255,255,255,0.55)',
            bgcolor: open ? 'rgba(255,255,255,0.12)' : 'transparent',
            '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.08)' },
            transition: '.15s',
          }}
        >
          <Badge
            badgeContent={noLeidas}
            max={99}
            color="error"
            sx={{ '& .MuiBadge-badge': { fontSize: 9, minWidth: 15, height: 15, p: 0, fontWeight: 700 } }}
          >
            {noLeidas > 0
              ? <NotificationsIcon sx={{ fontSize: 19 }} />
              : <NotificationsOutlinedIcon sx={{ fontSize: 19 }} />
            }
          </Badge>
        </IconButton>
      </Tooltip>

      {/* ── Panel dropdown ── */}
      <Popover
        open={open}
        anchorEl={buttonRef.current}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: {
          sx: {
            width: 380, maxHeight: 560, borderRadius: '10px', overflow: 'hidden',
            boxShadow: '0 8px 30px rgba(0,0,0,0.14)', border: '1px solid #E2E8F0',
            display: 'flex', flexDirection: 'column', mt: 1,
          }
        }}}
      >
        {/* Header */}
        <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          bgcolor: '#0F1629', color: '#fff' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <NotificationsIcon sx={{ fontSize: 16, color: '#93C5FD' }} />
            <Typography sx={{ fontSize: 13.5, fontWeight: 700 }}>Notificaciones</Typography>
            {noLeidas > 0 && (
              <Chip label={noLeidas} size="small"
                sx={{ height: 18, fontSize: 10, fontWeight: 700, bgcolor: '#2563EB', color: '#fff',
                  '& .MuiChip-label': { px: 0.8 } }} />
            )}
          </Box>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            {noLeidas > 0 && (
              <Tooltip title="Marcar todas como leídas">
                <IconButton size="small" onClick={marcarTodas}
                  sx={{ color: 'rgba(255,255,255,0.6)', '&:hover': { color: '#fff' } }}>
                  <DoneAllIcon sx={{ fontSize: 15 }} />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title="Configurar notificaciones">
              <IconButton size="small" onClick={() => handleNavegar('/configuracion')}
                sx={{ color: 'rgba(255,255,255,0.6)', '&:hover': { color: '#fff' } }}>
                <SettingsIcon sx={{ fontSize: 15 }} />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Body */}
        <Box sx={{ flex: 1, overflow: 'auto', bgcolor: '#fff' }}>
          {cargando && !hayNotifs ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={24} />
            </Box>
          ) : !hayNotifs ? (
            <Box sx={{ textAlign: 'center', py: 5 }}>
              <Typography sx={{ fontSize: 32 }}>🔔</Typography>
              <Typography sx={{ fontSize: 13, color: '#94A3B8', mt: 1 }}>
                Sin notificaciones por ahora
              </Typography>
            </Box>
          ) : (
            Object.entries(grupos).map(([grupo, items]) => {
              if (!items.length) return null;
              return (
                <Box key={grupo}>
                  <Box sx={{ px: 2, py: 0.75, bgcolor: '#F8FAFC', borderBottom: '1px solid #F1F5F9' }}>
                    <Typography sx={{ fontSize: 10.5, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                      {grupo}
                    </Typography>
                  </Box>
                  {items.map(n => (
                    <NotifItem
                      key={n.id}
                      notif={n}
                      onLeer={marcarLeida}
                      onEliminar={eliminar}
                      onNavegar={handleNavegar}
                    />
                  ))}
                  <Divider />
                </Box>
              );
            })
          )}
        </Box>

        {/* Footer */}
        {hayNotifs && (
          <Box sx={{ px: 2, py: 1.25, borderTop: '1px solid #F1F5F9', bgcolor: '#F8FAFC',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Button
              size="small"
              startIcon={<OpenInNewIcon sx={{ fontSize: 12 }} />}
              onClick={() => handleNavegar('/notificaciones')}
              sx={{ fontSize: 11.5, color: '#2563EB', textTransform: 'none', py: 0.25 }}
            >
              Ver todas
            </Button>
            <Button
              size="small"
              startIcon={<DeleteSweepIcon sx={{ fontSize: 12 }} />}
              onClick={async () => { await limpiarLeidas(); cargarNotificaciones(); }}
              sx={{ fontSize: 11.5, color: '#94A3B8', textTransform: 'none', py: 0.25 }}
            >
              Limpiar leídas
            </Button>
          </Box>
        )}
      </Popover>
    </>
  );
}
