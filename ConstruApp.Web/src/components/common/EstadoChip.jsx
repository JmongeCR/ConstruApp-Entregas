import { Chip } from '@mui/material';

const colores = {
  // Proyecto
  Publicado:    'info',
  EnCotizacion: 'warning',
  Contratado:   'secondary',
  EnProgreso:   'primary',
  Finalizado:   'success',
  // Cotización
  Enviada:      'info',
  Aceptada:     'success',
  Rechazada:    'error',
  // Solicitud
  Pendiente:    'warning',
  Respondida:   'info',
  // Trabajador / Fase
  Activo:       'success',
  Inactivo:     'default',
  Completada:   'success',
  // Asistencia
  Presente:     'success',
  Ausente:      'error',
  Tardanza:     'warning',
};

export default function EstadoChip({ estado }) {
  return (
    <Chip
      label={estado}
      color={colores[estado] || 'default'}
      size="small"
      sx={{ fontWeight: 600 }}
    />
  );
}
