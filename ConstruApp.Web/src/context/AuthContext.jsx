import { createContext, useContext, useState, useCallback } from 'react';
import { authApi } from '../api/endpoints';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => {
    const saved = localStorage.getItem('usuario');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(false);

  const _guardar = (data) => {
    localStorage.setItem('token',   data.token);
    localStorage.setItem('usuario', JSON.stringify(data));
    setUsuario(data);
  };

  const login = async (email, password) => {
    setLoading(true);
    try {
      const { data } = await authApi.login({ email, password });
      _guardar(data);
      return { ok: true };
    } catch (err) {
      return {
        ok:      false,
        status:  err.response?.status,
        message: err.response?.data?.message || 'Credenciales inválidas',
      };
    } finally {
      setLoading(false);
    }
  };

  const register = async (formData) => {
    setLoading(true);
    try {
      const { data } = await authApi.register(formData);
      // Nuevo flujo: el backend devuelve solo { message }, sin token
      if (!data.token) return { ok: true, pending: true, message: data.message };
      _guardar(data);
      return { ok: true };
    } catch (err) {
      const errors = err.response?.data;
      const msg = Array.isArray(errors)
        ? errors.map(e => e.description).join(', ')
        : errors?.message || 'Error al registrarse';
      return { ok: false, message: msg };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    setUsuario(null);
  };

  /** Verifica si el usuario tiene al menos uno de los roles indicados */
  const esRol = useCallback(
    (...roles) => roles.includes(usuario?.rol),
    [usuario?.rol]
  );

  /**
   * Verifica si el usuario tiene un permiso activo.
   * Admin siempre devuelve true.
   * @param {string} codigo  Ej: "proyectos.ver"
   */
  const tienePermiso = useCallback(
    (codigo) => {
      if (!usuario) return false;
      if (usuario.rol === 'Admin') return true;
      return Array.isArray(usuario.permisos) && usuario.permisos.includes(codigo);
    },
    [usuario]
  );

  const actualizarUsuario = (data) => {
    const merged = { ...usuario, ...data };
    localStorage.setItem('usuario', JSON.stringify(merged));
    setUsuario(merged);
  };

  return (
    <AuthContext.Provider value={{ usuario, setUsuario: actualizarUsuario, loading, login, register, logout, esRol, tienePermiso }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
