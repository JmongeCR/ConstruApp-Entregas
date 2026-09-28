import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtMonto = (v) => {
  if (v == null || v === '') return 'CRC 0';
  return 'CRC ' + Number(v).toLocaleString('es-CR');
};

const fmtDate = (d) => {
  if (!d) return null;
  return new Date(d).toLocaleDateString('es-CR', {
    day: '2-digit', month: 'long', year: 'numeric',
  });
};

// ── Colores ───────────────────────────────────────────────────────────────────
const C = {
  dark:   '#0F172A',
  dark2:  '#1E293B',
  gray:   '#64748B',
  gray2:  '#94A3B8',
  light:  '#F8FAFC',
  border: '#E2E8F0',
  border2:'#F1F5F9',
  red:    '#DC2626',
  green:  '#065F46',
  white:  '#FFFFFF',
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 },
  logoRow: { flexDirection: 'row', alignItems: 'center' },
  logoSquare: {
    width: 34, height: 34, backgroundColor: C.dark, borderRadius: 5,
    alignItems: 'center', justifyContent: 'center', marginRight: 10,
  },
  logoLetter: { color: C.white, fontFamily: 'Helvetica-Bold', fontSize: 17 },
  companyName: { fontFamily: 'Helvetica-Bold', fontSize: 14, color: C.dark, marginBottom: 2 },
  companySub: { fontSize: 8.5, color: C.gray },
  invoiceTitle: { fontFamily: 'Helvetica-Bold', fontSize: 26, color: C.dark, textAlign: 'right', marginBottom: 4 },
  invoiceNumero: { fontFamily: 'Courier', fontSize: 11, color: C.gray2, textAlign: 'right' },

  /* ── DIVIDER ── */
  divider: { height: 1, backgroundColor: C.border, marginVertical: 20 },
  dividerLight: { height: 1, backgroundColor: C.border2, marginVertical: 12 },

  /* ── INFO SECTION ── */
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  fieldLabel: {
    fontFamily: 'Helvetica-Bold', fontSize: 7.5, color: C.gray2,
    letterSpacing: 0.8, marginBottom: 4, textTransform: 'uppercase',
  },
  fieldValue: { fontFamily: 'Helvetica-Bold', fontSize: 12.5, color: C.dark, marginBottom: 2 },
  fieldSub:   { fontSize: 9, color: C.gray },
  dateBlock: { marginBottom: 10, alignItems: 'flex-end' },
  dateValue: { fontFamily: 'Helvetica-Bold', fontSize: 11.5, color: C.dark, marginTop: 2 },
  dateValueRed: { fontFamily: 'Helvetica-Bold', fontSize: 11.5, color: C.red, marginTop: 2 },

  /* ── CONCEPT TABLE ── */
  tableBg: { backgroundColor: C.light, borderRadius: 5, marginBottom: 24 },
  tableHead: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 9,
    borderBottomWidth: 1, borderBottomColor: C.border2,
  },
  tableHeadTxt: { fontFamily: 'Helvetica-Bold', fontSize: 7.5, color: C.gray2, letterSpacing: 0.8 },
  tableBodyRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', paddingHorizontal: 16, paddingVertical: 13,
  },
  tableDescTxt: { flex: 1, fontSize: 11.5, color: C.dark, lineHeight: 1.5, marginRight: 20 },
  tableAmtTxt:  { fontFamily: 'Helvetica-Bold', fontSize: 11.5, color: C.dark, textAlign: 'right', minWidth: 100 },

  /* ── TOTALS ── */
  totalsWrap: { alignItems: 'flex-end', marginBottom: 24 },
  totalsBox:  { width: 230 },
  totalLine:  { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  totalLbl:   { fontSize: 9.5, color: C.gray, fontFamily: 'Helvetica-Bold' },
  totalVal:   { fontSize: 9.5, color: C.dark, fontFamily: 'Helvetica-Bold' },
  totalDivider: { height: 1, backgroundColor: C.border, marginVertical: 9 },
  grandRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  grandLbl:    { fontFamily: 'Helvetica-Bold', fontSize: 13.5, color: C.dark },
  grandVal:    { fontFamily: 'Helvetica-Bold', fontSize: 20, color: C.dark },

  /* ── PAYMENT STATUS BAR ── */
  statusBar: {
    backgroundColor: C.light, borderRadius: 5, padding: 12,
    flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20,
  },
  statusItem: { alignItems: 'center' },
  statusItemLabel: { fontSize: 7.5, color: C.gray2, fontFamily: 'Helvetica-Bold', letterSpacing: 0.5, marginBottom: 3 },
  statusItemValue: { fontFamily: 'Helvetica-Bold', fontSize: 12, color: C.dark },
  statusItemGreen: { fontFamily: 'Helvetica-Bold', fontSize: 12, color: '#10B981' },

  /* ── NOTES ── */
  notesSection: { marginTop: 4 },
  notesTitleTxt: { fontFamily: 'Helvetica-Bold', fontSize: 7.5, color: C.gray2, letterSpacing: 0.8, marginBottom: 5 },
  notesBodyTxt: { fontSize: 10, color: C.gray, lineHeight: 1.55 },

  /* ── FOOTER ── */
  footer: {
    position: 'absolute', bottom: 30, left: 50, right: 50,
    borderTopWidth: 1, borderTopColor: C.border, paddingTop: 9,
  },
  footerTxt: { fontSize: 8.5, color: '#CBD5E1', textAlign: 'center' },
});

// ═══════════════════════════════════════════════════════════════════════════════
export function FacturaPDF({ factura: f, perfil }) {
  const companyName = perfil?.nombreEmpresa || 'Mi empresa';
  const letter = (companyName?.[0] ?? 'E').toUpperCase();
  const monto  = Number(f?.montoTotal) || 0;
  const pagado = Number(f?.montoPagado) || 0;
  const saldo  = monto - pagado;
  const emision = fmtDate(f?.fechaEmision) || fmtDate(new Date());
  const vence   = fmtDate(f?.fechaVencimiento);
  const year    = new Date().getFullYear();

  return (
    <Document title={`Factura ${f?.numero ?? ''}`} author="ConstruApp">
      <Page size="A4" style={S.page}>

        {/* ── ENCABEZADO ── */}
        <View style={S.header}>
          {/* Empresa */}
          <View>
            <View style={S.logoRow}>
              <View style={S.logoSquare}>
                <Text style={S.logoLetter}>{letter}</Text>
              </View>
              <View>
                <Text style={S.companyName}>{companyName}</Text>
                {perfil?.cedulaJuridica && (
                  <Text style={S.companySub}>CJ {perfil.cedulaJuridica}</Text>
                )}
                {perfil?.sitioWeb && (
                  <Text style={S.companySub}>{perfil.sitioWeb}</Text>
                )}
              </View>
            </View>
          </View>
          {/* Número de factura */}
          <View>
            <Text style={S.invoiceTitle}>FACTURA</Text>
            <Text style={S.invoiceNumero}>{f?.numero ?? 'FAC-2026-0001'}</Text>
          </View>
        </View>

        <View style={S.divider} />

        {/* ── INFO: cobrar a + fechas ── */}
        <View style={S.infoRow}>
          <View>
            <Text style={S.fieldLabel}>COBRAR A</Text>
            <Text style={S.fieldValue}>{f?.clienteNombre || 'Cliente'}</Text>
            {f?.proyectoTitulo && <Text style={S.fieldSub}>{f.proyectoTitulo}</Text>}
          </View>
          <View>
            <View style={S.dateBlock}>
              <Text style={S.fieldLabel}>FECHA EMISION</Text>
              <Text style={S.dateValue}>{emision}</Text>
            </View>
            {vence && (
              <View style={S.dateBlock}>
                <Text style={S.fieldLabel}>VENCIMIENTO</Text>
                <Text style={S.dateValueRed}>{vence}</Text>
              </View>
            )}
          </View>
        </View>

        {/* ── TABLA DE CONCEPTO ── */}
        <View style={S.tableBg}>
          <View style={S.tableHead}>
            <Text style={S.tableHeadTxt}>DESCRIPCION</Text>
            <Text style={S.tableHeadTxt}>IMPORTE</Text>
          </View>
          <View style={S.tableBodyRow}>
            <Text style={S.tableDescTxt}>{f?.concepto || 'Servicio de construccion'}</Text>
            <Text style={S.tableAmtTxt}>{fmtMonto(monto)}</Text>
          </View>
        </View>

        {/* ── TOTALES ── */}
        <View style={S.totalsWrap}>
          <View style={S.totalsBox}>
            <View style={S.totalLine}>
              <Text style={S.totalLbl}>Subtotal</Text>
              <Text style={S.totalVal}>{fmtMonto(monto)}</Text>
            </View>
            {pagado > 0 && (
              <View style={S.totalLine}>
                <Text style={S.totalLbl}>Cobrado</Text>
                <Text style={{ ...S.totalVal, color: '#10B981' }}>{fmtMonto(pagado)}</Text>
              </View>
            )}
            <View style={S.totalDivider} />
            <View style={S.grandRow}>
              <Text style={S.grandLbl}>{pagado > 0 ? 'SALDO' : 'TOTAL'}</Text>
              <Text style={S.grandVal}>{fmtMonto(pagado > 0 ? saldo : monto)}</Text>
            </View>
          </View>
        </View>

        {/* ── ESTADO DE PAGOS (si hay pagos parciales) ── */}
        {pagado > 0 && monto > 0 && (
          <View style={S.statusBar}>
            <View style={S.statusItem}>
              <Text style={S.statusItemLabel}>TOTAL FACTURA</Text>
              <Text style={S.statusItemValue}>{fmtMonto(monto)}</Text>
            </View>
            <View style={S.statusItem}>
              <Text style={S.statusItemLabel}>COBRADO</Text>
              <Text style={S.statusItemGreen}>{fmtMonto(pagado)}</Text>
            </View>
            <View style={S.statusItem}>
              <Text style={S.statusItemLabel}>PENDIENTE</Text>
              <Text style={S.statusItemValue}>{fmtMonto(saldo)}</Text>
            </View>
            <View style={S.statusItem}>
              <Text style={S.statusItemLabel}>AVANCE</Text>
              <Text style={S.statusItemValue}>{Math.round((pagado / monto) * 100)}%</Text>
            </View>
          </View>
        )}

        {/* ── NOTAS ── */}
        {f?.notas && (
          <>
            <View style={S.dividerLight} />
            <View style={S.notesSection}>
              <Text style={S.notesTitleTxt}>NOTAS</Text>
              <Text style={S.notesBodyTxt}>{f.notas}</Text>
            </View>
          </>
        )}

        {/* ── FOOTER ── */}
        <View style={S.footer} fixed>
          <Text style={S.footerTxt}>
            Generado con ConstruApp · {year}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
