import { Box, Typography, Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

export default function PageHeader({ title, subtitle, onAdd, addLabel = 'Nuevo' }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
      <Box>
        <Typography variant="h5" fontWeight={700} color="text.primary">{title}</Typography>
        {subtitle && <Typography variant="body2" color="text.secondary" mt={0.5}>{subtitle}</Typography>}
      </Box>
      {onAdd && (
        <Button variant="contained" startIcon={<AddIcon />} onClick={onAdd}>
          {addLabel}
        </Button>
      )}
    </Box>
  );
}
