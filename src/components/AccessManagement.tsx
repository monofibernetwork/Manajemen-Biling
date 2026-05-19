import { useState, useEffect } from 'react';
import { Shield, UserPlus, Search, Trash2, CheckCircle2, XCircle, Clock, Key, Eye, EyeOff } from 'lucide-react';
import { collection, onSnapshot, setDoc, doc, deleteDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updatePassword, signOut } from 'firebase/auth';
import { db, secondaryAuth } from '../firebase';
import { formatShortDate } from '../lib/formatDate';
import { useTenant } from '../contexts/TenantContext';

export function AccessManagement() {
  const [admins, setAdmins] = useState<any[]>([]);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('admin');
  const [newValidUntil, setNewValidUntil] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Edit Password Modal
  const [editPasswordModal, setEditPasswordModal] = useState<{isOpen: boolean, user: any, newPass: string}>({ isOpen: false, user: null, newPass: '' });
  const [showPass, setShowPass] = useState<Record<string, boolean>>({});

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
        if (d.data().tenantId === tenantId || d.id === 'adityabiznet@gmail.com') {
          data.push({ id: d.id, ...d.data() });
        }
      });
      setAdmins(data);
    });
    return () => unsub();
  }, [tenantId]);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || newPassword.length < 6) {
      showNotification('Username wajib diisi dan Password minimal 6 karakter', 'error');
      return;
    }
    
    setIsProcessing(true);
    const authEmail = `${newUsername.trim().toLowerCase().replace(/\s+/g, '')}@dreampaymanager.app`;
    
    try {
      // 1. Create User in Secondary Auth Instance (prevents logging out current admin)
      await createUserWithEmailAndPassword(secondaryAuth, authEmail, newPassword);
      await signOut(secondaryAuth);
      
      // 2. Add to system_users
      await setDoc(doc(db, 'system_users', authEmail), {
        email: authEmail,
        username: newUsername.trim(),
        role: newRole,
        plainPassword: newPassword, // Store password for admin management (common for local ISP apps)
        status: 'active',
        validUntil: newValidUntil ? new Date(newValidUntil).toISOString() : null,
        createdAt: new Date().toISOString(),
        tenantId: tenantId
      });
      
      setNewUsername('');
      setNewPassword('');
      setNewValidUntil('');
      setIsAdding(false);
      showNotification('Pengguna pegawai berhasil ditambahkan');
    } catch (err: any) {
      showNotification('Gagal menambah user: ' + err.message, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSavePassword = async () => {
    if (!editPasswordModal.user || editPasswordModal.newPass.length < 6) {
      showNotification('Password minimal 6 karakter', 'error');
      return;
    }
    setIsProcessing(true);
    
    try {
      const userDoc = editPasswordModal.user;
      
      // 1. Sign in with old password to secondary auth
      // If plainPassword is missing, maybe we can't change it this way
      if (!userDoc.plainPassword) throw new Error('Password lama tidak tersimpan di sistem, hubungi Support.');
      
      const credential = await signInWithEmailAndPassword(secondaryAuth, userDoc.email, userDoc.plainPassword);
      
      // 2. Update password
      await updatePassword(credential.user, editPasswordModal.newPass);
      await signOut(secondaryAuth);
      
      // 3. Keep updated plain password
      await setDoc(doc(db, 'system_users', userDoc.id), {
        ...userDoc,
        plainPassword: editPasswordModal.newPass
      });
      
      setEditPasswordModal({ isOpen: false, user: null, newPass: '' });
      showNotification('Password berhasil diubah');
    } catch (err: any) {
      showNotification('Gagal mengubah password: ' + err.message, 'error');
    } finally {
      setIsProcessing(false);
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
    if (!confirm(`Hapus akses untuk ${user.username || user.email}?`)) return;
    try {
      await deleteDoc(doc(db, 'system_users', user.id));
      showNotification('Pengguna berhasil dihapus');
    } catch (e: any) {
      showNotification('Gagal menghapus user: ' + e.message, 'error');
    }
  };

  const filteredAdmins = admins.filter(a => 
    a.email.includes(searchTerm.toLowerCase()) || 
    (a.username && a.username.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-in fade-in max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Shield className="text-primary-600" />
            Manajemen Pegawai & Akses
          </h2>
          <p className="text-sm text-slate-500 mt-1">Buat akun untuk pegawai agar bisa login ke sistem ini.</p>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold tracking-wide transition-all shadow-md flex items-center gap-2"
        >
          {isAdding ? <XCircle size={18} /> : <UserPlus size={18} />}
          {isAdding ? 'Batal Tambah' : 'Tambah Pegawai'}
        </button>
      </div>

      {isAdding && (
        <div className="bg-white border border-primary-200 rounded-3xl p-6 shadow-sm mb-6 animate-in slide-in-from-top-4">
          <h3 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wider">Akun Pegawai Baru</h3>
          <form onSubmit={handleAddUser} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-[10px] uppercase font-mono tracking-widest text-slate-500 mb-1">Username Login</label>
              <input type="text" value={newUsername} onChange={e => setNewUsername(e.target.value)} placeholder="Misal: admin1" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:ring-1 focus:ring-primary-600 focus:outline-none" />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-mono tracking-widest text-slate-500 mb-1">Password Baru</label>
              <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Minimal 6 karakter" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:ring-1 focus:ring-primary-600 focus:outline-none" />
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
            <div className="lg:col-span-4 flex justify-end mt-2">
              <button disabled={isProcessing} type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-colors disabled:opacity-50">
                {isProcessing ? 'Menyimpan...' : 'Simpan Pegawai'}
              </button>
            </div>
          </form>
          <p className="text-[10px] text-slate-500 mt-3">* Kosongkan tanggal batas jika berlaku selamanya.</p>
        </div>
      )}

      {notification && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl animate-in slide-in-from-bottom-4 fade-in duration-300 ${notification.type === 'error' ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white'}`}>
          {notification.type === 'error' ? <XCircle size={18} /> : <CheckCircle2 size={18} />}
          <span className="text-sm font-semibold">{notification.message}</span>
        </div>
      )}
      
      {/* Edit Password Modal */}
      {editPasswordModal.isOpen && editPasswordModal.user && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl scale-in-center">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Key size={18} className="text-primary-600" /> Edit Password
              </h3>
              <button onClick={() => setEditPasswordModal({ isOpen: false, user: null, newPass: '' })} className="text-slate-400 hover:text-slate-900">
                <XCircle size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-xs text-slate-500 font-mono mb-1">Pegawai</p>
                <p className="font-semibold text-slate-900">{editPasswordModal.user.username || editPasswordModal.user.email}</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 border-t border-slate-100 pt-4 mt-2">Password Baru</label>
                <input 
                  type="text" 
                  value={editPasswordModal.newPass}
                  onChange={(e) => setEditPasswordModal({...editPasswordModal, newPass: e.target.value})}
                  placeholder="Ganti password..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-1 focus:ring-primary-600"
                />
              </div>
              
              <button 
                onClick={handleSavePassword}
                disabled={isProcessing}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white py-2.5 rounded-xl text-sm font-bold mt-2 disabled:opacity-50"
              >
                {isProcessing ? 'Memproses...' : 'Simpan Password'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Cari username atau email pegawai..." 
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
                <th className="px-6 py-4 font-semibold">Username / Email</th>
                <th className="px-6 py-4 font-semibold">Password</th>
                <th className="px-6 py-4 font-semibold">Role</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAdmins.length > 0 ? filteredAdmins.map((admin) => {
                const isValid = admin.validUntil ? new Date(admin.validUntil) >= new Date() : true;
                const isActive = admin.status === 'active' && isValid;
                const isSuperAdmin = admin.email === 'adityabiznet@gmail.com' || admin.role === 'superadmin';
                return (
                  <tr key={admin.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-sm text-slate-900">{admin.username || admin.email.split('@')[0]}</div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">{admin.email}</div>
                      {isSuperAdmin && <span className="inline-block mt-1 bg-amber-100 text-amber-800 text-[9px] font-bold px-2 py-0.5 rounded uppercase">Owner/Superadmin</span>}
                    </td>
                    <td className="px-6 py-4">
                      {!isSuperAdmin && admin.plainPassword && (
                        <div className="flex items-center gap-2">
                           <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded text-slate-700">
                             {showPass[admin.id] ? admin.plainPassword : '••••••••'}
                           </span>
                           <button onClick={() => setShowPass(prev => ({...prev, [admin.id]: !prev[admin.id]}))} className="text-slate-400 hover:text-slate-700">
                             {showPass[admin.id] ? <EyeOff size={14}/> : <Eye size={14}/>}
                           </button>
                           <button 
                              onClick={() => setEditPasswordModal({isOpen: true, user: admin, newPass: ''})}
                              className="text-primary-600 hover:text-primary-800 border border-primary-200 bg-primary-50 px-2 py-1 rounded text-[10px] font-semibold uppercase tracking-wider ml-2"
                           >
                              Edit
                           </button>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-primary-50 text-primary-700 text-xs font-semibold px-2.5 py-1 rounded-lg uppercase tracking-wider border border-primary-100">
                        {admin.role || 'admin'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {isActive ? (
                        <span className="flex items-center gap-1.5 text-emerald-600 font-semibold text-xs bg-emerald-50 w-fit px-2.5 py-1 rounded-md border border-emerald-100">
                          <CheckCircle2 size={12} /> Aktif
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-rose-600 font-semibold text-xs bg-rose-50 w-fit px-2.5 py-1 rounded-md border border-rose-100">
                          <XCircle size={12} /> {admin.status === 'suspended' ? 'Suspended' : 'Expired'}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {!isSuperAdmin && (
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleToggleStatus(admin)}
                            className={`p-1.5 rounded-lg transition-colors border ${admin.status === 'active' ? 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100' : 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100'}`}
                            title={admin.status === 'active' ? 'Suspend' : 'Aktifkan'}
                          >
                            {admin.status === 'active' ? <XCircle size={16} /> : <CheckCircle2 size={16} />}
                          </button>
                          <button 
                            onClick={() => handleDelete(admin)}
                            className="p-1.5 rounded-lg text-rose-600 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition-colors"
                            title="Hapus"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              }) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500 text-sm">
                    Belum ada data pegawai tambahan.
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
