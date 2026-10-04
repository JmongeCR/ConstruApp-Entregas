import { Box, Typography, Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

export default function PageHeader({ title, subtitle, onAdd, addLabel = 'Nuevo', Icon, actions }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {Icon && <Icon sx={{ fontSize: 22, color: 'primary.main' }} />}
          <Typography variant="h5" fontWeight={700} color="text.primary">{title}</Typography>
        </Box>
        {subtitle && <Typography variant="body2" color="text.secondary" mt={0.5}>{subtitle}</Typography>}
      </Box>
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
        {actions}
        {onAdd && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={onAdd}
            sx={{ whiteSpace: 'nowrap', boxShadow: 'none' }}>
            {addLabel}
          </Button>
        )}
      </Box>
    </Box>
  );
}
