import React, { useState } from 'react';
import { Server, Activity, Power, PowerOff, Settings, Zap, Users, AlertCircle, RefreshCw, CheckCircle2, Wifi } from 'lucide-react';

interface OltDevice {
  id: string;
  name: string;
  ip: string;
  model: string;
  status: 'online' | 'offline' | 'warning';
  uptime: string;
  cpu: number;
  memory: number;
  temperature: number;
  totalPonPorts: number;
  activeOnus: number;
  firmwareVersion: string;
}

const mockOlts: OltDevice[] = [
  {
    id: 'OLT-01',
    name: 'OLT Core HQ',
    ip: '10.0.0.10',
    model: 'ZTE C320',
    status: 'online',
    uptime: '45d 12h',
    cpu: 32,
    memory: 45,
    temperature: 42,
    totalPonPorts: 16,
    activeOnus: 245,
    firmwareVersion: 'V2.1.0'
  },
  {
    id: 'OLT-02',
    name: 'OLT Dist 1',
    ip: '10.0.0.11',
    model: 'Huawei MA5800',
    status: 'warning',
    uptime: '12d 5h',
    cpu: 68,
    memory: 72,
    temperature: 55,
    totalPonPorts: 8,
    activeOnus: 112,
    firmwareVersion: 'R019'
  },
  {
    id: 'OLT-03',
    name: 'OLT Dist 2',
    ip: '10.0.0.12',
    model: 'C-Data FD1616SN',
    status: 'offline',
    uptime: '0h 0m',
    cpu: 0,
    memory: 0,
    temperature: 0,
    totalPonPorts: 16,
    activeOnus: 0,
    firmwareVersion: 'V1.3.2'
  }
];

export function OltManagement() {
  const [olts, setOlts] = useState<OltDevice[]>(mockOlts);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedOlt, setSelectedOlt] = useState<OltDevice | null>(null);
  const [showRebootConfirm, setShowRebootConfirm] = useState(false);
  const [isRebooting, setIsRebooting] = useState(false);
  const [notification, setNotification] = useState<{message: string, type: 'success'|'error'} | null>(null);

  const [wifiSsid, setWifiSsid] = useState('');
  const [wifiPassword, setWifiPassword] = useState('');
  const [isApplyingWifi, setIsApplyingWifi] = useState(false);
  const [wifiError, setWifiError] = useState('');

  const handleApplyWifi = () => {
    setWifiError('');
    if (!wifiSsid || wifiSsid.length < 3) {
      setWifiError('SSID harus terdiri dari minimal 3 karakter.');
      return;
    }
    if (!wifiPassword || wifiPassword.length < 8) {
      setWifiError('Password harus terdiri dari minimal 8 karakter.');
      return;
    }

    setIsApplyingWifi(true);
    setTimeout(() => {
      setIsApplyingWifi(false);
      setNotification({ message: 'Konfigurasi Wi-Fi OLT berhasil diterapkan.', type: 'success' });
      setTimeout(() => setNotification(null), 3000);
      setWifiSsid('');
      setWifiPassword('');
    }, 1500);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      setNotification({ message: 'Status OLT berhasil diperbarui!', type: 'success' });
      setTimeout(() => setNotification(null), 3000);
    }, 1500);
  };

  const handleRebootInit = () => {
    setShowRebootConfirm(true);
  };

  const confirmReboot = () => {
    setIsRebooting(true);
    setTimeout(() => {
      setIsRebooting(false);
      setShowRebootConfirm(false);
      setSelectedOlt(null);
      // Update the state to reflect offline status after reboot
      if (selectedOlt) {
        setOlts(prev => prev.map(o => o.id === selectedOlt.id ? { ...o, status: 'offline', uptime: '0h 0m' } : o));
      }
    }, 2500);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Server className="text-primary-600" />
            Manajemen OLT
          </h1>
          <p className="text-sm text-slate-500 mt-1">Kelola dan pantau perangkat OLT di jaringan Anda</p>
        </div>
        <button 
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition-colors disabled:opacity-50"
        >
          <RefreshCw size={18} className={isRefreshing ? "animate-spin" : ""} />
          {isRefreshing ? 'Memperbarui...' : 'Perbarui Status'}
        </button>
      </div>

      {notification && (
        <div className={`p-3 rounded-xl border flex items-center gap-3 animate-in fade-in ${notification.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600' : 'bg-rose-500/10 border-rose-500/20 text-rose-600'}`}>
          {notification.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <p className="text-sm font-medium">{notification.message}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {olts.map((olt) => (
          <div key={olt.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow">
            <div className={`h-1.5 w-full ${
              olt.status === 'online' ? 'bg-emerald-500' :
              olt.status === 'warning' ? 'bg-amber-500' : 'bg-rose-500'
            }`} />
            
            <div className="p-5 flex-1">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{olt.name}</h3>
                  <p className="text-sm text-slate-500 font-mono mt-0.5">{olt.ip}</p>
                </div>
                <div className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                  olt.status === 'online' ? 'bg-emerald-50 text-emerald-700' :
                  olt.status === 'warning' ? 'bg-amber-50 text-amber-700' :
                  'bg-rose-50 text-rose-700'
                }`}>
                  {olt.status === 'online' && <Power size={12} />}
                  {olt.status === 'warning' && <AlertCircle size={12} />}
                  {olt.status === 'offline' && <PowerOff size={12} />}
                  {olt.status}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-5">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="text-[10px] uppercase font-bold text-slate-400 mb-1 flex items-center gap-1"><Activity size={12} /> CPU Usage</div>
                  <div className="text-lg font-bold text-slate-700">{olt.cpu}%</div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full mt-1.5 overflow-hidden">
                    <div className={`h-full rounded-full ${olt.cpu > 80 ? 'bg-rose-500' : olt.cpu > 60 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${olt.cpu}%` }}></div>
                  </div>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="text-[10px] uppercase font-bold text-slate-400 mb-1 flex items-center gap-1"><Zap size={12} /> Memory</div>
                  <div className="text-lg font-bold text-slate-700">{olt.memory}%</div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full mt-1.5 overflow-hidden">
                    <div className={`h-full rounded-full ${olt.memory > 80 ? 'bg-rose-500' : olt.memory > 60 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${olt.memory}%` }}></div>
                  </div>
                </div>
              </div>

              <div className="space-y-2 mb-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Model</span>
                  <span className="font-semibold text-slate-900">{olt.model}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Uptime</span>
                  <span className="font-semibold text-slate-900">{olt.uptime}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Total PON Ports</span>
                  <span className="font-semibold text-slate-900">{olt.totalPonPorts} Ports</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Active ONUs</span>
                  <span className="font-semibold text-slate-900 flex items-center gap-1.5"><Users size={14} className="text-primary-500" /> {olt.activeOnus}</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-3">
              <button 
                onClick={() => setSelectedOlt(olt)}
                className="flex-1 py-2 bg-white border border-slate-200 hover:bg-slate-100 hover:border-slate-300 rounded-lg text-sm font-semibold text-slate-700 transition-colors flex items-center justify-center gap-2"
              >
                <Settings size={16} /> Konfigurasi
              </button>
            </div>
          </div>
        ))}
      </div>

      {selectedOlt && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-100 text-primary-600 rounded-lg">
                  <Server size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900">{selectedOlt.name}</h3>
                  <p className="text-xs text-slate-500 font-mono">{selectedOlt.ip} • {selectedOlt.model}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedOlt(null)}
                className="p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 rounded-xl transition-colors"
              >
                <AlertCircle size={20} className="rotate-45" /> {/* Use as X icon if close not imported */}
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1 custom-scrollbar space-y-6">
              <div className="bg-blue-50 text-blue-800 p-4 rounded-xl text-sm flex gap-3">
                <AlertCircle size={20} className="shrink-0 text-blue-600" />
                <p>Ini adalah tampilan simulasi manajemen OLT. Untuk menghubungkan ke OLT yang sebenarnya, Anda memerlukan bridge backend yang berkomunikasi via Telnet/SSH/SNMP.</p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-2"><Activity size={18} /> Port PON Status</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {Array.from({ length: selectedOlt.totalPonPorts }).map((_, i) => {
                    // Mock random status logic based on index
                    const status = i < selectedOlt.totalPonPorts * 0.7 ? 'active' : (i % 3 === 0 ? 'down' : 'unused');
                    const onuscount = status === 'active' ? Math.floor(Math.random() * 30) + 5 : 0;
                    
                    return (
                      <div key={i} className={`p-3 rounded-xl border ${status === 'active' ? 'border-emerald-200 bg-emerald-50' : status === 'down' ? 'border-rose-200 bg-rose-50' : 'border-slate-200 bg-slate-50'}`}>
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-mono text-xs font-bold text-slate-700">PON {i + 1}</span>
                          <div className={`w-2 h-2 rounded-full ${status === 'active' ? 'bg-emerald-500' : status === 'down' ? 'bg-rose-500' : 'bg-slate-300'}`} />
                        </div>
                        <div className="text-[10px] text-slate-500 uppercase font-semibold">
                          {status === 'active' ? `${onuscount} ONUs` : status === 'down' ? 'LOS' : 'Unused'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-2"><Wifi size={18} /> Konfigurasi SSID & Password Wi-Fi</h4>
                <p className="text-xs text-slate-500 mb-4">Konfigurasi nama Wi-Fi (SSID) dan kata sandi untuk perangkat di bawah OLT ini.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Wi-Fi (SSID)</label>
                    <input 
                      type="text" 
                      value={wifiSsid}
                      onChange={(e) => setWifiSsid(e.target.value)}
                      placeholder="Masukkan nama Wi-Fi..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:ring-1 focus:ring-primary-600 focus:outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Kata Sandi (Password)</label>
                    <input 
                      type="text" 
                      value={wifiPassword}
                      onChange={(e) => setWifiPassword(e.target.value)}
                      placeholder="Minimal 8 karakter..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:ring-1 focus:ring-primary-600 focus:outline-none transition-all"
                    />
                  </div>
                </div>
                {wifiError && <div className="mt-2 text-xs text-rose-500 font-medium">{wifiError}</div>}
                <div className="flex justify-end mt-4">
                  <button 
                    onClick={handleApplyWifi}
                    disabled={isApplyingWifi}
                    className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    {isApplyingWifi ? <><RefreshCw size={16} className="animate-spin" /> Memproses...</> : 'Terapkan'}
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center shrink-0">
              <button 
                onClick={handleRebootInit}
                className="px-4 py-2 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2"
              >
                <Power size={16} /> Reboot OLT
              </button>
              <button 
                onClick={() => setSelectedOlt(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-sm font-semibold transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reboot Confirmation Modal */}
      {showRebootConfirm && (
        <div className="fixed inset-0 z-[60] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-5 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
                <Power size={24} />
              </div>
              <h3 className="font-bold text-lg text-slate-900 mb-2">Konfirmasi Reboot</h3>
              <p className="text-sm text-slate-500 mb-6">
                Apakah Anda yakin ingin melakukan reboot pada OLT <span className="font-semibold text-slate-800">{selectedOlt?.name}</span>? Koneksi semua ONT yang terhubung akan terputus sementara.
              </p>
              
              <div className="flex justify-center gap-3 w-full">
                <button 
                  onClick={() => setShowRebootConfirm(false)}
                  disabled={isRebooting}
                  className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition-colors disabled:opacity-50"
                >
                  Batal
                </button>
                <button 
                  onClick={confirmReboot}
                  disabled={isRebooting}
                  className="flex-1 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isRebooting ? (
                    <><RefreshCw size={16} className="animate-spin" /> Proses...</>
                  ) : (
                    'Ya, Reboot'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
