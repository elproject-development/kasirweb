import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Package, Plus, Edit2, Trash2, Search, X, Loader2, Upload, Image as ImageIcon, FileSpreadsheet } from 'lucide-react';
import toast from 'react-hot-toast';
import ExcelJS from 'exceljs';

const API_URL = 'http://localhost:3001/products';
const categories = ['Makanan', 'Minuman', 'Snack'];

const Products = () => {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: 'Makanan',
    image: '',
  });
  const fileInputRef = useRef(null);
  const excelInputRef = useRef(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error('Gagal mengambil data produk');
      const data = await res.json();
      setProducts(data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => `Rp ${parseInt(price).toLocaleString('id-ID')}`;

  const formatPriceInput = (value) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    if (!digits) return '';
    // Format with thousand separators (dots for Indonesian format)
    return parseInt(digits).toLocaleString('id-ID');
  };

  const handlePriceChange = (value) => {
    const formatted = formatPriceInput(value);
    setFormData({ ...formData, price: formatted });
  };

  const filteredProducts = products.filter(product => {
    return product.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const openAddModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      price: '',
      category: 'Makanan',
      image: '',
    });
    setShowModal(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      price: formatPriceInput(String(product.price ?? '')),
      category: product.category || 'Makanan',
      image: product.image || '',
    });
    setShowModal(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Ukuran gambar maksimal 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, image: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.price) {
      toast.error('Nama dan harga harus diisi!');
      return;
    }

    setSubmitting(true);
    try {
      if (editingProduct) {
        const res = await fetch(`${API_URL}/${editingProduct.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name,
            price: parseInt(formData.price.replace(/\./g, '') || 0),
            category: formData.category,
            image: formData.image,
          }),
        });
        if (!res.ok) throw new Error('Gagal memperbarui produk');
        const updated = await res.json();
        setProducts(products.map(p => p.id === editingProduct.id ? updated : p));
        toast.success('Produk berhasil diperbarui!');
      } else {
        const res = await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name,
            price: parseInt(formData.price.replace(/\./g, '') || 0),
            category: formData.category,
            image: formData.image,
          }),
        });
        if (!res.ok) throw new Error('Gagal menambahkan produk');
        const newProduct = await res.json();
        setProducts([...products, newProduct]);
        toast.success('Produk berhasil ditambahkan!');
      }
      setShowModal(false);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    const confirmed = await new Promise((resolve) => {
      toast(
        (t) => (
          <div className="flex flex-col gap-3">
            <div className="text-sm text-slate-100">
              Apakah Anda yakin ingin menghapus produk ini?
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                className="px-3 py-1.5 rounded-lg bg-red-500/20 border border-red-500/30 text-red-200 hover:bg-red-500/30 transition-colors"
                onClick={() => {
                  toast.dismiss(t.id);
                  resolve(true);
                }}
              >
                Hapus
              </button>
              <button
                type="button"
                className="px-3 py-1.5 rounded-lg bg-slate-800/60 border border-purple-500/20 text-purple-200 hover:bg-slate-800/80 transition-colors"
                onClick={() => {
                  toast.dismiss(t.id);
                  resolve(false);
                }}
              >
                Batal
              </button>
            </div>
          </div>
        ),
        { duration: Infinity }
      );
    });

    if (!confirmed) return;

    try {
      const loadingId = toast.loading('Menghapus produk...');
      const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Gagal menghapus produk');
      setProducts(products.filter(p => p.id !== id));
      toast.dismiss(loadingId);
      toast.success('Produk berhasil dihapus!');
    } catch (err) {
      toast.dismiss();
      toast.error(err.message);
    }
  };

  // Fungsi import dari Excel
  const handleImportExcel = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validasi ekstensi file
    const validExtensions = ['.xlsx'];
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!validExtensions.includes(fileExtension)) {
      toast.error('Format file tidak didukung! Gunakan .xlsx');
      return;
    }

    setImporting(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(data);

      const worksheet = workbook.worksheets[0];
      if (!worksheet) {
        toast.error('File Excel tidak memiliki worksheet!');
        setImporting(false);
        return;
      }

      // Skip header row (rowNumber = 1)
      const dataRows = [];
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;
        const name = (row.getCell(1).text || '').toString().trim();
        const category = (row.getCell(2).text || '').toString().trim();
        const priceRaw = row.getCell(3).value;
        const priceText = (row.getCell(3).text || '').toString();
        dataRows.push({ name, category, priceRaw, priceText });
      });

      const filteredRows = dataRows.filter(r => r.name);
      if (filteredRows.length === 0) {
        toast.error('File Excel kosong atau tidak memiliki data!');
        setImporting(false);
        return;
      }

      let successCount = 0;
      let failCount = 0;

      // Proses setiap baris
      for (const row of filteredRows) {
        const name = row.name;
        const category = row.category || 'Makanan';

        let price = 0;
        if (typeof row.priceRaw === 'number') {
          price = Math.round(row.priceRaw);
        } else {
          price = parseInt((row.priceText || '').replace(/\D/g, '') || '0');
        }

        if (!name || price <= 0) {
          failCount++;
          continue;
        }

        try {
          const res = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name,
              category: categories.includes(category) ? category : 'Makanan',
              price,
              image: '',
            }),
          });
          if (res.ok) {
            successCount++;
          } else {
            failCount++;
          }
        } catch {
          failCount++;
        }
      }

      // Refresh data produk
      await fetchProducts();

      if (successCount > 0) {
        toast.success(`Berhasil mengimport ${successCount} produk!${failCount > 0 ? ` (${failCount} gagal)` : ''}`);
      } else {
        toast.error('Tidak ada produk yang berhasil diimport!');
      }
    } catch (err) {
      toast.error('Gagal membaca file Excel: ' + err.message);
    } finally {
      setImporting(false);
      // Reset input file
      if (excelInputRef.current) {
        excelInputRef.current.value = '';
      }
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <h2 className="text-2xl font-semibold bg-gradient-to-r from-violet-400 via-purple-400 to-fuchsia-400 bg-clip-text text-transparent">Manajemen Produk</h2>
        <div className="flex gap-2">
          <motion.button
            onClick={() => excelInputRef.current?.click()}
            disabled={importing}
            whileTap={importing ? undefined : { scale: 0.92 }}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg shadow-lg shadow-black/40 hover:shadow-xl hover:shadow-black/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {importing ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileSpreadsheet size={20} />}
            Import Excel
          </motion.button>
          <input
            ref={excelInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleImportExcel}
            className="hidden"
          />
          <motion.button
            onClick={openAddModal}
            whileTap={{ scale: 0.92 }}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg shadow-lg shadow-black/40 hover:shadow-xl hover:shadow-black/50 transition-all"
          >
            <Plus size={20} />
            Tambah Produk
          </motion.button>
        </div>
      </div>

      {/* Search */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-300/70" size={20} />
          <input
            type="text"
            placeholder="Cari produk..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-purple-500/30 rounded-xl text-white placeholder-purple-300/50 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {filteredProducts.map(product => (
          <div
            key={product.id}
            className="group bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-purple-500/20 overflow-hidden hover:shadow-xl hover:shadow-purple-500/20 hover:-translate-y-1 transition-all duration-300"
          >
            <div className="h-32 bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center overflow-hidden relative">
              <div className="absolute top-2 right-2 z-20 flex gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={() => openEditModal(product)}
                  className="p-2 rounded-lg bg-slate-950/60 border border-purple-500/20 text-purple-200 hover:bg-slate-950/80 transition-colors"
                  aria-label="Edit produk"
                  title="Edit"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(product.id)}
                  className="p-2 rounded-lg bg-slate-950/60 border border-red-500/30 text-red-300 hover:bg-slate-950/80 transition-colors"
                  aria-label="Hapus produk"
                  title="Hapus"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              {product.image ? (
                <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <>
                  <div className="absolute inset-0 bg-white/5 backdrop-blur-sm" />
                  <ImageIcon className="w-12 h-12 text-purple-300/60 relative z-10" />
                </>
              )}
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-white text-end truncate">{product.name}</h3>
              <div className="mt-1 flex items-center justify-between gap-3">
                <p className="text-sm text-ellipsis text-purple-300 truncate">{product.category || '-'}</p>
                <p className="font-bold text-purple-200 whitespace-nowrap">{formatPrice(product.price)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-purple-500/20 shadow-lg shadow-purple-500/10 p-8 text-center text-purple-300 mt-6">
          <Package size={48} className="mx-auto mb-4 opacity-50" />
          <p>Tidak ada produk ditemukan</p>
        </div>
      )}

      {/* Modal Add/Edit */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 rounded-2xl border border-purple-500/20 shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-purple-500/20">
              <h3 className="text-lg font-semibold text-white">
                {editingProduct ? 'Edit Produk' : 'Tambah Produk Baru'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-purple-300 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <style>{`
                .product-category-select option {
                  background-color: #0f172a;
                  color: #ffffff;
                }
              `}</style>
              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">Nama Produk</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-purple-500/30 rounded-xl text-white placeholder-purple-300/50 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Masukkan nama produk"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">Harga (Rp)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={formData.price}
                  onChange={(e) => handlePriceChange(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-purple-500/30 rounded-xl text-white placeholder-purple-300/50 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Rp 0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">Kategori</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="product-category-select w-full px-4 py-3 pr-10 bg-slate-800/50 border border-purple-500/30 rounded-xl text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none bg-no-repeat bg-[length:16px_16px] bg-[position:right_0.75rem_center]"
                  style={{
                    backgroundImage:
                      "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23c4b5fd' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")",
                  }}
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">Foto Produk</label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="relative w-full h-40 border-2 border-dashed border-purple-500/30 rounded-xl hover:border-purple-500 transition-colors cursor-pointer overflow-hidden bg-slate-800/30"
                >
                  {formData.image ? (
                    <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-purple-300/70">
                      <Upload size={32} />
                      <p className="text-sm mt-2">Klik untuk upload foto</p>
                      <p className="text-xs mt-1">Maksimal 2MB</p>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                {formData.image && (
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, image: '' })}
                    className="mt-2 text-sm text-red-300 hover:text-red-200"
                  >
                    Hapus Foto
                  </button>
                )}
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-3 bg-slate-800/50 border border-purple-500/20 text-purple-200 rounded-xl hover:bg-slate-700/50 transition-colors"
                >
                  Batal
                </button>
                <motion.button
                  type="submit"
                  disabled={submitting}
                  whileTap={submitting ? undefined : { scale: 0.92 }}
                  className="flex-1 px-4 py-3 bg-purple-500 text-white rounded-xl shadow-lg shadow-black/40 hover:shadow-xl hover:shadow-black/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingProduct ? 'Simpan Perubahan' : 'Tambah Produk'}
                </motion.button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
