// src/components/PrintReceipt.jsx
import React, { forwardRef, useState, useEffect } from 'react';

const PrintReceipt = forwardRef(({ transaction, index = 0 }, ref) => {
  const [storeSettings, setStoreSettings] = useState(() => {
    const saved = localStorage.getItem('storeSettings');
    return saved ? JSON.parse(saved) : {
      storeName: 'EL PROJECT STORE',
      storeAddress: 'Jl.PGRI II No.136,Sonopakis Kidul,Ngestiharjo,Kasihan,Bantul',
      storePhone: '0838-6718-0887',
      receiptFooter: 'Terima kasih sudah mampir di warung kami\nLayanan 24 jam siap melayani'
    };
  });

  useEffect(() => {
    const handleStoreUpdate = () => {
      const saved = localStorage.getItem('storeSettings');
      if (saved) {
        setStoreSettings(JSON.parse(saved));
      }
    };
    window.addEventListener('storeSettingsUpdated', handleStoreUpdate);
    return () => window.removeEventListener('storeSettingsUpdated', handleStoreUpdate);
  }, []);

  const formatPrice = (price) => `Rp ${Math.round(price).toLocaleString('id-ID')}`;
  const formatDateOnly = (isoString) => {
    const date = new Date(isoString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };
  const formatTime = (isoString) => {
    const date = new Date(isoString);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const generateInvoiceNumber = (tx) => {
    const date = new Date(tx.date);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const seq = String(index + 1).padStart(4, '0');
    return `TR-IDX${day}${month}${year}${seq}`;
  };

  return (
    <div ref={ref} className="p-4 font-mono text-sm" style={{ width: '58mm', maxWidth: '58mm', boxSizing: 'border-box' }}>
      <div className="text-center">
        <h2 className="text-lg font-bold">{storeSettings.storeName}</h2>
        <table className="w-full">
          <tbody>
            <tr>
              <p className="py-0.5 text-xs">{storeSettings.storeAddress}</p>
            </tr>
            <tr>
              <p className="py-0.5 text-xs">Telp: {storeSettings.storePhone}</p>
            </tr>
          </tbody>
        </table>
        <hr className="my-2" />
      </div>

      <hr className="my-2" />
      <table className="w-full leading-tight">
        <tbody>
          <tr>
            <td className="py-0.5" style={{ width: '100px' }}>ID.TRANSAKSI</td>
            <td className="py-0.5" style={{ width: '10px' }}>:</td>
            <td className="py-0.5 text-right">{transaction.invoiceNumber || generateInvoiceNumber(transaction)}</td>
          </tr>
          {transaction.cashierName && (
            <tr>
              <td className="py-0.5" style={{ width: '100px' }}>KASIR</td>
              <td className="py-0.5" style={{ width: '10px' }}>:</td>
              <td className="py-0.5 text-right">{transaction.cashierName}</td>
            </tr>
          )}
          <tr>
            <td colSpan="3" className="py-0.5">
              <div className="flex justify-between w-full">
                <span>{formatDateOnly(transaction.date)}</span>
                <span>{formatTime(transaction.date)}</span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <hr className="my-2" />
      <table className="w-full text-left leading-tight" style={{ tableLayout: 'fixed' }}>
        <thead>
          <tr className="border-b">
            <th className="py-1" style={{ width: '50%' }}>Item</th>
            <th className="py-1 text-center" style={{ width: '10%' }}> Qty</th>
            <th className="py-1 text-right" style={{ width: '35%' }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {transaction.items.map((item, idx) => (
            <tr key={idx}>
              <td className="py-1 whitespace-nowrap overflow-hidden text-ellipsis">{item.name}</td>
              <td className="py-1 text-center whitespace-nowrap">{item.quantity}</td>
              <td className="py-1 text-right whitespace-nowrap">{formatPrice(item.price * item.quantity)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <hr className="my-2" />
      <table className="w-full leading-tight">
        <tbody>
          <tr>
            <td className="py-0.5" style={{ width: '100px' }}>Subtotal</td>
            <td className="py-0.5" style={{ width: '10px' }}>:</td>
            <td className="py-0.5 text-right text-sm">{formatPrice(transaction.subtotal)}</td>
          </tr>
          {transaction.discount.value > 0 && (
            <tr>
              <td className="py-0.5" style={{ width: '100px' }}>Diskon {transaction.discount.value}%</td>
              <td className="py-0.5" style={{ width: '10px' }}>:</td>
              <td className="py-0.5 text-right">{formatPrice(transaction.discount.amount)}</td>
            </tr>
          )}
          {transaction.ppn.amount > 0 && (
            <tr>
              <td className="py-0.5" style={{ width: '100px' }}>PPN {transaction.ppn.rate}%</td>
              <td className="py-0.5" style={{ width: '10px' }}>:</td>
              <td className="py-0.5 text-right">{formatPrice(transaction.ppn.amount)}</td>
            </tr>
          )}
          <tr className="font-bold text-base border-t">
            <td className="py-0.5 pt-1" style={{ width: '100px' }}>GRAND TOTAL</td>
            <td className="py-0.5 pt-1" style={{ width: '10px' }}>:</td>
            <td className="py-0.5 pt-1 text-right">{formatPrice(transaction.total)}</td>
          </tr>
          <tr>
            <td className="py-0.5" style={{ width: '100px' }}>Metode Bayar</td>
            <td className="py-0.5" style={{ width: '10px' }}>:</td>
            <td className="py-0.5 text-right">{transaction.paymentMethod}</td>
          </tr>
          {transaction.paymentMethod === 'Cash' && transaction.cashReceived && (
            <>
              <tr>
                <td className="py-0.5" style={{ width: '100px' }}>Tunai</td>
                <td className="py-0.5" style={{ width: '10px' }}>:</td>
                <td className="py-0.5 text-right">{formatPrice(transaction.cashReceived)}</td>
              </tr>
              <tr>
                <td className="py-0.5" style={{ width: '100px' }}>Kembali</td>
                <td className="py-0.5" style={{ width: '10px' }}>:</td>
                <td className="py-0.5 text-right">{formatPrice(transaction.change)}</td>
              </tr>
            </>
          )}
        </tbody>
      </table>

      <hr className="my-2" />
      <div className="text-center text-xs mt-4">
        {storeSettings.receiptFooter.split('\n').map((line, idx) => (
          <p key={idx}>{line}</p>
        ))}
      </div>
    </div>
  );
});

export default PrintReceipt;