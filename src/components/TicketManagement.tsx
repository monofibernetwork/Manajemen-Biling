import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Ticket, AlertCircle, Clock, CheckCircle2, MoreVertical, X, Wrench, User } from 'lucide-react';
import { useTenant } from '../contexts/TenantContext';
import { collection, onSnapshot, query, where, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';

export function TicketManagement() {
  const { tenantId } = useTenant();
  const [tickets, setTickets] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  const [form, setForm] = useState({
    title: '',
    customerName: '',
    customerId: '',
    category: 'loss',
    priority: 'high',
    technician: 'teknisi1',
    description: ''
  });

  useEffect(() => {
    if (!tenantId) return;
    const q = query(collection(db, 'tickets'), where('tenantId', '==', tenantId));
    const unsub = onSnapshot(q, (snap) => {
      const t: any[] = [];
      snap.forEach(doc => t.push({ id: doc.id, ...doc.data() }));
      setTickets(t);
    });
    return () => unsub();
  }, [tenantId]);

  const [selectedTicketDetail, setSelectedTicketDetail] = useState<any | null>(null);
  const [ticketMessage, setTicketMessage] = useState('');

  const handleSendTicketMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicketDetail || !ticketMessage.trim()) return;
    
    try {
      const { doc, updateDoc, arrayUnion } = await import('firebase/firestore');
      const { db } = await import('../firebase');
      
      await updateDoc(doc(db, 'tickets', selectedTicketDetail.id), {
         messages: arrayUnion({
            sender: 'admin',
            text: ticketMessage,
            timestamp: new Date().toISOString()
         })
      });
      
      setTicketMessage('');
      setSelectedTicketDetail({
         ...selectedTicketDetail,
         messages: [...(selectedTicketDetail.messages || []), {
            sender: 'admin',
            text: ticketMessage,
            timestamp: new Date().toISOString()
         }]
      });
    } catch (err) {
      console.error(err);
      alert('Gagal mengirim pesan.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.customerName) return alert('Data tidak lengkap');
    try {
      await addDoc(collection(db, 'tickets'), {
        ...form,
        status: 'open',
        createdAt: new Date().toISOString(),
        tenantId
      });
      setIsModalOpen(false);
      setForm({ title: '', customerName: '', customerId: '', category: 'loss', priority: 'high', technician: 'teknisi1', description: '' });
      alert('Tiket berhasil dibuat!');
    } catch (error) {
      console.error(error);
      alert('Gagal membuat tiket');
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await updateDoc(doc(db, 'tickets', id), { status });
    } catch (e) {
      console.error(e);
    }
  };

  const filteredTickets = tickets.filter(t => {
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    if (searchQuery && !t.customerName.toLowerCase().includes(searchQuery.toLowerCase()) && !t.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'open': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'in_progress': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'resolved': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch(status) {
      case 'open': return 'Menunggu';
      case 'in_progress': return 'Dikerjakan';
      case 'resolved': return 'Selesai';
      default: return status;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Ticket className="text-primary-600" /> Manajemen Tiket Gangguan
          </h1>
          <p className="text-slate-500 mt-1">Buat dan pantau tugas penanganan gangguan (Trouble Ticket).</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition-all shadow-sm shadow-primary-500/20"
        >
          <Plus size={20} /> Tiket Baru
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-50/50">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Cari tiket/pelanggan..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter size={18} className="text-slate-400" />
            <select 
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary-500 text-slate-700"
            >
              <option value="all">Semua Status</option>
              <option value="open">Menunggu</option>
              <option value="in_progress">Dikerjakan</option>
              <option value="resolved">Selesai</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="p-4 font-semibold text-slate-600 text-sm">Tiket</th>
                <th className="p-4 font-semibold text-slate-600 text-sm">Pelanggan</th>
                <th className="p-4 font-semibold text-slate-600 text-sm">Kategori</th>
                <th className="p-4 font-semibold text-slate-600 text-sm">Teknisi</th>
                <th className="p-4 font-semibold text-slate-600 text-sm">Status</th>
                <th className="p-4 font-semibold text-slate-600 text-sm text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTickets.map(ticket => (
                <tr key={ticket.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4">
                    <p className="font-semibold text-slate-800 text-sm">{ticket.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{new Date(ticket.createdAt).toLocaleString('id-ID')}</p>
                  </td>
                  <td className="p-4">
                    <p className="font-medium text-slate-800 text-sm">{ticket.customerName}</p>
                    {ticket.customerId && <p className="text-xs text-slate-500 font-mono mt-0.5">{ticket.customerId}</p>}
                  </td>
                  <td className="p-4">
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-semibold bg-slate-100 text-slate-700 capitalize">
                      {ticket.category === 'loss' ? 'Redaman Loss' : ticket.category === 'speed' ? 'Internet Lambat' : 'Lainnya'}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                       <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                          <User size={12} />
                       </div>
                       <span className="text-sm font-medium text-slate-700 capitalize">{ticket.technician}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusColor(ticket.status)}`}>
                      {ticket.status === 'open' && <AlertCircle size={12} />}
                      {ticket.status === 'in_progress' && <Clock size={12} />}
                      {ticket.status === 'resolved' && <CheckCircle2 size={12} />}
                      {getStatusLabel(ticket.status)}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => setSelectedTicketDetail(ticket)} className="bg-white border border-slate-200 text-slate-700 text-xs font-semibold px-2 py-1.5 rounded hover:bg-slate-50">
                        Chat
                      </button>
                      <select
                        value={ticket.status}
                        onChange={(e) => handleUpdateStatus(ticket.id, e.target.value)}
                        className="bg-slate-50 border border-slate-200 text-xs rounded px-2 py-1 focus:outline-none"
                      >
                         <option value="open">Open</option>
                         <option value="in_progress">In Progress</option>
                         <option value="resolved">Resolved</option>
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredTickets.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    <Ticket className="mx-auto text-slate-300 mb-3" size={48} />
                    <p>Belum ada tiket gangguan.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                <Wrench className="text-primary-600" size={20} /> Buat Tiket Gangguan
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
               <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Judul Gangguan</label>
                  <input type="text" required value={form.title} onChange={e=>setForm({...form, title: e.target.value})} placeholder="Contoh: Kabel Drop Putus" className="w-full border border-slate-200 rounded-xl px-4 py-2 focus:outline-none focus:border-primary-500" />
               </div>
               <div className="grid grid-cols-2 gap-4">
                   <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Nama Pelanggan</label>
                      <input type="text" required value={form.customerName} onChange={e=>setForm({...form, customerName: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-2 focus:outline-none focus:border-primary-500" />
                   </div>
                   <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">ID Pelanggan (Optional)</label>
                      <input type="text" value={form.customerId} onChange={e=>setForm({...form, customerId: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-2 focus:outline-none focus:border-primary-500" />
                   </div>
               </div>
               <div className="grid grid-cols-2 gap-4">
                   <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Kategori</label>
                      <select value={form.category} onChange={e=>setForm({...form, category: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-2 focus:outline-none focus:border-primary-500">
                         <option value="loss">Redaman Loss</option>
                         <option value="speed">Internet Lambat</option>
                         <option value="other">Lainnya</option>
                      </select>
                   </div>
                   <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Prioritas</label>
                      <select value={form.priority} onChange={e=>setForm({...form, priority: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-2 focus:outline-none focus:border-primary-500">
                         <option value="critical">Kritis</option>
                         <option value="high">Tinggi</option>
                         <option value="medium">Menengah</option>
                      </select>
                   </div>
               </div>
               <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Tugaskan Ke</label>
                  <select value={form.technician} onChange={e=>setForm({...form, technician: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-2 focus:outline-none focus:border-primary-500">
                     <option value="teknisi1">Teknisi 1 (Aji)</option>
                     <option value="teknisi2">Teknisi 2 (Budi)</option>
                  </select>
               </div>
               <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Deskripsi Tambahan</label>
                  <textarea value={form.description} onChange={e=>setForm({...form, description: e.target.value})} rows={3} className="w-full border border-slate-200 rounded-xl px-4 py-2 focus:outline-none focus:border-primary-500"></textarea>
               </div>
               <div className="pt-2 flex justify-end gap-3">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 font-semibold hover:bg-slate-100 rounded-xl">Batal</button>
                  <button type="submit" className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-xl font-semibold shadow-sm">Buat Tiket</button>
               </div>
            </form>
          </div>
        </div>
      )}
      {selectedTicketDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Ticket className="text-primary-600" />
                Chat & Update Koordinasi
              </h3>
              <button onClick={() => setSelectedTicketDetail(null)} className="text-slate-400 hover:text-slate-600 p-2"><X size={20}/></button>
            </div>
            
            <div className="flex-1 min-h-[350px] bg-slate-50/50 flex flex-col overflow-hidden">
                <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3">
                    {(selectedTicketDetail.messages || []).length === 0 ? (
                    <div className="flex items-center justify-center h-full text-slate-400 text-sm">Belum ada pesan koordinasi.</div>
                    ) : (
                    (selectedTicketDetail.messages || []).map((msg: any, i: number) => (
                        <div key={i} className={`flex flex-col ${msg.sender === 'admin' ? 'items-end' : 'items-start'}`}>
                            <span className="text-[10px] text-slate-400 font-mono mb-0.5 px-1">{msg.sender === 'admin' ? 'Admin / NOC' : 'Teknisi'}</span>
                            <div className={`px-4 py-2 rounded-2xl max-w-[85%] text-sm ${msg.sender === 'admin' ? 'bg-indigo-600 text-white rounded-tr-sm' : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm'}`}>
                                {msg.text.includes('http') ? (
                                <a href={msg.text.split(' ').find((w: string) => w.startsWith('http'))} target="_blank" rel="noopener noreferrer" className="underline font-medium text-blue-500">
                                   📍 Buka Lokasi/Link
                                </a>
                                ) : msg.text}
                            </div>
                        </div>
                    ))
                    )}
                </div>
                <div className="p-3 bg-white border-t border-slate-200">
                    <form onSubmit={handleSendTicketMessage} className="flex gap-2">
                    <input type="text" value={ticketMessage} onChange={e => setTicketMessage(e.target.value)} placeholder="Tulis instruksi admin..." className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-4 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm" />
                    <button type="submit" disabled={!ticketMessage.trim()} className="px-5 py-2.5 bg-indigo-600 font-semibold text-white rounded-xl disabled:opacity-50 transition-all">
                        Kirim
                    </button>
                    </form>
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
