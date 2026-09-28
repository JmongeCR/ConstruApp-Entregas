import { useAuth } from '../context/AuthContext';

/**
 * Hook para verificar permisos individuales.
 *
 * @param {string|string[]} codigo  Código(s) del permiso, ej: "proyectos.ver" o ["ia.usar","ia.cotizar"]
 * @param {'any'|'all'}     modo    'any' = al menos uno (por defecto), 'all' = todos
 * @returns {boolean}
 *
 * @example
 * const puedeVerProyectos = usePermiso('proyectos.ver');
 * const puedeAdminIA      = usePermiso(['ia.usar','ia.admin'], 'all');
 */
export function usePermiso(codigo, modo = 'any') {
  const { tienePermiso } = useAuth();

  if (Array.isArray(codigo)) {
    return modo === 'all'
      ? codigo.every(c  => tienePermiso(c))
      : codigo.some(c   => tienePermiso(c));
  }

  return tienePermiso(codigo);
}

export default usePermiso;
