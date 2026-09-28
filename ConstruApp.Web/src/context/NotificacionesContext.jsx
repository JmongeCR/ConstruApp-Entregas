import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { notificacionesApi } from '../api/endpoints';
import { useAuth } from './AuthContext';
import { useSignalR } from '../hooks/useSignalR';

const NotificacionesContext = createContext(null);

export function NotificacionesProvider({ children }) {
  const { usuario } = useAuth();
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const [notificaciones, setNotificaciones] = useState([]);
  const [noLeidas,       setNoLeidas]       = useState(0);
  const [cargando,       setCargando]       = useState(false);

  // ── Carga completa desde BD ────────────────────────────────────────────────
  const cargarNotificaciones = useCallback(async () => {
    if (!usuario) return;
    setCargando(true);
    try {
      const { data } = await notificacionesApi.getMias(1, 40);
      setNotificaciones(data);
      setNoLeidas(data.filter(n => !n.leida).length);
    } catch {
      // silencioso — no interrumpir UX
    } finally {
      setCargando(false);
    }
  }, [usuario]);

  // ── Manejar notificación en tiempo real desde SignalR ──────────────────────
  const onNuevaNotificacion = useCallback((notif) => {
    setNotificaciones(prev => {
      // Evitar duplicados
      if (prev.some(n => n.id === notif.id)) return prev;
      return [notif, ...prev];
    });
    setNoLeidas(prev => prev + 1);
  }, []);

  // ── Conexión SignalR (reemplaza el polling de 30 s) ────────────────────────
  useSignalR(usuario ? token : null, {
    NuevaNotificacion: onNuevaNotificacion,
  });

  // ── Cargar al autenticarse / limpiar al cerrar sesión ─────────────────────
  useEffect(() => {
    if (!usuario) {
      setNotificaciones([]);
      setNoLeidas(0);
      return;
    }
    cargarNotificaciones();
  }, [usuario?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Acciones ───────────────────────────────────────────────────────────────
  const marcarLeida = useCallback(async (id) => {
    try {
      await notificacionesApi.marcarLeida(id);
      setNotificaciones(prev =>
        prev.map(n => n.id === id ? { ...n, leida: true } : n)
      );
      setNoLeidas(prev => Math.max(0, prev - 1));
    } catch { /* silencioso */ }
  }, []);

  const marcarTodas = useCallback(async () => {
    try {
      await notificacionesApi.marcarTodas();
      setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })));
      setNoLeidas(0);
    } catch { /* silencioso */ }
  }, []);

  const eliminar = useCallback(async (id) => {
    const prev = notificaciones.find(n => n.id === id);
    try {
      await notificacionesApi.eliminar(id);
      setNotificaciones(p => p.filter(n => n.id !== id));
      if (prev && !prev.leida) setNoLeidas(c => Math.max(0, c - 1));
    } catch { /* silencioso */ }
  }, [notificaciones]);

  const limpiarLeidas = useCallback(async () => {
    try {
      await notificacionesApi.limpiarLeidas();
      setNotificaciones(prev => prev.filter(n => !n.leida));
    } catch { /* silencioso */ }
  }, []);

  return (
    <NotificacionesContext.Provider value={{
      notificaciones,
      noLeidas,
      cargando,
      cargarNotificaciones,
      marcarLeida,
      marcarTodas,
      eliminar,
      limpiarLeidas,
    }}>
      {children}
    </NotificacionesContext.Provider>
  );
}

export const useNotificaciones = () => useContext(NotificacionesContext);
