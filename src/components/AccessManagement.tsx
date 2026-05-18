import { useState, useEffect } from 'react';
import { Shield, UserPlus, Search, Trash2, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { collection, onSnapshot, setDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { formatShortDate } from '../lib/formatDate';
import { useTenant } from '../contexts/TenantContext';

export function AccessManagement() {
  const [admins, setAdmins] = useState<any[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('admin');
  const [newValidUntil, setNewValidUntil] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  const { tenantId } = useTenant();

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  useEffect(() => {
    if (!tenantId) return;
    const unsub = onSnapshot(collection(db, 'system_users'), (snapshot) => {
      const data: any[] = [];
      snapshot.forEach(d => {
        // filter clientside for now or should we use query with where?
        // Let's keep it simple and filter clientside or just allow the owner to see all.
        // Actually, system_users are global or per tenant? It should be per tenant.
        if (d.data().tenantId === tenantId || d.id === 'adityabiznet@gmail.com') {
          data.push({ id: d.id, ...d.data() });
        }
      });
      setAdmins(data);
    });
    return () => unsub();
  }, [tenantId]);

  const handleAddUser = async () => {
    if (!newEmail.trim()) return;
    try {
      await setDoc(doc(db, 'system_users', newEmail.trim().toLowerCase()), {
        email: newEmail.trim().toLowerCase(),
        role: newRole,
        status: 'active',
        validUntil: newValidUntil ? new Date(newValidUntil).toISOString() : null,
        createdAt: new Date().toISOString(),
        tenantId: tenantId
      });
      setNewEmail('');
      setNewValidUntil('');
      setIsAdding(false);
      showNotification('Pengguna berhasil ditambahkan');
    } catch (e: any) {
      showNotification('Gagal menambah user: ' + e.message, 'error');
    }
  };

  const handleToggleStatus = async (user: any) => {
    if (user.email === 'adityabiznet@gmail.com') return; // protect superadmin
    try {
      await setDoc(doc(db, 'system_users', user.id), {
        ...user,
        status: user.status === 'active' ? 'suspended' : 'active'
      });
      showNotification('Status pengguna berhasil diubah');
    } catch (e: any) {
      showNotification('Gagal mengubah status: ' + e.message, 'error');
    }
  };

  const handleDelete = async (user: any) => {
    if (user.email === 'adityabiznet@gmail.com') return; // protect superadmin
    if (!confirm(`Hapus akses untuk ${user.email}?`)) return;
    try {
      await deleteDoc(doc(db, 'system_users', user.id));
      showNotification('Pengguna berhasil dihapus');
    } catch (e: any) {
      showNotification('Gagal menghapus user: ' + e.message, 'error');
    }
  };

  const filteredAdmins = admins.filter(a => a.email.includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6 animate-in fade-in max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Shield className="text-primary-600" />
            Manajemen Akses & Lisensi
          </h2>
          <p className="text-sm text-slate-500 mt-1">Kelola email yang diizinkan untuk login dan mengakses sistem ini.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold tracking-wide transition-all shadow-md shadow-primary-600/20 flex items-center gap-2"
        >
          <UserPlus size={18} />
          Tambah Pengguna
        </button>
      </div>

      {isAdding && (
        <div className="bg-white border border-primary-200 rounded-3xl p-6 shadow-sm mb-6 animate-in slide-in-from-top-4">
          <h3 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wider">Tambah Lisensi Baru</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-1">
              <label className="block text-[10px] uppercase font-mono tracking-widest text-slate-500 mb-1">Email Pengguna</label>
              <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="email@contoh.com" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:ring-1 focus:ring-primary-600 focus:outline-none" />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-mono tracking-widest text-slate-500 mb-1">Hak Akses Role</label>
              <select value={newRole} onChange={e => setNewRole(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:ring-1 focus:ring-primary-600 focus:outline-none">
                 <option value="admin">Admin System</option>
                 <option value="finance">Finance / Keuangan</option>
                 <option value="technical">Teknisi / TNA</option>
                 <option value="cs">Customer Service</option>
                 <option value="viewer">Viewer (Read Only)</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] uppercase font-mono tracking-widest text-slate-500 mb-1">Berlaku Sampai</label>
              <input type="date" value={newValidUntil} onChange={e => setNewValidUntil(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:ring-1 focus:ring-primary-600 focus:outline-none" />
            </div>
            <div className="flex items-end gap-2">
              <button onClick={handleAddUser} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold w-full transition-colors">Simpan</button>
              <button onClick={() => setIsAdding(false)} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-bold w-full transition-colors">Batal</button>
            </div>
          </div>
          <p className="text-[10px] text-slate-500 mt-3">* Kosongkan tanggal jika berlaku selamanya (seumur hidup).</p>
        </div>
      )}

      {notification && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl animate-in slide-in-from-bottom-4 fade-in duration-300 ${notification.type === 'error' ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white'}`}>
          {notification.type === 'error' ? <XCircle size={18} /> : <CheckCircle2 size={18} />}
          <span className="text-sm font-semibold">{notification.message}</span>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Cari email..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50 text-[10px] uppercase font-mono tracking-wider text-slate-500">
                <th className="px-6 py-4 font-semibold">User Email</th>
                <th className="px-6 py-4 font-semibold">Role</th>
                <th className="px-6 py-4 font-semibold">Status Lisensi</th>
                <th className="px-6 py-4 font-semibold">Berlaku Sampai</th>
                <th className="px-6 py-4 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAdmins.length > 0 ? filteredAdmins.map((admin) => {
                const isValid = admin.validUntil ? new Date(admin.validUntil) >= new Date() : true;
                const isActive = admin.status === 'active' && isValid;
                return (
                  <tr key={admin.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-sm text-slate-900">{admin.email}</div>
                      {admin.email === 'adityabiznet@gmail.com' && <span className="inline-block mt-1 bg-amber-100 text-amber-800 text-[9px] font-bold px-2 py-0.5 rounded uppercase">Owner/Superadmin</span>}
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-primary-50 text-primary-700 text-xs font-semibold px-2.5 py-1 rounded-lg uppercase tracking-wider">
                        {admin.role || 'admin'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {isActive ? (
                        <span className="flex items-center gap-1.5 text-emerald-600 font-semibold text-xs">
                          <CheckCircle2 size={14} /> Aktif
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-rose-600 font-semibold text-xs">
                          <XCircle size={14} /> {admin.status === 'suspended' ? 'Suspended' : 'Expired'}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {admin.validUntil ? (
                        <span className="flex items-center gap-1.5 text-slate-600 font-mono text-xs">
                          <Clock size={14} className={!isValid ? 'text-rose-500' : ''} />
                          {formatShortDate(admin.validUntil)}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-mono text-xs italic">Selamanya</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {admin.email !== 'adityabiznet@gmail.com' && (
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleToggleStatus(admin)}
                            className={`p-1.5 rounded-lg transition-colors ${admin.status === 'active' ? 'text-amber-600 hover:bg-amber-50' : 'text-emerald-600 hover:bg-emerald-50'}`}
                            title={admin.status === 'active' ? 'Suspend' : 'Aktifkan'}
                          >
                            {admin.status === 'active' ? <XCircle size={18} /> : <CheckCircle2 size={18} />}
                          </button>
                          <button 
                            onClick={() => handleDelete(admin)}
                            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Hapus"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              }) : (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500 text-sm">
                    Belum ada data user tambahan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
