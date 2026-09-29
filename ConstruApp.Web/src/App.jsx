import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Box, Typography, Avatar, Button, IconButton, Tooltip, Divider, Menu, MenuItem, ListItemIcon } from '@mui/material';
import theme from './theme/theme';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificacionesProvider } from './context/NotificacionesContext';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';

import DashboardIcon        from '@mui/icons-material/DashboardOutlined';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import PersonOutlineIcon    from '@mui/icons-material/PersonOutlined';
import LogoutIcon           from '@mui/icons-material/Logout';

import Login          from './pages/auth/Login';
import Register       from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword  from './pages/auth/ResetPassword';
import MiPerfil       from './pages/perfil/MiPerfil';
import Dashboard      from './pages/dashboard/Dashboard';
import { useState } from 'react';

const NAV_LINKS = [
  { label: 'Dashboard',   path: '/',      Icon: DashboardIcon,          roles: ['Admin','Cliente','Constructor','Proveedor'] },
  { label: 'Panel admin', path: '/admin', Icon: AdminPanelSettingsIcon, roles: ['Admin'] },
];

function TopNav() {
  const { usuario, logout } = useAuth();
  const navigate   = useNavigate();
  const location   = useLocation();
  const [anchor, setAnchor] = useState(null);

  if (!usuario) return null;

  const initials = usuario.nombre?.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase() ?? '?';
  const links    = NAV_LINKS.filter(l => l.roles.includes(usuario.rol));

  return (
    <Box component="header" sx={{
      position: 'sticky', top: 0, zIndex: 100,
      bgcolor: '#fff', borderBottom: '1px solid #E2E8F0',
      px: { xs: 2, sm: 3 }, height: 56,
      display: 'flex', alignItems: 'center', gap: 3,
    }}>
      {/* Logo */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer', flexShrink: 0 }}
        onClick={() => navigate('/')}>
        <Box sx={{
          width: 30, height: 30, borderRadius: '8px', bgcolor: '#0F172A',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15,
        }}>🏗</Box>
        <Typography sx={{ fontWeight: 800, fontSize: 15, color: '#0F172A', letterSpacing: '-0.3px' }}>
          ConstruApp
        </Typography>
      </Box>

      <Divider orientation="vertical" flexItem sx={{ my: 1.5 }} />

      {/* Nav links */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flex: 1 }}>
        {links.map(({ label, path, Icon }) => {
          const active = location.pathname === path;
          return (
            <Button key={path} startIcon={<Icon sx={{ fontSize: '16px !important' }} />}
              onClick={() => navigate(path)}
              sx={{
                fontSize: 13, fontWeight: 600, borderRadius: '8px',
                px: 1.5, py: 0.7, textTransform: 'none',
                color:   active ? '#1B3B7A' : '#64748B',
                bgcolor: active ? '#EFF6FF'  : 'transparent',
                '&:hover': { bgcolor: active ? '#EFF6FF' : '#F8FAFC', color: '#0F172A' },
              }}>
              {label}
            </Button>
          );
        })}
      </Box>

      {/* User menu */}
      <Tooltip title={usuario.nombre}>
        <IconButton size="small" onClick={e => setAnchor(e.currentTarget)} sx={{ p: 0.25 }}>
          <Avatar sx={{ width: 32, height: 32, bgcolor: '#1B3B7A', fontSize: 13, fontWeight: 700 }}>
            {initials}
          </Avatar>
        </IconButton>
      </Tooltip>

      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        slotProps={{ paper: { sx: { mt: 0.5, minWidth: 200, borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.10)' } } }}>
        <Box sx={{ px: 2, py: 1.25 }}>
          <Typography fontSize={13} fontWeight={700} color="text.primary">{usuario.nombre}</Typography>
          <Typography fontSize={12} color="text.secondary">{usuario.email}</Typography>
          <Typography fontSize={11} sx={{ mt: 0.25, px: 0.75, py: 0.2, bgcolor: '#EFF6FF', color: '#1B3B7A', borderRadius: '4px', display: 'inline-block', fontWeight: 600 }}>
            {usuario.rol}
          </Typography>
        </Box>
        <Divider />
        <MenuItem onClick={() => { setAnchor(null); navigate('/perfil'); }} sx={{ fontSize: 13, gap: 1.5, py: 1 }}>
          <ListItemIcon><PersonOutlineIcon fontSize="small" /></ListItemIcon>
          Mi perfil
        </MenuItem>
        <MenuItem onClick={() => { setAnchor(null); logout(); }} sx={{ fontSize: 13, color: '#DC2626', gap: 1.5, py: 1 }}>
          <ListItemIcon><LogoutIcon fontSize="small" sx={{ color: '#DC2626' }} /></ListItemIcon>
          Cerrar sesión
        </MenuItem>
      </Menu>
    </Box>
  );
}

function AppLayout({ children }) {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#F8FAFC' }}>
      <TopNav />
      <Box sx={{ maxWidth: 1200, mx: 'auto', px: { xs: 2, sm: 3 }, py: 3 }}>
        {children}
      </Box>
    </Box>
  );
}

function PrivateRoute({ children }) {
  const { usuario } = useAuth();
  return usuario ? <AppLayout>{children}</AppLayout> : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const { usuario } = useAuth();
  return !usuario ? children : <Navigate to="/" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login"           element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register"        element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
      <Route path="/reset-password"  element={<ResetPassword />} />
      <Route path="/"                element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/perfil"          element={<PrivateRoute><MiPerfil /></PrivateRoute>} />
      <Route path="*"                element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <NotificacionesProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </NotificacionesProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
