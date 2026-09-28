import { useState, useMemo } from 'react';
import { useNavigate }       from 'react-router-dom';
import {
  Box, Typography, Button, Chip, IconButton, Tooltip,
  Divider, CircularProgress, Tabs, Tab, Alert,
} from '@mui/material';
import NotificationsIcon     from '@mui/icons-material/Notifications';
import DoneAllIcon           from '@mui/icons-material/DoneAll';
import DeleteSweepIcon       from '@mui/icons-material/DeleteSweep';
import DeleteOutlineIcon     from '@mui/icons-material/DeleteOutlined';
import OpenInNewIcon         from '@mui/icons-material/OpenInNew';
import SettingsIcon          from '@mui/icons-material/Settings';
import { useNotificaciones } from '../../context/NotificacionesContext';
import { notificacionesApi } from '../../api/endpoints';

// ── mismos mapeos del panel ──────────────────────────────────────────────────
const TIPOS = {
  nueva_propuesta:       { emoji: '📋', color: '#2563EB', bg: '#EFF6FF', cat: 'Propuestas'   },
  propuesta_aceptada:    { emoji: '✅', color: '#059669', bg: '#ECFDF5', cat: 'Propuestas'   },
  propuesta_rechazada:   { emoji: '❌', color: '#DC2626', bg: '#FEF2F2', cat: 'Propuestas'   },
  proyecto_creado:       { emoji: '🏗️', color: '#7C3AED', bg: '#F5F3FF', cat: 'Proyectos'    },
  proyecto_asignado:     { emoji: '👷', color: '#D97706', bg: '#FFFBEB', cat: 'Proyectos'    },
  proyecto_finalizado:   { emoji: '🏆', color: '#059669', bg: '#ECFDF5', cat: 'Proyectos'    },
  fase_iniciada:         { emoji: '▶️', color: '#2563EB', bg: '#EFF6FF', cat: 'Cronograma'   },
  fase_completada:       { emoji: '✅', color: '#059669', bg: '#ECFDF5', cat: 'Cronograma'   },
  fase_atrasada:         { emoji: '⏰', color: '#DC2626', bg: '#FEF2F2', cat: 'Cronograma'   },
  avance_registrado:     { emoji: '📸', color: '#D97706', bg: '#FFFBEB', cat: 'Avances'      },
  foto_subida:           { emoji: '🖼️', color: '#D97706', bg: '#FFFBEB', cat: 'Avances'      },
  factura_creada:        { emoji: '🧾', color: '#2563EB', bg: '#EFF6FF', cat: 'Facturación'  },
  factura_enviada:       { emoji: '📤', color: '#2563EB', bg: '#EFF6FF', cat: 'Facturación'  },
  factura_vencida:       { emoji: '⚠️', color: '#DC2626', bg: '#FEF2F2', cat: 'Facturación'  },
  pago_recibido:         { emoji: '💰', color: '#059669', bg: '#ECFDF5', cat: 'Facturación'  },
  orden_creada:          { emoji: '📝', color: '#7C3AED', bg: '#F5F3FF', cat: 'Órdenes'      },
  orden_aprobada:        { emoji: '✅', color: '#059669', bg: '#ECFDF5', cat: 'Órdenes'      },
  orden_rechazada:       { emoji: '❌', color: '#DC2626', bg: '#FEF2F2', cat: 'Órdenes'      },
  documento_agregado:    { emoji: '📄', color: '#6B7280', bg: '#F9FAFB', cat: 'Documentos'   },
  documento_actualizado: { emoji: '📄', color: '#6B7280', bg: '#F9FAFB', cat: 'Documentos'   },
  nuevo_mensaje:         { emoji: '💬', color: '#DB2777', bg: '#FDF2F8', cat: 'Chat'         },
  mencion_directa:       { emoji: '@',  color: '#DB2777', bg: '#FDF2F8', cat: 'Chat'         },
};
const tipoMeta = (tipo) => TIPOS[tipo] ?? { emoji: '🔔', color: '#6B7280', bg: '#F9FAFB', cat: '' };

function fmtFecha(s) {
  return new Date(s).toLocaleString('es-CR', {
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function agrupar(notifs) {
  const hoy    = new Date(); hoy.setHours(0,0,0,0);
  const ayer   = new Date(hoy); ayer.setDate(ayer.getDate() - 1);
  const semana = new Date(hoy); semana.setDate(semana.getDate() - 7);
  const grupos = [
    { label: 'Hoy',          items: [] },
    { label: 'Ayer',         items: [] },
    { label: 'Esta semana',  items: [] },
    { label: 'Anteriores',   items: [] },
  ];
  notifs.forEach(n => {
    const d = new Date(n.fechaCreacion); d.setHours(0,0,0,0);
    if      (d >= hoy)    grupos[0].items.push(n);
    else if (d >= ayer)   grupos[1].items.push(n);
    else if (d >= semana) grupos[2].items.push(n);
    else                  grupos[3].items.push(n);
  });
  return grupos.filter(g => g.items.length > 0);
}

const CATEGORIAS = ['Todas', 'Propuestas', 'Proyectos', 'Cronograma', 'Avances', 'Facturación', 'Órdenes', 'Documentos', 'Chat'];

export default function Notificaciones() {
  const navigate = useNavigate();
  const { notificaciones, noLeidas, cargando, marcarLeida, marcarTodas, eliminar, limpiarLeidas, cargarNotificaciones } = useNotificaciones();

  const [tab,     setTab]     = useState(0); // 0=Todas, 1=No leídas, 2=Leídas
  const [catFilt, setCatFilt] = useState('Todas');

  const filtradas = useMemo(() => {
    let list = notificaciones;
    if (tab === 1) list = list.filter(n => !n.leida);
    if (tab === 2) list = list.filter(n =>  n.leida);
    if (catFilt !== 'Todas') list = list.filter(n => tipoMeta(n.tipo).cat === catFilt);
    return list;
  }, [notificaciones, tab, catFilt]);

  const grupos = agrupar(filtradas);

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2.5 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 0.4 }}>
            <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: '-0.3px' }}>Notificaciones</Typography>
            {noLeidas > 0 && (
              <Chip
                label={`${noLeidas} sin leer`}
                size="small"
                sx={{ bgcolor: '#2563EB', color: '#fff', fontWeight: 700, fontSize: 11, height: 20, '& .MuiChip-label': { px: 1 } }}
              />
            )}
          </Box>
          <Typography variant="body2" color="text.secondary">
            Centro de actividad · {notificaciones.length} total
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 0.75, alignItems: 'center' }}>
          {noLeidas > 0 && (
            <Button variant="outlined" size="small" startIcon={<DoneAllIcon sx={{ fontSize: 14 }} />}
              onClick={marcarTodas}
              sx={{ fontSize: 12, borderColor: '#E2E8F0', color: '#374151', '&:hover': { borderColor: '#9CA3AF' } }}>
              Marcar leídas
            </Button>
          )}
          <Button variant="outlined" size="small" startIcon={<DeleteSweepIcon sx={{ fontSize: 14 }} />}
            onClick={async () => { await limpiarLeidas(); }}
            sx={{ fontSize: 12, color: '#6B7280', borderColor: '#E2E8F0', '&:hover': { borderColor: '#9CA3AF' } }}>
            Limpiar leídas
          </Button>
          <Tooltip title="Preferencias de notificaciones">
            <IconButton size="small" onClick={() => navigate('/configuracion')}
              sx={{ border: '1px solid #E2E8F0', borderRadius: '7px', width: 32, height: 32, '&:hover': { bgcolor: '#F8FAFC', borderColor: '#9CA3AF' } }}>
              <SettingsIcon sx={{ fontSize: 15 }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Filtro por estado + categoría en una sola barra */}
      <Box sx={{ bgcolor: 'white', border: '1px solid #E2E8F0', borderRadius: '10px', overflow: 'hidden', mb: 2 }}>
        <Box sx={{ px: 0.5, borderBottom: '1px solid #F1F5F9' }}>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{
            minHeight: 40,
            '& .MuiTab-root': { minHeight: 40, py: 0, fontSize: 12.5, textTransform: 'none', fontWeight: 500, px: 2 },
            '& .Mui-selected': { fontWeight: 700 },
            '& .MuiTabs-indicator': { bgcolor: '#2563EB', height: 2.5 },
          }}>
            <Tab label={`Todas · ${notificaciones.length}`} />
            <Tab label={`Sin leer · ${notificaciones.filter(n => !n.leida).length}`} />
            <Tab label="Leídas" />
          </Tabs>
        </Box>
        <Box sx={{ px: 2, py: 1.25, display: 'flex', gap: 0.5, flexWrap: 'wrap', alignItems: 'center' }}>
          <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', mr: 0.5 }}>
            Categoría:
          </Typography>
          {CATEGORIAS.map(cat => (
            <Chip
              key={cat}
              label={cat}
              size="small"
              onClick={() => setCatFilt(cat)}
              sx={{
                fontSize: 11.5, cursor: 'pointer', transition: 'all .12s',
                bgcolor: catFilt === cat ? '#3B5BDB' : '#F1F5F9',
                color: catFilt === cat ? '#fff' : '#5A6A7E',
                border: `1px solid ${catFilt === cat ? '#3B5BDB' : '#E8EDF3'}`,
                fontWeight: catFilt === cat ? 700 : 500,
                '&:hover': { bgcolor: catFilt === cat ? '#2F4ACB' : '#E8EDF3', borderColor: catFilt === cat ? '#2F4ACB' : '#D0D9E8' },
              }}
            />
          ))}
        </Box>
      </Box>

      {/* Lista */}
      {cargando && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress size={28} />
        </Box>
      )}

      {!cargando && grupos.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8, bgcolor: 'white', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
          <Box sx={{
            width: 56, height: 56, borderRadius: '14px', bgcolor: '#F1F5F9',
            display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2,
          }}>
            <NotificationsIcon sx={{ fontSize: 26, color: '#94A3B8' }} />
          </Box>
          <Typography fontWeight={700} fontSize={15} color="text.primary" gutterBottom>
            {tab === 1 ? 'Todo al día' : 'Sin notificaciones'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {tab === 1 ? 'No tenés notificaciones sin leer.' : 'No hay notificaciones con estos filtros.'}
          </Typography>
          {(tab !== 0 || catFilt !== 'Todas') && (
            <Button size="small" sx={{ mt: 2, fontSize: 12 }}
              onClick={() => { setTab(0); setCatFilt('Todas'); }}>
              Ver todas
            </Button>
          )}
        </Box>
      )}

      {grupos.map(({ label, items }) => (
        <Box key={label} sx={{ mb: 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
            <Typography sx={{ fontSize: 10.5, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.07em', flexShrink: 0 }}>
              {label}
            </Typography>
            <Box sx={{ flex: 1, height: '1px', bgcolor: '#E2E8F0' }} />
            <Typography sx={{ fontSize: 10.5, color: '#CBD5E1', flexShrink: 0 }}>
              {items.length}
            </Typography>
          </Box>

          <Box sx={{ bgcolor: 'white', border: '1px solid #E2E8F0', borderRadius: '10px', overflow: 'hidden' }}>
            {items.map((n, idx) => {
              const meta = tipoMeta(n.tipo);
              return (
                <Box key={n.id}>
                  <Box
                    sx={{
                      display: 'flex', gap: 2, px: 2.5, py: 2, cursor: 'pointer',
                      bgcolor: n.leida ? 'transparent' : `${meta.bg}`,
                      borderLeft: n.leida ? '3px solid transparent' : `3px solid ${meta.color}`,
                      '&:hover': { bgcolor: '#F8FAFC' }, transition: 'background .15s',
                    }}
                    onClick={() => {
                      if (!n.leida) marcarLeida(n.id);
                      if (n.urlDestino) navigate(n.urlDestino);
                    }}
                  >
                    {/* Ícono */}
                    <Box sx={{
                      width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                      bgcolor: `${meta.color}15`, border: `1.5px solid ${meta.color}25`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
                    }}>
                      {meta.emoji}
                    </Box>

                    {/* Texto */}
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.3 }}>
                        <Typography sx={{ fontSize: 13.5, fontWeight: n.leida ? 500 : 800, color: '#0F172A' }}>
                          {n.titulo}
                        </Typography>
                        {!n.leida && (
                          <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: meta.color, flexShrink: 0 }} />
                        )}
                        <Chip label={meta.cat} size="small"
                          sx={{ fontSize: 10, height: 18, bgcolor: `${meta.color}12`, color: meta.color,
                            '& .MuiChip-label': { px: 0.8 } }} />
                      </Box>
                      <Typography sx={{ fontSize: 12.5, color: '#475569', lineHeight: 1.5 }}>
                        {n.mensaje}
                      </Typography>
                      <Typography sx={{ fontSize: 11, color: '#94A3B8', mt: 0.5 }}>
                        {fmtFecha(n.fechaCreacion)}
                      </Typography>
                    </Box>

                    {/* Acciones */}
                    <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'flex-start', flexShrink: 0 }}>
                      {n.urlDestino && (
                        <Tooltip title="Abrir">
                          <IconButton size="small" onClick={e => { e.stopPropagation(); navigate(n.urlDestino); }}
                            sx={{ color: '#94A3B8', '&:hover': { color: '#2563EB' } }}>
                            <OpenInNewIcon sx={{ fontSize: 14 }} />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Eliminar">
                        <IconButton size="small" onClick={e => { e.stopPropagation(); eliminar(n.id); }}
                          sx={{ color: '#94A3B8', '&:hover': { color: '#EF4444' } }}>
                          <DeleteOutlineIcon sx={{ fontSize: 14 }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                  {idx < items.length - 1 && <Divider />}
                </Box>
              );
            })}
          </Box>
        </Box>
      ))}
    </Box>
  );
}
