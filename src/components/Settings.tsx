import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle2, Copy, ServerCog, Plus, Trash2 } from 'lucide-react';
import { useTenant } from '../contexts/TenantContext';
import { getInternetPackages, saveInternetPackages, InternetPackage } from '../lib/packages';

interface SettingsProps {
  isWaBillingEnabled?: boolean;
  setIsWaBillingEnabled?: (val: boolean) => void;
}

export function Settings({ isWaBillingEnabled = true, setIsWaBillingEnabled }: SettingsProps) {
  const { tenantId, branding, setBranding } = useTenant();
  
  const [logoUrl, setLogoUrl] = useState(branding?.logoUrl || '');
  const [businessName, setBusinessName] = useState(branding?.businessName || 'Dream Paymanager');
  const [primaryColorHex, setPrimaryColorHex] = useState(branding?.primaryColorHex || '#ea580c');
  const [packages, setPackages] = useState<InternetPackage[]>(branding?.packages || getInternetPackages());

  const [midtransServerKey, setMidtransServerKey] = useState(() => localStorage.getItem('midtransServerKey') || 'SB-Mid-server-XXXXX');
  const [midtransClientKey, setMidtransClientKey] = useState(() => localStorage.getItem('midtransClientKey') || 'SB-Mid-client-XXXXX');
  const [qrisStaticPayload, setQrisStaticPayload] = useState(() => localStorage.getItem('qrisStaticPayload') || '');
  const [waGatewayProvider, setWaGatewayProvider] = useState(() => localStorage.getItem('waGatewayProvider') || 'fonnte');
  const [waGatewayToken, setWaGatewayToken] = useState(() => localStorage.getItem('waGatewayToken') || '');
  const [mikrotikIp, setMikrotikIp] = useState(() => localStorage.getItem('mikrotikIp') || '192.168.1.1');
  const [mikrotikPort, setMikrotikPort] = useState(() => localStorage.getItem('mikrotikPort') || '8728');
  const [mikrotikUsername, setMikrotikUsername] = useState(() => localStorage.getItem('mikrotikUsername') || 'api_user');
  const [mikrotikPassword, setMikrotikPassword] = useState(() => localStorage.getItem('mikrotikPassword') || '********');
  const [useVpnTunnel, setUseVpnTunnel] = useState(() => localStorage.getItem('useVpnTunnel') === 'true');
  const [vpnHost, setVpnHost] = useState(() => localStorage.getItem('vpnHost') || '');
  const [vpnPort, setVpnPort] = useState(() => localStorage.getItem('vpnPort') || '');
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [connectionMessage, setConnectionMessage] = useState<string | null>(null);
  
  const [snmpIp, setSnmpIp] = useState('');
  const [snmpCommunity, setSnmpCommunity] = useState('public');
  const [snmpDevices, setSnmpDevices] = useState<{ip: string, community: string}[]>(() => {
    try {
      const stored = localStorage.getItem('snmpDevices');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [settingsSuccess, setSettingsSuccess] = useState<string | null>(null);
  const [showSettingsConfirm, setShowSettingsConfirm] = useState(false);
  const [showScriptModal, setShowScriptModal] = useState(false);

  const handleAddSnmpDevice = () => {
    if (!snmpIp.trim() || !snmpCommunity.trim()) {
      alert('Harap isi IP Address dan Community String.');
      return;
    }
    const newDevice = { ip: snmpIp.trim(), community: snmpCommunity.trim() };
    const updatedDevices = [...snmpDevices, newDevice];
    setSnmpDevices(updatedDevices);
    localStorage.setItem('snmpDevices', JSON.stringify(updatedDevices));
    setSnmpIp('');
    setSnmpCommunity('public');
  };

  const handleRemoveSnmpDevice = (index: number) => {
    const updatedDevices = snmpDevices.filter((_, i) => i !== index);
    setSnmpDevices(updatedDevices);
    localStorage.setItem('snmpDevices', JSON.stringify(updatedDevices));
  };

  const handleTestConnection = () => {
    setConnectionStatus('testing');
    setConnectionMessage(null);

    // Basic validation
    if (!mikrotikIp.trim() || !mikrotikPort.trim() || !mikrotikUsername.trim() || !mikrotikPassword.trim()) {
      setConnectionStatus('error');
      setConnectionMessage('Semua field konfigurasi MikroTik harus diisi.');
      return;
    }

    if (useVpnTunnel) {
      if (!vpnHost.trim() || !vpnPort.trim()) {
        setConnectionStatus('error');
        setConnectionMessage('Host dan Port VPN/Tunnel harus diisi jika fitur diaktifkan.');
        return;
      }
    }

    if (!/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(mikrotikIp)) {
      setConnectionStatus('error');
      setConnectionMessage('Format IP Address MikroTik tidak valid.');
      return;
    }

    if (isNaN(Number(mikrotikPort)) || Number(mikrotikPort) <= 0 || Number(mikrotikPort) > 65535) {
      setConnectionStatus('error');
      setConnectionMessage('API Port MikroTik tidak valid (harus berupa angka 1-65535).');
      return;
    }

    // Simulate connection testing
    setTimeout(() => {
      if (mikrotikUsername === 'admin' && mikrotikPassword === 'wrong') {
        setConnectionStatus('error');
        setConnectionMessage('Koneksi gagal: Username atau Password salah.');
      } else {
        setConnectionStatus('success');
        setConnectionMessage('Koneksi ke MikroTik berhasil! (Simulated)');
      }
      setTimeout(() => {
        setConnectionStatus('idle');
        setConnectionMessage(null);
      }, 3000);
    }, 1500);
  };

  const handleSaveSettings = () => {
    setShowSettingsConfirm(false);
    setSettingsError(null);
    setSettingsSuccess(null);

    // Validate settings
    if (!midtransServerKey.trim() || !midtransClientKey.trim()) {
      setSettingsError("Midtrans Server Key dan Client Key harus diisi.");
      return;
    }

    if (midtransServerKey.includes('XXXXX') || midtransServerKey.length < 20) {
      setSettingsError("Midtrans Server Key tidak valid.");
      return;
    }

    if (midtransClientKey.includes('XXXXX') || midtransClientKey.length < 20) {
      setSettingsError("Midtrans Client Key tidak valid.");
      return;
    }

    setTimeout(() => {
      localStorage.setItem('midtransServerKey', midtransServerKey);
      localStorage.setItem('midtransClientKey', midtransClientKey);
      localStorage.setItem('qrisStaticPayload', qrisStaticPayload);
      localStorage.setItem('waGatewayProvider', waGatewayProvider);
      localStorage.setItem('waGatewayToken', waGatewayToken);
      localStorage.setItem('mikrotikIp', mikrotikIp);
      localStorage.setItem('mikrotikPort', mikrotikPort);
      localStorage.setItem('mikrotikUsername', mikrotikUsername);
      localStorage.setItem('mikrotikPassword', mikrotikPassword);
      localStorage.setItem('useVpnTunnel', useVpnTunnel.toString());
      localStorage.setItem('vpnHost', vpnHost);
      localStorage.setItem('vpnPort', vpnPort);
      setSettingsSuccess("Konfigurasi berhasil disimpan dan diterapkan.");
      setTimeout(() => setSettingsSuccess(null), 3000);
    }, 500);
  };

  const [isSavingBranding, setIsSavingBranding] = useState(false);
  const handleSaveBranding = async () => {
    setIsSavingBranding(true);
    setSettingsError(null);
    setSettingsSuccess(null);
    try {
      const { doc, setDoc } = await import('firebase/firestore');
      const { db } = await import('../firebase');
      const newBranding = { logoUrl, businessName, primaryColorHex, packages };
      await setDoc(doc(db, 'branding', tenantId), newBranding);
      setBranding(newBranding);
      
      saveInternetPackages(packages);
      
      setSettingsSuccess("Pengaturan Bisnis dan Paket berhasil disimpan.");
      setTimeout(() => setSettingsSuccess(null), 3000);
    } catch (e: any) {
      setSettingsError("Gagal menyimpan pengaturan: " + e.message);
    } finally {
      setIsSavingBranding(false);
    }
  };

  const handleAddPackage = () => {
    setPackages([...packages, { name: '', price: 0, desc: '' }]);
  };

  const handleUpdatePackage = (index: number, key: keyof InternetPackage, value: any) => {
    const newPkgs = [...packages];
    newPkgs[index] = { ...newPkgs[index], [key]: value };
    setPackages(newPkgs);
  };

  const handleRemovePackage = (index: number) => {
    const newPkgs = packages.filter((_, i) => i !== index);
    setPackages(newPkgs);
  };

  const generateInstallScript = () => {
    return `/ip firewall filter add action=drop chain=input src-address-list=blacklisted
/ip service set api port=${mikrotikPort} disabled=no
/ip service set api-ssl disabled=yes`;
  }

  return (
    <>
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm mb-6">
        <div className="p-6 border-b border-slate-200 bg-white/50">
          <h2 className="text-sm font-semibold text-slate-400 tracking-wider uppercase">Pengaturan Toko / Bisnis</h2>
          <p className="text-[10px] text-slate-500 font-mono mt-1">Kustomisasi Branding Aplikasi (White-label)</p>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1.5">Nama Usaha</label>
              <input 
                type="text" 
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-900 focus:ring-1 focus:ring-primary-600 focus:border-primary-600 focus:outline-none transition-all" 
                placeholder="e.g. Dream Paymanager"
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1.5">Warna Tema (Hex Code)</label>
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <input 
                    type="color" 
                    value={primaryColorHex}
                    onChange={(e) => setPrimaryColorHex(e.target.value)}
                    className="w-10 h-10 rounded-lg cursor-pointer" 
                  />
                  <input 
                    type="text" 
                    value={primaryColorHex}
                    onChange={(e) => setPrimaryColorHex(e.target.value)}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-900 focus:ring-1 focus:ring-primary-600 focus:border-primary-600 focus:outline-none transition-all font-mono uppercase" 
                    placeholder="#ea580c"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    { name: 'Orange', hex: '#ea580c' },
                    { name: 'Blue', hex: '#2563eb' },
                    { name: 'Emerald', hex: '#10b981' },
                    { name: 'Violet', hex: '#8b5cf6' },
                    { name: 'Rose', hex: '#e11d48' },
                  ].map((preset) => (
                    <button
                      key={preset.hex}
                      type="button"
                      onClick={() => setPrimaryColorHex(preset.hex)}
                      className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${primaryColorHex === preset.hex ? 'border-slate-900 scale-110' : 'border-transparent'}`}
                      style={{ backgroundColor: preset.hex }}
                      title={preset.name}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1.5">URL Logo Bisnis (PNG/JPG)</label>
              <input 
                type="text" 
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-900 focus:ring-1 focus:ring-primary-600 focus:border-primary-600 focus:outline-none transition-all" 
                placeholder="https://example.com/logo.png"
              />
            </div>

            <div className="md:col-span-2 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between mb-4">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">Katalog Layanan Internet</label>
                <button
                  type="button"
                  onClick={handleAddPackage}
                  className="px-3 py-1.5 bg-primary-50 text-primary-700 hover:bg-primary-100 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                  <Plus size={14} /> Tambah Paket
                </button>
              </div>
              
              <div className="space-y-3">
                {packages.map((pkg, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl relative group">
                    <div className="flex-1 space-y-3">
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] text-slate-400 font-mono uppercase tracking-widest mb-1">Nama Paket</label>
                            <input type="text" value={pkg.name} onChange={e => handleUpdatePackage(idx, 'name', e.target.value)} placeholder="Misal: 50 Mbps" className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-primary-500" />
                          </div>
                          <div>
                            <label className="block text-[10px] text-slate-400 font-mono uppercase tracking-widest mb-1">Harga (Rp)</label>
                            <input type="number" value={pkg.price} onChange={e => handleUpdatePackage(idx, 'price', Number(e.target.value))} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-primary-500" />
                          </div>
                       </div>
                       <div>
                          <label className="block text-[10px] text-slate-400 font-mono uppercase tracking-widest mb-1">Deskripsi Singkat</label>
                          <input type="text" value={pkg.desc} onChange={e => handleUpdatePackage(idx, 'desc', e.target.value)} placeholder="Misal: Gaming & Download ngebut" className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-[11px] outline-none focus:border-primary-500" />
                       </div>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => handleRemovePackage(idx)}
                      className="absolute right-2 top-2 p-2 text-rose-500 hover:bg-rose-50 rounded-lg sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                      title="Hapus paket"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                {packages.length === 0 && (
                  <p className="text-sm text-slate-500 text-center py-4 bg-slate-50 rounded-xl border border-slate-200 border-dashed">Belum ada paket yang ditambahkan.</p>
                )}
              </div>
            </div>
          </div>
          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button 
              onClick={handleSaveBranding}
              disabled={isSavingBranding}
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSavingBranding && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
              Simpan Branding
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-200 bg-white/50">
          <h2 className="text-sm font-semibold text-slate-400 tracking-wider uppercase">Pengaturan Sistem</h2>
          <p className="text-[10px] text-slate-500 font-mono mt-1">Konfigurasi API MikroTik dan Payment Gateway</p>
        </div>
        <div className="p-6 space-y-6">
          
          {/* Note about actual integration backend */}
          <div className="bg-primary-50 border border-primary-200 rounded-xl p-4 flex items-start gap-3">
            <div className="p-2 bg-primary-100 rounded-lg text-primary-600 mt-0.5">
              <ServerCog size={20} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-primary-900 mb-1">Integrasi Mikrotik / OLT (Segera Hadir)</h4>
              <p className="text-xs text-primary-800 leading-relaxed">
                Untuk mengintegrasikan status PPPoE dan Redaman ONT secara <strong>Real-time</strong>, sistem membutuhkan API atau akses backend khusus (misalnya API Mikrotik via IP Publik atau VPN, dan API management sistem OLT terkait seperti Cacti/SNMP). <br className="hidden sm:block" />
                Fitur ini membutuhkan informasi perangkat nyata dan server perantara (Node.js/Python backend) yang dapat diakses. Integrasi penuh bisa kita jadwalkan setelah Anda memiliki server API backend yang siap digunakan.
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-4">Koneksi Router (MikroTik API)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1.5">IP Address Router</label>
                <input 
                  type="text" 
                  value={mikrotikIp}
                  onChange={(e) => setMikrotikIp(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-900 focus:ring-1 focus:ring-primary-600 focus:border-primary-600 focus:outline-none transition-all font-mono" 
                  placeholder="e.g. 192.168.1.1"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1.5">API Port</label>
                <input 
                  type="text" 
                  value={mikrotikPort}
                  onChange={(e) => setMikrotikPort(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-900 focus:ring-1 focus:ring-primary-600 focus:border-primary-600 focus:outline-none transition-all font-mono" 
                  placeholder="e.g. 8728"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1.5">Username API</label>
                <input 
                  type="text" 
                  value={mikrotikUsername}
                  onChange={(e) => setMikrotikUsername(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-900 focus:ring-1 focus:ring-primary-600 focus:border-primary-600 focus:outline-none transition-all font-mono" 
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1.5">Password API</label>
                <input 
                  type="password" 
                  value={mikrotikPassword}
                  onChange={(e) => setMikrotikPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-900 focus:ring-1 focus:ring-primary-600 focus:border-primary-600 focus:outline-none transition-all font-mono" 
                />
              </div>
            </div>

            <div className="mt-4 border-t border-slate-100 pt-4">
              <label className="flex items-center gap-2 cursor-pointer mb-4">
                <input 
                  type="checkbox" 
                  checked={useVpnTunnel}
                  onChange={(e) => setUseVpnTunnel(e.target.checked)}
                  className="w-4 h-4 text-primary-600 bg-slate-100 border-slate-300 rounded focus:ring-primary-500 focus:ring-2"
                />
                <span className="text-sm font-medium text-slate-700">Gunakan VPN / Remote Tunnel</span>
              </label>

              {useVpnTunnel && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                  <div>
                    <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1.5">VPN Host / Remote Domain</label>
                    <input 
                      type="text" 
                      value={vpnHost}
                      onChange={(e) => setVpnHost(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-900 focus:ring-1 focus:ring-primary-600 focus:border-primary-600 focus:outline-none transition-all font-mono" 
                      placeholder="e.g. id1.tunnel.com"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1.5">VPN Port / Remote Port</label>
                    <input 
                      type="text" 
                      value={vpnPort}
                      onChange={(e) => setVpnPort(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-900 focus:ring-1 focus:ring-primary-600 focus:border-primary-600 focus:outline-none transition-all font-mono" 
                      placeholder="e.g. 50123"
                    />
                  </div>
                </div>
              )}
            </div>
            
            <div className="mt-5 flex items-center gap-3">
              <button 
                onClick={handleTestConnection}
                disabled={connectionStatus === 'testing'}
                className="bg-white hover:bg-slate-50 text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed px-5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-colors border border-slate-300 flex items-center justify-center gap-2"
              >
                {connectionStatus === 'testing' ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-600 border-t-transparent rounded-full animate-spin"></div>
                    Menguji Koneksi...
                  </>
                ) : (
                  'Test Koneksi'
                )}
              </button>
              <button 
                onClick={() => setShowScriptModal(true)}
                className="bg-primary-50 text-primary-700 hover:bg-primary-100 px-5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-colors border border-primary-200 flex items-center justify-center gap-2"
              >
                Generate Script MikroTik
              </button>
            </div>
            
            {connectionMessage && (
              <div className={`mt-4 text-sm font-medium px-4 py-3 rounded-xl flex items-center ${connectionStatus === 'success' ? 'text-emerald-600 bg-emerald-500/10 border border-emerald-500/20' : 'text-rose-600 bg-rose-500/10 border border-rose-500/20'}`}>
                {connectionStatus === 'success' ? <CheckCircle2 className="inline-block mr-2" size={18} /> : <AlertCircle className="inline-block mr-2" size={18} />}
                {connectionMessage}
              </div>
            )}
          </div>
          
          <div className="pt-6 border-t border-slate-200">
            <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-4">Payment Gateway & QRIS</h3>
            
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-4 flex gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600 shrink-0 mt-0.5">
                <CheckCircle2 size={16} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-indigo-900 mb-1">Webhook Auto-Lunas Siap Digunakan!</h4>
                <p className="text-[11px] text-indigo-800 leading-relaxed mb-2">
                  Sistem telah dilengkapi endpoint Webhook untuk memproses notifikasi Midtrans secara real-time. Copy URL Webhook di bawah ini dan masukkan ke dashboard Midtrans Anda pada menu <strong>Settings</strong> {'>'} <strong>Configuration</strong> {'>'} <strong>Notification URL</strong>:
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <code className="text-[10px] bg-white px-2 py-1.5 rounded border border-indigo-200 text-indigo-700 font-mono select-all">
                    {window.location.origin}/api/webhook/midtrans
                  </code>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1.5">Direct QRIS Payload String</label>
                <textarea 
                  value={qrisStaticPayload} 
                  onChange={(e) => setQrisStaticPayload(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-900 focus:ring-1 focus:ring-primary-600 focus:border-primary-600 focus:outline-none transition-all font-mono min-h-[80px]" 
                  placeholder="Scan QRIS fisik Anda (menggunakan aplikasi scanner barcode) lalu paste stringnya ke sini. Contoh: 0002010102112666...6304123A"
                ></textarea>
                <p className="text-[10px] text-slate-500 mt-1">Jika diisi, pada menu tagihan akan muncul opsi pembayaran QRIS khusus tanpa Midtrans dengan harga otomatis.</p>
              </div>
              <div className="pt-2">
                <p className="text-[10px] font-semibold text-slate-700 uppercase tracking-widest mb-2 border-b border-slate-200 pb-1">Atau gunakan Midtrans (Otomatis & Terintegrasi Bank)</p>
              </div>
              <div>
                <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1.5">Server Key</label>
                <input 
                  type="password" 
                  value={midtransServerKey} 
                  onChange={(e) => setMidtransServerKey(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-900 focus:ring-1 focus:ring-primary-600 focus:border-primary-600 focus:outline-none transition-all font-mono" 
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1.5">Client Key</label>
                <input 
                  type="text" 
                  value={midtransClientKey} 
                  onChange={(e) => setMidtransClientKey(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-900 focus:ring-1 focus:ring-primary-600 focus:border-primary-600 focus:outline-none transition-all font-mono" 
                />
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-200">
            <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-4">Integrasi WhatsApp (API)</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                   <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1.5">Provider Layanan WhatsApp</label>
                   <select 
                     value={waGatewayProvider}
                     onChange={e => setWaGatewayProvider(e.target.value)}
                     className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-900 focus:ring-1 focus:ring-primary-600 focus:border-primary-600 focus:outline-none transition-all font-mono"
                   >
                      <option value="fonnte">Fonnte API</option>
                      <option value="watzap">Watzap</option>
                      <option value="twilio">Twilio</option>
                   </select>
                 </div>
                 <div>
                   <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1.5">API Token / Auth Key</label>
                   <input type="password" value={waGatewayToken} onChange={e => setWaGatewayToken(e.target.value)} placeholder="Masukkan Token API WA Gateway" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-900 focus:ring-1 focus:ring-primary-600 focus:border-primary-600 focus:outline-none transition-all font-mono" />
                 </div>
              </div>
              <div>
                <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1.5">Nomor Pengirim (Sender WA Gateway)</label>
                <input type="text" defaultValue="082124812114" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-900 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none transition-all font-mono" />
              </div>
              <div className="flex items-center justify-between mt-4">
                <div>
                  <p className="text-sm font-medium text-slate-800">Notifikasi Auto-Welcome (OLT Aktif)</p>
                  <p className="text-[10px] text-slate-500 font-mono mt-1">Kirim WA otomatis saat modem pelanggan baru online di OLT</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-9 h-5 bg-white peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-slate-800 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 peer-checked:after:bg-slate-100 after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-800">Notifikasi Auto-Billing</p>
                  <p className="text-[10px] text-slate-500 font-mono mt-1">Kirim otomatis pengingat tagihan H-1 via WA</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={isWaBillingEnabled} 
                    onChange={(e) => setIsWaBillingEnabled && setIsWaBillingEnabled(e.target.checked)} 
                  />
                  <div className="w-9 h-5 bg-white peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-slate-800 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 peer-checked:after:bg-slate-100 after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-200">
            <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-4">Konfigurasi OLT</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1.5">Model OLT</label>
                <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-900 focus:ring-1 focus:ring-primary-600 focus:border-primary-600 focus:outline-none transition-all font-mono">
                  <option value="cdata-gpon">C-Data GPON</option>
                  <option value="zte-c320">ZTE C320</option>
                  <option value="huawei-ma5800">Huawei MA5800</option>
                  <option value="vsol-epon">VSOL EPON</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1.5">PON Port Default</label>
                <input type="text" defaultValue="PON 1" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-900 focus:ring-1 focus:ring-primary-600 focus:border-primary-600 focus:outline-none transition-all font-mono" />
              </div>
              <div>
                <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1.5">Serial Number Base</label>
                <input type="text" defaultValue="CDATA123456" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-900 focus:ring-1 focus:ring-primary-600 focus:border-primary-600 focus:outline-none transition-all font-mono" />
              </div>
            </div>
          </div>
          
          <div className="pt-6 border-t border-slate-200">
            <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-4">Konfigurasi SNMP</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end mb-4">
              <div>
                <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1.5">IP Address Perangkat (OLT/Router/Switch)</label>
                <input 
                  type="text" 
                  value={snmpIp}
                  onChange={(e) => setSnmpIp(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-900 focus:ring-1 focus:ring-primary-600 focus:border-primary-600 focus:outline-none transition-all font-mono" 
                  placeholder="e.g. 10.0.0.1"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1.5">Community String (Read-Only)</label>
                <input 
                  type="text" 
                  value={snmpCommunity}
                  onChange={(e) => setSnmpCommunity(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-900 focus:ring-1 focus:ring-primary-600 focus:border-primary-600 focus:outline-none transition-all font-mono" 
                  placeholder="public"
                />
              </div>
            </div>
            <button 
              onClick={handleAddSnmpDevice}
              className="bg-primary-50 text-primary-700 hover:bg-primary-100 px-5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-colors border border-primary-200 flex items-center justify-center mb-4"
            >
              Tambah Perangkat
            </button>

            {snmpDevices.length > 0 && (
              <div className="space-y-2 mt-4 max-h-[200px] overflow-y-auto pr-2">
                {snmpDevices.map((device, index) => (
                  <div key={index} className="flex items-center justify-between bg-slate-50 border border-slate-200 p-3 rounded-xl hover:border-slate-300 transition-colors">
                    <div>
                      <p className="text-sm font-semibold text-slate-800 font-mono tracking-tight">{device.ip}</p>
                      <p className="text-[10px] text-slate-500 capitalize tracking-wide">{device.community}</p>
                    </div>
                    <button 
                      onClick={() => handleRemoveSnmpDevice(index)}
                      className="text-slate-400 hover:text-rose-600 transition-colors p-2 hover:bg-rose-50 rounded-lg"
                      title="Hapus SNMP Device"
                    >
                      <AlertCircle size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex flex-col items-end pt-6 border-t border-slate-200 mt-6 space-y-4">
            {settingsError && (
              <div className="text-sm font-medium text-rose-600 bg-rose-500/10 border border-rose-500/20 px-4 py-3 rounded-xl w-full flex items-center justify-center sm:w-auto">
                <AlertCircle className="inline-block mr-2" size={18} />
                {settingsError}
              </div>
            )}
            {settingsSuccess && (
              <div className="text-sm font-medium text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 rounded-xl w-full flex items-center justify-center sm:w-auto">
                <CheckCircle2 className="inline-block mr-2" size={18} />
                {settingsSuccess}
              </div>
            )}
            <button 
              onClick={() => setShowSettingsConfirm(true)}
              className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-colors shadow-lg shadow-primary-600/20">
              Simpan Pengaturan
            </button>
          </div>
        </div>
      </div>

      {showSettingsConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-2">
              Konfirmasi Perubahan
            </h3>
            <p className="text-sm text-slate-500 mb-6">
              Apakah Anda yakin ingin menyimpan perubahan pengaturan ini? Konfigurasi gateway pembayaran dan API akan diperbarui.
            </p>
            <div className="flex flex-col gap-2">
              <button 
                onClick={handleSaveSettings}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors flex justify-center items-center gap-2"
              >
                Ya, Simpan Perubahan
              </button>
              <button 
                onClick={() => setShowSettingsConfirm(false)}
                className="w-full bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 py-2.5 rounded-xl text-sm font-semibold transition-colors"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {showScriptModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-2xl w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-2">
              Script Konfigurasi MikroTik
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              Salin script di bawah ini dan paste ke terminal (New Terminal) di MikroTik Anda (Winbox atau WebFig). Ini akan membuat grup, user, dan mengaktifkan API.
            </p>
            
            <div className="relative mb-6">
              <div className="bg-slate-900 rounded-xl p-4 overflow-x-auto">
                <pre className="text-sm font-mono text-emerald-400 whitespace-pre-wrap">
{`/user group add name=billing-api policy=api,read,write,test
/user add name="${mikrotikUsername}" password="${mikrotikPassword}" group=billing-api comment="User API OLT Billing"
/ip service set api disabled=no port=${mikrotikPort}`}
                </pre>
              </div>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(`/user group add name=billing-api policy=api,read,write,test\n/user add name="${mikrotikUsername}" password="${mikrotikPassword}" group=billing-api comment="User API OLT Billing"\n/ip service set api disabled=no port=${mikrotikPort}`);
                  alert('Script berhasil disalin!');
                }}
                className="absolute top-3 right-3 bg-slate-800 hover:bg-slate-700 text-slate-300 p-2 rounded-lg transition-colors flex items-center gap-2 text-xs font-mono border border-slate-700"
              >
                <Copy size={14} /> Salin
              </button>
            </div>

            <div className="flex justify-end">
              <button 
                onClick={() => setShowScriptModal(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
