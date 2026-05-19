import { useState, useEffect } from 'react';
import { Building, Plus, Search, Trash2, CheckCircle2, Package, Shield, CreditCard, Edit2, XCircle, Save } from 'lucide-react';
import { collection, onSnapshot, setDoc, doc, deleteDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { db, secondaryAuth } from '../firebase';
import { formatShortDate } from '../lib/formatDate';

export function TenantManagement() {
  const [tenants, setTenants] = useState<any[]>([]);
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPackage, setNewPackage] = useState('Starter');
  const [newValidUntil, setNewValidUntil] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Edit Modal State
  const [editingTenant, setEditingTenant] = useState<any>(null);
  const [editPackage, setEditPackage] = useState('Starter');
  const [editValidUntil, setEditValidUntil] = useState('');

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  useEffect(() => {
    // Only superadmin should access this ideally, so we fetch all tenants
    const unsub = onSnapshot(collection(db, 'system_users'), (snapshot) => {
      const data: any[] = [];
      snapshot.forEach(d => {
        // We only want to show primary owners/tenants here
        if (d.data().role === 'superadmin' && d.id !== 'adityabiznet@gmail.com') {
          data.push({ id: d.id, ...d.data() });
        }
      });
      setTenants(data);
    });
    return () => unsub();
  }, []);

  const handleAddTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || newPassword.length < 6) {
      showNotification('Username wajib diisi dan Password minimal 6 karakter', 'error');
      return;
    }
    
    setIsProcessing(true);
    const authEmail = newEmail.trim() ? newEmail.trim().toLowerCase() : `${newUsername.trim().toLowerCase().replace(/\s+/g, '')}@dreampaymanager.app`;
    
    try {
      // 1. Create User in Secondary Auth Instance (prevents logging out current admin)
      const credential = await createUserWithEmailAndPassword(secondaryAuth, authEmail, newPassword);
      const uid = credential.user.uid;
      
      // Logout the secondary auth to clean up
      await signOut(secondaryAuth);
      
      // 2. Add to system_users
      await setDoc(doc(db, 'system_users', authEmail), {
        email: authEmail,
        username: newUsername.trim(),
        role: 'superadmin',
        status: 'active',
        package: newPackage,
        validUntil: newValidUntil ? new Date(newValidUntil).toISOString() : null,
        createdAt: new Date().toISOString(),
        tenantId: uid, // Use their Auth UID as their tenant ID
        createdBy: 'admin'
      });
      
      setNewUsername('');
      setNewEmail('');
      setNewPassword('');
      setNewValidUntil('');
      setNewPackage('Starter');
      setIsAdding(false);
      showNotification('Penyewa (Tenant) berhasil dibuat dan diregistrasi');
    } catch (e: any) {
      showNotification('Gagal membuat tenant: ' + e.message, 'error');
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleEditSave = async () => {
    if (!editingTenant) return;
    setIsProcessing(true);
    try {
      await setDoc(doc(db, 'system_users', editingTenant.id), {
        ...editingTenant,
        package: editPackage,
        validUntil: editValidUntil ? new Date(editValidUntil).toISOString() : null
      });
      showNotification('Paket / Tanggal Valid penyewa berhasil diperbarui');
      setEditingTenant(null);
    } catch(e: any) {
      showNotification('Gagal update tenant: ' + e.message, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggleStatus = async (tenant: any) => {
    try {
      await setDoc(doc(db, 'system_users', tenant.id), {
        ...tenant,
        status: tenant.status === 'active' ? 'suspended' : 'active'
      });
      showNotification('Status penyewa berhasil diubah');
    } catch (e: any) {
      showNotification('Gagal mengubah status: ' + e.message, 'error');
    }
  };

  const handleDelete = async (tenant: any) => {
    if (!confirm(`Hapus akses untuk ${tenant.username || tenant.email}?`)) return;
    try {
      await deleteDoc(doc(db, 'system_users', tenant.id));
      showNotification('Penyewa berhasil dihapus');
    } catch (e: any) {
      showNotification('Gagal menghapus penyewa: ' + e.message, 'error');
    }
  };

  const filteredTenants = tenants.filter(t => 
    (t.username || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Building className="text-primary-600" />
            Manajemen Penyewa (Tenant)
          </h2>
          <p className="text-sm text-slate-500 mt-1">Kelola pendaftaran klien atau penyewa aplikasi, serta paket berlangganannya.</p>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold tracking-wide transition-all shadow-md flex items-center gap-2"
        >
          {isAdding ? <CheckCircle2 size={18} /> : <Plus size={18} />}
          {isAdding ? 'Batal Tambah' : 'Tambah Penyewa Baru'}
        </button>
      </div>

      {notification && (
        <div className={`p-4 rounded-xl flex items-center gap-3 text-sm font-medium ${
          notification.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
        }`}>
          {notification.type === 'success' ? <CheckCircle2 size={18} /> : <Trash2 size={18} />}
          {notification.message}
        </div>
      )}

      {isAdding && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Building size={20} className="text-slate-400" />
            Buat Akun Penyewa Baru
          </h3>
          <form onSubmit={handleAddTenant} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase font-mono tracking-widest text-slate-500 mb-1">Username (ID)</label>
              <input 
                type="text" 
                value={newUsername} 
                onChange={e => setNewUsername(e.target.value)} 
                placeholder="misal: fiberlink" 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:ring-1 focus:ring-primary-600 focus:outline-none" 
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-mono tracking-widest text-slate-500 mb-1">Email Kustom (Opsional)</label>
              <input 
                type="email" 
                value={newEmail} 
                onChange={e => setNewEmail(e.target.value)} 
                placeholder="misal: email@domain.com" 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:ring-1 focus:ring-primary-600 focus:outline-none" 
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-mono tracking-widest text-slate-500 mb-1">Password</label>
              <input 
                type="password" 
                value={newPassword} 
                onChange={e => setNewPassword(e.target.value)} 
                placeholder="Minimal 6 karakter" 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:ring-1 focus:ring-primary-600 focus:outline-none" 
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-mono tracking-widest text-slate-500 mb-1">Paket Berlangganan</label>
              <select 
                value={newPackage} 
                onChange={e => setNewPackage(e.target.value)} 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:ring-1 focus:ring-primary-600 focus:outline-none"
              >
                 <option value="Starter">Starter (RT/RW Net)</option>
                 <option value="Professional">Professional (ISP Menengah)</option>
                 <option value="Enterprise">Enterprise (Nasional)</option>
                 <option value="Custom">Custom Package</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] uppercase font-mono tracking-widest text-slate-500 mb-1">Berlaku Hingga (Opsional)</label>
              <input 
                type="date" 
                value={newValidUntil} 
                onChange={e => setNewValidUntil(e.target.value)} 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:ring-1 focus:ring-primary-600 focus:outline-none" 
              />
            </div>
            <div className="md:col-span-2 flex justify-end mt-2">
              <button 
                type="submit" 
                disabled={isProcessing}
                className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-colors disabled:opacity-50"
              >
                {isProcessing ? 'Memproses...' : 'Buat Akun dan Registrasi'}
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Edit Modal */}
      {editingTenant && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl scale-in-center">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Edit2 size={18} className="text-primary-600" /> Edit Paket & Lisensi
              </h3>
              <button onClick={() => setEditingTenant(null)} className="text-slate-400 hover:text-slate-900">
                <XCircle size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-xs text-slate-500 font-mono mb-1">Penyewa</p>
                <p className="font-semibold text-slate-900">{editingTenant.username || editingTenant.email}</p>
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 border-t border-slate-100 pt-4 mt-2">Paket Berlangganan</label>
                <select 
                  value={editPackage} 
                  onChange={e => setEditPackage(e.target.value)} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:ring-1 focus:ring-primary-600 focus:outline-none"
                >
                   <option value="Starter">Starter (RT/RW Net)</option>
                   <option value="Professional">Professional (ISP Menengah)</option>
                   <option value="Enterprise">Enterprise (Nasional)</option>
                   <option value="Custom">Custom Package</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Berlaku Hingga</label>
                <input 
                  type="date" 
                  value={editValidUntil} 
                  onChange={e => setEditValidUntil(e.target.value)} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:ring-1 focus:ring-primary-600 focus:outline-none" 
                />
              </div>

              <button 
                onClick={handleEditSave}
                disabled={isProcessing}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white flex justify-center items-center gap-2 py-3 mt-4 rounded-xl text-sm font-bold disabled:opacity-50 transition-colors"
              >
                <Save size={18} />
                {isProcessing ? 'Memproses...' : 'Simpan Perubahan'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Cari username..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
            />
          </div>
          <div className="text-xs font-semibold text-slate-500 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
            Total {filteredTenants.length} Penyewa
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 py-3 text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Penyewa / Tenant</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Paket</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Berlaku Hingga</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Status</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-widest text-slate-500 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTenants.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500 text-sm">
                    Belum ada data penyewa.
                  </td>
                </tr>
              ) : filteredTenants.map((tenant) => (
                <tr key={tenant.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs uppercase border border-slate-200">
                        {tenant.username?.substring(0, 2) || tenant.email.substring(0, 2)}
                      </div>
                      <div>
                        <div className="font-semibold text-sm text-slate-900">{tenant.username || tenant.email.split('@')[0]}</div>
                        <div className="text-[10px] text-slate-500 font-mono tracking-wider">{tenant.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                      <Package size={12} />
                      {tenant.package || 'Starter'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-medium text-slate-700">
                      {tenant.validUntil ? formatShortDate(tenant.validUntil) : <span className="text-emerald-600 font-semibold">Selamanya</span>}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button 
                      onClick={() => handleToggleStatus(tenant)}
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${
                        tenant.status === 'active' 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200' 
                          : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200'
                      }`}
                    >
                      {tenant.status === 'active' ? 'Aktif' : 'Suspend'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right flex justify-end gap-1">
                    <button 
                      onClick={() => {
                        setEditingTenant(tenant);
                        setEditPackage(tenant.package || 'Starter');
                        // Handle string or Firestore Timestamp
                        let validStr = '';
                        if (tenant.validUntil) {
                          try {
                            const dateObj = typeof tenant.validUntil.toDate === 'function' 
                              ? tenant.validUntil.toDate() 
                              : new Date(tenant.validUntil);
                            validStr = dateObj.toISOString().split('T')[0];
                          } catch (e) {
                            validStr = '';
                          }
                        }
                        setEditValidUntil(validStr);
                      }}
                      className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors border border-transparent hover:border-primary-200"
                      title="Edit Paket"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(tenant)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-200"
                      title="Hapus Penyewa"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
