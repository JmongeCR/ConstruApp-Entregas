import { createTheme } from '@mui/material/styles';

const ACCENT = '#2563EB';
const ACCENT_DARK = '#1D4ED8';

const theme = createTheme({
  palette: {
    primary:    { main: ACCENT, dark: ACCENT_DARK, contrastText: '#fff' },
    secondary:  { main: '#6B7280', contrastText: '#fff' },
    success:    { main: '#16A34A' },
    error:      { main: '#DC2626' },
    warning:    { main: '#D97706' },
    background: { default: '#F0F4F8', paper: '#FFFFFF' },
    text:       { primary: '#0F172A', secondary: '#64748B' },
    divider:    '#E2E8F0',
  },
  typography: {
    fontFamily: '"Inter", "system-ui", -apple-system, "Helvetica Neue", sans-serif',
    h4: { fontWeight: 800, letterSpacing: '-0.5px' },
    h5: { fontWeight: 700, letterSpacing: '-0.3px' },
    h6: { fontWeight: 700, letterSpacing: '-0.15px' },
    body1: { fontSize: 14, lineHeight: 1.6 },
    body2: { fontSize: 13, lineHeight: 1.55 },
    caption: { fontSize: 12 },
  },
  shape: { borderRadius: 8 },
  shadows: [
    'none',
    '0 1px 2px rgba(0,0,0,0.05)',
    '0 1px 4px rgba(0,0,0,0.07)',
    '0 2px 8px rgba(0,0,0,0.07)',
    '0 4px 14px rgba(0,0,0,0.08)',
    '0 4px 20px rgba(0,0,0,0.09)',
    '0 8px 30px rgba(0,0,0,0.10)',
    '0 12px 40px rgba(0,0,0,0.12)',
    ...Array(18).fill('none'),
  ],
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        '*, *::before, *::after': { boxSizing: 'border-box' },
        // Thin, modern scrollbars
        '::-webkit-scrollbar': { width: 6, height: 6 },
        '::-webkit-scrollbar-track': { background: 'transparent' },
        '::-webkit-scrollbar-thumb': { background: '#CBD5E1', borderRadius: 6 },
        '::-webkit-scrollbar-thumb:hover': { background: '#94A3B8' },
        // Smooth page transitions
        '#root': { isolation: 'isolate' },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 7,
          fontSize: 13.5,
          boxShadow: 'none',
          letterSpacing: 0,
          transition: 'all .15s ease',
          '&:hover': { boxShadow: 'none' },
        },
        containedPrimary: {
          backgroundColor: ACCENT,
          '&:hover': { backgroundColor: ACCENT_DARK, transform: 'translateY(-0.5px)' },
          '&:active': { transform: 'translateY(0)' },
        },
        outlined: {
          borderColor: '#D1D5DB',
          color: '#374151',
          '&:hover': { borderColor: '#9CA3AF', backgroundColor: '#F8FAFC' },
        },
        text: { color: '#374151', '&:hover': { backgroundColor: '#F8FAFC' } },
        sizeLarge: { fontSize: 14, padding: '9px 20px' },
        sizeSmall: { fontSize: 12.5, padding: '4px 12px' },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.03)',
          borderRadius: 12,
          border: '1px solid #E8EDF3',
          backgroundImage: 'none',
          transition: 'box-shadow .15s ease, border-color .15s ease',
        },
      },
    },
    MuiCardContent: {
      styleOverrides: { root: { '&:last-child': { paddingBottom: 16 } } },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600, borderRadius: 5, fontSize: 12 },
        sizeSmall: { height: 22, fontSize: 11.5 },
      },
    },
    MuiTextField: {
      defaultProps: { variant: 'outlined', size: 'small' },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 7,
            fontSize: 13.5,
            backgroundColor: '#fff',
            transition: 'box-shadow .15s ease',
            '& fieldset': { borderColor: '#D1D5DB', transition: 'border-color .15s' },
            '&:hover fieldset': { borderColor: '#9CA3AF' },
            '&.Mui-focused fieldset': { borderColor: ACCENT },
            '&.Mui-focused': { boxShadow: `0 0 0 3px ${ACCENT}18` },
          },
          '& .MuiInputLabel-root': { fontSize: 13.5 },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: { borderColor: '#F1F5F9', fontSize: 13, padding: '10px 16px' },
        head: {
          fontWeight: 700,
          fontSize: 11,
          color: '#94A3B8',
          backgroundColor: '#F8FAFC',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          padding: '9px 16px',
          borderBottom: '1px solid #E2E8F0',
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          transition: 'background-color .1s ease',
          '&:hover': { backgroundColor: '#F8FAFC' },
          '&:last-child td': { border: 0 },
        },
      },
    },
    MuiTableHead: {
      styleOverrides: { root: { '& th': { borderBottom: '1px solid #E2E8F0' } } },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
        elevation4: { boxShadow: '0 4px 20px rgba(0,0,0,0.09), 0 0 0 1px rgba(0,0,0,0.04)' },
      },
    },
    MuiDivider: {
      styleOverrides: { root: { borderColor: '#E2E8F0' } },
    },
    MuiAlert: {
      styleOverrides: { root: { borderRadius: 7, fontSize: 13 } },
    },
    MuiLinearProgress: {
      styleOverrides: { root: { borderRadius: 4, height: 3, backgroundColor: '#E2E8F0' } },
    },
    MuiTabs: {
      styleOverrides: {
        root: { borderBottom: '1px solid #E2E8F0', minHeight: 40 },
        indicator: { backgroundColor: ACCENT, height: 2.5, borderRadius: '2px 2px 0 0' },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontSize: 13,
          fontWeight: 500,
          minHeight: 40,
          color: '#64748B',
          transition: 'color .15s ease',
          '&.Mui-selected': { color: ACCENT, fontWeight: 700 },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        select: { fontSize: 13.5 },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          fontSize: 13.5,
          transition: 'background-color .1s ease',
          '&.Mui-selected': { backgroundColor: '#EFF6FF', '&:hover': { backgroundColor: '#DBEAFE' } },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 12,
          border: '1px solid #E2E8F0',
          boxShadow: '0 20px 60px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.04)',
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: { root: { fontWeight: 700, fontSize: 15.5, paddingBottom: 8 } },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          fontSize: 11.5, borderRadius: 5,
          backgroundColor: '#0F172A',
          padding: '5px 10px',
        },
        arrow: { color: '#0F172A' },
      },
      defaultProps: { arrow: true },
    },
    MuiSnackbar: {
      defaultProps: { anchorOrigin: { vertical: 'bottom', horizontal: 'center' } },
    },
    MuiIconButton: {
      styleOverrides: {
        root: { transition: 'all .15s ease', borderRadius: 7 },
      },
    },
    MuiBadge: {
      styleOverrides: {
        badge: { fontSize: 10, fontWeight: 700, minWidth: 16, height: 16 },
      },
    },
  },
});

export default theme;
