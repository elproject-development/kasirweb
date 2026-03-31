// src/pages/Expenses.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Download, Plus, Trash2, Edit2, X, Calendar, DollarSign, Tag, FileText, Loader2 } from 'lucide-react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import toast from 'react-hot-toast';

const EXPENSES_API_URL = 'http://localhost:3001/expenses';

const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [formData, setFormData] = useState({
    category: '',
    description: '',
    amount: '50.000',
    day: new Date().getDate().toString(),
    month: (new Date().getMonth() + 1).toString(),
    year: new Date().getFullYear().toString(),
  });

  const formatAmountInput = (value) => {
    const digits = String(value || '').replace(/\D/g, '');
    if (!digits) return '';
    return parseInt(digits, 10).toLocaleString('id-ID');
  };

  const parseAmountInput = (value) => {
    const digits = String(value || '').replace(/\D/g, '');
    if (!digits) return 0;
    return parseInt(digits, 10);
  };

  // Generate options for date dropdowns
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const months = [
    { value: 1, label: 'Januari' },
    { value: 2, label: 'Februari' },
    { value: 3, label: 'Maret' },
    { value: 4, label: 'April' },
    { value: 5, label: 'Mei' },
    { value: 6, label: 'Juni' },
    { value: 7, label: 'Juli' },
    { value: 8, label: 'Agustus' },
    { value: 9, label: 'September' },
    { value: 10, label: 'Oktober' },
    { value: 11, label: 'November' },
    { value: 12, label: 'Desember' },
  ];
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  const selectInputClass = 'expense-select w-full px-4 py-3 pr-10 bg-slate-800/50 border border-purple-500/30 rounded-xl text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none';
  
  const itemsPerPage = 10;

  // Kategori pengeluaran
  const categories = [
    'Operasional',
    'Gaji Karyawan',
    'Pembelian Stok',
    'Listrik & Air',
    'Sewa Tempat',
    'Peralatan',
    'Transportasi',
    'Lain-lain',
  ];

  // Fetch expenses
  const fetchExpenses = async () => {
    try {
      const res = await fetch(EXPENSES_API_URL);
      if (!res.ok) throw new Error('Gagal mengambil data pengeluaran');
      const data = await res.json();
      // Sort by date descending
      data.sort((a, b) => new Date(b.date) - new Date(a.date));
      setExpenses(data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  // Format currency
  const formatPrice = (price) => `Rp ${Math.round(price).toLocaleString('id-ID')}`;

  // Format date
  const formatDate = (isoString) => {
    const date = new Date(isoString);
    const day = String(date.getDate()).padStart(2, '0');
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  };

  // Pagination
  const totalPages = Math.ceil(expenses.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentExpenses = expenses.slice(startIndex, endIndex);

  // Total pengeluaran
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  // Handle form input
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'amount') {
      setFormData((prev) => ({ ...prev, amount: formatAmountInput(value) }));
      return;
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Open modal for add
  const openAddModal = () => {
    setEditingExpense(null);
    setFormData({
      category: '',
      description: '',
      amount: '50.000',
      day: new Date().getDate().toString(),
      month: (new Date().getMonth() + 1).toString(),
      year: new Date().getFullYear().toString(),
    });
    setShowModal(true);
  };

  // Open modal for edit
  const openEditModal = (expense) => {
    const expDate = new Date(expense.date);
    setEditingExpense(expense);
    setFormData({
      category: expense.category,
      description: expense.description,
      amount: formatAmountInput(expense.amount),
      day: expDate.getDate().toString(),
      month: (expDate.getMonth() + 1).toString(),
      year: expDate.getFullYear().toString(),
    });
    setShowModal(true);
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.category || !formData.description || !formData.amount || !formData.day || !formData.month || !formData.year) {
      toast.error('Semua field harus diisi!');
      return;
    }

    const expenseData = {
      category: formData.category,
      description: formData.description,
      amount: parseAmountInput(formData.amount),
      date: new Date(parseInt(formData.year), parseInt(formData.month) - 1, parseInt(formData.day)).toISOString(),
    };

    try {
      if (editingExpense) {
        // Update existing
        const res = await fetch(`${EXPENSES_API_URL}/${editingExpense.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...editingExpense, ...expenseData }),
        });
        if (!res.ok) throw new Error('Gagal mengupdate pengeluaran');
        toast.success('Pengeluaran berhasil diupdate!');
      } else {
        // Add new
        const res = await fetch(EXPENSES_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(expenseData),
        });
        if (!res.ok) throw new Error('Gagal menambah pengeluaran');
        toast.success('Pengeluaran berhasil ditambahkan!');
      }
      
      setShowModal(false);
      fetchExpenses();
    } catch (err) {
      toast.error(err.message);
    }
  };

  // Delete expense
  const handleDelete = async (id) => {
    if (!window.confirm('Yakin ingin menghapus pengeluaran ini?')) return;
    
    try {
      const res = await fetch(`${EXPENSES_API_URL}/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Gagal menghapus pengeluaran');
      toast.success('Pengeluaran berhasil dihapus!');
      fetchExpenses();
    } catch (err) {
      toast.error(err.message);
    }
  };

  // Export to Excel
  const exportToExcel = () => {
    if (expenses.length === 0) return;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Laporan Pengeluaran');

    // Konfigurasi alignment per kolom (1-based)
    const columnAlignment = {
      header: {
        1: 'center', // No
        2: 'center', // Tanggal
        3: 'left', // Kategori
        4: 'left',   // Deskripsi
        5: 'center', // Jumlah
      },
      body: {
        1: 'center', // No
        2: 'center', // Tanggal
        3: 'left',   // Kategori
        4: 'left',   // Deskripsi
        5: 'right',  // Jumlah
      },
    };

    const headers = ['No', 'Tanggal', 'Kategori', 'Deskripsi', 'Jumlah'];
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
      cell.alignment = { vertical: 'middle', horizontal: columnAlignment.header[colNumber] || 'center' };
    });

    worksheet.columns = [
      { width: 6 },
      { width: 15 },
      { width: 20 },
      { width: 35 },
      { width: 18 },
    ];

    expenses.forEach((exp, index) => {
      const date = new Date(exp.date);
      const dateStr = `${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${date.getFullYear()}`;
      
      const row = worksheet.addRow([
        index + 1,
        dateStr,
        exp.category,
        exp.description,
        exp.amount,
      ]);

      row.eachCell((cell, colNumber) => {
        cell.border = borderThin;
        cell.alignment = { vertical: 'middle', horizontal: columnAlignment.body[colNumber] || 'left' };
        if (colNumber === 5 && typeof cell.value === 'number') {
          cell.numFmt = '"Rp" #,##0';
        }
      });
    });

    // Add empty row before total
    const emptyRow = worksheet.addRow(['', '', '', '', '']);
    emptyRow.height = 10;
    emptyRow.eachCell((cell) => {
      cell.border = {};
    });

    // Add total row
    const totalRow = worksheet.addRow(['', '', '', 'TOTAL', totalExpenses]);
    totalRow.eachCell((cell, colNumber) => {
      cell.font = { bold: true };
      cell.border = borderThin;
      cell.alignment = { vertical: 'middle', horizontal: columnAlignment.body[colNumber] || 'left' };
      if (colNumber === 5) {
        cell.numFmt = '"Rp" #,##0';
      }
    });

    const today = new Date();
    const filename = `Laporan_Pengeluaran_${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}.xlsx`;

    workbook.xlsx.writeBuffer().then((buffer) => {
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      saveAs(blob, filename);
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-2xl font-semibold bg-gradient-to-r from-violet-400 via-purple-400 to-fuchsia-400 bg-clip-text text-transparent">
          Catatan Pengeluaran
        </h2>
        <div className="flex gap-2">
          {expenses.length > 0 && (
            <motion.button
              onClick={exportToExcel}
              whileTap={{ scale: 0.92 }}
              className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg shadow-lg shadow-black/40 hover:shadow-xl hover:shadow-black/50 transition-all"
            >
              <Download className="w-4 h-4" />
              Export Excel
            </motion.button>
          )}
          <motion.button
            onClick={openAddModal}
            whileTap={{ scale: 0.92 }}
            className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg shadow-lg shadow-black/40 hover:shadow-xl hover:shadow-black/50 transition-all"
          >
            <Plus className="w-4 h-4" />
            Tambah Pengeluaran
          </motion.button>
        </div>
      </div>

      {/* Summary Card */}
      <div className="bg-gradient-to-r from-red-500/20 to-orange-500/20 backdrop-blur-sm rounded-2xl border border-red-500/20 p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
            <DollarSign className="w-7 h-7 text-white" />
          </div>
          <div>
            <p className="text-sm text-red-200">Total Pengeluaran</p>
            <p className="text-3xl font-bold text-white">{formatPrice(totalExpenses)}</p>
          </div>
        </div>
      </div>

      {/* Expenses List */}
      {expenses.length === 0 ? (
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-purple-500/20 shadow-lg shadow-purple-500/10 p-8 text-center text-purple-300">
          Belum ada catatan pengeluaran.
        </div>
      ) : (
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-purple-500/20 shadow-lg shadow-purple-500/10 overflow-hidden">
          <table className="min-w-full divide-y divide-purple-500/10">
            <thead className="bg-slate-900/40">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-purple-300 uppercase">Tanggal</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-purple-300 uppercase">Kategori</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-purple-300 uppercase">Deskripsi</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-purple-300 uppercase">Jumlah</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-purple-300 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-500/10">
              {currentExpenses.map((expense) => (
                <tr key={expense.id} className="hover:bg-purple-500/5 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-purple-100">
                    {formatDate(expense.date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-3 py-1 text-xs font-medium bg-red-500/20 text-red-300 rounded-full">
                      {expense.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-purple-200">{expense.description}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white font-semibold text-right">
                    {formatPrice(expense.amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex items-center justify-center gap-2">
                      <motion.button
                        onClick={() => openEditModal(expense)}
                        whileTap={{ scale: 0.92 }}
                        className="p-2 text-purple-300 hover:bg-purple-500/20 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </motion.button>
                      <motion.button
                        onClick={() => handleDelete(expense.id)}
                        whileTap={{ scale: 0.92 }}
                        className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                        title="Hapus"
                      >
                        <Trash2 className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-8">
          <motion.button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            whileTap={currentPage === 1 ? undefined : { scale: 0.92 }}
            className={`flex items-center gap-1 px-4 py-2 rounded-lg transition-all ${
              currentPage === 1
                ? 'bg-slate-700/50 text-purple-500 cursor-not-allowed'
                : 'bg-slate-700/50 text-purple-200 hover:bg-slate-600/50'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            Prev
          </motion.button>
          <div className="flex items-center gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <motion.button
                key={page}
                onClick={() => setCurrentPage(page)}
                whileTap={{ scale: 0.92 }}
                className={`w-10 h-10 rounded-lg transition-all ${
                  currentPage === page
                    ? 'bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 text-white'
                    : 'bg-slate-700/50 text-purple-200 hover:bg-slate-600/50'
                }`}
              >
                {page}
              </motion.button>
            ))}
          </div>
          <motion.button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            whileTap={currentPage === totalPages ? undefined : { scale: 0.92 }}
            className={`flex items-center gap-1 px-4 py-2 rounded-lg transition-all ${
              currentPage === totalPages
                ? 'bg-slate-700/50 text-purple-500 cursor-not-allowed'
                : 'bg-slate-700/50 text-purple-200 hover:bg-slate-600/50'
            }`}
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </motion.button>
        </div>
      )}

      {/* Modal Add/Edit */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 rounded-2xl border border-purple-500/20 shadow-2xl w-full max-w-md">
            <style>{`
              .expense-select option {
                background-color: #0f172a;
                color: #ffffff;
              }

              .expense-select {
                background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%23c4b5fd' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
                background-repeat: no-repeat;
                background-size: 18px 18px;
                background-position: right 0.75rem center;
              }
            `}</style>
            <div className="flex items-center justify-between p-6 border-b border-purple-500/20">
              <h3 className="text-xl font-semibold text-white">
                {editingExpense ? 'Edit Pengeluaran' : 'Tambah Pengeluaran'}
              </h3>
              <motion.button
                onClick={() => setShowModal(false)}
                whileTap={{ scale: 0.92 }}
                className="p-2 text-purple-300 hover:text-white hover:bg-purple-500/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Date - Custom Dropdown */}
              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Tanggal
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <select
                    name="day"
                    value={formData.day}
                    onChange={handleInputChange}
                    className={selectInputClass}
                    required
                  >
                    {days.map(d => (
                      <option key={d} value={d}>{String(d).padStart(2, '0')}</option>
                    ))}
                  </select>
                  <select
                    name="month"
                    value={formData.month}
                    onChange={handleInputChange}
                    className={selectInputClass}
                    required
                  >
                    {months.map(m => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                  <select
                    name="year"
                    value={formData.year}
                    onChange={handleInputChange}
                    className={selectInputClass}
                    required
                  >
                    {years.map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">
                  <Tag className="w-4 h-4 inline mr-2" />
                  Kategori
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className={selectInputClass}
                  required
                >
                  <option value="">Pilih Kategori</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">
                  <FileText className="w-4 h-4 inline mr-2" />
                  Deskripsi
                </label>
                <input
                  type="text"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Contoh : Beli beras 10kg"
                  className="w-full px-4 py-3 bg-slate-800/50 border border-purple-500/30 rounded-xl text-white placeholder-purple-300/50 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">
                  <DollarSign className="w-4 h-4 inline mr-2" />
                  Jumlah (Rp)
                </label>
                <input
                  type="text"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  placeholder="Rp 0"
                  className="w-full px-4 py-3 bg-slate-800/50 border border-purple-500/30 rounded-xl text-white placeholder-purple-300/50 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  inputMode="numeric"
                  onWheel={(e) => e.currentTarget.blur()}
                  required
                />
                <p className="text-xs text-purple-300/60 mt-1">Default: Rp 50.000</p>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <motion.button
                  type="button"
                  onClick={() => setShowModal(false)}
                  whileTap={{ scale: 0.92 }}
                  className="flex-1 px-4 py-3 bg-slate-700/50 text-purple-200 rounded-xl hover:bg-slate-600/50 transition-colors"
                >
                  Batal
                </motion.button>
                <motion.button
                  type="submit"
                  whileTap={{ scale: 0.92 }}
                  className="flex-1 px-4 py-3 bg-purple-500 text-white rounded-xl shadow-lg shadow-black/40 hover:shadow-xl hover:shadow-black/50 transition-all"
                >
                  {editingExpense ? 'Update' : 'Simpan'}
                </motion.button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Expenses;
