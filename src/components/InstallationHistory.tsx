import React, { useState, useEffect } from 'react';
import { History, CheckCircle2, User, MapPin, Calendar, Clock, Server, Eye, X, Phone, Activity, ShieldCheck, FileText } from 'lucide-react';
import { formatDateTime } from '../lib/formatDate';

interface CompletedInstallation {
  id: string;
  customerName: string;
  address: string;
  phone: string;
  date: string;
  time: string;
  technician: string;
  onuRegistration?: {
    sn: string;
    mac: string;
    auth: string;
    profile: string;
    type?: string;
    port?: string;
  };
  completedAt: string;
}

const mockHistory: CompletedInstallation[] = [
  {
    id: 'SCH-8832',
    customerName: 'Budi Santoso',
    address: 'Jl. Merdeka No. 123, Kel. Suka Maju',
    phone: '081234567890',
    date: '2026-05-09',
    time: '10:00',
    technician: 'Aditya Firmansyah',
    onuRegistration: {
      sn: 'ZTEGC1234567',
      mac: '00:1A:2B:3C:4D:5E',
      auth: 'PPPoE',
      profile: '50A',
      type: 'ZTE F609',
      port: 'PON 1/1/1'
    },
    completedAt: '2026-05-09T11:45:00Z'
  },
  {
    id: 'SCH-8833',
    customerName: 'Siti Aminah',
    address: 'Perumahan Asri Blok C/4',
    phone: '089876543210',
    date: '2026-05-08',
    time: '13:00',
    technician: 'Rudi Hermawan',
    onuRegistration: {
      sn: 'HWTC12348888',
      mac: 'E0:F1:C2:B3:A4:D5',
      auth: 'PPPoE',
      profile: '30A',
      type: 'Huawei HG8245H5',
      port: 'PON 1/1/2'
    },
    completedAt: '2026-05-08T14:30:00Z'
  }
];

export function InstallationHistory() {
  const [history, setHistory] = useState<CompletedInstallation[]>(mockHistory);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState<CompletedInstallation | null>(null);

  // Jika nanti butuh koneksi API
  // useEffect(() => {
  //   fetch('/api/schedules?status=closed')
  //     .then(res => res.json())
  //     .then(data => setHistory(data.schedules));
  // }, []);

  const filteredHistory = history.filter(item => 
    item.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.onuRegistration?.sn || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Riwayat Pemasangan</h2>
          <p className="text-sm text-slate-500 mt-1">Daftar pelanggan yang telah berhasil diinstalasi.</p>
        </div>
        <div className="w-full sm:w-auto relative">
          <input
            type="text"
            placeholder="Cari pelanggan, SN ONU, atau ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-72 pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-primary-600 focus:border-primary-600 transition-all"
          />
          <History className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredHistory.map((item) => (
          <div 
            key={item.id} 
            className="bg-white border border-slate-200 rounded-3xl p-6 hover:shadow-lg hover:shadow-slate-200/50 transition-all group cursor-pointer active:scale-[0.99]"
            onClick={() => setSelectedItem(item)}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 line-clamp-1">{item.customerName}</h3>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">{item.id}</p>
                </div>
              </div>
              <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full whitespace-nowrap">
                Selesai
              </span>
            </div>

            <div className="space-y-3 mb-5">
              <div className="flex items-start gap-3 text-sm text-slate-600">
                <MapPin size={16} className="text-slate-400 shrink-0 mt-0.5" />
                <span className="line-clamp-2 leading-relaxed">{item.address}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <Calendar size={16} className="text-slate-400 shrink-0" />
                <span>{item.date}</span>
                <Clock size={16} className="text-slate-400 shrink-0 ml-2" />
                <span>{item.time}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <User size={16} className="text-slate-400 shrink-0" />
                <span>Teknisi: <span className="font-medium text-slate-900">{item.technician}</span></span>
              </div>
            </div>

            {item.onuRegistration && (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mt-auto">
                <div className="flex items-center gap-2 mb-3">
                  <Server size={14} className="text-primary-600" />
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Detail ONU</h4>
                </div>
                <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-0.5">Serial Number</p>
                    <p className="text-xs font-mono font-medium text-slate-900">{item.onuRegistration.sn}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-0.5">MAC Address</p>
                    <p className="text-xs font-mono font-medium text-slate-900">{item.onuRegistration.mac}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-0.5">Mode</p>
                    <p className="text-xs font-medium text-slate-900">{item.onuRegistration.auth}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-0.5">Profile</p>
                    <p className="text-xs font-medium text-slate-900">{item.onuRegistration.profile}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {filteredHistory.length === 0 && (
          <div className="col-span-full py-12 text-center bg-white border border-slate-200 rounded-3xl border-dashed">
            <History size={48} className="mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-bold text-slate-900 mb-1">Riwayat Tidak Ditemukan</h3>
            <p className="text-sm text-slate-500">Mungkin pencarian Anda tidak sesuai atau belum ada instalasi selesai.</p>
          </div>
        )}
      </div>

      {/* Modal Detail Instalasi */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="sticky top-0 bg-white/80 backdrop-blur-md px-6 py-4 border-b border-slate-200 flex justify-between items-center z-10 rounded-t-3xl">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Detail Instalasi Pelanggan</h3>
                <p className="text-sm font-mono text-slate-500">{selectedItem.id}</p>
              </div>
              <button 
                onClick={() => setSelectedItem(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                title="Tutup"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-8">
              {/* Info Pelanggan */}
              <section>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                  <User size={14} /> Data Pelanggan
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-1">Nama Lengkap</p>
                    <p className="text-sm font-semibold text-slate-900">{selectedItem.customerName}</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-1">Nomor HP / WhatsApp</p>
                    <p className="text-sm font-mono font-medium text-slate-900">{selectedItem.phone}</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 md:col-span-2">
                    <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-1">Alamat Instalasi</p>
                    <p className="text-sm font-medium text-slate-900">{selectedItem.address}</p>
                  </div>
                </div>
              </section>

              {/* Info Instalasi */}
              <section>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                  <Calendar size={14} /> Waktu & Pihak Terkait
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="border border-slate-200 p-4 rounded-2xl">
                    <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-1">Jadwal</p>
                    <p className="text-sm font-medium text-slate-900">{selectedItem.date} {selectedItem.time}</p>
                  </div>
                  <div className="border border-slate-200 p-4 rounded-2xl">
                    <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-1">Selesai Pada</p>
                    <p className="text-sm font-medium text-slate-900">{formatDateTime(selectedItem.completedAt)}</p>
                  </div>
                  <div className="border border-slate-200 p-4 rounded-2xl bg-primary-50/50">
                    <p className="text-[10px] uppercase tracking-widest text-primary-400 mb-1">Teknisi Instalatir</p>
                    <p className="text-sm font-semibold text-primary-900">{selectedItem.technician}</p>
                  </div>
                </div>
              </section>

              {/* Info ONU */}
              {selectedItem.onuRegistration && (
                <section>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                    <Server size={14} /> Data Teknis Perangkat (ONU)
                  </h4>
                  <div className="bg-slate-900 rounded-3xl p-1 overflow-hidden shadow-xl">
                    <div className="bg-slate-800 rounded-[22px] p-5">
                      <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-700/50">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                            <Activity size={16} />
                          </div>
                          <div>
                            <p className="text-white font-semibold text-sm">Provisioning Sukses</p>
                            <p className="text-emerald-400 font-mono text-[10px] uppercase tracking-widest">Status: CONNECTED</p>
                          </div>
                        </div>
                        <ShieldCheck className="text-emerald-500" size={24} />
                      </div>
                      
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div>
                          <p className="text-slate-500 text-[10px] uppercase tracking-widest mb-1">Format Auth</p>
                          <p className="text-slate-200 font-semibold text-sm">{selectedItem.onuRegistration.auth}</p>
                        </div>
                        <div>
                          <p className="text-slate-500 text-[10px] uppercase tracking-widest mb-1">Profile Bandwidth</p>
                          <p className="text-primary-400 font-bold text-sm bg-primary-500/10 px-2 py-0.5 rounded inline-block">{selectedItem.onuRegistration.profile}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-slate-500 text-[10px] uppercase tracking-widest mb-1">Serial Number (SN)</p>
                          <p className="text-slate-200 font-mono text-sm">{selectedItem.onuRegistration.sn}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-slate-500 text-[10px] uppercase tracking-widest mb-1">MAC Address Target</p>
                          <p className="text-slate-200 font-mono text-sm">{selectedItem.onuRegistration.mac}</p>
                        </div>
                        <div className="col-span-2 border-t border-slate-700/50 pt-3 mt-1">
                          <p className="text-slate-500 text-[10px] uppercase tracking-widest mb-1">Tipe ONU</p>
                          <p className="text-slate-200 font-semibold text-sm">{selectedItem.onuRegistration.type || 'N/A'}</p>
                        </div>
                        <div className="col-span-2 border-t border-slate-700/50 pt-3 mt-1">
                          <p className="text-slate-500 text-[10px] uppercase tracking-widest mb-1">Port</p>
                          <p className="text-slate-200 font-semibold text-sm">{selectedItem.onuRegistration.port || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              )}
            </div>
            
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-3xl flex justify-between items-center">
              <button className="flex items-center gap-2 text-sm text-slate-500 font-semibold hover:text-slate-700 transition-colors">
                <FileText size={16} />
                Berita Acara (BAP)
              </button>
              <button 
                onClick={() => setSelectedItem(null)}
                className="px-6 py-2 bg-slate-900 border border-slate-800 text-white hover:bg-slate-800 rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-slate-900/20"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
