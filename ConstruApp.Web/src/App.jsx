import { BrowserRouter, Routes, Route, Navigate, Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Box, Typography, Avatar, Tooltip, Divider, Menu, MenuItem, ListItemIcon, CircularProgress, Button } from '@mui/material';
import theme from './theme/theme';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificacionesProvider } from './context/NotificacionesContext';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import { useState, lazy, Suspense, Component } from 'react';

import DashboardIcon            from '@mui/icons-material/DashboardOutlined';
import AdminPanelSettingsIcon   from '@mui/icons-material/AdminPanelSettings';
import PersonOutlineIcon        from '@mui/icons-material/PersonOutlined';
import LogoutIcon               from '@mui/icons-material/Logout';
import EngineeringIcon          from '@mui/icons-material/Engineering';
import FavoriteBorderIcon       from '@mui/icons-material/FavoriteBorder';
import SettingsOutlinedIcon     from '@mui/icons-material/SettingsOutlined';
import FolderOpenOutlinedIcon   from '@mui/icons-material/FolderOpenOutlined';
import StoreOutlinedIcon        from '@mui/icons-material/StoreOutlined';
import AutoAwesomeOutlinedIcon  from '@mui/icons-material/AutoAwesomeOutlined';
import TimelineOutlinedIcon     from '@mui/icons-material/TimelineOutlined';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import HandymanOutlinedIcon     from '@mui/icons-material/HandymanOutlined';
import HomeRepairServiceOutlinedIcon from '@mui/icons-material/HomeRepairServiceOutlined';
import PeopleOutlinedIcon       from '@mui/icons-material/PeopleOutlined';

// ── Lazy imports ──────────────────────────────────────────────────────────────
const Dashboard          = lazy(() => import('./pages/dashboard/Dashboard'));
const MiPerfil           = lazy(() => import('./pages/perfil/MiPerfil'));
const PublicarProyecto   = lazy(() => import('./pages/proyectos/PublicarProyecto'));
const MisProyectos       = lazy(() => import('./pages/proyectos/MisProyectos'));
const Proyectos          = lazy(() => import('./pages/proyectos/Proyectos'));
const Trabajadores       = lazy(() => import('./pages/trabajadores/Trabajadores'));
const ProveedoresFavoritos = lazy(() => import('./pages/favoritos/ProveedoresFavoritos'));
const Marketplace        = lazy(() => import('./pages/marketplace/Marketplace'));
const CotizacionesIA     = lazy(() => import('./pages/cotizaciones-ia/CotizacionesIA'));
const Cronograma         = lazy(() => import('./pages/cronograma/Cronograma'));
const Calendario         = lazy(() => import('./pages/calendario/Calendario'));
const AdminPanel         = lazy(() => import('./pages/admin/AdminPanel'));
const ObraDetalle        = lazy(() => import('./pages/obra/ObraDetalle'));
const MisClientes        = lazy(() => import('./pages/constructor/MisClientes'));
const MisPropuestas      = lazy(() => import('./pages/propuestas/Propuestas').then(m => ({ default: m.MisPropuestas })));
const PropuestasProyecto = lazy(() => import('./pages/propuestas/Propuestas').then(m => ({ default: m.PropuestasProyecto })));
const Cotizaciones       = lazy(() => import('./pages/cotizaciones/Cotizaciones'));
const CotizacionDetalle  = lazy(() => import('./pages/cotizacion/CotizacionDetalle'));
const Facturacion        = lazy(() => import('./pages/facturacion/Facturacion'));
const FacturaNueva       = lazy(() => import('./pages/facturacion/FacturaNueva'));
const FacturaDetalle     = lazy(() => import('./pages/facturacion/FacturaDetalle'));
const Notificaciones     = lazy(() => import('./pages/notificaciones/Notificaciones'));
const Calificaciones     = lazy(() => import('./pages/calificaciones/Calificaciones'));
const IAEmpresarial      = lazy(() => import('./pages/ia/IAEmpresarial'));
const Configuracion      = lazy(() => import('./pages/configuracion/Configuracion'));
const Documentos         = lazy(() => import('./pages/documentos/Documentos'));
const CampoApp           = lazy(() => import('./pages/campo/CampoApp'));
const Materiales         = lazy(() => import('./pages/materiales/Materiales'));
const Bitacora           = lazy(() => import('./pages/bitacora/Bitacora'));
const Asistencias        = lazy(() => import('./pages/asistencias/Asistencias'));
const PerfilesConstructor = lazy(() => import('./pages/perfiles/PerfilesConstructor'));
const PerfilConstructorPublico = lazy(() => import('./pages/perfiles/PerfilConstructorPublico'));
const PerfilProveedorEdit    = lazy(() => import('./pages/perfiles/PerfilProveedorEdit'));
const PerfilConstructorEdit  = lazy(() => import('./pages/perfiles/PerfilConstructorEdit'));
const PerfilesFerreteria = lazy(() => import('./pages/perfiles/PerfilesFerreteria'));
const ExplorarConstructores = lazy(() => import('./pages/publico/ExplorarConstructores'));
const AceptarInvitacion  = lazy(() => import('./pages/invitacion/AceptarInvitacion'));
const ActivarCuenta      = lazy(() => import('./pages/invitacion/ActivarCuenta'));

// Auth pages (NOT lazy — tiny and always needed)
import Login          from './pages/auth/Login';
import Register       from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword  from './pages/auth/ResetPassword';

const NAV_HEIGHT = 52;

const NAV_LINKS = [
  { label: 'Dashboard',        path: '/',                      Icon: DashboardIcon,             roles: ['Admin','Cliente','Constructor','Proveedor'] },
  { label: 'Panel admin',      path: '/admin',                 Icon: AdminPanelSettingsIcon,     roles: ['Admin'] },
  { label: 'Mis proyectos',    path: '/mis-proyectos',         Icon: FolderOpenOutlinedIcon,     roles: ['Cliente'] },
  { label: 'Constructores',    path: '/marketplace',           Icon: StoreOutlinedIcon,          roles: ['Cliente'] },
  { label: 'Cotizaciones IA',  path: '/cotizaciones-ia',       Icon: AutoAwesomeOutlinedIcon,    roles: ['Cliente'] },
  { label: 'Cronograma',       path: '/cronograma',            Icon: TimelineOutlinedIcon,       roles: ['Cliente'] },
  { label: 'Calendario',       path: '/calendario',            Icon: CalendarMonthOutlinedIcon,  roles: ['Cliente'] },
  { label: 'Mis trabajadores', path: '/trabajadores',          Icon: EngineeringIcon,            roles: ['Constructor'] },
  { label: 'Mis clientes',     path: '/mis-clientes',          Icon: PeopleOutlinedIcon,         roles: ['Constructor'] },
  { label: 'Mis propuestas',   path: '/propuestas',            Icon: HomeRepairServiceOutlinedIcon, roles: ['Constructor'] },
  { label: 'Proveedores fav.', path: '/favoritos-proveedores', Icon: FavoriteBorderIcon,         roles: ['Constructor'] },
  { label: 'Mi empresa',       path: '/mi-empresa',            Icon: HandymanOutlinedIcon,        roles: ['Constructor'] },
];

// ── Error Boundary ────────────────────────────────────────────────────────────
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 2, textAlign: 'center', px: 3 }}>
          <Typography variant="h5" fontWeight={700} color="error">Algo salió mal</Typography>
          <Typography color="text.secondary" sx={{ maxWidth: 400 }}>
            Ocurrió un error inesperado en esta pantalla. El resto de la aplicación sigue funcionando.
          </Typography>
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Button variant="contained" onClick={() => this.setState({ hasError: false, error: null })}>
              Reintentar
            </Button>
            <Button variant="outlined" component={Link} to="/">
              Volver al Dashboard
            </Button>
          </Box>
        </Box>
      );
    }
    return this.props.children;
  }
}

// ── Page loader fallback ──────────────────────────────────────────────────────
function PageLoader() {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
      <CircularProgress size={32} />
    </Box>
  );
}

// ── 404 ───────────────────────────────────────────────────────────────────────
function NotFound() {
  const navigate = useNavigate();
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 2, textAlign: 'center', px: 3 }}>
      <Typography sx={{ fontSize: 72, fontWeight: 800, color: '#E2E8F0', lineHeight: 1 }}>404</Typography>
      <Typography variant="h5" fontWeight={700}>Página no encontrada</Typography>
      <Typography color="text.secondary">La ruta que buscás no existe o no tenés acceso.</Typography>
      <Button variant="contained" onClick={() => navigate('/')}>Volver al Dashboard</Button>
    </Box>
  );
}

// ── TopNav ────────────────────────────────────────────────────────────────────
function TopNav() {
  const { usuario, logout } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [anchor, setAnchor] = useState(null);

  if (!usuario) return null;

  const links    = NAV_LINKS.filter(l => l.roles.includes(usuario.rol));
  const initials = usuario.nombre?.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase() ?? '?';

  const isActive = (path) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  const NavBtn = ({ path, Icon, label }) => {
    const active = isActive(path);
    return (
      <Tooltip title={label} placement="bottom" arrow>
        <Box onClick={() => navigate(path)} sx={{
          width: 38, height: 38, borderRadius: '8px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
          bgcolor: active ? 'rgba(96,165,250,0.15)' : 'transparent',
          borderBottom: active ? '2px solid #60A5FA' : '2px solid transparent',
          '&:hover': { bgcolor: active ? 'rgba(96,165,250,0.15)' : 'rgba(255,255,255,0.07)' },
        }}>
          <Icon sx={{ fontSize: 20, color: active ? '#60A5FA' : '#E2E8F0' }} />
        </Box>
      </Tooltip>
    );
  };

  return (
    <Box sx={{
      position: 'fixed', top: 0, left: 0, right: 0, height: NAV_HEIGHT,
      bgcolor: '#0F172A',
      borderBottom: '1px solid rgba(255,255,255,0.07)',
      display: 'flex', alignItems: 'center',
      px: 2, gap: 0.5, zIndex: 200,
    }}>
      <Box onClick={() => navigate('/')} sx={{
        display: 'flex', alignItems: 'center', gap: 1,
        cursor: 'pointer', mr: 1.5, flexShrink: 0,
      }}>
        <Box sx={{
          width: 28, height: 28, borderRadius: '7px', bgcolor: '#2563EB',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <HandymanOutlinedIcon sx={{ fontSize: 17, color: '#fff' }} />
        </Box>
        <Typography sx={{ fontWeight: 800, fontSize: 13.5, color: '#F1F5F9', letterSpacing: '-0.3px' }}>
          ConstruApp
        </Typography>
      </Box>

      <Box sx={{ width: '1px', height: 18, bgcolor: 'rgba(255,255,255,0.1)', mx: 0.5, flexShrink: 0 }} />

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, flex: 1 }}>
        {links.map(({ label, path, Icon }) => (
          <NavBtn key={path} path={path} Icon={Icon} label={label} />
        ))}
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
        <Box onClick={e => setAnchor(e.currentTarget)} sx={{
          display: 'flex', alignItems: 'center', gap: 0.75,
          cursor: 'pointer', ml: 0.5, px: 1, py: 0.5,
          borderRadius: '8px',
          '&:hover': { bgcolor: 'rgba(255,255,255,0.06)' },
        }}>
          <Avatar sx={{ width: 24, height: 24, bgcolor: '#1E40AF', fontSize: 9.5, fontWeight: 700 }}>
            {initials}
          </Avatar>
          <Box>
            <Typography sx={{ fontSize: 11.5, fontWeight: 600, color: '#E2E8F0', lineHeight: 1.2 }}>
              {usuario.nombre?.split(' ')[0]}
            </Typography>
            <Typography sx={{ fontSize: 9.5, color: '#475569', lineHeight: 1.2 }}>
              {usuario.rol}
            </Typography>
          </Box>
        </Box>
      </Box>

      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        slotProps={{ paper: { sx: { minWidth: 210, borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.15)', mt: 0.5 } } }}>
        <Box sx={{ px: 2, py: 1.25 }}>
          <Typography fontSize={13} fontWeight={700}>{usuario.nombre}</Typography>
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
        <MenuItem onClick={() => { setAnchor(null); navigate('/configuracion'); }} sx={{ fontSize: 13, gap: 1.5, py: 1 }}>
          <ListItemIcon><SettingsOutlinedIcon fontSize="small" /></ListItemIcon>
          Configuración
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => { setAnchor(null); logout(); }} sx={{ fontSize: 13, color: '#DC2626', gap: 1.5, py: 1 }}>
          <ListItemIcon><LogoutIcon fontSize="small" sx={{ color: '#DC2626' }} /></ListItemIcon>
          Cerrar sesión
        </MenuItem>
      </Menu>
    </Box>
  );
}

function AppLayout() {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#F8FAFC' }}>
      <TopNav />
      <Box sx={{ pt: `${NAV_HEIGHT}px` }}>
        <Box sx={{ maxWidth: 1200, mx: 'auto', px: { xs: 2, sm: 3 }, py: 3 }}>
          <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <Outlet />
            </Suspense>
          </ErrorBoundary>
        </Box>
      </Box>
    </Box>
  );
}

function PrivateLayout() {
  const { usuario } = useAuth();
  return usuario ? <AppLayout /> : <Navigate to="/login" replace />;
}

function RoleGuard({ roles, children }) {
  const { usuario } = useAuth();
  if (!usuario) return <Navigate to="/login" replace />;
  if (!roles.includes(usuario.rol)) return <Navigate to="/" replace />;
  return children;
}

function PublicRoute({ children }) {
  const { usuario } = useAuth();
  return !usuario ? children : <Navigate to="/" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Públicas */}
      <Route path="/login"              element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register"           element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/forgot-password"    element={<PublicRoute><ForgotPassword /></PublicRoute>} />
      <Route path="/reset-password"     element={<ResetPassword />} />
      <Route path="/invitacion/:token"  element={<Suspense fallback={<PageLoader />}><AceptarInvitacion /></Suspense>} />
      <Route path="/activar/:token"     element={<Suspense fallback={<PageLoader />}><ActivarCuenta /></Suspense>} />

      {/* Privadas */}
      <Route element={<PrivateLayout />}>
        {/* Comunes */}
        <Route path="/"                        element={<Dashboard />} />
        <Route path="/perfil"                  element={<MiPerfil />} />
        <Route path="/configuracion"           element={<Configuracion />} />
        <Route path="/notificaciones"          element={<Notificaciones />} />
        <Route path="/calificaciones"          element={<Calificaciones />} />

        {/* Admin */}
        <Route path="/admin"                   element={<RoleGuard roles={['Admin']}><AdminPanel /></RoleGuard>} />

        {/* Cliente */}
        <Route path="/mis-proyectos"           element={<RoleGuard roles={['Cliente','Admin']}><MisProyectos /></RoleGuard>} />
        <Route path="/publicar"                element={<RoleGuard roles={['Cliente','Admin']}><PublicarProyecto /></RoleGuard>} />
        <Route path="/marketplace"             element={<RoleGuard roles={['Cliente','Admin','Constructor']}><Marketplace /></RoleGuard>} />
        <Route path="/cotizaciones-ia"         element={<RoleGuard roles={['Cliente','Admin']}><CotizacionesIA /></RoleGuard>} />
        <Route path="/cronograma"              element={<RoleGuard roles={['Cliente','Admin']}><Cronograma /></RoleGuard>} />
        <Route path="/calendario"             element={<RoleGuard roles={['Cliente','Admin']}><Calendario /></RoleGuard>} />
        <Route path="/cotizaciones"            element={<RoleGuard roles={['Cliente','Admin']}><Cotizaciones /></RoleGuard>} />
        <Route path="/cotizacion/:proyectoId"   element={<RoleGuard roles={['Cliente','Admin']}><CotizacionDetalle /></RoleGuard>} />
        <Route path="/ia"                      element={<RoleGuard roles={['Cliente','Admin']}><IAEmpresarial /></RoleGuard>} />

        {/* Constructor */}
        <Route path="/trabajadores"            element={<RoleGuard roles={['Constructor','Admin']}><Trabajadores /></RoleGuard>} />
        <Route path="/mis-clientes"            element={<RoleGuard roles={['Constructor','Admin']}><MisClientes /></RoleGuard>} />
        <Route path="/propuestas"              element={<RoleGuard roles={['Constructor','Admin']}><MisPropuestas /></RoleGuard>} />
        <Route path="/propuestas/:proyectoId"  element={<RoleGuard roles={['Cliente','Admin']}><PropuestasProyecto /></RoleGuard>} />
        <Route path="/favoritos-proveedores"   element={<RoleGuard roles={['Constructor','Admin']}><ProveedoresFavoritos /></RoleGuard>} />
        <Route path="/perfiles/constructor"    element={<PerfilesConstructor />} />
        <Route path="/mi-empresa"              element={<RoleGuard roles={['Constructor','Admin']}><PerfilConstructorEdit /></RoleGuard>} />
        <Route path="/perfil-proveedor"        element={<RoleGuard roles={['Proveedor','Admin']}><PerfilProveedorEdit /></RoleGuard>} />
        <Route path="/mi-perfil-proveedor"     element={<RoleGuard roles={['Proveedor','Admin']}><PerfilProveedorEdit /></RoleGuard>} />
        <Route path="/perfiles/ferreteria"     element={<RoleGuard roles={['Proveedor','Admin']}><PerfilesFerreteria /></RoleGuard>} />

        {/* Compartidas */}
        <Route path="/obra/:id"                element={<ObraDetalle />} />
        <Route path="/proyectos"               element={<Proyectos />} />
        <Route path="/documentos"              element={<Documentos />} />
        <Route path="/campo"                   element={<CampoApp />} />
        <Route path="/materiales"              element={<Materiales />} />
        <Route path="/bitacora"                element={<Bitacora />} />
        <Route path="/asistencias"             element={<Asistencias />} />
        <Route path="/facturacion"             element={<Facturacion />} />
        <Route path="/facturacion/nueva"       element={<FacturaNueva />} />
        <Route path="/facturacion/:id"         element={<FacturaDetalle />} />
        <Route path="/explorar/constructores"  element={<ExplorarConstructores />} />
        <Route path="/constructor/:id"         element={<PerfilConstructorPublico />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
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
