import React, { useState, useEffect } from 'react';
import { Wallet, TrendingUp, TrendingDown, DollarSign, Calendar, Plus, Search, FileText, X, Download, Edit } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { useTenant } from '../contexts/TenantContext';
import { collection, onSnapshot, query, where, addDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export function CashFlow() {
  const { tenantId } = useTenant();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ type: 'expense', amount: 0, category: 'operational', note: '', date: new Date().toISOString().substring(0, 10) });
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  const filteredTransactions = transactions.filter(t => {
    let match = true;
    if (startDate) {
      match = match && new Date(t.date) >= new Date(startDate);
    }
    if (endDate) {
      const endD = new Date(endDate);
      endD.setHours(23, 59, 59, 999);
      match = match && new Date(t.date) <= endD;
    }
    if (typeFilter !== 'all') {
      match = match && t.type === typeFilter;
    }
    if (searchQuery) {
      match = match && (
        t.note.toLowerCase().includes(searchQuery.toLowerCase()) || 
        t.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return match;
  });

  // Load transactions
  useEffect(() => {
    if (!tenantId) return;
    const qTrans = query(collection(db, 'finance_transactions'), where('tenantId', '==', tenantId));
    const unsub = onSnapshot(qTrans, (snap) => {
      const data: any[] = [];
      snap.forEach(d => data.push({ id: d.id, ...d.data() }));
      setTransactions(data.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    });
    return () => unsub();
  }, [tenantId]);

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.amount <= 0 || !form.note) return showNotification('Data tidak valid', 'error');
    
    try {
      if (editingId) {
        await updateDoc(doc(db, 'finance_transactions', editingId), {
          ...form,
          amount: Number(form.amount),
          date: new Date(form.date).toISOString()
        });
        showNotification('Transaksi berhasil diperbarui!', 'success');
      } else {
        await addDoc(collection(db, 'finance_transactions'), {
          ...form,
          amount: Number(form.amount),
          date: new Date(form.date).toISOString(),
          tenantId
        });
        showNotification('Transaksi berhasil dicatat!', 'success');
      }
      setIsModalOpen(false);
      setEditingId(null);
      setForm({ type: 'expense', amount: 0, category: 'operational', note: '', date: new Date().toISOString().substring(0, 10) });
    } catch (e: any) {
      console.error('Save transaction error:', e);
      showNotification('Gagal menyimpan transaksi: ' + (e?.message || String(e)), 'error');
    }
  };

  const handleEditClick = (t: any) => {
    let formattedDate = new Date().toISOString().substring(0, 10);
    try {
       formattedDate = new Date(t.date).toISOString().substring(0, 10);
    } catch(e) {}
    setForm({
      type: t.type,
      amount: t.amount,
      category: t.category,
      note: t.note,
      date: formattedDate
    });
    setEditingId(t.id);
    setIsModalOpen(true);
  };

  const handleAddNewClick = () => {
    setForm({ type: 'expense', amount: 0, category: 'operational', note: '', date: new Date().toISOString().substring(0, 10) });
    setEditingId(null);
    setIsModalOpen(true);
  };

  const formatIDR = (val: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(transactions.map(t => ({
      Tanggal: new Date(t.date).toLocaleString('id-ID'),
      Tipe: t.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
      Kategori: t.category,
      Keterangan: t.note,
      Nominal: t.amount
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Laporan_Keuangan");
    XLSX.writeFile(wb, `Laporan_Keuangan_${new Date().getTime()}.xlsx`);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text("Laporan Keuangan", 14, 15);
    (doc as any).autoTable({
      startY: 20,
      head: [['Tanggal', 'Tipe', 'Kategori', 'Keterangan', 'Nominal']],
      body: transactions.map(t => [
        new Date(t.date).toLocaleString('id-ID'),
        t.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
        t.category,
        t.note,
        formatIDR(t.amount)
      ]),
    });
    doc.save(`Laporan_Keuangan_${new Date().getTime()}.pdf`);
  };

  // Calculated stats
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);
  const netProfit = totalIncome - totalExpense;

  // Chart data grouping by month
  const chartDataMap: Record<string, { income: number, expense: number }> = {};
  transactions.forEach(t => {
     const date = new Date(t.date);
     const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
     if (!chartDataMap[key]) chartDataMap[key] = { income: 0, expense: 0 };
     if (t.type === 'income') chartDataMap[key].income += t.amount;
     if (t.type === 'expense') chartDataMap[key].expense += t.amount;
  });

  const chartData = Object.keys(chartDataMap).sort().map(k => ({
     name: k,
     Pemasukan: chartDataMap[k].income,
     Pengeluaran: chartDataMap[k].expense,
     LabaBersih: chartDataMap[k].income - chartDataMap[k].expense
  })).slice(-12);

  return (
    <div className="space-y-6 relative">
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-xl flex items-center justify-between text-sm min-w-[300px] animate-in slide-in-from-top-4 fade-in duration-300 ${notification.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60' : 'bg-rose-50 text-rose-700 border border-rose-200/60'}`}>
          <div className="flex items-center gap-3">
            {notification.type === 'success' ? <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600"><TrendingUp size={16} /></div> : <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-600"><TrendingDown size={16} /></div>} 
            <span className="font-semibold">{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="ml-4 p-1 hover:bg-black/5 rounded-full transition-colors">
            <X size={16} />
          </button>
        </div>
      )}
       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Wallet className="text-primary-600" /> Buku Kas & Keuangan
          </h1>
          <p className="text-slate-500 mt-1">Pantau arus kas, pemasukan tagihan, dan biaya operasional.</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={exportToPDF}
            className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 px-4 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition-all shadow-sm"
          >
            <Download size={20} /> PDF
          </button>
          <button 
            onClick={exportToExcel}
            className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 px-4 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition-all shadow-sm"
          >
            <Download size={20} /> Excel
          </button>
          <button 
            onClick={handleAddNewClick}
            className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition-all shadow-sm shadow-primary-500/20"
          >
            <Plus size={20} /> Tambah Transaksi
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-center gap-3 mb-2">
               <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center"><TrendingUp size={20}/></div>
               <span className="font-semibold text-slate-600 uppercase tracking-wider text-xs">Total Pemasukan</span>
            </div>
            <p className="text-3xl font-extrabold text-slate-800">{formatIDR(totalIncome)}</p>
         </div>
         <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-center gap-3 mb-2">
               <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center"><TrendingDown size={20}/></div>
               <span className="font-semibold text-slate-600 uppercase tracking-wider text-xs">Total Pengeluaran</span>
            </div>
            <p className="text-3xl font-extrabold text-slate-800">{formatIDR(totalExpense)}</p>
         </div>
         <div className={`bg-gradient-to-br from-primary-600 to-primary-800 rounded-2xl p-6 border border-primary-500 shadow-lg shadow-primary-600/20 flex flex-col justify-between text-white`}>
            <div className="flex items-center gap-3 mb-2">
               <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center"><DollarSign size={20}/></div>
               <span className="font-semibold text-primary-50 uppercase tracking-wider text-xs">Laba / Rugi Bersih</span>
            </div>
            <p className="text-3xl font-extrabold">{formatIDR(netProfit)}</p>
         </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
         <h3 className="font-bold text-slate-800 mb-6 uppercase tracking-wider text-xs flex items-center gap-2"><Calendar size={16}/> Trend Keuangan Bulanan</h3>
         <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={chartData}>
                  <defs>
                     <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                     </linearGradient>
                     <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                     </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(value) => `Rp${value / 1000000}M`} />
                  <RechartsTooltip 
                    formatter={(value: any) => formatIDR(value)}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area type="monotone" dataKey="Pemasukan" stroke="#10b981" fillOpacity={1} fill="url(#colorIncome)" />
                  <Area type="monotone" dataKey="Pengeluaran" stroke="#ef4444" fillOpacity={1} fill="url(#colorExpense)" />
               </AreaChart>
            </ResponsiveContainer>
         </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
           <FileText className="text-slate-400" size={18} />
           <h3 className="font-semibold text-slate-700">Riwayat Transaksi</h3>
        </div>
        <div className="p-4 border-b border-slate-100 bg-white flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
             <input type="text" placeholder="Cari transaksi..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3 py-2 text-sm outline-none focus:border-primary-500" />
          </div>
          
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary-500 min-w-[140px]">
             <option value="all">Semua Tipe</option>
             <option value="income">Pemasukan</option>
             <option value="expense">Pengeluaran</option>
          </select>

          <div className="flex items-center gap-2">
             <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary-500" />
             <span className="text-slate-400 text-sm font-semibold">s/d</span>
             <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary-500" />
          </div>
       </div>
        <div className="overflow-x-auto">
           <table className="w-full text-left border-collapse">
              <thead>
                 <tr className="bg-slate-50 border-b border-slate-100 text-[11px] uppercase tracking-wider text-slate-500">
                    <th className="p-4 font-semibold">Tanggal</th>
                    <th className="p-4 font-semibold">Tipe</th>
                    <th className="p-4 font-semibold">Kategori / Keterangan</th>
                    <th className="p-4 font-semibold text-right">Nominal</th>
                    <th className="p-4 font-semibold text-right">Aksi</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                 {filteredTransactions.map(t => (
                    <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                       <td className="p-4 text-slate-600 font-mono text-xs">{new Date(t.date).toLocaleString('id-ID')}</td>
                       <td className="p-4">
                          <span className={`inline-flex px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest ${t.type === 'income' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-rose-50 text-rose-600 border border-rose-200'}`}>
                             {t.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                          </span>
                       </td>
                       <td className="p-4">
                          <p className="font-semibold text-slate-800">{t.note}</p>
                          <p className="text-xs text-slate-500 uppercase tracking-widest mt-0.5">{t.category}</p>
                       </td>
                       <td className={`p-4 text-right font-bold ${t.type === 'income' ? 'text-emerald-600' : 'text-slate-800'}`}>
                          {t.type === 'income' ? '+' : '-'}{formatIDR(t.amount)}
                       </td>
                       <td className="p-4 text-right">
                          <button onClick={() => handleEditClick(t)} className="text-slate-400 hover:text-primary-600 transition-colors p-1.5 hover:bg-primary-50 rounded-lg" title="Edit Transaksi">
                             <Edit size={16} />
                          </button>
                       </td>
                    </tr>
                 ))}
                 {filteredTransactions.length === 0 && (
                    <tr><td colSpan={5} className="p-8 text-center text-slate-500">Belum ada transaksi tercatat.</td></tr>
                 )}
              </tbody>
           </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95">
             <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
               <h3 className="font-bold text-lg text-slate-800">{editingId ? 'Edit Transaksi' : 'Tambah Transaksi'}</h3>
               <button onClick={()=>setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
             </div>
             <form onSubmit={handleAddTransaction} className="p-6 space-y-4">
                <div>
                   <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase">Tipe Transaksi</label>
                   <select value={form.type} onChange={e=>setForm({...form, type: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary-500">
                      <option value="expense">Pengeluaran</option>
                      <option value="income">Pemasukan</option>
                   </select>
                </div>
                <div>
                   <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase">Kategori</label>
                   <select value={form.category} onChange={e=>setForm({...form, category: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary-500">
                      {form.type === 'expense' ? (
                        <>
                          <option value="operational">Operasional (Gaji, Listrik, Bensin)</option>
                          <option value="infrastructure">Infrastruktur (Sewa Tiang, Beli Alat)</option>
                          <option value="marketing">Marketing / Promosi</option>
                          <option value="other">Lainnya</option>
                        </>
                      ) : (
                        <>
                          <option value="billing">Tagihan Bulanan</option>
                          <option value="installation">Biaya Pemasangan</option>
                          <option value="other">Pemasukan Lainnya</option>
                        </>
                      )}
                   </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase">Nominal (Rp)</label>
                  <input type="number" required min="1" value={form.amount || ''} onChange={e=>setForm({...form, amount: e.target.value ? parseInt(e.target.value) : 0})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary-500 font-mono font-bold" />
                </div>
                <div>
                   <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase">Keterangan / Tujuan</label>
                   <input type="text" required value={form.note} onChange={e=>setForm({...form, note: e.target.value})} placeholder="Misal: Beli Roll Kabel FO 1000m" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary-500" />
                </div>
                <div>
                   <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase">Tanggal</label>
                   <input type="date" required value={form.date} onChange={e=>setForm({...form, date: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary-500" />
                </div>
                <div className="pt-4">
                   <button type="submit" onClick={handleAddTransaction} className={`w-full text-white font-bold py-2.5 rounded-xl transition-colors shadow-lg ${form.type === 'expense' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}>{editingId ? 'Simpan Perubahan' : 'Simpan Transaksi'}</button>
                </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
}
