import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Box, Typography } from '@mui/material';
import theme from './theme/theme';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificacionesProvider } from './context/NotificacionesContext';
import '@fontsource/inter/300.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/inter/800.css';

import Layout from './components/layout/Layout';

// Auth
import Login           from './pages/auth/Login';
import Register        from './pages/auth/Register';
import ForgotPassword  from './pages/auth/ForgotPassword';
import ResetPassword   from './pages/auth/ResetPassword';

// Pública (sin login)
import ExplorarConstructores from './pages/publico/ExplorarConstructores';

// App (requiere login)
import Dashboard        from './pages/dashboard/Dashboard';
import PublicarProyecto from './pages/proyectos/PublicarProyecto';
import MisProyectos     from './pages/proyectos/MisProyectos';
import Marketplace      from './pages/marketplace/Marketplace';
import { MisPropuestas, PropuestasProyecto } from './pages/propuestas/Propuestas';
import CotizacionDetalle        from './pages/cotizacion/CotizacionDetalle';
import CotizacionesIA           from './pages/cotizaciones-ia/CotizacionesIA';
import PerfilConstructorEdit    from './pages/perfiles/PerfilConstructorEdit';
import PerfilProveedorEdit      from './pages/perfiles/PerfilProveedorEdit';
import PerfilConstructorPublico from './pages/perfiles/PerfilConstructorPublico';
import ObraDetalle      from './pages/obra/ObraDetalle';
import MisClientes      from './pages/constructor/MisClientes';
import Facturacion      from './pages/facturacion/Facturacion';
import FacturaNueva     from './pages/facturacion/FacturaNueva';
import FacturaDetalle   from './pages/facturacion/FacturaDetalle';
import Configuracion           from './pages/configuracion/Configuracion';
import ConfiguracionFinanciero from './pages/configuracion/ConfiguracionFinanciero';
import Calificaciones   from './pages/calificaciones/Calificaciones';
import AdminPanel       from './pages/admin/AdminPanel';
import MiPerfil        from './pages/perfil/MiPerfil';
import Cronograma      from './pages/cronograma/Cronograma';
import Documentos      from './pages/documentos/Documentos';
import Calendario      from './pages/calendario/Calendario';
import CampoApp        from './pages/campo/CampoApp';
import IAEmpresarial   from './pages/ia/IAEmpresarial';
import Notificaciones  from './pages/notificaciones/Notificaciones';
import Fases           from './pages/fases/Fases';
import Materiales      from './pages/materiales/Materiales';
import PerfilesConstructor from './pages/perfiles/PerfilesConstructor';
import PerfilesFerreteria  from './pages/perfiles/PerfilesFerreteria';
import AceptarInvitacion   from './pages/invitacion/AceptarInvitacion';
import ActivarCuenta       from './pages/invitacion/ActivarCuenta';

// Módulos en desarrollo
function EnDesarrollo({ titulo }) {
  return (
    <Box sx={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:320, gap:2 }}>
      <Box sx={{ width:64, height:64, borderRadius:'16px', bgcolor:'#F1F5F9', display:'flex', alignItems:'center', justifyContent:'center', fontSize:28 }}>🔧</Box>
      <Typography variant="h6" fontWeight={700} color="text.primary">{titulo || 'En desarrollo'}</Typography>
      <Typography color="text.secondary" fontSize={14} textAlign="center" maxWidth={360}>
        Este módulo está en desarrollo y estará disponible en una próxima actualización.
      </Typography>
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
      {/* ── Rutas completamente públicas ── */}
      <Route path="/explorar"           element={<ExplorarConstructores />} />
      <Route path="/login"              element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register"           element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/forgot-password"    element={<PublicRoute><ForgotPassword /></PublicRoute>} />
      <Route path="/reset-password"     element={<ResetPassword />} />
      <Route path="/invitacion/:token"  element={<AceptarInvitacion />} />
      <Route path="/activar/:token"     element={<ActivarCuenta />} />

      {/* ── Rutas protegidas (requieren sesión) ── */}
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<Dashboard />} />

        {/* Proyectos */}
        <Route path="publicar"              element={<PublicarProyecto />} />
        <Route path="mis-proyectos"         element={<MisProyectos />} />

        {/* Marketplace */}
        <Route path="marketplace"           element={<Marketplace />} />

        {/* Propuestas */}
        <Route path="mis-propuestas"        element={<MisPropuestas />} />
        <Route path="propuestas/:proyectoId" element={<PropuestasProyecto />} />

        {/* Obra workspace */}
        <Route path="obra/:proyectoId"       element={<ObraDetalle />} />

        {/* Constructor */}
        <Route path="mis-clientes"           element={<MisClientes />} />

        {/* Cotización IA */}
        <Route path="cotizacion/:proyectoId" element={<CotizacionDetalle />} />
        <Route path="cotizaciones-ia"        element={<CotizacionesIA />} />

        {/* Perfiles */}
        <Route path="mi-perfil-constructor" element={<PerfilConstructorEdit />} />
        <Route path="mi-perfil-proveedor"   element={<PerfilProveedorEdit />} />
        <Route path="constructor/:id"       element={<PerfilConstructorPublico />} />

        {/* Perfil universal */}
        <Route path="perfil"                element={<MiPerfil />} />

        {/* Facturación */}
        <Route path="facturacion"           element={<Facturacion />} />
        <Route path="facturacion/nueva"     element={<FacturaNueva />} />
        <Route path="facturacion/:id"       element={<FacturaDetalle />} />

        {/* Configuración */}
        <Route path="configuracion"           element={<Configuracion />} />
        <Route path="configuracion/financiero" element={<ConfiguracionFinanciero />} />

        {/* Cronograma, Documentos, Calendario */}
        <Route path="cronograma"            element={<Cronograma />} />
        <Route path="documentos"            element={<Documentos />} />
        <Route path="calendario"            element={<Calendario />} />

        {/* IA Empresarial */}
        <Route path="ia"                    element={<IAEmpresarial />} />

        {/* Calificaciones y Admin */}
        <Route path="calificaciones"        element={<Calificaciones />} />
        <Route path="admin"                 element={<AdminPanel />} />

        {/* Notificaciones */}
        <Route path="notificaciones"        element={<Notificaciones />} />

        {/* Módulos adicionales activos */}
        <Route path="fases"                  element={<Fases />} />
        <Route path="materiales"             element={<Materiales />} />
        <Route path="perfiles-constructores" element={<PerfilesConstructor />} />
        <Route path="perfiles-ferreteria"    element={<PerfilesFerreteria />} />

        {/* Módulos en desarrollo */}
        <Route path="bitacora"     element={<EnDesarrollo titulo="Bitácora de Obra" />} />
        <Route path="asistencias"  element={<EnDesarrollo titulo="Control de Asistencias" />} />
        <Route path="trabajadores" element={<EnDesarrollo titulo="Gestión de Trabajadores" />} />
        <Route path="cuadrillas"   element={<EnDesarrollo titulo="Cuadrillas de Trabajo" />} />
      </Route>

      {/* ── PWA Campo (sin Layout — pantalla completa mobile) ── */}
      <Route path="/campo" element={<PrivateRoute><CampoApp /></PrivateRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
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
