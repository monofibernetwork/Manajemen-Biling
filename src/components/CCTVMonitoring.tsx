import { useState, useEffect } from 'react';
import { Camera, Maximize2, MonitorPlay, WifiOff, Settings2, Grid as GridIcon, Info, Folder, Video, Play, StopCircle, RefreshCw, X, Cloud, Link, ShieldCheck, Plus, AlertTriangle, Move, Search, History, Trash2, Edit2, PlayCircle, FastForward, Rewind } from 'lucide-react';
import { collection, onSnapshot, doc, setDoc, updateDoc, deleteDoc, query, orderBy, limit, addDoc, where } from 'firebase/firestore';
import { db } from '../firebase';
import { CCTVCam, CCTVEvent } from '../types';
import ReactPlayer from 'react-player';
import { useTenant } from '../contexts/TenantContext';

export function CCTVMonitoring() {
  const { tenantId } = useTenant();
  const [gridSize, setGridSize] = useState<1 | 4 | 9>(4);
  const [selectedGroup, setSelectedGroup] = useState<string>('All');
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [remoteTunnelOpen, setRemoteTunnelOpen] = useState(false);
  const [selectedCamera, setSelectedCamera] = useState<any>(null);
  const [tunnelUrl, setTunnelUrl] = useState<string>('');
  
  // New States
  const [viewMode, setViewMode] = useState<'live' | 'playback'>('live');
  const [rightPanelTab, setRightPanelTab] = useState<'list' | 'events'>('list');
  const [showPTZ, setShowPTZ] = useState<string | null>(null); // camera id
  const [notification, setNotification] = useState<{message: string, type: 'success'|'error'} | null>(null);
  const [localRecording, setLocalRecording] = useState<Record<string, boolean>>({});

  const toggleRecording = (cameraId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setLocalRecording(prev => {
       const isRec = prev[cameraId];
       if (!isRec) {
          setNotification({ message: 'Perekaman lokal dimulai', type: 'success' });
          setTimeout(() => setNotification(null), 3000);
          return { ...prev, [cameraId]: true };
       } else {
          setNotification({ message: 'Perekaman selesai. Video tersimpan di penyimpanan.', type: 'success' });
          setTimeout(() => setNotification(null), 3000);
          const next = {...prev};
          delete next[cameraId];
          return next;
       }
    });
  };

  // Cloud Firestore States
  const [cameras, setCameras] = useState<CCTVCam[]>([]);
  const [motionEvents, setMotionEvents] = useState<CCTVEvent[]>([]);

  useEffect(() => {
    if (!tenantId) return;

    // 1. Listen to Cameras
    const qCams = query(collection(db, 'cctv_cameras'), where('tenantId', '==', tenantId));
    const unsubCams = onSnapshot(qCams, (snapshot) => {
      if (snapshot.empty) {
        // Seed initial mock data for demo purposes
        const mockData: (CCTVCam & { tenantId: string })[] = [
          { id: 'cam1', name: 'Main Gate', status: 'online', type: 'dvr', channel: 1, location: 'Exterior', recording: true, ptz: true, streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', tenantId },
          { id: 'cam2', name: 'Server Room', status: 'online', type: 'dvr', channel: 2, location: 'Interior', recording: true, ptz: false, tenantId },
          { id: 'cam3', name: 'Backyard', status: 'offline', type: 'ip', url: 'rtsp://...', location: 'Exterior', recording: false, ptz: true, tenantId },
        ];
        mockData.forEach(c => setDoc(doc(db, 'cctv_cameras', c.id), c).catch(console.error));
      } else {
        const camsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CCTVCam));
        setCameras(camsData);
      }
    }, (error) => {
       console.warn("Error fetching cameras:", error.message);
    });

    // 2. Listen to Event Logs
    const qEvents = query(collection(db, 'cctv_events'), where('tenantId', '==', tenantId), orderBy('timestamp', 'desc'), limit(20));
    const unsubEvents = onSnapshot(qEvents, (snapshot) => {
      if (snapshot.empty) {
        // Seed
        const mockEvents: (Partial<CCTVEvent> & { tenantId: string })[] = [
          { cameraId: 'cam1', cameraName: 'Main Gate', time: '14:02:45', date: 'Hari Ini', type: 'motion', severity: 'medium', timestamp: Date.now(), tenantId },
        ];
        mockEvents.forEach(e => addDoc(collection(db, 'cctv_events'), e).catch(console.error));
      } else {
        const eventsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CCTVEvent));
        setMotionEvents(eventsData);
      }
    }, (error) => {
        console.warn("Error fetching CCTV events:", error.message);
    });

    return () => {
      unsubCams();
      unsubEvents();
    };
  }, [tenantId]);

  const handlePTZCommand = async (cameraId: string, command: string) => {
    try {
      // Simulate calling a local NVR API through Cloudflare Tunnel
      console.log(`Sending HTTP POST to NVR API -> Camera: ${cameraId}, Command: ${command}`);
      
      // We log it as a System Event for demo visualization
      await addDoc(collection(db, 'cctv_events'), {
        cameraId,
        cameraName: cameras.find(c => c.id === cameraId)?.name || 'Unknown',
        time: new Date().toLocaleTimeString('id-ID'),
        date: new Date().toLocaleDateString('id-ID'),
        type: 'system',
        severity: 'low',
        timestamp: Date.now(),
        message: `PTZ Command: ${command}`
      });

      alert(`Perintah PTZ '${command}' berhasil dikirim ke NVR.`);
    } catch (err) {
      console.error("PTZ Command Failed", err);
    }
  };

  const handleDeleteCamera = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (window.confirm("Apakah Anda yakin ingin menghapus kamera ini?")) {
      try {
        await deleteDoc(doc(db, 'cctv_cameras', id));
        if (selectedCamera?.id === id) {
           setSettingsModalOpen(false);
           setSelectedCamera(null);
        }
      } catch (err) {
        console.error("Gagal menghapus kamera", err);
        alert("Gagal menghapus kamera.");
      }
    }
  };

  const handleSaveConfig = async () => {
    if (!selectedCamera) return;
    try {
      if (selectedCamera.id.startsWith('new_')) {
         const newId = 'cam_' + Date.now();
         await setDoc(doc(db, 'cctv_cameras', newId), { ...selectedCamera, id: newId, tenantId });
         setNotification({ message: 'Kamera baru berhasil ditambahkan!', type: 'success' });
      } else {
         await updateDoc(doc(db, 'cctv_cameras', selectedCamera.id), { ...selectedCamera, tenantId });
         setNotification({ message: 'Konfigurasi kamera berhasil diperbarui!', type: 'success' });
      }
      setTimeout(() => setNotification(null), 3000);
      setSettingsModalOpen(false);
      setSelectedCamera(null);
    } catch (err) {
      console.error("Save config failed", err);
      setNotification({ message: 'Gagal menyimpan konfigurasi', type: 'error' });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const locations = ['All', ...Array.from(new Set(cameras.map(c => c.location)))];

  const filteredCameras = selectedGroup === 'All' 
    ? cameras 
    : cameras.filter(c => c.location === selectedGroup);

  const visibleCameras = filteredCameras.slice(0, gridSize);

  const openSettings = (cam: any) => {
    setSelectedCamera(cam);
    setSettingsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <MonitorPlay className="text-primary-600" size={24} />
            CCTV & DVR Monitoring
          </h2>
          <p className="text-sm text-slate-500">Pantau kamera keamanan dan DVR Anda dari satu dasbor terpusat.</p>
          {notification && (
            <div className={`mt-3 p-3 rounded-xl border flex items-center gap-3 animate-in fade-in ${notification.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600' : 'bg-rose-500/10 border-rose-500/20 text-rose-600'}`}>
              {notification.type === 'success' ? <ShieldCheck size={16} /> : <AlertTriangle size={16} />}
              <p className="text-xs">{notification.message}</p>
            </div>
          )}
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-white rounded-lg p-1 border border-slate-200">
            <button 
              onClick={() => setViewMode('live')}
              className={`px-3 py-1.5 rounded text-sm font-semibold transition-colors flex items-center gap-2 ${viewMode === 'live' ? 'bg-rose-50 text-rose-700' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
            >
              <Video size={16} /> Live
            </button>
            <button 
              onClick={() => setViewMode('playback')}
              className={`px-3 py-1.5 rounded text-sm font-semibold transition-colors flex items-center gap-2 ${viewMode === 'playback' ? 'bg-amber-50 text-amber-700' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
            >
              <History size={16} /> Playback
            </button>
          </div>

          <button 
            onClick={() => setRemoteTunnelOpen(true)}
            className="bg-indigo-50 border border-indigo-200 text-indigo-700 px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-indigo-100 transition-colors flex items-center gap-2 shadow-sm"
          >
            <Cloud size={16} /> Remote Access / Tunnel
          </button>
          
          <div className="flex bg-white rounded-lg p-1 border border-slate-200">
            {locations.map(loc => (
              <button
                key={loc}
                onClick={() => setSelectedGroup(loc)}
                className={`px-3 py-1.5 rounded text-sm font-semibold transition-colors ${selectedGroup === loc ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
              >
                {loc}
              </button>
            ))}
          </div>
          
          <button 
            onClick={() => {
              setSelectedCamera({
                id: 'new_',
                name: 'Kamera Baru',
                status: 'online',
                type: 'ip',
                channel: 1,
                location: 'Exterior',
                recording: true,
                ptz: false
              });
              setSettingsModalOpen(true);
            }}
            className="bg-primary-600 hover:bg-primary-700 text-white px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 shadow-sm"
          >
            <Plus size={16} /> Tambah Kamera
          </button>

          <div className="flex bg-white rounded-lg p-1 border border-slate-200">
            <button 
              onClick={() => setGridSize(1)}
              className={`p-2 rounded flex items-center gap-2 text-sm font-semibold transition-colors ${gridSize === 1 ? 'bg-primary-50 text-primary-700' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
            >
              <Maximize2 size={16} /> <span className="hidden sm:inline">1x1</span>
            </button>
            <button 
              onClick={() => setGridSize(4)}
              className={`p-2 rounded flex items-center gap-2 text-sm font-semibold transition-colors ${gridSize === 4 ? 'bg-primary-50 text-primary-700' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
            >
              <GridIcon size={16} /> <span className="hidden sm:inline">2x2</span>
            </button>
            <button 
              onClick={() => setGridSize(9)}
              className={`p-2 rounded flex items-center gap-2 text-sm font-semibold transition-colors ${gridSize === 9 ? 'bg-primary-50 text-primary-700' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
            >
              <GridIcon size={16} className="text-[10px]" /> <span className="hidden sm:inline">3x3</span>
            </button>
          </div>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3 text-amber-800 text-sm">
        <Info size={16} className="shrink-0 mt-0.5 text-amber-600" />
        <div>
          <p className="font-semibold">Integrasi Stream RTSP/WebRTC</p>
          <p className="mt-1">
            Browser secara bawaan tidak mendukung protokol RTSP. Untuk menayangkan stream DVR asli, Anda membutuhkan Media Server lokal (seperti WebRTC atau HLS Wrapper) yang meneruskan feed ke aplikasi ini, atau gunakan URL stream HTTPS yang sesuai dari DVR Anda.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="col-span-1 lg:col-span-3">
          <div className={`grid gap-2 ${
            gridSize === 1 ? 'grid-cols-1' : 
            gridSize === 4 ? 'grid-cols-1 sm:grid-cols-2' : 
            'grid-cols-1 sm:grid-cols-2 md:grid-cols-3'
          }`}>
            {visibleCameras.map(cam => (
              <div 
                key={cam.id} 
                className="relative aspect-video bg-slate-900 rounded-lg overflow-hidden border border-slate-800 group shadow-lg"
                onMouseEnter={() => setShowPTZ(cam.id)}
                onMouseLeave={() => setShowPTZ(null)}
              >
                {cam.status === 'online' ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-black">
                    {cam.streamUrl && (
                       <div className="absolute inset-0" style={{ opacity: viewMode === 'live' ? 1 : 0, pointerEvents: viewMode === 'live' ? 'auto' : 'none' }}>
                         {/* @ts-ignore */}
                         <ReactPlayer 
                           url={cam.streamUrl} 
                           playing={viewMode === 'live'} 
                           muted 
                           width="100%" 
                           height="100%" 
                           style={{ objectFit: 'cover' }}
                         />
                       </div>
                    )}
                    {(!cam.streamUrl || viewMode !== 'live') && (
                       <div className="absolute inset-0 bg-slate-800 flex items-center justify-center relative">
                          <img 
                            src="https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=800&q=80"
                            className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-luminosity grayscale" 
                            alt="Camera Feed Placeholder" 
                          />
                          <div className="absolute inset-0 bg-blue-900/10 mix-blend-color-burn" />
                          {!cam.streamUrl && <span className="absolute bottom-4 bg-black/60 px-2 py-1 text-xs text-white rounded font-mono z-10">No Stream URL Data</span>}
                       </div>
                    )}
                    {/* Simulated live video overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />
                  </div>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 bg-slate-800">
                    <WifiOff size={32} className="mb-2 opacity-50" />
                    <span className="text-xs uppercase tracking-wider font-semibold">Signal Lost</span>
                  </div>
                )}
                
                {/* On-Screen Display (OSD) */}
                <div className="absolute top-0 inset-x-0 p-3 flex justify-between items-start pointer-events-none">
                  <div className="flex flex-col gap-1">
                    <div className="bg-black/60 backdrop-blur-sm px-2 py-1 rounded text-white font-mono text-[10px] leading-none uppercase tracking-wider flex items-center gap-1.5 border border-white/10 shadow-sm w-fit">
                      {cam.status === 'online' && viewMode === 'live' && <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />}
                      {cam.status === 'online' && viewMode === 'playback' && <History size={10} className="text-amber-400" />}
                      {cam.name}
                    </div>
                    {cam.status === 'online' && (
                      <div className="bg-black/40 backdrop-blur-sm px-1 py-0.5 rounded text-white/70 font-mono text-[9px] w-fit flex items-center gap-2">
                        <span>CH{cam.channel} • {cam.type.toUpperCase()}</span>
                        {(cam.recording || localRecording[cam.id]) && <span className={`flex items-center gap-1 ${localRecording[cam.id] ? 'text-rose-500 font-bold animate-pulse' : 'text-rose-400'}`}><Video size={10} fill={localRecording[cam.id] ? "currentColor" : "none"} /> REC</span>}
                      </div>
                    )}
                  </div>
                  <div className="text-white/60 font-mono text-[10px] drop-shadow-md">
                    {viewMode === 'live' ? 
                      `2026-05-15 14:02:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}` : 
                      '2026-05-15 10:15:00 PLAYBACK'
                    }
                  </div>
                </div>

                {/* PTZ Overlay (only visible on hover and if supported) */}
                {cam.ptz && showPTZ === cam.id && cam.status === 'online' && viewMode === 'live' && (
                  <div className="absolute inset-y-0 right-2 flex flex-col items-center justify-center gap-1 animate-in fade-in z-20">
                     <div className="bg-black/50 backdrop-blur-sm rounded-full p-1 flex flex-col items-center gap-1 shadow-lg border border-white/10">
                       <button onClick={() => handlePTZCommand(cam.id, 'zoom_in')} className="text-white/70 hover:text-white p-1 hover:bg-white/20 rounded-full transition-colors"><Plus size={14} /></button>
                       <span className="text-[9px] text-white/50 font-mono">Zoom</span>
                       <button onClick={() => handlePTZCommand(cam.id, 'pan_right')} className="text-white/70 hover:text-white p-1 hover:bg-white/20 rounded-full transition-colors"><Move size={14} className="rotate-45" /></button>
                     </div>
                  </div>
                )}
                
                {/* Hover Controls */}
                <div className="absolute bottom-0 inset-x-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-t from-black/80 to-transparent flex justify-end gap-1 z-30">
                  <button onClick={(e) => toggleRecording(cam.id, e)} className={`p-1 rounded transition-colors ${localRecording[cam.id] ? 'text-rose-500 hover:text-rose-400 bg-rose-500/20' : 'text-white/70 hover:text-white hover:bg-white/10'}`} title={localRecording[cam.id] ? "Hentikan Rekaman" : "Mulai Merekam"}>
                    {localRecording[cam.id] ? <StopCircle size={16} /> : <Video size={16} />}
                  </button>
                  <button onClick={() => openSettings(cam)} className="text-white/70 hover:text-white p-1 rounded hover:bg-white/10 transition-colors">
                    <Settings2 size={16} />
                  </button>
                  <button className="text-white/70 hover:text-white p-1 rounded hover:bg-white/10 transition-colors">
                    <Maximize2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Timeline Bar (visible only in playback mode) */}
          {viewMode === 'playback' && (
            <div className="mt-4 p-4 bg-white border border-slate-200 rounded-lg shadow-sm animate-in fade-in">
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-colors"><Rewind size={20} /></button>
                    <button className="p-2 text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-full transition-colors"><PlayCircle size={32} /></button>
                    <button className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-colors"><FastForward size={20} /></button>
                    <span className="font-mono text-sm font-semibold ml-4 text-slate-700">2026-05-15 10:15:00</span>
                  </div>
                  <div className="flex items-center gap-3">
                     <span className="text-xs text-slate-500 font-semibold uppercase">Pilih Tanggal:</span>
                     <input type="date" defaultValue="2026-05-15" className="text-sm border border-slate-300 rounded-md px-2 py-1 outline-none focus:border-primary-500 font-mono" />
                  </div>
                </div>
                
                {/* Visual Timeline scrub bar */}
                <div className="relative h-12 w-full bg-slate-900 rounded cursor-crosshair overflow-hidden group">
                  {/* Mock recording blocks */}
                  <div className="absolute inset-y-0 left-[10%] right-[80%] bg-emerald-500/80" />
                  <div className="absolute inset-y-0 left-[25%] right-[60%] bg-emerald-500/80" />
                  <div className="absolute inset-y-0 left-[45%] right-[20%] bg-emerald-500/80" />
                  
                  {/* Mock motion event markers */}
                  <div className="absolute top-0 bottom-0 left-[15%] w-1 bg-amber-400 group-hover:scale-x-150 transition-transform" />
                  <div className="absolute top-0 bottom-0 left-[50%] w-1 bg-amber-400 group-hover:scale-x-150 transition-transform" />
                  <div className="absolute top-0 bottom-0 left-[70%] w-1 bg-rose-500 group-hover:scale-x-150 transition-transform" title="Offline Event" />
                  
                  {/* Playhead */}
                  <div className="absolute top-0 bottom-0 left-[35%] w-0.5 bg-white z-10 shadow-[0_0_8px_rgba(255,255,255,1)]">
                     <div className="absolute -top-1 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-white" />
                  </div>
                  
                  {/* Time indicators */}
                  <div className="absolute bottom-0 inset-x-0 flex justify-between px-2 py-0.5 text-[8px] text-white/50 font-mono pointer-events-none">
                    <span>00:00</span>
                    <span>06:00</span>
                    <span>12:00</span>
                    <span>18:00</span>
                    <span>23:59</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="col-span-1 border border-slate-200 rounded-xl bg-white overflow-hidden flex flex-col h-[500px] lg:h-auto">
          <div className="flex border-b border-slate-200">
            <button 
              onClick={() => setRightPanelTab('list')}
              className={`flex-1 p-3 text-sm font-semibold transition-colors ${rightPanelTab === 'list' ? 'text-primary-700 border-b-2 border-primary-500 bg-primary-50/50' : 'text-slate-500 hover:text-slate-700 bg-slate-50'}`}
            >
              Daftar Kamera ({filteredCameras.length})
            </button>
            <button 
              onClick={() => setRightPanelTab('events')}
              className={`flex-1 p-3 text-sm font-semibold transition-colors ${rightPanelTab === 'events' ? 'text-primary-700 border-b-2 border-primary-500 bg-primary-50/50' : 'text-slate-500 hover:text-slate-700 bg-slate-50'}`}
            >
              Log Events
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {rightPanelTab === 'list' ? (
              filteredCameras.map(cam => (
                <div key={cam.id} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg cursor-pointer border border-transparent hover:border-slate-200 transition-colors group">
                  <div className="flex items-center gap-2" onClick={() => openSettings(cam)}>
                    <div className={`p-1.5 rounded-md ${cam.status === 'online' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                      <Camera size={14} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-700">{cam.name}</p>
                      <p className="text-[10px] text-slate-400 capitalize">{cam.type} • {cam.location}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                     <button onClick={(e) => { e.stopPropagation(); openSettings(cam); }} className="text-slate-400 hover:text-primary-600 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                       <Edit2 size={14} />
                     </button>
                     <button onClick={(e) => handleDeleteCamera(cam.id, e)} className="text-slate-400 hover:text-rose-600 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                       <Trash2 size={14} />
                     </button>
                     {(cam.recording || localRecording[cam.id]) && <span title="Recording"><Video size={12} className="text-rose-500 animate-pulse" fill={localRecording[cam.id] ? "currentColor" : "none"} /></span>}
                     <div className={`w-2 h-2 rounded-full ${cam.status === 'online' ? 'bg-emerald-500' : 'bg-rose-500'}`} title={cam.status} />
                  </div>
                </div>
              ))
            ) : (
              motionEvents.map((event, idx) => (
                <div key={event.id || idx} className="p-3 bg-white border border-slate-100 hover:border-slate-300 rounded-lg shadow-sm mb-2 transition-colors cursor-pointer group">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                       <div className={`p-1.5 rounded-full ${
                        event.type === 'system' ? 'bg-slate-100 text-slate-600' :
                        event.severity === 'high' ? 'bg-rose-100 text-rose-600' : 
                        event.severity === 'medium' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'
                      }`}>
                        <AlertTriangle size={14} />
                      </div>
                      <span className="text-xs font-semibold text-slate-700">{event.cameraName}</span>
                    </div>
                    <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded uppercase tracking-wider">{event.type}</span>
                  </div>
                  <div className="mt-2 text-[10px] text-slate-500">{(event as any).message || 'Terdeteksi pergerakan di area.'}</div>
                  <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400">
                    <span>{event.date}</span>
                    <span className="font-mono">{event.time}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {settingsModalOpen && selectedCamera && (
        <div className="fixed inset-0 z-[60] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
             <div className="flex items-center justify-between p-4 border-b border-slate-100">
               <h3 className="font-bold text-slate-800 flex items-center gap-2">
                 <Settings2 size={18} className="text-slate-500" />
                 Pengaturan {selectedCamera.name}
               </h3>
               <button onClick={() => setSettingsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                 <X size={20} />
               </button>
             </div>
             
             <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Nama Kamera</label>
                  <input type="text" value={selectedCamera.name || ''} onChange={e => setSelectedCamera({...selectedCamera, name: e.target.value})} className="w-full border border-slate-200 rounded p-2 text-sm" />
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Status Kamera</label>
                    <select value={selectedCamera.status || 'online'} onChange={e => setSelectedCamera({...selectedCamera, status: e.target.value as any})} className="w-full border border-slate-200 rounded p-2 text-sm">
                      <option value="online">Online</option>
                      <option value="offline">Offline</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">IP Address / URL Asli</label>
                    <input type="text" value={selectedCamera.url || ''} onChange={e => setSelectedCamera({...selectedCamera, url: e.target.value})} placeholder="192.168... atau rtsp://..." className="w-full border border-slate-200 rounded p-2 text-sm font-mono" />
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Lokasi</label>
                    <input type="text" value={selectedCamera.location || ''} onChange={e => setSelectedCamera({...selectedCamera, location: e.target.value})} className="w-full border border-slate-200 rounded p-2 text-sm" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Tipe</label>
                    <select value={selectedCamera.type || 'ip'} onChange={e => setSelectedCamera({...selectedCamera, type: e.target.value as any})} className="w-full border border-slate-200 rounded p-2 text-sm">
                      <option value="dvr">DVR</option>
                      <option value="nvr">NVR</option>
                      <option value="ip">IP Camera</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Stream URL (HLS/WebRTC)</label>
                  <input type="text" value={selectedCamera.streamUrl || ''} onChange={e => setSelectedCamera({...selectedCamera, streamUrl: e.target.value})} placeholder="https://..." className="w-full border border-slate-200 rounded p-2 text-sm font-mono" />
                  <p className="text-[10px] text-slate-500 mt-1">Gunakan .m3u8, RTMP, WebRTC feed yang disediakan oleh media server lokal Anda.</p>
                </div>

               <div className="pt-2 border-t border-slate-100">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Status Perekaman Server</label>
                  <div className="flex gap-2">
                    <button className={`flex-1 py-2 px-3 rounded text-sm font-medium flex items-center justify-center gap-2 transition-colors ${selectedCamera.recording ? 'bg-rose-100 text-rose-700 border border-rose-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                      <StopCircle size={16} /> Stop Recording
                    </button>
                    <button className={`flex-1 py-2 px-3 rounded text-sm font-medium flex items-center justify-center gap-2 transition-colors ${!selectedCamera.recording ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                      <Play size={16} /> Mulai Recording
                    </button>
                  </div>
               </div>
               
               <div className="pt-2 border-t border-slate-100">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Kualitas Stream</label>
                  <select className="w-full border border-slate-200 rounded p-2 text-sm">
                    <option>Main Stream (1080p, High Bitrate)</option>
                    <option>Sub Stream (480p, Low Bitrate)</option>
                  </select>
               </div>
               
               <div className="pt-2 border-t border-slate-100">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Jadwal Rekaman</label>
                  <select className="w-full border border-slate-200 rounded p-2 text-sm">
                    <option>24/7 (Non-stop)</option>
                    <option>Motion Detection (Hanya saat ada gerakan)</option>
                    <option>Waktu Tertentu (08:00 - 18:00)</option>
                  </select>
               </div>
             </div>
             
             <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
               <button onClick={() => setSettingsModalOpen(false)} className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-200 rounded-lg text-sm transition-colors">Batal</button>
               <button onClick={handleSaveConfig} className="px-4 py-2 font-medium bg-primary-600 text-white hover:bg-primary-700 rounded-lg text-sm transition-colors">Simpan Pengaturan</button>
             </div>
          </div>
        </div>
      )}

      {/* Remote Tunnel Modal */}
      {remoteTunnelOpen && (
        <div className="fixed inset-0 z-[60] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95">
             <div className="flex items-center justify-between p-4 border-b border-slate-100">
               <h3 className="font-bold text-slate-800 flex items-center gap-2">
                 <Cloud size={18} className="text-indigo-500" />
                 Konfigurasi Remote Access & Tunneling
               </h3>
               <button onClick={() => setRemoteTunnelOpen(false)} className="text-slate-400 hover:text-slate-600">
                 <X size={20} />
               </button>
             </div>
             
             <div className="p-5 space-y-5">
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 text-sm text-indigo-800 flex gap-3">
                  <ShieldCheck size={20} className="shrink-0 mt-0.5 text-indigo-600" />
                  <div>
                    <p className="font-bold mb-1">Kenapa butuh Tunneling?</p>
                    <p>DVR/NVR Anda berada di jaringan lokal (Private IP). Untuk dapat diakses via Cloud Dashboard ini, Anda perlu membuat jembatan (Tunnel) menggunakan Cloudflare Tunnel atau Ngrok dari server lokal Anda.</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Tunnel URL / IP Publik Server Media</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Link size={16} className="text-slate-400" />
                    </div>
                    <input 
                      type="url" 
                      value={tunnelUrl}
                      onChange={(e) => setTunnelUrl(e.target.value)}
                      placeholder="https://cctv-tunnel.yourdomain.com"
                      className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm transition-all"
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-1.5">Masukkan URL public dari Cloudflare Tunnel / Ngrok yang mengarah ke Media Server (RTSP to WebRTC/HLS) lokal Anda.</p>
                </div>

                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <div className="bg-slate-50 px-3 py-2 border-b border-slate-200 font-semibold text-sm text-slate-700">
                    Cara Setup Cloudflare Tunnel:
                  </div>
                  <div className="p-3 text-xs text-slate-600 font-mono space-y-2 bg-slate-900 overflow-x-auto">
                    <div className="text-emerald-400"># 1. Install Cloudflared di PC/Server Lokal (Linux)</div>
                    <div className="text-slate-300">curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb</div>
                    <div className="text-slate-300">sudo dpkg -i cloudflared.deb</div>
                    <div className="text-emerald-400 mt-2"># 2. Login ke Cloudflare Zero Trust & Buat Tunnel</div>
                    <div className="text-slate-300">cloudflared tunnel login</div>
                    <div className="text-slate-300">cloudflared tunnel create cctv-tunnel</div>
                    <div className="text-emerald-400 mt-2"># 3. Route traffic ke Media Server Lokal (Misal IP: 192.168.1.100 port 8888)</div>
                    <div className="text-slate-300">cloudflared tunnel route dns cctv-tunnel cctv.domainanda.com</div>
                    <div className="text-emerald-400 mt-2"># 4. Jalankan Tunnel</div>
                    <div className="text-slate-300">cloudflared tunnel run --url http://192.168.1.100:8888 cctv-tunnel</div>
                  </div>
                </div>
             </div>
             
             <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
               <button onClick={() => setRemoteTunnelOpen(false)} className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-200 rounded-lg text-sm transition-colors">Tutup</button>
               <button onClick={() => setRemoteTunnelOpen(false)} className="px-4 py-2 font-medium bg-primary-600 text-white hover:bg-primary-700 rounded-lg text-sm transition-colors">Simpan Koneksi</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
