import React, { useState } from 'react';
import { FileText, ChevronDown, Calendar, CreditCard, UploadCloud, Send, Receipt, History, Image as ImageIcon, Info } from 'lucide-react';
import { formatDateTime, formatDate } from '../lib/formatDate';

export function PaymentVerification({ customers = [] }: { customers?: any[] }) {
  const [selectedCustomer, setSelectedCustomer] = useState('');

  const [billingPeriod, setBillingPeriod] = useState('');
  const [amount, setAmount] = useState('150.000');
  const [paymentMethod, setPaymentMethod] = useState('');

  const selectedCustomerData = customers?.find(c => c.id === selectedCustomer);

  React.useEffect(() => {
    if (selectedCustomerData) {
       setAmount(selectedCustomerData.billingAmount.toLocaleString('id-ID'));
    }
  }, [selectedCustomerData]);

  return (
    <div className="max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold font-sans text-slate-900 mb-1">Konfirmasi Pembayaran</h2>
        <p className="text-sm text-slate-500">Laporkan bukti pembayaran bulanan untuk verifikasi administrasi RT/RW Net.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Form Section */}
        <div className="lg:col-span-7">
          <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
              <Receipt className="text-primary-600" size={24} />
              <h3 className="text-lg font-bold text-slate-800">Detail Pembayaran</h3>
            </div>
            
            <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-widest">Nama Pelanggan / ID</label>
                  <div className="relative">
                    <select 
                      value={selectedCustomer}
                      onChange={(e) => setSelectedCustomer(e.target.value)}
                      className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 appearance-none transition-colors outline-none"
                    >
                      <option value="" disabled>Pilih Pelanggan...</option>
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>{c.name} ({c.id})</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-3.5 text-slate-400 pointer-events-none" size={18} />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-widest">Periode Tagihan</label>
                  <div className="relative">
                    <select 
                      value={billingPeriod}
                      onChange={(e) => setBillingPeriod(e.target.value)}
                      className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:ring-2 focus:ring-primary-500 border-primary-500 appearance-none transition-colors outline-none"
                    >
                      <option value="" disabled>Pilih Periode...</option>
                      <option value="Oktober 2023">Oktober 2023</option>
                      <option value="September 2023">September 2023</option>
                      <option value="Agustus 2023">Agustus 2023</option>
                    </select>
                    <Calendar className="absolute right-4 top-3.5 text-slate-400 pointer-events-none" size={18} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-widest">Jumlah Pembayaran</label>
                  <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl overflow-hidden focus-within:ring-2 border-primary-500 focus-within:border-primary-500 transition-colors">
                    <span className="bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-500 border-r border-slate-200">IDR</span>
                    <input 
                      type="text" 
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full bg-slate-50 border-none px-4 py-3 text-sm font-bold text-primary-700 focus:ring-0 outline-none" 
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-widest">Metode Pembayaran</label>
                  <div className="relative">
                    <select 
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 appearance-none transition-colors outline-none"
                    >
                      <option value="" disabled>Pilih Metode...</option>
                      <option value="Transfer Bank BCA">Transfer Bank BCA</option>
                      <option value="Transfer Bank Mandiri">Transfer Bank Mandiri</option>
                      <option value="E-Wallet (Dana/OVO/QRIS)">E-Wallet (Dana/OVO/QRIS)</option>
                      <option value="Tunai / Cash">Tunai / Cash</option>
                    </select>
                    <CreditCard className="absolute right-4 top-3.5 text-slate-400 pointer-events-none" size={18} />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-widest">Unggah Bukti</label>
                <div className="group relative border-2 border-dashed border-slate-300 rounded-2xl p-12 flex flex-col items-center justify-center bg-slate-50 hover:bg-primary-50/50 hover:border-primary-400 transition-all cursor-pointer">
                  <div className="w-16 h-16 rounded-full bg-slate-200/50 group-hover:bg-primary-100 flex items-center justify-center mb-4 text-slate-400 group-hover:text-primary-600 transition-colors">
                    <UploadCloud size={32} />
                  </div>
                  <p className="text-sm font-semibold text-slate-700 mb-1 text-center">Klik atau tarik file ke sini</p>
                  <p className="text-xs text-slate-500 text-center font-mono">JPG, PNG atau PDF (Maks. 5MB)</p>
                  <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" />
                </div>
              </div>

              <div className="pt-4">
                <button 
                  type="submit"
                  className="w-full bg-primary-600 hover:bg-primary-700 text-white shadow-lg shadow-primary-500/20 py-4 rounded-xl font-bold text-sm tracking-wide transition-all transform hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-2"
                >
                  <Send size={18} />
                  KIRIM KONFIRMASI
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right: Summary & History Section */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Quick Summary Card */}
          <div className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm relative">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-700 to-indigo-800 opacity-90 h-32"></div>
            <div className="relative h-32 p-6 flex flex-col justify-end">
              <p className="text-primary-100 font-mono text-[10px] uppercase tracking-widest">Informasi Tagihan</p>
              <h3 className="text-white text-xl font-bold mt-1">
                {selectedCustomerData ? `Layanan Internet - ${selectedCustomerData.speedPlan}` : 'Pilih Pelanggan'}
              </h3>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <span className="text-slate-500 text-sm">Status Layanan</span>
                {selectedCustomerData ? (
                  <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg flex items-center gap-1.5 border ${
                    selectedCustomerData.status === 'online' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                    selectedCustomerData.status === 'isolir' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                    'bg-slate-50 text-slate-700 border-slate-200'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      selectedCustomerData.status === 'online' ? 'bg-emerald-500' : 
                      selectedCustomerData.status === 'isolir' ? 'bg-rose-500' : 'bg-slate-500'
                    }`}></span>
                    {selectedCustomerData.status}
                  </span>
                ) : (
                   <span className="text-slate-400 text-sm">-</span>
                )}
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <span className="text-slate-500 text-sm">Terakhir Bayar</span>
                <span className="text-slate-800 text-sm font-semibold">
                  {selectedCustomerData?.lastPaymentDate ? formatDate(selectedCustomerData.lastPaymentDate) : '-'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 text-sm">Tagihan Saat Ini</span>
                <span className={`font-bold text-lg ${!selectedCustomerData || selectedCustomerData.paymentStatus === 'paid' ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {selectedCustomerData ? (selectedCustomerData.paymentStatus === 'unpaid' || selectedCustomerData.paymentStatus === 'overdue' ? `Rp ${selectedCustomerData.billingAmount.toLocaleString('id-ID')}` : 'Rp 0') : '-'}
                </span>
              </div>
            </div>
          </div>

          {/* History Table */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 flex-grow shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <History className="text-primary-600" size={20} />
                <h3 className="text-base font-bold text-slate-800">Riwayat Konfirmasi</h3>
              </div>
              <a href="#" className="text-xs font-semibold text-primary-600 hover:text-primary-700 hover:underline">Lihat Semua</a>
            </div>
            
            <div className="space-y-3 flex-grow">
              {/* Item 1 */}
              <div className="flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center border border-slate-200 text-slate-400">
                    <ImageIcon size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">Tagihan Oktober</p>
                    <p className="text-[10px] font-mono text-slate-500 mt-0.5">{formatDateTime('2023-10-15T14:20:00')}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-800">Rp 150.000</p>
                  <p className="text-[9px] font-bold text-amber-600 uppercase tracking-widest mt-0.5">Menunggu</p>
                </div>
              </div>

              {/* Item 2 */}
              <div className="flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center border border-slate-200 text-slate-400">
                    <FileText size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">Tagihan September</p>
                    <p className="text-[10px] font-mono text-slate-500 mt-0.5">{formatDateTime('2023-09-12T09:15:00')}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-800">Rp 150.000</p>
                  <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest mt-0.5">Disetujui</p>
                </div>
              </div>

              {/* Item 3 */}
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 opacity-60">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center border border-slate-200 text-slate-400">
                    <ImageIcon size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">Tagihan Agustus</p>
                    <p className="text-[10px] font-mono text-slate-500 mt-0.5">{formatDateTime('2023-08-10T11:45:00')}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-800">Rp 150.000</p>
                  <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest mt-0.5">Disetujui</p>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100">
              <div className="flex items-start gap-3 bg-primary-50/50 p-4 rounded-xl border border-primary-100">
                <Info className="text-primary-600 shrink-0 mt-0.5" size={16} />
                <p className="text-[11px] text-primary-900/80 leading-relaxed">
                  Proses verifikasi manual oleh bendahara membutuhkan waktu 1x24 jam kerja. Pastikan foto struk terlihat jelas.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
