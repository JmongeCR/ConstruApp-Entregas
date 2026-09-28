import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtCRC = (n) => {
  if (n == null) return 'CRC 0';
  return 'CRC ' + Number(n).toLocaleString('es-CR', { maximumFractionDigits: 0 });
};

// Separa "Cemento Holcim [EPA]" → { nombre: "Cemento Holcim", tienda: "EPA" }
const separarDesc = (desc) => {
  const m = desc?.match(/^(.*?)\s*\[([^\]]+)\]$/);
  return m ? { nombre: m[1].trim(), tienda: m[2].trim() } : { nombre: desc ?? '', tienda: null };
};

const fmtDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('es-CR', { day: '2-digit', month: 'long', year: 'numeric' });
};

// ── Paleta ────────────────────────────────────────────────────────────────────
const C = {
  dark:   '#0F172A',
  dark2:  '#1E293B',
  gold:   '#F59E0B',
  gray:   '#64748B',
  gray2:  '#94A3B8',
  light:  '#F8FAFC',
  light2: '#FEF3C7',
  border: '#E2E8F0',
  border2:'#F1F5F9',
  white:  '#FFFFFF',
  amber:  '#92400E',
  green:  '#065F46',
};

// ── Estilos ───────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    padding: 50,
    backgroundColor: C.white,
    fontSize: 10,
    color: C.dark,
  },

  /* ── HEADER ── */
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    marginBottom: 22,
  },
  badgeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  badgeBox: {
    backgroundColor: C.dark, borderRadius: 5, paddingHorizontal: 8, paddingVertical: 5,
    flexDirection: 'row', alignItems: 'center', marginRight: 8,
  },
  badgeTxt: { color: C.gold, fontFamily: 'Helvetica-Bold', fontSize: 11 },
  titleTxt: { fontFamily: 'Helvetica-Bold', fontSize: 18, color: C.dark, marginBottom: 2 },
  subtitleTxt: { fontSize: 11, color: C.gray },
  geminiChip: {
    backgroundColor: C.light2, borderRadius: 4,
    paddingHorizontal: 8, paddingVertical: 4,
    alignItems: 'flex-end',
  },
  geminiTxt: { fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: C.amber },
  dateRightTxt: { fontSize: 9, color: C.gray2, marginTop: 4, textAlign: 'right' },

  /* ── DIVIDER ── */
  divider:       { height: 1, backgroundColor: C.border,  marginVertical: 16 },
  dividerLight:  { height: 1, backgroundColor: C.border2, marginVertical: 10 },
  dividerDark:   { height: 1, backgroundColor: '#334155', marginVertical: 8 },

  /* ── RANGO DE PRECIO ── */
  rangoBg: {
    backgroundColor: C.dark, borderRadius: 6, padding: 20, marginBottom: 22,
  },
  rangoLabel: {
    fontFamily: 'Helvetica-Bold', fontSize: 7.5, color: C.gray2,
    letterSpacing: 1, marginBottom: 8,
  },
  rangoValores: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  rangoMin: { fontFamily: 'Helvetica-Bold', fontSize: 21, color: C.gold },
  rangoSep: { fontSize: 18, color: '#475569', marginHorizontal: 8 },
  rangoMax: { fontFamily: 'Helvetica-Bold', fontSize: 21, color: C.gold },
  rangoSub: { fontSize: 8.5, color: '#64748B' },
  resumenIA: { fontSize: 9.5, color: '#CBD5E1', lineHeight: 1.55, marginTop: 12 },
  metaBadges: { flexDirection: 'row', marginTop: 14 },
  metaBadge: {
    backgroundColor: '#1E293B', borderRadius: 4,
    paddingHorizontal: 10, paddingVertical: 7, marginRight: 10,
    alignItems: 'center',
  },
  metaLabel: { fontFamily: 'Helvetica-Bold', fontSize: 7, color: C.gray2, letterSpacing: 0.8, marginBottom: 3 },
  metaValue: { fontFamily: 'Helvetica-Bold', fontSize: 11, color: C.white },

  /* ── TABLA (anchos fijos para evitar overflow en react-pdf) ── */
  // Página A4: 595pt - 50 padding c/lado = 495pt disponibles
  // Desc: 245 | Cant: 70 | P.Unit: 90 | Total: 90
  tableWrapper: { marginBottom: 20 },
  sectionTitle: { fontFamily: 'Helvetica-Bold', fontSize: 12, color: C.dark, marginBottom: 10 },
  tableHead: {
    flexDirection: 'row', backgroundColor: C.light,
    paddingHorizontal: 12, paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: C.border2,
  },
  thDesc:  { width: 245, fontFamily: 'Helvetica-Bold', fontSize: 7.5, color: C.gray2, letterSpacing: 0.8 },
  thNum:   { width: 70,  fontFamily: 'Helvetica-Bold', fontSize: 7.5, color: C.gray2, letterSpacing: 0.8, textAlign: 'center' },
  thPrice: { width: 90,  fontFamily: 'Helvetica-Bold', fontSize: 7.5, color: C.gray2, letterSpacing: 0.8, textAlign: 'right' },
  thTotal: { width: 90,  fontFamily: 'Helvetica-Bold', fontSize: 7.5, color: C.gray2, letterSpacing: 0.8, textAlign: 'right' },
  tableRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    paddingHorizontal: 12, paddingVertical: 7,
    borderBottomWidth: 1, borderBottomColor: C.border2,
  },
  tableRowAlt: { backgroundColor: '#FAFAFA' },
  tdDescCol: { width: 245 },
  tdDesc:   { fontSize: 9, color: C.dark, lineHeight: 1.4 },
  tdTienda: { fontSize: 7, color: '#94A3B8', marginTop: 2 },
  tdCateg:  { fontSize: 7, color: C.gray, marginTop: 1 },
  tdNum:    { width: 70,  fontSize: 9, color: C.gray, textAlign: 'center' },
  tdPrice:  { width: 90,  fontSize: 9, color: C.dark, textAlign: 'right' },
  tdTotal:  { width: 90,  fontSize: 9, color: C.dark, fontFamily: 'Helvetica-Bold', textAlign: 'right' },

  /* ── MANO DE OBRA banner ── */
  moHeader: {
    backgroundColor: '#FFFBEB', paddingHorizontal: 12, paddingVertical: 7,
    borderBottomWidth: 1, borderBottomColor: '#FDE68A',
  },
  moHeaderTxt: { fontFamily: 'Helvetica-Bold', fontSize: 8, color: C.amber, letterSpacing: 0.8 },
  tableRowMO: {
    flexDirection: 'row', alignItems: 'flex-start',
    paddingHorizontal: 12, paddingVertical: 7,
    borderBottomWidth: 1, borderBottomColor: '#FEF3C7',
    backgroundColor: '#FFFDF5',
  },

  /* ── TOTAL FINAL ── */
  totalRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
    backgroundColor: C.dark, borderRadius: 5,
    paddingHorizontal: 16, paddingVertical: 13, marginBottom: 22,
  },
  totalLbl: { fontFamily: 'Helvetica-Bold', fontSize: 12, color: C.white },
  totalVal: { fontFamily: 'Helvetica-Bold', fontSize: 18, color: C.gold },

  /* ── ESPECIALISTAS ── */
  specialistsSection: { marginBottom: 18 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap' },
  chip: {
    backgroundColor: '#FFFBEB', borderRadius: 4, borderWidth: 1, borderColor: '#FDE68A',
    paddingHorizontal: 8, paddingVertical: 4, marginRight: 6, marginBottom: 6,
  },
  chipTxt: { fontSize: 9, color: C.amber, fontFamily: 'Helvetica-Bold' },

  /* ── RECOMENDACIONES ── */
  recSection: { marginBottom: 18 },
  recItem: { flexDirection: 'row', marginBottom: 8, alignItems: 'flex-start' },
  recNum: {
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: C.light, marginRight: 8, marginTop: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  recNumTxt: { fontFamily: 'Helvetica-Bold', fontSize: 8, color: C.gray },
  recTxt: { flex: 1, fontSize: 9.5, color: C.gray, lineHeight: 1.55 },

  /* ── DISCLAIMER ── */
  disclaimer: {
    backgroundColor: C.light, borderRadius: 4, padding: 10,
    borderLeftWidth: 3, borderLeftColor: C.gold, marginBottom: 20,
  },
  disclaimerTxt: { fontSize: 8.5, color: C.gray, lineHeight: 1.5 },

  /* ── FOOTER ── */
  footer: {
    position: 'absolute', bottom: 30, left: 50, right: 50,
    borderTopWidth: 1, borderTopColor: C.border, paddingTop: 9,
  },
  footerTxt: { fontSize: 8.5, color: '#CBD5E1', textAlign: 'center' },
});

// ═══════════════════════════════════════════════════════════════════════════════
export function CotizacionPDF({ cotizacion, analisisIA, proyecto }) {
  const lineas     = cotizacion?.lineas ?? cotizacion?.Lineas ?? [];
  const materiales = lineas.filter(l => !l.esManoDeObra);
  const manoObra   = lineas.filter(l =>  l.esManoDeObra);
  const totalBase  = lineas.reduce((s, l) => s + (l.precioTotal || 0), 0);
  const fecha      = fmtDate(cotizacion?.fechaGeneracion);
  const year       = new Date().getFullYear();

  return (
    <Document title={`Cotizacion IA - ${proyecto?.titulo ?? ''}`} author="ConstruApp">
      <Page size="A4" style={S.page}>

        {/* ── ENCABEZADO ── */}
        <View style={S.header}>
          <View>
            <View style={S.badgeRow}>
              <View style={S.badgeBox}>
                <Text style={S.badgeTxt}>IA</Text>
              </View>
              <Text style={S.titleTxt}>COTIZACION CON INTELIGENCIA ARTIFICIAL</Text>
            </View>
            <Text style={S.subtitleTxt}>{proyecto?.titulo ?? 'Proyecto'}</Text>
          </View>
          <View style={S.geminiChip}>
            <Text style={S.geminiTxt}>Llama 3.3 · Groq</Text>
            <Text style={S.dateRightTxt}>{fecha}</Text>
          </View>
        </View>

        <View style={S.divider} />

        {/* ── RANGO DE PRECIOS ── */}
        <View style={S.rangoBg}>
          <Text style={S.rangoLabel}>RANGO ESTIMADO (CRC)</Text>
          <View style={S.rangoValores}>
            <Text style={S.rangoMin}>{fmtCRC(cotizacion?.rangoMinimo)}</Text>
            <Text style={S.rangoSep}> - </Text>
            <Text style={S.rangoMax}>{fmtCRC(cotizacion?.rangoMaximo)}</Text>
          </View>
          <Text style={S.rangoSub}>Incluye +-15% de variacion por imprevistos</Text>

          {/* Meta badges */}
          {(analisisIA?.tipoProyecto || analisisIA?.duracionEstimada) && (
            <View style={S.metaBadges}>
              {analisisIA?.tipoProyecto && (
                <View style={S.metaBadge}>
                  <Text style={S.metaLabel}>TIPO</Text>
                  <Text style={S.metaValue}>{analisisIA.tipoProyecto.replace('_', ' ')}</Text>
                </View>
              )}
              {analisisIA?.duracionEstimada && (
                <View style={S.metaBadge}>
                  <Text style={S.metaLabel}>DURACION</Text>
                  <Text style={S.metaValue}>{analisisIA.duracionEstimada}</Text>
                </View>
              )}
              <View style={S.metaBadge}>
                <Text style={S.metaLabel}>GENERADO</Text>
                <Text style={S.metaValue}>{fecha}</Text>
              </View>
            </View>
          )}

          {/* Resumen IA */}
          {cotizacion?.resumenIA && (
            <>
              <View style={S.dividerDark} />
              <Text style={S.resumenIA}>{cotizacion.resumenIA}</Text>
            </>
          )}
        </View>

        {/* ── ESPECIALISTAS NECESARIOS ── */}
        {analisisIA?.manoDeObra?.length > 0 && (
          <View style={S.specialistsSection}>
            <Text style={S.sectionTitle}>Especialistas necesarios</Text>
            <View style={S.chipRow}>
              {analisisIA.manoDeObra.map((mo, i) => (
                <View key={i} style={S.chip}>
                  <Text style={S.chipTxt}>{mo}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── TABLA DE DESGLOSE ── */}
        {lineas.length > 0 && (
          <View style={S.tableWrapper}>
            <Text style={S.sectionTitle}>Desglose detallado</Text>

            {/* Encabezado */}
            <View style={S.tableHead}>
              <Text style={S.thDesc}>MATERIAL / ITEM</Text>
              <Text style={S.thNum}>CANT.</Text>
              <Text style={S.thPrice}>P. UNIT.</Text>
              <Text style={S.thTotal}>TOTAL</Text>
            </View>

            {/* Materiales */}
            {materiales.map((l, i) => {
              const { nombre, tienda } = separarDesc(l.descripcion);
              return (
                <View key={i} style={[S.tableRow, i % 2 === 1 ? S.tableRowAlt : {}]}>
                  <View style={S.tdDescCol}>
                    <Text style={S.tdDesc}>{nombre}</Text>
                    {tienda && <Text style={S.tdTienda}>{tienda}</Text>}
                    {l.categoria && <Text style={S.tdCateg}>{l.categoria}</Text>}
                  </View>
                  <Text style={S.tdNum}>{l.cantidad} {l.unidad}</Text>
                  <Text style={S.tdPrice}>{fmtCRC(l.precioUnitario)}</Text>
                  <Text style={S.tdTotal}>{fmtCRC(l.precioTotal)}</Text>
                </View>
              );
            })}

            {/* Mano de obra */}
            {manoObra.length > 0 && (
              <>
                <View style={S.moHeader}>
                  <Text style={S.moHeaderTxt}>MANO DE OBRA</Text>
                </View>
                {manoObra.map((l, i) => (
                  <View key={i} style={S.tableRowMO}>
                    <View style={S.tdDescCol}>
                      <Text style={S.tdDesc}>{l.descripcion}</Text>
                    </View>
                    <Text style={S.tdNum}>{l.cantidad} {l.unidad}</Text>
                    <Text style={S.tdPrice}>{fmtCRC(l.precioUnitario)}</Text>
                    <Text style={S.tdTotal}>{fmtCRC(l.precioTotal)}</Text>
                  </View>
                ))}
              </>
            )}
          </View>
        )}

        {/* ── TOTAL BASE ── */}
        <View style={S.totalRow}>
          <Text style={S.totalLbl}>TOTAL BASE ESTIMADO</Text>
          <Text style={S.totalVal}>{fmtCRC(totalBase)}</Text>
        </View>

        {/* ── RECOMENDACIONES ── */}
        {analisisIA?.recomendaciones?.length > 0 && (
          <View style={S.recSection}>
            <Text style={S.sectionTitle}>Recomendaciones de la IA</Text>
            {analisisIA.recomendaciones.map((r, i) => (
              <View key={i} style={S.recItem}>
                <View style={S.recNum}>
                  <Text style={S.recNumTxt}>{i + 1}</Text>
                </View>
                <Text style={S.recTxt}>{r}</Text>
              </View>
            ))}
          </View>
        )}

        {/* ── DISCLAIMER ── */}
        <View style={S.disclaimer}>
          <Text style={S.disclaimerTxt}>
            * Estimacion generada por Inteligencia Artificial (Llama 3.3 via Groq). Los precios son orientativos y pueden
            variar segun proveedor, disponibilidad y especificaciones finales. Verificar con el constructor antes de
            comprometerse con el presupuesto.
          </Text>
        </View>

        {/* ── FOOTER ── */}
        <View style={S.footer} fixed>
          <Text style={S.footerTxt}>
            ConstruApp - Cotizacion con IA · {year}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
