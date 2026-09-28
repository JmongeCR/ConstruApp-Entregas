import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from '@mui/material';

export default function ConfirmDialog({ open, title, message, onConfirm, onCancel }) {
  return (
    <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
      <DialogTitle>{title || '¿Confirmar acción?'}</DialogTitle>
      <DialogContent>
        <DialogContentText>{message || '¿Estás seguro de que deseas continuar?'}</DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onCancel} color="inherit">Cancelar</Button>
        <Button onClick={onConfirm} variant="contained" color="error">Eliminar</Button>
      </DialogActions>
    </Dialog>
  );
}
