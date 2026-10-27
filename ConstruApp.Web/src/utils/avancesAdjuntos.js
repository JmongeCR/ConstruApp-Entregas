const permitidos = new Set(['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm']);

export async function leerAdjuntosAvance(files, actuales = 0) {
  const lista = Array.from(files);
  if (actuales + lista.length > 4) throw new Error('Podés adjuntar hasta 4 fotos o videos por avance.');
  for (const file of lista) {
    if (!permitidos.has(file.type) || file.size === 0 || file.size > 5 * 1024 * 1024)
      throw new Error('Usá JPG, PNG, WebP, MP4 o WebM de hasta 5 MB por archivo.');
    if (file.name.length > 200) throw new Error('El nombre del archivo admite hasta 200 caracteres.');
  }
  return Promise.all(lista.map(file => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve({ file, preview: reader.result, base64: reader.result });
    reader.onerror = () => reject(new Error('No fue posible leer uno de los archivos.')); 
    reader.readAsDataURL(file);
  })));
}

export function validarAvance(form) {
  if (!form.titulo.trim()) return 'El título del avance es obligatorio.';
  if (form.titulo.trim().length > 300) return 'El título admite hasta 300 caracteres.';
  if (form.descripcion.trim().length > 3000) return 'La descripción admite hasta 3.000 caracteres.';
  if (form.responsable.trim().length > 200) return 'El responsable admite hasta 200 caracteres.';
  const porcentaje = Number(form.porcentajeAvance);
  if (String(form.porcentajeAvance).trim() === '' || !Number.isInteger(porcentaje) || porcentaje < 0 || porcentaje > 100)
    return 'Ingresá un porcentaje entero entre 0 y 100.';
  return '';
}
