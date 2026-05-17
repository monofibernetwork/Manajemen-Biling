import React, { useState } from 'react';
import { ChevronRight, ChevronsRight, ChevronLeft, ChevronsLeft, TrendingUp, X } from 'lucide-react';

export function FupManagement() {
  const [fupProfiles, setFupProfiles] = useState([
    { id: 1, name: '50 Mbps', threshold1: '500 GB', speedDrop1: '25 Mbps', threshold2: '800 GB', speedDrop2: '10 Mbps', status: true },
    { id: 2, name: '100 Mbps', threshold1: '800 GB', speedDrop1: '50 Mbps', threshold2: '1200 GB', speedDrop2: '20 Mbps', status: true },
    { id: 3, name: '200 Mbps', threshold1: '2 TB', speedDrop1: '100 Mbps', threshold2: '3 TB', speedDrop2: '50 Mbps', status: false },
  ]);

  const [editingProfile, setEditingProfile] = useState<any>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [notification, setNotification] = useState<{message: string, type: string} | null>(null);

  const toggleStatus = (id: number) => {
    setFupProfiles(fupProfiles.map(p => p.id === id ? { ...p, status: !p.status } : p));
    setNotification({ message: 'Status profil FUP berhasil diubah.', type: 'success' });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (isAdding) {
      const newId = Math.max(...fupProfiles.map(p => p.id), 0) + 1;
      setFupProfiles([...fupProfiles, { ...editingProfile, id: newId }]);
      setNotification({ message: 'Profil FUP baru berhasil ditambahkan.', type: 'success' });
    } else {
      setFupProfiles(fupProfiles.map(p => p.id === editingProfile.id ? editingProfile : p));
      setNotification({ message: 'Profil FUP berhasil diperbarui.', type: 'success' });
    }
    setEditingProfile(null);
    setIsAdding(false);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleDelete = (id: number) => {
    setFupProfiles(fupProfiles.filter(p => p.id !== id));
    setNotification({ message: 'Profil FUP berhasil dihapus.', type: 'success' });
    setTimeout(() => setNotification(null), 3000);
  };

  const openAddModal = () => {
    setIsAdding(true);
    setEditingProfile({
      name: '50 Mbps', threshold1: '', speedDrop1: '', threshold2: '', speedDrop2: '', status: true
    });
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto h-full animate-in fade-in relative">
      {/* Notification Toast */}
      {notification && (
        <div className={`fixed top-4 right-4 z-[60] flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg border animate-in slide-in-from-top-2 ${
          notification.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          <div className={`w-2 h-2 rounded-full ${notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`} />
          <p className="text-sm font-medium">{notification.message}</p>
        </div>
      )}

      {/* Edit Modal */}
      {editingProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-bold text-slate-900">{isAdding ? 'Tambah Kebijakan FUP' : 'Edit Profil FUP'}</h3>
              <button 
                onClick={() => { setEditingProfile(null); setIsAdding(false); }}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Pilih Paket Layanan</label>
                <select 
                  value={editingProfile.name}
                  onChange={(e) => setEditingProfile({...editingProfile, name: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-[#1C64F2] focus:ring-1 focus:ring-[#1C64F2]"
                >
                  <option value="50 Mbps">50 Mbps (Rp 150.000)</option>
                  <option value="100 Mbps">100 Mbps (Rp 230.000)</option>
                  <option value="200 Mbps">200 Mbps (Rp 330.000)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Batas Kuota 1</label>
                  <input 
                    type="text" 
                    placeholder="Contoh: 500 GB"
                    value={editingProfile.threshold1}
                    onChange={(e) => setEditingProfile({...editingProfile, threshold1: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-[#1C64F2] focus:ring-1 focus:ring-[#1C64F2] placeholder-slate-400"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Turun Menjadi</label>
                  <input 
                    type="text" 
                    placeholder="Contoh: 25 Mbps"
                    value={editingProfile.speedDrop1}
                    onChange={(e) => setEditingProfile({...editingProfile, speedDrop1: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-[#1C64F2] focus:ring-1 focus:ring-[#1C64F2] placeholder-slate-400"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Batas Kuota 2</label>
                  <input 
                    type="text" 
                    placeholder="Contoh: 800 GB"
                    value={editingProfile.threshold2}
                    onChange={(e) => setEditingProfile({...editingProfile, threshold2: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-[#1C64F2] focus:ring-1 focus:ring-[#1C64F2] placeholder-slate-400"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Turun Menjadi</label>
                  <input 
                    type="text" 
                    placeholder="Contoh: 10 Mbps"
                    value={editingProfile.speedDrop2}
                    onChange={(e) => setEditingProfile({...editingProfile, speedDrop2: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-[#1C64F2] focus:ring-1 focus:ring-[#1C64F2] placeholder-slate-400"
                    required
                  />
                </div>
              </div>

              <div className="pt-2 mt-2 border-t border-slate-100 flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => { setEditingProfile(null); setIsAdding(false); }}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-[#1C64F2] rounded-lg hover:bg-primary-700 shadow-sm border border-[#1C64F2]"
                >
                  Simpan Kebijakan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Main Table */}
        <div className="flex-1 bg-white border border-slate-200 rounded-lg shadow-sm w-full">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800">Daftar Kebijakan FUP</h2>
            <button
              onClick={openAddModal}
              className="px-4 py-2 bg-[#1C64F2] hover:bg-primary-700 text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 shadow-sm"
            >
              + Tambah Kebijakan
            </button>
          </div>
          
          <div className="p-4 overflow-x-auto">
            <table className="w-full text-left border-collapse border border-slate-100 rounded-lg overflow-hidden">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-700 text-sm">
                  <th className="py-3 px-4 font-semibold">Paket Layanan</th>
                  <th className="py-3 px-4 font-semibold">Batas Kuota 1</th>
                  <th className="py-3 px-4 font-semibold">Speed Drop 1</th>
                  <th className="py-3 px-4 font-semibold">Batas Kuota 2</th>
                  <th className="py-3 px-4 font-semibold">Speed Drop 2</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {fupProfiles.map(profile => (
                  <tr key={profile.id} className="hover:bg-slate-50/50">
                    <td className="py-4 px-4 text-sm text-slate-700 font-medium">Paket {profile.name}</td>
                    <td className="py-4 px-4 text-sm text-slate-700">{profile.threshold1}</td>
                    <td className="py-4 px-4 text-sm text-rose-600 font-semibold">{profile.speedDrop1}</td>
                    <td className="py-4 px-4 text-sm text-slate-700">{profile.threshold2}</td>
                    <td className="py-4 px-4 text-sm text-rose-600 font-semibold">{profile.speedDrop2}</td>
                    <td className="py-4 px-4 text-sm">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => toggleStatus(profile.id)}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${profile.status ? 'bg-[#1C64F2]' : 'bg-slate-300'}`}
                        >
                          <span className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${profile.status ? 'translate-x-2' : '-translate-x-2'}`} />
                        </button>
                        <span className={`text-xs font-semibold ${profile.status ? 'text-slate-800' : 'text-slate-500'}`}>
                          {profile.status ? 'Aktif' : 'Non-aktif'}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => setEditingProfile({...profile})}
                          className="border border-slate-300 hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded text-xs font-medium transition-colors whitespace-nowrap"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDelete(profile.id)}
                          className="border border-rose-200 hover:bg-rose-50 text-rose-600 px-3 py-1.5 rounded text-xs font-medium transition-colors whitespace-nowrap"
                        >
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {/* Pagination */}
            <div className="flex items-center justify-end mt-4 gap-1">
              <button className="p-1 px-1.5 border border-slate-200 text-slate-400 rounded hover:bg-slate-50 bg-white" disabled><ChevronsLeft size={16} /></button>
              <button className="p-1 px-1.5 border border-slate-200 text-slate-400 rounded hover:bg-slate-50 bg-white" disabled><ChevronLeft size={16} /></button>
              <button className="py-1 px-3 border border-[#1C64F2] bg-[#1C64F2]/10 text-[#1C64F2] rounded text-sm font-medium">1</button>
              <button className="p-1 px-1.5 border border-slate-200 text-slate-500 rounded hover:bg-slate-50 bg-white shadow-sm"><ChevronRight size={16} /></button>
              <button className="p-1 px-1.5 border border-slate-200 text-slate-500 rounded hover:bg-slate-50 bg-white shadow-sm"><ChevronsRight size={16} /></button>
            </div>
          </div>
        </div>

        {/* Right card */}
        <div className="w-full lg:w-[320px] flex-shrink-0">
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
            <div className="bg-[#1C64F2] p-3 border-b border-[#1C64F2]/20">
              <h3 className="text-white font-medium text-[15px]">Ringkasan FUP Hari Ini</h3>
            </div>
            <div className="p-5 flex flex-col justify-center min-h-[140px]">
              <div className="flex items-center gap-4">
                <span className="text-5xl font-bold text-slate-900 tracking-tight">128</span>
                <div className="w-10 h-10 bg-[#1C64F2]/10 rounded border border-[#1C64F2]/20 flex items-center justify-center text-[#1C64F2] ml-auto">
                  <TrendingUp size={20} />
                </div>
              </div>
              <p className="text-sm text-slate-600 mt-3 font-medium">Total Pengguna Terkena FUP Hari Ini</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
