// src/pages/Reports.jsx
import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { ChevronLeft, ChevronRight, Download, Printer } from 'lucide-react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { useReactToPrint } from 'react-to-print';
import PrintReceipt from '../components/PrintReceipt';

const Reports = () => {
  const { transactions, loading, error } = useCart();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const [printTransaction, setPrintTransaction] = useState(null);
  const [printTransactionIndex, setPrintTransactionIndex] = useState(0);
  const [printTrigger, setPrintTrigger] = useState(false);
  const printRef = useRef();

  const totalPages = Math.ceil(transactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTransactions = transactions.slice(startIndex, endIndex);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: 'Struk Transaksi',
  });

  useEffect(() => {
    if (printTrigger && printTransaction) {
      const timer = setTimeout(() => {
        handlePrint();
        setPrintTrigger(false);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [printTrigger, printTransaction, handlePrint]);

  const formatPrice = (price) => `Rp ${Math.round(price).toLocaleString('id-ID')}`;
  
  const formatDate = (isoString) => {
    const date = new Date(isoString);
    const day = String(date.getDate()).padStart(2, '0');
    const months = ['januari', 'februari', 'maret', 'april', 'mei', 'juni', 'juli', 'agustus', 'september', 'oktober', 'november', 'desember'];
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  };

  const formatTime = (isoString) => {
    const date = new Date(isoString);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours} : ${minutes}`;
  };

  const generateInvoiceNumber = (tx, index) => {
    const date = new Date(tx.date);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const seq = String(index + 1).padStart(4, '0');
    return `TR-IDX${day}${month}${year}${seq}`;
  };

  const exportToExcel = () => {
    if (transactions.length === 0) return;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Laporan Penjualan');

    // Konfigurasi alignment per kolom (1-based)
    // value: 'left' | 'center' | 'right'
    const columnAlignment = {
      header: {
        1: 'center',
        2: 'center',
        3: 'center',
        4: 'center',
        5: 'left',
        6: 'center',
        7: 'right',
        8: 'right',
        9: 'right',
        10: 'right',
        11: 'right',
        12: 'right',
        13: 'center',
      },
      body: {
        1: 'center',
        2: 'center',
        3: 'center',
        4: 'center',
        5: 'left',
        6: 'center',
        7: 'right',
        8: 'right',
        9: 'right',
        10: 'right',
        11: 'right',
        12: 'right',
        13: 'center',
      },
    };

    const headers = [
      'ID Transaksi',
      'Tanggal',
      'Waktu',
      'Nama Kasir',
      'Item',
      'Qty',
      'Harga',
      'Total',
      'Subtotal',
      'Diskon',
      'PPN',
      'Grand Total',
      'Metode Pembayaran'
    ];

    worksheet.addRow(headers);
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.height = 18;

    const borderThin = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    };

    headerRow.eachCell((cell, colNumber) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF000000' },
      };
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.border = borderThin;
      cell.alignment = {
        vertical: 'middle',
        horizontal: columnAlignment.header[colNumber] || 'center',
        wrapText: true,
      };
    });

    // Column widths
    worksheet.columns = [
      { width: 20 },
      { width: 12 },
      { width: 8 },
      { width: 14 },
      { width: 35 },
      { width: 6 },
      { width: 15 },
      { width: 15 },
      { width: 12 },
      { width: 12 },
      { width: 12 },
      { width: 18 },
      { width: 18 },
    ];

    // Apply header alignment per column
    for (let c = 1; c <= headers.length; c++) {
      headerRow.getCell(c).alignment = {
        vertical: 'middle',
        horizontal: columnAlignment.header[c] || 'center',
        wrapText: true,
      };
    }

    const rupiahFmt = '"Rp" #,##0';
    const currencyCols = [7, 8, 9, 10, 11, 12];

    // Data rows
    transactions.forEach((tx, txIndex) => {
      const invoiceNumber = tx.invoiceNumber || generateInvoiceNumber(tx, txIndex);
      const date = new Date(tx.date);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      const seq = String(txIndex + 1).padStart(4, '0');
      const dateStr = `${day}-${month}-${year}`;
      const timeStr = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

      const items = Array.isArray(tx.items) && tx.items.length > 0 ? tx.items : [];
      const itemsLen = Math.max(items.length, 1);

      const startRowNumber = worksheet.rowCount + 1;

      for (let i = 0; i < itemsLen; i++) {
        const item = items[i];
        const isFirst = i === 0;

        const row = worksheet.addRow([
          isFirst ? invoiceNumber : '',
          isFirst ? dateStr : '',
          isFirst ? timeStr : '',
          isFirst ? (tx.cashierName || '') : '',
          item ? item.name : '',
          item ? item.quantity : '',
          item ? item.price : '',
          item ? item.price * item.quantity : '',
          isFirst ? tx.subtotal : '',
          isFirst ? (tx.discount?.amount ?? 0) : '',
          isFirst ? (tx.ppn?.amount ?? 0) : '',
          isFirst ? tx.total : '',
          isFirst ? tx.paymentMethod : ''
        ]);

        for (let c = 1; c <= headers.length; c++) {
          row.getCell(c).alignment = {
            vertical: 'middle',
            horizontal: columnAlignment.body[c] || 'left',
            wrapText: true,
          };
        }
      }

      const endRowNumber = worksheet.rowCount;

      if (endRowNumber > startRowNumber) {
        [1, 2, 3, 4, 9, 10, 11, 12, 13].forEach((col) => {
          worksheet.mergeCells(startRowNumber, col, endRowNumber, col);
        });
      }

      const fillArgb = txIndex % 2 === 0 ? 'FFC6EFCE' : 'FFFFEB9C';
      for (let r = startRowNumber; r <= endRowNumber; r++) {
        const dataRow = worksheet.getRow(r);
        for (let c = 1; c <= headers.length; c++) {
          const cell = dataRow.getCell(c);
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: fillArgb },
          };
          cell.border = borderThin;
          if (c === 1 && cell.value) {
            cell.font = { ...(cell.font || {}), bold: true, color: { argb: 'FF000000' } };
          }
        }
      }

      // Emphasize Grand Total (merged cell is on the first row of the transaction)
      const grandTotalCell = worksheet.getRow(startRowNumber).getCell(12);
      grandTotalCell.font = { ...(grandTotalCell.font || {}), bold: true };

      const separator = worksheet.addRow(new Array(headers.length).fill(''));
      separator.height = 6;
      for (let c = 1; c <= headers.length; c++) {
        const cell = separator.getCell(c);
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
        // remove borders on separator
        cell.border = {};
      }
    });

    // Currency formatting
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      currencyCols.forEach((col) => {
        const cell = row.getCell(col);
        if (typeof cell.value === 'number') {
          cell.numFmt = rupiahFmt;
        }
      });
    });

    const today = new Date();
    const filename = `Laporan_Penjualan_${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}.xlsx`;

    workbook.xlsx.writeBuffer().then((buffer) => {
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      saveAs(blob, filename);
    });
  };

  if (loading) return <div className="text-center py-12 text-purple-300">Memuat transaksi...</div>;
  if (error) return <div className="text-center py-12 text-red-400">Error: {error}</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold bg-gradient-to-r from-violet-400 via-purple-400 to-fuchsia-400 bg-clip-text text-transparent">Laporan Penjualan</h2>
        {transactions.length > 0 && (
          <motion.button
            onClick={exportToExcel}
            whileTap={{ scale: 0.92 }}
            className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg shadow-lg shadow-black/40 hover:shadow-xl hover:shadow-black/50 transition-all"
          >
            <Download className="w-4 h-4" />
            Export Excel
          </motion.button>
        )}
      </div>
      {transactions.length === 0 ? (
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-purple-500/20 shadow-lg shadow-purple-500/10 p-8 text-center text-purple-300">
          Belum ada transaksi.
        </div>
      ) : (
        <div className="space-y-6">
          {currentTransactions.map((tx, index) => (
            <div key={tx.id} className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-purple-500/20 shadow-lg shadow-purple-500/10 overflow-hidden">
              <div className="px-6 py-4 bg-slate-900/40 border-b border-purple-500/20 flex justify-between items-center">
                <div>
                  <span className="font-medium text-purple-100">{tx.invoiceNumber || generateInvoiceNumber(tx, index)}{tx.cashierName ? ` - ${tx.cashierName}` : ''}</span>
                  <p className="text-sm text-purple-300 mt-1">{formatDate(tx.date)} <span className="mx-2">|</span> {formatTime(tx.date)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <motion.button
                    onClick={() => {
                      setPrintTransaction(tx);
                      setPrintTransactionIndex(startIndex + index);
                      setPrintTrigger(true);
                    }}
                    whileTap={{ scale: 0.92 }}
                    className="flex items-center gap-2 mr-5 px-3 py-2 bg-purple-500 text-white rounded-lg shadow-lg shadow-black/40 hover:shadow-xl hover:shadow-black/50 transition-all"
                    title="Print ulang struk"
                  >
                    <Printer className="w-4 h-4" />
                    Print
                  </motion.button>
                  <span className="text-lg font-bold mr-5 text-purple-200">{formatPrice(tx.total)}</span>
                </div>
              </div>
              <div className="p-6">
                <table className="min-w-full divide-y divide-purple-500/10">
                  <thead className="bg-slate-900/40">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-purple-300 uppercase">Item</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-purple-300 uppercase">Qty</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-purple-300 uppercase">Harga</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-purple-300 uppercase">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-purple-500/10">
                    {tx.items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-3 text-sm text-purple-100">{item.name}</td>
                        <td className="px-4 py-3 text-center text-sm text-purple-300">{item.quantity}</td>
                        <td className="px-4 py-3 text-right text-sm text-purple-300">{formatPrice(item.price)}</td>
                        <td className="px-4 py-3 text-sm text-purple-100 text-right">{formatPrice(item.price * item.quantity)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <table className="mt-6 ml-auto mr-4">
                  <tbody>
                    <tr>
                      <td className="text-purple-200 text-right pr-2">Subtotal</td>
                      <td className="text-purple-300">:</td>
                      <td className="text-purple-200 text-right pl-2">{formatPrice(tx.subtotal)}</td>
                    </tr>
                    {tx.discount.value > 0 && (
                      <tr>
                        <td className="text-red-400 text-right pr-2">Diskon</td>
                        <td className="text-purple-300">:</td>
                        <td className="text-red-400 text-right pl-2">{formatPrice(tx.discount.amount)}</td>
                      </tr>
                    )}
                    {tx.ppn.rate > 0 && (
                      <tr>
                        <td className="text-green-400 text-right pr-2">PPN {tx.ppn.rate}%</td>
                        <td className="text-purple-300">:</td>
                        <td className="text-green-400 text-right pl-2">{formatPrice(tx.ppn.amount)}</td>
                      </tr>
                    )}
                    <tr className="font-semibold">
                      <td className="text-purple-100 text-right pr-2">Grand Total</td>
                      <td className="text-purple-300">:</td>
                      <td className="text-purple-100 text-right pl-2">{formatPrice(tx.total)}</td>
                    </tr>
                    <tr>
                      <td className="text-purple-300 text-right pr-2">Metode Pembayaran</td>
                      <td className="text-purple-300">:</td>
                      <td className="text-purple-300 text-right pl-2">{tx.paymentMethod}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-8">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className={`flex items-center gap-1 px-4 py-2 rounded-lg transition-all ${currentPage === 1 ? 'bg-slate-700/50 text-purple-500 cursor-not-allowed' : 'bg-slate-700/50 text-purple-200 hover:bg-slate-600/50'}`}
          >
            <ChevronLeft className="w-4 h-4" />
            Prev
          </button>
          <div className="flex items-center gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-10 h-10 rounded-lg transition-all ${currentPage === page ? 'bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 text-white' : 'bg-slate-700/50 text-purple-200 hover:bg-slate-600/50'}`}
              >
                {page}
              </button>
            ))}
          </div>
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className={`flex items-center gap-1 px-4 py-2 rounded-lg transition-all ${currentPage === totalPages ? 'bg-slate-700/50 text-purple-500 cursor-not-allowed' : 'bg-slate-700/50 text-purple-200 hover:bg-slate-600/50'}`}
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      <div style={{ display: 'none' }}>
        {printTransaction && (
          <PrintReceipt
            ref={printRef}
            transaction={printTransaction}
            index={printTransactionIndex}
          />
        )}
      </div>
    </div>
  );
};

export default Reports;