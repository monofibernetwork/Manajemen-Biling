import React, { useState, useEffect } from 'react';
import { CalendarDays, UserPlus, Phone, MapPin, Wifi, Clock, CheckCircle2, Send, Loader2 } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const pinIcon = L.divIcon({
  className: 'custom-leaflet-marker',
  html: `<div class="w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-lg ring-2 ring-white" style="border-bottom-right-radius: 2px; transform: rotate(45deg);"></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 24],
});

function LocationMarker({ formData, setFormData }: any) {
  useMapEvents({
    click(e) {
      setFormData((prev: any) => ({ ...prev, lat: e.latlng.lat, lng: e.latlng.lng }));
    },
  });

  return (
    <Marker position={[formData.lat, formData.lng]} icon={pinIcon}></Marker>
  );
}

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center);
  }, [center[0], center[1]]);
  return null;
}

const TECHNICIANS = [
  { id: 'teknisi1', name: 'Tim Teknisi 1 (Utara)', workload: 3, status: 'Sibuk' },
  { id: 'teknisi2', name: 'Tim Teknisi 2 (Selatan)', workload: 1, status: 'Tersedia' },
  { id: 'teknisi3', name: 'Tim Teknisi 3 (Timur)', workload: 0, status: 'Standby' },
  { id: 'teknisi4', name: 'Tim Teknisi 4 (Barat)', workload: 5, status: 'Penuh' },
];

import { useTenant } from '../contexts/TenantContext';

export function NewInstallation() {
  const { tenantId } = useTenant();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    plan: '50 Mbps',
    date: '',
    time: '',
    technician: '',
    lat: -6.2088,
    lng: 106.8456
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isCalculatingTech, setIsCalculatingTech] = useState(false);
  const [currentTechs, setCurrentTechs] = useState(TECHNICIANS);

  useEffect(() => {
    // When date or time changes, autoselect technician
    if (formData.date && formData.time) {
      setIsCalculatingTech(true);
      
      // Simulate API call to check schedule and workload
      const timer = setTimeout(() => {
        // Create a pseudo-random hash based on date and time to simulate different workloads
        const hash = (formData.date + formData.time).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        
        const dynamicTechs = TECHNICIANS.map(t => {
          const simulatedWorkload = (t.workload + hash) % 6;
          return {
            ...t,
            workload: simulatedWorkload,
            status: simulatedWorkload >= 5 ? 'Penuh' : simulatedWorkload > 2 ? 'Sibuk' : 'Tersedia'
          };
        });
        
        setCurrentTechs(dynamicTechs);

        const availableTechs = dynamicTechs.filter(t => t.status !== 'Penuh');
        if (availableTechs.length > 0) {
          // Select technician with lowest workload
          const bestTech = availableTechs.reduce((prev, current) => 
            (prev.workload < current.workload) ? prev : current
          );
          setFormData(prev => ({ ...prev, technician: bestTech.id }));
          setNotification({ 
            message: `Teknisi ${bestTech.name} otomatis dipilih berdasarkan ketersediaan (Beban kerja: ${bestTech.workload} antrean).`, 
            type: 'success' 
          });
          setTimeout(() => setNotification(null), 5000);
        } else {
          setFormData(prev => ({ ...prev, technician: '' }));
          setNotification({ 
            message: 'Semua teknisi penuh pada waktu tersebut. Silakan pilih waktu lain.', 
            type: 'error' 
          });
          setTimeout(() => setNotification(null), 5000);
        }
        setIsCalculatingTech(false);
      }, 800);
      
      return () => clearTimeout(timer);
    } else {
      setFormData(prev => ({...prev, technician: ''}));
    }
  }, [formData.date, formData.time]);

  const getTechName = (id: string) => TECHNICIANS.find(t => t.id === id)?.name || id;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.technician) {
       setNotification({ message: 'Harap lengkapi tanggal dan waktu untuk menentukan teknisi.', type: 'error' });
       return;
    }

    setIsSubmitting(true);
    
    try {
      const { collection, addDoc } = await import('firebase/firestore');
      const { db } = await import('../firebase');

      const newSchedule = {
        customerName: formData.name,
        phone: formData.phone,
        address: formData.address,
        plan: formData.plan,
        date: formData.date,
        time: formData.time,
        status: 'pending',
        priority: 'normal',
        technician: formData.technician || 'teknisi1',
        pppoeUser: formData.name.toLowerCase().replace(/[^a-z0-9]/g, ''),
        pppoePass: formData.name.toLowerCase().replace(/[^a-z0-9]/g, ''),
        lat: formData.lat,
        lng: formData.lng,
        tenantId
      };

      const docRef = await addDoc(collection(db, 'schedules'), newSchedule);
      
      setIsSubmitting(false);
      setNotification({ 
        message: `Pemasangan berhasil didaftarkan untuk ${formData.name}. Teknisi: ${getTechName(formData.technician)}. Notifikasi WhatsApp telah dikirim ke ${formData.phone}`, 
        type: 'success' 
      });
      setFormData({
        name: '',
        phone: '',
        address: '',
        plan: '50 Mbps',
        date: '',
        time: '',
        technician: '',
        lat: -6.2088,
        lng: 106.8456
      });
      
      setTimeout(() => setNotification(null), 5000);
    } catch (e: any) {
      console.error(e);
      setIsSubmitting(false);
      setNotification({ message: 'Gagal membuat jadwal pemasangan karena kesalahan sistem.', type: 'error' });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-2xl">
          <div className="p-6 border-b border-slate-200 bg-white/50">
            <h2 className="text-sm font-semibold text-slate-900 tracking-wider uppercase flex items-center gap-2">
              <UserPlus className="text-primary-600" size={18} />
              Registrasi Pemasangan Baru
            </h2>
            <p className="text-[10px] text-slate-500 font-mono mt-1">Jadwalkan pemasangan ODP dan ontir untuk pelanggan baru</p>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                    <UserPlus size={12} /> Nama Lengkap
                  </label>
                  <input 
                    type="text" 
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Budi Santoso"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:ring-1 focus:ring-primary-600 focus:border-primary-600 focus:outline-none transition-all placeholder:text-slate-700" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                    <Phone size={12} /> Nomor WhatsApp
                  </label>
                  <input 
                    type="tel" 
                    required
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="08123456789"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:ring-1 focus:ring-primary-600 focus:border-primary-600 focus:outline-none transition-all placeholder:text-slate-700 font-mono" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                    <Wifi size={12} /> Paket Langganan
                  </label>
                  <select 
                    value={formData.plan}
                    onChange={e => setFormData({ ...formData, plan: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:ring-1 focus:ring-primary-600 focus:border-primary-600 focus:outline-none transition-all"
                  >
                    <option value="50 Mbps">50 Mbps - Rp 150.000</option>
                    <option value="100 Mbps">100 Mbps - Rp 230.000</option>
                    <option value="200 Mbps">200 Mbps - Rp 330.000</option>
                  </select>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                    <CalendarDays size={12} /> Tanggal Pemasangan
                  </label>
                  <input 
                    type="date" 
                    required
                    value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:ring-1 focus:ring-primary-600 focus:border-primary-600 focus:outline-none transition-all" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                    <Clock size={12} /> Waktu Pemasangan
                  </label>
                  <input 
                    type="time" 
                    required
                    value={formData.time}
                    onChange={e => setFormData({ ...formData, time: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:ring-1 focus:ring-primary-600 focus:border-primary-600 focus:outline-none transition-all" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                    <UserPlus size={12} /> Tim Teknisi (Otomatis)
                  </label>
                  <div className="relative">
                    <select 
                      value={formData.technician}
                      disabled
                      onChange={e => setFormData({ ...formData, technician: e.target.value })}
                      className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 font-medium focus:outline-none appearance-none"
                    >
                      <option value="">Pilih tanggal & waktu...</option>
                      {currentTechs.map(tech => (
                        <option key={tech.id} value={tech.id}>
                          {tech.name} • {tech.workload} antrean ({tech.status})
                        </option>
                      ))}
                    </select>
                    {isCalculatingTech && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-primary-600">
                        <Loader2 size={16} className="animate-spin" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                <MapPin size={12} /> Alamat Lengkap Pemasangan
              </label>
              <textarea 
                required
                rows={3}
                value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
                placeholder="Masukkan alamat lengkap (Jalan, RT/RW, Kelurahan, Kecamatan, Kota/Kabupaten, Kode Pos, dsb.)"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:ring-1 focus:ring-primary-600 focus:border-primary-600 focus:outline-none transition-all resize-none placeholder:text-slate-400" 
              />
              
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                    Latitude
                  </label>
                  <input 
                    type="number" 
                    step="any"
                    required
                    value={formData.lat}
                    onChange={e => setFormData({ ...formData, lat: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:ring-1 focus:ring-primary-600 focus:border-primary-600 focus:outline-none transition-all font-mono" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                    Longitude
                  </label>
                  <input 
                    type="number" 
                    step="any"
                    required
                    value={formData.lng}
                    onChange={e => setFormData({ ...formData, lng: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:ring-1 focus:ring-primary-600 focus:border-primary-600 focus:outline-none transition-all font-mono" 
                  />
                </div>
              </div>

              <div className="mt-4 border border-slate-200 bg-slate-50 rounded-xl overflow-hidden h-64 relative z-0">
                 <MapContainer center={[formData.lat, formData.lng]} zoom={15} style={{ height: '100%', width: '100%', zIndex: 0 }}>
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <MapUpdater center={[formData.lat, formData.lng]} />
                    <LocationMarker formData={formData} setFormData={setFormData} />
                 </MapContainer>
              </div>
            </div>
            
            {/* Notification Toast */}
            {notification && (
              <>
                <div className="fixed inset-0 z-[40]" onClick={() => setNotification(null)} />
                <div className={`fixed bottom-8 right-8 z-[50] p-4 rounded-xl shadow-2xl flex items-start gap-3 animate-in fade-in slide-in-from-bottom-8 ${notification.type === 'success' ? 'bg-white border border-emerald-200 text-emerald-800' : 'bg-white border border-rose-200 text-rose-800'}`}>
                  {notification.type === 'success' ? <CheckCircle2 size={18} className="shrink-0 mt-0.5 text-emerald-600" /> : <Clock size={18} className="shrink-0 mt-0.5 text-rose-600" />}
                  <div className="flex flex-col gap-1 pr-6">
                    <p className={`text-sm font-semibold ${notification.type === 'success' ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {notification.type === 'success' ? 'Pendaftaran Sukses' : 'Pendaftaran Gagal'}
                    </p>
                    <p className="text-sm font-medium leading-relaxed opacity-90">{notification.message}</p>
                  </div>
                  <button 
                    onClick={() => setNotification(null)}
                    className="absolute top-4 right-4 hover:opacity-75 transition-opacity focus:outline-none"
                    aria-label="Tutup notifikasi"
                  >
                    ×
                  </button>
                </div>
              </>
            )}

            <div className="flex justify-end pt-4 border-t border-slate-200">
              <button 
                type="submit"
                disabled={isSubmitting}
                className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-primary-600/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Memproses...</>
                ) : (
                  <><CalendarDays size={16} /> Jadwalkan Pemasangan</>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="lg:col-span-1 space-y-6">
        <div className="bg-white border border-slate-200 rounded-3xl p-6">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-6 flex items-center gap-2">
            <Send size={14} /> WhatsApp Gateway Automation
          </h3>
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
              <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest mb-2">Sender Endpoint</p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                <p className="font-mono text-sm text-slate-800">0821-2481-2114</p>
              </div>
            </div>
            
            <div>
              <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest mb-2">Preview Pesan Terkirim</p>
              <div className="p-4 bg-emerald-950/20 border border-emerald-900/30 rounded-2xl relative">
                <div className="absolute -left-1.5 top-4 w-3 h-3 bg-emerald-950/20 border-l border-t border-emerald-900/30 rotate-[-45deg]"></div>
                <p className="text-xs text-slate-700 leading-relaxed font-mono whitespace-pre-line">
                  Halo *{formData.name || '{Nama Pelanggan}'}* 👋,{'\n\n'}
                  Terima kasih telah berlangganan layanan internet kami.{'\n\n'}
                  Kami mengonfirmasi jadwal pemasangan jaringan baru Anda:{'\n'}
                  📅 *{formData.date || '{Tanggal}'}*{'\n'}
                  ⏰ *{formData.time || '{Waktu}'} WIB*{'\n'}
                  📦 *Paket: {formData.plan}*{'\n\n'}
                  Tim teknisi kami ({formData.technician ? getTechName(formData.technician) : 'Admin'}) akan datang ke alamat yang telah didaftarkan. Mohon pastikan ada perwakilan di lokasi.{'\n\n'}
                  Terima kasih!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
