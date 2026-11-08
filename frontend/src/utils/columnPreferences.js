export const DEFAULT_ITEM_COLUMNS = [
  { id: 'item_no', key: 'item_no', label: '#', defaultLabel: '#', visible: true, fixed: true, width: 'w-8 text-center' },
  { id: 'catalog', key: 'catalog', label: 'Catalog Select', defaultLabel: 'Catalog Select', visible: true, deletable: true, width: 'w-44' },
  { id: 'description', key: 'description', label: 'Description', defaultLabel: 'Description', visible: true, required: true, width: 'min-w-[180px]' },
  { id: 'sq_ft', key: 'sq_ft', label: 'Sq.Ft', defaultLabel: 'Sq.Ft', visible: true, deletable: true, isNumeric: true, width: 'w-20 text-center' },
  { id: 'quantity', key: 'quantity', label: 'Qty', defaultLabel: 'Qty', visible: true, required: true, isNumeric: true, width: 'w-16 text-center' },
  { id: 'unit', key: 'unit', label: 'Unit', defaultLabel: 'Unit', visible: true, deletable: true, width: 'w-16 text-center' },
  { id: 'rate', key: 'rate', label: 'Rate (₹)', defaultLabel: 'Rate (₹)', visible: true, required: true, isNumeric: true, width: 'w-20 text-right' },
  { id: 'discount', key: 'discount', label: 'Disc', defaultLabel: 'Disc', visible: false, deletable: true, isNumeric: true, width: 'w-16 text-right' },
  { id: 'gst_rate', key: 'gst_rate', label: 'GST %', defaultLabel: 'GST %', visible: false, deletable: true, width: 'w-20 text-center' },
  { id: 'total', key: 'total', label: 'Total (₹)', defaultLabel: 'Total (₹)', visible: true, fixed: true, width: 'w-24 text-right' }
];

export const DEFAULT_DC_FIELDS = [
  { id: 'invoice_no', key: 'invoiceNumber', label: 'Invoice No.', defaultLabel: 'Invoice No.', visible: true, required: true },
  { id: 'invoice_date', key: 'invoiceDate', label: 'Invoice Dated', defaultLabel: 'Invoice Dated', visible: true, required: true, type: 'date' },
  { id: 'in_dc_no', key: 'inDcNo', label: 'IN D.C. No.', defaultLabel: 'IN D.C. No.', visible: true, deletable: true, placeholder: 'e.g. IN-104' },
  { id: 'in_dc_date', key: 'inDcDate', label: 'IN D.C. Date', defaultLabel: 'IN D.C. Date', visible: true, deletable: true, type: 'date' },
  { id: 'out_dc_no', key: 'outDcNo', label: 'OUT D.C. No.', defaultLabel: 'OUT D.C. No.', visible: true, deletable: true, placeholder: '432' },
  { id: 'out_dc_date', key: 'outDcDate', label: 'OUT D.C. Date', defaultLabel: 'OUT D.C. Date', visible: true, deletable: true, type: 'date' }
];

export const DEFAULT_HEADER_PREFERENCES = {
  showInvoiceTitle: true,
  invoiceTitle: 'INVOICE',
  showCenterDivider: true,
  showLogo: true,
  logoUrl: '',
  showCompanyName: true,
  companyFontSize: 24, // px value, default 24
  companyFontWeight: 'black', // 'normal', 'bold', 'black'
  companyFontFamily: 'serif', // 'sans', 'serif', 'mono'
  companyItalic: false, // boolean
  companyUppercase: true, // boolean
  companyAlign: 'center', // 'left', 'center', 'right'
  taglineFontSize: 11, // px value, default 11
  showAddress: true,
  hideHeader: false,
  logoWidth: 180,
  logoHeight: 65,
  addressFontSize: 11.5, // numeric px value or 'xs', 'sm', 'md'
  addressFontWeight: 'semibold', // 'normal', 'semibold', 'bold'
  addressAlign: 'right', // 'left', 'center', 'right'
  addressFontFamily: 'sans', // 'sans', 'serif', 'mono'
  addressItalic: false, // boolean
  addressUppercase: false, // boolean
  customWorksAddress: ''
};

export const STORAGE_KEY = 'billpro_column_preferences';

export function getStoredPreferences() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        itemColumns: DEFAULT_ITEM_COLUMNS,
        dcFields: DEFAULT_DC_FIELDS,
        headerPreferences: DEFAULT_HEADER_PREFERENCES
      };
    }
    const parsed = JSON.parse(raw);
    return {
      itemColumns: Array.isArray(parsed.itemColumns) 
        ? parsed.itemColumns
        : DEFAULT_ITEM_COLUMNS,
      dcFields: Array.isArray(parsed.dcFields) 
        ? parsed.dcFields.map(f => {
            if (f.label === 'Invoice .No') return { ...f, label: 'Invoice No.', defaultLabel: 'Invoice No.' };
            if (f.label === 'IN D.C.No') return { ...f, label: 'IN D.C. No.', defaultLabel: 'IN D.C. No.' };
            if (f.label === 'OUT D.C No') return { ...f, label: 'OUT D.C. No.', defaultLabel: 'OUT D.C. No.' };
            return f;
          })
        : DEFAULT_DC_FIELDS,
      headerPreferences: {
        ...DEFAULT_HEADER_PREFERENCES,
        ...(parsed.headerPreferences || {})
      }
    };
  } catch (e) {
    return {
      itemColumns: DEFAULT_ITEM_COLUMNS,
      dcFields: DEFAULT_DC_FIELDS,
      headerPreferences: DEFAULT_HEADER_PREFERENCES
    };
  }
}

export function saveStoredPreferences(preferences) {
  try {
    const existing = getStoredPreferences();
    const merged = {
      itemColumns: preferences.itemColumns || existing.itemColumns,
      dcFields: preferences.dcFields || existing.dcFields,
      headerPreferences: {
        ...existing.headerPreferences,
        ...(preferences.headerPreferences || {})
      }
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    return merged;
  } catch (e) {
    console.error('Failed to save column preferences:', e);
  }
}
