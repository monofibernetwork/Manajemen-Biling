import { useState } from 'react';
import { User, Server, MapPin, Phone, Shield, Edit2, CheckCircle2, Cpu, Activity, Clock, Terminal } from 'lucide-react';

export function UserProfile() {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: 'Aditya Firmansyah',
    phone: '082124812114',
    address: 'Jl Dahlia Raya No C 14-15',
    email: 'adityabiznet@gmail.com',
  });
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const handleSave = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setNotification({ message: 'Format email tidak valid!', type: 'error' });
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    setIsEditing(false);
    setNotification({ message: 'Profil Admin berhasil diperbarui.', type: 'success' });
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column: Personal Info & Status */}
      <div className="lg:col-span-1 space-y-6">
        {/* Profile Card */}
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden relative">
          <div className="h-24 bg-gradient-to-r from-emerald-600/40 to-cyan-600/40 border-b border-slate-200"></div>
          <div className="px-6 pb-6 relative">
            <div className="absolute -top-12 left-6">
              <div className="w-20 h-20 bg-white border-4 border-slate-900 rounded-2xl flex items-center justify-center text-slate-700 shadow-xl">
                <User size={36} />
              </div>
            </div>
            
            <div className="flex justify-end pt-3">
              <button 
                onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                className={`flex items-center gap-1.5 text-xs font-semibold px-4 py-2 ${isEditing ? 'bg-primary-600 text-white hover:bg-primary-700 shadow-md shadow-primary-600/20 border-transparent' : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'} rounded-xl transition-all border`}
              >
                {isEditing ? <CheckCircle2 size={16} /> : <Edit2 size={14} />}
                {isEditing ? 'Simpan' : 'Edit Profil'}
              </button>
            </div>
            
            <div className="mt-2 text-left">
              {isEditing ? (
                <div className="space-y-4 mt-4">
                  <div>
                    <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1.5">Nama Lengkap</label>
                    <input 
                      type="text" 
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-900 focus:ring-1 focus:ring-primary-600 focus:outline-none transition-all font-mono" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1.5">Email</label>
                    <input 
                      type="text" 
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-900 focus:ring-1 focus:ring-primary-600 focus:outline-none transition-all font-mono" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1.5">Nomor Telepon</label>
                    <input 
                      type="text" 
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-900 focus:ring-1 focus:ring-primary-600 focus:outline-none transition-all font-mono" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1.5">Lokasi Server / Alamat</label>
                    <textarea 
                      value={formData.address}
                      onChange={e => setFormData({ ...formData, address: e.target.value })}
                      rows={2}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-900 focus:ring-1 focus:ring-primary-600 focus:outline-none resize-none transition-all" 
                    />
                  </div>
                </div>
              ) : (
                <>
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight">{formData.name}</h2>
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5">Admin Server (Owner)</p>
                  
                  <div className="mt-6 space-y-3">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 text-slate-500 group">
                        <Phone size={14} className="group-hover:text-emerald-600 transition-colors" />
                        <span className="text-sm text-slate-700 font-mono">{formData.phone}</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 text-slate-500 group">
                        <Terminal size={14} className="group-hover:text-amber-600 transition-colors" />
                        <span className="text-sm text-slate-700 font-mono">{formData.email}</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-start gap-2 text-slate-500 group">
                        <MapPin size={14} className="mt-0.5 group-hover:text-primary-600 transition-colors shrink-0" />
                        <span className="text-sm text-slate-700">{formData.address}</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 pt-2 border-t border-slate-200/50">
                      <div className="flex items-center gap-2 text-slate-500">
                        <Shield size={14} className="text-emerald-600" />
                        <span className="text-xs font-mono text-slate-400 uppercase tracking-widest mt-0.5">Role: <strong className="text-emerald-600">Super Admin</strong></span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
            {notification && (
              <div className={`mt-4 p-3 rounded-xl border flex items-start gap-3 animate-in fade-in ${notification.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600' : 'bg-rose-500/10 border-rose-500/20 text-rose-600'}`}>
                {notification.type === 'success' ? <CheckCircle2 size={16} /> : <Clock size={16} />}
                <p className="text-xs">{notification.message}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Column: Server & System Info */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white border border-slate-200 rounded-3xl p-6">
           <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-6 flex items-center gap-2"><Server size={14} /> Server & System Info</h3>
           
           <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-slate-50 border border-slate-200/50 p-4 rounded-2xl flex flex-col gap-1">
                 <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">Router OS</p>
                 <p className="font-bold text-lg text-emerald-600 tracking-tight">v7.12.1</p>
                 <p className="text-[9px] text-slate-500 uppercase font-mono mt-auto pt-2">MikroTik x86</p>
              </div>
              <div className="bg-slate-50 border border-slate-200/50 p-4 rounded-2xl flex flex-col gap-1">
                 <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">Gateway IP</p>
                 <p className="font-mono text-sm text-slate-800">103.111.0.1</p>
                 <p className="text-[9px] text-slate-500 uppercase font-mono mt-auto pt-2">Public Static</p>
              </div>
              <div className="bg-slate-50 border border-slate-200/50 p-4 rounded-2xl flex flex-col gap-1">
                 <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">System Uptime</p>
                 <p className="font-mono text-sm text-slate-800">45d 12h 30m</p>
                 <p className="text-[9px] text-emerald-500 uppercase font-mono mt-auto pt-2 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 border border-emerald-400"></span> Online
                 </p>
              </div>
              <div className="bg-slate-50 border border-slate-200/50 p-4 rounded-2xl flex flex-col gap-1">
                 <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">Active Tunnels</p>
                 <p className="font-bold text-lg text-primary-600 tracking-tight">142</p>
                 <p className="text-[9px] text-slate-500 uppercase font-mono mt-auto pt-2">PPPoE Connected</p>
              </div>
           </div>

           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
              <div className="p-4 border border-slate-200/50 bg-slate-50/50 rounded-2xl">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-amber-500/10 text-amber-500 rounded-lg flex items-center justify-center border border-amber-500/20">
                    <Cpu size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-700">CPU Load</p>
                    <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">12 Cores 2.4GHz</p>
                  </div>
                </div>
                <div className="w-full bg-white rounded-full h-2 mt-3">
                  <div className="bg-amber-500 h-2 rounded-full" style={{ width: '45%' }}></div>
                </div>
                <p className="text-right text-[10px] font-mono text-slate-400 mt-1">45%</p>
              </div>

              <div className="p-4 border border-slate-200/50 bg-slate-50/50 rounded-2xl">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-primary-600 text-white rounded-lg flex items-center justify-center border border-primary-600/20">
                    <Activity size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-700">Memory Usage</p>
                    <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">16GB / 32GB Total</p>
                  </div>
                </div>
                <div className="w-full bg-white rounded-full h-2 mt-3">
                  <div className="bg-primary-600 h-2 rounded-full" style={{ width: '50%' }}></div>
                </div>
                <p className="text-right text-[10px] font-mono text-slate-400 mt-1">50%</p>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
}
