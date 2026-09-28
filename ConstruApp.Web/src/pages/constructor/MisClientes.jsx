import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Avatar, Chip, Button, LinearProgress,
  InputBase, Drawer, Divider, Skeleton, IconButton, Tooltip,
  TextField, Snackbar, Alert,
} from '@mui/material';
import SearchIcon            from '@mui/icons-material/Search';
import CloseIcon             from '@mui/icons-material/Close';
import PeopleAltIcon         from '@mui/icons-material/PeopleAlt';
import ConstructionIcon      from '@mui/icons-material/Construction';
import CheckCircleIcon       from '@mui/icons-material/CheckCircle';
import LocationOnIcon        from '@mui/icons-material/LocationOn';
import EmailIcon             from '@mui/icons-material/Email';
import PhoneIcon             from '@mui/icons-material/Phone';
import HourglassTopIcon      from '@mui/icons-material/HourglassTop';
import ChevronRightIcon      from '@mui/icons-material/ChevronRight';
import WhatsAppIcon          from '@mui/icons-material/WhatsApp';
import ContentCopyIcon       from '@mui/icons-material/ContentCopy';
import ReceiptIcon           from '@mui/icons-material/Receipt';
import NoteAltIcon           from '@mui/icons-material/NoteAlt';
import SaveIcon              from '@mui/icons-material/Save';
import CalendarTodayIcon     from '@mui/icons-material/CalendarToday';
import TrendingUpIcon        from '@mui/icons-material/TrendingUp';
import { constructorApi } from '../../api/endpoints';

const ACCENT = '#2563EB';

const AVATAR_PALETTE = ['#4F46E5','#0EA5E9','#10B981','#2563EB','#8B5CF6','#EC4899'];
const avatarBg = name => AVATAR_PALETTE[(name?.charCodeAt(0) ?? 0) % AVATAR_PALETTE.length];

const fmtMonto = v => v != null ? `₡${Number(v).toLocaleString('es-CR')}` : '—';
const fmtDate  = d => d ? new Date(d).toLocaleDateString('es-CR', { day: '2-digit', month: 'short', year: 'numeric' }) : null;
const fmtDateShort = d => d ? new Date(d).toLocaleDateString('es-CR', { day: '2-digit', month: 'short' }) : null;

const TIPO_LABEL = {
  Remodelacion: 'Remodelación', ObraGris: 'Obra gris',
  ElectricoPlomeria: 'Eléc/Plom', Pintura: 'Pintura',
  Pisos: 'Pisos', Techos: 'Techos', PiscinaJardin: 'Piscina/Jardín', Otro: 'Otro',
};

/* Agrupa por clienteId */
function groupByClient(items) {
  const map = new Map();
  items.forEach(item => {
    if (!map.has(item.clienteId)) {
      map.set(item.clienteId, {
        clienteId:       item.clienteId,
        clienteNombre:   item.clienteNombre,
        clienteEmail:    item.clienteEmail,
        clienteTelefono: item.clienteTelefono,
        proyectos: [],
      });
    }
    map.get(item.clienteId).proyectos.push(item);
  });
  return Array.from(map.values());
}

// ── KPI box ───────────────────────────────────────────────────────────────────
function KpiBox({ label, value, color = '#fff', sub }) {
  return (
    <Box sx={{
      flex: 1, bgcolor: 'rgba(255,255,255,0.09)',
      borderRadius: 2, px: 1.5, py: 1.25, textAlign: 'center',
    }}>
      <Typography sx={{ fontSize: 9, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: 0.5, lineHeight: 1.4 }}>
        {label}
      </Typography>
      <Typography fontWeight={800} fontSize={18} sx={{ color, lineHeight: 1.2, mt: 0.25 }}>
        {value}
      </Typography>
      {sub && (
        <Typography sx={{ fontSize: 9.5, color: 'rgba(255,255,255,0.35)', mt: 0.2, lineHeight: 1.2 }}>
          {sub}
        </Typography>
      )}
    </Box>
  );
}

// ── Proyecto row dentro del drawer ────────────────────────────────────────────
function DrawerProyectoRow({ p, onObra }) {
  const activo     = p.estadoPropuesta === 'Aceptada';
  const completado = p.estadoPropuesta === 'Finalizada';
  const tipo       = TIPO_LABEL[p.tipoProyecto] || p.tipoProyecto;

  const progressPct = activo && p.diasTranscurridos != null && p.plazoEstimadoDias > 0
    ? Math.min(100, (p.diasTranscurridos / p.plazoEstimadoDias) * 100)
    : null;
  const diasColor = p.diasRestantes < 0 ? '#DC2626' : p.diasRestantes < 5 ? '#F59E0B' : '#3B82F6';

  return (
    <Box sx={{
      border: '1px solid #E9EFF6',
      borderLeft: `3px solid ${activo ? ACCENT : completado ? '#10B981' : '#E2E8F0'}`,
      borderRadius: '0 8px 8px 0',
      p: 1.75, bgcolor: '#fff',
      transition: '.12s',
      '&:hover': { boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
    }}>
      {/* Título + chip */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
        <Box sx={{ flex: 1, minWidth: 0, pr: 1 }}>
          <Typography fontWeight={700} fontSize={13.5} sx={{ color: '#0F172A', lineHeight: 1.35 }}>
            {p.proyectoTitulo ?? `Proyecto #${p.proyectoId}`}
          </Typography>
          {tipo && (
            <Typography variant="caption" sx={{ color: '#64748B' }}>{tipo}</Typography>
          )}
        </Box>
        <Chip
          label={activo ? 'En curso' : completado ? 'Completado' : p.estadoPropuesta}
          size="small"
          sx={{
            bgcolor: activo ? '#EFF6FF' : completado ? '#ECFDF5' : '#F1F5F9',
            color:   activo ? '#1D4ED8' : completado ? '#065F46' : '#64748B',
            fontWeight: 700, fontSize: 10, flexShrink: 0,
            height: 20, borderRadius: 1,
          }}
        />
      </Box>

      {/* Monto + ubicación + fecha */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', mb: progressPct !== null ? 1 : 0.5 }}>
        <Typography fontSize={15} fontWeight={900} sx={{ color: '#0F172A' }}>
          {fmtMonto(p.montoTotal)}
        </Typography>
        {(p.canton || p.provincia) && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
            <LocationOnIcon sx={{ fontSize: 11, color: '#94A3B8' }} />
            <Typography variant="caption" color="text.secondary">
              {[p.canton, p.provincia].filter(Boolean).join(', ')}
            </Typography>
          </Box>
        )}
        {completado && p.fechaFin && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
            <CalendarTodayIcon sx={{ fontSize: 10, color: '#10B981' }} />
            <Typography variant="caption" sx={{ color: '#065F46', fontWeight: 600 }}>
              {fmtDateShort(p.fechaFin)}
            </Typography>
          </Box>
        )}
      </Box>

      {/* Barra de progreso */}
      {progressPct !== null && (
        <Box sx={{ mb: 1 }}>
          <LinearProgress variant="determinate" value={progressPct} sx={{
            height: 4, borderRadius: 4, bgcolor: 'rgba(0,0,0,0.05)',
            '& .MuiLinearProgress-bar': {
              borderRadius: 4,
              bgcolor: p.diasRestantes < 0 ? '#DC2626' : p.diasRestantes < 5 ? '#F59E0B' : ACCENT,
            },
          }} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.4 }}>
            <Typography variant="caption" color="text.disabled">
              Día {p.diasTranscurridos} de {p.plazoEstimadoDias}
            </Typography>
            {p.diasRestantes != null && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
                <HourglassTopIcon sx={{ fontSize: 10, color: diasColor }} />
                <Typography variant="caption" fontWeight={700} sx={{ color: diasColor }}>
                  {p.diasRestantes >= 0 ? `${p.diasRestantes}d restantes` : `${Math.abs(p.diasRestantes)}d atraso`}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      )}

      {/* Botón workspace */}
      {(activo || completado) && (
        <Button size="small"
          variant={activo ? 'contained' : 'outlined'}
          startIcon={<ConstructionIcon sx={{ fontSize: 12 }} />}
          onClick={() => onObra(p.proyectoId)}
          sx={activo
            ? { bgcolor: ACCENT, color: '#fff', fontWeight: 700, fontSize: 11.5, height: 28,
                '&:hover': { bgcolor: '#1D4ED8' }, mt: 0.5, px: 1.5 }
            : { borderColor: '#E2E8F0', color: '#64748B', fontWeight: 600, fontSize: 11.5, height: 28,
                '&:hover': { bgcolor: '#F8FAFC', borderColor: '#94A3B8' }, mt: 0.5, px: 1.5 }
          }
        >
          {activo ? 'Abrir workspace' : 'Ver workspace'}
        </Button>
      )}
    </Box>
  );
}

// ── Drawer de detalle del cliente ─────────────────────────────────────────────
function ClienteDrawer({ cliente, open, onClose, onObra, onFactura }) {
  const [nota,      setNota]      = useState('');
  const [notaSaved, setNotaSaved] = useState(false);
  const [snack,     setSnack]     = useState('');

  /* Cargar nota guardada al abrir */
  useEffect(() => {
    if (cliente?.clienteId) {
      const saved = localStorage.getItem(`nota_cliente_${cliente.clienteId}`) ?? '';
      setNota(saved);
      setNotaSaved(false);
    }
  }, [cliente?.clienteId]);

  if (!cliente) return null;

  const bg           = avatarBg(cliente.clienteNombre);
  const nActivos     = cliente.proyectos.filter(p => p.estadoPropuesta === 'Aceptada').length;
  const nCompletados = cliente.proyectos.filter(p => p.estadoPropuesta === 'Finalizada').length;
  const nTotal       = cliente.proyectos.length;
  const facturado    = cliente.proyectos
    .filter(p => ['Finalizada','Aceptada'].includes(p.estadoPropuesta))
    .reduce((s, p) => s + (p.montoTotal || 0), 0);

  // Proyecto activo (si existe) para acciones rápidas
  const proyectoActivo = cliente.proyectos.find(p => p.estadoPropuesta === 'Aceptada');

  const copyToClip = (val, label) => {
    navigator.clipboard.writeText(val).catch(() => {});
    setSnack(`${label} copiado`);
  };

  const guardarNota = () => {
    localStorage.setItem(`nota_cliente_${cliente.clienteId}`, nota);
    setNotaSaved(true);
    setSnack('Nota guardada');
  };

  /* Proyectos ordenados: activos primero, luego completados */
  const proyectosOrdenados = [...cliente.proyectos].sort((a, b) => {
    const score = p => p.estadoPropuesta === 'Aceptada' ? 0 : p.estadoPropuesta === 'Finalizada' ? 1 : 2;
    return score(a) - score(b);
  });

  return (
    <>
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: 520 },
          bgcolor: '#F8FAFC',
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      {/* ══ HEADER ══════════════════════════════════════════════════════ */}
      <Box sx={{ bgcolor: ACCENT, px: 2.5, pt: 2.5, pb: 2, flexShrink: 0 }}>
        {/* Fila: avatar + nombre + cerrar */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 2 }}>
          <Avatar sx={{
            bgcolor: bg, width: 56, height: 56,
            fontWeight: 800, fontSize: 22, flexShrink: 0,
            boxShadow: '0 0 0 3px rgba(255,255,255,0.15)',
          }}>
            {cliente.clienteNombre?.[0]?.toUpperCase() ?? '?'}
          </Avatar>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography fontWeight={800} fontSize={17} sx={{ color: '#fff', lineHeight: 1.25, mb: 0.4 }}>
              {cliente.clienteNombre ?? `Cliente #${cliente.clienteId}`}
            </Typography>

            {/* Email */}
            {cliente.clienteEmail && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <EmailIcon sx={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }} />
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.65)', flex: 1 }}>
                  {cliente.clienteEmail}
                </Typography>
                <Tooltip title="Copiar email">
                  <IconButton size="small" onClick={() => copyToClip(cliente.clienteEmail, 'Email')}
                    sx={{ p: 0.3, color: 'rgba(255,255,255,0.3)', '&:hover': { color: '#fff' } }}>
                    <ContentCopyIcon sx={{ fontSize: 11 }} />
                  </IconButton>
                </Tooltip>
              </Box>
            )}

            {/* Teléfono */}
            {cliente.clienteTelefono && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
                <PhoneIcon sx={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }} />
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.65)', flex: 1 }}>
                  {cliente.clienteTelefono}
                </Typography>
                <Tooltip title="Copiar teléfono">
                  <IconButton size="small" onClick={() => copyToClip(cliente.clienteTelefono, 'Teléfono')}
                    sx={{ p: 0.3, color: 'rgba(255,255,255,0.3)', '&:hover': { color: '#fff' } }}>
                    <ContentCopyIcon sx={{ fontSize: 11 }} />
                  </IconButton>
                </Tooltip>
              </Box>
            )}
          </Box>

          <IconButton size="small" onClick={onClose}
            sx={{ color: 'rgba(255,255,255,0.45)', '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.1)' }, mt: -0.5 }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        {/* ── Botones de contacto rápido ── */}
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          {cliente.clienteEmail && (
            <Button
              size="small"
              startIcon={<EmailIcon sx={{ fontSize: 13 }} />}
              component="a"
              href={`mailto:${cliente.clienteEmail}`}
              target="_blank"
              sx={{
                bgcolor: 'rgba(255,255,255,0.13)', color: '#fff',
                fontSize: 11.5, fontWeight: 600, textTransform: 'none',
                border: '1px solid rgba(255,255,255,0.18)',
                borderRadius: 1.5, px: 1.25, py: 0.5,
                '&:hover': { bgcolor: 'rgba(255,255,255,0.22)' },
              }}
            >
              Email
            </Button>
          )}
          {cliente.clienteTelefono && (
            <>
              <Button
                size="small"
                startIcon={<PhoneIcon sx={{ fontSize: 13 }} />}
                component="a"
                href={`tel:${cliente.clienteTelefono}`}
                sx={{
                  bgcolor: 'rgba(255,255,255,0.13)', color: '#fff',
                  fontSize: 11.5, fontWeight: 600, textTransform: 'none',
                  border: '1px solid rgba(255,255,255,0.18)',
                  borderRadius: 1.5, px: 1.25, py: 0.5,
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.22)' },
                }}
              >
                Llamar
              </Button>
              <Button
                size="small"
                startIcon={<WhatsAppIcon sx={{ fontSize: 13 }} />}
                component="a"
                href={`https://wa.me/506${cliente.clienteTelefono?.replace(/\D/g,'')}`}
                target="_blank"
                sx={{
                  bgcolor: 'rgba(34,197,94,0.25)', color: '#fff',
                  fontSize: 11.5, fontWeight: 600, textTransform: 'none',
                  border: '1px solid rgba(34,197,94,0.35)',
                  borderRadius: 1.5, px: 1.25, py: 0.5,
                  '&:hover': { bgcolor: 'rgba(34,197,94,0.38)' },
                }}
              >
                WhatsApp
              </Button>
            </>
          )}
        </Box>

        {/* ── KPIs ── */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <KpiBox label="Proyectos" value={nTotal} color="#fff" />
          {nActivos > 0 && <KpiBox label="En curso" value={nActivos} color="#93C5FD" />}
          <KpiBox label="Completados" value={nCompletados} color="#6EE7B7" />
          <KpiBox
            label="Total contratado"
            value={facturado > 0 ? `₡${(facturado / 1_000_000).toFixed(1)}M` : '₡0'}
            color="#FDE68A"
            sub={facturado > 0 ? fmtMonto(facturado) : undefined}
          />
        </Box>
      </Box>

      {/* ══ ACCIONES RÁPIDAS ═══════════════════════════════════════════ */}
      <Box sx={{
        px: 2.5, py: 1.5,
        borderBottom: '1px solid #E9EFF6',
        bgcolor: '#fff',
        display: 'flex', gap: 1, flexWrap: 'wrap',
        flexShrink: 0,
      }}>
        {proyectoActivo && (
          <Button
            size="small"
            variant="contained"
            startIcon={<ConstructionIcon sx={{ fontSize: 13 }} />}
            onClick={() => { onClose(); onObra(proyectoActivo.proyectoId); }}
            sx={{
              bgcolor: ACCENT, color: '#fff', fontSize: 12, fontWeight: 700,
              textTransform: 'none', borderRadius: 1.5, px: 1.75, py: 0.65,
              '&:hover': { bgcolor: '#1D4ED8' },
            }}
          >
            Abrir workspace activo
          </Button>
        )}
        {onFactura && (
          <Button
            size="small"
            variant="outlined"
            startIcon={<ReceiptIcon sx={{ fontSize: 13 }} />}
            onClick={() => { onClose(); onFactura(cliente); }}
            sx={{
              borderColor: '#E2E8F0', color: '#374151', fontSize: 12, fontWeight: 600,
              textTransform: 'none', borderRadius: 1.5, px: 1.75, py: 0.65,
              '&:hover': { borderColor: '#94A3B8', bgcolor: '#F8FAFC' },
            }}
          >
            Nueva factura
          </Button>
        )}
        <Button
          size="small"
          variant="outlined"
          startIcon={<TrendingUpIcon sx={{ fontSize: 13 }} />}
          onClick={() => { onClose(); onObra(cliente.proyectos[0]?.proyectoId); }}
          sx={{
            borderColor: '#E2E8F0', color: '#374151', fontSize: 12, fontWeight: 600,
            textTransform: 'none', borderRadius: 1.5, px: 1.75, py: 0.65,
            '&:hover': { borderColor: '#94A3B8', bgcolor: '#F8FAFC' },
          }}
        >
          Ver historial
        </Button>
      </Box>

      {/* ══ CONTENIDO SCROLLABLE ══════════════════════════════════════ */}
      <Box sx={{ flex: 1, overflow: 'auto', px: 2.5, py: 2 }}>

        {/* ── Proyectos ── */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
            <Typography fontWeight={700} fontSize={11.5} sx={{
              color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.6,
            }}>
              Proyectos ({nTotal})
            </Typography>
            {nActivos > 0 && (
              <Chip
                label={`${nActivos} activo${nActivos > 1 ? 's' : ''}`}
                size="small"
                sx={{ bgcolor: '#EFF6FF', color: ACCENT, fontWeight: 700, fontSize: 10, height: 18 }}
              />
            )}
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
            {proyectosOrdenados.map(p => (
              <DrawerProyectoRow
                key={p.propuestaId ?? p.proyectoId}
                p={p}
                onObra={(pid) => { onClose(); onObra(pid); }}
              />
            ))}
          </Box>
        </Box>

        {/* ── Notas privadas ── */}
        <Divider sx={{ mb: 2.5 }} />
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1.25 }}>
            <NoteAltIcon sx={{ fontSize: 15, color: '#94A3B8' }} />
            <Typography fontWeight={700} fontSize={11.5} sx={{
              color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.6,
            }}>
              Notas privadas
            </Typography>
            <Typography variant="caption" sx={{ color: '#CBD5E1', ml: 0.5 }}>
              (solo las ves vos)
            </Typography>
          </Box>
          <TextField
            multiline
            rows={4}
            fullWidth
            value={nota}
            onChange={e => { setNota(e.target.value); setNotaSaved(false); }}
            placeholder={`Notas sobre ${cliente.clienteNombre?.split(' ')[0]}…\nEj: prefiere comunicarse por WhatsApp, proyecto pendiente de permiso…`}
            size="small"
            sx={{
              '& .MuiOutlinedInput-root': {
                bgcolor: '#fff', fontSize: 13,
                '& fieldset': { borderColor: '#E2E8F0' },
                '&:hover fieldset': { borderColor: '#94A3B8' },
                '&.Mui-focused fieldset': { borderColor: ACCENT },
              },
            }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
            <Button
              size="small"
              variant={notaSaved ? 'text' : 'contained'}
              startIcon={<SaveIcon sx={{ fontSize: 13 }} />}
              onClick={guardarNota}
              disabled={notaSaved}
              sx={{
                fontSize: 12, fontWeight: 600, textTransform: 'none',
                ...(notaSaved
                  ? { color: '#10B981' }
                  : { bgcolor: ACCENT, color: '#fff', '&:hover': { bgcolor: '#1D4ED8' } }),
              }}
            >
              {notaSaved ? 'Guardado' : 'Guardar nota'}
            </Button>
          </Box>
        </Box>

        {/* ── Pie: cliente desde ── */}
        {cliente.proyectos.length > 0 && (() => {
          const fechas = cliente.proyectos.map(p => p.fechaPublicacion).filter(Boolean);
          const primera = fechas.length ? fechas.reduce((a,b) => a < b ? a : b) : null;
          return primera ? (
            <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #F1F5F9', textAlign: 'center' }}>
              <Typography variant="caption" sx={{ color: '#CBD5E1', fontSize: 10.5 }}>
                Cliente desde {fmtDate(primera)}
              </Typography>
            </Box>
          ) : null;
        })()}
      </Box>
    </Drawer>

    {/* Snackbar */}
    <Snackbar
      open={!!snack}
      autoHideDuration={2000}
      onClose={() => setSnack('')}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      <Alert severity="success" variant="filled" sx={{ fontSize: 12 }} onClose={() => setSnack('')}>
        {snack}
      </Alert>
    </Snackbar>
    </>
  );
}

// ── Fila compacta de cliente en la lista ──────────────────────────────────────
function ClienteRow({ cliente, onClick }) {
  const bg        = avatarBg(cliente.clienteNombre);
  const nActivos  = cliente.proyectos.filter(p => p.estadoPropuesta === 'Aceptada').length;
  const nTotal    = cliente.proyectos.length;
  const facturado = cliente.proyectos
    .filter(p => ['Finalizada','Aceptada'].includes(p.estadoPropuesta))
    .reduce((s, p) => s + (p.montoTotal || 0), 0);
  const tieneActivo = nActivos > 0;

  return (
    <Box
      onClick={onClick}
      sx={{
        display: 'flex', alignItems: 'center', gap: 2,
        px: 3, py: 2,
        borderBottom: '1px solid #F1F5F9',
        cursor: 'pointer', transition: '.12s',
        '&:hover': { bgcolor: '#F8FAFC' },
      }}
    >
      {/* Dot activo */}
      {tieneActivo && (
        <Box sx={{
          position: 'absolute', width: 8, height: 8,
          borderRadius: '50%', bgcolor: '#10B981',
          ml: -1.5, boxShadow: '0 0 0 2px #fff',
        }} />
      )}

      {/* Avatar */}
      <Box sx={{ position: 'relative' }}>
        <Avatar sx={{ bgcolor: bg, width: 42, height: 42, fontWeight: 800, fontSize: 16, flexShrink: 0 }}>
          {cliente.clienteNombre?.[0]?.toUpperCase() ?? '?'}
        </Avatar>
        {tieneActivo && (
          <Box sx={{
            position: 'absolute', bottom: 0, right: 0,
            width: 11, height: 11, borderRadius: '50%',
            bgcolor: '#10B981', border: '2px solid #fff',
          }} />
        )}
      </Box>

      {/* Nombre + email */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Typography fontWeight={700} fontSize={14} sx={{ color: '#0F172A' }} noWrap>
            {cliente.clienteNombre ?? `Cliente #${cliente.clienteId}`}
          </Typography>
          {tieneActivo && (
            <Chip label={`${nActivos} activo`} size="small" sx={{
              bgcolor: '#DBEAFE', color: '#1D4ED8', fontWeight: 700,
              fontSize: 10, height: 18, borderRadius: 1,
            }} />
          )}
        </Box>
        <Typography variant="caption" color="text.secondary" noWrap>
          {cliente.clienteEmail || `${nTotal} proyecto${nTotal !== 1 ? 's' : ''}`}
        </Typography>
      </Box>

      {/* Stats */}
      <Box sx={{ display: { xs: 'none', sm: 'flex' }, flexDirection: 'column', alignItems: 'flex-end', gap: 0.3 }}>
        <Typography fontSize={13} fontWeight={700} sx={{ color: '#0F172A' }}>
          {nTotal} proyecto{nTotal !== 1 ? 's' : ''}
        </Typography>
        {facturado > 0 && (
          <Typography variant="caption" sx={{ color: '#64748B' }}>
            {fmtMonto(facturado)}
          </Typography>
        )}
      </Box>

      <ChevronRightIcon sx={{ fontSize: 18, color: '#CBD5E1', flexShrink: 0 }} />
    </Box>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
export default function MisClientes() {
  const navigate = useNavigate();
  const [data,       setData]       = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [busqueda,   setBusqueda]   = useState('');
  const [filtro,     setFiltro]     = useState('todos');
  const [selClient,  setSelClient]  = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    constructorApi.dashboard()
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const clientes = useMemo(() => groupByClient(data?.clientes ?? []), [data]);

  // KPIs globales
  const totalActivos    = useMemo(() => clientes.filter(c => c.proyectos.some(p => p.estadoPropuesta === 'Aceptada')).length, [clientes]);
  const totalFacturado  = useMemo(() => clientes.reduce((s, c) => s + c.proyectos.filter(p => ['Finalizada','Aceptada'].includes(p.estadoPropuesta)).reduce((a, p) => a + (p.montoTotal || 0), 0), 0), [clientes]);

  const filtrados = useMemo(() => {
    let list = clientes;
    if (filtro === 'activos')    list = list.filter(c => c.proyectos.some(p => p.estadoPropuesta === 'Aceptada'));
    if (filtro === 'completados') list = list.filter(c => c.proyectos.some(p => p.estadoPropuesta === 'Finalizada'));
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase();
      list = list.filter(c =>
        c.clienteNombre?.toLowerCase().includes(q) ||
        c.clienteEmail?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [clientes, filtro, busqueda]);

  const openDrawer = (cliente) => { setSelClient(cliente); setDrawerOpen(true); };

  const FILTROS = [
    { id: 'todos',        label: 'Todos' },
    { id: 'activos',      label: 'En curso' },
    { id: 'completados',  label: 'Completados' },
  ];

  return (
    <Box sx={{ maxWidth: 860, mx: 'auto' }}>

      {/* ── Header + KPIs ── */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={900} sx={{ color: '#0F172A', mb: 0.25 }}>
          Mis clientes
        </Typography>
        <Typography color="text.secondary" fontSize={13.5} sx={{ mb: 2.5 }}>
          {loading ? 'Cargando…' : `${clientes.length} cliente${clientes.length !== 1 ? 's' : ''} en tu cartera`}
        </Typography>

        {/* KPIs globales */}
        {!loading && clientes.length > 0 && (
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            {[
              { label: 'Total clientes',   value: clientes.length,  color: '#EFF6FF', text: ACCENT },
              { label: 'Con obras activas', value: totalActivos,     color: '#ECFDF5', text: '#059669' },
              { label: 'Total contratado',  value: fmtMonto(totalFacturado), color: '#FFFBEB', text: '#D97706' },
            ].map(k => (
              <Box key={k.label} sx={{
                bgcolor: k.color, borderRadius: 2, px: 2, py: 1.25,
                border: `1px solid ${k.color === '#EFF6FF' ? '#BFDBFE' : k.color === '#ECFDF5' ? '#A7F3D0' : '#FDE68A'}`,
                minWidth: 130,
              }}>
                <Typography fontSize={10.5} sx={{ color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  {k.label}
                </Typography>
                <Typography fontWeight={800} fontSize={20} sx={{ color: k.text, lineHeight: 1.3 }}>
                  {k.value}
                </Typography>
              </Box>
            ))}
          </Box>
        )}
      </Box>

      {/* ── Barra de búsqueda + filtros ── */}
      <Box sx={{
        bgcolor: 'white', border: '1px solid #E2E8F0', borderRadius: 2,
        mb: 0, overflow: 'hidden',
      }}>
        {/* Búsqueda */}
        <Box sx={{
          display: 'flex', alignItems: 'center', gap: 1,
          px: 2, py: 1.25, borderBottom: '1px solid #F1F5F9',
        }}>
          <SearchIcon sx={{ fontSize: 18, color: '#94A3B8', flexShrink: 0 }} />
          <InputBase
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre o email…"
            fullWidth
            sx={{ fontSize: 13.5, '& input': { py: 0.25 } }}
          />
          {busqueda && (
            <IconButton size="small" onClick={() => setBusqueda('')}
              sx={{ p: 0.3, color: '#CBD5E1', '&:hover': { color: '#64748B' } }}>
              <CloseIcon sx={{ fontSize: 16 }} />
            </IconButton>
          )}
        </Box>

        {/* Filtros de tabs */}
        <Box sx={{ display: 'flex', px: 1, py: 0.5, gap: 0.5, borderBottom: '1px solid #F1F5F9' }}>
          {FILTROS.map(f => {
            const count = f.id === 'todos' ? clientes.length
              : f.id === 'activos' ? clientes.filter(c => c.proyectos.some(p => p.estadoPropuesta === 'Aceptada')).length
              : clientes.filter(c => c.proyectos.some(p => p.estadoPropuesta === 'Finalizada')).length;
            const active = filtro === f.id;
            return (
              <Button
                key={f.id}
                size="small"
                onClick={() => setFiltro(f.id)}
                sx={{
                  textTransform: 'none', fontWeight: active ? 700 : 500,
                  fontSize: 12.5, px: 1.5, py: 0.6, borderRadius: 1.5,
                  color: active ? ACCENT : '#64748B',
                  bgcolor: active ? '#EFF6FF' : 'transparent',
                  '&:hover': { bgcolor: active ? '#DBEAFE' : '#F8FAFC' },
                  minWidth: 0,
                }}
              >
                {f.label}
                {count > 0 && (
                  <Box component="span" sx={{
                    ml: 0.75, bgcolor: active ? ACCENT : '#E2E8F0',
                    color: active ? '#fff' : '#64748B',
                    borderRadius: '99px', px: 0.75, py: 0,
                    fontSize: 10, fontWeight: 800, lineHeight: 1.7,
                    display: 'inline-block',
                  }}>
                    {count}
                  </Box>
                )}
              </Button>
            );
          })}
        </Box>

        {/* ── Lista de clientes ── */}
        {loading ? (
          <Box>
            {[1, 2, 3].map(i => (
              <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 2, px: 3, py: 2, borderBottom: '1px solid #F1F5F9' }}>
                <Skeleton variant="circular" width={42} height={42} />
                <Box sx={{ flex: 1 }}>
                  <Skeleton width="55%" height={18} />
                  <Skeleton width="35%" height={14} sx={{ mt: 0.5 }} />
                </Box>
                <Skeleton width={80} height={16} />
              </Box>
            ))}
          </Box>
        ) : filtrados.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 7 }}>
            <PeopleAltIcon sx={{ fontSize: 44, color: '#E2E8F0', mb: 1 }} />
            <Typography fontWeight={700} sx={{ color: '#0F172A', mb: 0.5 }}>
              {busqueda ? 'Sin resultados para tu búsqueda' : 'Sin clientes en este filtro'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {busqueda
                ? `No se encontró ningún cliente con "${busqueda}"`
                : filtro === 'todos'
                  ? 'Enviá propuestas en el Marketplace para comenzar.'
                  : 'Cambiá el filtro para ver otros clientes.'}
            </Typography>
          </Box>
        ) : (
          filtrados.map(cliente => (
            <ClienteRow
              key={cliente.clienteId}
              cliente={cliente}
              onClick={() => openDrawer(cliente)}
            />
          ))
        )}
      </Box>

      {/* ── Drawer de detalle ── */}
      <ClienteDrawer
        cliente={selClient}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onObra={pid => navigate(`/obra/${pid}`)}
        onFactura={c => navigate('/facturacion/nueva', { state: { cliente: c } })}
      />
    </Box>
  );
}
