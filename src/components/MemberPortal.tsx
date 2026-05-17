import React, { useState, useEffect } from 'react';
import { CreditCard, WifiHigh, WifiOff, FileText, AlertCircle, Clock, ShieldCheck, Download, ChevronRight, MessageSquare, LogIn, Lock, Smartphone, User, PowerOff, Wallet, QrCode, X, CheckCircle2, Gift, Link as LinkIcon, Copy, Users } from 'lucide-react';
import { Customer } from '../types';
import { mockCustomers } from '../mockData';
import { formatDateTime } from '../lib/formatDate';
import { useTenant } from '../contexts/TenantContext';
import { getInternetPackages } from '../lib/packages';

declare global {
  interface Window {
    snap: any;
  }
}

export function MemberPortal() {
  const { tenantId, branding } = useTenant();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginName, setLoginName] = useState('');
  const [loginPhone, setLoginPhone] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [customer, setCustomer] = useState<Customer | null>(null);
  
  const [isPaying, setIsPaying] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showNotification, setShowNotification] = useState<string | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isRequestingUpgrade, setIsRequestingUpgrade] = useState(false);

  const handleRequestUpgrade = async (newPlan: string) => {
    setIsRequestingUpgrade(true);
    try {
      const { collection, addDoc } = await import('firebase/firestore');
      const { db } = await import('../firebase');
      
      await addDoc(collection(db, 'tickets'), {
        title: `Request Upgrade Layanan ke ${newPlan}`,
        customerId: customer?.id,
        customerName: customer?.name,
        category: 'other',
        description: `Pelanggan merequest upgrade layanan mandiri dari ${customer?.speedPlan} menjadi ${newPlan}. Mohon segera ditindaklanjuti.`,
        priority: 'high',
        status: 'open',
        technician: 'unassigned', // Or give it to some admin unassigned
        tenantId,
        createdAt: new Date().toISOString()
      });
      
      setShowNotification(`Berhasil mengajukan request upgrade ke ${newPlan}. Tim kami akan segera menghubungi Anda.`);
      setTimeout(() => setShowNotification(null), 4000);
      setShowUpgradeModal(false);
    } catch (err) {
      console.error(err);
      alert('Gagal mengajukan permohonan. Coba lagi nanti.');
    } finally {
      setIsRequestingUpgrade(false);
    }
  };

  useEffect(() => {
    const script = document.createElement("script");
    const isProd = false; 
    script.src = isProd ? "https://app.midtrans.com/snap/snap.js" : "https://app.sandbox.midtrans.com/snap/snap.js";
    script.setAttribute("data-client-key", import.meta.env.VITE_MIDTRANS_CLIENT_KEY || 'YOUR_CLIENT_KEY');
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    
    if (!loginName || !loginPhone) {
      setLoginError('Silakan masukkan Nama dan Nomor HP Anda.');
      return;
    }
    
    setIsAuthenticating(true);
    
    try {
      const { collection, getDocs, query, where } = await import('firebase/firestore');
      const { db } = await import('../firebase');
      
      const q = query(collection(db, 'customers'), where('tenantId', '==', tenantId));
      const custSnap = await getDocs(q);
      let foundCustomer: Customer | null = null;
      
      const cleanPhone = loginPhone.replace(/\D/g, '');
      const inputNameLower = loginName.toLowerCase().trim();

      custSnap.forEach((doc) => {
        const c = doc.data() as Customer;
        c.id = doc.id;
        
        const cleanCustPhone = c.phone.replace(/\D/g, '');
        const custNameLower = c.name.toLowerCase();
        
        const matchesPhone = cleanCustPhone === cleanPhone || c.pppoeUsername === loginPhone;
        const matchesName = custNameLower.includes(inputNameLower) || inputNameLower.includes(custNameLower);
        
        if (matchesPhone && matchesName) {
          foundCustomer = c;
        }
      });
      
      if (foundCustomer) {
        setCustomer(foundCustomer);
        setIsLoggedIn(true);
      } else {
        setLoginError('Data tidak ditemukan. Pastikan Nama dan Nomor HP sudah benar dan terdaftar.');
      }
    } catch (error) {
       console.error("Login Member Error:", error);
       setLoginError('Terjadi kesalahan saat menghubungi server.');
    } finally {
       setIsAuthenticating(false);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCustomer(null);
    setLoginName('');
    setLoginPhone('');
  };

  const handlePay = async () => {
    if (!customer) return;
    setIsPaying(true);
    
    try {
      // Create transaction via backend API
      const res = await fetch('/api/payment/create-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
           orderId: `INV-${customer.id}-${Date.now()}`,
           grossAmount: customer.billingAmount,
           customerDetails: {
              first_name: customer.name,
              phone: customer.phone,
              email: customer.email || 'customer@example.com'
           }
        })
      });

      const data = await res.json();
      if (!data.token) {
         throw new Error(data.error || "Gagal membuat transaksi pembayaran");
      }

      // Pastikan Snap Midtrans dimuat
      if (!(window as any).snap) {
         const script = document.createElement('script');
         // Ganti URL ke production jika untuk aslinya: 'https://app.midtrans.com/snap/snap.js'
         script.src = 'https://app.sandbox.midtrans.com/snap/snap.js';
         // Jika client key di env client-side, bisa diset di sini atau biarkan null krn dari token
         document.head.appendChild(script);
         
         await new Promise(r => setTimeout(r, 1000));
      }

      (window as any).snap.pay(data.token, {
         onSuccess: async function(result: any) {
            console.log("Payment success:", result);
            await processSuccessPayment();
         },
         onPending: function(result: any) {
            console.log("Payment pending:", result);
            setShowNotification("Menunggu pembayaran...");
         },
         onError: function(result: any) {
            console.log("Payment error:", result);
            setShowNotification("Pembayaran Gagal.");
         },
         onClose: function() {
            setShowNotification("Anda menutup popup pembayaran sebelum selesai.");
            setIsPaying(false);
         }
      });
    } catch (err: any) {
      console.error(err);
      setShowNotification(`Terjadi kesalahan: ${err.message}`);
      setIsPaying(false);
    }
  };

  const processSuccessPayment = async () => {
    if (!customer) return;
    try {
      const newStatus = customer.status === 'isolir' ? 'online' : customer.status;
      const historyUpdate = [...(customer.connectionHistory || [])];
      
      if (customer.status === 'isolir') {
        historyUpdate.unshift({
           startTime: new Date().toISOString(),
           endTime: 'Saat ini',
           status: 'Terhubung (Isolir dibuka)'
        });
      }

      setCustomer({ 
        ...customer, 
        paymentStatus: 'paid',
        status: newStatus as 'online' | 'offline' | 'isolir',
        connectionHistory: historyUpdate
      });

      setShowNotification(`Pembayaran berhasil! Terima kasih, ${customer.name}.`);
      setTimeout(() => setShowNotification(null), 4000);
      setShowPaymentModal(false);

      const { doc, updateDoc, collection, addDoc } = await import('firebase/firestore');
      const { db } = await import('../firebase');
      
      await updateDoc(doc(db, 'customers', customer.id), {
        paymentStatus: 'paid',
        lastPaymentDate: new Date().toISOString(),
        status: newStatus,
        connectionHistory: historyUpdate
      });

      // Add to finance_transactions automatically
      await addDoc(collection(db, 'finance_transactions'), {
        type: 'income',
        amount: customer.billingAmount,
        category: 'subscription',
        note: `Pembayaran Tagihan Bulanan (Midtrans) - ${customer.name}`,
        date: new Date().toISOString(),
        tenantId: tenantId || 'biznet'
      });

    } catch (error: any) {
      console.error("Failed to process success payment", error);
    } finally {
      setIsPaying(false);
    }
  };

  const handleMockPayment = async () => {
    if (!customer) return;
    setIsPaying(true);
    
    try {
      // Simulate network request
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newStatus = customer.status === 'isolir' ? 'online' : customer.status;
      const historyUpdate = [...(customer.connectionHistory || [])];
      
      if (customer.status === 'isolir') {
        // Add log to connection history to reflect it's back online
        historyUpdate.unshift({
           startTime: new Date().toISOString(),
           endTime: 'Saat ini',
           status: 'Terhubung (Isolir dibuka)'
        });
      }

      setCustomer({ 
        ...customer, 
        paymentStatus: 'paid',
        status: newStatus as 'online' | 'offline' | 'isolir',
        connectionHistory: historyUpdate
      });

      setShowNotification(`Pembayaran berhasil! Terima kasih, ${customer.name}.`);
      setTimeout(() => setShowNotification(null), 4000);
      setShowPaymentModal(false);

      try {
        const { doc, updateDoc, collection, addDoc } = await import('firebase/firestore');
        const { db } = await import('../firebase');
        
        await updateDoc(doc(db, 'customers', customer.id), {
          paymentStatus: 'paid',
          lastPaymentDate: new Date().toISOString(),
          status: newStatus,
          connectionHistory: historyUpdate
        });

        // Add to finance_transactions automatically
        await addDoc(collection(db, 'finance_transactions'), {
          type: 'income',
          amount: customer.billingAmount,
          category: 'subscription',
          note: `Pembayaran Tagihan Bulanan - ${customer.name}`,
          date: new Date().toISOString(),
          tenantId: tenantId || 'biznet'
        });

      } catch (err) {
        console.error("Failed to update payment status in Firestore:", err);
      }

    } catch (error: any) {
      console.error(error);
      setShowNotification(`Terjadi kesalahan saat memproses pembayaran.`);
      setTimeout(() => setShowNotification(null), 4000);
    } finally {
      setIsPaying(false);
    }
  };

  if (!isLoggedIn || !customer) {
    return (
      <div className="flex items-center justify-center min-h-[80vh] p-4">
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
            <WifiHigh size={160} />
          </div>
          
          <div className="relative z-10">
            <div className="flex justify-center mb-6">
              {branding?.logoUrl ? (
                <img src={branding.logoUrl} alt="Logo" className="w-16 h-16 object-contain rounded-2xl shrink-0" />
              ) : (
                <div className="w-16 h-16 bg-primary-600 text-white rounded-2xl flex items-center justify-center border border-primary-600/20 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
                  <Lock size={32} />
                </div>
              )}
            </div>
            
            <h2 className="text-2xl font-bold text-center text-slate-900 mb-2">Portal Pelanggan</h2>
            <p className="text-sm text-center font-semibold mb-2" style={{ color: branding?.primaryColorHex || '#ea580c' }}>{branding?.businessName || 'Dream Paymanager'}</p>
            <p className="text-sm text-center text-slate-400 mb-8">Masuk untuk melihat tagihan dan status internet Anda.</p>
            
            {loginError && (
              <div className="mb-6 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                <AlertCircle size={18} className="text-rose-600 shrink-0 mt-0.5" />
                <p className="text-xs font-medium text-rose-600">{loginError}</p>
              </div>
            )}
            
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Nama Pelanggan
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User size={18} className="text-slate-500" />
                  </div>
                  <input
                    type="text"
                    value={loginName}
                    onChange={(e) => setLoginName(e.target.value)}
                    placeholder="Contoh: Budi Santoso"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-900 focus:ring-1 focus:ring-primary-600 focus:border-primary-600 focus:outline-none transition-all placeholder:text-slate-400"
                    disabled={isAuthenticating}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Nomor HP Terdaftar
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Smartphone size={18} className="text-slate-500" />
                  </div>
                  <input
                    type="text"
                    value={loginPhone}
                    onChange={(e) => setLoginPhone(e.target.value)}
                    placeholder="Contoh: 081234567890"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-900 focus:ring-1 focus:ring-primary-600 focus:border-primary-600 focus:outline-none transition-all placeholder:text-slate-400"
                    disabled={isAuthenticating}
                  />
                </div>
              </div>
              
              <button
                type="submit"
                disabled={isAuthenticating}
                className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                  isAuthenticating 
                    ? 'bg-white text-slate-500 cursor-not-allowed border border-slate-300' 
                    : 'bg-primary-600 hover:bg-primary-700 text-white shadow-lg lg:hover:shadow-primary-500/20 border border-primary-600/50'
                }`}
              >
                {isAuthenticating ? (
                  <><div className="w-5 h-5 border-2 border-slate-500 border-t-transparent rounded-full animate-spin"></div> Memproses...</>
                ) : (
                  <><LogIn size={18} /> Masuk Portal</>
                )}
              </button>
            </form>
            
            
            <div className="mt-8 text-center">
              <div className="p-4 bg-white/50 rounded-xl border border-slate-300/50">
                <p className="text-xs text-slate-400 font-medium mb-2">Simulasi Akun (Pilih salah satu nomor):</p>
                <ul className="text-xs text-slate-500 text-left font-mono space-y-1">
                  <li>- 081234567890 (Budi Santoso)</li>
                  <li>- 085712312312 (Siti Aminah - Offline/Unpaid)</li>
                  <li>- 081122334455 (Rina Kusumawati - Overdue)</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto space-y-6">
      {showNotification && (
        <div className="bg-emerald-500/10 border border-emerald-500/50 text-emerald-600 px-4 py-3 rounded-2xl flex items-center gap-3 shadow-lg mb-6 animate-in fade-in slide-in-from-top-4">
          <ShieldCheck size={20} />
          <p className="text-sm font-medium">{showNotification}</p>
        </div>
      )}

      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200 p-6 md:p-8 rounded-3xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <WifiHigh size={120} />
        </div>
        <div>
          <p className="text-slate-400 text-sm mb-1 uppercase tracking-wider">Selamat Datang,</p>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900">{customer.name}</h2>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs font-mono bg-slate-50 px-2 py-1 rounded-md text-slate-400 border border-slate-200">ID: {customer.id}</span>
            <span className={`text-xs px-2 py-1 rounded-md mb-0 font-medium ${customer.status === 'online' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-600 border border-rose-500/20'}`}>
               {customer.status === 'online' ? 'Internet Aktif' : 'Internet Terputus'}
            </span>
          </div>
        </div>
        <div className="flex flex-col md:flex-row md:items-center gap-4 relative z-10 w-full md:w-auto">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 min-w-[200px]">
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-mono mb-1">Paket Aktif</p>
            <div className="text-2xl font-bold text-primary-600">{customer.speedPlan}</div>
            <p className="text-[10px] text-slate-500 font-mono mt-1">Siklus: Tgl 10 Setiap Bulan</p>
          </div>
          <button 
            onClick={handleLogout}
            className="px-4 py-2 bg-white hover:bg-rose-500/10 text-slate-700 hover:text-rose-600 border border-slate-300 hover:border-rose-500/20 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 h-full"
          >
            Log Out
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Billing Widget */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 md:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2 text-slate-700">
                <CreditCard size={18} className="text-primary-600" />
                <h3 className="text-sm font-semibold uppercase tracking-wider">Tagihan Bulan Ini</h3>
              </div>
              {customer.paymentStatus === 'overdue' && (
                <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-rose-500/20 text-rose-600 px-3 py-1 rounded-lg border border-rose-500/30">
                  <AlertCircle size={14} /> Terlambat
                </span>
              )}
            </div>
            
            {customer.paymentStatus === 'paid' ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-emerald-500/10 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
                  <ShieldCheck size={32} />
                </div>
                <h4 className="text-lg font-bold text-emerald-600 mb-2">Tagihan Lunas</h4>
                <p className="text-sm text-slate-400">Terima kasih atas pembayaran Anda untuk periode ini.</p>
              </div>
            ) : (
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-200">
                <div>
                  <p className="text-slate-400 text-sm mb-1 text-bold">Total Tagihan</p>
                  <p className="text-4xl font-bold text-slate-900">{formatCurrency(customer.billingAmount)}</p>
                  <div className="flex items-center gap-2 mt-3">
                    <span className={`flex items-center gap-1 text-[10px] uppercase font-mono px-2 py-1 rounded-md border ${
                      customer.paymentStatus === 'overdue' 
                        ? 'text-rose-600 bg-rose-500/10 border-rose-500/20' 
                        : 'text-amber-600 bg-amber-500/10 border-amber-500/20'
                    }`}>
                      <Clock size={12} /> Jatuh Tempo: 10 {new Date().toLocaleString('id-ID', { month: 'long' })}
                    </span>
                  </div>
                </div>
                <button 
                  onClick={handlePay}
                  disabled={isPaying}
                  className={`w-full md:w-auto px-6 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                    isPaying ? 'bg-primary-600/50 cursor-not-allowed text-white' : 'bg-primary-600 hover:bg-primary-700 text-white shadow-lg lg:hover:shadow-primary-500/20'
                  }`}
                >
                  {isPaying ? (
                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Memproses...</>
                  ) : (
                    'Bayar Sekarang'
                  )}
                </button>
              </div>
            )}
          </div>
          
          <div className="mt-6 pt-4">
             <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">Riwayat Pembayaran Terbaru</h4>
             <div className="space-y-3">
               <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-lg">
                      <FileText size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-800">Tagihan Bulan Sebelumnya</p>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">INV-CUST-{customer.id.split('-')[1]}-98765 • {customer.lastPaymentDate ? formatDateTime(customer.lastPaymentDate) : ''}</p>
                    </div>
                  </div>
                  <div className="text-right">
                     <p className="text-xs font-bold text-slate-700">{formatCurrency(customer.billingAmount)}</p>
                     <p className="text-[10px] text-emerald-600 flex items-center gap-1 justify-end font-mono mt-0.5"><ShieldCheck size={10} /> Sukses</p>
                  </div>
               </div>
             </div>
          </div>
        </div>

        {/* Info & Status Widget */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6">
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4 border-b border-slate-200 pb-3">Informasi Teknis</h3>
            <div className="space-y-4">
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono mb-1">Status Koneksi</p>
                <div className="flex items-center gap-2">
                  {customer.status === 'online' ? (
                     <><WifiHigh size={16} className="text-emerald-600" /> <span className="text-sm font-medium text-emerald-600">Online</span></>
                  ) : (
                     <><WifiOff size={16} className="text-rose-600" /> <span className="text-sm font-medium text-rose-600">Offline</span></>
                  )}
                </div>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono mb-1">SN ONT (Serial Number)</p>
                <p className="text-sm font-mono text-slate-700">{customer.ontSerialNumber || '-'}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono mb-1">Redaman ONT (Optical Power)</p>
                <p className={`text-sm font-mono ${customer.status === 'online' ? 'text-emerald-600' : 'text-slate-500'}`}>
                  {customer.status === 'online' ? (customer.ontRxPower || '-21.0 dBm') : '-'}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono mb-1">IP Address (Publik)</p>
                <p className="text-sm font-mono text-slate-700">{customer.ipAddress}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono mb-1">Uptime Perangkat</p>
                <p className="text-sm font-mono text-slate-700">{customer.uptime}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-3xl p-6 text-white shadow-lg shadow-amber-500/20 relative overflow-hidden text-center md:text-left">
             <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>
             <h3 className="text-sm font-bold uppercase tracking-wider mb-2 relative z-10 flex items-center justify-center md:justify-start gap-2">
                <Gift size={16} /> Upgrade Paket
             </h3>
             <p className="text-xs text-amber-100 mb-4 relative z-10">
               Internet terasa kurang cepat? Upgrade speed Anda secara instan dan rasakan ngebutnya.
             </p>
             <button 
               onClick={() => setShowUpgradeModal(true)}
               className="w-full py-2.5 px-4 bg-white text-amber-600 rounded-xl font-bold text-xs uppercase tracking-wide transition-all shadow hover:shadow-lg relative z-10"
             >
               Lihat Katalog
             </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-6">
             <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4 border-b border-slate-200 pb-3">Bantuan & Dukungan</h3>
             <p className="text-xs text-slate-400 mb-4 leading-relaxed">
               Mengalami kendala koneksi atau punya pertanyaan seputar tagihan?
             </p>
             <a 
               href="https://wa.me/6282124812114"
               target="_blank"
               rel="noopener noreferrer"
               className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-700 hover:border-slate-600 text-slate-800 text-sm font-medium transition-colors"
             >
               <MessageSquare size={16} /> Hubungi CS Kami
             </a>
             <a 
               href="https://wa.me/6282124812114?text=Halo%20Admin,%20saya%20ingin%20mengajukan%20berhenti%20berlangganan%20layanan%20internet."
               target="_blank"
               rel="noopener noreferrer"
               className="w-full flex items-center justify-center gap-2 mt-3 px-4 py-2.5 rounded-xl border border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 text-sm font-medium transition-colors"
             >
               <PowerOff size={16} /> Putus Berlangganan
             </a>
          </div>
        </div>
      </div>

      {/* Referral Widget */}
      <div className="mt-6 flex flex-col md:flex-row gap-6">
         <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-3xl p-6 md:p-8 text-white shadow-xl shadow-indigo-500/20 w-full relative overflow-hidden flex flex-col justify-center">
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-white opacity-10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-400 opacity-20 rounded-full blur-2xl"></div>
            <div className="relative z-10">
               <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/20">
                     <Gift size={24} className="text-indigo-200" />
                  </div>
                  <div>
                     <h2 className="text-xl md:text-2xl font-extrabold tracking-tight">Program Referral</h2>
                     <p className="text-indigo-200 text-sm">Ajak tetangga, dapatkan diskon tagihan!</p>
                  </div>
               </div>
               <p className="text-indigo-100 font-medium opacity-90 text-sm md:text-base mb-6 max-w-2xl">
                 Setiap kali ada tetangga atau kerabat yang berlangganan dan aktif menggunakan link Anda, Anda berdua akan mendapatkan <strong className="text-white bg-indigo-500/50 px-2 py-0.5 rounded">Potongan Rp 50.000</strong> untuk tagihan bulan depan.
               </p>
               
               <div className="bg-white/10 backdrop-blur-sm p-4 text-center md:text-left rounded-2xl border border-white/20 flex flex-col sm:flex-row items-center gap-3 md:w-max">
                  <div className="flex items-center gap-2 px-4 py-2 bg-indigo-900/50 rounded-xl font-mono text-sm md:text-base break-all w-full md:w-auto">
                     <LinkIcon size={16} className="text-indigo-300 shrink-0" />
                     <span className="opacity-90 tracking-wider">https://{branding?.domain || 'portal.ispkita.com'}/daftar?ref={customer.id.replace('CUST-','')}</span>
                  </div>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(`https://${branding?.domain || 'portal.ispkita.com'}/daftar?ref=${customer.id.replace('CUST-','')}`);
                      alert('Link berhasil disalin!');
                    }}
                    className="bg-white text-indigo-700 hover:bg-slate-100 px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-colors w-full sm:w-auto justify-center shadow-lg transform hover:-translate-y-0.5"
                  >
                    <Copy size={16} /> Salin Link
                  </button>
               </div>
            </div>
         </div>
      </div>

      {/* Payment Simulation Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                <Wallet className="text-primary-600" size={20} /> Pembayaran QRIS
              </h3>
              <button 
                onClick={() => setShowPaymentModal(false)} 
                className="text-slate-400 hover:text-slate-600 transition-colors"
                disabled={isPaying}
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6">
              <div className="text-center mb-6">
                <p className="text-sm text-slate-500 font-medium">Total Tagihan:</p>
                <p className="text-3xl font-extrabold text-slate-800">{formatCurrency(customer?.billingAmount || 0)}</p>
                <p className="text-xs text-slate-400 mt-1">ID: INV-{customer?.id}-{Date.now().toString().slice(-4)}</p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col items-center justify-center mb-6 aspect-square">
                {/* Mock QR Code Pattern */}
                <div className="w-full h-full bg-white relative p-3 border border-slate-100 rounded-xl flex items-center justify-center shadow-sm">
                   <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-slate-800 rounded-tl-lg m-2"></div>
                   <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-slate-800 rounded-tr-lg m-2"></div>
                   <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-slate-800 rounded-bl-lg m-2"></div>
                   <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-slate-800 rounded-br-lg m-2"></div>
                   
                   <div className="w-[80%] h-[80%]">
                     <div className="w-full h-full grid grid-cols-4 grid-rows-4 gap-1">
                        {[...Array(16)].map((_, i) => (
                           <div key={i} className={`bg-slate-800 ${i % 3 === 0 || i % 7 === 0 ? 'opacity-0' : 'opacity-100'}`}></div>
                        ))}
                     </div>
                   </div>
                   
                   {/* Center Overlay */}
                   <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-1 rounded">
                      <span className="text-slate-900 font-bold text-sm tracking-widest px-1">QRIS</span>
                   </div>
                </div>
              </div>
              
              <div className="flex flex-col gap-3">
                 <button 
                  onClick={handleMockPayment}
                  disabled={isPaying}
                  className={`w-full py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                    isPaying ? 'bg-primary-600/50 cursor-not-allowed text-white' : 'bg-primary-600 hover:bg-primary-700 text-white shadow-lg shadow-primary-500/20'
                  }`}
                 >
                   {isPaying ? (
                      <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Memproses...</>
                   ) : (
                      <><CheckCircle2 size={18} /> Konfirmasi Pembayaran</>
                   )}
                 </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upgrade Catalog Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                 <h3 className="font-bold text-lg text-slate-800">Katalog Layanan</h3>
                 <p className="text-xs text-slate-500 mt-0.5">Pilih paket untuk request upgrade</p>
              </div>
              <button 
                onClick={() => setShowUpgradeModal(false)} 
                className="text-slate-400 hover:text-slate-600 p-2"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {(branding?.packages || getInternetPackages()).map((plan: any) => (
                 <div key={plan.name} className="border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:border-indigo-300 hover:shadow-md">
                    <div>
                       <h4 className="font-bold text-lg text-slate-900">{plan.name}</h4>
                       <p className="text-xs font-semibold text-slate-500 mt-0.5 mb-1">{formatCurrency(plan.price)} / bulan</p>
                       <p className="text-[10px] text-slate-400 font-mono bg-slate-100 px-2 py-0.5 rounded inline-block">{plan.desc}</p>
                    </div>
                    {customer.speedPlan === plan.name ? (
                       <button disabled className="px-4 py-2 bg-slate-100 text-slate-400 font-bold text-xs rounded-xl cursor-not-allowed">Paket Saat Ini</button>
                    ) : (
                       <button 
                         onClick={() => handleRequestUpgrade(plan.name)}
                         disabled={isRequestingUpgrade}
                         className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50"
                       >
                         {isRequestingUpgrade ? 'Memproses...' : 'Request Upgrade'}
                       </button>
                    )}
                 </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

