import { useAuth } from '../../context/AuthContext';

/**
 * Wrapper condicional basado en permiso o rol.
 *
 * Props:
 *   permiso   {string}          Código de permiso requerido (ej: "ia.usar")
 *   permisos  {string[]}        Cualquiera de estos permisos es suficiente
 *   rol       {string|string[]} Rol(es) requerido(s) (alternativa a permiso)
 *   fallback  {ReactNode}       Qué renderizar si no tiene acceso (por defecto: null)
 *
 * Ejemplos:
 *   <ProtectedContent permiso="ia.usar">
 *     <BtnIA />
 *   </ProtectedContent>
 *
 *   <ProtectedContent rol={['Admin','Supervisor']} fallback={<p>Sin acceso</p>}>
 *     <PanelAdmin />
 *   </ProtectedContent>
 */
export default function ProtectedContent({ permiso, permisos, rol, fallback = null, children }) {
  const { tienePermiso, esRol } = useAuth();

  let tieneAcceso = false;

  if (permiso) {
    tieneAcceso = tienePermiso(permiso);
  } else if (permisos?.length) {
    tieneAcceso = permisos.some(p => tienePermiso(p));
  } else if (rol) {
    const roles = Array.isArray(rol) ? rol : [rol];
    tieneAcceso = esRol(...roles);
  } else {
    tieneAcceso = true; // sin restricción
  }

  return tieneAcceso ? children : fallback;
}
