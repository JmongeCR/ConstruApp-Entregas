import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Box, Typography, Button, Avatar, Chip } from '@mui/material';
import theme from './theme/theme';
import { AuthProvider, useAuth } from './context/AuthContext';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';

import Login          from './pages/auth/Login';
import Register       from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword  from './pages/auth/ResetPassword';
import MiPerfil       from './pages/perfil/MiPerfil';

function Home() {
  const { usuario, logout } = useAuth();
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#FAFBFD', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 3 }}>
      <Box sx={{ width: '100%', maxWidth: 480, bgcolor: '#fff', borderRadius: '16px', boxShadow: '0 4px 24px rgba(0,0,0,0.07)', p: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 4 }}>
          <Box sx={{ bgcolor: '#F59E0B', borderRadius: '10px', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🏗️</Box>
          <Typography sx={{ fontWeight: 800, fontSize: 18, color: '#0F172A' }}>ConstruApp</Typography>
          <Chip label="Sprint 1" size="small" sx={{ ml: 'auto', bgcolor: '#EFF6FF', color: '#2563EB', fontWeight: 600, fontSize: 11 }} />
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Avatar sx={{ bgcolor: '#1B3B7A', width: 48, height: 48, fontSize: 18, fontWeight: 700 }}>
            {usuario?.nombre?.charAt(0).toUpperCase()}
          </Avatar>
          <Box>
            <Typography sx={{ fontWeight: 700, fontSize: 16, color: '#0D1321' }}>{usuario?.nombre}</Typography>
            <Typography sx={{ fontSize: 13, color: '#7B8EA8' }}>{usuario?.email}</Typography>
          </Box>
        </Box>

        <Box sx={{ bgcolor: '#F8FAFC', borderRadius: '10px', p: 2, mb: 3 }}>
          <Typography sx={{ fontSize: 12, color: '#7B8EA8', mb: 0.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Rol</Typography>
          <Typography sx={{ fontSize: 14, color: '#1B3B7A', fontWeight: 600 }}>{usuario?.rol}</Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button component={Link} to="/perfil" variant="outlined" fullWidth
            sx={{ borderRadius: '10px', fontWeight: 600, fontSize: 13, borderColor: '#E0E7EF', color: '#1B3B7A',
              '&:hover': { borderColor: '#1B3B7A', bgcolor: '#EFF6FF' } }}>
            Editar perfil
          </Button>
          <Button onClick={logout} variant="contained" fullWidth
            sx={{ borderRadius: '10px', fontWeight: 600, fontSize: 13, bgcolor: '#1B3B7A',
              boxShadow: '0 4px 14px rgba(27,59,122,0.25)', '&:hover': { bgcolor: '#152F62' } }}>
            Cerrar sesión
          </Button>
        </Box>
      </Box>
    </Box>
  );
}

function PrivateRoute({ children }) {
  const { usuario } = useAuth();
  return usuario ? children : <Navigate to="/login" replace />;
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
      <Route path="/"                element={<PrivateRoute><Home /></PrivateRoute>} />
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
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
