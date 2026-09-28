import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Grid, Card, CardContent, Button, Avatar,
  Chip, TextField, Divider, Alert, Snackbar, LinearProgress,
  Rating, Tab, Tabs,
} from '@mui/material';
import EditIcon          from '@mui/icons-material/Edit';
import SaveIcon          from '@mui/icons-material/Save';
import VerifiedIcon      from '@mui/icons-material/Verified';
import LocationOnIcon    from '@mui/icons-material/LocationOn';
import WorkIcon          from '@mui/icons-material/Work';
import LockIcon          from '@mui/icons-material/Lock';
import FolderOpenIcon    from '@mui/icons-material/FolderOpen';
import BusinessIcon      from '@mui/icons-material/Business';
import EmailIcon         from '@mui/icons-material/Email';
import PhoneIcon         from '@mui/icons-material/Phone';
import LanguageIcon      from '@mui/icons-material/Language';
import ArrowForwardIcon  from '@mui/icons-material/ArrowForward';
import { useAuth } from '../../context/AuthContext';
import {
  authApi,
  perfilesConstructorApi,
  perfilesProveedorApi,
  proyectosApi,
  propuestasApi,
} from '../../api/endpoints';

// ── Componente reutilizable: cambio de contraseña ─────────────────────────────
function CambiarContrasena() {
  const [form, setForm]   = useState({ contrasenaActual: '', contrasenaNueva: '', confirmar: '' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg]     = useState({ text: '', sev: 'success' });
  const set = f => e => setForm(p => ({ ...p, [f]: e.target.value }));

  const handleSave = async () => {
    if (form.contrasenaNueva !== form.confirmar) {
      setMsg({ text: 'Las contraseñas nuevas no coinciden.', sev: 'error' });
      return;
    }
    setSaving(true);
    try {
      await authApi.changePassword({ contrasenaActual: form.contrasenaActual, contrasenaNueva: form.contrasenaNueva });
      setMsg({ text: 'Contraseña actualizada correctamente.', sev: 'success' });
      setForm({ contrasenaActual: '', contrasenaNueva: '', confirmar: '' });
    } catch (e) {
      setMsg({ text: e.response?.data?.message || 'Error al cambiar la contraseña.', sev: 'error' });
    } finally { setSaving(false); }
  };

  return (
    <Card sx={{ mt: 3 }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
          <LockIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
          <Typography fontWeight={700} fontSize={15}>Cambiar contraseña</Typography>
        </Box>
        {msg.text && <Alert severity={msg.sev} sx={{ mb: 2 }} onClose={() => setMsg({ text: '', sev: 'success' })}>{msg.text}</Alert>}
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography fontSize={12} color="text.secondary" sx={{ mb: 0.5, fontWeight: 600 }}>Contraseña actual</Typography>
            <TextField fullWidth size="small" type="password" value={form.contrasenaActual} onChange={set('contrasenaActual')} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography fontSize={12} color="text.secondary" sx={{ mb: 0.5, fontWeight: 600 }}>Nueva contraseña</Typography>
            <TextField fullWidth size="small" type="password" value={form.contrasenaNueva} onChange={set('contrasenaNueva')}
              helperText="Mín. 6 caracteres, 1 mayúscula, 1 número" />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography fontSize={12} color="text.secondary" sx={{ mb: 0.5, fontWeight: 600 }}>Confirmar nueva contraseña</Typography>
            <TextField fullWidth size="small" type="password" value={form.confirmar} onChange={set('confirmar')} />
          </Grid>
        </Grid>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2.5 }}>
          <Button variant="contained" size="medium" startIcon={<LockIcon />}
            onClick={handleSave} disabled={saving || !form.contrasenaActual || !form.contrasenaNueva}
            sx={{ bgcolor: '#0F172A', '&:hover': { bgcolor: '#1E293B' } }}>
            {saving ? 'Guardando…' : 'Cambiar contraseña'}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}

const ACCENT = '#2563EB';

const ROLE_COLOR = {
  Admin:       '#7C3AED',
  Constructor: '#34D399',
  Proveedor:   '#A78BFA',
  Cliente:     '#60A5FA',
};
const AVATAR_PALETTE = ['#4F46E5','#0EA5E9','#10B981','#2563EB','#8B5CF6','#EC4899','#EF4444'];
const avatarBg = (name) => AVATAR_PALETTE[(name?.charCodeAt(0) ?? 0) % AVATAR_PALETTE.length];

// ── Header Card (same for all roles) ─────────────────────────────────────────
function ProfileHeader({ usuario, rol, stats }) {
  const color = ROLE_COLOR[rol] ?? ROLE_COLOR.Cliente;
  const bg    = avatarBg(usuario?.nombre);

  return (
    <Box sx={{
      mb: 3, borderRadius: '14px', overflow: 'hidden',
      border: '1px solid #E8EDF3',
      boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
    }}>
      {/* Gradient banner */}
      <Box sx={{
        height: 80,
        background: 'linear-gradient(135deg, #0C1322 0%, #1a2a4a 50%, #0f2040 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <Box sx={{
          position: 'absolute', inset: 0,
          backgroundImage: `linear-gradient(rgba(99,130,246,0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99,130,246,0.06) 1px, transparent 1px)`,
          backgroundSize: '28px 28px',
        }} />
        <Box sx={{
          position: 'absolute', top: -20, right: -20,
          width: 120, height: 120, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(245,158,11,0.15) 0%, transparent 70%)',
        }} />
      </Box>

      <Box sx={{ bgcolor: '#fff', px: 3, pb: 2.5 }}>
        {/* Avatar sobre el banner */}
        <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 2, mt: '-28px', mb: 1.5, flexWrap: 'wrap' }}>
          <Avatar sx={{
            width: 60, height: 60, bgcolor: bg,
            fontSize: 22, fontWeight: 800,
            border: '3px solid #fff',
            boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
            flexShrink: 0,
          }}>
            {usuario?.nombre?.[0]?.toUpperCase()}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0, mb: 0.5 }}>
            <Typography fontWeight={800} fontSize={16.5} color="#0D1321" sx={{ lineHeight: 1.2 }}>
              {usuario?.nombre}
            </Typography>
            <Chip label={rol} size="small" sx={{
              bgcolor: `${color}15`, color, fontWeight: 700,
              fontSize: 11, height: 20, mt: 0.3,
            }} />
          </Box>
        </Box>

        {/* Contacto */}
        <Box sx={{ display: 'flex', gap: 2.5, flexWrap: 'wrap', mb: stats ? 2 : 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <EmailIcon sx={{ fontSize: 13.5, color: '#94A3B8' }} />
            <Typography fontSize={12.5} color="text.secondary">{usuario?.email}</Typography>
          </Box>
          {usuario?.telefono && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <PhoneIcon sx={{ fontSize: 13.5, color: '#94A3B8' }} />
              <Typography fontSize={12.5} color="text.secondary">{usuario.telefono}</Typography>
            </Box>
          )}
        </Box>

        {stats && (
          <>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {stats.map(s => (
                <Box key={s.label}>
                  <Typography fontWeight={800} fontSize={20} color="#0D1321">{s.value}</Typography>
                  <Typography fontSize={11.5} color="text.secondary">{s.label}</Typography>
                </Box>
              ))}
            </Box>
          </>
        )}
      </Box>
    </Box>
  );
}

// ═════════════════════════════════════════
// PERFIL CLIENTE
// ═════════════════════════════════════════
function PerfilCliente({ usuario }) {
  const navigate = useNavigate();
  const { setUsuario } = useAuth();
  const [proyectos, setProyectos] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [editMode, setEditMode]   = useState(false);
  const [saving, setSaving]       = useState(false);
  const [saveMsg, setSaveMsg]     = useState({ text: '', sev: 'success' });
  const [form, setForm]           = useState({ nombre: usuario?.nombre || '', telefono: usuario?.telefono || '' });

  useEffect(() => {
    proyectosApi.getMios().then(r => setProyectos(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const stats = [
    { label: 'Proyectos',   value: proyectos.length },
    { label: 'Publicados',  value: proyectos.filter(p => ['Publicado','EnPropuestas'].includes(p.estado)).length },
    { label: 'En curso',    value: proyectos.filter(p => p.estado === 'EnCurso').length },
    { label: 'Completados', value: proyectos.filter(p => p.estado === 'Completado').length },
  ];

  return (
    <Box>
      <ProfileHeader usuario={usuario} rol="Cliente" stats={stats} />

      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <Card sx={{ mb: 2.5 }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography fontWeight={700} fontSize={15}>Información de cuenta</Typography>
                {editMode ? (
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button size="small" onClick={() => setEditMode(false)}
                      sx={{ color: 'text.secondary', fontSize: 12 }}>
                      Cancelar
                    </Button>
                    <Button size="small" variant="contained" startIcon={<SaveIcon />}
                      onClick={async () => {
                        setSaving(true);
                        try {
                          const { data } = await authApi.updateProfile({ nombre: form.nombre, telefono: form.telefono || null });
                          setUsuario(prev => ({ ...prev, nombre: data.nombre }));
                          setSaveMsg({ text: 'Perfil actualizado.', sev: 'success' });
                          setEditMode(false);
                        } catch {
                          setSaveMsg({ text: 'Error al guardar.', sev: 'error' });
                        } finally { setSaving(false); }
                      }}
                      disabled={saving}
                      sx={{ bgcolor: ACCENT, fontSize: 12, '&:hover': { bgcolor: '#1D4ED8' } }}>
                      {saving ? 'Guardando…' : 'Guardar'}
                    </Button>
                  </Box>
                ) : (
                  <Button size="small" startIcon={<EditIcon />}
                    onClick={() => { setSaveMsg({ text: '', sev: 'success' }); setEditMode(true); }}
                    sx={{ color: 'text.secondary', fontSize: 12 }}>
                    Editar
                  </Button>
                )}
              </Box>
              {saveMsg.text && <Alert severity={saveMsg.sev} sx={{ mb: 2 }} onClose={() => setSaveMsg({ text: '', sev: 'success' })}>{saveMsg.text}</Alert>}
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography fontSize={12} color="text.secondary" sx={{ mb: 0.5 }}>Nombre completo</Typography>
                  {editMode
                    ? <TextField fullWidth size="small" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} />
                    : <Typography fontSize={14} fontWeight={500}>{usuario?.nombre}</Typography>
                  }
                </Grid>
                <Grid item xs={12}>
                  <Typography fontSize={12} color="text.secondary" sx={{ mb: 0.5 }}>Correo electrónico</Typography>
                  <Typography fontSize={14}>{usuario?.email}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography fontSize={12} color="text.secondary" sx={{ mb: 0.5 }}>Teléfono</Typography>
                  {editMode
                    ? <TextField fullWidth size="small" value={form.telefono} onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))} />
                    : <Typography fontSize={14}>{usuario?.telefono || '—'}</Typography>
                  }
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={5}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography fontWeight={700} fontSize={15} sx={{ mb: 2 }}>Mis proyectos</Typography>
              {loading ? <LinearProgress /> : proyectos.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <FolderOpenIcon sx={{ fontSize: 36, color: '#CBD5E1', mb: 1 }} />
                  <Typography fontSize={13} color="text.secondary">Sin proyectos</Typography>
                  <Button size="small" onClick={() => navigate('/publicar')} sx={{ mt: 1 }}>
                    Crear proyecto
                  </Button>
                </Box>
              ) : (
                <Box>
                  {proyectos.slice(0, 4).map(p => (
                    <Box key={p.id} sx={{ display: 'flex', justifyContent: 'space-between', py: 1,
                      borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                      <Typography fontSize={13} noWrap sx={{ flex: 1, mr: 1 }}>{p.titulo}</Typography>
                      <Chip label={p.estado} size="small"
                        sx={{ fontSize: 10, fontWeight: 600, flexShrink: 0 }} />
                    </Box>
                  ))}
                  <Button size="small" fullWidth endIcon={<ArrowForwardIcon sx={{ fontSize: 14 }} />}
                    onClick={() => navigate('/mis-proyectos')} sx={{ mt: 1.5, color: 'text.secondary', fontSize: 12 }}>
                    Ver todos los proyectos
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      <CambiarContrasena />
    </Box>
  );
}

// ═════════════════════════════════════════
// PERFIL CONSTRUCTOR
// ═════════════════════════════════════════
function PerfilConstructor({ usuario }) {
  const navigate = useNavigate();
  const [perfil, setPerfil]   = useState(null);
  const [propuestas, setProp] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState(0);
  const [toast, setToast]     = useState({ open: false, msg: '', severity: 'success' });
  const [form, setForm]       = useState({
    nombreEmpresa: '', bio: '', especialidades: '', zonasCobertura: '',
    aniosExperiencia: '', cedulaJuridica: '', sitioWeb: '', instagram: '',
  });
  const [saving, setSaving] = useState(false);
  const notify = (msg, sev = 'success') => setToast({ open: true, msg, severity: sev });
  const set = f => e => setForm(p => ({ ...p, [f]: e.target.value }));

  useEffect(() => {
    Promise.all([
      perfilesConstructorApi.getMio().then(r => {
        setPerfil(r.data);
        setForm({
          nombreEmpresa:    r.data.nombreEmpresa    || '',
          bio:              r.data.bio              || '',
          especialidades:   r.data.especialidades   || '',
          zonasCobertura:   r.data.zonasCobertura   || '',
          aniosExperiencia: r.data.aniosExperiencia ?? '',
          cedulaJuridica:   r.data.cedulaJuridica   || '',
          sitioWeb:         r.data.sitioWeb         || '',
          instagram:        r.data.instagram        || '',
        });
      }).catch(() => {}),
      propuestasApi.getMias().then(r => setProp(r.data)).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { ...form, aniosExperiencia: parseInt(form.aniosExperiencia) || 0 };
      const { data } = perfil?.id
        ? await perfilesConstructorApi.update(perfil.id, payload)
        : await perfilesConstructorApi.create(payload);
      setPerfil(data);
      notify('Perfil actualizado.');
    } catch { notify('Error al guardar.', 'error'); }
    finally { setSaving(false); }
  };

  if (loading) return <LinearProgress />;

  const especialidades = perfil?.especialidades?.split(',').map(s => s.trim()).filter(Boolean) ?? [];
  const stats = [
    { label: 'Propuestas', value: propuestas.length },
    { label: 'Ganadas',    value: propuestas.filter(p => p.estado === 'Aceptada').length },
    { label: 'Rating',     value: perfil?.calificacionPromedio?.toFixed(1) || '—' },
    { label: 'Proyectos',  value: perfil?.totalProyectos || 0 },
  ];

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3, borderRadius: '14px', overflow: 'hidden', border: '1px solid #E8EDF3', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
        <Box sx={{
          height: 80, background: 'linear-gradient(135deg, #0C1322 0%, #1a2a4a 50%, #0f2040 100%)',
          position: 'relative', overflow: 'hidden',
        }}>
          <Box sx={{ position: 'absolute', inset: 0, backgroundImage: `linear-gradient(rgba(99,130,246,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(99,130,246,0.06) 1px, transparent 1px)`, backgroundSize: '28px 28px' }} />
        </Box>
        <Box sx={{ bgcolor: '#fff', px: 3, pb: 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 2, mt: '-28px', mb: 1.5, flexWrap: 'wrap' }}>
            <Avatar sx={{ width: 60, height: 60, bgcolor: ACCENT, fontSize: 22, fontWeight: 800,
              border: '3px solid #fff', boxShadow: '0 4px 14px rgba(0,0,0,0.15)', flexShrink: 0 }}>
              {(perfil?.nombreEmpresa || usuario?.nombre)?.[0]?.toUpperCase()}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0, pb: 0.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h6" fontWeight={800} color="text.primary">
                  {perfil?.nombreEmpresa || usuario?.nombre}
                </Typography>
                {perfil?.verificado && (
                  <VerifiedIcon sx={{ color: '#16A34A', fontSize: 20 }} titleAccess="Verificado" />
                )}
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.25 }}>
                <Chip label="Constructor" size="small"
                  sx={{ bgcolor: '#34D39915', color: '#34D399', fontWeight: 700, fontSize: 11 }} />
                {perfil?.verificado && (
                  <Chip label="Verificado" size="small" icon={<VerifiedIcon sx={{ fontSize: 13 }} />}
                    sx={{ bgcolor: '#D1FAE5', color: '#065F46', fontWeight: 600, fontSize: 11 }} />
                )}
              </Box>
            </Box>
          </Box>

          {perfil && (
            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', mb: 1.5 }}>
              {perfil.zonasCobertura && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <LocationOnIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                  <Typography fontSize={13} color="text.secondary">{perfil.zonasCobertura}</Typography>
                </Box>
              )}
              {perfil.aniosExperiencia > 0 && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <WorkIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                  <Typography fontSize={13} color="text.secondary">{perfil.aniosExperiencia} años de experiencia</Typography>
                </Box>
              )}
              {perfil.calificacionPromedio > 0 && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <Rating value={perfil.calificacionPromedio} precision={0.5} size="small" readOnly />
                  <Typography fontSize={12.5} color="text.secondary" fontWeight={600}>
                    {perfil.calificacionPromedio?.toFixed(1)}
                  </Typography>
                </Box>
              )}
            </Box>
          )}

          <Divider sx={{ mb: 2 }} />
          <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {stats.map(s => (
              <Box key={s.label}>
                <Typography fontWeight={800} fontSize={20} color="#0D1321">{s.value}</Typography>
                <Typography fontSize={11.5} color="text.secondary">{s.label}</Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: '1px solid rgba(0,0,0,0.07)', mb: 3 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}
          sx={{ '& .MuiTab-root': { fontSize: 13.5, fontWeight: 600, textTransform: 'none', minHeight: 44 },
            '& .Mui-selected': { color: `${ACCENT} !important` },
            '& .MuiTabs-indicator': { bgcolor: ACCENT, height: 2 } }}>
          <Tab label="Mi empresa" />
          <Tab label="Especialidades y zona" />
          <Tab label="Contacto y redes" />
        </Tabs>
      </Box>

      {/* Tab 0: Info general */}
      {tab === 0 && (
        <Grid container spacing={2.5}>
          <Grid item xs={12} sm={6}>
            <Typography fontSize={12} color="text.secondary" sx={{ mb: 0.75, fontWeight: 600 }}>Nombre de empresa / profesional *</Typography>
            <TextField fullWidth size="small" value={form.nombreEmpresa} onChange={set('nombreEmpresa')} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography fontSize={12} color="text.secondary" sx={{ mb: 0.75, fontWeight: 600 }}>Cédula jurídica (opcional)</Typography>
            <TextField fullWidth size="small" value={form.cedulaJuridica} onChange={set('cedulaJuridica')} />
          </Grid>
          <Grid item xs={12}>
            <Typography fontSize={12} color="text.secondary" sx={{ mb: 0.75, fontWeight: 600 }}>Descripción / bio</Typography>
            <TextField fullWidth multiline rows={4} size="small" value={form.bio} onChange={set('bio')}
              placeholder="Describí tu experiencia, proyectos que realizás, valores de tu empresa..." />
            <Typography fontSize={11} color="text.secondary" sx={{ mt: 0.5 }}>
              {form.bio.length} / 2000 caracteres · Esta descripción aparece en tu perfil público.
            </Typography>
          </Grid>
        </Grid>
      )}

      {/* Tab 1: Especialidades */}
      {tab === 1 && (
        <Grid container spacing={2.5}>
          <Grid item xs={12}>
            <Typography fontSize={12} color="text.secondary" sx={{ mb: 0.75, fontWeight: 600 }}>Especialidades</Typography>
            <TextField fullWidth size="small" value={form.especialidades} onChange={set('especialidades')}
              placeholder="Remodelación, Obra gris, Pisos, Pintura"
              helperText="Separadas por coma. Aparecen como chips en tu perfil." />
            {especialidades.length > 0 && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mt: 1.5 }}>
                {especialidades.map(e => (
                  <Chip key={e} label={e} size="small"
                    sx={{ bgcolor: '#D1FAE5', color: '#065F46', fontWeight: 600, fontSize: 11 }} />
                ))}
              </Box>
            )}
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography fontSize={12} color="text.secondary" sx={{ mb: 0.75, fontWeight: 600 }}>Años de experiencia</Typography>
            <TextField fullWidth size="small" value={form.aniosExperiencia} onChange={set('aniosExperiencia')} type="number" inputProps={{ min: 0 }} />
          </Grid>
          <Grid item xs={12}>
            <Typography fontSize={12} color="text.secondary" sx={{ mb: 0.75, fontWeight: 600 }}>Zonas de cobertura</Typography>
            <TextField fullWidth size="small" value={form.zonasCobertura} onChange={set('zonasCobertura')}
              placeholder="San José, Alajuela, Heredia"
              helperText="Provincias o cantones donde trabajás" />
          </Grid>
        </Grid>
      )}

      {/* Tab 2: Contacto */}
      {tab === 2 && (
        <Grid container spacing={2.5}>
          <Grid item xs={12} sm={6}>
            <Typography fontSize={12} color="text.secondary" sx={{ mb: 0.75, fontWeight: 600 }}>Sitio web</Typography>
            <TextField fullWidth size="small" value={form.sitioWeb} onChange={set('sitioWeb')}
              placeholder="https://miempresa.cr"
              InputProps={{ startAdornment: <LanguageIcon sx={{ color: 'text.secondary', fontSize: 17, mr: 1 }} /> }} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography fontSize={12} color="text.secondary" sx={{ mb: 0.75, fontWeight: 600 }}>Instagram</Typography>
            <TextField fullWidth size="small" value={form.instagram} onChange={set('instagram')}
              placeholder="@miempresa" />
          </Grid>
        </Grid>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
        <Button variant="outlined" size="medium" onClick={() => navigate(`/constructor/${perfil?.id}`)}
          disabled={!perfil?.id} endIcon={<ArrowForwardIcon />}
          sx={{ borderColor: 'rgba(0,0,0,0.15)', color: 'text.secondary' }}>
          Ver perfil público
        </Button>
        <Button variant="contained" size="medium" startIcon={<SaveIcon />}
          onClick={handleSave} disabled={saving}
          sx={{ bgcolor: ACCENT, '&:hover': { bgcolor: '#1D4ED8' } }}>
          {saving ? 'Guardando…' : 'Guardar cambios'}
        </Button>
      </Box>

      <CambiarContrasena />

      <Snackbar open={toast.open} autoHideDuration={3000}
        onClose={() => setToast(t => ({ ...t, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={toast.severity} onClose={() => setToast(t => ({ ...t, open: false }))}>
          {toast.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}

// ═════════════════════════════════════════
// PERFIL PROVEEDOR
// ═════════════════════════════════════════
function PerfilProveedor({ usuario }) {
  const [perfil, setPerfil]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [toast, setToast]     = useState({ open: false, msg: '', severity: 'success' });
  const [form, setForm]       = useState({
    nombreComercial: '', descripcion: '', direccion: '',
    canton: '', provincia: 'San José', telefonoNegocio: '',
    sitioWeb: '', horarioAtencion: '',
  });
  const notify = (msg, sev = 'success') => setToast({ open: true, msg, severity: sev });
  const set = f => e => setForm(p => ({ ...p, [f]: e.target.value }));

  useEffect(() => {
    perfilesProveedorApi.getMio()
      .then(r => {
        setPerfil(r.data);
        setForm({
          nombreComercial:  r.data.nombreComercial  || '',
          descripcion:      r.data.descripcion      || '',
          direccion:        r.data.direccion        || '',
          canton:           r.data.canton           || '',
          provincia:        r.data.provincia        || 'San José',
          telefonoNegocio:  r.data.telefonoNegocio  || '',
          sitioWeb:         r.data.sitioWeb         || '',
          horarioAtencion:  r.data.horarioAtencion  || '',
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = perfil?.id
        ? await perfilesProveedorApi.update(perfil.id, form)
        : await perfilesProveedorApi.create(form);
      setPerfil(data);
      notify('Perfil actualizado.');
    } catch { notify('Error al guardar.', 'error'); }
    finally { setSaving(false); }
  };

  if (loading) return <LinearProgress />;

  return (
    <Box>
      <ProfileHeader usuario={usuario} rol="Proveedor" />

      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Typography fontWeight={700} fontSize={15} sx={{ mb: 2.5 }}>Información del negocio</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={8}>
              <Typography fontSize={12} color="text.secondary" sx={{ mb: 0.75, fontWeight: 600 }}>Nombre comercial *</Typography>
              <TextField fullWidth size="small" value={form.nombreComercial} onChange={set('nombreComercial')} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Typography fontSize={12} color="text.secondary" sx={{ mb: 0.75, fontWeight: 600 }}>Teléfono del negocio</Typography>
              <TextField fullWidth size="small" value={form.telefonoNegocio} onChange={set('telefonoNegocio')} />
            </Grid>
            <Grid item xs={12}>
              <Typography fontSize={12} color="text.secondary" sx={{ mb: 0.75, fontWeight: 600 }}>Descripción del negocio</Typography>
              <TextField fullWidth multiline rows={3} size="small" value={form.descripcion} onChange={set('descripcion')}
                placeholder="Describí tu negocio, productos que ofrecés, especialidades..." />
            </Grid>
            <Grid item xs={12} sm={8}>
              <Typography fontSize={12} color="text.secondary" sx={{ mb: 0.75, fontWeight: 600 }}>Dirección</Typography>
              <TextField fullWidth size="small" value={form.direccion} onChange={set('direccion')} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Typography fontSize={12} color="text.secondary" sx={{ mb: 0.75, fontWeight: 600 }}>Provincia</Typography>
              <TextField fullWidth size="small" select value={form.provincia} onChange={set('provincia')}
                SelectProps={{ native: true }}>
                {['San José','Alajuela','Cartago','Heredia','Guanacaste','Puntarenas','Limón'].map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography fontSize={12} color="text.secondary" sx={{ mb: 0.75, fontWeight: 600 }}>Sitio web</Typography>
              <TextField fullWidth size="small" value={form.sitioWeb} onChange={set('sitioWeb')} placeholder="https://..." />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography fontSize={12} color="text.secondary" sx={{ mb: 0.75, fontWeight: 600 }}>Horario de atención</Typography>
              <TextField fullWidth size="small" value={form.horarioAtencion} onChange={set('horarioAtencion')}
                placeholder="Lun-Vie 8am-6pm" />
            </Grid>
          </Grid>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
            <Button variant="contained" size="medium" startIcon={<SaveIcon />}
              onClick={handleSave} disabled={saving}
              sx={{ bgcolor: ACCENT, '&:hover': { bgcolor: '#1D4ED8' } }}>
              {saving ? 'Guardando…' : 'Guardar cambios'}
            </Button>
          </Box>
        </CardContent>
      </Card>

      <CambiarContrasena />

      <Snackbar open={toast.open} autoHideDuration={3000}
        onClose={() => setToast(t => ({ ...t, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={toast.severity} onClose={() => setToast(t => ({ ...t, open: false }))}>
          {toast.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}

// ═════════════════════════════════════════
// PERFIL ADMIN
// ═════════════════════════════════════════
function PerfilAdmin({ usuario }) {
  return (
    <Box>
      <ProfileHeader usuario={usuario} rol="Admin" />
      <Card>
        <CardContent sx={{ p: 3 }}>
          <Typography fontWeight={700} fontSize={15} sx={{ mb: 1.5 }}>Cuenta de administrador</Typography>
          <Typography color="text.secondary" fontSize={13.5}>
            Esta cuenta tiene acceso completo a la plataforma. Podés gestionar usuarios, roles y verificar perfiles desde el panel de administración.
          </Typography>
        </CardContent>
      </Card>
      <CambiarContrasena />
    </Box>
  );
}

// ═════════════════════════════════════════
// ROOT
// ═════════════════════════════════════════
export default function MiPerfil() {
  const { usuario } = useAuth();
  const rol = usuario?.rol;

  return (
    <Box sx={{ maxWidth: 860, mx: 'auto' }}>
      <Typography variant="h5" fontWeight={800} color="#0F172A" sx={{ mb: 0.5 }}>Mi perfil</Typography>
      <Typography color="text.secondary" fontSize={13.5} sx={{ mb: 3 }}>
        Gestioná tu información personal y configuración de cuenta.
      </Typography>

      {rol === 'Constructor' && <PerfilConstructor usuario={usuario} />}
      {rol === 'Proveedor'   && <PerfilProveedor   usuario={usuario} />}
      {rol === 'Admin'       && <PerfilAdmin        usuario={usuario} />}
      {rol === 'Cliente'     && <PerfilCliente      usuario={usuario} />}
    </Box>
  );
}
