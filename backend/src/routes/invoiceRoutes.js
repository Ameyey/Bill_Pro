const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/next-number', invoiceController.getNextInvoiceNumber);
router.get('/', invoiceController.getInvoices);
router.get('/:id', invoiceController.getInvoiceById);
router.get('/:id/pdf', invoiceController.generatePdf);
router.post('/', invoiceController.createInvoice);
router.put('/:id', invoiceController.updateInvoice);
router.patch('/:id/payment', invoiceController.updatePaymentStatus);
router.patch('/:id/payment-status', invoiceController.updatePaymentStatus);
router.put('/:id/payment', invoiceController.updatePaymentStatus);
router.delete('/:id', invoiceController.deleteInvoice);

module.exports = router;

