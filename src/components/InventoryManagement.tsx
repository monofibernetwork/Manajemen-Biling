import React, { useState, useEffect } from 'react';
import { Package, Plus, Search, Filter, History, AlertCircle, ArrowUpRight, ArrowDownLeft, Box, Truck, CheckCircle2, RotateCcw } from 'lucide-react';
import { useTenant } from '../contexts/TenantContext';
import { collection, onSnapshot, query, where, addDoc, updateDoc, doc, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

export function InventoryManagement() {
  const { tenantId } = useTenant();
  const [items, setItems] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTransModalOpen, setIsTransModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'stock' | 'history'>('stock');

  const [form, setForm] = useState({
    name: '',
    category: 'ont',
    quantity: 0,
    unit: 'pcs',
    brand: '',
    notes: ''
  });

  const [transForm, setTransForm] = useState({
    itemId: '',
    type: 'out',
    quantity: 1,
    technician: '',
    ticketId: '',
    notes: ''
  });

  useEffect(() => {
    if (!tenantId) return;

    // Fetch items
    const qItems = query(collection(db, 'inventory_items'), where('tenantId', '==', tenantId));
    const unsubItems = onSnapshot(qItems, (snap) => {
      const itms: any[] = [];
      snap.forEach(d => itms.push({ id: d.id, ...d.data() }));
      setItems(itms);
    });

    // Fetch transactions
    const qTrans = query(collection(db, 'inventory_transactions'), where('tenantId', '==', tenantId));
    const unsubTrans = onSnapshot(qTrans, (snap) => {
      const trns: any[] = [];
      snap.forEach(d => trns.push({ id: d.id, ...d.data() }));
      setTransactions(trns.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    });

    return () => {
      unsubItems();
      unsubTrans();
    };
  }, [tenantId]);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || form.quantity < 0) return alert('Data tidak valid');
    
    try {
      await addDoc(collection(db, 'inventory_items'), {
        ...form,
        quantity: Number(form.quantity),
        createdAt: new Date().toISOString(),
        tenantId
      });
      setIsModalOpen(false);
      setForm({ name: '', category: 'ont', quantity: 0, unit: 'pcs', brand: '', notes: '' });
      alert('Barang baru berhasil ditambahkan!');
    } catch (e) {
      console.error(e);
      alert('Gagal menambah barang');
    }
  };

  const handleTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transForm.itemId || transForm.quantity <= 0) return alert('Data tidak valid');
    
    const item = items.find(i => i.id === transForm.itemId);
    if (!item) return alert('Barang tidak ditemukan');

    let newStock = item.quantity;
    if (transForm.type === 'out') {
       if (item.quantity < transForm.quantity) return alert('Stok tidak mencukupi!');
       newStock -= transForm.quantity;
    } else if (transForm.type === 'in' || transForm.type === 'return') {
       newStock += transForm.quantity;
    }

    try {
      // Update stock
      await updateDoc(doc(db, 'inventory_items', item.id), { quantity: newStock });
      
      // Log transaction
      await addDoc(collection(db, 'inventory_transactions'), {
        ...transForm,
        itemName: item.name,
        quantity: Number(transForm.quantity),
        date: new Date().toISOString(),
        tenantId
      });
      
      setIsTransModalOpen(false);
      setTransForm({ itemId: '', type: 'out', quantity: 1, technician: '', ticketId: '', notes: '' });
      alert('Transaksi berhasil disimpan!');
    } catch (e) {
      console.error(e);
      alert('Transaksi gagal');
    }
  };

  const filteredItems = items.filter(i => {
    if (filterCategory !== 'all' && i.category !== filterCategory) return false;
    if (searchQuery && !i.name.toLowerCase().includes(searchQuery.toLowerCase()) && !i.brand.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const getCategoryLabel = (cat: string) => {
    const map: any = { 'ont': 'Router / ONT', 'cable': 'Kabel FO (Meter/Roll)', 'splitter': 'Splitter', 'pole': 'Tiang', 'olt': 'OLT / SFP', 'other': 'Lainnya' };
    return map[cat] || cat;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Package className="text-primary-600" /> Sistem Inventory & Gudang
          </h1>
          <p className="text-slate-500 mt-1">Kelola stok perangkat (ONT, Kabel, dll) dan lacak barang keluar.</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button 
            onClick={() => setIsTransModalOpen(true)}
            className="flex-1 sm:flex-none bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-4 py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors border border-emerald-200"
          >
            <ArrowUpRight size={20} /> Transaksi
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex-1 sm:flex-none bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all shadow-sm shadow-primary-500/20"
          >
            <Plus size={20} /> Item Baru
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-200 bg-slate-50/50">
           <button 
             onClick={() => setActiveTab('stock')}
             className={`flex flex-1 sm:flex-none items-center justify-center gap-2 px-6 py-4 font-semibold text-sm transition-colors ${activeTab === 'stock' ? 'border-b-2 border-primary-600 text-primary-700 bg-white' : 'text-slate-500 hover:text-slate-700'}`}
           >
             <Box size={18} /> Stok Gudang
           </button>
           <button 
             onClick={() => setActiveTab('history')}
             className={`flex flex-1 sm:flex-none items-center justify-center gap-2 px-6 py-4 font-semibold text-sm transition-colors ${activeTab === 'history' ? 'border-b-2 border-primary-600 text-primary-700 bg-white' : 'text-slate-500 hover:text-slate-700'}`}
           >
             <History size={18} /> Riwayat Transaksi
           </button>
        </div>
        
        {activeTab === 'stock' && (
          <div>
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-4 justify-between items-center bg-white">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Cari nama/merk..." 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-medium"
                />
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Filter size={18} className="text-slate-400" />
                <select 
                  value={filterCategory}
                  onChange={e => setFilterCategory(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary-500 font-medium text-slate-700 w-full"
                >
                  <option value="all">Semua Kategori</option>
                  <option value="ont">Router / ONT</option>
                  <option value="cable">Kabel FO</option>
                  <option value="splitter">Splitter</option>
                  <option value="pole">Tiang</option>
                  <option value="olt">OLT / SFP</option>
                  <option value="other">Lainnya</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto min-h-[300px]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80">
                    <th className="p-4 font-semibold text-slate-600 text-sm">Nama Item</th>
                    <th className="p-4 font-semibold text-slate-600 text-sm">Merk/Tipe</th>
                    <th className="p-4 font-semibold text-slate-600 text-sm">Kategori</th>
                    <th className="p-4 font-semibold text-slate-600 text-sm text-right">Stok Aktual</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredItems.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="p-4">
                        <p className="font-semibold text-slate-800 text-sm">{item.name}</p>
                        {item.notes && <p className="text-xs text-slate-500 mt-0.5">{item.notes}</p>}
                      </td>
                      <td className="p-4">
                        <p className="text-slate-700 text-sm font-medium">{item.brand || '-'}</p>
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          {getCategoryLabel(item.category)}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <span className={`inline-flex items-center justify-center min-w-[3rem] px-2.5 py-1 rounded-full text-sm font-bold border ${item.quantity > 5 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                          {item.quantity} <span className="text-[10px] uppercase ml-1 opacity-70">{item.unit}</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                  {filteredItems.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-10 text-center text-slate-500">
                        <Package className="mx-auto text-slate-300 mb-3" size={40} />
                        <p className="font-medium">Tidak ada item inventaris yang ditemukan.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="overflow-x-auto min-h-[300px]">
             <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80">
                    <th className="p-4 font-semibold text-slate-600 text-sm">Tanggal</th>
                    <th className="p-4 font-semibold text-slate-600 text-sm">Item</th>
                    <th className="p-4 font-semibold text-slate-600 text-sm">Tipe</th>
                    <th className="p-4 font-semibold text-slate-600 text-sm">Jumlah</th>
                    <th className="p-4 font-semibold text-slate-600 text-sm">Teknisi / Tujuan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transactions.map(trx => (
                    <tr key={trx.id} className="hover:bg-slate-50/60 transition-colors">
                       <td className="p-4">
                         <p className="text-sm font-medium text-slate-800">{new Date(trx.date).toLocaleDateString('id-ID')}</p>
                         <p className="text-xs text-slate-500 font-mono">{new Date(trx.date).toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'})}</p>
                       </td>
                       <td className="p-4">
                         <p className="font-semibold text-slate-800 text-sm">{trx.itemName}</p>
                       </td>
                       <td className="p-4">
                         <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-semibold border ${trx.type === 'in' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : trx.type === 'out' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                           {trx.type === 'in' ? <ArrowDownLeft size={12}/> : trx.type === 'out' ? <ArrowUpRight size={12}/> : <RotateCcw size={12}/>}
                           {trx.type === 'in' ? 'Masuk' : trx.type === 'out' ? 'Keluar' : 'Retur Rusak'}
                         </span>
                       </td>
                       <td className="p-4 font-bold text-slate-800">
                         {trx.type === 'out' ? '-' : '+'}{trx.quantity}
                       </td>
                       <td className="p-4">
                         {trx.technician ? (
                            <p className="text-sm font-medium text-slate-700 capitalize">{trx.technician}</p>
                         ) : <span className="text-slate-400">-</span>}
                         {trx.ticketId && <p className="text-xs text-slate-500 font-mono">Tiket: {trx.ticketId}</p>}
                       </td>
                    </tr>
                  ))}
                  {transactions.length === 0 && (
                     <tr>
                      <td colSpan={5} className="p-10 text-center text-slate-500">
                        <History className="mx-auto text-slate-300 mb-3" size={40} />
                        <p className="font-medium">Belum ada riwayat transaksi.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
             </table>
          </div>
        )}
      </div>

      {/* Modal Tambah Item Baru */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
             <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
               <h3 className="font-bold text-lg text-slate-800">Tambah Item Inventaris</h3>
             </div>
             <form onSubmit={handleAddItem} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Nama Item</label>
                  <input type="text" required value={form.name} onChange={e=>setForm({...form, name: e.target.value})} placeholder="Contoh: ZTE F609" className="w-full border border-slate-200 rounded-xl px-4 py-2 focus:outline-none focus:border-primary-500 bg-slate-50" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Kategori</label>
                      <select value={form.category} onChange={e=>setForm({...form, category: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-2 focus:outline-none focus:border-primary-500 bg-slate-50">
                         <option value="ont">Router / ONT</option>
                         <option value="cable">Kabel FO</option>
                         <option value="splitter">Splitter</option>
                         <option value="pole">Tiang</option>
                         <option value="olt">OLT / SFP</option>
                         <option value="other">Lainnya</option>
                      </select>
                   </div>
                   <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Merk / Tipe</label>
                      <input type="text" value={form.brand} onChange={e=>setForm({...form, brand: e.target.value})} placeholder="ZTE / Huawei" className="w-full border border-slate-200 rounded-xl px-4 py-2 focus:outline-none focus:border-primary-500 bg-slate-50" />
                   </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Stok Awal</label>
                      <input type="number" required min="0" value={form.quantity} onChange={e=>setForm({...form, quantity: parseInt(e.target.value) || 0})} className="w-full border border-slate-200 rounded-xl px-4 py-2 focus:outline-none focus:border-primary-500 bg-slate-50" />
                   </div>
                   <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Satuan</label>
                      <select value={form.unit} onChange={e=>setForm({...form, unit: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-2 focus:outline-none focus:border-primary-500 bg-slate-50">
                         <option value="pcs">Pcs / Unit</option>
                         <option value="roll">Roll</option>
                         <option value="meter">Meter</option>
                         <option value="box">Box</option>
                      </select>
                   </div>
                </div>
                <div className="pt-2 flex justify-end gap-3 border-t border-slate-100 mt-6 pt-4">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 font-semibold hover:bg-slate-100 rounded-xl">Batal</button>
                  <button type="submit" className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-xl font-semibold shadow-sm">Simpan</button>
                </div>
             </form>
          </div>
        </div>
      )}

      {/* Modal Transaksi (Masuk/Keluar) */}
      {isTransModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
             <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
               <h3 className="font-bold text-lg text-slate-800">Catat Transaksi Barang</h3>
             </div>
             <form onSubmit={handleTransaction} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Jenis Transaksi</label>
                  <div className="grid grid-cols-3 gap-2">
                     <button type="button" onClick={() => setTransForm({...transForm, type: 'out'})} className={`py-2 rounded-xl font-semibold text-xs border ${transForm.type === 'out' ? 'bg-amber-50 border-amber-500 text-amber-700' : 'bg-white border-slate-200 text-slate-500'}`}>Keluar</button>
                     <button type="button" onClick={() => setTransForm({...transForm, type: 'in'})} className={`py-2 rounded-xl font-semibold text-xs border ${transForm.type === 'in' ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'bg-white border-slate-200 text-slate-500'}`}>Masuk</button>
                     <button type="button" onClick={() => setTransForm({...transForm, type: 'return'})} className={`py-2 rounded-xl font-semibold text-xs border ${transForm.type === 'return' ? 'bg-rose-50 border-rose-500 text-rose-700' : 'bg-white border-slate-200 text-slate-500'}`}>Retur</button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Pilih Item</label>
                  <select required value={transForm.itemId} onChange={e=>setTransForm({...transForm, itemId: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-2 focus:outline-none focus:border-primary-500 bg-slate-50">
                     <option value="">-- Pilih Barang --</option>
                     {items.map(i => <option key={i.id} value={i.id}>{i.name} (Stok: {i.quantity} {i.unit})</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Jumlah</label>
                      <input type="number" required min="1" value={transForm.quantity} onChange={e=>setTransForm({...transForm, quantity: parseInt(e.target.value) || 1})} className="w-full border border-slate-200 rounded-xl px-4 py-2 focus:outline-none focus:border-primary-500 bg-slate-50" />
                   </div>
                   {transForm.type === 'out' && (
                     <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Teknisi (Opsional)</label>
                        <select value={transForm.technician} onChange={e=>setTransForm({...transForm, technician: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-2 focus:outline-none focus:border-primary-500 bg-slate-50">
                           <option value="">-- Pilih --</option>
                           <option value="teknisi1">Teknisi 1 (Aji)</option>
                           <option value="teknisi2">Teknisi 2 (Budi)</option>
                        </select>
                     </div>
                   )}
                </div>
                {transForm.type === 'out' && (
                   <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">ID Tiket Pekerjaan (Opsional)</label>
                      <input type="text" value={transForm.ticketId} onChange={e=>setTransForm({...transForm, ticketId: e.target.value})} placeholder="Misal: TKT-1234" className="w-full border border-slate-200 rounded-xl px-4 py-2 focus:outline-none focus:border-primary-500 bg-slate-50" />
                   </div>
                )}
                <div className="pt-2 flex justify-end gap-3 border-t border-slate-100 mt-6 pt-4">
                  <button type="button" onClick={() => setIsTransModalOpen(false)} className="px-4 py-2 text-slate-600 font-semibold hover:bg-slate-100 rounded-xl">Batal</button>
                  <button type="submit" className={`px-6 py-2 rounded-xl font-semibold shadow-sm text-white transition-all ${transForm.type === 'out' ? 'bg-amber-600 hover:bg-amber-700' : transForm.type === 'in' ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-rose-600 hover:bg-rose-700'}`}>Simpan Transaksi</button>
                </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
}
