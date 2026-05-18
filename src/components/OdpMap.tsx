import React, { useState, useEffect, useRef } from 'react';
import JSZip from 'jszip';
import { kml } from '@tmcw/togeojson';
import { useLocation, Link } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, GeoJSON, CircleMarker, Tooltip, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Search as SearchIcon, Layers, Maximize, AlertCircle, CheckCircle2, Navigation, Plus, Check } from 'lucide-react';

// Helper distance function
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return R * c;
}

// No API key needed for Leaflet OpenStreetMap

export interface Odp {
  id: string;
  location: { lat: number; lng: number };
  status: string;
  capacity: string;
  address: string;
  customers?: any[];
  cableType?: string;
}

export const INITIAL_MOCK_ODPs: Odp[] = [
  { id: 'ODP-JKT-MT-001', location: { lat: -6.2088, lng: 106.8456 }, status: 'Normal', capacity: '5/16', address: 'Menteng, Jakarta Pusat', cableType: 'Serat Utama', customers: [
    { name: 'PT Nusantara Indo', phone: '081234567890', paymentStatus: 'paid', status: 'Normal', location: { lat: -6.2085, lng: 106.8460 } },
    { name: 'Hotel Grand Menteng', phone: '082345678901', paymentStatus: 'unpaid', status: 'Loss', location: { lat: -6.2090, lng: 106.8450 } }
  ] },
  { id: 'ODP-JKT-MT-002', location: { lat: -6.2100, lng: 106.8400 }, status: 'Normal', capacity: '14/16', address: 'Menteng, Jakarta Pusat', cableType: 'Distribusi', customers: [
    { name: 'Toko Makmur', phone: '08122334455', paymentStatus: 'paid', status: 'Normal', location: { lat: -6.2105, lng: 106.8405 } },
  ] },
  { id: 'ODP-JKT-MT-003', location: { lat: -6.2050, lng: 106.8480 }, status: 'Loss', capacity: '1/8', address: 'Menteng, Jakarta Pusat', cableType: 'Serat Utama', customers: [
    { name: 'Klinik Sehat', phone: '08334455667', paymentStatus: 'paid', status: 'Loss', location: { lat: -6.2045, lng: 106.8485 } }
  ] },
  { id: 'ODP-JKT-MT-004', location: { lat: -6.2150, lng: 106.8450 }, status: 'Full', capacity: '16/16', address: 'Menteng, Jakarta Pusat', cableType: 'Distribusi', customers: [] },
  { id: 'ODP-JKT-MT-005', location: { lat: -6.2000, lng: 106.8350 }, status: 'Normal', capacity: '8/16', address: 'Cikini, Jakarta Pusat', cableType: 'Distribusi', customers: [] },
  { id: 'ODP-JKT-MT-006', location: { lat: -6.2180, lng: 106.8500 }, status: 'Full', capacity: '8/8', address: 'Menteng, Jakarta Pusat', cableType: 'Distribusi', customers: [] },
  { id: 'ODP-BND-001', location: { lat: -6.9175, lng: 107.6191 }, status: 'Normal', capacity: '2/8', address: 'Bandung', cableType: 'Serat Utama', customers: [] },
  { id: 'ODP-SBY-001', location: { lat: -7.2575, lng: 112.7521 }, status: 'Loss', capacity: '4/16', address: 'Surabaya', cableType: 'Distribusi', customers: [] },
];

const BACKBONE_PATH = [
  { lat: -6.2250, lng: 106.8200 },
  { lat: -6.2150, lng: 106.8300 },
  { lat: -6.2088, lng: 106.8456 }, // ODP-01
  { lat: -6.2050, lng: 106.8480 }, // ODP-03
  { lat: -6.2000, lng: 106.8600 },
];

const DISTRIBUTION_PATHS = [
  [ { lat: -6.2088, lng: 106.8456 }, { lat: -6.2100, lng: 106.8400 }, { lat: -6.2150, lng: 106.8450 } ], // connects 01, 02, 04
  [ { lat: -6.2088, lng: 106.8456 }, { lat: -6.2000, lng: 106.8350 } ], // connects 01, 05
  [ { lat: -6.2050, lng: 106.8480 }, { lat: -6.2180, lng: 106.8500 } ], // connects 03, 06
];

function OdpMarker({ odp }: { odp: Odp; key?: React.Key }) {
  const hasLossCustomer = odp.customers?.some(c => typeof c === 'object' && c.status === 'Loss');
  
  const [usedStr, totalStr] = odp.capacity.split('/');
  const used = parseInt(usedStr) || 0;
  const total = parseInt(totalStr) || 0;
  const capacityPercentage = total > 0 ? (used / total) * 100 : 0;

  let pinBgColor = 'bg-[#0E9F6E]'; // Green default (<80%)
  let arrowColor = 'border-t-[#0E9F6E]';
  
  if (odp.status === 'Loss' || odp.status === 'Rusak' || hasLossCustomer) {
    pinBgColor = 'bg-[#E02424]'; // Red
    arrowColor = 'border-t-[#E02424]';
  } else if (capacityPercentage >= 100 || odp.status === 'Full') {
    pinBgColor = 'bg-[#E02424]'; // Red
    arrowColor = 'border-t-[#E02424]';
  } else if (capacityPercentage >= 80 || odp.status === 'Warning') {
    pinBgColor = 'bg-[#EAB308]'; // Yellow
    arrowColor = 'border-t-[#EAB308]';
  }

  const iconHtml = `
    <div class="relative flex flex-col items-center justify-center -mt-6">
      <div class="px-2 py-0.5 ${pinBgColor} rounded-md flex flex-col items-center justify-center text-white font-bold text-[10px] shadow-lg min-w-[32px] border border-white/20 whitespace-nowrap tracking-wider">
          <span class="leading-tight">${used}/${total}</span>
      </div>
      <div class="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[5px] ${arrowColor}"></div>
    </div>
  `;

  const icon = L.divIcon({
    className: 'custom-leaflet-marker',
    html: iconHtml,
    iconSize: [40, 26],
    iconAnchor: [20, 26],
    popupAnchor: [0, -26]
  });

  return (
    <React.Fragment>
      <Marker position={[odp.location.lat, odp.location.lng]} icon={icon} zIndexOffset={odp.status === 'Normal' ? 100 : 50}>
        <Tooltip direction="top" offset={[0, -28]} opacity={1} className="custom-leaflet-tooltip shadow-sm !p-0 !border-0 !rounded-lg overflow-hidden">
          <div className="font-sans px-3 py-2 bg-slate-800 text-white min-w-[150px]">
            <div className="font-semibold text-xs border-b border-slate-700 pb-1 flex items-center justify-between">
              {odp.id}
              <span className={`w-2 h-2 rounded-full ${
                odp.status === 'Normal' ? 'bg-emerald-400' :
                odp.status === 'Full' ? 'bg-amber-400' :
                odp.status === 'Warning' ? 'bg-yellow-400' :
                'bg-rose-400'
              }`}></span>
            </div>
            <div className="flex flex-col gap-1 mt-2 text-[10px]">
              <div className="flex justify-between items-center pr-2 text-slate-300">
                <span>Status Koneksi:</span>
                <span className={`font-medium ml-4 ${
                  odp.status === 'Normal' ? 'text-emerald-400' :
                  odp.status === 'Full' ? 'text-amber-400' :
                  odp.status === 'Warning' ? 'text-yellow-400' :
                  'text-rose-400'
                }`}>{odp.status === 'Loss' ? 'Terputus (Loss)' : odp.status}</span>
              </div>
              <div className="flex justify-between items-center pr-2 text-slate-300">
                <span>Kapasitas:</span>
                <span className="font-medium text-white ml-4">{total} Port</span>
              </div>
              <div className="flex justify-between items-center pr-2 text-slate-300">
                <span>Pelanggan Aktif:</span>
                <span className="font-medium text-white ml-4">{used} Pengguna</span>
              </div>
            </div>
          </div>
        </Tooltip>
        <Popup closeButton={true} className="min-w-[260px] sm:min-w-[300px] border-none rounded-xl overflow-hidden shadow-2xl odp-popup">
          <div className="bg-white text-slate-900 font-sans p-4 flex flex-col max-h-[350px] sm:max-h-[400px]">
            <div className="border-b border-slate-100 pb-3 mb-3 flex items-start justify-between shrink-0">
               <div>
                 <h3 className="font-bold text-sm text-slate-900 m-0 leading-none mb-1.5 cursor-default">{odp.id}</h3>
                 <p className="text-[10px] text-slate-500 m-0 font-medium">Kapasitas: {used} / {total} Port Terpakai</p>
               </div>
               <span className={`inline-flex items-center justify-center px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                  odp.status === 'Normal' ? 'bg-emerald-100 text-emerald-700' :
                  odp.status === 'Full' ? 'bg-amber-100 text-amber-700' :
                  odp.status === 'Warning' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-rose-100 text-rose-700'
                }`}>
                  {odp.status === 'Loss' ? 'Terputus' : odp.status}
                </span>
            </div>
            
            <div className="flex-1 overflow-y-auto min-h-0 relative">
              {odp.customers && odp.customers.length > 0 ? (
                <div className="text-left mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Pelanggan Terhubung</p>
                    <div className="flex items-center gap-1.5 text-[10px] font-bold">
                      <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">{odp.customers.filter(c => ['normal', 'online'].includes(String(typeof c === 'object' ? c.status : 'Normal').toLowerCase())).length} Online</span>
                      <span className="text-rose-600 bg-rose-50 px-2 py-0.5 rounded">{odp.customers.filter(c => ['loss', 'offline'].includes(String(typeof c === 'object' ? c.status : 'Normal').toLowerCase())).length} Offline</span>
                    </div>
                  </div>
                  <div className="space-y-2 pr-1 custom-scrollbar pb-2">
                    {odp.customers.map((c, i) => {
                      const name = typeof c === 'string' ? c : c.name;
                      const custStatus = typeof c === 'object' ? String(c.status).toLowerCase() : 'normal';
                      const isOnline = ['normal', 'online'].includes(custStatus);
                      return (
                        <div key={i} className="flex items-center justify-between text-xs py-2 px-2.5 bg-slate-50 hover:bg-slate-100 transition-colors rounded-xl border border-slate-100">
                          <div className="flex items-center gap-2.5 overflow-hidden">
                            <div className={`w-2 h-2 rounded-full flex-shrink-0 shadow-sm ${!isOnline ? 'bg-rose-500 shadow-rose-500/20' : 'bg-emerald-500 shadow-emerald-500/20'}`}></div>
                            <span className="font-semibold text-slate-700 truncate">{name}</span>
                          </div>
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded ${isOnline ? 'text-emerald-600 bg-emerald-100/50' : 'text-rose-600 bg-rose-100/50'}`}>
                            {isOnline ? 'Online' : 'Offline'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 bg-slate-50 rounded-xl mb-4 border border-slate-100 border-dashed">
                  <p className="text-xs text-slate-500 font-medium">Belum ada pelanggan terhubung</p>
                </div>
              )}
            </div>
          </div>
        </Popup>
      </Marker>
      
      {/* Customer Lines & ONTs */}
      {odp.customers?.map((cust: any, i: number) => {
        if (typeof cust !== 'object' || !cust.location) return null;
        
        const isLoss = cust.status === 'Loss';
        
        return (
          <React.Fragment key={`cust-${i}`}>
            <Polyline 
              positions={[
                [odp.location.lat, odp.location.lng],
                [cust.location.lat, cust.location.lng]
              ]} 
              color={isLoss ? '#E02424' : '#0E9F6E'}
              weight={2}
              dashArray={isLoss ? '5, 5' : undefined}
            />
            <CircleMarker 
              center={[cust.location.lat, cust.location.lng]} 
              radius={4}
              pathOptions={{
                color: isLoss ? '#E02424' : '#0E9F6E',
                fillColor: isLoss ? '#FCA5A5' : '#6EE7B7',
                fillOpacity: 1
              }}
            >
              <Tooltip direction="top" offset={[0, -5]} opacity={1}>
                <div className="text-xs font-sans">
                  <strong>{cust.name}</strong>
                  <br />
                  <span>Status: {cust.status || 'Normal'}</span>
                </div>
              </Tooltip>
            </CircleMarker>
          </React.Fragment>
        );
      })}
    </React.Fragment>
  );
}

function MapController({ odps }: { odps: Odp[] }) {
  const map = useMap();
  useEffect(() => {
    if (!odps || odps.length === 0) return;
    
    // Extract lat/lng pairs
    const latlngs: L.LatLngExpression[] = odps.map(o => [o.location.lat, o.location.lng]);
    const bounds = L.latLngBounds(latlngs);
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16, animate: true });
    }
  }, [map, odps]);
  return null;
}

function MapClickListener({ onClick }: { onClick: (latlng: L.LatLng) => void }) {
  useMapEvents({
    click(e) {
      onClick(e.latlng);
    }
  });
  return null;
}

function LocalGeoJsonLoader({ data }: { data: any }) {
  const map = useMap();
  const geoJsonLayerRef = useRef<L.GeoJSON | null>(null);

  useEffect(() => {
    if (!map || !data) return;
    
    if (geoJsonLayerRef.current) {
        map.removeLayer(geoJsonLayerRef.current);
    }
    
    geoJsonLayerRef.current = L.geoJSON(data, {
      style: function (feature) {
        return {
          color: feature?.properties?.stroke || '#8B5CF6',
          weight: feature?.properties?.['stroke-width'] || feature?.properties?.strokeWidth || 4,
          opacity: feature?.properties?.['stroke-opacity'] || feature?.properties?.strokeOpacity || 0.8,
          fillColor: feature?.properties?.fill || '#8B5CF6',
          fillOpacity: feature?.properties?.['fill-opacity'] || feature?.properties?.fillOpacity || 0.2
        };
      },
      onEachFeature: function (feature, layer) {
        if (feature.properties && feature.properties.name) {
          layer.bindTooltip(feature.properties.name, { sticky: true });
        }
      }
    }).addTo(map);
    const bounds = geoJsonLayerRef.current.getBounds();
    if (bounds && bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50], animate: true });
    }
    
    return () => {
        if (geoJsonLayerRef.current && map) {
            map.removeLayer(geoJsonLayerRef.current);
        }
    };
  }, [map, data]);

  return null;
}

export function OdpMap({ odps: propOdps, setOdps: _setOdps, customers = [] }: any) {
  const odps = React.useMemo(() => {
    const base = propOdps || INITIAL_MOCK_ODPs;
    return base.map((odp: any) => {
      // Find real customers matching the ODP ID if any
      const enhancedCustomers = (odp.customers || []).map((c: any) => {
         const name = typeof c === 'string' ? c : c.name;
         // Try to find a real customer match
         const realCust = customers.find((rc: any) => rc.name === name);
         if (realCust) {
           return {
             ...(typeof c === 'object' ? c : {name}),
             status: realCust.status === 'online' ? 'Normal' : 'Loss',
             paymentStatus: realCust.paymentStatus,
             // Note: realCust doesn't have lat/lng but we keep c.location if it existed
           };
         }
         return c;
      });
      return { ...odp, customers: enhancedCustomers };
    });
  }, [propOdps, customers]);
  const [searchQuery, setSearchQuery] = useState('');
  const [geoJsonData, setGeoJsonData] = useState<any>(null);
  const [showKmlLayer, setShowKmlLayer] = useState(true);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{type: 'success' | 'error', message: string} | null>(null);
  
  const availableRegions = React.useMemo(() => {
    const zones = new Set<string>();
    odps.forEach((o: Odp) => {
      if (o.address) {
        const parts = o.address.split(',');
        const zone = parts[parts.length - 1].trim();
        if (zone) zones.add(zone);
      }
    });
    const arr = Array.from(zones);
    return arr.length > 0 ? arr : ['Jakarta Pusat', 'Bandung', 'Surabaya'];
  }, [odps]);

  const [wilayah, setWilayah] = useState<Record<string, boolean>>({
    'Jakarta Pusat': true,
    'Bandung': false,
    'Surabaya': false
  });

  // Ensure new regions from data are added to the filter state
  useEffect(() => {
    setWilayah(prev => {
      const next = { ...prev };
      let changed = false;
      availableRegions.forEach(w => {
         if (next[w] === undefined) {
           next[w] = false; // Add new regions as unselected by default, or true? Let's say false to not clutter
           changed = true;
         }
      });
      return changed ? next : prev;
    });
  }, [availableRegions]);

  const [status, setStatus] = useState({
    'Normal': true,
    'Loss': true,
    'Full': true
  });

  const [mapMode, setMapMode] = useState<'view' | 'add_odp' | 'draw_route'>('view');
  const [pendingRoute, setPendingRoute] = useState<any[]>([]);
  const [customRoutes, setCustomRoutes] = useState<any[][]>([]);

  const [kabel, setKabel] = useState({
    'Serat Utama': true,
    'Distribusi': true
  });

  const [problematicCustomer, setProblematicCustomer] = useState(false);

  const location = useLocation();

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const filter = query.get('filter');
    const idParam = query.get('id');

    if (idParam) {
      setSearchQuery(idParam);
      // Ensure all regions and statuses are permitted so we don't accidentally hide the targeted ODP
      setWilayah(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(k => next[k] = true);
        availableRegions.forEach(k => next[k] = true);
        return next;
      });
      setStatus({
        'Normal': true,
        'Loss': true,
        'Full': true
      });
    }

    if (filter === 'problematic') {
      setStatus(prev => ({
        ...prev,
        'Normal': false,
        'Loss': true,
        'Full': false
      }));
      setProblematicCustomer(true);
    }
  }, [location.search]);

  const processFile = async (file: File) => {
    setUploadStatus(null);
    if (!file || file.size === 0) {
      setUploadStatus({ type: 'error', message: "File kosong atau rusak (ukuran 0 bytes)" });
      return;
    }
    try {
      const fileName = file.name.toLowerCase();
      if (fileName.endsWith('.kmz')) {
        try {
          const arrayBuffer = await file.arrayBuffer();
          const zip = await JSZip.loadAsync(arrayBuffer);
          // Find doc.kml inside the zip
          const kmlFile = Object.values(zip.files).find(f => f.name.toLowerCase().endsWith('.kml'));
          if (!kmlFile) throw new Error('File KML tidak ditemukan di dalam KMZ');
          
          const kmlText = await kmlFile.async('string');
          const doc = new DOMParser().parseFromString(kmlText, 'text/xml');
          const geojson = kml(doc);
          setGeoJsonData(geojson);
          setUploadStatus({ type: 'success', message: 'KMZ berhasil dimuat' });
        } catch (zipErr: any) {
          console.warn("JSZip gagal membaca KMZ, mencoba membaca sebagai KML biasa...", zipErr);
          // Fallback in case it's actually just an uncompressed KML renamed to .kmz
          let isFallbackSuccess = false;
          try {
            const kmlText = await file.text();
            if (kmlText.includes('<?xml') || kmlText.includes('<kml')) {
              const doc = new DOMParser().parseFromString(kmlText, 'text/xml');
              const isError = doc.querySelector('parsererror');
              if (!isError) {
                const geojson = kml(doc);
                if (geojson && geojson.type) {
                  setGeoJsonData(geojson);
                  setUploadStatus({ type: 'success', message: 'File (KML) berhasil dimuat' });
                  isFallbackSuccess = true;
                }
              }
            }
          } catch (e) {
            // ignore fallback error and throw original
          }
          if (!isFallbackSuccess) throw zipErr;
        }
      } else if (fileName.endsWith('.kml')) {
         const kmlText = await file.text();
         if (!kmlText.trim()) throw new Error('File KML kosong');
         const doc = new DOMParser().parseFromString(kmlText, 'text/xml');
         if (doc.querySelector('parsererror')) throw new Error('File KML tidak valid (XML Error)');
         const geojson = kml(doc);
         if (!geojson || !geojson.type) throw new Error('Gagal mengekstrak data dari KML');
         setGeoJsonData(geojson);
         setUploadStatus({ type: 'success', message: 'KML berhasil dimuat' });
      } else if (fileName.endsWith('.geojson') || fileName.endsWith('.json')) {
         const jsonText = await file.text();
         if (!jsonText.trim()) throw new Error('File JSON/GeoJSON kosong');
         const geojson = JSON.parse(jsonText);
         if (!geojson || (!geojson.type && !geojson.features)) throw new Error('Format GeoJSON tidak valid');
         setGeoJsonData(geojson);
         setUploadStatus({ type: 'success', message: 'GeoJSON berhasil dimuat' });
      } else {
        setUploadStatus({ type: 'error', message: 'Harap unggah file .kml, .kmz, atau .geojson' });
      }
    } catch (err: any) {
      console.error("Error parsing map file:", err);
      const errMsg = err.message || String(err);
      setUploadStatus({ type: 'error', message: `Gagal membaca file: ${errMsg}` });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processFile(e.dataTransfer.files[0]);
    }
  };

  const filteredOdps = odps.filter((o: Odp) => {
    if (searchQuery && !o.id.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    
    // address filter
    let matchWilayah = false;
    const selectedWilayahs = Object.keys(wilayah).filter(k => wilayah[k]);
    if (selectedWilayahs.length === 0) return false;
    
    matchWilayah = selectedWilayahs.some(w => o.address.includes(w));
    if (!matchWilayah) return false;

    if (problematicCustomer) {
      const hasProblematic = o.customers && o.customers.some(
         (c: any) => c.paymentStatus === 'unpaid' || c.paymentStatus === 'overdue' || c.status === 'Loss' || c.status === 'Offline'
      );
      if (!hasProblematic) return false;
    }

    // Map status filter
    if (o.status === 'Normal' && !status['Normal']) return false;
    if (o.status === 'Loss' && !status['Loss']) return false;
    if (o.status === 'Full' && !status['Full']) return false;
    if (o.status === 'Rusak' && !status['Loss']) return false;

    // Cable type filter
    if (o.cableType === 'Serat Utama' && !kabel['Serat Utama']) return false;
    if (o.cableType === 'Distribusi' && !kabel['Distribusi']) return false;
    
    return true;
  });

  const [tempKey, setTempKey] = useState('');

  const handleMapClick = async (latlng: L.LatLng) => {
    if (mapMode === 'add_odp') {
      const newOdpId = prompt("Masukkan ID ODP Baru (misal: ODP-JKT-010):");
      if (newOdpId) {
        const newOdp: Odp = {
          id: newOdpId,
          location: { lat: latlng.lat, lng: latlng.lng },
          status: 'Normal',
          capacity: '0/16',
          address: 'Lokasi Baru',
          cableType: 'Distribusi',
          customers: []
        };
        _setOdps((prev: any) => [...prev, newOdp]);
        
        try {
          const { doc, setDoc } = await import('firebase/firestore');
          const { db } = await import('../firebase');
          await setDoc(doc(db, 'odps', newOdpId), newOdp);
        } catch (e) {
          console.error("Gagal simpan ODP ke DB:", e);
        }
      }
      setMapMode('view');
    } else if (mapMode === 'draw_route') {
      setPendingRoute(prev => [...prev, [latlng.lat, latlng.lng]]);
    }
  };

  const handleSaveRoute = () => {
    if (pendingRoute.length > 1) {
      setCustomRoutes(prev => [...prev, pendingRoute]);
      setPendingRoute([]);
      setMapMode('view');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden flex h-full border border-slate-200 font-sans relative">
      {/* Sidebar */}
      <div className="w-[300px] shrink-0 border-r border-slate-200 bg-white flex flex-col pt-6 z-10 overflow-y-auto">
        <div className="px-5 mb-5">
          <h1 className="text-xl font-bold text-slate-900 leading-tight">Peta Infrastruktur<br/>ODP & Jalur FO</h1>
        </div>
        
        <div className="px-5 mb-5 space-y-3">
          <button 
            onClick={() => setMapMode(mapMode === 'draw_route' ? 'view' : 'draw_route')}
            className={`w-full font-medium py-2 rounded-lg text-sm transition-colors cursor-pointer border flex items-center justify-center gap-2 ${mapMode === 'draw_route' ? 'bg-primary-50 text-primary-700 border-primary-200 shadow-inner' : 'bg-[#1C64F2] hover:bg-primary-700 text-white border-[#1C64F2]'}`}
          >
            <Navigation size={16} /> {mapMode === 'draw_route' ? 'Batalkan Menggambar' : 'Draw Route (Gambar Jalur)'}
          </button>
          <button 
            onClick={() => setMapMode(mapMode === 'add_odp' ? 'view' : 'add_odp')}
            className={`w-full font-medium py-2 rounded-lg text-sm transition-colors cursor-pointer border flex items-center justify-center gap-2 ${mapMode === 'add_odp' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-inner' : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-sm'}`}
          >
            <Plus size={16} /> {mapMode === 'add_odp' ? 'Batalkan' : 'Tambah ODP Baru'}
          </button>

          {mapMode === 'draw_route' && pendingRoute.length > 0 && (
             <button 
               onClick={handleSaveRoute}
               className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-2.5 rounded-lg text-sm transition-colors cursor-pointer shadow flex items-center justify-center gap-2 animate-in fade-in"
             >
               <Check size={16} /> Simpan Jalur
             </button>
          )}

          <div 
            className={`bg-slate-50 border ${isDragOver ? 'border-primary-500 bg-primary-50/50' : 'border-slate-200 border-dashed'} rounded-xl p-4 transition-all duration-200`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
             <label className="block text-xs font-semibold text-slate-700 mb-2">Unggah Layer Peta (KML/KMZ/GeoJSON)</label>
             <div className="flex gap-2 items-center h-20">
               <label className={`flex-1 flex flex-col items-center justify-center h-full border-2 border-dashed ${isDragOver ? 'border-primary-400 bg-primary-50' : 'border-slate-200 bg-white hover:bg-slate-50'} rounded-lg cursor-pointer transition-colors group relative overflow-hidden`}>
                 <Layers size={20} className={`mb-1.5 ${isDragOver ? 'text-primary-500' : 'text-slate-400 group-hover:text-primary-500'} transition-colors`} />
                 <span className={`text-[10px] font-medium text-center px-2 leading-tight ${isDragOver ? 'text-primary-600' : 'text-slate-500'}`}>
                   {isDragOver ? 'Lepaskan file di sini' : geoJsonData ? 'Ganti File Peta' : 'Pilih/Tarik & Lepas GeoJSON/KML'}
                 </span>
                 <input 
                   type="file" 
                   accept=".kml,.kmz,.geojson,.json"
                   onChange={handleFileUpload}
                   className="hidden"
                 />
               </label>
               {geoJsonData && (
                 <button 
                   onClick={() => setGeoJsonData(null)}
                   className="w-12 h-full bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors border border-rose-100 flex flex-col items-center justify-center shrink-0 shadow-sm"
                   title="Hapus Layer Peta"
                 >
                   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                 </button>
               )}
             </div>
             {geoJsonData && (
                <label className="flex items-center gap-2 mt-3 text-xs font-medium text-slate-700 cursor-pointer bg-white p-2 rounded-lg border border-slate-100 shadow-sm transition-colors hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={showKmlLayer}
                    onChange={(e) => setShowKmlLayer(e.target.checked)}
                    className="w-3.5 h-3.5 text-primary-600 rounded border-slate-300 focus:ring-primary-500"
                  />
                  <span>Tampilkan Layer Peta</span>
                </label>
             )}
             <p className="text-[10px] text-slate-500 mt-2.5 leading-relaxed text-center">
               Unggah file GeoJSON, .kml atau .kmz untuk melihat visualisasi jaringan FO custom.
             </p>
             {uploadStatus && (
               <div className={`mt-3 p-2.5 rounded-lg text-xs flex items-start gap-2 ${uploadStatus.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'}`}>
                 {uploadStatus.type === 'success' ? <CheckCircle2 size={16} className="shrink-0" /> : <AlertCircle size={16} className="shrink-0" />}
                 <span className="font-medium leading-tight">{uploadStatus.message}</span>
               </div>
             )}
          </div>
        </div>

        <div className="px-5 mb-6">
          <div className="relative">
            <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search ..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 placeholder:text-slate-400"
            />
          </div>
        </div>

        <div className="px-5 pb-6 space-y-6">
          <div>
            <h3 className="font-semibold text-slate-900 text-sm mb-3">Wilayah</h3>
            <div className="space-y-3">
              {Object.entries(wilayah).map(([key, val]) => (
                <label key={key} className="flex items-center gap-3 cursor-pointer group">
                  <div className={`w-[18px] h-[18px] rounded flex items-center justify-center transition-colors border ${val ? 'bg-[#1C64F2] border-[#1C64F2]' : 'bg-white border-slate-300 group-hover:border-primary-400'}`}>
                    {val && <svg className="w-3 h-3 text-white translate-y-px" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                  </div>
                  <span className="text-sm text-slate-700">{key}</span>
                  <input type="checkbox" className="hidden" checked={val} onChange={(e) => setWilayah({...wilayah, [key]: e.target.checked})} />
                </label>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-slate-900 text-sm mb-3">Status ODP</h3>
            <div className="space-y-3">
              {Object.entries(status).map(([key, val]) => {
                let colorClass = 'border-[#1C64F2]';
                let bgClass = 'bg-[#1C64F2]';
                
                if (key === 'Normal') {
                  colorClass = 'border-emerald-500'; bgClass = 'bg-emerald-500';
                } else if (key === 'Loss') {
                  colorClass = 'border-rose-600'; bgClass = 'bg-rose-600';
                } else if (key === 'Full') {
                  colorClass = 'border-amber-500'; bgClass = 'bg-amber-500';
                }

                return (
                <label key={key} className="flex items-center gap-3 cursor-pointer group">
                  <div className={`w-[18px] h-[18px] overflow-hidden rounded-full border flex items-center justify-center transition-colors ${val ? colorClass : 'bg-white border-slate-300 group-hover:border-primary-400'}`}>
                    <div className={`w-2.5 h-2.5 rounded-full ${val ? bgClass : 'bg-transparent'}`}></div>
                  </div>
                  <span className="text-sm text-slate-700">{key}</span>
                  <input type="checkbox" className="hidden" checked={val} onChange={(e) => {
                      setStatus({...status, [key]: e.target.checked})
                  }} />
                </label>
              )})}
              
              <div className="pt-2 mt-1 border-t border-slate-100">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className={`w-[18px] h-[18px] overflow-hidden rounded-full border flex items-center justify-center transition-colors border-rose-400 ${problematicCustomer ? 'bg-rose-400 border-rose-400' : 'bg-white group-hover:border-rose-500'}`}>
                    <div className={`w-2.5 h-2.5 rounded-full ${problematicCustomer ? 'bg-white' : 'bg-transparent'}`}></div>
                  </div>
                  <span className="text-sm text-slate-700">Pelanggan Bermasalah</span>
                  <input type="checkbox" className="hidden" checked={problematicCustomer} onChange={(e) => setProblematicCustomer(e.target.checked)} />
                </label>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-slate-900 text-sm mb-3">Jenis Kabel</h3>
            <div className="space-y-3">
              {Object.entries(kabel).map(([key, val]) => (
                <label key={key} className="flex items-center gap-3 cursor-pointer group">
                  <div className={`w-[18px] h-[18px] rounded flex items-center justify-center transition-colors border ${val ? 'bg-[#1C64F2] border-[#1C64F2]' : 'bg-white border-slate-300 group-hover:border-primary-400'}`}>
                    {val && <svg className="w-3 h-3 text-white translate-y-px" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                  </div>
                  <span className="text-sm text-slate-700">{key}</span>
                  <input type="checkbox" className="hidden" checked={val} onChange={(e) => setKabel({...kabel, [key]: e.target.checked})} />
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Map Area */}
      <div className="flex-1 relative bg-slate-100 w-full h-full z-0 font-sans">
          {/* Bottom Right Legend */}
          <div className="absolute bottom-6 right-6 z-10 bg-white rounded-lg shadow-lg border border-slate-200 p-4 w-[240px]">
            <h4 className="font-bold text-slate-900 text-sm mb-3">Status ODP</h4>
            
            <div className="space-y-3 mb-4">
              <div className="flex items-center gap-3">
                 <div className="bg-[#0E9F6E] rounded px-2 py-0.5 text-white font-bold text-[10px] min-w-[32px] text-center border border-white/20">
                    <span className="leading-tight">8/16</span>
                 </div>
                 <span className="text-xs font-medium text-slate-700">Aman (&lt;80%)</span>
              </div>
              <div className="flex items-center gap-3">
                 <div className="bg-[#EAB308] rounded px-2 py-0.5 text-white font-bold text-[10px] min-w-[32px] text-center border border-white/20">
                    <span className="leading-tight">14/16</span>
                 </div>
                 <span className="text-xs font-medium text-slate-700">Peringatan (80-99%)</span>
              </div>
              <div className="flex items-center gap-3">
                 <div className="bg-[#E02424] rounded px-2 py-0.5 text-white font-bold text-[10px] min-w-[32px] text-center border border-white/20">
                    <span className="leading-tight">16/16</span>
                 </div>
                 <span className="text-xs font-medium text-slate-700">Penuh / Gangguan</span>
              </div>
            </div>

            <div className="space-y-3.5 pt-3.5 border-t border-slate-100">
               <div className="flex items-center gap-3">
                  <div className="w-6 h-[5px] bg-[#00A8FF] rounded-full"></div>
                  <span className="text-xs font-medium text-slate-700">Backbone Utama</span>
               </div>
               <div className="flex items-center gap-3">
                  <div className="w-6 h-[3px] bg-[#FFA502] rounded-full"></div>
                  <span className="text-xs font-medium text-slate-700">Distribusi Area</span>
               </div>
            </div>
          </div>

          <MapContainer
            center={[-6.2088, 106.8456]}
            zoom={15}
            style={{ width: '100%', height: '100%', zIndex: 0 }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapClickListener onClick={handleMapClick} />
            <MapController odps={filteredOdps} />
            {showKmlLayer && <LocalGeoJsonLoader data={geoJsonData} />}
            {filteredOdps.map((odp: Odp) => (
              <OdpMarker key={odp.id} odp={odp} />
            ))}
            {kabel['Serat Utama'] && <Polyline positions={BACKBONE_PATH} color="#00A8FF" weight={6} opacity={0.8} />}
            {kabel['Distribusi'] && DISTRIBUTION_PATHS.map((path, i) => (
               <Polyline key={`dist-${i}`} positions={path} color="#FFA502" weight={4} opacity={0.8} />
            ))}
            
            {/* Draw Route & Custom Routes */}
            {customRoutes.map((rt, idx) => (
              <Polyline key={`custom-${idx}`} positions={rt} color="#8B5CF6" weight={5} opacity={0.8} dashArray="5,5" />
            ))}
            {pendingRoute.length > 0 && (
              <Polyline positions={pendingRoute} color="#8B5CF6" weight={5} opacity={0.8} dashArray="5,5" />
            )}
            {pendingRoute.map((pt, i) => (
              <CircleMarker key={`pt-${i}`} center={pt} radius={5} color="#8B5CF6" fillColor="#fff" fillOpacity={1} />
            ))}
          </MapContainer>
      </div>
    </div>
  );
}

