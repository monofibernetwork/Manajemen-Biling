import React, { useState, useMemo } from 'react';
import { Customer } from '../types';
import { ArrowLeft, User, MapPin, Phone, Wifi, WifiOff, Activity, CreditCard, Clock, CalendarDays, Key, Server, Settings, Activity as ActivityIcon, Power, Ticket, RefreshCw, Eye, EyeOff, History, ChevronDown, ChevronRight, Edit3, Check, X, Mail } from 'lucide-react';
import { APIProvider, Map, AdvancedMarker } from '@vis.gl/react-google-maps';
import { formatDate } from '../lib/formatDate';

const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  '';
const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';

interface CustomerDetailsProps {
  customer: Customer;
  onBack: () => void;
  onUpdateCustomer?: (customer: Customer) => void;
}

export function CustomerDetails({ customer, onBack, onUpdateCustomer }: CustomerDetailsProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showRebootDialog, setShowRebootDialog] = useState(false);
  const [showTicketDialog, setShowTicketDialog] = useState(false);
  const [ticketIssue, setTicketIssue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Customer>(customer);
  const [editError, setEditError] = useState<string | null>(null);

  const [newSsid, setNewSsid] = useState(`WIFI_${customer.name.replace(/\s+/g, '_')}`);
  const [newWifiPassword, setNewWifiPassword] = useState('rahasia123');
  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});
  const [expandedSessions, setExpandedSessions] = useState<Record<string, boolean>>({});

  const groupedHistory = useMemo(() => {
    type ConnectionHistoryItem = NonNullable<typeof customer.connectionHistory>[number];
    const initial: Record<string, ConnectionHistoryItem[]> = {};
    if (!customer.connectionHistory) return initial;
    return customer.connectionHistory.reduce((acc, log) => {
      const dateStr = formatDate(log.startTime);
      if (!acc[dateStr]) {
        acc[dateStr] = [];
      }
      acc[dateStr].push(log);
      return acc;
    }, initial);
  }, [customer.connectionHistory]);

  const toggleDate = (date: string) => {
    setExpandedDates(prev => ({ ...prev, [date]: !prev[date] }));
  };

  const toggleSession = (sessionId: string) => {
    setExpandedSessions(prev => ({ ...prev, [sessionId]: !prev[sessionId] }));
  };

  const customerLocation = useMemo(() => {
    const num = customer.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return {
      lat: -7.26 + (num % 100) * 0.0005,
      lng: 112.75 + (num % 50) * 0.0005,
    };
  }, [customer.id]);

  const handleReboot = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setShowRebootDialog(false);
      alert(`Berhasil! Perintah reboot telah dikirim ke modem pelanggan ${customer.name}.`);
    }, 2000);
  };

  const handleUpdateWifi = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setShowPasswordDialog(false);
      alert(`Berhasil! Konfigurasi WiFi baru (SSID: ${newSsid}) telah didorong ke modem pelanggan ${customer.name}.`);
    }, 2000);
  };

  const handleCreateTicket = () => {
    if (!ticketIssue.trim()) {
      alert('Mohon isi detail kendala modem/jaringan.');
      return;
    }
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setShowTicketDialog(false);
      setTicketIssue('');
      alert(`Tiket berhasil dibuat untuk pelanggan ${customer.name} dengan kendala:\n${ticketIssue}`);
    }, 1500);
  };

  const handleSaveDetails = () => {
    if (editForm.ontSerialNumber && !/^[a-zA-Z0-9]{12,16}$/.test(editForm.ontSerialNumber)) {
      setEditError('SN ONT tidak valid! Harus berupa 12-16 karakter alphanumeric.');
      return;
    }
    if (editForm.ontRxPower && String(editForm.ontRxPower).toUpperCase() !== 'N/A') {
      const rxPowerStr = String(editForm.ontRxPower).replace(/\s*dBm$/i, '');
      if (isNaN(Number(rxPowerStr)) || rxPowerStr.trim() === '') {
        setEditError("Rx Power tidak valid! Harus berupa angka (misal: -22.5) atau 'N/A'.");
        return;
      }
      editForm.ontRxPower = `${Number(rxPowerStr)} dBm`;
    } else if (editForm.ontRxPower && String(editForm.ontRxPower).toUpperCase() === 'N/A') {
      editForm.ontRxPower = 'N/A';
    }
    setEditError(null);
    if (onUpdateCustomer) {
      onUpdateCustomer(editForm);
    }
    setIsEditing(false);
    alert('Detail pelanggan berhasil disimpan.');
  };

  return (
    <div className="space-y-6 animate-in fade-in max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-white text-slate-400 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{customer.name}</h1>
            <p className="text-sm font-mono text-slate-500 uppercase tracking-widest">ID: {customer.id}</p>
          </div>
        </div>
        
        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button 
            onClick={() => setShowRebootDialog(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 transition-colors"
          >
            <Power size={16} className="text-rose-500" />
            Reboot ONT
          </button>
          
          <button 
            onClick={async () => {
               try {
                 const newIsolirState = customer.isIsolated ? false : true;
                 const response = await fetch('/api/mikrotik/isolate', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({
                       customerId: customer.id,
                       pppoeUsername: customer.pppoeUsername,
                       isolate: newIsolirState
                    })
                 });
                 if (response.ok) {
                   onUpdateCustomer({...customer, isIsolated: newIsolirState, status: newIsolirState ? 'offline' : 'online'});
                   alert(newIsolirState ? "User telah di-isolir via MikroTik" : "User telah diaktifkan kembali via MikroTik");
                 }
               } catch (e) {
                 alert("Gagal menghubungi MikroTik API");
               }
            }}
            className={`flex items-center gap-2 px-4 py-2 hover:opacity-90 border rounded-xl text-sm font-semibold transition-colors ${customer.isIsolated ? 'bg-emerald-500 text-white border-emerald-600' : 'bg-rose-50 border-rose-200 text-rose-700'}`}
          >
            {customer.isIsolated ? <Wifi size={16} /> : <WifiOff size={16} />}
            {customer.isIsolated ? 'Buka Isolir MikroTik' : 'Isolir MikroTik (Cut Off)'}
          </button>

          <button 
            onClick={() => setShowPasswordDialog(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 transition-colors"
          >
            <Wifi size={16} className="text-primary-600" />
            Ganti WiFi & Password
          </button>
          <button 
            onClick={() => setShowTicketDialog(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 transition-colors"
          >
            <Ticket size={16} className="text-amber-500" />
            Buat / Riwayat Tiket
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Profile & Contact */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-10">
              <User size={64} />
            </div>
            <div className="flex justify-between items-center mb-6 relative z-20">
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <User size={16} /> Informasi Pelanggan
              </h2>
              {isEditing ? (
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      setIsEditing(false);
                      setEditForm(customer);
                      setEditError(null);
                    }} 
                    className="p-1 px-2 text-xs rounded-lg text-slate-500 hover:bg-slate-100 flex items-center gap-1"
                  >
                    <X size={14} /> Batal
                  </button>
                  <button 
                    onClick={handleSaveDetails} 
                    className="p-1 px-2 text-xs rounded-lg bg-primary-600 hover:bg-primary-700 text-white flex items-center gap-1 font-semibold"
                  >
                    <Check size={14} /> Simpan
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => setIsEditing(true)} 
                  className="p-1 px-2 text-xs rounded-lg text-primary-600 hover:bg-primary-50 flex items-center gap-1 font-medium border border-transparent hover:border-primary-200"
                >
                  <Edit3 size={14} /> Edit
                </button>
              )}
            </div>
            
            <div className="space-y-4 relative z-10">
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono mb-1">Nama Lengkap</p>
                {isEditing ? (
                  <input 
                    type="text"
                    className="w-full bg-slate-50 border border-primary-300 focus:ring-1 focus:ring-primary-500 focus:outline-none rounded-lg px-3 py-2 text-sm text-slate-900 font-medium"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  />
                ) : (
                  <p className="text-slate-900 font-medium">{customer.name}</p>
                )}
              </div>

              <div className="pt-4 border-t border-slate-200">
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono mb-1">Email</p>
                <div className="flex items-center gap-2">
                  <Mail size={14} className="text-primary-500" />
                  {isEditing ? (
                    <input 
                      type="text"
                      className="w-full bg-slate-50 border border-primary-300 focus:ring-1 focus:ring-primary-500 focus:outline-none rounded-lg px-3 py-2 text-sm text-slate-900 font-mono"
                      value={editForm.email || ''}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      placeholder="Email pelanggan"
                    />
                  ) : (
                    <p className="text-slate-700 font-mono text-sm">{customer.email || '-'}</p>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200">
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono mb-1">Telepon / WhatsApp</p>
                <div className="flex items-center gap-2">
                  <Phone size={14} className="text-emerald-500" />
                  {isEditing ? (
                    <input 
                      type="text"
                      className="w-full bg-slate-50 border border-primary-300 focus:ring-1 focus:ring-primary-500 focus:outline-none rounded-lg px-3 py-2 text-sm text-slate-900 font-mono"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    />
                  ) : (
                    <p className="text-slate-700 font-mono text-sm">{customer.phone}</p>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200">
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono mb-1">Kode Referral</p>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <p className="text-slate-900 font-bold tracking-wider font-mono bg-indigo-50 px-2 py-1 rounded inline-block text-sm border border-indigo-100">{customer.referralCode || 'BELUM ADA'}</p>
                  </div>
                  {customer.referralCode && (
                    <p className="text-xs text-slate-500 mt-1">
                      Telah digunakan: <strong className="text-indigo-600">{customer.referralCount || 0} kali</strong>
                      {((customer.referralCount || 0) > 0) && ` (Gratis internet ${Math.floor((customer.referralCount || 0) / 3)} bulan)`}
                    </p>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200">
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono mb-1">Alamat Pemasangan</p>
                <div className="flex items-start gap-2 mb-3">
                  <MapPin size={14} className="text-primary-600 mt-1 flex-shrink-0" />
                  {isEditing ? (
                    <textarea 
                      className="w-full bg-slate-50 border border-primary-300 focus:ring-1 focus:ring-primary-500 focus:outline-none rounded-lg px-3 py-2 text-sm text-slate-700 leading-relaxed min-h-[80px]"
                      value={editForm.address}
                      onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                    />
                  ) : (
                    <p className="text-slate-700 text-sm leading-relaxed">{customer.address}</p>
                  )}
                </div>
                
                {hasValidKey && (
                  <div className="h-[200px] w-full rounded-2xl overflow-hidden border border-slate-200/60 shadow-inner relative bg-slate-50">
                    <APIProvider apiKey={API_KEY}>
                      <Map 
                        defaultCenter={customerLocation} 
                        defaultZoom={15}
                        mapId="customer-map"
                        disableDefaultUI={true}
                        gestureHandling="cooperative"
                      >
                        <AdvancedMarker position={customerLocation}>
                          <div className="relative flex items-center justify-center w-8 h-8">
                            <span className="absolute w-full h-full bg-primary-400 rounded-full opacity-30 animate-pulse"></span>
                            <div className="relative w-4 h-4 bg-primary-600 rounded-full border-2 border-white shadow-lg"></div>
                          </div>
                        </AdvancedMarker>
                      </Map>
                    </APIProvider>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-6">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-6 flex items-center gap-2">
              <CreditCard size={16} /> Tagihan & Berlangganan
            </h2>
            
            <div className="space-y-4">
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono mb-1">Paket Internet</p>
                <div className="inline-flex items-center px-2.5 py-1 rounded-md bg-primary-600 text-white text-xs font-semibold uppercase tracking-wide border border-primary-600/20">
                  {customer.speedPlan}
                </div>
              </div>
              <div className="pt-4 border-t border-slate-200 flex justify-between items-center">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono mb-1">Status Pembayaran</p>
                  {customer.paymentStatus === 'paid' ? (
                    <span className="text-emerald-600 text-sm font-semibold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Lunas
                    </span>
                  ) : customer.paymentStatus === 'unpaid' ? (
                    <span className="text-amber-600 text-sm font-semibold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-400"></span> Belum Bayar
                    </span>
                  ) : (
                    <span className="text-rose-600 text-sm font-semibold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-400"></span> Jatuh Tempo
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono mb-1">Total Tagihan</p>
                  <p className="text-slate-900 font-mono">Rp {customer.billingAmount.toLocaleString('id-ID')}</p>
                </div>
              </div>
              {customer.lastPaymentDate && (
                <div className="pt-4 border-t border-slate-200">
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono mb-1">Pembayaran Terakhir</p>
                  <div className="flex justify-between items-center mt-1">
                    <div className="flex items-center gap-2 text-sm">
                      <CalendarDays size={14} className="text-primary-500" />
                      <span className="text-slate-700">{formatDate(customer.lastPaymentDate)}</span>
                    </div>
                    <span className="text-emerald-600 font-semibold font-mono">Rp {customer.billingAmount.toLocaleString('id-ID')}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Middle Column: Technical & Network */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Server size={16} /> Data Teknis PPPoE
              </h2>
              {isEditing ? (
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      setIsEditing(false);
                      setEditForm(customer);
                      setEditError(null);
                    }} 
                    className="p-1 px-2 text-xs rounded-lg text-slate-500 hover:bg-slate-100 flex items-center gap-1"
                  >
                    <X size={14} /> Batal
                  </button>
                  <button 
                    onClick={handleSaveDetails} 
                    className="p-1 px-2 text-xs rounded-lg bg-primary-600 hover:bg-primary-700 text-white flex items-center gap-1 font-semibold"
                  >
                    <Check size={14} /> Simpan
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => setIsEditing(true)} 
                  className="p-1 px-2 text-xs rounded-lg text-primary-600 hover:bg-primary-50 flex items-center gap-1 font-medium border border-transparent hover:border-primary-200"
                >
                  <Edit3 size={14} /> Edit
                </button>
              )}
            </div>
            
            {editError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-600 rounded-lg text-sm flex items-center gap-2">
                <ActivityIcon size={16} />
                <span>{editError}</span>
              </div>
            )}
            
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono mb-1">Username PPPoE</p>
                  {isEditing ? (
                    <input 
                      type="text"
                      className="w-full bg-slate-50 border border-primary-300 focus:ring-1 focus:ring-primary-500 focus:outline-none rounded-lg px-3 py-2 text-sm text-slate-900 font-mono"
                      value={editForm.pppoeUsername}
                      onChange={(e) => setEditForm({ ...editForm, pppoeUsername: e.target.value })}
                    />
                  ) : (
                    <p className="text-slate-800 font-mono text-sm bg-white/50 p-2 rounded-lg border border-slate-200">{customer.pppoeUsername}</p>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono mb-1">Password PPPoE</p>
                  {isEditing ? (
                    <input 
                      type="text"
                      className="w-full bg-slate-50 border border-primary-300 focus:ring-1 focus:ring-primary-500 focus:outline-none rounded-lg px-3 py-2 text-sm text-slate-900 font-mono"
                      value={editForm.pppoePassword || ''}
                      onChange={(e) => setEditForm({ ...editForm, pppoePassword: e.target.value })}
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <p className="flex-1 text-slate-700 font-mono text-sm bg-white/50 p-2 rounded-lg border border-slate-200 h-[38px] flex items-center">
                        {showPassword ? (customer.pppoePassword || 'Not Set') : '••••••••'}
                      </p>
                      <button
                        onClick={() => setShowPassword(!showPassword)}
                        className="p-2 bg-white hover:bg-slate-700 border border-slate-300 rounded-lg text-slate-400 hover:text-slate-800 transition-colors"
                        title={showPassword ? "Sembunyikan Password" : "Tampilkan Password"}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="pt-4 border-t border-slate-200">
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono mb-1">IP Address (Static/Dynamic)</p>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary-600 animate-pulse"></span>
                  <p className="text-primary-600 font-mono text-sm">{customer.ipAddress || '10.10.x.x (Dynamic)'}</p>
                </div>
              </div>
              
              <div className="pt-4 border-t border-slate-200">
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono mb-1">SN ONT</p>
                {isEditing ? (
                  <div className="space-y-1">
                    <input 
                      type="text"
                      title="SN ONT harus berupa alphanumeric dengan panjang 12 hingga 16 karakter"
                      className={`w-full bg-slate-50 border ${editForm.ontSerialNumber && !/^[a-zA-Z0-9]{12,16}$/.test(editForm.ontSerialNumber) ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-200' : 'border-slate-200 focus:border-primary-600'} focus:ring-1 focus:outline-none rounded-lg px-3 py-2 text-sm text-slate-900 font-mono uppercase transition-colors`}
                      value={editForm.ontSerialNumber || ''}
                      placeholder="Contoh: ZTEG12345678 (SN ONT)"
                      onChange={(e) => setEditForm({ ...editForm, ontSerialNumber: e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 16) })}
                    />
                    {editForm.ontSerialNumber && !/^[a-zA-Z0-9]{12,16}$/.test(editForm.ontSerialNumber) && (
                      <p className="text-[10px] text-rose-500 flex items-center gap-1">
                        <ActivityIcon size={10} />
                        Harus 12-16 karakter alphanumeric
                      </p>
                    )}
                  </div>
                ) : customer.ontSerialNumber ? (
                  <p className="text-slate-700 font-mono text-sm uppercase">{customer.ontSerialNumber}</p>
                ) : (
                  <p className="text-slate-400 font-mono text-sm italic">Belum diset</p>
                )}
              </div>
              
              <div className="pt-4 border-t border-slate-200">
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono mb-1">ONT Rx Power</p>
                {isEditing ? (
                  <input 
                    type="text"
                    className="w-full bg-slate-50 border border-primary-300 focus:ring-1 focus:ring-primary-500 focus:outline-none rounded-lg px-3 py-2 text-sm text-slate-900 font-mono"
                    value={editForm.ontRxPower || ''}
                    placeholder="Contoh: -23.5 dBm atau N/A"
                    onChange={(e) => setEditForm({ ...editForm, ontRxPower: e.target.value })}
                  />
                ) : customer.ontRxPower ? (
                  <p className={`font-mono text-sm ${parseFloat(customer.ontRxPower) < -27 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {customer.ontRxPower}
                  </p>
                ) : (
                  <p className="text-slate-400 font-mono text-sm italic">Belum diset</p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-6 relative overflow-hidden">
            {customer.status === 'online' ? (
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
            ) : (
              <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
            )}
            
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-6 flex items-center gap-2">
              <ActivityIcon size={16} /> Status Koneksi
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-white/30 p-4 rounded-2xl border border-slate-200/50">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono mb-1">Sesi Radius</p>
                  {customer.status === 'online' ? (
                    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-400/10 text-emerald-600 text-xs font-mono font-semibold uppercase tracking-widest border border-emerald-400/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> ONLINE
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-rose-400/10 text-rose-600 text-xs font-mono font-semibold uppercase tracking-widest border border-rose-400/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span> OFFLINE
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono mb-1">Uptime</p>
                  <p className="text-slate-700 font-mono text-sm">{customer.uptime !== '0h 0m 0s' ? customer.uptime : '---'}</p>
                </div>
              </div>

              {customer.status === 'online' && (
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="bg-white/20 border border-slate-200/50 rounded-2xl p-3 text-center">
                    <p className="text-[9px] text-slate-500 font-mono uppercase tracking-widest mb-1 shadow-sm">Download</p>
                    <p className="text-primary-600 font-mono text-sm">{customer.currentDownload || '0.0'} Mbps</p>
                  </div>
                  <div className="bg-white/20 border border-slate-200/50 rounded-2xl p-3 text-center">
                    <p className="text-[9px] text-slate-500 font-mono uppercase tracking-widest mb-1 shadow-sm">Upload</p>
                    <p className="text-emerald-600 font-mono text-sm">{customer.currentUpload || '0.0'} Mbps</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Connection Logs & Notes */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 flex flex-col h-full">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-6 flex items-center gap-2">
              <History size={16} /> Riwayat Koneksi (Logs)
            </h2>
            
            <div className="flex-1 min-h-[300px]">
              {customer.connectionHistory && customer.connectionHistory.length > 0 ? (
                <div className="space-y-4">
                  {(Object.entries(groupedHistory) as [string, any[]][]).map(([dateStr, logs]) => (
                    <div key={dateStr} className="border border-slate-200/60 rounded-xl overflow-hidden bg-slate-50/30">
                      <button
                        onClick={() => toggleDate(dateStr)}
                        className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 transition-colors border-b border-slate-200/60"
                      >
                        <div className="flex items-center gap-2">
                          <CalendarDays size={14} className="text-slate-400" />
                          <span className="text-xs font-semibold text-slate-700">{dateStr}</span>
                          <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-md font-mono">{logs.length} sesi</span>
                        </div>
                        {expandedDates[dateStr] ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />}
                      </button>
                      
                      {expandedDates[dateStr] && (
                        <div className="p-4 bg-white relative">
                          <div className="absolute left-6 top-0 bottom-0 w-px bg-slate-200/80"></div>
                          <div className="space-y-5 relative">
                            {logs.map((log, i) => {
                              const sessionId = `${dateStr}-${i}`;
                              const isExpanded = expandedSessions[sessionId];
                              return (
                              <div key={i} className="relative pl-6">
                                <span className={`absolute left-[-21px] top-2 z-10 w-2.5 h-2.5 rounded-full border-2 border-white shadow-sm ring-1 ring-slate-200 ${log.status === 'Terhubung' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                                <div className="border border-slate-200/60 rounded-xl bg-white overflow-hidden shadow-sm transition-all hover:border-slate-300">
                                  <button onClick={() => toggleSession(sessionId)} className="w-full flex items-center justify-between p-3 hover:bg-slate-50 transition-colors">
                                    <p className="text-[10px] text-slate-600 font-mono flex items-center gap-1.5 font-medium">
                                      <Clock size={12} className="text-slate-400" />
                                      {new Date(log.startTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                      {' - '}
                                      {log.endTime === 'Saat ini' ? 'Sekarang' : new Date(log.endTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                    <div className="flex items-center gap-2">
                                      <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase tracking-widest font-bold ${log.status === 'Terhubung' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                        {log.status}
                                      </span>
                                      {isExpanded ? <ChevronDown size={14} className="text-slate-400" /> : <ChevronRight size={14} className="text-slate-400" />}
                                    </div>
                                  </button>
                                  {isExpanded && (
                                    <div className="p-3 bg-slate-50 border-t border-slate-100 text-[10px] font-mono flex flex-col gap-2 relative">
                                      <div className="flex justify-between items-center bg-white p-2 rounded border border-slate-100">
                                        <span className="text-slate-500">Durasi Sesi</span>
                                        <span className="text-slate-700 font-semibold">{log.endTime === 'Saat ini' ? '-' : (Math.round((new Date(log.endTime).getTime() - new Date(log.startTime).getTime()) / 60000) + ' menit')}</span>
                                      </div>
                                      <div className="flex justify-between items-center bg-white p-2 rounded border border-slate-100">
                                        <span className="text-slate-500">Alasan Putus</span>
                                        <span className="text-slate-700 font-medium">{log.status === 'Terhubung' ? '-' : 'Timeout/Loss'}</span>
                                      </div>
                                      <div className="flex justify-between items-center bg-white p-2 rounded border border-slate-100">
                                        <span className="text-slate-500">IP address</span>
                                        <span className="text-slate-700 font-medium">{customer.ipAddress || 'Dynamic'}</span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-400 text-sm font-mono italic">
                  Belum ada riwayat koneksi.
                </div>
              )}
            </div>
            
            <div className="mt-6 pt-4 border-t border-slate-200">
              <button className="w-full py-2 bg-white/50 hover:bg-white border border-slate-300/50 rounded-xl text-xs font-semibold text-slate-700 transition-colors">
                Lihat Semua Log
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showRebootDialog && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-2">
              <Power className="text-rose-500" size={20} /> Konfirmasi Reboot
            </h3>
            <p className="text-sm text-slate-500 mb-6">
              Apakah Anda yakin ingin melakukan reboot modem ONT milik <strong>{customer.name}</strong>? Koneksi internet akan terputus selama beberapa menit.
            </p>
            <div className="flex flex-col gap-2">
              <button 
                onClick={handleReboot}
                disabled={isProcessing}
                className="w-full bg-rose-500 hover:bg-rose-600 text-white disabled:opacity-50 py-2.5 rounded-xl text-sm font-semibold transition-colors flex justify-center items-center gap-2"
              >
                {isProcessing ? <RefreshCw className="animate-spin" size={16} /> : 'Ya, Reboot Sekarang'}
              </button>
              <button 
                onClick={() => setShowRebootDialog(false)}
                disabled={isProcessing}
                className="w-full bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 disabled:opacity-50 py-2.5 rounded-xl text-sm font-semibold transition-colors"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {showPasswordDialog && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-2">
              <Wifi className="text-primary-600" size={20} /> Ganti WiFi & Password
            </h3>
            <p className="text-sm text-slate-500 mb-6">
              Perubahan pada nama WiFi (SSID) atau password akan di-push ke modem ONT milik <strong>{customer.name}</strong> via protokol TR-069.
            </p>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1">Nama WiFi (SSID)</label>
                <input 
                  type="text" 
                  value={newSsid}
                  onChange={(e) => setNewSsid(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:ring-1 focus:ring-primary-600 focus:outline-none transition-all font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1">Password Baru</label>
                <input 
                  type="text" 
                  value={newWifiPassword}
                  onChange={(e) => setNewWifiPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:ring-1 focus:ring-primary-600 focus:outline-none transition-all font-mono"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <button 
                onClick={handleUpdateWifi}
                disabled={isProcessing}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white disabled:opacity-50 py-2.5 rounded-xl text-sm font-semibold transition-colors flex justify-center items-center gap-2"
              >
                {isProcessing ? <RefreshCw className="animate-spin" size={16} /> : 'Terapkan (Push to ONT)'}
              </button>
              <button 
                onClick={() => setShowPasswordDialog(false)}
                disabled={isProcessing}
                className="w-full bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 disabled:opacity-50 py-2.5 rounded-xl text-sm font-semibold transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {showTicketDialog && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-2">
              <Ticket className="text-amber-500" size={20} /> Buat Tiket Gangguan
            </h3>
            <p className="text-sm text-slate-500 mb-6">
              Buat tiket laporan jika pelanggan <strong>{customer.name}</strong> terkendala dengan modem / jaringan internet.
            </p>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1">Detail Kendala</label>
                <textarea 
                  value={ticketIssue}
                  onChange={(e) => setTicketIssue(e.target.value)}
                  placeholder="Deskripsikan masalah modem/jaringan di sini (contoh: Indikator LOS merah)..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:ring-1 focus:ring-primary-600 focus:outline-none transition-all min-h-[100px] resize-y"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <button 
                onClick={handleCreateTicket}
                disabled={isProcessing}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white disabled:opacity-50 py-2.5 rounded-xl text-sm font-semibold transition-colors flex justify-center items-center gap-2"
              >
                {isProcessing ? <RefreshCw className="animate-spin" size={16} /> : 'Buat Tiket Sekarang'}
              </button>
              <button 
                onClick={() => setShowTicketDialog(false)}
                disabled={isProcessing}
                className="w-full bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 disabled:opacity-50 py-2.5 rounded-xl text-sm font-semibold transition-colors"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
