import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trash2, AlertTriangle, Loader2, Store, Save, Eye, X } from 'lucide-react';
import toast from 'react-hot-toast';

const PRODUCTS_API_URL = 'http://localhost:3001/products';
const TRANSACTIONS_API_URL = 'http://localhost:3001/transactions';

const Settings = () => {
  const [deleting, setDeleting] = useState(false);
  const [deletingTransactions, setDeletingTransactions] = useState(false);
  const [savingStore, setSavingStore] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [newCashierName, setNewCashierName] = useState('');
  const [storeSettings, setStoreSettings] = useState(() => {
    const saved = localStorage.getItem('storeSettings');
    const defaults = {
      storeName: 'EL PROJECT STORE',
      storeAddress: 'Jl.PGRI II No.136,Sonopakis Kidul,Ngestiharjo,Kasihan,Bantul',
      storePhone: '0838-6718-0887',
      receiptFooter: 'Terima kasih sudah mampir di warung kami\nLayanan 24 jam siap melayani',
      cashierList: ['Kasir 1', 'Kasir 2', 'Kasir 3'],
    };
    if (!saved) return defaults;
    try {
      const parsed = JSON.parse(saved);
      return {
        ...defaults,
        ...parsed,
        cashierList: Array.isArray(parsed.cashierList) ? parsed.cashierList : defaults.cashierList,
      };
    } catch {
      return defaults;
    }
  });

  const handleAddCashier = () => {
    const name = newCashierName.trim();
    if (!name) {
      toast.error('Nama kasir tidak boleh kosong');
      return;
    }
    const exists = (storeSettings.cashierList || []).some((c) => c.toLowerCase() === name.toLowerCase());
    if (exists) {
      toast.error('Nama kasir sudah ada');
      return;
    }
    setStoreSettings((prev) => ({
      ...prev,
      cashierList: [...(prev.cashierList || []), name],
    }));
    setNewCashierName('');
  };

  const handleDeleteCashier = (name) => {
    setStoreSettings((prev) => ({
      ...prev,
      cashierList: (prev.cashierList || []).filter((c) => c !== name),
    }));
  };

  const handleSaveStoreSettings = async () => {
    setSavingStore(true);
    try {
      localStorage.setItem('storeSettings', JSON.stringify(storeSettings));
      window.dispatchEvent(new CustomEvent('storeSettingsUpdated'));
      toast.success('Pengaturan toko berhasil disimpan!');
    } catch (err) {
      toast.error('Gagal menyimpan pengaturan');
    } finally {
      setSavingStore(false);
    }
  };

  // Sample transaction untuk preview
  const sampleTransaction = {
    date: new Date().toISOString(),
    items: [
      { name: 'Nasi Goreng Spesial', price: 25000, quantity: 2 },
      { name: 'Es Teh Manis', price: 5000, quantity: 2 },
      { name: 'Kerupuk', price: 3000, quantity: 1 },
    ],
    subtotal: 63000,
    discount: { value: 10, amount: 6300 },
    ppn: { rate: 11, amount: 6237 },
    total: 62937,
    paymentMethod: 'Cash',
    cashReceived: 70000,
    change: 7063
  };

  const formatPrice = (price) => `Rp ${Math.round(price).toLocaleString('id-ID')}`;

  // Fungsi hapus semua produk dengan proteksi toast berlapis
  const handleDeleteAllProducts = () => {
    toast((t1) => (
      <div className="flex flex-col gap-3 p-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <p className="font-semibold text-white text-sm">Peringatan!</p>
            <p className="text-xs text-slate-400">Anda akan menghapus SEMUA produk</p>
          </div>
        </div>
        <p className="text-xs text-slate-300">Tindakan ini tidak dapat dibatalkan. Lanjutkan?</p>
        <div className="flex gap-2 justify-end">
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => toast.dismiss(t1.id)}
            className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white transition-colors rounded-lg hover:bg-slate-700"
          >
            Batal
          </motion.button>
          <motion.button
            onClick={() => {
              toast.dismiss(t1.id);
              setTimeout(() => {
                toast((t2) => (
                  <div className="flex flex-col gap-3 p-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                        <Trash2 className="w-5 h-5 text-red-500" />
                      </div>
                      <div>
                        <p className="font-semibold text-white text-sm">Konfirmasi Final</p>
                        <p className="text-xs text-slate-400">Ketik "HAPUS" untuk mengkonfirmasi</p>
                      </div>
                    </div>
                    <input type="text" placeholder="Ketik HAPUS" className="w-full px-3 py-2 bg-slate-800 border border-red-500/30 rounded-lg text-white text-sm focus:ring-2 focus:ring-red-500" id="confirm-delete-input" />
                    <div className="flex gap-2 justify-end">
                      <motion.button
                        whileTap={{ scale: 0.92 }}
                        onClick={() => toast.dismiss(t2.id)}
                        className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white transition-colors rounded-lg hover:bg-slate-700"
                      >
                        Batal
                      </motion.button>
                      <motion.button
                        onClick={async () => {
                          const input = document.getElementById('confirm-delete-input');
                          if (input?.value?.toUpperCase() === 'HAPUS') {
                            toast.dismiss(t2.id);
                            await executeDeleteAll();
                          } else {
                            toast.error('Konfirmasi salah! Ketik "HAPUS"');
                          }
                        }}
                        className="px-4 py-2 text-xs font-medium bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                        whileTap={{ scale: 0.92 }}
                      >Hapus Semua</motion.button>
                    </div>
                  </div>
                ), { duration: Infinity, style: { background: 'linear-gradient(135deg, #1e293b 0%, #450a0a 100%)', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: '12px', padding: '16px', minWidth: '300px' } });
              }, 300);
            }}
            className="px-4 py-2 text-xs font-medium bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
            whileTap={{ scale: 0.92 }}
          >Lanjutkan</motion.button>
        </div>
      </div>
    ), { duration: Infinity, style: { background: 'linear-gradient(135deg, #1e293b 0%, #451a03 100%)', border: '1px solid rgba(245, 158, 11, 0.4)', borderRadius: '12px', padding: '16px', minWidth: '300px' } });
  };

  const executeDeleteAll = async () => {
    setDeleting(true);
    try {
      const res = await fetch(PRODUCTS_API_URL);
      if (!res.ok) throw new Error('Gagal mengambil data produk');
      const products = await res.json();
      if (products.length === 0) {
        toast.success('Tidak ada produk untuk dihapus');
        return;
      }
      let successCount = 0, failCount = 0;
      for (const product of products) {
        try {
          const deleteRes = await fetch(`${PRODUCTS_API_URL}/${product.id}`, { method: 'DELETE' });
          deleteRes.ok ? successCount++ : failCount++;
        } catch { failCount++; }
      }
      failCount === 0 ? toast.success(`Berhasil menghapus semua ${successCount} produk!`) : toast.error(`Berhasil menghapus ${successCount}, gagal ${failCount} produk`);
    } catch (err) {
      toast.error(err.message || 'Gagal menghapus produk');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteAllTransactions = () => {
    toast((t1) => (
      <div className="flex flex-col gap-3 p-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-purple-500" />
          </div>
          <div>
            <p className="font-semibold text-white text-sm">Peringatan!</p>
            <p className="text-xs text-slate-400">Anda akan menghapus SEMUA transaksi penjualan</p>
          </div>
        </div>
        <p className="text-xs text-slate-300">Data laporan penjualan akan hilang permanen. Lanjutkan?</p>
        <div className="flex gap-2 justify-end">
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => toast.dismiss(t1.id)}
            className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white transition-colors rounded-lg hover:bg-slate-700"
          >
            Batal
          </motion.button>
          <motion.button
            onClick={() => {
              toast.dismiss(t1.id);
              setTimeout(() => {
                toast((t2) => (
                  <div className="flex flex-col gap-3 p-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                        <Trash2 className="w-5 h-5 text-red-500" />
                      </div>
                      <div>
                        <p className="font-semibold text-white text-sm">Konfirmasi Final</p>
                        <p className="text-xs text-slate-400">Ketik "HAPUS" untuk mengkonfirmasi</p>
                      </div>
                    </div>
                    <input type="text" placeholder="Ketik HAPUS" className="w-full px-3 py-2 bg-slate-800 border border-red-500/30 rounded-lg text-white text-sm focus:ring-2 focus:ring-red-500" id="confirm-delete-transactions-input" />
                    <div className="flex gap-2 justify-end">
                      <motion.button
                        whileTap={{ scale: 0.92 }}
                        onClick={() => toast.dismiss(t2.id)}
                        className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white transition-colors rounded-lg hover:bg-slate-700"
                      >
                        Batal
                      </motion.button>
                      <motion.button
                        onClick={async () => {
                          const input = document.getElementById('confirm-delete-transactions-input');
                          if (input?.value?.toUpperCase() === 'HAPUS') {
                            toast.dismiss(t2.id);
                            await executeDeleteAllTransactions();
                          } else {
                            toast.error('Konfirmasi salah! Ketik "HAPUS"');
                          }
                        }}
                        className="px-4 py-2 text-xs font-medium bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                        whileTap={{ scale: 0.92 }}
                      >Hapus Semua</motion.button>
                    </div>
                  </div>
                ), { duration: Infinity, style: { background: 'linear-gradient(135deg, #1e293b 0%, #450a0a 100%)', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: '12px', padding: '16px', minWidth: '300px' } });
              }, 300);
            }}
            className="px-4 py-2 text-xs font-medium bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
            whileTap={{ scale: 0.92 }}
          >
            Lanjutkan
          </motion.button>
        </div>
      </div>
    ), { duration: Infinity, style: { background: 'linear-gradient(135deg, #1e293b 0%, #312e81 100%)', border: '1px solid rgba(168, 85, 247, 0.4)', borderRadius: '12px', padding: '16px', minWidth: '300px' } });
  };

  const executeDeleteAllTransactions = async () => {
    setDeletingTransactions(true);
    try {
      const res = await fetch(TRANSACTIONS_API_URL);
      if (!res.ok) throw new Error('Gagal mengambil data transaksi');
      const transactions = await res.json();
      if (transactions.length === 0) {
        toast.success('Tidak ada transaksi untuk dihapus');
        return;
      }
      let successCount = 0, failCount = 0;
      for (const transaction of transactions) {
        try {
          const deleteRes = await fetch(`${TRANSACTIONS_API_URL}/${transaction.id}`, { method: 'DELETE' });
          deleteRes.ok ? successCount++ : failCount++;
        } catch { failCount++; }
      }
      failCount === 0 ? toast.success(`Berhasil menghapus semua ${successCount} transaksi!`) : toast.error(`Berhasil menghapus ${successCount}, gagal ${failCount} transaksi`);
    } catch (err) {
      toast.error(err.message || 'Gagal menghapus transaksi');
    } finally {
      setDeletingTransactions(false);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold bg-gradient-to-r from-violet-400 via-purple-400 to-fuchsia-400 bg-clip-text text-transparent mb-6">Pengaturan</h2>
      
      {/* Pengaturan Toko */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-lg shadow-purple-500/10 p-6 mb-6 border border-purple-500/20">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
            <Store className="w-6 h-6 text-purple-300" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-medium text-white">Pengaturan Toko</h3>
            <p className="text-sm text-purple-200/70">Ubah informasi toko yang akan tampil di nota/struk.</p>
          </div>
        </div>
        
        <div className="space-y-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-purple-200 mb-2">Nama Toko</label>
            <input type="text" value={storeSettings.storeName} onChange={(e) => setStoreSettings({...storeSettings, storeName: e.target.value})} className="w-full px-4 py-3 bg-slate-900/40 border border-purple-500/30 rounded-xl text-white placeholder-purple-200/40 focus:ring-2 focus:ring-purple-500 focus:border-transparent" placeholder="Nama toko" />
          </div>
          <div>
            <label className="block text-sm font-medium text-purple-200 mb-2">Alamat Toko</label>
            <textarea value={storeSettings.storeAddress} onChange={(e) => setStoreSettings({...storeSettings, storeAddress: e.target.value})} className="w-full px-4 py-3 bg-slate-900/40 border border-purple-500/30 rounded-xl text-white placeholder-purple-200/40 focus:ring-2 focus:ring-purple-500 focus:border-transparent" rows="2" placeholder="Alamat lengkap toko" />
          </div>
          <div>
            <label className="block text-sm font-medium text-purple-200 mb-2">No. Telepon</label>
            <input type="text" value={storeSettings.storePhone} onChange={(e) => setStoreSettings({...storeSettings, storePhone: e.target.value})} className="w-full px-4 py-3 bg-slate-900/40 border border-purple-500/30 rounded-xl text-white placeholder-purple-200/40 focus:ring-2 focus:ring-purple-500 focus:border-transparent" placeholder="Nomor telepon" />
          </div>
          <div>
            <label className="block text-sm font-medium text-purple-200 mb-2">Footer Nota</label>
            <textarea value={storeSettings.receiptFooter} onChange={(e) => setStoreSettings({...storeSettings, receiptFooter: e.target.value})} className="w-full px-4 py-3 bg-slate-900/40 border border-purple-500/30 rounded-xl text-white placeholder-purple-200/40 focus:ring-2 focus:ring-purple-500 focus:border-transparent" rows="2" placeholder="Teks footer di bawah nota" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <motion.button
              onClick={() => setShowPreview(true)}
              whileTap={{ scale: 0.92 }}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white rounded-xl shadow-lg shadow-orange-500/30 hover:shadow-xl transition-all"
            >
              <Eye className="w-4 h-4" />
              Preview Nota
            </motion.button>
            <motion.button
              onClick={handleSaveStoreSettings}
              disabled={savingStore}
              whileTap={savingStore ? undefined : { scale: 0.92 }}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 text-white rounded-xl hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {savingStore ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Simpan Pengaturan
                </>
              )}
            </motion.button>
          </div>
        </div>
      </div>

      {/* Daftar Kasir */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-lg shadow-purple-500/10 p-6 mb-6 border border-purple-500/20">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
            <Store className="w-6 h-6 text-purple-300" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-medium text-white">Daftar Kasir</h3>
            <p className="text-sm text-purple-200/70">Tambah atau hapus nama kasir di halaman POS.</p>
          </div>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={newCashierName}
            onChange={(e) => setNewCashierName(e.target.value)}
            className="flex-1 px-4 py-3 bg-slate-900/40 border border-purple-500/30 rounded-xl text-white placeholder-purple-200/40 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="Masukkan Nama Kasir"
          />
          <motion.button
            onClick={handleAddCashier}
            whileTap={{ scale: 0.92 }}
            className="px-4 py-3 bg-slate-900/40 text-purple-200 rounded-xl hover:bg-slate-900/60 transition-colors border border-purple-500/20"
          >
            Tambah
          </motion.button>
        </div>

        <div className="mt-4 space-y-2">
          {(storeSettings.cashierList || []).length === 0 ? (
            <p className="text-sm text-purple-200/70">Belum ada kasir. Tambahkan kasir terlebih dahulu.</p>
          ) : (
            (storeSettings.cashierList || []).map((name) => (
              <div key={name} className="flex items-center justify-between px-4 py-3 bg-slate-900/30 border border-purple-500/20 rounded-xl">
                <span className="text-sm text-white">{name}</span>
                <motion.button
                  onClick={() => handleDeleteCashier(name)}
                  whileTap={{ scale: 0.92 }}
                  className="p-2 text-red-300 hover:bg-red-500/15 rounded-lg transition-colors"
                  title="Hapus kasir"
                >
                  <Trash2 className="w-4 h-4" />
                </motion.button>
              </div>
            ))
          )}
        </div>

        <div className="flex justify-end mt-4">
          <motion.button
            onClick={handleSaveStoreSettings}
            disabled={savingStore}
            whileTap={savingStore ? undefined : { scale: 0.92 }}
            className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 text-white rounded-xl hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {savingStore ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Simpan Daftar Kasir
              </>
            )}
          </motion.button>
        </div>
      </div>

      {/* Hapus Semua Produk */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-lg shadow-purple-500/10 p-6 border border-red-500/30 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-red-800/15 rounded-xl flex items-center justify-center">
              <Trash2 className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-white">Hapus Semua Produk</h3>
              <p className="text-sm text-purple-200/70">Menghapus semua data produk dari database. Tindakan ini tidak dapat dibatalkan.</p>
              <p className="text-xs text-red-400 mt-1 font-medium">⚠️ Gunakan dengan hati-hati!</p>
            </div>
          </div>
          <motion.button
            onClick={handleDeleteAllProducts}
            disabled={deleting}
            whileTap={deleting ? undefined : { scale: 0.92 }}
            className="flex items-center gap-2 px-4 py-3 bg-red-500/20 border border-red-500/30 text-red-200 rounded-xl hover:bg-red-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {deleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Menghapus...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 text-red-400" />
                Hapus Semua
              </>
            )}
          </motion.button>
        </div>
      </div>

      {/* Hapus Semua Transaksi */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-lg shadow-purple-500/10 p-6 border border-purple-500/20">
        <div className="flex items-center justify-between">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-purple-800/20 rounded-xl flex items-center justify-center">
              <Trash2 className="w-6 h-6 text-purple-500" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-white">Hapus Semua Transaksi</h3>
              <p className="text-sm text-purple-200/70">Menghapus semua data transaksi penjualan dari database. Tindakan ini tidak dapat dibatalkan.</p>
              <p className="text-xs text-red-400 mt-1 font-medium">⚠️ Data laporan akan hilang permanen!</p>
            </div>
          </div>
          <motion.button
            onClick={handleDeleteAllTransactions}
            disabled={deletingTransactions}
            whileTap={deletingTransactions ? undefined : { scale: 0.92 }}
            className="flex items-center gap-2 px-4 py-3 bg-purple-500/20 border border-purple-500/30 text-purple-100 rounded-xl hover:bg-purple-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {deletingTransactions ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Menghapus...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                Hapus Semua
              </>
            )}
          </motion.button>
        </div>
      </div>

      {/* Modal Preview Nota */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 rounded-2xl border border-purple-500/20 shadow-2xl max-w-sm w-full max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between p-4 border-b border-purple-500/20 sticky top-0 bg-slate-900/60 backdrop-blur">
              <h3 className="text-lg font-semibold text-white">Preview Nota</h3>
              <motion.button
                onClick={() => setShowPreview(false)}
                whileTap={{ scale: 0.92 }}
                className="text-purple-300 hover:text-white transition-colors"
              >
                <X size={24} />
              </motion.button>
            </div>
            <div className="p-4 font-mono text-sm bg-slate-950/30 text-slate-100">
              <div className="text-center mb-2">
                <h2 className="text-lg font-bold">{storeSettings.storeName}</h2>
                <p className="text-xs text-slate-200/80">{storeSettings.storeAddress}</p>
                <p className="text-xs text-slate-200/80">Telp: {storeSettings.storePhone}</p>
              </div>
              <hr className="my-2" />
              <div className="text-xs mb-2">
                <div className="flex justify-between">
                  <span>ID.TRANSAKSI</span>
                  <span>TR-PREVIEW</span>
                </div>
                <div className="flex justify-between">
                  <span>{new Date().toLocaleDateString('id-ID')}</span>
                  <span>{new Date().toLocaleTimeString('id-ID', {hour: '2-digit', minute: '2-digit'})}</span>
                </div>
              </div>
              <hr className="my-2" />
              <table className="w-full text-xs mb-2">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-1">Item</th>
                    <th className="text-center">Qty</th>
                    <th className="text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {sampleTransaction.items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-1">{item.name}</td>
                      <td className="text-center">{item.quantity}</td>
                      <td className="text-right">{formatPrice(item.price * item.quantity)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <hr className="my-2" />
              <div className="text-xs space-y-1">
                <div className="flex justify-between"><span>Subtotal</span><span>{formatPrice(sampleTransaction.subtotal)}</span></div>
                <div className="flex justify-between"><span>Diskon {sampleTransaction.discount.value}%</span><span>{formatPrice(sampleTransaction.discount.amount)}</span></div>
                <div className="flex justify-between"><span>PPN {sampleTransaction.ppn.rate}%</span><span>{formatPrice(sampleTransaction.ppn.amount)}</span></div>
                <div className="flex justify-between font-bold border-t pt-1"><span>GRAND TOTAL</span><span>{formatPrice(sampleTransaction.total)}</span></div>
                <div className="flex justify-between"><span>Metode Bayar</span><span>{sampleTransaction.paymentMethod}</span></div>
                <div className="flex justify-between"><span>Tunai</span><span>{formatPrice(sampleTransaction.cashReceived)}</span></div>
                <div className="flex justify-between"><span>Kembali</span><span>{formatPrice(sampleTransaction.change)}</span></div>
              </div>
              <hr className="my-2" />
              <div className="text-center text-xs mt-4">
                {storeSettings.receiptFooter.split('\n').map((line, idx) => (
                  <p key={idx}>{line}</p>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
