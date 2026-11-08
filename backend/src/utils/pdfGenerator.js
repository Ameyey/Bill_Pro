const PDFDocument = require('pdfkit');

function generateInvoicePdf(invoice, company, items, res) {
  const doc = new PDFDocument({ margin: 40, size: 'A4' });
  doc.pipe(res);

  // Header
  doc.fontSize(20).text(company?.company_name || 'TAX INVOICE', { align: 'center', bold: true });
  if (company?.tagline) {
    doc.fontSize(10).text(company.tagline, { align: 'center' });
  }
  if (company?.address) {
    doc.fontSize(9).text(`${company.address}, ${company.city || ''} - ${company.pincode || ''}`, { align: 'center' });
  }
  doc.moveDown(0.5);
  doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
  doc.moveDown(0.5);

  // Invoice & Customer Info
  const startY = doc.y;
  doc.fontSize(10).font('Helvetica-Bold').text('Invoice Details:');
  doc.font('Helvetica').fontSize(9)
    .text(`Invoice No: ${invoice.invoice_number || 'N/A'}`)
    .text(`Date: ${invoice.invoice_date || ''}`)
    .text(`Payment Status: ${invoice.payment_status || 'Pending'}`);

  doc.font('Helvetica-Bold').fontSize(10).text('Bill To (Customer):', 300, startY);
  doc.font('Helvetica').fontSize(9)
    .text(invoice.customer_name || 'Valued Customer', 300)
    .text(`GSTIN: ${invoice.selected_gst_number || invoice.customer_gst_number || 'N/A'}`, 300)
    .text(`Address: ${invoice.customer_address || ''}`, 300);

  doc.moveDown(1.5);
  doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
  doc.moveDown(0.5);

  // Items Table Header
  const tableTop = doc.y;
  doc.font('Helvetica-Bold').fontSize(9);
  doc.text('Sr', 40, tableTop, { width: 30 });
  doc.text('Description', 75, tableTop, { width: 200 });
  doc.text('Qty', 280, tableTop, { width: 40, align: 'right' });
  doc.text('Rate', 325, tableTop, { width: 60, align: 'right' });
  doc.text('GST %', 390, tableTop, { width: 45, align: 'right' });
  doc.text('Total (INR)', 440, tableTop, { width: 115, align: 'right' });

  doc.moveTo(40, tableTop + 15).lineTo(555, tableTop + 15).stroke();

  let y = tableTop + 22;
  doc.font('Helvetica').fontSize(9);
  (items || []).forEach((item, index) => {
    doc.text((index + 1).toString(), 40, y, { width: 30 });
    doc.text(item.description || item.product_name || 'Item', 75, y, { width: 200 });
    doc.text((item.quantity || 1).toString(), 280, y, { width: 40, align: 'right' });
    doc.text(Number(item.rate || 0).toFixed(2), 325, y, { width: 60, align: 'right' });
    doc.text(`${item.gst_rate || 0}%`, 390, y, { width: 45, align: 'right' });
    doc.text(Number(item.total_amount || (item.quantity * item.rate) || 0).toFixed(2), 440, y, { width: 115, align: 'right' });
    y += 18;
  });

  doc.moveTo(40, y + 5).lineTo(555, y + 5).stroke();
  y += 15;

  // Summary Totals
  doc.font('Helvetica-Bold').fontSize(10);
  doc.text(`Subtotal: Rs. ${Number(invoice.subtotal || 0).toFixed(2)}`, 350, y, { align: 'right', width: 205 });
  y += 15;
  doc.text(`Total GST: Rs. ${Number(invoice.total_gst || 0).toFixed(2)}`, 350, y, { align: 'right', width: 205 });
  y += 15;
  doc.fontSize(11).text(`Grand Total: Rs. ${Number(invoice.grand_total || 0).toFixed(2)}`, 350, y, { align: 'right', width: 205 });
  y += 20;

  if (invoice.amount_in_words) {
    doc.font('Helvetica-Oblique').fontSize(9).text(`Amount in Words: ${invoice.amount_in_words}`, 40, y);
  }

  doc.end();
}

module.exports = { generateInvoicePdf };

