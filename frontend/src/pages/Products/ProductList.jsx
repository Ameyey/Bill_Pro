import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import { useToast } from '../../context/ToastContext';
import { formatCurrency, formatNumber } from '../../utils/formatters';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  Tag,
  Hash,
  Percent,
  Layers,
  Box
} from 'lucide-react';

export default function ProductList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { success, error } = useToast();

  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    description: '',
    price: '',
    unit: 'Nos',
    gst_rate: 18,
    hsn_sac: '',
    stock_qty: '100'
  });

  const [deleteId, setDeleteId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, [search]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/products${search ? `?search=${encodeURIComponent(search)}` : ''}`);
      if (res.success) {
        setProducts(res.products);
      }
    } catch (err) {
      error(err.message || 'Failed to fetch products.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      sku: '',
      description: '',
      price: '',
      unit: 'Nos',
      gst_rate: 18,
      hsn_sac: '',
      stock_qty: '100'
    });
    setShowModal(true);
  };

  const handleOpenEdit = (prod) => {
    setEditingProduct(prod);
    setFormData({
      name: prod.name || '',
      sku: prod.sku || '',
      description: prod.description || '',
      price: prod.price || '',
      unit: prod.unit || 'Nos',
      gst_rate: prod.gst_rate !== undefined ? prod.gst_rate : 18,
      hsn_sac: prod.hsn_sac || '',
      stock_qty: prod.stock_qty || '0'
    });
    setShowModal(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      error('Product name is required.');
      return;
    }

    try {
      if (editingProduct) {
        const res = await api.put(`/products/${editingProduct.id}`, formData);
        if (res.success) {
          success('Product updated successfully!');
          setShowModal(false);
          fetchProducts();
        }
      } else {
        const res = await api.post('/products', formData);
        if (res.success) {
          success('Product created successfully!');
          setShowModal(false);
          fetchProducts();
        }
      }
    } catch (err) {
      error(err.message || 'Failed to save product.');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      const res = await api.delete(`/products/${deleteId}`);
      if (res.success) {
        success('Product deleted successfully.');
        setDeleteId(null);
        fetchProducts();
      }
    } catch (err) {
      error(err.message || 'Failed to delete product.');
    } finally {
      setIsDeleting(false);
    }
  };

  const units = ['Nos', 'Pcs', 'Kgs', 'Sq.Ft', 'Mtr', 'Sets', 'Boxes', 'Ltr'];
  const gstRates = [0, 5, 12, 18, 28];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
            <Package className="w-7 h-7 text-brand-600" />
            <span>Products & Services</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage your pricing, HSN/SAC tax codes, units (Sq.Ft, Nos, Kgs), and stock
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-md shadow-brand-600/20 flex items-center gap-2 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products by name, SKU, HSN code, or description..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-brand-500 focus:bg-white focus:outline-none transition"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4">Product Name</th>
                <th className="py-3.5 px-3">SKU / Code</th>
                <th className="py-3.5 px-3">HSN/SAC</th>
                <th className="py-3.5 px-3">Unit</th>
                <th className="py-3.5 px-3 text-right">Price (₹)</th>
                <th className="py-3.5 px-3 text-center">GST %</th>
                <th className="py-3.5 px-3 text-center">Stock</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.map((prod) => (
                <tr key={prod.id} className="hover:bg-slate-50/60 transition">
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900 text-sm">{prod.name}</div>
                    {prod.description && (
                      <p className="text-[11px] text-slate-500 line-clamp-1">{prod.description}</p>
                    )}
                  </td>
                  <td className="py-3.5 px-3 font-mono text-slate-600">{prod.sku || '-'}</td>
                  <td className="py-3.5 px-3 font-mono text-slate-600">{prod.hsn_sac || '-'}</td>
                  <td className="py-3.5 px-3">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[11px]">
                      {prod.unit}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-right font-mono font-bold text-slate-900 text-sm">
                    {formatCurrency(prod.price)}
                  </td>
                  <td className="py-3.5 px-3 text-center">
                    <span className="px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 font-bold text-[11px]">
                      {prod.gst_rate}%
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-center font-mono font-medium text-slate-700">
                    {formatNumber(prod.stock_qty)}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleOpenEdit(prod)}
                        className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition"
                        title="Edit Product"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteId(prod.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title="Delete Product"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {products.length === 0 && !loading && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Package className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-bold text-slate-600">No Products Available</p>
                    <p className="text-xs text-slate-400">Add products to quickly populate invoices.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingProduct ? 'Edit Product' : 'Add New Product'}
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Product / Item Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. POWDER COATING - D. R. NO. D-R 3-15"
              className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                SKU / Item Code
              </label>
              <input
                type="text"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                placeholder="e.g. PC-DR-315"
                className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                HSN / SAC Code
              </label>
              <input
                type="text"
                value={formData.hsn_sac}
                onChange={(e) => setFormData({ ...formData, hsn_sac: e.target.value })}
                placeholder="e.g. 9988"
                className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Price / Rate (₹) *
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="0.00"
                className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Unit
              </label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
              >
                {units.map(u => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                GST Rate (%)
              </label>
              <select
                value={formData.gst_rate}
                onChange={(e) => setFormData({ ...formData, gst_rate: parseFloat(e.target.value) })}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none font-bold"
              >
                {gstRates.map(r => (
                  <option key={r} value={r}>{r}% GST</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Description / Job Work Specification
            </label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="e.g. 7-tank chemical treatment and pure polyester powder coat finish"
              className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md"
            >
              {editingProduct ? 'Save Changes' : 'Create Product'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Product?"
        message="Are you sure you want to remove this product from your catalog?"
        loading={isDeleting}
      />
    </div>
  );
}
