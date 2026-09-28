import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box, Typography, IconButton, Badge, Avatar, Chip,
  TextField, CircularProgress, Tooltip, Divider,
} from '@mui/material';
import ChatIcon             from '@mui/icons-material/Chat';
import CloseIcon            from '@mui/icons-material/Close';
import ArrowBackIcon        from '@mui/icons-material/ArrowBack';
import SendIcon             from '@mui/icons-material/Send';
import AttachFileIcon       from '@mui/icons-material/AttachFile';
import PictureAsPdfIcon    from '@mui/icons-material/PictureAsPdf';
import DownloadIcon        from '@mui/icons-material/Download';
import TagIcon              from '@mui/icons-material/Tag';
import FolderOpenIcon       from '@mui/icons-material/FolderOpen';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import { mensajesApi }      from '../../api/endpoints';
import { useAuth }          from '../../context/AuthContext';

// ── Design tokens ─────────────────────────────────────────────────────────────
const ACCENT  = '#2563EB';
const DARK    = '#0F1629';
const PANEL_W = 380;
const PANEL_H = 560;

const CANALES = [
  { id: 'General',  label: 'General',  color: '#6B7280' },
  { id: 'Cliente',  label: 'Cliente',  color: '#2563EB' },
  { id: 'Tecnico',  label: 'Técnico',  color: '#059669' },
  { id: 'Equipo',   label: 'Equipo',   color: '#D97706' },
];

function canalColor(canal) {
  return CANALES.find(c => c.id === canal)?.color ?? '#6B7280';
}

function fmtTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now - d;
  if (diffMs < 60_000)      return 'ahora';
  if (diffMs < 3_600_000)   return `${Math.floor(diffMs / 60_000)}m`;
  if (diffMs < 86_400_000)  return d.toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString('es-CR', { day: 'numeric', month: 'short' });
}

function avatarInitial(name) {
  return (name || 'U')[0].toUpperCase();
}

const AVATAR_COLORS = ['#4F46E5','#0EA5E9','#10B981','#2563EB','#7C3AED','#DB2777'];
function avatarBg(name) {
  return AVATAR_COLORS[(name?.charCodeAt(0) ?? 0) % AVATAR_COLORS.length];
}

// ── Floating button ────────────────────────────────────────────────────────────
function ChatBubble({ unread, onClick, isOpen }) {
  return (
    <Box
      onClick={onClick}
      sx={{
        position: 'fixed', bottom: 24, right: 24, zIndex: 1400,
        width: 52, height: 52, borderRadius: '50%',
        bgcolor: ACCENT, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 4px 20px rgba(37,99,235,0.45)',
        transition: 'transform .2s, box-shadow .2s',
        '&:hover': { transform: 'scale(1.08)', boxShadow: '0 6px 24px rgba(37,99,235,0.55)' },
      }}
    >
      <Badge
        badgeContent={unread > 0 ? unread : 0}
        color="error"
        sx={{ '& .MuiBadge-badge': { fontSize: 10, minWidth: 16, height: 16, p: 0 } }}
      >
        {isOpen
          ? <CloseIcon sx={{ color: '#fff', fontSize: 22 }} />
          : <ChatIcon  sx={{ color: '#fff', fontSize: 22 }} />
        }
      </Badge>
    </Box>
  );
}

// ── Conversation list ──────────────────────────────────────────────────────────
function ConversationList({ conversations, loading, onSelect }) {
  if (loading) {
    return (
      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  if (!conversations.length) {
    return (
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 3, gap: 1.5 }}>
        <ChatIcon sx={{ fontSize: 40, color: '#CBD5E1' }} />
        <Typography fontSize={13.5} color="text.secondary" textAlign="center">
          No tienes conversaciones activas.
          <br />Acepta o publica un proyecto para empezar.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ flex: 1, overflowY: 'auto', '&::-webkit-scrollbar': { width: 4 }, '&::-webkit-scrollbar-thumb': { bgcolor: '#E2E8F0', borderRadius: 2 } }}>
      {conversations.map(proy => (
        <Box key={proy.proyectoId}>
          {/* Project header */}
          <Box sx={{ px: 2, py: 1, bgcolor: '#F8FAFC', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: 1 }}>
            <FolderOpenIcon sx={{ fontSize: 13, color: '#94A3B8' }} />
            <Typography fontSize={11.5} fontWeight={700} color="#475569" noWrap sx={{ flex: 1, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {proy.titulo}
            </Typography>
            {proy.totalNoLeidos > 0 && (
              <Chip label={proy.totalNoLeidos} size="small"
                sx={{ height: 16, fontSize: 10, fontWeight: 700, bgcolor: ACCENT, color: '#fff', '& .MuiChip-label': { px: 0.75 } }} />
            )}
          </Box>

          {/* Channels */}
          {proy.canales.map(canal => (
            <Box
              key={canal.canal}
              onClick={() => onSelect({ proyectoId: proy.proyectoId, titulo: proy.titulo, canal: canal.canal })}
              sx={{
                display: 'flex', alignItems: 'center', gap: 1.5,
                px: 2, py: 1.1, cursor: 'pointer',
                borderBottom: '1px solid #F8FAFC',
                transition: 'all .12s',
                '&:hover': {
                  bgcolor: '#EFF6FF',
                  '& .canal-arrow': { color: ACCENT, transform: 'translateX(2px)' },
                },
              }}
            >
              <TagIcon sx={{ fontSize: 14, color: canalColor(canal.canal), flexShrink: 0 }} />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography fontSize={12.5} fontWeight={canal.noLeidos > 0 ? 700 : 500} color={canal.noLeidos > 0 ? '#1E293B' : '#475569'}>
                    {CANALES.find(c => c.id === canal.canal)?.label ?? canal.canal}
                  </Typography>
                  <Typography fontSize={10.5} color="#94A3B8" flexShrink={0} ml={0.5}>
                    {fmtTime(canal.ultimaFecha)}
                  </Typography>
                </Box>
                {canal.ultimoMensaje && (
                  <Typography fontSize={11.5} color={canal.noLeidos > 0 ? '#334155' : '#94A3B8'} noWrap fontWeight={canal.noLeidos > 0 ? 600 : 400}>
                    {canal.ultimoMensaje}
                  </Typography>
                )}
              </Box>
              {canal.noLeidos > 0 && (
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: ACCENT, flexShrink: 0 }} />
              )}
              <KeyboardArrowRightIcon className="canal-arrow" sx={{ fontSize: 14, color: '#CBD5E1', flexShrink: 0, transition: 'all .12s' }} />
            </Box>
          ))}
        </Box>
      ))}
    </Box>
  );
}

// ── Chat room ──────────────────────────────────────────────────────────────────
function ChatRoom({ room, userId, onBack }) {
  const [messages, setMessages]   = useState([]);
  const [loading,  setLoading]    = useState(true);
  const [text,     setText]       = useState('');
  const [sending,  setSending]    = useState(false);
  const bottomRef = useRef(null);
  const pollRef   = useRef(null);

  const fetchMessages = useCallback(async () => {
    try {
      const { data } = await mensajesApi.getCanalMensajes(room.proyectoId, room.canal);
      setMessages(data);
    } catch {
      // silently ignore
    } finally {
      setLoading(false);
    }
  }, [room.proyectoId, room.canal]);

  useEffect(() => {
    setLoading(true);
    setMessages([]);
    fetchMessages();
    pollRef.current = setInterval(fetchMessages, 3000);
    return () => clearInterval(pollRef.current);
  }, [fetchMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    const content = text.trim();
    if (!content || sending) return;
    setSending(true);
    try {
      await mensajesApi.sendCanal(room.proyectoId, room.canal, { contenido: content });
      setText('');
      await fetchMessages();
    } catch {
      // ignore
    } finally {
      setSending(false);
    }
  };

  const onKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const canColor = canalColor(room.canal);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      {/* Room header */}
      <Box sx={{ px: 1.5, py: 1, display: 'flex', alignItems: 'center', gap: 1, borderBottom: '1px solid #F1F5F9', bgcolor: '#FAFAFA' }}>
        <IconButton size="small" onClick={onBack} sx={{ color: '#475569', '&:hover': { bgcolor: '#F1F5F9' } }}>
          <ArrowBackIcon fontSize="small" />
        </IconButton>
        <TagIcon sx={{ fontSize: 15, color: canColor }} />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography fontSize={12.5} fontWeight={700} color="#1E293B">
            {CANALES.find(c => c.id === room.canal)?.label ?? room.canal}
          </Typography>
          <Typography fontSize={10.5} color="#94A3B8" noWrap>{room.titulo}</Typography>
        </Box>
        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: canColor, flexShrink: 0 }} />
      </Box>

      {/* Messages */}
      <Box sx={{
        flex: 1, overflowY: 'auto', p: 1.5, display: 'flex', flexDirection: 'column', gap: 0.75,
        '&::-webkit-scrollbar': { width: 4 }, '&::-webkit-scrollbar-thumb': { bgcolor: '#E2E8F0', borderRadius: 2 },
      }}>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', pt: 3 }}>
            <CircularProgress size={24} />
          </Box>
        )}
        {!loading && messages.length === 0 && (
          <Box sx={{ textAlign: 'center', pt: 3 }}>
            <TagIcon sx={{ fontSize: 32, color: '#E2E8F0' }} />
            <Typography fontSize={12.5} color="text.secondary" mt={1}>
              Sin mensajes en este canal aún.
            </Typography>
          </Box>
        )}
        {messages.map(msg => {
          const mine = msg.remitenteId === userId;
          return (
            <Box key={msg.id} sx={{ display: 'flex', flexDirection: mine ? 'row-reverse' : 'row', gap: 0.75, alignItems: 'flex-end' }}>
              {!mine && (
                <Avatar sx={{ width: 24, height: 24, fontSize: 10, fontWeight: 700, bgcolor: avatarBg(msg.remitenteNombre), flexShrink: 0 }}>
                  {avatarInitial(msg.remitenteNombre)}
                </Avatar>
              )}
              <Box sx={{ maxWidth: '72%' }}>
                {!mine && (
                  <Typography fontSize={10.5} color="#94A3B8" mb={0.25} ml={0.5}>
                    {msg.remitenteNombre}
                  </Typography>
                )}
                <Box sx={{
                  px: 1.5, py: 0.9,
                  bgcolor: mine ? ACCENT : '#F1F5F9',
                  color: mine ? '#fff' : '#1E293B',
                  borderRadius: mine ? '14px 14px 4px 14px' : '4px 14px 14px 14px',
                  boxShadow: mine ? '0 2px 10px rgba(37,99,235,0.22)' : 'none',
                }}>
                  <Typography fontSize={12.5} lineHeight={1.45} sx={{ wordBreak: 'break-word', whiteSpace: 'pre-line' }}>
                    {msg.contenido}
                  </Typography>

                  {/* ── Adjunto PDF ── */}
                  {msg.adjuntoUrl && msg.adjuntoNombre && (
                    <Box
                      component="a"
                      href={msg.adjuntoUrl}
                      download={msg.adjuntoNombre}
                      sx={{
                        display: 'flex', alignItems: 'center', gap: 1,
                        mt: 1, px: 1.25, py: 0.85,
                        bgcolor: mine ? 'rgba(255,255,255,0.15)' : 'rgba(37,99,235,0.08)',
                        borderRadius: '8px',
                        border: `1px solid ${mine ? 'rgba(255,255,255,0.25)' : 'rgba(37,99,235,0.2)'}`,
                        textDecoration: 'none',
                        cursor: 'pointer',
                        '&:hover': {
                          bgcolor: mine ? 'rgba(255,255,255,0.25)' : 'rgba(37,99,235,0.15)',
                        },
                        transition: 'background .15s',
                      }}>
                      <PictureAsPdfIcon sx={{ fontSize: 18, color: mine ? 'rgba(255,255,255,0.9)' : '#DC2626', flexShrink: 0 }} />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography fontSize={11.5} fontWeight={700}
                          sx={{ color: mine ? '#fff' : '#1E293B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {msg.adjuntoNombre}
                        </Typography>
                        <Typography fontSize={10} sx={{ color: mine ? 'rgba(255,255,255,0.7)' : '#64748B' }}>
                          PDF · Toca para descargar
                        </Typography>
                      </Box>
                      <DownloadIcon sx={{ fontSize: 15, color: mine ? 'rgba(255,255,255,0.8)' : ACCENT, flexShrink: 0 }} />
                    </Box>
                  )}
                </Box>
                <Typography fontSize={10} color="#94A3B8" mt={0.25} sx={{ textAlign: mine ? 'right' : 'left' }}>
                  {fmtTime(msg.fechaEnvio)}
                </Typography>
              </Box>
            </Box>
          );
        })}
        <div ref={bottomRef} />
      </Box>

      {/* Input */}
      <Box sx={{ px: 1.5, py: 1.25, borderTop: '1px solid #F1F5F9', bgcolor: '#FAFBFC', flexShrink: 0 }}>
        <Box sx={{
          display: 'flex', alignItems: 'flex-end', gap: 0.75,
          bgcolor: '#fff', border: '1.5px solid',
          borderColor: text.trim() ? ACCENT : '#E2E8F0',
          borderRadius: '12px', px: 1.5, py: 0.75,
          transition: 'border-color .15s, box-shadow .15s',
          boxShadow: text.trim() ? `0 0 0 3px ${ACCENT}18` : 'none',
        }}>
          <TextField
            multiline maxRows={4}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={onKey}
            placeholder={`Mensaje en #${CANALES.find(c => c.id === room.canal)?.label ?? room.canal}…`}
            variant="standard"
            fullWidth
            InputProps={{ disableUnderline: true, sx: { fontSize: 12.5, lineHeight: 1.55 } }}
          />
          <IconButton
            onClick={send}
            disabled={!text.trim() || sending}
            size="small"
            sx={{
              width: 30, height: 30, flexShrink: 0, mb: '1px',
              bgcolor: text.trim() && !sending ? ACCENT : '#E2E8F0',
              color: text.trim() && !sending ? '#fff' : '#94A3B8',
              borderRadius: '8px', transition: 'all .15s',
              '&:hover': { bgcolor: '#1D4ED8' },
              '&.Mui-disabled': { bgcolor: '#E2E8F0', color: '#94A3B8' },
            }}
          >
            {sending ? <CircularProgress size={13} sx={{ color: 'inherit' }} /> : <SendIcon sx={{ fontSize: 14 }} />}
          </IconButton>
        </Box>
        <Typography sx={{ fontSize: 9.5, color: '#CBD5E1', mt: 0.5, textAlign: 'right' }}>
          Enter para enviar · Shift+Enter nueva línea
        </Typography>
      </Box>
    </Box>
  );
}

// ── Main widget ────────────────────────────────────────────────────────────────
export default function ChatWidget() {
  const { usuario }                   = useAuth();
  const [isOpen,         setIsOpen]   = useState(false);
  const [activeRoom,     setRoom]     = useState(null);    // { proyectoId, titulo, canal }
  const [conversations,  setConvs]    = useState([]);
  const [loadingConvs,   setLoading]  = useState(false);
  const [totalUnread,    setUnread]   = useState(0);
  const pollRef = useRef(null);

  const userId = usuario?.id ?? usuario?.Id;

  const fetchConversations = useCallback(async () => {
    if (!usuario) return;
    try {
      const { data } = await mensajesApi.conversaciones();
      setConvs(data);
      setUnread(data.reduce((s, p) => s + (p.totalNoLeidos ?? 0), 0));
    } catch {
      // ignore
    }
  }, [usuario]);

  // Poll conversations when widget is closed (for badge count), and more aggressively when open
  useEffect(() => {
    fetchConversations();
    const interval = isOpen && !activeRoom ? 3000 : 15000;
    pollRef.current = setInterval(fetchConversations, interval);
    return () => clearInterval(pollRef.current);
  }, [fetchConversations, isOpen, activeRoom]);

  // Open via topbar mail icon
  useEffect(() => {
    const handler = () => { setIsOpen(true); setRoom(null); fetchConversations(); };
    window.addEventListener('construapp:open-chat', handler);
    return () => window.removeEventListener('construapp:open-chat', handler);
  }, [fetchConversations]);

  const toggle = () => {
    setIsOpen(v => !v);
    if (!isOpen) { setRoom(null); fetchConversations(); }
  };

  const openRoom = (room) => {
    setRoom(room);
  };

  const closeRoom = () => {
    setRoom(null);
    fetchConversations();
  };

  if (!usuario) return null;

  return (
    <>
      {/* ── Sliding panel ─────────────────────────────────────────────────── */}
      <Box sx={{
        position: 'fixed',
        bottom: 88,
        right: 24,
        width: PANEL_W,
        height: PANEL_H,
        zIndex: 1399,
        display: 'flex',
        flexDirection: 'column',
        bgcolor: '#fff',
        borderRadius: '16px',
        boxShadow: '0 8px 40px rgba(0,0,0,0.14), 0 2px 12px rgba(0,0,0,0.08)',
        border: '1px solid #E2E8F0',
        overflow: 'hidden',
        // Slide animation
        transition: 'transform .25s cubic-bezier(.4,0,.2,1), opacity .2s',
        transform: isOpen ? 'translateY(0) scale(1)' : 'translateY(16px) scale(0.97)',
        opacity:   isOpen ? 1 : 0,
        pointerEvents: isOpen ? 'all' : 'none',
      }}>

        {/* Panel header */}
        <Box sx={{
          px: 2, py: 1.5,
          background: `linear-gradient(135deg, ${DARK} 0%, #1E3A8A 100%)`,
          display: 'flex', alignItems: 'center', gap: 1.5, flexShrink: 0,
        }}>
          <Box sx={{ bgcolor: ACCENT, borderRadius: '8px', p: '5px', display: 'flex' }}>
            <ChatIcon sx={{ color: '#fff', fontSize: 15 }} />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography fontSize={13.5} fontWeight={700} color="#fff">
              {activeRoom ? activeRoom.titulo : 'Mensajes'}
            </Typography>
            {!activeRoom && (
              <Typography fontSize={11} color="rgba(255,255,255,0.5)">
                {conversations.length} {conversations.length === 1 ? 'proyecto' : 'proyectos'}
              </Typography>
            )}
          </Box>
          <IconButton size="small" onClick={toggle} sx={{ color: 'rgba(255,255,255,0.6)', '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.1)' } }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        {/* Body */}
        {activeRoom
          ? <ChatRoom room={activeRoom} userId={userId} onBack={closeRoom} />
          : <ConversationList conversations={conversations} loading={loadingConvs} onSelect={openRoom} />
        }
      </Box>

      {/* ── Floating bubble ───────────────────────────────────────────────── */}
      <ChatBubble unread={totalUnread} onClick={toggle} isOpen={isOpen} />
    </>
  );
}
