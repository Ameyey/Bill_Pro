# Implementation Plan: Production-Grade Billing & Invoice Management System (BillPro)

Build a full-stack, production-ready Billing & Invoice Management SaaS Web Application matching Indian GST requirements, sample invoice format (industrial/DC layout with bank details, item table, amount in words), multi-GST customer handling, strict max-2 image management, 29-day free trial + ₹299 lifetime subscription model, and rich reports.

---

## User Review Required

> [!IMPORTANT]
> - **Database Engine**: We will provide a resilient dual-mode database layer using SQLite (`better-sqlite3`/`sqlite3`) for instant out-of-the-box zero-setup execution, with support for MySQL via `.env` configuration (`DB_TYPE=mysql` or `sqlite`).
> - **Sample Invoice Layout**: We will provide multiple invoice templates including a layout modeled after your uploaded sample (*Vaishali Industries* style with Works address, In/Out D.C. No, Sq.Ft column, Bank Account/IFSC, Rupee in words, and Proprietor Signature) as well as Modern Tax Invoice layouts.
> - **Strict 2-Image Limit**: Enforced on frontend and backend (`invoice_images` & upload endpoints) with clear error messaging if exceeded.

---

## Architecture & Tech Stack

```
d:/Bill_Pro/
├── backend/
│   ├── src/
│   │   ├── config/ (db.js, jwt.js)
│   │   ├── controllers/ (auth, customer, product, invoice, subscription, report, settings, upload)
│   │   ├── middleware/ (auth.js, subscriptionCheck.js, upload.js)
│   │   ├── models/ (schema migrations, initial seeders)
│   │   ├── routes/ (api routes)
│   │   ├── utils/ (numberToWords.js, gstCalculator.js, pdfGenerator.js)
│   │   └── server.js
│   ├── uploads/
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/ (Navbar, Sidebar, Modal, StatCard, DataTable, ImageUploader, ConfirmDialog, Toast)
│   │   ├── context/ (AuthContext, SettingsContext)
│   │   ├── pages/
│   │   │   ├── Auth/ (Login, Register, ForgotPassword)
│   │   │   ├── Dashboard/ (DashboardHome)
│   │   │   ├── Customers/ (CustomerList, CustomerModal, GSTNumberManager)
│   │   │   ├── Products/ (ProductList, ProductModal)
│   │   │   ├── Invoices/ (CreateInvoice, InvoiceList, InvoiceDetail, InvoicePreview, EditInvoice)
│   │   │   ├── Subscriptions/ (SubscriptionPage, CheckoutModal)
│   │   │   ├── Reports/ (ReportsPage)
│   │   │   ├── Settings/ (CompanySettings, InvoiceSettings)
│   │   │   └── Images/ (ImageGalleryModal)
│   │   ├── utils/ (api.js, numberToIndianWords.js, formatters.js, printHelper.js)
│   │   ├── App.jsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
```

---

## Proposed Changes

### 1. Database Schema & Backend Core
- **Database Tables**:
  - `users` (id, name, email, password_hash, role, created_at)
  - `subscriptions` (id, user_id, plan_type ['trial', 'lifetime'], trial_start, trial_end, status ['active', 'expired'], created_at)
  - `payments` (id, user_id, amount, currency, transaction_id, payment_method, status, payment_date)
  - `company_settings` (id, user_id, company_name, logo_url, signature_url, address, state, city, pincode, phone, email, gstin, pan, bank_name, bank_branch, account_no, ifsc_code, website, invoice_prefix, next_invoice_no, default_gst_rate, terms_conditions, footer_text)
  - `customers` (id, user_id, name, contact_person, phone, email, address, state, city, pincode, created_at)
  - `customer_gst_numbers` (id, customer_id, gst_number, branch_or_state_name, is_default, created_at)
  - `products` (id, user_id, name, sku, description, price, unit, gst_rate, hsn_sac, stock_qty, created_at)
  - `invoices` (id, user_id, customer_id, customer_gst_id, invoice_number, invoice_date, due_date, in_dc_no, in_dc_date, out_dc_no, out_dc_date, subtotal, discount, taxable_amount, cgst_amount, sgst_amount, igst_amount, total_gst, grand_total, amount_in_words, payment_status, notes, terms, created_at)
  - `invoice_items` (id, invoice_id, product_id, description, sq_ft, quantity, rate, discount, gst_rate, gst_amount, total_amount)
  - `invoice_images` (id, invoice_id_or_user_id, image_type ['logo', 'signature_or_secondary'], file_path, file_name, file_size, mime_type, created_at)

### 2. Backend REST APIs
- `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`
- `GET/POST/PUT/DELETE /api/customers` + `/api/customers/:id/gst-numbers`
- `GET/POST/PUT/DELETE /api/products`
- `GET/POST/PUT/DELETE /api/invoices`, `/api/invoices/:id/pdf`
- `POST /api/upload` (Enforcing **maximum 2 images** rule)
- `GET /api/subscriptions/status`, `POST /api/subscriptions/pay-lifetime` (simulated payment verification storing transaction in DB)
- `GET /api/reports` (Daily, Weekly, Monthly, Yearly sales, customer-wise, product-wise, GST breakdowns)
- `GET/PUT /api/settings/company`

### 3. Frontend Features & Components
- **Auth**: Modern login & registration, "Remember Me", Password toggle, Forgot password flow.
- **Trial & Subscription Banner**: Dynamic top banner and dedicated Subscription page showing trial days countdown ("Trial: 29 Days"), upgrade button to ₹299 Lifetime Access with checkout modal.
- **Customer Management**: Full modal management with nested interactive GST Number manager (Add/Edit/Delete multiple GST numbers).
- **Product Management**: Full inventory/product table with HSN codes, Unit selection (Nos, Pcs, Kgs, Sq.Ft), quick search.
- **Create / Edit Invoice**:
  - Customer selection with instant auto-population of address, phone, and dynamically populated GST numbers dropdown.
  - Delivery Challan fields (`IN D.C. No & Date`, `OUT D.C. No & Date`).
  - Interactive line items table with Sq.Ft, Qty, Rate, Discount, GST rate picker.
  - Automatic intra-state (CGST/SGST) vs inter-state (IGST) calculation.
  - Live Indian Currency conversion ("Rupees Five Thousand Two Hundred Ninety-Four Rupees Only").
  - Upload section strictly limited to 2 images with live previews, progress, and replace/remove actions.
- **Invoice Preview & PDF Print**:
  - Authentic Industrial / GST layout matching the sample invoice provided (Works address, IN/OUT D.C. numbers, Sq.Ft column, Bank Details, PAN, Amount in words, Authorized Signatory).
  - Print dialog and clean client/server PDF generation.
- **Reports & Dashboard**:
  - Live revenue metrics, GST collected, recent invoices, chart visualization, export to CSV/PDF.

---

## Verification Plan

### Automated & API Verification
1. Start backend server, verify SQLite DB initialization & seed data.
2. Run automated test requests for:
   - Register -> Free 29-day trial auto-assigned.
   - Add customer with 3 GST numbers.
   - Upload 2 images (succeeds) -> Attempt 3rd image upload (blocked with "Maximum 2 images are allowed.").
   - Create invoice with customer's 2nd GST number, verify GST calculations, verify Indian Rupee words conversion.
   - Test lifetime subscription upgrade to ₹299 and verify persistence.

### Browser & UI Verification
1. Launch Vite dev server.
2. Verify Login screen, Dashboard stats, Customer GST management, Product catalog, Invoice generation, Live Preview, and PDF Print formatting.


npm run dev
node server