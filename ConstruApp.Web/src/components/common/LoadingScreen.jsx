import { Box, CircularProgress, Typography } from '@mui/material';

export default function LoadingScreen({ message = 'Cargando...' }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: 300, gap: 2 }}>
      <CircularProgress color="primary" />
      <Typography color="text.secondary">{message}</Typography>
    </Box>
  );
}
