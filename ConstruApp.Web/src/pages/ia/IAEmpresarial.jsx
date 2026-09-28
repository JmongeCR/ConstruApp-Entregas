import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box, Typography, Button, Select, MenuItem, FormControl, InputLabel,
  CircularProgress, Skeleton, IconButton, Tooltip, Avatar, Chip,
  TextField, InputAdornment,
} from '@mui/material';
import AutoAwesomeIcon   from '@mui/icons-material/AutoAwesome';
import SendIcon          from '@mui/icons-material/Send';
import ContentCopyIcon   from '@mui/icons-material/ContentCopy';
import CheckIcon         from '@mui/icons-material/Check';
import SummarizeIcon     from '@mui/icons-material/Summarize';
import WarningAmberIcon  from '@mui/icons-material/WarningAmber';
import RequestQuoteIcon  from '@mui/icons-material/RequestQuote';
import DescriptionIcon   from '@mui/icons-material/Description';
import FactCheckIcon     from '@mui/icons-material/FactCheck';
import HardwareIcon      from '@mui/icons-material/Hardware';
import AssessmentIcon    from '@mui/icons-material/Assessment';
import DeleteSweepIcon   from '@mui/icons-material/DeleteSweep';
import { proyectosApi, constructorApi, iaEmpresarialApi } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';

const ACCENT = '#2563EB';
const DARK   = '#0F172A';
const BOT_BG = '#F8FAFC';

// ── Herramientas disponibles ──────────────────────────────────────────────────
const TOOLS = [
  { id: 'resumenSemanal', label: 'Resumen semanal',       icon: SummarizeIcon,    color: ACCENT,    prompt: '¿Cuál es el resumen semanal del proyecto?',            needsNota: false, desc: 'Avances, gastos y pendientes de la semana.' },
  { id: 'sobrecostos',   label: 'Analizar sobrecostos',   icon: WarningAmberIcon, color: '#D97706', prompt: '¿Hay sobrecostos o desvíos financieros en el proyecto?', needsNota: false, desc: 'Detecta desvíos y partidas fuera de presupuesto.' },
  { id: 'presupuesto',   label: 'Generar presupuesto',    icon: RequestQuoteIcon, color: '#059669', prompt: 'Generá un presupuesto detallado para este proyecto.',     needsNota: true,  desc: 'Presupuesto detallado con partidas y materiales.' },
  { id: 'propuesta',     label: 'Crear propuesta',        icon: DescriptionIcon,  color: '#7C3AED', prompt: 'Creá una propuesta comercial profesional.',              needsNota: true,  desc: 'Propuesta comercial lista para enviar al cliente.' },
  { id: 'alcance',       label: 'Definir alcance',        icon: FactCheckIcon,    color: '#0891B2', prompt: 'Definí el alcance del proyecto con entregables.',        needsNota: true,  desc: 'Entregables, exclusiones y criterios de aceptación.' },
  { id: 'materiales',    label: 'Recomendar materiales',  icon: HardwareIcon,     color: '#DC2626', prompt: 'Recomendá materiales adecuados para este proyecto.',     needsNota: false, desc: 'Sugiere materiales por calidad, precio y zona.' },
  { id: 'reporte',       label: 'Reporte ejecutivo',      icon: AssessmentIcon,   color: '#DB2777', prompt: 'Generá un reporte ejecutivo completo del proyecto.',     needsNota: false, desc: 'Estado, métricas y proyecciones del proyecto.' },
];

// ── Botones rápidos ──────────────────────────────────────────────────────────
const QUICK = TOOLS.slice(0, 4);

// ── Markdown renderer ────────────────────────────────────────────────────────
function MarkdownText({ text }) {
  if (!text) return null;
  return (
    <Box sx={{ fontSize: 13.5, lineHeight: 1.8, color: '#1E293B' }}>
      {text.split('\n').map((line, i) => {
        if (!line.trim()) return <Box key={i} sx={{ height: 6 }} />;
        if (line.startsWith('### ')) return (
          <Typography key={i} fontSize={13.5} fontWeight={700} sx={{ mt: 1.5, mb: 0.5, color: DARK }}>{line.slice(4)}</Typography>
        );
        if (line.startsWith('## ')) return (
          <Typography key={i} fontSize={14.5} fontWeight={800} sx={{ mt: 2, mb: 0.75, color: DARK }}>{line.slice(3)}</Typography>
        );
        if (line.startsWith('# ')) return (
          <Typography key={i} fontSize={15.5} fontWeight={900} sx={{ mt: 2, mb: 1, color: DARK }}>{line.slice(2)}</Typography>
        );
        if (line.startsWith('- ') || line.startsWith('* ')) return (
          <Box key={i} sx={{ display: 'flex', gap: 1, mb: 0.4 }}>
            <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: ACCENT, mt: '9px', flexShrink: 0 }} />
            <Typography fontSize={13.5} sx={{ lineHeight: 1.75 }}>
              {renderInline(line.slice(2))}
            </Typography>
          </Box>
        );
        const numMatch = line.match(/^(\d+)\. (.+)/);
        if (numMatch) return (
          <Box key={i} sx={{ display: 'flex', gap: 1, mb: 0.4 }}>
            <Typography fontSize={13} fontWeight={700} sx={{ color: ACCENT, minWidth: 20 }}>{numMatch[1]}.</Typography>
            <Typography fontSize={13.5} sx={{ lineHeight: 1.75 }}>{renderInline(numMatch[2])}</Typography>
          </Box>
        );
        return <Typography key={i} fontSize={13.5} sx={{ mb: 0.1, lineHeight: 1.75 }}>{renderInline(line)}</Typography>;
      })}
    </Box>
  );
}

function renderInline(text) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) =>
    p.startsWith('**') && p.endsWith('**')
      ? <strong key={i}>{p.slice(2, -2)}</strong>
      : p
  );
}

// ── Burbuja de mensaje ────────────────────────────────────────────────────────
function MessageBubble({ msg, onCopy, copied }) {
  const isUser = msg.role === 'user';
  return (
    <Box sx={{
      display: 'flex', gap: 1.5, alignItems: 'flex-start',
      flexDirection: isUser ? 'row-reverse' : 'row',
      maxWidth: '100%',
    }}>
      {/* Avatar */}
      {!isUser && (
        <Box sx={{
          width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
          bgcolor: ACCENT, display: 'flex', alignItems: 'center', justifyContent: 'center',
          mt: 0.25,
        }}>
          <AutoAwesomeIcon sx={{ fontSize: 16, color: 'white' }} />
        </Box>
      )}

      {/* Contenido */}
      <Box sx={{ maxWidth: isUser ? '72%' : '88%', minWidth: 0 }}>
        {/* Chip de herramienta */}
        {!isUser && msg.toolLabel && (
          <Chip
            label={msg.toolLabel}
            size="small"
            sx={{ mb: 0.75, height: 20, fontSize: 10.5, fontWeight: 700,
              bgcolor: msg.toolColor + '15', color: msg.toolColor, border: `1px solid ${msg.toolColor}30` }}
          />
        )}

        <Box sx={{
          bgcolor: isUser ? ACCENT : BOT_BG,
          color: isUser ? 'white' : DARK,
          px: 2, py: 1.5,
          borderRadius: isUser ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
          border: isUser ? 'none' : '1px solid #E2E8F0',
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          position: 'relative',
        }}>
          {msg.loading ? (
            <Box sx={{ display: 'flex', gap: 0.6, alignItems: 'center', py: 0.5 }}>
              {[0, 1, 2].map(i => (
                <Box key={i} sx={{
                  width: 7, height: 7, borderRadius: '50%', bgcolor: '#94A3B8',
                  animation: 'pulse 1.4s ease-in-out infinite',
                  animationDelay: `${i * 0.2}s`,
                  '@keyframes pulse': {
                    '0%, 80%, 100%': { transform: 'scale(0.6)', opacity: 0.4 },
                    '40%': { transform: 'scale(1)', opacity: 1 },
                  },
                }} />
              ))}
            </Box>
          ) : isUser ? (
            <Typography fontSize={13.5} sx={{ lineHeight: 1.6, color: 'white' }}>{msg.content}</Typography>
          ) : (
            <MarkdownText text={msg.streaming ? msg.content + '▌' : msg.content} />
          )}
        </Box>

        {/* Acciones del mensaje bot */}
        {!isUser && !msg.loading && msg.content && !msg.streaming && (
          <Box sx={{ display: 'flex', gap: 0.5, mt: 0.75, ml: 0.5 }}>
            <Tooltip title={copied === msg.id ? 'Copiado' : 'Copiar'}>
              <IconButton size="small"
                onClick={() => onCopy(msg.id, msg.content)}
                sx={{ width: 26, height: 26, color: '#94A3B8', '&:hover': { color: DARK, bgcolor: '#F1F5F9' } }}>
                {copied === msg.id ? <CheckIcon sx={{ fontSize: 13 }} /> : <ContentCopyIcon sx={{ fontSize: 13 }} />}
              </IconButton>
            </Tooltip>
            <Typography variant="caption" sx={{ color: '#CBD5E1', alignSelf: 'center', ml: 0.25 }}>
              {msg.time}
            </Typography>
          </Box>
        )}
        {isUser && (
          <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block', mt: 0.5, textAlign: 'right' }}>
            {msg.time}
          </Typography>
        )}
      </Box>
    </Box>
  );
}

// ── Pantalla de bienvenida ────────────────────────────────────────────────────
function WelcomeScreen({ proyectoActual, onQuickAction }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', flex: 1, px: { xs: 2, sm: 4 }, py: 4 }}>

      {/* Logo + title */}
      <Box sx={{
        width: 56, height: 56, borderRadius: '14px', bgcolor: ACCENT,
        display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1.75,
        boxShadow: '0 8px 28px rgba(37,99,235,0.28)',
      }}>
        <AutoAwesomeIcon sx={{ fontSize: 26, color: 'white' }} />
      </Box>

      <Typography fontWeight={800} fontSize={18} sx={{ color: DARK, mb: 0.5 }}>
        IA Empresarial
      </Typography>
      <Typography fontSize={13.5} color="text.secondary" sx={{ textAlign: 'center', maxWidth: 380, mb: proyectoActual ? 3.5 : 1 }}>
        {proyectoActual
          ? <>Asistente para <strong>{proyectoActual.titulo}</strong>. Elegí una acción o escribí tu consulta.</>
          : 'Seleccioná un proyecto en la barra superior para comenzar.'}
      </Typography>

      {proyectoActual && (
        <>
          <Typography sx={{ fontSize: 10.5, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.08em', textTransform: 'uppercase', mb: 1.5 }}>
            ¿Qué querés analizar?
          </Typography>
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
            gap: 1,
            width: '100%',
            maxWidth: 580,
          }}>
            {TOOLS.map(t => {
              const Icon = t.icon;
              return (
                <Box
                  key={t.id}
                  onClick={() => onQuickAction(t)}
                  sx={{
                    display: 'flex', alignItems: 'flex-start', gap: 1.25,
                    p: 1.5, borderRadius: '10px',
                    border: '1px solid #E5E7EB', bgcolor: 'white',
                    cursor: 'pointer', textAlign: 'left',
                    transition: 'all .15s',
                    '&:hover': {
                      bgcolor: t.color + '06',
                      borderColor: t.color + '55',
                      transform: 'translateY(-1px)',
                      boxShadow: '0 4px 14px rgba(0,0,0,0.07)',
                    },
                  }}
                >
                  <Box sx={{
                    width: 32, height: 32, borderRadius: '8px', flexShrink: 0,
                    bgcolor: t.color + '12',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    mt: 0.1,
                  }}>
                    <Icon sx={{ fontSize: 16, color: t.color }} />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography fontSize={12.5} fontWeight={700} sx={{ color: DARK, mb: 0.15 }}>
                      {t.label}
                    </Typography>
                    <Typography fontSize={11} sx={{ color: '#64748B', lineHeight: 1.45 }}>
                      {t.desc}
                    </Typography>
                  </Box>
                </Box>
              );
            })}
          </Box>
        </>
      )}
    </Box>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
export default function IAEmpresarial() {
  const { usuario } = useAuth();

  const [proyectos,  setProyectos]  = useState([]);
  const [proyectoId, setProyectoId] = useState('');
  const [loadingP,   setLoadingP]   = useState(true);
  const [messages,   setMessages]   = useState([]);
  const [input,      setInput]      = useState('');
  const [loading,    setLoading]    = useState(false);
  const [copied,     setCopied]     = useState(null);

  const bottomRef  = useRef(null);
  const inputRef   = useRef(null);
  const msgCounter = useRef(0);

  const proyectoActual = proyectos.find(p => p.id === proyectoId) ?? null;

  // ── Cargar proyectos ──────────────────────────────────────────────────────
  useEffect(() => {
    const esConstructor = usuario?.rol === 'Constructor';
    const fetch = esConstructor
      ? constructorApi.dashboard().then(r =>
          (r.data?.clientes ?? [])
            .filter(p => p.estadoPropuesta === 'Aceptada')
            .map(p => ({ id: p.proyectoId, titulo: p.proyectoTitulo }))
        )
      : proyectosApi.getMios().then(r =>
          (r.data ?? []).map(p => ({ id: p.id, titulo: p.titulo }))
        );

    fetch
      .then(lista => {
        setProyectos(lista);
        if (lista.length > 0) setProyectoId(lista[0].id);
      })
      .catch(() => {})
      .finally(() => setLoadingP(false));
  }, [usuario?.rol]);

  // ── Auto-scroll ───────────────────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Streaming simulado (typewriter) ──────────────────────────────────────
  const streamText = useCallback((msgId, fullText) => {
    const words = fullText.split(' ');
    let idx = 0;
    const tick = () => {
      idx += Math.floor(Math.random() * 3) + 2; // 2-4 palabras por tick
      const partial = words.slice(0, Math.min(idx, words.length)).join(' ');
      const done    = idx >= words.length;
      setMessages(prev => prev.map(m =>
        m.id === msgId ? { ...m, content: partial, streaming: !done } : m
      ));
      if (!done) setTimeout(tick, 25 + Math.random() * 30);
    };
    tick();
  }, []);

  // ── Llamar al API de IA ───────────────────────────────────────────────────
  const callIA = useCallback(async (toolId, notaText) => {
    const tool = TOOLS.find(t => t.id === toolId);
    if (!tool || !proyectoId) return;

    const botId = `bot-${++msgCounter.current}`;

    // Placeholder "pensando..."
    setMessages(prev => [...prev, {
      id: botId, role: 'bot', content: '', loading: true,
      toolLabel: tool.label, toolColor: tool.color, time: nowTime(),
    }]);
    setLoading(true);

    try {
      const payload = notaText ? { notas: notaText } : {};
      let res;
      switch (toolId) {
        case 'resumenSemanal': res = await iaEmpresarialApi.resumenSemanal(proyectoId);         break;
        case 'sobrecostos':   res = await iaEmpresarialApi.sobrecostos(proyectoId);            break;
        case 'presupuesto':   res = await iaEmpresarialApi.generarPresupuesto(proyectoId, payload); break;
        case 'propuesta':     res = await iaEmpresarialApi.generarPropuesta(proyectoId, payload);   break;
        case 'alcance':       res = await iaEmpresarialApi.generarAlcance(proyectoId, payload);     break;
        case 'materiales':    res = await iaEmpresarialApi.recomendarMateriales(proyectoId, payload); break;
        case 'reporte':       res = await iaEmpresarialApi.generarReporte(proyectoId);         break;
        default: break;
      }

      const content = res?.data?.contenido ?? 'Sin respuesta del modelo.';

      // Reemplazar placeholder con respuesta vacía para hacer streaming
      setMessages(prev => prev.map(m =>
        m.id === botId ? { ...m, loading: false, content: '', streaming: true } : m
      ));
      streamText(botId, content);
    } catch {
      setMessages(prev => prev.map(m =>
        m.id === botId
          ? { ...m, loading: false, streaming: false, content: 'Error al consultar la IA. Verificá la configuración del servicio.' }
          : m
      ));
    } finally {
      setLoading(false);
    }
  }, [proyectoId, streamText]);

  // ── Enviar mensaje del usuario ────────────────────────────────────────────
  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || loading || !proyectoId) return;

    setInput('');

    const userMsg = {
      id: `user-${++msgCounter.current}`, role: 'user',
      content: text, time: nowTime(),
    };
    setMessages(prev => [...prev, userMsg]);

    // Detectar si el texto coincide con una herramienta conocida
    const matchedTool = TOOLS.find(t =>
      text.toLowerCase().includes(t.label.toLowerCase().split(' ')[0].toLowerCase()) ||
      text.toLowerCase().includes(t.id.toLowerCase())
    );

    if (matchedTool) {
      await callIA(matchedTool.id, text);
    } else {
      // Mensaje libre — usar resumen semanal como fallback conversacional
      await callIA('resumenSemanal', text);
    }
  }, [input, loading, proyectoId, callIA]);

  // ── Acción rápida ─────────────────────────────────────────────────────────
  const handleQuickAction = useCallback((tool) => {
    const userMsg = {
      id: `user-${++msgCounter.current}`, role: 'user',
      content: tool.prompt, time: nowTime(),
    };
    setMessages(prev => [...prev, userMsg]);
    callIA(tool.id);
  }, [callIA]);

  // ── Copiar al portapapeles ────────────────────────────────────────────────
  const handleCopy = (msgId, text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(msgId);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const clearChat = () => setMessages([]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 54px - 48px)', minHeight: 500 }}>

      {/* ── Topbar ── */}
      <Box sx={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        px: 2.5, py: 1.5,
        bgcolor: 'white', border: '1px solid #E2E8F0', borderRadius: '12px 12px 0 0',
        flexShrink: 0,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{
            width: 34, height: 34, borderRadius: '10px', bgcolor: ACCENT,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <AutoAwesomeIcon sx={{ fontSize: 17, color: 'white' }} />
          </Box>
          <Box>
            <Typography fontWeight={800} fontSize={14} sx={{ color: DARK, lineHeight: 1.2 }}>
              IA Empresarial
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1 }}>
              Asistente de construcción · Costa Rica
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {/* Selector de proyecto */}
          {loadingP ? <Skeleton width={200} height={36} sx={{ borderRadius: 1 }} /> : (
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel sx={{ fontSize: 12.5 }}>Proyecto</InputLabel>
              <Select
                label="Proyecto"
                value={proyectoId}
                onChange={e => { setProyectoId(e.target.value); setMessages([]); }}
                sx={{ fontSize: 12.5, '& .MuiSelect-select': { py: '6px' } }}>
                {proyectos.map(p => (
                  <MenuItem key={p.id} value={p.id} sx={{ fontSize: 12.5 }}>{p.titulo}</MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {messages.length > 0 && (
            <Tooltip title="Limpiar conversación">
              <IconButton size="small" onClick={clearChat}
                sx={{ color: '#94A3B8', '&:hover': { color: '#EF4444', bgcolor: '#FEF2F2' } }}>
                <DeleteSweepIcon sx={{ fontSize: 19 }} />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>

      {/* ── Área de mensajes ── */}
      <Box sx={{
        flex: 1, overflowY: 'auto', px: 3, py: 2.5,
        bgcolor: '#FAFBFC',
        border: '1px solid #E2E8F0', borderTop: 'none', borderBottom: 'none',
        display: 'flex', flexDirection: 'column',
      }}>
        {messages.length === 0 ? (
          <WelcomeScreen proyectoActual={proyectoActual} onQuickAction={handleQuickAction} />
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pb: 1 }}>
            {messages.map(msg => (
              <MessageBubble key={msg.id} msg={msg} onCopy={handleCopy} copied={copied} />
            ))}
            <div ref={bottomRef} />
          </Box>
        )}
      </Box>

      {/* ── Botones rápidos ── */}
      {messages.length > 0 && !loading && proyectoId && (
        <Box sx={{
          px: 3, py: 1.25, bgcolor: 'white',
          borderLeft: '1px solid #E2E8F0', borderRight: '1px solid #E2E8F0',
          display: 'flex', gap: 1, overflowX: 'auto', flexShrink: 0,
          '&::-webkit-scrollbar': { height: 0 },
        }}>
          {QUICK.map(t => {
            const Icon = t.icon;
            return (
              <Button key={t.id}
                startIcon={<Icon sx={{ fontSize: 13, color: t.color }} />}
                onClick={() => handleQuickAction(t)}
                size="small"
                sx={{
                  fontSize: 11.5, textTransform: 'none', fontWeight: 600,
                  color: '#374151', border: '1px solid #E5E7EB', whiteSpace: 'nowrap',
                  bgcolor: 'white', borderRadius: 1.5, px: 1.25, py: 0.5, flexShrink: 0,
                  '&:hover': { bgcolor: t.color + '08', borderColor: t.color + '40' },
                }}>
                {t.label}
              </Button>
            );
          })}
        </Box>
      )}

      {/* ── Input ── */}
      <Box sx={{
        px: 2.5, py: 2,
        bgcolor: 'white', border: '1px solid #E2E8F0',
        borderRadius: '0 0 12px 12px', flexShrink: 0,
      }}>
        <Box sx={{
          display: 'flex', alignItems: 'flex-end', gap: 1.5,
          bgcolor: '#F8FAFC', border: '1.5px solid',
          borderColor: input ? ACCENT : '#E2E8F0',
          borderRadius: 2.5, px: 2, py: 1.25,
          transition: 'border-color .15s',
        }}>
          <TextField
            inputRef={inputRef}
            multiline maxRows={5}
            placeholder={proyectoId
              ? 'Preguntame sobre el proyecto… (Enter para enviar)'
              : 'Seleccioná un proyecto para empezar…'}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={!proyectoId || loading}
            variant="standard"
            fullWidth
            InputProps={{ disableUnderline: true, sx: { fontSize: 13.5, lineHeight: 1.6 } }}
          />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0, pb: 0.25 }}>
            {loading && <CircularProgress size={18} sx={{ color: ACCENT }} />}
            <IconButton
              onClick={handleSend}
              disabled={!input.trim() || loading || !proyectoId}
              sx={{
                width: 34, height: 34, borderRadius: 1.5,
                bgcolor: input.trim() && !loading && proyectoId ? ACCENT : '#E5E7EB',
                color: input.trim() && !loading && proyectoId ? 'white' : '#9CA3AF',
                transition: 'all .15s',
                '&:hover': { bgcolor: '#1D4ED8' },
                '&:disabled': { bgcolor: '#E5E7EB', color: '#9CA3AF' },
              }}>
              <SendIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.75, px: 0.5 }}>
          <Typography variant="caption" color="text.disabled" fontSize={10.5}>
            IA apoyada en datos reales del proyecto · Gemini 2.5 Flash
          </Typography>
          <Typography variant="caption" color="text.disabled" fontSize={10.5}>
            Shift+Enter para nueva línea
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

function nowTime() {
  return new Date().toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit' });
}
