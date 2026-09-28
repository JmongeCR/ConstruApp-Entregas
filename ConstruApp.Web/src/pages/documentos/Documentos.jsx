import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box, Typography, Button, Chip, CircularProgress, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Select, MenuItem, FormControl, InputLabel, LinearProgress,
  Paper, Skeleton,
} from '@mui/material';
import DescriptionIcon   from '@mui/icons-material/Description';
import PictureAsPdfIcon  from '@mui/icons-material/PictureAsPdf';
import ImageIcon         from '@mui/icons-material/Image';
import FolderZipIcon     from '@mui/icons-material/FolderZip';
import VideocamIcon      from '@mui/icons-material/Videocam';
import UploadFileIcon    from '@mui/icons-material/UploadFile';
import DownloadIcon      from '@mui/icons-material/Download';
import DeleteIcon        from '@mui/icons-material/Delete';
import EditOutlinedIcon  from '@mui/icons-material/EditOutlined';
import FolderOpenIcon    from '@mui/icons-material/FolderOpen';
import CloudUploadIcon   from '@mui/icons-material/CloudUpload';
import LayersIcon        from '@mui/icons-material/Layers';
import AssignmentIcon    from '@mui/icons-material/Assignment';
import GavelIcon         from '@mui/icons-material/Gavel';
import ReceiptLongIcon   from '@mui/icons-material/ReceiptLong';
import PhotoLibraryIcon  from '@mui/icons-material/PhotoLibrary';
import CheckCircleIcon   from '@mui/icons-material/CheckCircle';

import { proyectosApi, documentosApi, constructorApi } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';

// ── Constants ─────────────────────────────────────────────────────────────────

const ACCENT    = '#2563EB';
const API_BASE  = 'http://localhost:5115';

const CATEGORIAS = ['Todos', 'Contratos', 'Planos', 'Diseños', 'Permisos', 'Facturas', 'Fotografías', 'Videos', 'Otro'];

const CAT_ICONS = {
  Contratos:   <GavelIcon        sx={{ fontSize: 14 }} />,
  Planos:      <LayersIcon       sx={{ fontSize: 14 }} />,
  Diseños:     <AssignmentIcon   sx={{ fontSize: 14 }} />,
  Permisos:    <CheckCircleIcon  sx={{ fontSize: 14 }} />,
  Facturas:    <ReceiptLongIcon  sx={{ fontSize: 14 }} />,
  Fotografías: <PhotoLibraryIcon sx={{ fontSize: 14 }} />,
  Videos:      <VideocamIcon     sx={{ fontSize: 14 }} />,
  Otro:        <DescriptionIcon  sx={{ fontSize: 14 }} />,
};

const CAT_COLORS = {
  Contratos:   '#7C3AED',
  Planos:      '#2563EB',
  Diseños:     '#0891B2',
  Permisos:    '#059669',
  Facturas:    '#D97706',
  Fotografías: '#DB2777',
  Videos:      '#DC2626',
  Otro:        '#64748B',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function getTipoFromNombre(nombre) {
  const ext = nombre?.split('.').pop()?.toLowerCase() ?? '';
  if (['pdf'].includes(ext))                          return 'pdf';
  if (['jpg','jpeg','png','gif','webp'].includes(ext)) return 'image';
  if (['mp4','mov','avi','mkv','webm'].includes(ext)) return 'video';
  if (['zip','rar','7z','tar'].includes(ext))          return 'zip';
  return 'doc';
}

function FileIcon({ nombre, tipo }) {
  const t = tipo ?? getTipoFromNombre(nombre);
  if (t === 'pdf')   return <PictureAsPdfIcon sx={{ fontSize: 20, color: '#DC2626' }} />;
  if (t === 'image') return <ImageIcon        sx={{ fontSize: 20, color: '#7C3AED' }} />;
  if (t === 'video') return <VideocamIcon     sx={{ fontSize: 20, color: '#DB2777' }} />;
  if (t === 'zip')   return <FolderZipIcon    sx={{ fontSize: 20, color: '#D97706' }} />;
  return <DescriptionIcon sx={{ fontSize: 20, color: '#64748B' }} />;
}

function fmtFecha(s) {
  if (!s) return '—';
  return new Date(s).toLocaleDateString('es-CR', { day: 'numeric', month: 'short', year: 'numeric' });
}

function fmtBytes(bytes) {
  if (!bytes) return '—';
  if (bytes < 1024)        return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

// ── Sub-components ────────────────────────────────────────────────────────────

const TH = ({ children, align }) => (
  <TableCell align={align} sx={{
    fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase',
    letterSpacing: '0.06em', py: 1.25, borderBottom: '1px solid #F1F5F9',
    whiteSpace: 'nowrap',
  }}>
    {children}
  </TableCell>
);

const KpiBox = ({ label, value, color, loading }) => (
  <Box sx={{
    bgcolor: '#fff', border: '1px solid #E8EDF3', borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    px: 2.5, pt: 1.75, pb: 1.5,
  }}>
    {loading
      ? <Skeleton width={40} height={34} />
      : <Typography fontSize={26} fontWeight={800} lineHeight={1.1} sx={{ color }}>{value}</Typography>
    }
    <Typography fontSize={12} color="text.secondary" sx={{ mt: 0.4, fontWeight: 500 }}>{label}</Typography>
  </Box>
);

// ── Upload Dialog ─────────────────────────────────────────────────────────────

function UploadDialog({ open, onClose, proyectoId, onUploaded }) {
  const fileRef = useRef(null);
  const [form, setForm]       = useState({ nombre: '', categoria: 'Planos', descripcion: '' });
  const [fileData, setFileData] = useState(null); // { name, base64, size, tipo }
  const [uploading, setUploading] = useState(false);
  const [error, setError]     = useState('');

  const reset = () => { setForm({ nombre: '', categoria: 'Planos', descripcion: '' }); setFileData(null); setError(''); };

  function onFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setFileData({ name: file.name, base64: ev.target.result, size: file.size, tipo: getTipoFromNombre(file.name) });
      setForm(f => ({ ...f, nombre: f.nombre || file.name }));
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit() {
    if (!fileData && !form.nombre) { setError('Selecciona un archivo.'); return; }
    if (!form.nombre.trim())       { setError('El nombre es requerido.'); return; }
    setUploading(true);
    setError('');
    try {
      await documentosApi.upload({
        ProyectoId:    proyectoId,
        NombreArchivo: form.nombre.trim(),
        Base64:        fileData?.base64 ?? null,
        TipoArchivo:   fileData?.tipo ?? 'doc',
        Categoria:     form.categoria,
        Descripcion:   form.descripcion.trim() || null,
      });
      onUploaded();
      onClose();
      reset();
    } catch {
      setError('Error al subir el archivo. Intente de nuevo.');
    } finally {
      setUploading(false);
    }
  }

  function handleClose() { if (!uploading) { onClose(); reset(); } }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontSize: 15, fontWeight: 700, pb: 1.5 }}>
        Subir documento
      </DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '12px !important' }}>
        {error && <Alert severity="error" sx={{ py: 0.5, fontSize: 12.5 }}>{error}</Alert>}

        {/* Drop zone */}
        <Box
          onClick={() => fileRef.current?.click()}
          sx={{
            border: `2px dashed ${fileData ? ACCENT : '#CBD5E1'}`,
            borderRadius: '8px', p: 3, textAlign: 'center',
            cursor: 'pointer', bgcolor: fileData ? '#EFF6FF' : '#F8FAFC',
            transition: 'all .15s',
            '&:hover': { borderColor: ACCENT, bgcolor: '#EFF6FF' },
          }}
        >
          <input ref={fileRef} type="file" hidden onChange={onFileChange} />
          {fileData ? (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5 }}>
              <FileIcon nombre={fileData.name} tipo={fileData.tipo} />
              <Box sx={{ textAlign: 'left' }}>
                <Typography fontSize={13} fontWeight={600} color={ACCENT}>{fileData.name}</Typography>
                <Typography fontSize={11.5} color="text.secondary">{fmtBytes(fileData.size)}</Typography>
              </Box>
            </Box>
          ) : (
            <>
              <CloudUploadIcon sx={{ fontSize: 36, color: '#CBD5E1', mb: 1 }} />
              <Typography fontSize={13} color="text.secondary">
                Haz clic para seleccionar un archivo
              </Typography>
              <Typography fontSize={11.5} color="text.secondary" sx={{ mt: 0.5 }}>
                PDF, imágenes, videos, ZIP y más
              </Typography>
            </>
          )}
        </Box>

        <TextField
          label="Nombre del archivo" size="small" fullWidth required
          value={form.nombre}
          onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
          inputProps={{ maxLength: 180 }}
        />

        <FormControl size="small" fullWidth>
          <InputLabel>Categoría</InputLabel>
          <Select label="Categoría" value={form.categoria}
            onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))}>
            {CATEGORIAS.filter(c => c !== 'Todos').map(c => (
              <MenuItem key={c} value={c}>{c}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          label="Descripción (opcional)" size="small" fullWidth multiline rows={2}
          value={form.descripcion}
          onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
          inputProps={{ maxLength: 300 }}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={uploading} size="small">Cancelar</Button>
        <Button variant="contained" size="small" onClick={handleSubmit} disabled={uploading}
          startIcon={uploading ? <CircularProgress size={12} color="inherit" /> : <CloudUploadIcon sx={{ fontSize: 14 }} />}>
          {uploading ? 'Subiendo…' : 'Subir'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Edit Dialog ───────────────────────────────────────────────────────────────

function EditDialog({ open, doc, onClose, onUpdated }) {
  const fileRef = useRef(null);
  const [form, setForm]       = useState({ nombre: '', categoria: '', descripcion: '' });
  const [fileData, setFileData] = useState(null);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');

  useEffect(() => {
    if (doc) setForm({ nombre: doc.nombreArchivo ?? '', categoria: doc.categoria ?? 'Otro', descripcion: doc.descripcion ?? '' });
    setFileData(null); setError('');
  }, [doc]);

  function onFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setFileData({ name: file.name, base64: ev.target.result, size: file.size });
    reader.readAsDataURL(file);
  }

  async function handleSave() {
    if (!form.nombre.trim()) { setError('El nombre es requerido.'); return; }
    setSaving(true); setError('');
    try {
      await documentosApi.update(doc.id, {
        NombreArchivo: form.nombre.trim(),
        Categoria:     form.categoria,
        Descripcion:   form.descripcion.trim() || null,
        Base64:        fileData?.base64 ?? null,
      });
      onUpdated();
      onClose();
    } catch {
      setError('Error al actualizar. Intente de nuevo.');
    } finally {
      setSaving(false);
    }
  }

  if (!doc) return null;
  return (
    <Dialog open={open} onClose={() => { if (!saving) onClose(); }} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontSize: 15, fontWeight: 700, pb: 1.5 }}>Editar documento</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '12px !important' }}>
        {error && <Alert severity="error" sx={{ py: 0.5, fontSize: 12.5 }}>{error}</Alert>}

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5,
          bgcolor: '#F8FAFC', borderRadius: '7px', border: '1px solid #E2E8F0' }}>
          <FileIcon nombre={doc.nombreArchivo} tipo={doc.tipoArchivo} />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography fontSize={13} fontWeight={600} noWrap>{doc.nombreArchivo}</Typography>
            <Typography fontSize={11.5} color="text.secondary">
              v{doc.version} · {fmtBytes(doc.tamanioBytes)}
            </Typography>
          </Box>
          <Button size="small" variant="outlined" onClick={() => fileRef.current?.click()}
            sx={{ fontSize: 11, flexShrink: 0 }}>
            {fileData ? 'Cambiado ✓' : 'Nueva versión'}
          </Button>
          <input ref={fileRef} type="file" hidden onChange={onFileChange} />
        </Box>

        <TextField label="Nombre del archivo" size="small" fullWidth required
          value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} />

        <FormControl size="small" fullWidth>
          <InputLabel>Categoría</InputLabel>
          <Select label="Categoría" value={form.categoria}
            onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))}>
            {CATEGORIAS.filter(c => c !== 'Todos').map(c => (
              <MenuItem key={c} value={c}>{c}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField label="Descripción" size="small" fullWidth multiline rows={2}
          value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={saving} size="small">Cancelar</Button>
        <Button variant="contained" size="small" onClick={handleSave} disabled={saving}
          startIcon={saving ? <CircularProgress size={12} color="inherit" /> : null}>
          {saving ? 'Guardando…' : 'Guardar cambios'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Delete Confirm ────────────────────────────────────────────────────────────

function DeleteDialog({ open, doc, onClose, onDeleted }) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      await documentosApi.delete(doc.id);
      onDeleted();
      onClose();
    } catch {
      setDeleting(false);
    }
  }

  if (!doc) return null;
  return (
    <Dialog open={open} onClose={() => { if (!deleting) onClose(); }} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontSize: 15, fontWeight: 700 }}>Eliminar documento</DialogTitle>
      <DialogContent>
        <Typography fontSize={13.5} color="text.secondary">
          ¿Eliminar <strong>"{doc.nombreArchivo}"</strong>? Esta acción no se puede deshacer.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={deleting} size="small">Cancelar</Button>
        <Button variant="contained" color="error" size="small" onClick={handleDelete} disabled={deleting}
          startIcon={deleting ? <CircularProgress size={12} color="inherit" /> : null}>
          {deleting ? 'Eliminando…' : 'Eliminar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function Documentos() {
  const { usuario }      = useAuth();
  const esConstructor    = usuario?.rol === 'Constructor';

  const [proyectos,      setProyectos]     = useState([]);
  const [proyectoId,     setProyectoId]    = useState('');
  const [docs,           setDocs]          = useState([]);
  const [categorias,     setCategorias]    = useState([]);
  const [filtroCategoria, setFiltroCategoria] = useState('Todos');
  const [loading,        setLoading]       = useState(false);
  const [loadingProyectos, setLoadingProyectos] = useState(true);
  const [uploadOpen,     setUploadOpen]    = useState(false);
  const [editDoc,        setEditDoc]       = useState(null);
  const [deleteDoc,      setDeleteDoc]     = useState(null);
  const [error,          setError]         = useState('');

  // Load user projects on mount — constructor uses dashboard, cliente uses getMios
  useEffect(() => {
    const loader = esConstructor
      ? constructorApi.dashboard().then(res => {
          const proyMap = {};
          (res.data?.clientes ?? []).forEach(c => {
            if (!proyMap[c.proyectoId]) {
              proyMap[c.proyectoId] = { id: c.proyectoId, titulo: c.proyectoTitulo };
            }
          });
          return Object.values(proyMap);
        })
      : proyectosApi.getMios().then(res => res.data ?? []);

    loader
      .then(lista => {
        setProyectos(lista);
        if (lista.length > 0) setProyectoId(lista[0].id);
      })
      .catch(() => setError('Error al cargar proyectos.'))
      .finally(() => setLoadingProyectos(false));
  }, [esConstructor]);

  // Load docs when project changes
  const loadDocs = useCallback(async () => {
    if (!proyectoId) return;
    setLoading(true);
    setError('');
    try {
      const [docsRes, catsRes] = await Promise.all([
        documentosApi.getByProyecto(proyectoId),
        documentosApi.getCategorias(proyectoId),
      ]);
      setDocs(docsRes.data ?? []);
      setCategorias(catsRes.data ?? []);
    } catch {
      setError('Error al cargar documentos.');
    } finally {
      setLoading(false);
    }
  }, [proyectoId]);

  useEffect(() => { loadDocs(); }, [loadDocs]);

  // Derived counts
  const counts = CATEGORIAS.reduce((acc, c) => {
    acc[c] = c === 'Todos' ? docs.length : docs.filter(d => d.categoria === c).length;
    return acc;
  }, {});

  const docsFiltrados = filtroCategoria === 'Todos'
    ? docs
    : docs.filter(d => d.categoria === filtroCategoria);

  const totalBytes = docs.reduce((s, d) => s + (d.tamanioBytes ?? 0), 0);

  const proyectoActual = proyectos.find(p => p.id === proyectoId);

  function handleDownload(doc) {
    const url = doc.url?.startsWith('http') ? doc.url : `${API_BASE}${doc.url}`;
    const a   = document.createElement('a');
    a.href    = url;
    a.target  = '_blank';
    a.rel     = 'noopener noreferrer';
    a.download = doc.nombreArchivo;
    a.click();
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        mb: 2.5, flexWrap: 'wrap', gap: 1.5 }}>
        <Box>
          <Typography variant="h5" sx={{ mb: 0.25 }}>Gestión Documental</Typography>
          <Typography variant="body2" color="text.secondary">
            Centraliza, organiza y controla todos los documentos del proyecto
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          {/* Project selector */}
          {loadingProyectos ? (
            <Skeleton width={220} height={36} />
          ) : (
            <FormControl size="small" sx={{ minWidth: 220 }}>
              <InputLabel sx={{ fontSize: 13 }}>Proyecto</InputLabel>
              <Select label="Proyecto" value={proyectoId}
                onChange={e => { setProyectoId(e.target.value); setFiltroCategoria('Todos'); }}
                sx={{ fontSize: 13 }}>
                {proyectos.map(p => (
                  <MenuItem key={p.id} value={p.id} sx={{ fontSize: 13 }}>
                    {p.titulo}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          <Button
            variant="contained" size="small"
            startIcon={<UploadFileIcon sx={{ fontSize: 14 }} />}
            onClick={() => setUploadOpen(true)}
            disabled={!proyectoId}
            sx={{ fontSize: 12.5, whiteSpace: 'nowrap' }}>
            Subir documento
          </Button>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2, fontSize: 13 }}>{error}</Alert>}

      {/* KPI Strip */}
      {loading
        ? <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2,1fr)', sm: 'repeat(3,1fr)' }, gap: 1.5, mb: 2.5 }}>
            {[0,1,2].map(i => <Skeleton key={i} height={80} sx={{ borderRadius: '8px' }} />)}
          </Box>
        : (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2,1fr)', sm: 'repeat(3,1fr)' }, gap: 1.5, mb: 2.5 }}>
            <KpiBox label="Total archivos"  value={docs.length}                                 color={ACCENT}    loading={loading} />
            <KpiBox label="Planos"          value={counts['Planos'] + counts['Diseños']}         color='#2563EB'   loading={loading} />
            <KpiBox label="Permisos"        value={counts['Permisos']}                           color='#059669'   loading={loading} />
          </Box>
        )
      }

      {/* Category Stats Row */}
      {!loading && categorias.length > 0 && (
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
          {categorias.map(c => (
            <Box key={c.categoria} sx={{
              display: 'flex', alignItems: 'center', gap: 0.75,
              px: 1.5, py: 0.6, borderRadius: '20px',
              bgcolor: '#fff', border: '1px solid #E2E8F0',
              color: CAT_COLORS[c.categoria] ?? '#64748B',
            }}>
              {CAT_ICONS[c.categoria] ?? <DescriptionIcon sx={{ fontSize: 14 }} />}
              <Typography fontSize={12} fontWeight={600}>{c.categoria}</Typography>
              <Typography fontSize={11.5} color="text.secondary">({c.count})</Typography>
            </Box>
          ))}
        </Box>
      )}

      {/* Main panel */}
      {!proyectoId && !loadingProyectos ? (
        <Paper sx={{ p: 6, textAlign: 'center', border: '1px solid #E2E8F0' }}>
          <FolderOpenIcon sx={{ fontSize: 48, color: '#CBD5E1', mb: 1.5 }} />
          <Typography fontSize={15} fontWeight={600} color="text.secondary">
            Selecciona un proyecto para ver sus documentos
          </Typography>
        </Paper>
      ) : (
        <Box sx={{ bgcolor: '#fff', border: '1px solid #E2E8F0', borderRadius: '8px', overflow: 'hidden' }}>
          {/* Panel header */}
          <Box sx={{ px: 2.5, py: 1.5, borderBottom: '1px solid #F1F5F9',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
            <Typography fontSize={13} fontWeight={600} color="text.primary">
              {loading ? <Skeleton width={120} /> : `Archivos (${docsFiltrados.length})`}
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
              {CATEGORIAS.map(c => {
                const cnt = counts[c] ?? 0;
                if (c !== 'Todos' && cnt === 0) return null;
                return (
                  <Chip key={c} label={`${c} (${cnt})`} size="small"
                    onClick={() => setFiltroCategoria(c)}
                    sx={{
                      cursor: 'pointer', fontSize: 11.5,
                      fontWeight: filtroCategoria === c ? 700 : 400,
                      bgcolor: filtroCategoria === c ? '#EFF6FF' : 'transparent',
                      color: filtroCategoria === c ? ACCENT : '#64748B',
                      border: `1px solid ${filtroCategoria === c ? '#BFDBFE' : '#E2E8F0'}`,
                    }} />
                );
              })}
            </Box>
          </Box>

          {loading && <LinearProgress sx={{ height: 2 }} />}

          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TH>Archivo</TH>
                  <TH>Categoría</TH>
                  <TH>Descripción</TH>
                  <TH>Versión</TH>
                  <TH>Tamaño</TH>
                  <TH>Fecha</TH>
                  <TableCell sx={{ borderBottom: '1px solid #F1F5F9', width: 100 }} />
                </TableRow>
              </TableHead>
              <TableBody>
                {loading && docs.length === 0
                  ? Array.from({ length: 4 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={7}><Skeleton height={36} /></TableCell>
                    </TableRow>
                  ))
                  : docsFiltrados.length === 0
                    ? (
                      <TableRow>
                        <TableCell colSpan={7}>
                          <Box sx={{ py: 5, textAlign: 'center' }}>
                            <FolderOpenIcon sx={{ fontSize: 40, color: '#E2E8F0', mb: 1.5 }} />
                            <Typography fontSize={13.5} color="text.secondary" fontWeight={500}>
                              No hay documentos en esta categoría
                            </Typography>
                            <Typography fontSize={12.5} color="text.secondary" sx={{ mt: 0.5 }}>
                              Haz clic en "Subir documento" para agregar el primero
                            </Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    )
                    : docsFiltrados.map(doc => (
                      <TableRow key={doc.id} sx={{ '&:hover': { bgcolor: '#F8FAFC' } }}>
                        {/* Archivo */}
                        <TableCell sx={{ py: 1.5, maxWidth: 260 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                            <FileIcon nombre={doc.nombreArchivo} tipo={doc.tipoArchivo} />
                            <Tooltip title={doc.nombreArchivo} placement="top">
                              <Typography fontSize={13} fontWeight={500} color="text.primary"
                                sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>
                                {doc.nombreArchivo}
                              </Typography>
                            </Tooltip>
                          </Box>
                        </TableCell>

                        {/* Categoría */}
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>
                          <Chip
                            label={doc.categoria ?? 'Otro'}
                            size="small"
                            sx={{
                              fontSize: 11, fontWeight: 600,
                              bgcolor: `${CAT_COLORS[doc.categoria] ?? '#64748B'}18`,
                              color: CAT_COLORS[doc.categoria] ?? '#64748B',
                              border: 'none',
                            }}
                          />
                        </TableCell>

                        {/* Descripción */}
                        <TableCell sx={{ maxWidth: 200 }}>
                          <Typography fontSize={12} color="text.secondary"
                            sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {doc.descripcion ?? '—'}
                          </Typography>
                        </TableCell>

                        {/* Versión */}
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>
                          <Chip label={`v${doc.version ?? 1}`} size="small"
                            sx={{ fontSize: 11, bgcolor: '#F1F5F9', color: '#475569', fontWeight: 600 }} />
                        </TableCell>

                        {/* Tamaño */}
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>
                          <Typography fontSize={12} color="text.secondary">{fmtBytes(doc.tamanioBytes)}</Typography>
                        </TableCell>

                        {/* Fecha */}
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>
                          <Typography fontSize={12} color="text.secondary">{fmtFecha(doc.fechaSubida)}</Typography>
                        </TableCell>

                        {/* Actions */}
                        <TableCell align="right" sx={{ pr: 1.5, whiteSpace: 'nowrap' }}>
                          <Tooltip title="Descargar">
                            <IconButton size="small" onClick={() => handleDownload(doc)}
                              sx={{ color: '#CBD5E1', '&:hover': { color: ACCENT, bgcolor: '#EFF6FF' } }}>
                              <DownloadIcon sx={{ fontSize: 15 }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Editar">
                            <IconButton size="small" onClick={() => setEditDoc(doc)}
                              sx={{ color: '#CBD5E1', '&:hover': { color: '#D97706', bgcolor: '#FFFBEB' } }}>
                              <EditOutlinedIcon sx={{ fontSize: 15 }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Eliminar">
                            <IconButton size="small" onClick={() => setDeleteDoc(doc)}
                              sx={{ color: '#CBD5E1', '&:hover': { color: '#DC2626', bgcolor: '#FEF2F2' } }}>
                              <DeleteIcon sx={{ fontSize: 15 }} />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                }
              </TableBody>
            </Table>
          </TableContainer>

          {/* Footer bar */}
          {docs.length > 0 && !loading && (
            <Box sx={{ px: 2.5, py: 1.25, borderTop: '1px solid #F1F5F9',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              bgcolor: '#FAFAFA' }}>
              <Typography fontSize={12} color="text.secondary">
                {proyectoActual ? `Proyecto: ${proyectoActual.titulo}` : ''}
              </Typography>
              <Typography fontSize={12} color="text.secondary">
                {docs.length} archivo{docs.length !== 1 ? 's' : ''} · {fmtBytes(totalBytes)} total
              </Typography>
            </Box>
          )}
        </Box>
      )}

      {/* Dialogs */}
      <UploadDialog
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        proyectoId={proyectoId}
        onUploaded={loadDocs}
      />
      <EditDialog
        open={!!editDoc}
        doc={editDoc}
        onClose={() => setEditDoc(null)}
        onUpdated={() => { loadDocs(); setEditDoc(null); }}
      />
      <DeleteDialog
        open={!!deleteDoc}
        doc={deleteDoc}
        onClose={() => setDeleteDoc(null)}
        onDeleted={() => { loadDocs(); setDeleteDoc(null); }}
      />
    </Box>
  );
}
