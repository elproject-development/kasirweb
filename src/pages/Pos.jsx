// src/pages/Pos.jsx
import React, { useState, useRef, useEffect } from 'react';
import { Plus, Minus, Trash2, CreditCard, Receipt, Percent, DollarSign, Search, ShoppingBag, X, Wallet, Banknote, QrCode, Loader2 } from 'lucide-react';
import { useCart } from '../context/CartContext';
import PrintReceipt from '../components/PrintReceipt';
import { useReactToPrint } from 'react-to-print';
import toast from 'react-hot-toast';
import { motion, useAnimation, AnimatePresence } from 'framer-motion';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';



const Pos = () => {
  const {
    cart,
    addToCart,
    updateQuantity,
    removeItem,
    subtotal,
    discount,
    setDiscount,
    ppn,
    setPpn,
    total,
    discountAmount,
    ppnAmount,
    loading,
    checkout,
  } = useCart();

  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [posSearchOnly, setPosSearchOnly] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [cashReceived, setCashReceived] = useState('');
  const [cashierName, setCashierName] = useState('');
  const [lastTransaction, setLastTransaction] = useState(null);
  const printRef = useRef();

  const cartIconRef = useRef(null);
  const checkoutButtonRef = useRef(null);
  const [flyingItem, setFlyingItem] = useState(null);

  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const [cashierOptions, setCashierOptions] = useState(['Kasir 1', 'Kasir 2', 'Kasir 3']);

  const cartControls = useAnimation();

  const handleAddToCart = (product, e) => {
    const sourceRect = e?.currentTarget?.getBoundingClientRect?.();
    const targetRect = checkoutButtonRef.current?.getBoundingClientRect?.() || cartIconRef.current?.getBoundingClientRect?.();

    if (sourceRect && targetRect) {
      const startX = sourceRect.left + sourceRect.width * 0.7;
      const startY = sourceRect.top + sourceRect.height * 0.35;
      const endX = targetRect.left + targetRect.width / 2;
      const endY = targetRect.top + targetRect.height / 2;

      const dx = endX - startX;
      const dy = endY - startY;
      const distance = Math.hypot(dx, dy);

      const pixelsPerSecond = 520;
      const duration = Math.max(1.15, Math.min(2.6, distance / pixelsPerSecond));
      const arcLift = Math.max(110, Math.min(260, distance * 0.22));

      setFlyingItem({
        key: `${product.id}-${Date.now()}`,
        startX,
        startY,
        endX,
        endY,
        duration,
        arcLift,
        label: product.image && typeof product.image === 'string' ? product.image : '🛒',
      });
    }

    addToCart(product);
    cartControls.start({
      scale: [1, 1.03, 1],
      boxShadow: [
        '0 0 0 rgba(168,85,247,0)',
        '0 0 0 4px rgba(168,85,247,0.22)',
        '0 0 0 rgba(168,85,247,0)',
      ],
      transition: { type: 'spring', stiffness: 700, damping: 28 },
    });
  };

  useEffect(() => {
    const loadCashiers = () => {
      try {
        const saved = localStorage.getItem('storeSettings');
        if (!saved) return;
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.cashierList) && parsed.cashierList.length > 0) {
          setCashierOptions(parsed.cashierList);
        }
      } catch {
        // ignore
      }
    };

    loadCashiers();
    window.addEventListener('storeSettingsUpdated', loadCashiers);
    return () => window.removeEventListener('storeSettingsUpdated', loadCashiers);
  }, []);

  useEffect(() => {
    if (loading) {
      setCheckoutLoading(true);
      return;
    }

    const timer = setTimeout(() => setCheckoutLoading(false), 1200);
    return () => clearTimeout(timer);
  }, [loading]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('posSearchOnly');
      setPosSearchOnly(saved === 'true');
    } catch {
      setPosSearchOnly(false);
    }

    const handler = (e) => {
      const next = Boolean(e?.detail?.value);
      setPosSearchOnly(next);
    };

    window.addEventListener('posSearchOnlyChanged', handler);
    return () => window.removeEventListener('posSearchOnlyChanged', handler);
  }, []);

  // Fetch products from API
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        if (!isSupabaseConfigured) {
          throw new Error('Supabase belum dikonfigurasi');
        }

        const { data, error } = await supabase
          .from('products')
          .select('*');

        if (error) throw error;
        setProducts(Array.isArray(data) ? data : []);
      } catch (err) {
        toast.error(err?.message || 'Gagal mengambil data produk');
        setProducts([]);
      } finally {
        setProductsLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: 'Struk Transaksi',
  });

  // Trigger print setelah state terupdate
  const [printTrigger, setPrintTrigger] = useState(false);

  useEffect(() => {
    if (printTrigger && lastTransaction) {
      // Small delay to ensure ref is ready
      const timer = setTimeout(() => {
        handlePrint();
        setPrintTrigger(false);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [printTrigger, lastTransaction]);

  const formatPrice = (price) => `Rp ${Math.round(price).toLocaleString('id-ID')}`;

  const formatCurrencyInput = (value) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    if (!digits) return '';
    // Format with thousand separators
    return parseInt(digits).toLocaleString('id-ID');
  };

  const handleCashChange = (value) => {
    const formatted = formatCurrencyInput(value);
    setCashReceived(formatted);
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const shouldShowProductGrid = !posSearchOnly || searchTerm.trim().length > 0;

  const handleDiscountChange = (value) => {
    let newValue = parseFloat(value);
    if (isNaN(newValue)) newValue = 0;
    if (newValue > 100) newValue = 100;
    if (newValue < 0) newValue = 0;
    setDiscount(newValue);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error('Keranjang kosong!');
      return;
    }

    if (!cashierName) {
      toast.error('Pilih nama kasir terlebih dahulu!');
      return;
    }

    let cashValue = null;
    if (paymentMethod === 'Cash') {
      // Remove dots from formatted value before parsing
      cashValue = parseFloat(cashReceived.replace(/\./g, ''));
      if (isNaN(cashValue) || cashValue < total) {
        toast.error('Uang tunai kurang dari total!');
        return;
      }
    }

    const transaction = await checkout(paymentMethod, cashValue, cashierName);
    if (transaction) {
      toast.success('Transaksi berhasil');
      setLastTransaction(transaction);
      setShowPaymentModal(false);
      setCashReceived('');
      setPaymentMethod('Cash');
      setCashierName('');
      // Trigger print setelah render
      setTimeout(() => setPrintTrigger(true), 100);
    } else {
      toast.error('Transaksi gagal!');
    }
  };

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <AnimatePresence>
        {flyingItem && (
          <motion.div
            key={flyingItem.key}
            className="fixed z-[9999] pointer-events-none"
            style={{ left: 0, top: 0 }}
            initial={{
              x: flyingItem.startX,
              y: flyingItem.startY,
              scale: 1.35,
              opacity: 1,
              rotate: 0,
            }}
            animate={{
              x: [flyingItem.startX, (flyingItem.startX + flyingItem.endX) / 2, flyingItem.endX],
              y: [
                flyingItem.startY,
                Math.min(flyingItem.startY, flyingItem.endY) - (flyingItem.arcLift ?? 180),
                flyingItem.endY,
              ],
              scale: [1.35, 1.1, 0.6],
              opacity: [1, 1, 0.9],
              rotate: [0, 12, 0],
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: flyingItem.duration ?? 1.4,
              ease: [0.22, 1, 0.36, 1],
            }}
            onAnimationComplete={() => setFlyingItem(null)}
          >
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-500/35 via-purple-500/25 to-fuchsia-500/20 backdrop-blur border-2 border-purple-400/50 shadow-2xl shadow-purple-500/60 flex items-center justify-center overflow-hidden">
              {typeof flyingItem.label === 'string' && (flyingItem.label.startsWith('data:') || flyingItem.label.startsWith('http')) ? (
                <img src={flyingItem.label} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl relative z-10 drop-shadow-lg">{typeof flyingItem.label === 'string' ? flyingItem.label : '🛒'}</span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="p-6">
        <div className="flex flex-col xl:flex-row gap-6">
          {/* Panel Kiri: Daftar Produk */}
          <div className="xl:w-2/3">
            {/* Search & Filter */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-purple-500/20 p-4 mb-6">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari produk..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-purple-500/30 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-white placeholder-purple-300/50"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                  {['all', 'Makanan', 'Minuman', 'Snack'].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`w-full sm:w-auto px-4 py-3 rounded-xl font-medium text-sm transition-all ${
                        selectedCategory === cat
                          ? 'bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 text-white shadow-lg shadow-purple-500/50'
                          : 'bg-slate-800/50 text-purple-300 hover:bg-slate-700/50 border border-purple-500/20'
                      }`}
                    >
                      {cat === 'all' ? 'Semua' : cat}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Grid Produk */}
            {!shouldShowProductGrid ? (
              <div className="flex items-center justify-center h-64 bg-slate-800/30 rounded-2xl border border-purple-500/10">
                <div className="text-center px-6">
                  <p className="text-purple-200 font-semibold">Mode Cari Saja aktif</p>
                  <p className="text-sm text-purple-300/70 mt-1">Ketik nama produk di kolom pencarian untuk menampilkan daftar.</p>
                </div>
              </div>
            ) : productsLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredProducts.map((product) => (
                  <motion.div
                    key={product.id}
                    className="group bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-purple-500/20 overflow-hidden hover:shadow-xl hover:shadow-purple-500/20 hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                    onClick={(e) => handleAddToCart(product, e)}
                    whileHover={{ y: -4, scale: 1.01 }}
                    whileTap={{ scale: 0.96 }}
                    transition={{ type: 'spring', stiffness: 600, damping: 30 }}
                  >
                    <div className={`h-32 ${product.color ? `bg-gradient-to-br ${product.color}` : 'bg-gradient-to-br from-slate-700 to-slate-800'} flex items-center justify-center relative overflow-hidden`}>
                      {product.image && (product.image.startsWith('data:') || product.image.startsWith('http')) ? (
                        <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <>
                          <div className="absolute inset-0 bg-white/10 backdrop-blur-sm" />
                          <span className="text-6xl relative z-10 drop-shadow-lg">{product.image || '📦'}</span>
                        </>
                      )}
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg">
                          <Plus className="w-4 h-4 text-blue-600" />
                        </div>
                      </div>
                    </div>
                    <div className="p-3">
                      <h3 className="font-semibold text-white text-sm truncate">{product.name}</h3>
                      <p className="text-sm font-semibold text-purple-200 mt-1">{formatPrice(product.price)}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Panel Kanan: Keranjang Belanja */}
          <div className="xl:w-1/3">
            <motion.div
              className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-purple-500/20"
              animate={cartControls}
            >
              {/* Header Keranjang */}
              <div className="bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 px-5 py-4 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div ref={cartIconRef} className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                      <ShoppingBag className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">Keranjang</h3>
                      <p className="text-xs text-blue-100">{cartItemCount} item</p>
                    </div>
                  </div>
                  {cart.length > 0 && (
                    <button
                      onClick={() => {
                        toast((t) => (
                          <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center">
                                <Trash2 className="w-4 h-4 text-red-400" />
                              </div>
                              <div>
                                <p className="font-semibold text-white text-sm">Kosongkan Keranjang?</p>
                                <p className="text-xs text-slate-400">{cartItemCount} item akan dihapus</p>
                              </div>
                            </div>
                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={() => toast.dismiss(t.id)}
                                className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white transition-colors"
                              >
                                Batal
                              </button>
                              <button
                                onClick={() => {
                                  cart.forEach(item => removeItem(item.id));
                                  toast.dismiss(t.id);
                                  toast.success('Keranjang dikosongkan');
                                }}
                                className="px-3 py-1.5 text-xs font-medium bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                              >
                                Hapus
                              </button>
                            </div>
                          </div>
                        ), {
                          duration: Infinity,
                          style: {
                            background: 'linear-gradient(135deg, #1e293b 0%, #312e81 100%)',
                            border: '1px solid rgba(168, 85, 247, 0.3)',
                            borderRadius: '12px',
                            padding: '16px',
                          },
                        });
                      }}
                      className="text-xs text-blue-100 hover:text-white transition-colors"
                    >
                      Kosongkan
                    </button>
                  )}
                </div>
              </div>

              {/* Daftar Item */}
              <div>
                {cart.length === 0 ? (
                  <div className="p-8 text-center">
                    <div className="w-16 h-16 bg-purple-500/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <ShoppingBag className="w-8 h-8 text-purple-300" />
                    </div>
                    <p className="text-purple-300">Keranjang kosong</p>
                    <p className="text-xs text-purple-400 mt-1">Pilih produk untuk memulai</p>
                  </div>
                ) : (
                  <div className="divide-y divide-purple-500/10">
                    {cart.map((item) => (
                      <div key={item.id} className="p-4 flex items-center gap-3 hover:bg-purple-500/10 transition-colors">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-white truncate">{item.name}</p>
                          <p className="text-sm text-purple-300">{formatPrice(item.price)}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => updateQuantity(item.id, -1)}
                            className="w-8 h-8 rounded-lg bg-slate-700 hover:bg-slate-600 flex items-center justify-center transition-colors"
                          >
                            <Minus className="w-4 h-4 text-purple-300" />
                          </button>
                          <span className="w-8 text-center font-semibold text-white">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, 1)}
                            className="w-8 h-8 rounded-lg bg-purple-500/30 hover:bg-purple-500/50 flex items-center justify-center transition-colors"
                          >
                            <Plus className="w-4 h-4 text-purple-200" />
                          </button>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="w-8 h-8 rounded-lg hover:bg-red-500/20 flex items-center justify-center transition-colors ml-1"
                          >
                            <Trash2 className="w-4 h-4 text-red-400 hover:text-red-300" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Diskon & PPN */}
              {cart.length > 0 && (
                <div className="p-4 bg-slate-900/50 border-t border-purple-500/20 space-y-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setDiscount(discount > 0 ? 0 : 5)}
                      className={`w-10 h-6 rounded-full transition-all relative ${
                        discount > 0 ? 'bg-amber-500' : 'bg-slate-600'
                      }`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${
                        discount > 0 ? 'left-5' : 'left-1'
                      }`} />
                    </button>
                    <span className="flex-1 text-sm text-purple-300">Diskon</span>
                    {discount > 0 && (
                      <>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={discount === 0 ? '' : discount}
                          onChange={(e) => handleDiscountChange(e.target.value)}
                          className="w-20 px-3 py-2 bg-slate-900 border border-purple-500/30 rounded-lg text-sm text-right text-white focus:ring-2 focus:ring-purple-500"
                          placeholder="0"
                        />
                        <span className="text-sm text-purple-400">%</span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPpn(ppn > 0 ? 0 : 11)}
                      className={`w-10 h-6 rounded-full transition-all relative ${
                        ppn > 0 ? 'bg-purple-500' : 'bg-slate-600'
                      }`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${
                        ppn > 0 ? 'left-5' : 'left-1'
                      }`} />
                    </button>
                    <span className="flex-1 text-sm text-purple-300">PPN</span>
                    {ppn > 0 && (
                      <>
                        <input
                          type="text"
                          value={ppn === 0 ? '' : ppn}
                          onChange={(e) => setPpn(parseFloat(e.target.value) || 0)}
                          className="w-20 px-3 py-2 bg-slate-900 border border-purple-500/30 rounded-lg text-sm text-right text-white focus:ring-2 focus:ring-purple-500"
                          placeholder="11"
                        />
                        <span className="text-sm text-purple-400">%</span>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Total & Checkout */}
              <div className="p-4 border-t border-purple-500/20">
                <div className="space-y-2 text-sm mb-4">
                  <div className="flex justify-between text-purple-300">
                    <span>Total</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-red-400">
                      <span>Diskon {discount} (%)</span>
                      <span> {formatPrice(discountAmount)}</span>
                    </div>
                  )}
                  {ppn > 0 && (
                    <div className="flex justify-between text-green-400">
                      <span>PPN {ppn} (%)</span>
                      <span>{formatPrice(ppnAmount)}</span>
                    </div>
                  )}
                </div>
                <div className="flex justify-between items-center py-3 px-4 bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 rounded-2xl mb-4">
                  <span className="text-white/80 font-medium">Grand Total</span>
                  <span className="text-2xl font-bold text-white">{formatPrice(total)}</span>
                </div>
                <motion.button
                  ref={checkoutButtonRef}
                  onClick={() => setShowPreviewModal(true)}
                  disabled={cart.length === 0 || checkoutLoading}
                  whileHover={
                    cart.length === 0 || checkoutLoading
                      ? undefined
                      : { scale: 1.01 }
                  }
                  whileTap={
                    cart.length === 0 || checkoutLoading
                      ? undefined
                      : { scale: 0.97, y: 2 }
                  }
                  transition={{ type: 'spring', stiffness: 500, damping: 30, mass: 0.6 }}
                  className={`w-full py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 transition-all ${
                    cart.length === 0 || checkoutLoading
                      ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 text-white shadow-lg shadow-purple-500/50 hover:shadow-xl hover:shadow-purple-500/60 hover:-translate-y-0.5'
                  }`}
                >
                  <AnimatePresence mode="wait" initial={false}>
                    {checkoutLoading ? (
                      <motion.span
                        key="loading"
                        className="inline-flex items-center justify-center gap-2"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.18 }}
                      >
                        <motion.span
                          className="inline-flex"
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 0.9, ease: 'linear' }}
                        >
                          <Loader2 className="w-5 h-5" />
                        </motion.span>
                        Memproses...
                      </motion.span>
                    ) : (
                      <motion.span
                        key="idle"
                        className="inline-flex items-center justify-center"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.18 }}
                      >
                        Proses Transaksi
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Modal Preview Transaksi */}
      {showPreviewModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl shadow-2xl shadow-purple-500/20 border border-purple-500/20 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 px-6 py-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">Preview Transaksi</h3>
                  <p className="text-sm text-blue-100">{cartItemCount} item</p>
                </div>
                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="w-8 h-8 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {/* Daftar Item */}
              <div className="space-y-3 mb-4">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-center justify-between py-2 border-b border-purple-500/10">
                    <div className="flex-1">
                      <p className="font-medium text-white">{item.name}</p>
                      <p className="text-sm text-purple-300">{formatPrice(item.price)} x {item.quantity}</p>
                    </div>
                    <p className="font-semibold text-white">{formatPrice(item.price * item.quantity)}</p>
                  </div>
                ))}
              </div>

              {/* Ringkasan Harga */}
              <div className="space-y-2 text-sm border-t border-purple-500/20 pt-4">
                <div className="flex justify-between text-white">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-red-400">
                    <span>Diskon {discount} (%)</span>
                    <span>{formatPrice(discountAmount)}</span>
                  </div>
                )}
                {ppn > 0 && (
                  <div className="flex justify-between text-green-400">
                    <span>PPN {ppn} (%)</span>
                    <span>{formatPrice(ppnAmount)}</span>
                  </div>
                )}
              </div>

              {/* Grand Total */}
              <div className="flex justify-between items-center py-3 px-4 bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 rounded-xl mt-4">
                <span className="text-white/80 font-medium">Grand Total</span>
                <span className="text-xl font-bold text-white">{formatPrice(total)}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="p-6 border-t border-purple-500/20">
              <div className="flex gap-3">
                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-purple-300 font-medium rounded-xl border border-purple-500/30 transition-colors"
                >
                  Kembali
                </button>
                <motion.button
                  onClick={() => {
                    setShowPreviewModal(false);
                    setShowPaymentModal(true);
                  }}
                  whileTap={{ scale: 0.92 }}
                  className="flex-1 py-3 bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 text-white font-medium rounded-xl shadow-lg shadow-purple-500/50 hover:shadow-xl transition-all flex items-center justify-center gap-2"
                >
                  <CreditCard className="w-5 h-5" />
                  Lanjut Bayar
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Pembayaran */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl shadow-2xl shadow-purple-500/20 border border-purple-500/20 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <style>{`
              .pos-cashier-select option {
                background-color: #0f172a;
                color: #ffffff;
              }

              .pos-cashier-select {
                appearance: none;
                background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%23c4b5fd' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
                background-repeat: no-repeat;
                background-size: 18px 18px;
                background-position: right 0.75rem center;
              }
            `}</style>
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 px-6 py-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">Pembayaran</h3>
                  <p className="text-sm text-blue-100">Total: {formatPrice(total)}</p>
                </div>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="w-8 h-8 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {/* Nama Kasir */}
              <label className="block text-sm font-medium text-purple-300 mb-2">Nama Kasir</label>
              <select
                value={cashierName}
                onChange={(e) => setCashierName(e.target.value)}
                className="pos-cashier-select w-full px-4 py-3 pr-10 bg-slate-700 border border-purple-500/30 rounded-xl text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent mb-5"
              >
                <option value="">Pilih kasir</option>
                {cashierOptions.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>

              {/* Metode Pembayaran */}
              <label className="block text-sm font-medium text-purple-300 mb-2">Metode Pembayaran</label>
              <div className="grid grid-cols-3 gap-2 mb-5">
                {[
                  { value: 'Cash', icon: Banknote, label: 'Tunai' },
                  { value: 'Transfer Bank', icon: Wallet, label: 'Transfer Bank' },
                  { value: 'QRIS', icon: QrCode, label: 'QRIS' },
                ].map((method) => (
                  <button
                    key={method.value}
                    onClick={() => setPaymentMethod(method.value)}
                    className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${
                      paymentMethod === method.value
                        ? 'border-purple-500 bg-purple-500/20'
                        : 'border-purple-500/30 hover:border-purple-500/50 bg-slate-700/50'
                    }`}
                  >
                    <method.icon className={`w-5 h-5 ${
                      paymentMethod === method.value
                        ? 'text-purple-300'
                        : 'text-purple-400'
                    }`} />
                    <span className={`text-xs font-medium ${
                      paymentMethod === method.value
                        ? 'text-purple-200'
                        : 'text-purple-400'
                    }`}>
                      {method.label}
                    </span>
                  </button>
                ))}
              </div>

              {/* Input Uang Tunai */}
              {paymentMethod === 'Cash' && (
                <div className="mb-5">
                  <label className="block text-sm font-medium text-purple-300 mb-2">Uang Tunai</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400 font-medium">Rp</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={cashReceived}
                      onChange={(e) => handleCashChange(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-slate-700 border border-purple-500/30 rounded-xl text-lg font-semibold text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="0"
                    />
                  </div>
                  {/* Quick amounts */}
                  <div className="flex gap-2 mt-2">
                    {[50000, 100000, 150000, 200000].map((amount) => (
                      <button
                        key={amount}
                        onClick={() => setCashReceived(formatCurrencyInput(amount.toString()))}
                        className="flex-1 py-2 text-xs font-medium bg-slate-700 hover:bg-slate-600 text-purple-300 border border-purple-500/30 rounded-lg transition-colors"
                      >
                        {formatPrice(amount)}
                      </button>
                    ))}
                  </div>
                  {cashReceived && !isNaN(parseFloat(cashReceived.replace(/\./g, ''))) && (
                    <div className={`mt-3 p-3 rounded-xl ${
                      parseFloat(cashReceived.replace(/\./g, '')) >= total
                        ? 'bg-emerald-500/20 border border-emerald-500/30'
                        : 'bg-red-500/20 border border-red-500/30'
                    }`}>
                      {parseFloat(cashReceived.replace(/\./g, '')) >= total ? (
                        <div className="flex justify-between items-center">
                          <span className="text-emerald-400">Kembalian</span>
                          <span className="text-lg font-bold text-emerald-300">
                            {formatPrice(parseFloat(cashReceived.replace(/\./g, '')) - total)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-red-400 text-sm">Uang tunai kurang!</span>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-purple-300 font-medium rounded-xl border border-purple-500/30 transition-colors"
                >
                  Batal
                </button>
                <motion.button
                  onClick={handleCheckout}
                  disabled={
                    loading ||
                    !cashierName ||
                    (paymentMethod === 'Cash' && (!cashReceived || parseFloat(cashReceived.replace(/\./g, '')) < total))
                  }
                  whileTap={
                    loading ||
                    !cashierName ||
                    (paymentMethod === 'Cash' && (!cashReceived || parseFloat(cashReceived.replace(/\./g, '')) < total))
                      ? undefined
                      : { scale: 0.92 }
                  }
                  className={`flex-1 py-3 font-medium rounded-xl transition-all flex items-center justify-center gap-2 ${
                    loading ||
                    !cashierName ||
                    (paymentMethod === 'Cash' && (!cashReceived || parseFloat(cashReceived.replace(/\./g, '')) < total))
                      ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 text-white shadow-lg shadow-purple-500/50 hover:shadow-xl'
                  }`}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Memproses
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5" />
                      Bayar {formatPrice(total)}
                    </>
                  )}
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Komponen untuk mencetak struk (tersembunyi) */}
      <div style={{ display: 'none' }}>
        {lastTransaction && <PrintReceipt ref={printRef} transaction={lastTransaction} />}
      </div>
    </div>
  );
};

export default Pos;