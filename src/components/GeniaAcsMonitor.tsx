import React, { useState, useEffect } from 'react';
import { Server, Wifi, Activity, Smartphone, RefreshCw, Layers, ShieldCheck, Cpu } from 'lucide-react';

interface AcsDevice {
  id: string;
  mac: string;
  model: string;
  ip: string;
  status: string;
  uptime: string;
  firmware: string;
}

export function GeniaAcsMonitor() {
  const [devices, setDevices] = useState<AcsDevice[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<AcsDevice | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{message: string, type: 'success'|'error'} | null>(null);

  const fetchDevices = async () => {
    setIsRefreshing(true);
    setError(null);
    try {
      const response = await fetch('/api/geniaacs/devices');
      if (!response.ok) {
        throw new Error('Failed to fetch devices from GeniaACS API');
      }
      const data = await response.json();
      setDevices(data.devices || []);
      
      // Update selected device if it exists
      if (selectedDevice) {
        const updated = (data.devices || []).find((d: AcsDevice) => d.id === selectedDevice.id);
        if (updated) setSelectedDevice(updated);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error fetching devices');
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDevices();
    
    // Simulate real-time TR-069 status changes arriving via WebHook or Polling
    const interval = setInterval(() => {
      setDevices(prevDevices => {
        if (prevDevices.length === 0) return prevDevices;
        
        // Very low chance (5%) every 5 seconds to randomly change a device's status for demo purposes
        if (Math.random() < 0.05) {
          const newDevices = [...prevDevices];
          const randomIndex = Math.floor(Math.random() * newDevices.length);
          const device = {...newDevices[randomIndex]};
          
          const possibleStatuses = ['offline', 'error', 'online'];
          const newStatus = possibleStatuses.filter(s => s !== device.status)[Math.floor(Math.random() * 2)];
          
          device.status = newStatus;
          newDevices[randomIndex] = device;
          
          // Send WA Notification
          alert(`[WhatsApp API - Auto Notification]\n\nDari (Sender): 082124812114\nKe (Admin): 082124812114\n\n⚠️ UPDATE STATUS ACS\nDevice ID: ${device.id}\nModel: ${device.model}\nStatus: ${newStatus.toUpperCase()}\n\nSilakan cek dashboard ACS. Parameter perangkat mungkin memerlukan penyesuaian.`);
          
          return newDevices;
        }
        return prevDevices;
      });
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    fetchDevices();
  };

  const simulateWebhookStatusChange = () => {
    if (devices.length === 0) return;
    
    setDevices(prevDevices => {
      const newDevices = [...prevDevices];
      // Pick a random device
      const randomIndex = Math.floor(Math.random() * newDevices.length);
      const device = {...newDevices[randomIndex]};
      
      const possibleStatuses = ['offline', 'error'];
      // Ensure we pick something different
      const newStatus = possibleStatuses.includes(device.status) ? (device.status === 'error' ? 'offline' : 'error') : possibleStatuses[Math.floor(Math.random() * possibleStatuses.length)];
      
      device.status = newStatus;
      newDevices[randomIndex] = device;
      
      // Update selected if it's the same
      if (selectedDevice && selectedDevice.id === device.id) {
        setSelectedDevice(device);
      }

      alert(`[WhatsApp API - Auto Notification]\n\nDari (Sender): 082124812114\nKe (Admin): 082124812114\n\n⚠️ UPDATE STATUS ACS (MOCK)\nDevice ID: ${device.id}\nModel: ${device.model}\nStatus: ${newStatus.toUpperCase()}\n\nSilakan cek dashboard ACS. Parameter perangkat mungkin memerlukan penyesuaian.`);
      
      return newDevices;
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-3xl p-5 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total CPE</h3>
            <div className="p-2 rounded-xl bg-primary-600 text-white">
              <Server size={18} />
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-bold text-slate-900">1,245</h3>
            <p className="text-[10px] mt-1 font-mono uppercase tracking-widest text-emerald-600">+12 minggu ini</p>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-3xl p-5 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">CPE Online (TR-069)</h3>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
              <Activity size={18} />
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-bold text-slate-900">1,180</h3>
            <p className="text-[10px] mt-1 font-mono uppercase tracking-widest text-slate-400">94.7% terhubung</p>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-3xl p-5 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">WLAN Aktif</h3>
            <div className="p-2 rounded-xl bg-violet-500/10 text-violet-400">
              <Wifi size={18} />
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-bold text-slate-900">1,150</h3>
            <p className="text-[10px] mt-1 font-mono uppercase tracking-widest text-slate-400">Rata-rata 2.4G/5G</p>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-3xl p-5 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Gagal Sync</h3>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600">
              <RefreshCw size={18} />
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-bold text-slate-900 text-rose-600">24</h3>
            <p className="text-[10px] mt-1 font-mono uppercase tracking-widest text-slate-500">Perlu rekonfigurasi</p>
          </div>
        </div>
      </div>

      {notification && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 animate-in fade-in ${notification.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600' : 'bg-rose-500/10 border-rose-500/20 text-rose-600'}`}>
          <ShieldCheck size={20} />
          <p className="text-sm font-semibold">{notification.message}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Device List */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl overflow-hidden flex flex-col h-[500px]">
          <div className="p-4 border-b border-slate-200 bg-white/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="text-primary-600" size={18} />
              <h2 className="text-sm font-semibold text-slate-900">Autoconfiguration Server (ACS) - CPE List</h2>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => {
                  setNotification({ message: "Berhasil! Perintah update telah diantrekan ke semua perangkat ACS.", type: 'success' });
                  setTimeout(() => setNotification(null), 3000);
                }}
                className="text-[10px] font-semibold text-white bg-primary-600 hover:bg-primary-700 px-3 py-1.5 rounded-lg shadow-md shadow-primary-600/20 transition-colors uppercase tracking-widest hidden sm:block"
                title="Update Semua ACS"
              >
                Update Semua
              </button>
              <button 
                onClick={simulateWebhookStatusChange}
                className="text-[10px] font-semibold text-slate-400 hover:text-primary-600 bg-white hover:bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-300 transition-colors uppercase tracking-widest hidden sm:block"
                title="Simulasi Notifikasi WA (Status Change)"
              >
                Test Notif WA
              </button>
              <button 
                onClick={handleRefresh}
                className={`p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-700/10 rounded-lg transition-all ${isRefreshing ? 'animate-spin text-primary-600' : ''}`}
                title="Refresh ACS"
              >
                <RefreshCw size={16} />
              </button>
            </div>
          </div>
          
          {error && (
            <div className="p-4 bg-rose-500/10 border-b border-rose-500/20 text-rose-600 text-xs font-semibold">
              Error: {error}
            </div>
          )}

          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-white/30">
                  <th className="p-4 pl-6 text-[10px] font-mono text-slate-500 tracking-wider uppercase">Device ID / Model</th>
                  <th className="p-4 text-[10px] font-mono text-slate-500 tracking-wider uppercase">MAC Address</th>
                  <th className="p-4 text-[10px] font-mono text-slate-500 tracking-wider uppercase">IP Management</th>
                  <th className="p-4 text-[10px] font-mono text-slate-500 tracking-wider uppercase">Status</th>
                  <th className="p-4 text-[10px] font-mono text-slate-500 tracking-wider uppercase text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {devices.map((device) => (
                  <tr 
                    key={device.id} 
                    className="border-b border-slate-200 hover:bg-white/20 transition-colors group cursor-pointer"
                    onClick={() => setSelectedDevice(device)}
                  >
                    <td className="p-4 pl-6">
                      <p className="text-xs font-semibold text-slate-800">{device.id}</p>
                      <p className="text-[10px] font-mono text-primary-600 mt-0.5">{device.model}</p>
                    </td>
                    <td className="p-4">
                      <p className="text-xs font-mono text-slate-700">{device.mac}</p>
                    </td>
                    <td className="p-4">
                      <p className="text-xs font-mono text-slate-400">{device.ip}</p>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold font-mono tracking-wider ${
                        device.status === 'online' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-white text-slate-500 border border-slate-300'
                      }`}>
                        {device.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button className="text-[10px] font-semibold tracking-wider text-primary-600 hover:text-primary-700 bg-primary-600/10 hover:bg-primary-700/20 px-3 py-1.5 rounded transition-colors uppercase">
                        Diagnose
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Device Detail Panel */}
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden flex flex-col h-[500px]">
          <div className="p-4 border-b border-slate-200 bg-white/50 flex items-center gap-2">
            <Smartphone className="text-emerald-600" size={18} />
            <h2 className="text-sm font-semibold text-slate-900">CPE Details & Provisioning</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {selectedDevice ? (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-slate-900 font-mono">{selectedDevice.id}</h3>
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono tracking-wider ${selectedDevice.status === 'online' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-white text-slate-500'}`}>
                      {selectedDevice.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-50 border border-slate-200/50 p-2.5 rounded-xl">
                      <p className="text-[9px] text-slate-500 uppercase tracking-widest font-semibold mb-1 hover:text-slate-400">Model</p>
                      <p className="text-xs text-slate-700 font-mono tracking-wide">{selectedDevice.model}</p>
                    </div>
                    <div className="bg-slate-50 border border-slate-200/50 p-2.5 rounded-xl">
                      <p className="text-[9px] text-slate-500 uppercase tracking-widest font-semibold mb-1 hover:text-slate-400">MAC</p>
                      <p className="text-xs text-slate-700 font-mono tracking-wide">{selectedDevice.mac}</p>
                    </div>
                    <div className="bg-slate-50 border border-slate-200/50 p-2.5 rounded-xl">
                      <p className="text-[9px] text-slate-500 uppercase tracking-widest font-semibold mb-1 hover:text-slate-400">Firmware</p>
                      <p className="text-xs text-slate-700 font-mono tracking-wide">{selectedDevice.firmware}</p>
                    </div>
                    <div className="bg-slate-50 border border-slate-200/50 p-2.5 rounded-xl">
                      <p className="text-[9px] text-slate-500 uppercase tracking-widest font-semibold mb-1 hover:text-slate-400">Uptime</p>
                      <p className="text-xs text-slate-700 font-mono tracking-wide">{selectedDevice.uptime}</p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                     <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                       <Activity size={14} /> Device Diagnosis & TR-069
                     </h4>
                     <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-2">
                        <div className="flex justify-between items-center text-xs">
                           <span className="text-slate-500 font-mono">Data Terakhir (Last Inform)</span>
                           <span className="font-mono text-slate-700 font-medium whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px]" title={new Date().toLocaleString()}>Baru saja</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                           <span className="text-slate-500 font-mono">Optical Rx Power</span>
                           <span className="font-mono text-emerald-600 font-bold">-22.5 dBm</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                           <span className="text-slate-500 font-mono">Optical Tx Power</span>
                           <span className="font-mono text-primary-600 font-bold">2.1 dBm</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                           <span className="text-slate-500 font-mono">PPPoE Status</span>
                           <span className="font-mono text-emerald-600 font-bold text-right" title="Username: user@isp">Connected</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                           <span className="text-slate-500 font-mono">WAN IP Address</span>
                           <span className="font-mono text-slate-700">{selectedDevice.ip}</span>
                        </div>
                     </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Wifi size={14} /> Wi-Fi Parameters
                    </h4>
                    <div className="space-y-2">
                      <div>
                        <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1">SSID</label>
                        <input 
                          type="text" 
                          id="acs-ssid-input"
                          defaultValue={`WIFI_${selectedDevice.id}`} 
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-1 focus:ring-primary-600 focus:outline-none transition-all font-mono" 
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1">Password</label>
                        <div className="flex gap-2">
                           <input 
                             type="password" 
                             id="acs-pwd-input"
                             defaultValue="secretpassword123" 
                             className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-1 focus:ring-primary-600 focus:outline-none transition-all font-mono" 
                           />
                           <button 
                             onClick={() => {
                               const el = document.getElementById('acs-pwd-input') as HTMLInputElement;
                               if (el) el.value = Math.random().toString(36).slice(-8);
                             }}
                             className="bg-white hover:bg-slate-50 text-primary-600 px-3 rounded-xl border border-slate-300 transition-colors text-xs font-semibold"
                           >
                             Generate
                           </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2 pt-2 border-t border-slate-100">
                      <Server size={14} /> PPPoE Config
                    </h4>
                    <div className="space-y-2">
                      <div>
                        <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1">PPPoE Username</label>
                        <input 
                          type="text" 
                          id="acs-pppoe-user-input"
                          defaultValue={`user_${selectedDevice.id.toLowerCase()}@ispkita`} 
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-1 focus:ring-primary-600 focus:outline-none transition-all font-mono" 
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1">PPPoE Password</label>
                        <input 
                          type="password" 
                          id="acs-pppoe-pwd-input"
                          defaultValue="pppoepassword!" 
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-1 focus:ring-primary-600 focus:outline-none transition-all font-mono" 
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                   <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <ShieldCheck size={14} /> TR-069 Parameters (RPC)
                  </h4>
                  <div className="flex gap-2 mb-2">
                    <button 
                      onClick={() => {
                        setNotification({ message: `Merefresh parameter dari perangkat ${selectedDevice.id}...`, type: 'success' });
                        setTimeout(() => setNotification(null), 3000);
                      }}
                      className="flex-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 border border-emerald-500/20 px-3 py-2 rounded-xl text-[10px] font-semibold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5"
                    >
                      <RefreshCw size={12} /> Sync Device
                    </button>
                    <button 
                      onClick={() => {
                        if(confirm(`Apakah Anda yakin ingin melakukan reboot modem ONT (${selectedDevice.id})? Koneksi internet akan terputus sesaat.`)) {
                          setNotification({ message: `Berhasil! Perintah reboot telah dikirim ke perangkat ${selectedDevice.id}.`, type: 'success' });
                          setTimeout(() => setNotification(null), 3000);
                        }
                      }}
                      className="flex-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 border border-amber-500/20 px-3 py-2 rounded-xl text-[10px] font-semibold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Cpu size={12} /> Reboot Modem
                    </button>
                  </div>
                  <button 
                    onClick={() => {
                      const ssid = (document.getElementById('acs-ssid-input') as HTMLInputElement)?.value;
                      const pwd = (document.getElementById('acs-pwd-input') as HTMLInputElement)?.value;
                      const pppoeUser = (document.getElementById('acs-pppoe-user-input') as HTMLInputElement)?.value;
                      
                      setNotification({ message: `Config applied to ${selectedDevice.id} (SSID: ${ssid}, User: ${pppoeUser})`, type: 'success' });
                      setTimeout(() => setNotification(null), 4000);
                    }}
                    className="w-full bg-primary-600 hover:bg-primary-700 text-white rounded-xl px-3 py-2.5 text-xs font-semibold tracking-wide transition-colors shadow-lg shadow-primary-600/20"
                  >
                     Apply & Push Config
                  </button>
                </div>

              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                <Smartphone size={48} className="text-slate-400 mb-4" />
                <p className="text-sm font-semibold text-slate-700">Pilih Device</p>
                <p className="text-xs text-slate-500 mt-1 max-w-[200px]">Klik pada salah satu row CPE di tabel untuk melihat detail dan melakukan provisioning TR-069.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
