import React, { useState } from 'react';
import { Wifi, Signal, Activity, Clock, Shield, Power, CalendarClock, PenLine, Terminal, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';

export function OnuRemoteManagement() {
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [mockCustomers] = useState([
    { id: 'CUST-001', name: 'Budi Santoso', onuMac: 'E0:67:B3:22:98:A1', status: 'Online', rxPower: '-18.5 dBm', lastSeen: 'Sedang Aktif', ssid: 'Budi_Home_Net', wpaKey: 'rahasia123', ipAddress: '10.10.1.15', plan: 'Home 50 Mbps' },
    { id: 'CUST-002', name: 'Siti Aminah', onuMac: 'E0:67:B3:22:11:C4', status: 'Offline', rxPower: 'N/A', lastSeen: '2 jam yang lalu', ssid: 'Aminah_Kost', wpaKey: 'kostceria99', ipAddress: 'N/A', plan: 'Home 100 Mbps' },
    { id: 'CUST-003', name: 'PT Sejahtera Nusantara', onuMac: 'E0:67:B3:44:55:D1', status: 'Online', rxPower: '-21.2 dBm', lastSeen: 'Sedang Aktif', ssid: 'Sejahtera_Office_5G', wpaKey: 'karyawan2024', ipAddress: '10.10.1.42', plan: 'Bisnis 200 Mbps' },
  ]);

  const [ssid, setSsid] = useState('');
  const [wpaKey, setWpaKey] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [logEntries, setLogEntries] = useState([
    { id: 1, time: '2024-05-12 10:30', user: 'Admin', action: 'Update SSID', details: 'SSID diubah menjadi Budi_Home_Net', status: 'Success' },
    { id: 2, time: '2024-04-01 14:15', user: 'System', action: 'Auto Rotate Password', details: 'Password dirotasi rutin bulanan', status: 'Success' },
  ]);

  const [autoRotate, setAutoRotate] = useState(false);

  const filteredCustomers = mockCustomers.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectCustomer = (c: any) => {
    setSelectedCustomer(c);
    setSsid(c.ssid);
    setWpaKey(c.wpaKey);
  };

  const handleUpdateWifi = (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    setTimeout(() => {
      setIsUpdating(false);
      setLogEntries([{
        id: Date.now(),
        time: new Date().toLocaleString(),
        user: 'Admin',
        action: 'Update Wi-Fi',
        details: `SSID: ${ssid}, WPA Key diubah`,
        status: 'Success'
      }, ...logEntries]);
      if(selectedCustomer) {
        selectedCustomer.ssid = ssid;
        selectedCustomer.wpaKey = wpaKey;
      }
      alert('Pengaturan Wi-Fi berhasil diterapkan ke ONU (C-Data OLT)!');
    }, 1500);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Wifi className="text-primary-600" />
            Remote Management ONU
          </h1>
          <p className="text-sm text-slate-500 mt-1">Kelola Wi-Fi (SSID & Password) dan jadwal rotasi otomatis pelanggan di C-Data OLT.</p>
        </div>
      </div>

      <div className="flex gap-6 flex-1 min-h-0">
        {/* Customer List Sidebar */}
        <div className="w-80 flex flex-col bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden shrink-0">
          <div className="p-4 border-b border-slate-200 bg-slate-50">
            <input 
              type="text" 
              placeholder="Cari pelanggan..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            />
          </div>
          <div className="overflow-y-auto flex-1 p-2 space-y-1">
            {filteredCustomers.map(c => (
              <button 
                key={c.id} 
                onClick={() => handleSelectCustomer(c)}
                className={`w-full text-left p-3 rounded-lg transition-colors border ${selectedCustomer?.id === c.id ? 'bg-primary-50 border-primary-200' : 'bg-white border-transparent hover:bg-slate-50 border-b-slate-100'}`}
              >
                <div className="flex justify-between items-start mb-1">
                  <div className="font-semibold text-slate-800 text-sm">{c.name}</div>
                  <div className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${c.status === 'Online' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                    {c.status}
                  </div>
                </div>
                <div className="text-xs text-slate-500">{c.id}</div>
                <div className="text-xs text-slate-400 mt-1 font-mono">{c.onuMac}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Detail Panel */}
        <div className="flex-1 overflow-y-auto pr-2">
          {selectedCustomer ? (
            <div className="space-y-6">
              {/* Status Header */}
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
                <div className="flex items-center gap-4 mb-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${selectedCustomer.status === 'Online' ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
                    <Activity size={24} />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-slate-800">{selectedCustomer.name}</h2>
                    <div className="flex items-center gap-3 text-sm text-slate-500 mt-1 font-mono">
                      <span>{selectedCustomer.id}</span>
                      <span>•</span>
                      <span>{selectedCustomer.onuMac}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4 mt-6 border-t border-slate-100 pt-5">
                  <div>
                    <div className="text-xs text-slate-400 mb-1 flex items-center gap-1.5"><Signal size={14}/> RX Power</div>
                    <div className={`font-mono font-medium ${selectedCustomer.rxPower === 'N/A' ? 'text-slate-400' : 'text-primary-600'}`}>{selectedCustomer.rxPower}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 mb-1 flex items-center gap-1.5"><Power size={14}/> IP Address</div>
                    <div className="font-mono font-medium text-slate-700">{selectedCustomer.ipAddress}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 mb-1 flex items-center gap-1.5"><Clock size={14}/> Last Seen</div>
                    <div className="font-medium text-slate-700 text-sm">{selectedCustomer.lastSeen}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 mb-1 flex items-center gap-1.5"><Shield size={14}/> Paket</div>
                    <div className="font-medium text-slate-700 text-sm">{selectedCustomer.plan}</div>
                  </div>
                </div>
              </div>

              <div className="grid lg:grid-cols-2 gap-6">
                {/* Remote Actions */}
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-slate-200 bg-slate-50">
                    <h3 className="font-semibold text-slate-800 flex items-center gap-2"><PenLine size={16} className="text-primary-600"/> Pengaturan Wi-Fi (SSID)</h3>
                  </div>
                  <form onSubmit={handleUpdateWifi} className="p-5 space-y-4">
                    <div>
                      <label className="block text-sm text-slate-600 mb-1.5">Nama Wi-Fi (SSID)</label>
                      <input 
                        type="text" 
                        value={ssid}
                        onChange={e => setSsid(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-600 mb-1.5">Kata Sandi (WPA2-PSK)</label>
                      <input 
                        type="text" 
                        value={wpaKey}
                        onChange={e => setWpaKey(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 font-mono"
                        required
                        minLength={8}
                      />
                    </div>
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Terminal size={14} className="text-slate-400"/>
                        <span className="text-[10px] text-slate-400 font-mono">Compatible with C-Data OLT</span>
                      </div>
                      <button 
                        type="submit" 
                        disabled={isUpdating}
                        className="bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                      >
                        {isUpdating ? <RefreshCw size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                        Terapkan ke ONU
                      </button>
                    </div>
                  </form>
                </div>

                {/* Auto Rotate features & Logs */}
                <div className="space-y-6">
                  <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
                     <h3 className="font-semibold text-slate-800 flex items-center gap-2 mb-4"><CalendarClock size={16} className="text-amber-500"/> Jadwal Ganti Password Otomatis</h3>
                     <p className="text-xs text-slate-500 mb-4 leading-relaxed">Aktifkan fitur rotasi otomatis agar kata sandi Wi-Fi pelanggan diganti setiap bulan secara otomatis untuk menjaga keamanan jaringan dan memastikan pembayaran berlangganan berjalan lancar.</p>
                     
                     <label className="flex items-center gap-3 cursor-pointer p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                        <div className={`relative inline-flex h-5 w-9 shrink-0 items-center justify-center rounded-full transition-colors duration-200 ease-in-out ${autoRotate ? 'bg-amber-500' : 'bg-slate-300'}`}>
                          <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${autoRotate ? 'translate-x-2' : '-translate-x-2'}`} />
                        </div>
                        <span className="text-sm font-medium text-slate-700">Aktifkan Rotasi Bulanan</span>
                     </label>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col h-48">
                    <div className="p-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                       <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Log Perubahan</h3>
                    </div>
                    <div className="p-0 overflow-y-auto flex-1">
                       <div className="divide-y divide-slate-100">
                          {logEntries.map(log => (
                            <div key={log.id} className="p-3 hover:bg-slate-50">
                               <div className="flex justify-between items-start mb-1">
                                  <span className="text-xs font-medium text-slate-700">{log.action}</span>
                                  <span className="text-[10px] text-slate-400 font-mono">{log.time}</span>
                               </div>
                               <p className="text-[11px] text-slate-500">{log.details}</p>
                               <div className="text-[10px] text-slate-400 mt-1">Oleh: {log.user}</div>
                            </div>
                          ))}
                       </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50 rounded-xl border border-slate-200 border-dashed">
              <Wifi size={48} className="text-slate-300 mb-4" />
              <p>Pilih pelanggan untuk mengelola ONU</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
