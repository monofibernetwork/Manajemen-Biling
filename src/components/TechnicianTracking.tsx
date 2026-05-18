import React, { useState, useEffect } from 'react';
import { useTenant } from '../contexts/TenantContext';
import { collection, onSnapshot, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapPin, Navigation } from 'lucide-react';

// fix icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

const defaultCenter: [number, number] = [-6.2088, 106.8456]; // Jakarta
const mapOptions = {
    zoomControl: false,
    attributionControl: false
};

interface TechLocation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  timestamp: string;
  accuracy: number;
  battery?: number; // percentage, null if unavailable
}

export function TechnicianTracking() {
  const { tenantId } = useTenant();
  const [techs, setTechs] = useState<TechLocation[]>([]);
  const [batteryAlerts, setBatteryAlerts] = useState<{name: string, battery: number}[]>([]); 

  useEffect(() => {
    if (!tenantId) return;

    // Load technicians names
    const namesCache: Record<string, string> = {};
    const fetchNames = async () => {
       const q = query(collection(db, 'technicians'), where('tenantId', '==', tenantId));
       const s = await getDocs(q);
       s.forEach(d => {
           namesCache[d.id] = d.data().name || 'Teknisi';
       });
    };
    fetchNames();

    const qLoc = query(collection(db, 'technicians_location'), where('tenantId', '==', tenantId));
    let notifiedTechs: Set<string> = new Set();

    const unsub = onSnapshot(qLoc, (snap) => {
       const l: TechLocation[] = [];
       const alerts: {name: string, battery: number}[] = [];
       snap.forEach(d => {
           const techId = d.id;
           const techName = namesCache[techId] || 'Teknisi ' + techId.substring(0,4);
           const pt = {
              id: techId,
              name: techName,
              lat: d.data().lat,
              lng: d.data().lng,
              timestamp: d.data().timestamp,
              accuracy: d.data().accuracy,
              battery: d.data().battery
           };
           l.push(pt);
           
           if (pt.battery !== undefined && pt.battery !== null && pt.battery < 20) {
               alerts.push({ name: pt.name, battery: pt.battery });
               if (!notifiedTechs.has(techId)) {
                   // Simulate WA Notification
                   console.log(`[WA SIMULATION] Mengirim pesan WA ke PIC Admin: Baterai perangkat teknisi ${pt.name} tersisa ${pt.battery}%. Harap hubungi teknisi.`);
                   notifiedTechs.add(techId);
               }
           } else if (pt.battery && pt.battery >= 20) {
               notifiedTechs.delete(techId); // reset if they charged it
           }
       });
       setTechs(l);
       setBatteryAlerts(alerts);
    });

    return () => unsub();
  }, [tenantId]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden min-h-[600px] flex flex-col">
       <div className="p-5 border-b border-slate-100 flex items-center justify-between">
           <div>
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                 <Navigation className="text-primary-600" /> GPS Pelacakan Teknisi
              </h2>
              <p className="text-sm text-slate-500 mt-1">Pantau lokasi real-time seluruh tim lapangan.</p>
           </div>
           {batteryAlerts.length > 0 && (
              <div className="flex flex-col items-end gap-1">
                 {batteryAlerts.map((a, i) => (
                    <div key={i} className="bg-rose-50 border border-rose-200 text-rose-700 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 animate-pulse">
                       ⚠️ Baterai {a.name} lemah ({a.battery}%) - Notif WA Dikirim
                    </div>
                 ))}
              </div>
           )}
       </div>
       <div className="flex-1 flex flex-col md:flex-row relative z-0">
           {/* Sidebar List */}
           <div className="w-full md:w-80 bg-slate-50 border-r border-slate-200 p-4 overflow-y-auto">
               <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Teknisi Aktif ({techs.length})</h3>
               <div className="space-y-3">
                   {techs.length === 0 ? (
                       <p className="text-sm text-slate-400">Tidak ada teknisi online.</p>
                   ) : techs.map(t => (
                       <div key={t.id} className="bg-white rounded-xl p-3 border border-slate-200 shadow-sm flex items-start gap-3">
                           <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center shrink-0">
                               <MapPin size={16} />
                           </div>
                           <div className="flex-1 overflow-hidden">
                               <p className="font-semibold text-slate-800 text-sm truncate">{t.name}</p>
                               <p className="text-[10px] text-slate-500 font-mono mt-0.5">Upt: {new Date(t.timestamp).toLocaleTimeString()}</p>
                           </div>
                           {t.battery !== undefined && t.battery !== null && (
                               <div className={`flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md ${t.battery < 20 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                   {t.battery}%
                               </div>
                           )}
                       </div>
                   ))}
               </div>
           </div>

           {/* Map */}
           <div className="flex-1 relative z-0 flex bg-slate-100 min-h-[400px]">
              <MapContainer 
                center={techs.length > 0 ? [techs[0].lat, techs[0].lng] : defaultCenter} 
                zoom={13} 
                className="w-full h-full"
                {...mapOptions}
              >
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  {techs.map(t => (
                      <Marker key={t.id} position={[t.lat, t.lng]}>
                          <Popup>
                              <div className="text-center p-1">
                                  <div className="font-bold text-slate-800">{t.name}</div>
                                  {t.battery !== undefined && t.battery !== null && (
                                      <div className={`mt-0.5 font-bold text-[10px] ${t.battery < 20 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                          🔋 {t.battery}%
                                      </div>
                                  )}
                                  <div className="text-[10px] text-slate-500 font-mono mt-1">Terakhir update:<br/>{new Date(t.timestamp).toLocaleString()}</div>
                              </div>
                          </Popup>
                      </Marker>
                  ))}
              </MapContainer>
           </div>
       </div>
    </div>
  );
}
