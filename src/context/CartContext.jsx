// src/contexts/CartContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

const CartContext = createContext();
export const useCart = () => useContext(CartContext);

const normalizeTransactionFromDb = (row) => {
  if (!row || typeof row !== 'object') return row;
  return {
    ...row,
    invoiceNumber: row.invoiceNumber ?? row.invoicenumber,
    cashierName: row.cashierName ?? row.cashiername,
    paymentMethod: row.paymentMethod ?? row.paymentmethod,
    cashReceived: row.cashReceived ?? row.cashreceived,
  };
};

const mapTransactionToDb = (tx) => {
  if (!tx || typeof tx !== 'object') return tx;
  return {
    id: tx.id,
    invoicenumber: tx.invoicenumber ?? tx.invoiceNumber,
    date: tx.date,
    items: tx.items,
    subtotal: tx.subtotal,
    discount: tx.discount,
    ppn: tx.ppn,
    total: tx.total,
    cashiername: tx.cashiername ?? tx.cashierName,
    paymentmethod: tx.paymentmethod ?? tx.paymentMethod,
    change: tx.change,
  };
};

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('pos_cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [transactions, setTransactions] = useState([]);
  const [discount, setDiscount] = useState(0); // persen diskon
  const [ppn, setPpn] = useState(0); // persen, default 0 (mati)
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTransactions();
  }, []);

  useEffect(() => {
    localStorage.setItem('pos_cart', JSON.stringify(cart));
  }, [cart]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      if (!isSupabaseConfigured) {
        throw new Error('Supabase belum dikonfigurasi');
      }

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      setTransactions(Array.isArray(data) ? data.map(normalizeTransactionFromDb) : []);
    } catch (err) {
      setError(err?.message || 'Gagal mengambil data');
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id, delta) => {
    setCart(prev =>
      prev
        .map(item => (item.id === id ? { ...item, quantity: item.quantity + delta } : item))
        .filter(item => item.quantity > 0)
    );
  };

  const removeItem = (id) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const clearCart = () => setCart([]);

  // Hitung subtotal (sebelum diskon dan ppn)
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Hitung diskon
  const discountAmount = (subtotal * discount) / 100;

  // Hitung PPN (dari subtotal setelah diskon? sesuai aturan, PPN dihitung dari harga setelah diskon)
  const ppnAmount = ((subtotal - discountAmount) * ppn) / 100;

  // Total akhir
  const total = subtotal - discountAmount + ppnAmount;

  const checkout = async (paymentMethod, cashReceived = null, cashierName = null) => {
    if (cart.length === 0) return false;

    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const seq = String(transactions.length + 1).padStart(4, '0');
    const invoiceNumber = `TR-IDX${day}${month}${year}${seq}`;

    const newTransaction = {
      id: Date.now(),
      invoiceNumber,
      date: now.toISOString(),
      items: cart.map(({ id, name, price, quantity }) => ({ id, name, price, quantity })),
      subtotal,
      discount: { value: discount, amount: discountAmount },
      ppn: { rate: ppn, amount: ppnAmount },
      total,
      cashierName,
      paymentMethod,
      cashReceived,
      change: cashReceived ? cashReceived - total : null,
    };

    setLoading(true);
    try {
      if (!isSupabaseConfigured) {
        throw new Error('Supabase belum dikonfigurasi');
      }

      const payload = mapTransactionToDb(newTransaction);
      const { data, error } = await supabase
        .from('transactions')
        .insert([payload])
        .select('*')
        .single();

      if (error) throw error;
      const saved = normalizeTransactionFromDb(data);
      setTransactions(prev => [saved, ...prev]);
      clearCart();
      setDiscount(0);
      return saved;
    } catch (err) {
      setError(err?.message || 'Gagal menyimpan transaksi');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        transactions,
        subtotal,
        discount,
        setDiscount,
        ppn,
        setPpn,
        total,
        discountAmount,
        ppnAmount,
        loading,
        error,
        addToCart,
        updateQuantity,
        removeItem,
        clearCart,
        checkout,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};