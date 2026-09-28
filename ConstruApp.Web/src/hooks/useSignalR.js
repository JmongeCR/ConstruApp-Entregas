import { useEffect, useRef, useCallback } from 'react';
import * as signalR from '@microsoft/signalr';

const HUB_URL = `${import.meta.env.VITE_API_URL?.replace('/api', '') ?? 'http://localhost:5115'}/hubs/notificaciones`;

/**
 * useSignalR — conexión autenticada al NotificacionHub.
 *
 * @param {string|null} token  JWT del usuario. Null = sin conexión.
 * @param {Object}      handlers  Mapa evento → callback: { NuevaNotificacion, PropuestaCreada, NuevoAvance, ... }
 * @returns {{ unirseAProyecto, salirDeProyecto }}
 *
 * El hub reconecta automáticamente si cae la conexión.
 * Limpia listeners y para la conexión al desmontar.
 */
export function useSignalR(token, handlers = {}) {
  const connRef      = useRef(null);
  const handlersRef  = useRef(handlers);

  // Mantener referencia actualizada sin recrear la conexión
  useEffect(() => { handlersRef.current = handlers; });

  useEffect(() => {
    if (!token) return;

    const conn = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL, { accessTokenFactory: () => token })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    // Registrar todos los eventos dinámicamente
    const EVENTOS = [
      'NuevaNotificacion',
      'PropuestaCreada',
      'PropuestaEstadoCambiado',
      'NuevoAvance',
      'ObraFinalizada',
      'MensajeRecibido',
    ];

    EVENTOS.forEach(evento => {
      conn.on(evento, (...args) => {
        handlersRef.current[evento]?.(...args);
      });
    });

    conn.start().catch(err => console.warn('[SignalR] start error:', err));

    connRef.current = conn;
    return () => { conn.stop(); };
  }, [token]);

  const unirseAProyecto = useCallback((proyectoId) => {
    connRef.current?.invoke('UnirseAProyecto', proyectoId).catch(() => {});
  }, []);

  const salirDeProyecto = useCallback((proyectoId) => {
    connRef.current?.invoke('SalirDeProyecto', proyectoId).catch(() => {});
  }, []);

  return { unirseAProyecto, salirDeProyecto };
}
