import { useState } from 'react';
import {
  Box, Typography, Button, Chip, Divider,
} from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import AddIcon           from '@mui/icons-material/Add';
import ChevronLeftIcon   from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon  from '@mui/icons-material/ChevronRight';

const ACCENT = '#2563EB';

const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

const EVENTOS_DEMO = [
  { dia: 3,  titulo: 'Revisión de planos',    color: ACCENT     },
  { dia: 3,  titulo: 'Entrega de materiales', color: '#D97706'  },
  { dia: 10, titulo: 'Inspección obra gris',  color: '#DC2626'  },
  { dia: 15, titulo: 'Reunión con cliente',   color: '#7C3AED'  },
  { dia: 20, titulo: 'Inicio acabados',       color: '#059669'  },
  { dia: 22, titulo: 'Pago parcial',          color: '#059669'  },
  { dia: 28, titulo: 'Revisión final',        color: ACCENT     },
];

function getDiasEnMes(year, month) {
  return new Date(year, month + 1, 0).getDate();
}
function getPrimerDiaSemana(year, month) {
  // 0=Dom → convertir a Lun=0
  const d = new Date(year, month, 1).getDay();
  return d === 0 ? 6 : d - 1;
}

export default function Calendario() {
  const hoy = new Date();
  const [año, setAño]   = useState(hoy.getFullYear());
  const [mes, setMes]   = useState(hoy.getMonth());

  const diasEnMes  = getDiasEnMes(año, mes);
  const primerDia  = getPrimerDiaSemana(año, mes);
  const totalCeldas = Math.ceil((primerDia + diasEnMes) / 7) * 7;

  const prev = () => { if (mes === 0) { setMes(11); setAño(a => a - 1); } else setMes(m => m - 1); };
  const next = () => { if (mes === 11) { setMes(0); setAño(a => a + 1); } else setMes(m => m + 1); };

  const eventosDelMes = EVENTOS_DEMO; // demo: always same
  const eventosMap = eventosDelMes.reduce((m, e) => { (m[e.dia] = m[e.dia] ?? []).push(e); return m; }, {});

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2.5, flexWrap: 'wrap', gap: 1 }}>
        <Box>
          <Typography variant="h5" sx={{ mb: 0.25 }}>Calendario</Typography>
          <Typography variant="body2" color="text.secondary">
            Eventos, inspecciones y hitos del proyecto
          </Typography>
        </Box>
        <Button variant="contained" size="small" startIcon={<AddIcon sx={{ fontSize: 14 }} />}
          sx={{ fontSize: 12.5 }}>
          Nuevo evento
        </Button>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 280px' }, gap: 2 }}>

        {/* Calendar grid */}
        <Box sx={{ bgcolor: '#fff', border: '1px solid #E2E8F0', borderRadius: '8px', overflow: 'hidden' }}>
          {/* Nav */}
          <Box sx={{ px: 2.5, py: 1.5, borderBottom: '1px solid #F1F5F9',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Button size="small" onClick={prev} sx={{ minWidth: 32, p: 0.5, color: '#64748B' }}>
              <ChevronLeftIcon fontSize="small" />
            </Button>
            <Typography fontSize={14} fontWeight={700} color="text.primary">
              {MESES[mes]} {año}
            </Typography>
            <Button size="small" onClick={next} sx={{ minWidth: 32, p: 0.5, color: '#64748B' }}>
              <ChevronRightIcon fontSize="small" />
            </Button>
          </Box>

          {/* Day headers */}
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid #F1F5F9' }}>
            {DIAS.map(d => (
              <Box key={d} sx={{ py: 1, textAlign: 'center' }}>
                <Typography fontSize={11.5} fontWeight={700} color="text.secondary">{d}</Typography>
              </Box>
            ))}
          </Box>

          {/* Day cells */}
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
            {Array.from({ length: totalCeldas }).map((_, idx) => {
              const dia = idx - primerDia + 1;
              const valido = dia >= 1 && dia <= diasEnMes;
              const esHoy  = valido && dia === hoy.getDate() && mes === hoy.getMonth() && año === hoy.getFullYear();
              const events = valido ? (eventosMap[dia] ?? []) : [];
              return (
                <Box key={idx} sx={{
                  minHeight: 80, p: 0.75, borderRight: '1px solid #F8FAFC',
                  borderBottom: '1px solid #F8FAFC',
                  bgcolor: valido ? '#fff' : '#FAFAFA',
                  '&:hover': valido ? { bgcolor: '#F8FAFC' } : {},
                }}>
                  {valido && (
                    <>
                      <Box sx={{
                        width: 22, height: 22, borderRadius: '50%', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        bgcolor: esHoy ? ACCENT : 'transparent',
                        mb: 0.5,
                      }}>
                        <Typography fontSize={12} fontWeight={esHoy ? 800 : 400}
                          sx={{ color: esHoy ? '#fff' : '#374151' }}>
                          {dia}
                        </Typography>
                      </Box>
                      {events.slice(0, 2).map((ev, i) => (
                        <Box key={i} sx={{
                          bgcolor: `${ev.color}14`, border: `1px solid ${ev.color}40`,
                          borderRadius: '3px', px: 0.6, py: 0.15, mb: 0.25,
                        }}>
                          <Typography fontSize={10} fontWeight={600}
                            sx={{ color: ev.color, lineHeight: 1.3, overflow: 'hidden',
                              textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {ev.titulo}
                          </Typography>
                        </Box>
                      ))}
                      {events.length > 2 && (
                        <Typography fontSize={10} color="text.secondary">+{events.length - 2} más</Typography>
                      )}
                    </>
                  )}
                </Box>
              );
            })}
          </Box>
        </Box>

        {/* Upcoming events */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ bgcolor: '#fff', border: '1px solid #E2E8F0', borderRadius: '8px', overflow: 'hidden' }}>
            <Box sx={{ px: 2.5, py: 1.5, borderBottom: '1px solid #F1F5F9' }}>
              <Typography fontSize={13} fontWeight={600}>Próximos eventos</Typography>
            </Box>
            {EVENTOS_DEMO.sort((a,b) => a.dia - b.dia).map((ev, i) => (
              <Box key={i}>
                {i > 0 && <Divider sx={{ mx: 2.5 }} />}
                <Box sx={{ px: 2.5, py: 1.25, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box sx={{ width: 32, height: 32, borderRadius: '6px', bgcolor: `${ev.color}14`,
                    border: `1px solid ${ev.color}30`, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', flexShrink: 0 }}>
                    <Typography fontSize={12} fontWeight={800} sx={{ color: ev.color }}>{ev.dia}</Typography>
                  </Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography fontSize={12.5} fontWeight={600} color="text.primary" noWrap>{ev.titulo}</Typography>
                    <Typography fontSize={11.5} color="text.secondary">
                      {ev.dia} de {MESES[mes]}, {año}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            ))}
          </Box>

          {/* Legend */}
          <Box sx={{ bgcolor: '#fff', border: '1px solid #E2E8F0', borderRadius: '8px', p: 2.5 }}>
            <Typography fontSize={12} fontWeight={600} color="text.secondary" sx={{ mb: 1.25, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Categorías
            </Typography>
            {[
              { label: 'Obra / Avances',  color: ACCENT    },
              { label: 'Urgente',         color: '#DC2626' },
              { label: 'Reuniones',       color: '#7C3AED' },
              { label: 'Financiero',      color: '#059669' },
              { label: 'Materiales',      color: '#D97706' },
            ].map(cat => (
              <Box key={cat.label} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: cat.color }} />
                <Typography fontSize={12.5} color="text.secondary">{cat.label}</Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>

      {/* Info */}
      <Box sx={{ mt: 2, bgcolor: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '7px', px: 2.5, py: 1.5,
        display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <CalendarMonthIcon sx={{ color: ACCENT, fontSize: 16, flexShrink: 0 }} />
        <Typography fontSize={12.5} sx={{ color: '#1E40AF' }}>
          Los eventos mostrados son de demostración. La integración con el cronograma de obra y notificaciones se activará en una próxima actualización.
        </Typography>
      </Box>
    </Box>
  );
}
