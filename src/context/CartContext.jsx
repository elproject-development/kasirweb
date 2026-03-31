// src/contexts/CartContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';

const CartContext = createContext();
export const useCart = () => useContext(CartContext);

const API_URL = 'http://localhost:3001/transactions';


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
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error('Gagal mengambil data');
      const data = await res.json();
      setTransactions(data);
    } catch (err) {
      setError(err.message);
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
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTransaction),
      });
      if (!res.ok) throw new Error('Gagal menyimpan transaksi');
      const saved = await res.json();
      setTransactions(prev => [saved, ...prev]);
      clearCart();
      // Reset diskon setelah transaksi
      setDiscount(0);
      return saved; // kembalikan transaksi untuk dicetak
    } catch (err) {
      setError(err.message);
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