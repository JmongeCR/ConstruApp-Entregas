import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box, Typography, IconButton, Avatar, Divider,
  Drawer, List, ListItemButton, ListItemIcon, Tooltip, InputBase,
} from '@mui/material';
import MenuIcon            from '@mui/icons-material/Menu';
import ChevronLeftIcon     from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon    from '@mui/icons-material/ChevronRight';
import DashboardIcon       from '@mui/icons-material/Dashboard';
import FolderOpenIcon      from '@mui/icons-material/FolderOpen';
import StorefrontIcon      from '@mui/icons-material/Storefront';
import BusinessIcon        from '@mui/icons-material/Business';
import LocalOfferIcon      from '@mui/icons-material/LocalOffer';
import SendIcon            from '@mui/icons-material/Send';
import PeopleAltIcon       from '@mui/icons-material/PeopleAlt';
import ReceiptIcon         from '@mui/icons-material/Receipt';
import StarIcon            from '@mui/icons-material/Star';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import LogoutIcon          from '@mui/icons-material/Logout';
import ConstructionIcon    from '@mui/icons-material/Construction';
import SettingsIcon        from '@mui/icons-material/Settings';
import SearchIcon          from '@mui/icons-material/Search';
import ViewTimelineIcon    from '@mui/icons-material/ViewTimeline';
import DescriptionIcon     from '@mui/icons-material/Description';
import CalendarMonthIcon   from '@mui/icons-material/CalendarMonth';
import AutoAwesomeIcon     from '@mui/icons-material/AutoAwesome';
import AccountBalanceIcon  from '@mui/icons-material/AccountBalance';
import GroupWorkIcon       from '@mui/icons-material/GroupWork';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import InventoryIcon       from '@mui/icons-material/Inventory';

import { useAuth } from '../../context/AuthContext';
import ChatWidget from '../chat/ChatWidget';
import NotificacionesPanel from '../notificaciones/NotificacionesPanel';

// ── Constants ─────────────────────────────────────────────────────────────────
const SIDEBAR_W    = 248;
const SIDEBAR_MINI = 60;
const TOPBAR_H     = 58;
const SB_BG        = '#0C1322';   // Deep navy-black — much more premium

const AVATAR_COLORS = ['#7C3AED','#0EA5E9','#10B981','#2563EB','#DB2777','#F59E0B'];
const avatarBg = (name) => AVATAR_COLORS[(name?.charCodeAt(0) ?? 0) % AVATAR_COLORS.length];
const getInitials = (nombre) =>
  (nombre ?? '?').split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();

// ── Nav sections per role ─────────────────────────────────────────────────────

const SECTIONS_ADMIN = [
  { label: 'General', items: [
    { label: 'Dashboard',    path: '/',           Icon: DashboardIcon },
    { label: 'Marketplace',  path: '/marketplace', Icon: StorefrontIcon },
  ]},
  { label: 'Catálogo', items: [
    { label: 'Materiales', path: '/materiales', Icon: InventoryIcon },
  ]},
  { label: 'Administración', items: [
    { label: 'Panel Admin',   path: '/admin',         Icon: AdminPanelSettingsIcon },
    { label: 'Configuración', path: '/configuracion', Icon: SettingsIcon },
  ]},
];

const SECTIONS_CONSTRUCTOR = [
  { label: 'General', items: [
    { label: 'Dashboard',   path: '/',           Icon: DashboardIcon },
    { label: 'Marketplace', path: '/marketplace', Icon: StorefrontIcon },
  ]},
  { label: 'Gestión', items: [
    { label: 'Mis propuestas', path: '/mis-propuestas', Icon: SendIcon },
    { label: 'Mis clientes',   path: '/mis-clientes',   Icon: PeopleAltIcon },
    { label: 'Cronograma',     path: '/cronograma',     Icon: ViewTimelineIcon },
    { label: 'Documentos',     path: '/documentos',     Icon: DescriptionIcon },
  ]},
  { label: 'Finanzas', items: [
    { label: 'Facturación', path: '/facturacion', Icon: ReceiptIcon },
  ]},
  { label: 'Herramientas', items: [
    { label: 'Cotizaciones IA', path: '/cotizaciones-ia', Icon: AutoAwesomeIcon },
    { label: 'IA Empresarial',  path: '/ia',              Icon: AutoAwesomeIcon, permiso: 'ia.usar' },
  ]},
  { label: 'Empresa', items: [
    { label: 'Mi empresa',    path: '/mi-perfil-constructor', Icon: BusinessIcon },
    { label: 'Configuración', path: '/configuracion',         Icon: SettingsIcon },
  ]},
];

const SECTIONS_CLIENTE = [
  { label: 'General', items: [
    { label: 'Dashboard',     path: '/',             Icon: DashboardIcon },
    { label: 'Mis proyectos', path: '/mis-proyectos', Icon: FolderOpenIcon },
  ]},
  { label: 'Gestión', items: [
    { label: 'Cronograma',      path: '/cronograma',      Icon: ViewTimelineIcon },
    { label: 'Calendario',      path: '/calendario',      Icon: CalendarMonthIcon },
    { label: 'Cotizaciones IA', path: '/cotizaciones-ia', Icon: AutoAwesomeIcon },
  ]},
  { label: 'Marketplace', items: [
    { label: 'Constructores', path: '/marketplace', Icon: BusinessIcon },
  ]},
  { label: 'Configuración', items: [
    { label: 'Configuración', path: '/configuracion', Icon: SettingsIcon },
  ]},
];

const SECTIONS_PROVEEDOR = [
  { label: 'General', items: [
    { label: 'Dashboard', path: '/', Icon: DashboardIcon },
  ]},
  { label: 'Mi Negocio', items: [
    { label: 'Mi perfil',           path: '/mi-perfil-proveedor', Icon: LocalOfferIcon },
    { label: 'Catálogo de precios', path: '/materiales',          Icon: InventoryIcon },
  ]},
  { label: 'Configuración', items: [
    { label: 'Configuración', path: '/configuracion', Icon: SettingsIcon },
  ]},
];

// ── NavItem ───────────────────────────────────────────────────────────────────

function NavItem({ item, active, collapsed, onClick }) {
  const btn = (
    <ListItemButton
      onClick={onClick}
      sx={{
        borderRadius: '8px',
        mx: '10px',
        mb: '1px',
        py: collapsed ? '9px' : '6px',
        px: collapsed ? 0 : '10px',
        minHeight: 38,
        justifyContent: collapsed ? 'center' : 'flex-start',
        bgcolor: active ? 'rgba(99,130,246,0.12)' : 'transparent',
        position: 'relative',
        transition: 'all 0.15s ease',
        '&:hover': {
          bgcolor: active ? 'rgba(99,130,246,0.18)' : 'rgba(255,255,255,0.04)',
        },
      }}
    >
      {active && (
        <Box sx={{
          position: 'absolute', left: 0, top: '20%', bottom: '20%',
          width: '2.5px', borderRadius: '0 3px 3px 0',
          bgcolor: '#6182F6',
        }} />
      )}
      <ListItemIcon sx={{
        color: active ? '#93B4FC' : '#4B5E7A',
        minWidth: collapsed ? 0 : 28,
        transition: 'color 0.15s',
      }}>
        <item.Icon sx={{ fontSize: 17 }} />
      </ListItemIcon>
      {!collapsed && (
        <Typography sx={{
          fontSize: 13, fontWeight: active ? 600 : 400,
          color: active ? '#D4E0FF' : '#6B7E9A',
          lineHeight: 1, transition: 'color 0.15s',
          letterSpacing: '-0.1px',
        }}>
          {item.label}
        </Typography>
      )}
    </ListItemButton>
  );

  return collapsed
    ? <Tooltip title={item.label} placement="right" arrow>{btn}</Tooltip>
    : btn;
}

// ── SidebarContent ────────────────────────────────────────────────────────────

function SidebarContent({ sections, isActive, go, collapsed, usuario, logout, navigate }) {
  const bg    = avatarBg(usuario?.nombre);
  const rol   = usuario?.rol ?? 'Cliente';
  const inits = getInitials(usuario?.nombre);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: SB_BG }}>

      {/* Logo */}
      <Box
        onClick={() => go('/')}
        sx={{
          height: TOPBAR_H, flexShrink: 0,
          display: 'flex', alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          px: collapsed ? 0 : '18px', gap: 1.25,
          cursor: 'pointer',
          borderBottom: '1px solid rgba(255,255,255,0.04)',
        }}
      >
        <Box sx={{
          bgcolor: '#F59E0B',
          borderRadius: '9px',
          width: 32, height: 32,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
          boxShadow: '0 2px 8px rgba(245,158,11,0.3)',
        }}>
          <ConstructionIcon sx={{ color: '#fff', fontSize: 17 }} />
        </Box>
        {!collapsed && (
          <Box>
            <Typography sx={{
              fontWeight: 800, fontSize: 14.5, color: '#EDF2FF',
              letterSpacing: '-0.3px', lineHeight: 1.2,
            }}>
              ConstruApp
            </Typography>
            <Typography sx={{ fontSize: 9.5, color: '#2D3E5E', lineHeight: 1, letterSpacing: '0.2px' }}>
              Click Me · Costa Rica
            </Typography>
          </Box>
        )}
      </Box>

      {/* Nav */}
      <Box sx={{
        flex: 1, overflowY: 'auto', py: 2,
        '&::-webkit-scrollbar': { width: 3 },
        '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(255,255,255,0.06)', borderRadius: 3 },
      }}>
        {sections.map((section, si) => (
          <Box key={section.label} sx={{ mb: 0.5 }}>
            {!collapsed ? (
              <Typography sx={{
                fontSize: 10, fontWeight: 600, color: '#2A3A55',
                letterSpacing: '0.9px', textTransform: 'uppercase',
                px: '20px', pt: si > 0 ? 2 : 0.5, pb: '6px', display: 'block',
              }}>
                {section.label}
              </Typography>
            ) : si > 0 && (
              <Divider sx={{ borderColor: 'rgba(255,255,255,0.04)', mx: 2, my: 1.5 }} />
            )}
            <List disablePadding>
              {section.items.map(item => (
                <NavItem
                  key={item.path} item={item}
                  active={isActive(item.path)}
                  collapsed={collapsed}
                  onClick={() => go(item.path)}
                />
              ))}
            </List>
          </Box>
        ))}
      </Box>

      {/* User block */}
      <Box sx={{
        px: collapsed ? 0 : '10px',
        py: '12px',
        borderTop: '1px solid rgba(255,255,255,0.04)',
        flexShrink: 0,
      }}>
        {collapsed ? (
          <Tooltip title={`${usuario?.nombre ?? ''} · ${rol}`} placement="right">
            <Avatar
              onClick={() => navigate('/perfil')}
              sx={{
                bgcolor: bg, width: 34, height: 34,
                fontSize: 11.5, fontWeight: 700, cursor: 'pointer', mx: 'auto',
              }}
            >
              {inits}
            </Avatar>
          </Tooltip>
        ) : (
          <Box sx={{
            bgcolor: 'rgba(255,255,255,0.03)',
            borderRadius: '10px',
            border: '1px solid rgba(255,255,255,0.05)',
            p: '10px',
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 1.25 }}>
              <Avatar
                onClick={() => navigate('/perfil')}
                sx={{
                  bgcolor: bg, width: 34, height: 34,
                  fontSize: 11.5, fontWeight: 700, cursor: 'pointer', flexShrink: 0,
                }}
              >
                {inits}
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{
                  fontSize: 12.5, fontWeight: 600, color: '#C8D8F0',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.4,
                }}>
                  {usuario?.nombre}
                </Typography>
                <Typography sx={{ fontSize: 11, color: '#2D3E5E', lineHeight: 1.3 }}>{rol}</Typography>
              </Box>
            </Box>
            <Box
              onClick={() => { logout(); navigate('/login'); }}
              sx={{
                display: 'flex', alignItems: 'center', gap: 1,
                px: '8px', py: '6px', borderRadius: '7px', cursor: 'pointer',
                transition: 'background 0.15s',
                '&:hover': { bgcolor: 'rgba(239,68,68,0.1)' },
              }}
            >
              <LogoutIcon sx={{ fontSize: 13, color: '#EF4444' }} />
              <Typography sx={{ fontSize: 12, color: '#EF4444', fontWeight: 500 }}>
                Cerrar sesión
              </Typography>
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
}

// ── Layout ────────────────────────────────────────────────────────────────────

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed]   = useState(false);
  const { usuario, logout, tienePermiso } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const rol   = usuario?.rol ?? 'Cliente';
  const bg    = avatarBg(usuario?.nombre);
  const inits = getInitials(usuario?.nombre);

  const rawSections =
    rol === 'Admin'       ? SECTIONS_ADMIN :
    rol === 'Constructor' ? SECTIONS_CONSTRUCTOR :
    rol === 'Proveedor'   ? SECTIONS_PROVEEDOR :
    SECTIONS_CLIENTE;

  const sections = rawSections
    .map(s => ({ ...s, items: s.items.filter(i => !i.permiso || tienePermiso(i.permiso)) }))
    .filter(s => s.items.length > 0);

  const go       = (path) => { navigate(path); setMobileOpen(false); };
  const isActive = (path) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  const sidebarW = collapsed ? SIDEBAR_MINI : SIDEBAR_W;

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#F0F4F8' }}>

      {/* ── Desktop sidebar ─────────────────────────────────────────────── */}
      <Box sx={{
        width: sidebarW, flexShrink: 0,
        display: { xs: 'none', md: 'block' },
        transition: 'width 0.25s ease',
        position: 'relative',
      }}>
        <Box sx={{
          position: 'fixed', top: 0, left: 0,
          width: sidebarW, height: '100vh', zIndex: 1200,
          overflow: 'hidden', transition: 'width 0.25s ease',
          boxShadow: '1px 0 0 rgba(0,0,0,0.18)',
          bgcolor: SB_BG,
        }}>
          <SidebarContent
            sections={sections} isActive={isActive} go={go}
            collapsed={collapsed} usuario={usuario}
            logout={logout} navigate={navigate}
          />
        </Box>

        {/* Collapse toggle */}
        <Box sx={{
          position: 'fixed', top: TOPBAR_H / 2 - 11,
          left: sidebarW - 11, zIndex: 1300,
          display: { xs: 'none', md: 'flex' },
          transition: 'left 0.25s ease',
        }}>
          <IconButton
            size="small"
            onClick={() => setCollapsed(c => !c)}
            sx={{
              width: 22, height: 22, borderRadius: '50%',
              bgcolor: '#1A2540',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#4B5E7A',
              '&:hover': { bgcolor: '#243050', color: '#93B4FC' },
            }}
          >
            {collapsed
              ? <ChevronRightIcon sx={{ fontSize: 13 }} />
              : <ChevronLeftIcon  sx={{ fontSize: 13 }} />
            }
          </IconButton>
        </Box>
      </Box>

      {/* ── Mobile drawer ───────────────────────────────────────────────── */}
      <Drawer
        anchor="left" open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        PaperProps={{ sx: { width: SIDEBAR_W, bgcolor: SB_BG, border: 'none' } }}
        sx={{ display: { xs: 'block', md: 'none' } }}
      >
        <SidebarContent
          sections={sections} isActive={isActive} go={go}
          collapsed={false} usuario={usuario}
          logout={logout} navigate={navigate}
        />
      </Drawer>

      {/* ── Main area ───────────────────────────────────────────────────── */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* Topbar */}
        <Box
          component="header"
          sx={{
            position: 'sticky', top: 0, zIndex: 1100,
            height: TOPBAR_H, bgcolor: '#FFFFFF',
            borderBottom: '1px solid #E8EDF3',
            display: 'flex', alignItems: 'center',
            px: { xs: 2, md: '20px' }, gap: 2,
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}
        >
          {/* Mobile hamburger */}
          <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center', gap: 1.5, flexShrink: 0 }}>
            <IconButton onClick={() => setMobileOpen(true)} size="small" sx={{ color: '#64748B' }}>
              <MenuIcon sx={{ fontSize: 20 }} />
            </IconButton>
            <Box sx={{ bgcolor: '#F59E0B', borderRadius: '7px', p: '5px', display: 'flex' }}>
              <ConstructionIcon sx={{ color: '#fff', fontSize: 15 }} />
            </Box>
            <Typography sx={{ fontWeight: 800, fontSize: 13.5, color: '#0F172A' }}>
              ConstruApp
            </Typography>
          </Box>

          {/* Search */}
          <Box sx={{
            display: 'flex', alignItems: 'center', gap: 1.25,
            bgcolor: '#F8FAFC', border: '1.5px solid #E8EDF3',
            borderRadius: '9px', px: 1.5, height: 36,
            flex: 1, maxWidth: { xs: '100%', md: 380 },
            transition: 'all 0.15s',
            '&:focus-within': {
              bgcolor: '#fff', borderColor: '#6182F6',
              boxShadow: '0 0 0 3px rgba(97,130,246,0.1)',
            },
          }}>
            <SearchIcon sx={{ color: '#A0ADBF', fontSize: 15.5, flexShrink: 0 }} />
            <InputBase
              placeholder="Buscar proyectos, constructores..."
              sx={{
                fontSize: 13, flex: 1, color: '#1E293B',
                '& input::placeholder': { color: '#A0ADBF', fontSize: 13 },
                '& input': { padding: 0 },
              }}
            />
          </Box>

          <Box sx={{ flex: 1 }} />

          {/* Notificaciones */}
          <NotificacionesPanel />

          {/* User avatar */}
          <Tooltip title={`${usuario?.nombre ?? ''} — ${rol}`} arrow>
            <Avatar
              onClick={() => navigate('/perfil')}
              sx={{
                bgcolor: bg, width: 34, height: 34,
                fontSize: 12, fontWeight: 700, cursor: 'pointer',
                transition: 'opacity 0.15s',
                '&:hover': { opacity: 0.85 },
              }}
            >
              {inits}
            </Avatar>
          </Tooltip>
        </Box>

        {/* Page content */}
        <Box component="main" sx={{ flex: 1, p: { xs: 2, sm: 2.5, md: 3 } }}>
          <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
            <Outlet />
          </Box>
        </Box>

        {/* Footer */}
        <Box
          component="footer"
          sx={{
            borderTop: '1px solid #E8EDF3',
            bgcolor: '#fff',
            px: 3, py: 1.25,
            textAlign: 'center',
          }}
        >
          <Typography sx={{ fontSize: 11, color: '#A0ADBF', letterSpacing: '0.2px' }}>
            ConstruApp &middot; Click Me &middot; Costa Rica &middot; SC-603 Universidad Fidélitas
          </Typography>
        </Box>
      </Box>

      <ChatWidget />
    </Box>
  );
}
