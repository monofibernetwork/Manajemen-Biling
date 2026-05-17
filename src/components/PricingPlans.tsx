import React, { useState } from 'react';
import { Check, X, Shield, Zap, Building, ArrowRight, CheckCircle2, Loader2, QrCode, CreditCard } from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

export function PricingPlans() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [checkoutModal, setCheckoutModal] = useState<{ isOpen: boolean; step: number; plan: any }>({ isOpen: false, step: 1, plan: null });
  const [formData, setFormData] = useState({ ispName: '', email: '', phone: '' });
  const [isProcessing, setIsProcessing] = useState(false);

  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      target: 'RT/RW Net Pemula',
      priceMonthly: 100000,
      priceYearly: 1000000, // 2 months free
      period: '/ bulan',
      icon: Shield,
      color: 'bg-white text-slate-800 border-slate-200 hover:border-emerald-300 hover:shadow-lg',
      iconBg: 'bg-emerald-100 text-emerald-600',
      btnColor: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200',
      popular: false,
      features: [
        { name: 'Maks. 150 Pelanggan Aktif', included: true, tooltip: 'Cocok untuk jangkauan 1-3 RT lokal' },
        { name: 'Integrasi Mikrotik Via API', included: true },
        { name: 'Manajemen Tagihan Dasar', included: true },
        { name: 'Peta ODP & Mapple Perangkat', included: true },
        { name: 'Broadcast WA (Manual)', included: true },
        { name: 'Portal Member Dasar', included: true },
        { name: 'Integrasi GenieACS (TR-069)', included: false },
        { name: 'Payment Gateway Otomatis', included: false },
        { name: 'Aplikasi Mobile Teknisi', included: false },
      ]
    },
    {
      id: 'pro',
      name: 'Pro',
      target: 'Terbaik Untuk ISP Berkembang',
      priceMonthly: 200000,
      priceYearly: 2000000,
      period: '/ bulan',
      icon: Zap,
      color: 'bg-gradient-to-b from-primary-900 to-slate-900 text-white border-primary-500 shadow-2xl scale-105 z-10',
      iconBg: 'bg-white/20 text-white',
      btnColor: 'bg-primary-500 hover:bg-primary-600 text-white border-none shadow-lg shadow-primary-500/30',
      popular: true,
      features: [
        { name: 'Maks. 500 Pelanggan Aktif', included: true, tooltip: 'Dapat menampung 2.5x lipat lebih banyak dari kompetitor di harga yang sama' },
        { name: 'Integrasi Mikrotik Via API', included: true },
        { name: 'Integrasi GenieACS (TR-069)', included: true },
        { name: 'Auto WA Gateway & Notifikasi', included: true, tooltip: 'Kirim notif tagihan & isolir 100% otomatis, tidak perlu klik manual' },
        { name: 'Loket Kasir & Komisi (No Limit)', included: true, tooltip: 'Tanpa batasan jumlah loket agen/reseller' },
        { name: 'Payment Gateway (Otomatis)', included: true },
        { name: 'Modul Tiket + SPK Teknisi', included: true },
        { name: 'Bandwidth on Demand & Absensi', included: true },
        { name: 'Aplikasi Mobile Khusus', included: false },
      ]
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      target: 'ISP Besar & Corporate',
      priceMonthly: 450000,
      priceYearly: 4500000,
      period: '/ bulan',
      icon: Building,
      color: 'bg-white text-slate-800 border-slate-200 hover:border-slate-400 hover:shadow-lg',
      iconBg: 'bg-slate-100 text-slate-600',
      btnColor: 'bg-slate-900 hover:bg-slate-800 text-white',
      popular: false,
      features: [
        { name: 'Pelanggan Tidak Terbatas', included: true, tooltip: 'Hanya dibatasi oleh kemampuan server' },
        { name: 'Semua Fitur Paket Pro', included: true },
        { name: 'Server Database Dedicated', included: true },
        { name: 'Monitoring CCTV & Security', included: true },
        { name: 'Aplikasi Mobile Whitelabel', included: true, tooltip: 'Aplikasi Android/iOS dengan Logo Usaha Anda' },
        { name: 'Custom Branding (Nama & Logo)', included: true },
        { name: 'Custom Domain Pribadi', included: true },
        { name: 'Prioritas Support VIP 24/7', included: true },
        { name: 'Migrasi Data Gratis', included: true },
      ]
    }
  ];

  const formatPrice = (price: number) => {
    return price.toLocaleString('id-ID');
  };

  const handleSelectPlan = (plan: any) => {
    setCheckoutModal({ isOpen: true, step: 1, plan });
  };

  const handleSimulatePayment = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setCheckoutModal(prev => ({ ...prev, step: 3 })); // Ke halaman sukses
    }, 2500);
  };

  const handleProvisionTenant = async () => {
    setIsProcessing(true);
    try {
      const generatedTenantId = formData.ispName.toLowerCase().replace(/[^a-z0-9]/g, '');
      const newTenantId = generatedTenantId || 'tenant' + Date.now();
      
      // Simpan data admin sementara untuk tenant baru (Bypass auth untuk demo)
      await setDoc(doc(db, 'system_users', formData.email || `admin@${newTenantId}.com`), {
        email: formData.email || `admin@${newTenantId}.com`,
        role: 'superadmin',
        tenantId: newTenantId,
        validUntil: Date.now() + 30 * 24 * 60 * 60 * 1000 // +30 Hari
      });

      // Simpan branding default khusus tenant
      await setDoc(doc(db, 'branding', newTenantId), {
        businessName: formData.ispName || 'My ISP',
        primaryColorHex: '#ea580c'
      });

      // Alihkan ke URL tenant baru
      window.location.href = `/?tenant=${newTenantId}`;
    } catch (err) {
      console.error("Setup tenant gagal", err);
      alert("Terjadi kesalahan saat memproses data.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-10 py-12 px-4 sm:px-6 lg:px-8">
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <h2 className="text-sm font-bold tracking-widest text-primary-600 uppercase">Investasi Sistem ISP</h2>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
          Lebih Canggih. <br className="sm:hidden" /> Harga Masuk Akal.
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          Dapatkan fitur Enterprise tanpa harus membayar mahal. Mulai dari pemula hingga ISP raksasa, semua butuh tool profesional.
        </p>

        <div className="flex justify-center items-center mt-8 space-x-4">
          <span className={`text-sm font-semibold ${billingCycle === 'monthly' ? 'text-slate-900' : 'text-slate-500'}`}>Bulanan</span>
          <button 
            onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
            className="relative w-16 h-8 flex items-center bg-primary-100 rounded-full p-1 cursor-pointer"
          >
            <div className={`w-6 h-6 bg-primary-600 rounded-full shadow-md transform transition-transform duration-300 ${billingCycle === 'yearly' ? 'translate-x-8' : ''}`} />
          </button>
          <span className={`text-sm font-semibold flex items-center gap-2 ${billingCycle === 'yearly' ? 'text-slate-900' : 'text-slate-500'}`}>
            Tahunan
            <span className="bg-emerald-100 text-emerald-700 text-[10px] uppercase font-bold py-0.5 px-2 rounded-full hidden sm:inline-block">Hemat 2 Bulan</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-4 lg:gap-8 items-center mt-16 pb-10">
        {plans.map((plan, i) => {
          const isDark = plan.name === 'Pro';
          const price = billingCycle === 'monthly' ? plan.priceMonthly : plan.priceYearly;

          return (
            <div key={i} className={`relative flex flex-col p-8 rounded-[2rem] border ${plan.color} transition-all duration-300`}>
              {plan.popular && (
                <div className="absolute -top-4 left-0 right-0 flex justify-center">
                  <span className="bg-gradient-to-r from-orange-400 to-rose-500 text-white text-[11px] font-bold uppercase tracking-widest py-1.5 px-4 rounded-full shadow-lg border border-white/20">
                    Pilihan Favorit
                  </span>
                </div>
              )}
              
              <div className="flex gap-4 items-center mb-6">
                <div className={`p-4 rounded-2xl ${plan.iconBg}`}>
                  <plan.icon size={24} />
                </div>
                <div>
                  <h3 className={`text-2xl font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>{plan.name}</h3>
                  <p className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-500'}`}>{plan.target}</p>
                </div>
              </div>
              
              <div className="my-2 flex flex-col items-start">
                <div className="flex items-end">
                  <span className={`text-4xl lg:text-5xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Rp {formatPrice(price)}
                  </span>
                  <span className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-500'} ml-1 font-medium mb-1`}>
                    {billingCycle === 'monthly' ? '/ bulan' : '/ tahun'}
                  </span>
                </div>
                {billingCycle === 'yearly' && (
                  <div className="mt-2 text-emerald-600 text-sm font-bold bg-emerald-500/10 px-3 py-1.5 rounded-full inline-block border border-emerald-500/20">
                    Hemat Rp {formatPrice(plan.priceMonthly * 12 - plan.priceYearly)}
                  </div>
                )}
              </div>

              <div className="mt-8 mb-8">
                <button 
                  onClick={() => handleSelectPlan(plan)}
                  className={`w-full py-4 rounded-2xl font-bold transition-all duration-200 flex justify-center items-center gap-2 ${plan.btnColor}`}
                >
                  Saya Mau {plan.name} <ArrowRight size={18} />
                </button>
              </div>

              <div className="space-y-4 flex-1">
                <p className={`text-xs font-bold uppercase tracking-wider mb-4 ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>
                  Fitur Utama:
                </p>
                {plan.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3 group">
                    <div className={`mt-0.5 shrink-0 ${feature.included ? (isDark ? 'text-emerald-400' : 'text-emerald-500') : (isDark ? 'text-slate-600' : 'text-slate-300')}`}>
                      {feature.included ? <Check size={18} strokeWidth={3} /> : <X size={18} strokeWidth={3} />}
                    </div>
                    <div className="flex-1">
                      <span className={`text-sm font-medium ${feature.included ? (isDark ? 'text-slate-100' : 'text-slate-700') : (isDark ? 'text-slate-500 line-through' : 'text-slate-400 line-through')}`}>
                        {feature.name}
                      </span>
                      {feature.tooltip && feature.included && (
                        <p className={`text-[11px] leading-tight mt-1 ${isDark ? 'text-primary-200' : 'text-slate-500'}`}>
                          {feature.tooltip}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Comparison Text */}
      <div className="mt-12 bg-rose-50 border border-rose-100 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
         <div className="flex-1">
           <h3 className="text-xl font-bold text-slate-800 mb-2">Mengapa lebih menguntungkan?</h3>
           <p className="text-slate-600">
             Jika Anda membandingkan, kompetitor kami mungkin mengenakan biaya <strong>Rp 200.000</strong> hanya untuk <strong>200 Pelanggan</strong> dengan fitur loket kasir dan notifikasi terbatas.
             Dengan paket <strong>Pro</strong> kami, di harga yang sama Anda sudah bisa menampung hingga <strong>500 Pelanggan</strong> dengan fitur Auto WA Gateway terintegrasi penuh dan <strong>Tanpa Batas Loket Kasir</strong>.
           </p>
         </div>
         <div className="shrink-0">
           <button className="px-6 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl shadow-sm hover:bg-slate-50 transition-colors">
              Konsultasi via WA
           </button>
         </div>
      </div>

      {/* Checkout / Registration Modal */}
      {checkoutModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col md:flex-row h-[90vh] md:h-auto">
            
            {/* Left Sidebar Info */}
            <div className="bg-slate-50 p-8 md:w-2/5 border-r border-slate-100 hidden md:flex flex-col">
              <div className="mb-8">
                <span className="bg-primary-100 text-primary-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">Order Summary</span>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Paket {checkoutModal.plan?.name}</h3>
              <p className="text-slate-500 text-sm mb-6">{billingCycle === 'monthly' ? 'Langganan Bulanan' : 'Langganan Tahunan'}</p>
              
              <div className="mt-auto space-y-4">
                <div className="flex justify-between items-center pb-4 border-b border-slate-200">
                  <span className="text-slate-600">Subtotal</span>
                  <span className="font-semibold text-slate-900">Rp {formatPrice(billingCycle === 'monthly' ? checkoutModal.plan?.priceMonthly : checkoutModal.plan?.priceYearly)}</span>
                </div>
                <div className="flex justify-between items-center pb-4 border-b border-slate-200">
                  <span className="text-slate-600">PPN 11%</span>
                  <span className="font-semibold text-slate-900">Rp {formatPrice((billingCycle === 'monthly' ? checkoutModal.plan?.priceMonthly : checkoutModal.plan?.priceYearly) * 0.11)}</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="font-bold text-slate-900">Total</span>
                  <span className="text-2xl font-extrabold text-primary-600">Rp {formatPrice((billingCycle === 'monthly' ? checkoutModal.plan?.priceMonthly : checkoutModal.plan?.priceYearly) * 1.11)}</span>
                </div>
              </div>
            </div>

            {/* Right Registration Flow */}
            <div className="p-8 md:w-3/5 relative flex-1 overflow-y-auto">
              <button 
                onClick={() => setCheckoutModal({ isOpen: false, step: 1, plan: null })}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 bg-slate-50 rounded-full"
              >
                <X size={20} />
              </button>

              {checkoutModal.step === 1 && (
                <div className="animate-in fade-in slide-in-from-right-4">
                  <h3 className="text-xl font-bold text-slate-900 mb-1">Mulai Setup Sistem Anda</h3>
                  <p className="text-sm text-slate-500 mb-6">Lengkapi data profil bisnis ISP atau RT/RW Net Anda.</p>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Nama Bisnis / ISP</label>
                      <input 
                        type="text" 
                        placeholder="Contoh: Netizen Berkah" 
                        value={formData.ispName}
                        onChange={e => setFormData({...formData, ispName: e.target.value})}
                        className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-primary-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Alamat Email</label>
                      <input 
                        type="email" 
                        placeholder="admin@netizen.com" 
                        value={formData.email}
                        onChange={e => setFormData({...formData, email: e.target.value})}
                        className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-primary-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Nomor WhatsApp</label>
                      <input 
                        type="tel" 
                        placeholder="08123456789" 
                        value={formData.phone}
                        onChange={e => setFormData({...formData, phone: e.target.value})}
                        className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-primary-500 transition-colors"
                      />
                    </div>
                  </div>

                  <button 
                    disabled={!formData.ispName || !formData.email}
                    onClick={() => setCheckoutModal(prev => ({ ...prev, step: 2 }))}
                    className="w-full mt-8 bg-primary-600 hover:bg-primary-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-colors flex justify-center items-center gap-2"
                  >
                    Lanjutkan ke Pembayaran
                  </button>
                </div>
              )}

              {checkoutModal.step === 2 && (
                <div className="animate-in fade-in slide-in-from-right-4">
                  <h3 className="text-xl font-bold text-slate-900 mb-1">Metode Pembayaran (Demo)</h3>
                  <p className="text-sm text-slate-500 mb-6">Sistem akan secara otomatis memverifikasi pembayaran Anda.</p>
                  
                  <div className="space-y-3 mb-8">
                    <label className="flex items-center justify-between p-4 border-2 border-primary-500 bg-primary-50 rounded-xl cursor-pointer">
                      <div className="flex items-center gap-3">
                        <QrCode className="text-primary-600" />
                        <span className="font-bold text-slate-900">QRIS (Otomatis)</span>
                      </div>
                      <input type="radio" name="payment" defaultChecked className="w-5 h-5 text-primary-600" />
                    </label>
                    <label className="flex items-center justify-between p-4 border-2 border-slate-200 opacity-50 cursor-not-allowed rounded-xl">
                      <div className="flex items-center gap-3">
                        <CreditCard className="text-slate-400" />
                        <span className="font-bold text-slate-500">Virtual Account Bank</span>
                      </div>
                      <input type="radio" name="payment" disabled className="w-5 h-5" />
                    </label>
                  </div>

                  <div className="bg-slate-50 p-6 rounded-2xl flex flex-col items-center justify-center text-center">
                    <QrCode size={120} className="text-slate-800 mb-4 opacity-30" />
                    <p className="text-xs text-slate-500 mb-4">Simulasi: Anggap Anda sudah scan & bayar dummy ini.</p>
                  </div>

                  <div className="flex gap-3 mt-8">
                    <button 
                      disabled={isProcessing}
                      onClick={() => setCheckoutModal(prev => ({ ...prev, step: 1 }))}
                      className="w-1/3 border-2 border-slate-200 text-slate-600 font-bold py-4 rounded-xl hover:bg-slate-50 transition-colors"
                    >
                      Kembali
                    </button>
                    <button 
                      disabled={isProcessing}
                      onClick={handleSimulatePayment}
                      className="w-2/3 bg-slate-900 hover:bg-black text-white font-bold py-4 rounded-xl transition-colors flex justify-center items-center gap-2"
                    >
                      {isProcessing ? <><Loader2 className="animate-spin" /> Memproses...</> : 'Simulasikan Pembayaran'}
                    </button>
                  </div>
                </div>
              )}

              {checkoutModal.step === 3 && (
                <div className="animate-in zoom-in-95 h-full flex flex-col items-center justify-center text-center px-4">
                  <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle2 size={40} className="text-emerald-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">Pembayaran Berhasil!</h3>
                  <p className="text-slate-500 mb-8 max-w-sm">
                    Terima kasih! Kami sedang menyiapkan database & sistem khusus untuk <strong>{formData.ispName}</strong>.
                  </p>

                  <div className="w-full bg-slate-50 rounded-xl p-4 mb-8 text-left">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Informasi Login Anda:</p>
                    <p className="text-sm font-mono text-slate-800">Email: {formData.email}</p>
                    <p className="text-[10px] text-emerald-600 mt-2">Akses ke tenant spesifik akan segera dibuka.</p>
                  </div>

                  <button 
                    disabled={isProcessing}
                    onClick={handleProvisionTenant}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl transition-colors flex justify-center items-center gap-2"
                  >
                    {isProcessing ? <><Loader2 className="animate-spin" /> Menyiapkan Dashboard...</> : 'Buka Dashboard Saya'}
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
