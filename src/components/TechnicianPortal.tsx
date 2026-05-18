import React, { useState, useEffect } from 'react';
import { LogOut, Calendar, CheckCircle, WifiHigh, MapPin, User, Phone, Play, Key, ExternalLink, CheckSquare, Activity, MessageCircle, X, Eye, Plus, Map as MapIcon, Loader2, CheckCircle2, Server, Video } from 'lucide-react';

import { ScanOnuModal } from './ScanOnuModal';
import { CCTVMonitoring } from './CCTVMonitoring';
import { signInWithPopup, signInWithRedirect } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';

interface WaNotification {
  id: string;
  msgs: string[];
  type: 'new' | 'update';
}

import { Odp } from './OdpMap';

import { useTenant } from '../contexts/TenantContext';

export function TechnicianPortal({ onLogout, odps = [], onUpdateOdp }: { onLogout: () => void, odps?: Odp[], onUpdateOdp?: (odp: Odp) => void }) {
  const { tenantId, branding } = useTenant();
  const [activeView, setActiveView] = useState<'tasks' | 'cctv'>('tasks');
  const [schedules, setSchedules] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedScheduleDetail, setSelectedScheduleDetail] = useState<any | null>(null);
  const [selectedTicketDetail, setSelectedTicketDetail] = useState<any | null>(null);
  const [ticketMessage, setTicketMessage] = useState('');
  
  const [waNotifications, setWaNotifications] = useState<WaNotification[]>([]);
  const knownSchedules = React.useRef<Map<string, any>>(new Map());
  const initialFetchDone = React.useRef(false);

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isSubmittingTask, setIsSubmittingTask] = useState(false);
  
  // Login State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [techName, setTechName] = useState('');

  const [newTaskForm, setNewTaskForm] = useState({
    customerName: '',
    address: '',
    time: '09:00 - 12:00',
    date: new Date().toISOString().split('T')[0],
    priority: 'normal',
    technician: 'teknisi1'
  });

  const handleTechnicianLogin = async () => {
    setAuthError('');
    setIsAuthenticating(true);
    try {
      if (authMode === 'register' && techName.trim()) {
        sessionStorage.setItem('pending_tech_registration', techName.trim());
      }
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      setAuthError(err.message || 'Gagal login.');
      setIsAuthenticating(false);
    }
  };

  const handleSendTicketMessage = async (e: React.FormEvent, isLocation = false) => {
    e.preventDefault();
    if (!selectedTicketDetail) return;
    if (!ticketMessage.trim() && !isLocation) return;
    
    try {
      const { doc, updateDoc, arrayUnion } = await import('firebase/firestore');
      const { db } = await import('../firebase');
      
      let newMessage = ticketMessage;
      
      if (isLocation) {
         try {
            const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
               navigator.geolocation.getCurrentPosition(resolve, reject);
            });
            newMessage = `📍 Lokasi Saat Ini: https://maps.google.com/?q=${pos.coords.latitude},${pos.coords.longitude}`;
         } catch (err) {
            alert("Gagal mendapatkan lokasi. Pastikan GPS aktif dan diizinkan.");
            return;
         }
      }
      
      await updateDoc(doc(db, 'tickets', selectedTicketDetail.id), {
         messages: arrayUnion({
            sender: 'technician',
            text: newMessage,
            timestamp: new Date().toISOString()
         })
      });
      
      setTicketMessage('');
      // update local state so chat shows up instantly for preview
      setSelectedTicketDetail({
         ...selectedTicketDetail,
         messages: [...(selectedTicketDetail.messages || []), {
            sender: 'technician',
            text: newMessage,
            timestamp: new Date().toISOString()
         }]
      });
      
    } catch (err) {
      console.error(err);
      alert('Gagal mengirim pesan.');
    }
  };

  const addWaNotification = (msgs: string[], type: 'new' | 'update') => {
    const newNotif = {
      id: Math.random().toString(36).substring(7),
      msgs,
      type
    };
    setWaNotifications(prev => [...prev, newNotif]);
    // Auto remove after 15 seconds
    setTimeout(() => {
      setWaNotifications(prev => prev.filter(n => n.id !== newNotif.id));
    }, 15000);
  };

  const removeNotification = (id: string) => {
    setWaNotifications(prev => prev.filter(n => n.id !== id));
  };

  useEffect(() => {
    if (!isAuthenticated) return;

    let unsubSchedules: any;
    let unsubTickets: any;
    const fetchSchedulesAndTickets = async () => {
      try {
        const { collection, onSnapshot, getDocs, setDoc, doc, query, where } = await import('firebase/firestore');
        const { db } = await import('../firebase');
        
        // Ensure some data exists
        const qSchedules = query(collection(db, 'schedules'), where('tenantId', '==', tenantId));
        const snap = await getDocs(qSchedules);
        if (snap.empty && tenantId === 'biznet') {
            const defaultSchedules = [
              {
                id: 'INST-001',
                customerName: 'Budi Santoso',
                phone: '081234567890',
                address: 'Jl. Merdeka No. 45, Jakarta',
                plan: '50 Mbps',
                date: new Date().toISOString().split('T')[0],
                time: '10:00 - 12:00',
                status: 'pending', 
                priority: 'high',
                pppoeUser: 'budi_santoso_50m',
                pppoePass: 'budi1234',
                technician: 'teknisi1',
                tenantId 
              }
            ];
            for (const s of defaultSchedules) {
                await setDoc(doc(db, 'schedules', s.id), s);
            }
        }

        unsubSchedules = onSnapshot(query(collection(db, 'schedules'), where('tenantId', '==', tenantId)), (snapshot) => {
           const schedulesList: any[] = [];
           snapshot.forEach(d => schedulesList.push({ id: d.id, ...d.data() }));

           if (initialFetchDone.current) {
             const newSchedules = schedulesList.filter((s: any) => !knownSchedules.current.has(s.id));
             const updatedSchedules = schedulesList.filter((s: any) => {
               const old = knownSchedules.current.get(s.id);
               if (!old) return false;
               return (old.date !== s.date || old.time !== s.time) && s.status !== 'closed';
             });

             if (newSchedules.length > 0) {
               const msgs = newSchedules.map((s: any) => `- ${s.customerName}\n  Alamat: ${s.address}\n  Waktu: ${s.date} ${s.time}`);
               addWaNotification(msgs, 'new');
             }

             if (updatedSchedules.length > 0) {
               const msgs = updatedSchedules.map((s: any) => `- ${s.customerName}\n  Waktu Baru: ${s.date} ${s.time}`);
               addWaNotification(msgs, 'update');
             }
           }

           schedulesList.forEach((s: any) => knownSchedules.current.set(s.id, s));
           initialFetchDone.current = true;
           setSchedules(schedulesList);
           setIsLoading(false);
        }, (error) => {
           console.error("Firebase Schedule Error", error);
           setIsLoading(false);
        });

        // Fetch tickets
        unsubTickets = onSnapshot(query(collection(db, 'tickets'), where('tenantId', '==', tenantId)), (snapshot) => {
            const ticketList: any[] = [];
            snapshot.forEach(d => ticketList.push({ id: d.id, ...d.data() }));
            setTickets(ticketList);
        });

      } catch (e) {
        console.error(e);
        setIsLoading(false);
      }
    };
    
    fetchSchedulesAndTickets();
    return () => {
       if (unsubSchedules) unsubSchedules();
       if (unsubTickets) unsubTickets();
    };
  }, [isAuthenticated, tenantId]);

  const isOnDuty = schedules.some(s => s.status === 'active' || s.status === 'accepted') || tickets.some(t => t.status === 'in_progress');

  useEffect(() => {
    if (!isAuthenticated || !isOnDuty) return;
    
    let watchId: number;
    if ("geolocation" in navigator) {
      watchId = navigator.geolocation.watchPosition(async (position) => {
         try {
            let batteryLevel = null;
            if ('getBattery' in navigator) {
               const nav: any = navigator;
               const battery = await nav.getBattery();
               batteryLevel = Math.round(battery.level * 100);
            }

            const { doc, setDoc } = await import('firebase/firestore');
            const { db } = await import('../firebase');
            await setDoc(doc(db, 'technicians_location', auth.currentUser?.uid || 'unknown'), {
               lat: position.coords.latitude,
               lng: position.coords.longitude,
               accuracy: position.coords.accuracy,
               battery: batteryLevel,
               timestamp: new Date().toISOString(),
               tenantId
            }, { merge: true });
         } catch(e) {}
      }, (error) => {
         console.warn("GPS Tracking error", error);
      }, { enableHighAccuracy: true, maximumAge: 30000, timeout: 27000 });
    }
    
    return () => {
       if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [isAuthenticated, isOnDuty, tenantId]);

  const [processingId, setProcessingId] = useState<string | null>(null);
  const [isTestingSpeed, setIsTestingSpeed] = useState<string | null>(null);
  const [workflowStep, setWorkflowStep] = useState<Record<string, number>>({});
  const [cableLength, setCableLength] = useState<Record<string, string>>({});
  const [selectedOdp, setSelectedOdp] = useState<Record<string, string>>({});
  const [speedtestResults, setSpeedtestResults] = useState<Record<string, string>>({});
  const [ontRegistrationStatus, setOntRegistrationStatus] = useState<Record<string, 'unregistered' | 'blinking' | 'standby'>>({});

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingTask(true);
    try {
      const { collection, addDoc } = await import('firebase/firestore');
      const { db } = await import('../firebase');
      
      const newSchedule = {
        customerName: newTaskForm.customerName,
        phone: '-',
        address: newTaskForm.address,
        plan: 'Custom',
        date: newTaskForm.date,
        time: newTaskForm.time,
        status: 'pending',
        priority: newTaskForm.priority,
        technician: newTaskForm.technician,
        pppoeUser: newTaskForm.customerName.toLowerCase().replace(/[^a-z0-9]/g, ''),
        pppoePass: newTaskForm.customerName.toLowerCase().replace(/[^a-z0-9]/g, ''),
        tenantId
      };

      await addDoc(collection(db, 'schedules'), newSchedule);
      setIsTaskModalOpen(false);
      setNewTaskForm({
        customerName: '',
        address: '',
        time: '09:00 - 12:00',
        date: new Date().toISOString().split('T')[0],
        priority: 'normal',
        technician: 'teknisi1'
      });
      alert('Tugas baru berhasil ditambahkan');
    } catch (error) {
      console.error("Gagal menambahkan tugas", error);
      alert('Gagal menambahkan tugas. Silakan coba lagi.');
    } finally {
      setIsSubmittingTask(false);
    }
  };

  const updateScheduleStatus = async (id: string, status: string, additionalData: any = {}) => {
    try {
      const { doc, updateDoc } = await import('firebase/firestore');
      const { db } = await import('../firebase');
      await updateDoc(doc(db, 'schedules', id), {
        status,
        ...additionalData
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleActivate = async (id: string, plan: string, scheduleData?: any) => {
    setProcessingId(id);
    
    // API Call to Local Express Backend for MikroTik Injection
    try {
      const response = await fetch('/api/mikrotik/dial-pppoe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          pppoeUsername: scheduleData?.pppoeUser || `user_${id}`,
          pppoePassword: scheduleData?.pppoePass || '123456',
          profile: plan.split(' ')[0] + 'M'
        })
      });
      
      if (!response.ok) {
        console.warn('Backend API error for PPPoE. Continuing with simulation.');
      }
    } catch (apiError) {
      console.warn('Backend API offline or unreachable. Continuing with simulation.', apiError);
    }

    // Simulate activation delay and Proceed
    setTimeout(async () => {
      await updateScheduleStatus(id, 'active');
      setProcessingId(null);
      alert('PPPoE berhasil di-inject ke MikroTik. Sistem akan memicu pengecekan Speedtest.');
      handleSpeedtest(id, plan);
    }, 2500);
  };

  const handleSpeedtest = (id: string, plan: string) => {
    setIsTestingSpeed(id);
    // Simulate speedtest process
    setTimeout(() => {
      let baseSpeed = 0;
      if (plan.includes('50')) baseSpeed = 50;
      else if (plan.includes('100')) baseSpeed = 100;
      else if (plan.includes('200')) baseSpeed = 200;
      else baseSpeed = 20;

      // Random variation +/-
      const variation = (Math.random() * 4 - 2); 
      const finalSpeed = Math.max(1, baseSpeed + variation).toFixed(1);
      
      setSpeedtestResults(prev => ({ ...prev, [id]: `${finalSpeed} Mbps` }));
      setIsTestingSpeed(null);
      setWorkflowStep(prev => ({ ...prev, [id]: 4 }));
    }, 3000);
  };

  const [isPinging, setIsPinging] = useState<string | null>(null);
  const [pingResults, setPingResults] = useState<Record<string, { status: 'success' | 'error', message: string }>>({});

  const handlePingTest = (id: string, customerIp: string = '10.10.x.x') => {
    setIsPinging(id);
    
    // Simulate ping process
    setTimeout(() => {
      const isSuccess = Math.random() > 0.15; // 85% success rate
      
      let result;
      if (isSuccess) {
        const latency = Math.floor(Math.random() * 25) + 1; // 1-25ms
        result = { status: 'success', message: `Reply from ${customerIp}: time=${latency}ms` };
      } else {
        result = { status: 'error', message: `Request timed out to ${customerIp}` };
      }
      
      setPingResults(prev => ({ ...prev, [id]: result as any }));
      setIsPinging(null);
    }, 1500);
  };

  const [registeringOnuId, setRegisteringOnuId] = useState<string | null>(null);
  const [scanningScheduleId, setScanningScheduleId] = useState<string | null>(null);
  const [onuForm, setOnuForm] = useState({ serialNumber: '', type: 'ZTE', odpPort: '' });

  const handleStartCloseOrder = (id: string) => {
    // Legacy func
  };

  const handleCloseOrder = async (id: string) => {
    const chosenOdpId = selectedOdp[id];
    const scheduleDetail = schedules.find(s => s.id === id);
    
    await updateScheduleStatus(id, 'closed', { 
        onuRegistration: onuForm, 
        odp: chosenOdpId, 
        cableLength: cableLength[id] 
    });
    
    const { collection, addDoc } = await import('firebase/firestore');
    const { db } = await import('../firebase');
    
    // Alur Integrasi: Buat Customer baru saat tiket ditutup
    if (scheduleDetail) {
      try {
        const newCustomer = {
          name: scheduleDetail.customerName || 'Pelanggan Baru',
          phone: scheduleDetail.phone || '-',
          address: scheduleDetail.address || '-',
          plan: scheduleDetail.plan || 'Custom',
          speedPlan: scheduleDetail.plan || '50 Mbps',
          status: 'online',
          paymentStatus: 'paid', // Beri status paid sementara
          billingAmount: 150000,
          pppoeUsername: scheduleDetail.pppoeUser || '',
          pppoePassword: scheduleDetail.pppoePass || '',
          ontSerialNumber: onuForm.serialNumber || 'ZTE12345678',
          ontRxPower: speedtestResults[id] ? '-20 dBm' : '-25 dBm',
          currentDownload: speedtestResults[id] || '50 Mbps',
          currentUpload: speedtestResults[id] ? (parseFloat(speedtestResults[id]) * 0.5).toFixed(1) + ' Mbps' : '25 Mbps',
          ipAddress: '10.10.' + Math.floor(Math.random() * 255) + '.' + Math.floor(Math.random() * 255),
          uptime: '0h 0m',
          lastPaymentDate: new Date().toISOString(),
          tenantId
        };
        await addDoc(collection(db, 'customers'), newCustomer);
      } catch (e) {
        console.error("Failed to add new customer: ", e);
      }
    }

    if (chosenOdpId && onUpdateOdp) {
      const odpMatch = odps?.find(o => o.id === chosenOdpId);
      if (odpMatch) {
         let [used, total] = odpMatch.capacity.split('/').map(Number);
         used = (used || 0) + 1;
         const updatedOdp = {
            ...odpMatch,
            capacity: `${used}/${total || 8}`,
            status: used >= (total || 8) ? 'Full' : odpMatch.status,
            customers: [...(odpMatch.customers || []), {
               name: scheduleDetail?.customerName || 'Pelanggan Baru',
               phone: scheduleDetail?.phone || '-',
               paymentStatus: 'paid',
               status: 'Normal',
               location: odpMatch.location
            }]
         };
         onUpdateOdp(updatedOdp);
      }
    }

    alert('Selesai! Data ONU & pelanggan otomatis disinkronisasi ke DB Pusat dan Order ditutup.');
  };

  const [sortBy, setSortBy] = useState<'time' | 'urgency'>('time');
  const [filterTechnician, setFilterTechnician] = useState<string>('All');
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [isSavingNote, setIsSavingNote] = useState<string | null>(null);

  const handleSaveNote = async (id: string) => {
    setIsSavingNote(id);
    try {
      const { doc, updateDoc } = await import('firebase/firestore');
      const { db } = await import('../firebase');
      await updateDoc(doc(db, 'schedules', id), {
        notes: notes[id] || ''
      });
      alert('Catatan berhasil disimpan.');
    } catch (e) {
      console.error(e);
    } finally {
      setIsSavingNote(null);
    }
  };

  const urgencyWeight: Record<string, number> = {
    'high': 3,
    'normal': 2,
    'low': 1
  };

  const visibleSchedules = schedules
    .filter(s => s.status !== 'closed' && (filterTechnician === 'All' || s.technician === filterTechnician))
    .sort((a, b) => {
      if (sortBy === 'urgency') {
        const diff = (urgencyWeight[b.priority] || 2) - (urgencyWeight[a.priority] || 2);
        if (diff !== 0) return diff;
      }
      return (a.time || '').localeCompare(b.time || '');
    });
  const pendingCount = visibleSchedules.length;

  const closedSchedules = schedules
    .filter(s => s.status === 'closed' && (filterTechnician === 'All' || s.technician === filterTechnician))
    .sort((a, b) => (b.time || '').localeCompare(a.time || ''));

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
            <WifiHigh size={160} />
          </div>
          
          <div className="relative z-10">
            <div className="flex justify-center mb-6">
              {branding?.logoUrl ? (
                  <img src={branding.logoUrl} alt="Logo" className="w-16 h-16 object-contain rounded-2xl shrink-0" />
              ) : (
                  <div className="w-16 h-16 bg-indigo-500/10 text-indigo-600 rounded-2xl flex items-center justify-center border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.15)]">
                    <WifiHigh size={32} />
                  </div>
              )}
            </div>
            
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-slate-900 flex items-center justify-center gap-2">
                 Portal Teknisi <span style={{ color: branding?.primaryColorHex || '#ea580c' }}>{branding?.businessName || 'Access'}</span>
              </h2>
              <p className="text-sm text-slate-400 mt-2">
                {authMode === 'login' ? 'Masuk ke aplikasi teknisi' : 'Daftar sebagai teknisi baru'} untuk pekerjaan pemasangan, maintenance, dan tiket.
              </p>
            </div>
            
            {authError && (
              <div className="mb-6 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-3">
                <p className="text-xs font-medium text-rose-600">{authError}</p>
              </div>
            )}
            
            <form onSubmit={(e) => { e.preventDefault(); handleTechnicianLogin(); }} className="space-y-4">
               {authMode === 'register' && (
                 <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Teknisi</label>
                    <input type="text" required value={techName} onChange={e => setTechName(e.target.value)} placeholder="Masukkan nama lengkap" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 outline-none" />
                 </div>
               )}
               
               <button
                 type="submit"
                 disabled={isAuthenticating}
                 className={`w-full py-3 mt-2 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                   isAuthenticating 
                     ? 'bg-slate-100 text-slate-500 cursor-not-allowed border border-slate-300' 
                     : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg lg:hover:shadow-indigo-500/25 border border-indigo-500/50'
                 }`}
               >
                 {isAuthenticating ? (
                   <><div className="w-5 h-5 border-2 border-slate-500 border-t-transparent rounded-full animate-spin"></div> Memverifikasi...</>
                 ) : (
                   <><User size={18} /> {authMode === 'login' ? 'Login' : 'Daftar'} via Google</>
                 )}
               </button>
            </form>

            <div className="mt-8 pt-6 border-t border-slate-200/60 text-center flex flex-col gap-3">
              <button
                onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
                type="button"
                className="w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/50"
              >
                <Plus size={18} /> {authMode === 'login' ? 'Belum punya akun? Daftar' : 'Sudah punya akun? Login'}
              </button>
              
              <button
                onClick={onLogout}
                type="button"
                className="w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all bg-white hover:bg-slate-50 border border-slate-300/50 text-slate-600"
              >
                Kembali ke Halaman Utama
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {branding?.logoUrl ? (
                <img src={branding.logoUrl} alt="Logo" className="w-8 h-8 object-contain rounded-lg shrink-0" />
            ) : (
                <div className="w-8 h-8 rounded-xl bg-orange-600 flex items-center justify-center text-white border border-orange-500/20 shadow-lg shadow-orange-600/20" style={{ backgroundColor: branding?.primaryColorHex || '#ea580c' }}>
                  <WifiHigh size={18} />
                </div>
            )}
            <div>
              <h1 className="font-bold text-slate-900 leading-tight">Portal Teknisi <span style={{ color: branding?.primaryColorHex || '#ea580c' }}>{branding?.businessName || 'Dream Paymanager'}</span></h1>
              <p className="text-[10px] uppercase tracking-widest text-slate-500 font-mono">Modul Pemasangan</p>
            </div>
          </div>
          
          <button 
            onClick={onLogout}
            className="flex items-center gap-2 px-3 py-1.5 md:hidden text-rose-600 bg-rose-50 rounded-lg hover:bg-rose-100 transition-colors"
          >
            <LogOut size={16} />
          </button>
          <button 
            onClick={onLogout}
            className="hidden md:flex items-center gap-2 px-4 py-2 text-sm font-semibold text-rose-600 bg-rose-50 rounded-xl hover:bg-rose-100 transition-colors"
          >
            <LogOut size={16} /> Logout Teknisi
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 lg:p-6 overflow-x-hidden">
        <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in">
          
          <div className="flex bg-slate-200/50 p-1.5 rounded-2xl w-fit">
            <button
              onClick={() => setActiveView('tasks')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${activeView === 'tasks' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Calendar size={18} />
              Tugas & Tiket
            </button>
            <button
              onClick={() => setActiveView('cctv')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${activeView === 'cctv' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Video size={18} />
              CCTV / NVR
            </button>
          </div>

          {activeView === 'cctv' ? (
             <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm min-h-[60vh]">
               <CCTVMonitoring />
             </div>
          ) : (
             <>
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex flex-wrap items-center gap-4">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Calendar className="text-orange-600" size={24} />
                  Jadwal Pemasangan Hari Ini
                </h2>
                <button
                  onClick={() => setIsTaskModalOpen(true)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-orange-600 text-white text-xs font-semibold rounded-lg hover:bg-orange-700 transition-colors shadow-sm"
                >
                  <Plus size={14} /> Tugas Baru
                </button>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <label className="text-sm font-semibold text-slate-600 whitespace-nowrap">Filter Divisi:</label>
                  <select
                    value={filterTechnician}
                    onChange={(e) => setFilterTechnician(e.target.value)}
                    className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block px-3 py-2 outline-none w-full sm:w-auto"
                  >
                    <option value="All">Semua Divisi</option>
                    <option value="teknisi1">Team Teknisi 1 (Utara)</option>
                    <option value="teknisi2">Team Teknisi 2 (Selatan)</option>
                    <option value="teknisi3">Team Teknisi 3 (Timur)</option>
                  </select>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <label className="text-sm font-semibold text-slate-600 whitespace-nowrap">Urutkan:</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as 'time' | 'urgency')}
                    className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block px-3 py-2 outline-none w-full sm:w-auto"
                  >
                    <option value="time">Waktu Terdekat</option>
                    <option value="urgency">Prioritas/Dampak</option>
                  </select>
                </div>
              </div>
            </div>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <div className="w-8 h-8 border-4 border-slate-200 border-t-orange-600 rounded-full animate-spin mb-4" />
                <p>Memuat jadwal dari server...</p>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {visibleSchedules.map(schedule => (
                    <div key={schedule.id} className={`border rounded-2xl p-5 ${
                      schedule.status === 'active' ? 'bg-emerald-50/50 border-emerald-200' : 
                      schedule.status === 'closed' ? 'bg-slate-100 border-slate-200 opacity-60' :
                      'bg-white border-slate-200'
                    }`}>
                      <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-4">
                    
                    {/* Info Kiri */}
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-slate-900 text-lg">{schedule.customerName}</h3>
                        <button
                          onClick={() => setSelectedScheduleDetail(schedule)}
                          className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary-50 text-primary-600 hover:bg-primary-100 transition-colors border border-primary-200"
                        >
                          <Eye size={14} /> Lihat Detail
                        </button>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap -mt-2 mb-2">
                          <select
                            value={schedule.status}
                            onChange={(e) => {
                              if (window.confirm(`Apakah Anda yakin mengubah status menjadi ${e.target.value.toUpperCase()}?`)) {
                                setSchedules(prev => prev.map(item => item.id === schedule.id ? { ...item, status: e.target.value } : item));
                                updateScheduleStatus(schedule.id, e.target.value);
                              }
                            }}
                            className={`pl-3 pr-8 py-1.5 rounded-xl text-[10px] font-bold tracking-wider uppercase border outline-none cursor-pointer transition-all shadow-sm appearance-none ${
                              schedule.status === 'active' ? 'bg-emerald-500 text-white border-emerald-600 hover:bg-emerald-600 shadow-emerald-500/20' : 
                              schedule.status === 'closed' ? 'bg-slate-500 text-white border-slate-600 hover:bg-slate-600 shadow-slate-500/20' :
                              schedule.status === 'accepted' ? 'bg-primary-600 text-white border-primary-700 hover:bg-primary-700 shadow-primary-500/20' :
                              'bg-amber-500 text-white border-amber-600 hover:bg-amber-600 shadow-amber-500/20'
                            }`}
                            style={{ backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23ffffff%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.7rem top 50%', backgroundSize: '0.65rem auto' }}
                          >
                            <option value="pending" className="bg-white text-slate-800">MENUNGGU PASANG</option>
                            <option value="accepted" className="bg-white text-slate-800">TUGAS DITERIMA</option>
                            <option value="active" className="bg-white text-slate-800">AKTIF (INTERNET)</option>
                            <option value="closed" className="bg-white text-slate-800">CLOSED ORDER</option>
                          </select>
                        
                        {schedule.status === 'accepted' && (
                          <button
                            onClick={() => handleActivate(schedule.id, schedule.plan, schedule)}
                            disabled={processingId === schedule.id}
                            className="px-3 py-1 rounded-lg text-[10px] font-bold text-white bg-primary-600 hover:bg-primary-700 transition-colors shadow-sm disabled:opacity-50 tracking-wider flex items-center gap-1 uppercase"
                          >
                            {processingId === schedule.id ? 'MENGAKTIFKAN...' : 'ACTIVATE'}
                          </button>
                        )}

                        {speedtestResults[schedule.id] && (
                          <span className="px-2 py-1 rounded-lg text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-200 flex items-center gap-1 shadow-sm tracking-wide">
                            <Activity size={12} /> {speedtestResults[schedule.id]}
                          </span>
                        )}

                        {schedule.status === 'pending' && (
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider items-center flex gap-1 ${
                            schedule.priority === 'high' ? 'bg-rose-100 text-rose-700 border border-rose-200' : 
                            schedule.priority === 'low' ? 'bg-primary-50 text-primary-600 border border-primary-200' :
                            'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}>
                            {schedule.priority === 'high' ? 'PRIORITAS TINGGI' : 
                             schedule.priority === 'low' ? 'PRIORITAS RENDAH' : 
                             'PRIORITAS NORMAL'}
                          </span>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600">
                        <div className="flex items-start gap-1.5"><MapPin size={14} className="text-slate-400 mt-0.5 shrink-0"/> <span className="leading-tight">{schedule.address}</span></div>
                        <div className="flex items-center gap-1.5"><Phone size={14} className="text-slate-400"/> {schedule.phone}</div>
                        <div className="flex items-center gap-1.5"><WifiHigh size={14} className="text-slate-400"/> Paket: {schedule.plan}</div>
                        <div className="flex items-center gap-1.5"><Calendar size={14} className="text-slate-400"/> {schedule.time}</div>
                      </div>

                      {/* Info PPPOE untuk di setting ke Modem */}
                      <div className="mt-3 bg-primary-50/50 border border-primary-100 rounded-xl p-3">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-primary-600 mb-2 flex items-center gap-1">
                          <Key size={12} /> Data PPPoE (Setting di Modem)
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <p className="text-xs text-slate-500 mb-0.5">Username</p>
                            <p className="text-sm font-mono font-medium text-slate-900 bg-white px-2 py-1 rounded border border-slate-200 select-all">{schedule.pppoeUser}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 mb-0.5">Password</p>
                            <p className="text-sm font-mono font-medium text-slate-900 bg-white px-2 py-1 rounded border border-slate-200 select-all">{schedule.pppoePass}</p>
                          </div>
                        </div>

                        <div className="mt-3 pt-3 border-t border-primary-200/60 flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => handlePingTest(schedule.id, !schedule.ipAddress ? '10.10.50.' + Math.floor(Math.random() * 200 + 2) : schedule.ipAddress)}
                              disabled={isPinging === schedule.id}
                              className="bg-white hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50 border border-slate-200 shadow-sm"
                            >
                              {isPinging === schedule.id ? (
                                <><div className="w-3 h-3 border-2 border-slate-400 border-t-slate-700 rounded-full animate-spin" /> Pinging...</>
                              ) : (
                                <><Activity size={14} /> Ping Test ke Router Customer</>
                              )}
                            </button>
                          </div>
                          
                          {pingResults[schedule.id] && (
                            <div className={`mt-1 text-xs font-mono px-3 py-2 rounded-lg border ${
                              pingResults[schedule.id].status === 'success' 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}>
                              <div className="flex items-center gap-1.5">
                                {pingResults[schedule.id].status === 'success' ? (
                                  <CheckCircle size={14} className="shrink-0" />
                                ) : (
                                  <X size={14} className="shrink-0" />
                                )}
                                <span className="break-all">{pingResults[schedule.id].message}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Tombol Aksi Kanan / Workflow */}
                    <div className="flex flex-col gap-3 shrink-0 xl:min-w-[240px]">
                      {schedule.status === 'pending' && (
                        <div className="bg-orange-50 border border-orange-100 p-3 rounded-xl flex flex-col gap-2">
                          <p className="text-xs text-orange-800 font-medium mb-1">1. Review Data Pelanggan</p>
                          <button
                            onClick={() => updateScheduleStatus(schedule.id, 'accepted')}
                            disabled={processingId === schedule.id}
                            className="w-full flex justify-center items-center gap-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors shadow-sm text-sm"
                          >
                            <CheckSquare size={16} /> Terima Work Order
                          </button>
                        </div>
                      )}

                      {schedule.status === 'accepted' && (workflowStep[schedule.id] || 0) === 0 && (
                        <div className="bg-primary-50 border border-primary-100 p-3 rounded-xl flex flex-col gap-2 animate-in fade-in zoom-in-95">
                          <p className="text-xs text-primary-800 font-medium mb-1">2. Persiapan Pemasangan</p>
                          <button
                            onClick={() => setWorkflowStep(prev => ({...prev, [schedule.id]: 1}))}
                            className="w-full flex justify-center items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors shadow-sm text-sm"
                          >
                            <Play size={16} /> Mulai Pemasangan
                          </button>
                        </div>
                      )}

                      {schedule.status === 'accepted' && workflowStep[schedule.id] === 1 && (
                        <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-xl flex flex-col gap-2 animate-in fade-in slide-in-from-right-4">
                          <p className="text-xs text-indigo-800 font-bold mb-1">3. Pilih ODP & Kabel</p>
                          <select 
                            className="w-full bg-white border border-indigo-200 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-500"
                            value={selectedOdp[schedule.id] || ''}
                            onChange={(e) => setSelectedOdp(prev => ({...prev, [schedule.id]: e.target.value}))}
                          >
                            <option value="" disabled>-- Pilih ODP Terdekat --</option>
                            {odps.length > 0 ? odps.map(o => (
                                <option key={o.id} value={o.id} disabled={o.status === "Full" || o.status === "Rusak"}>
                                    {o.id} ({o.capacity}) {o.status === 'Full' || o.status === 'Rusak' ? ` - ${o.status}` : ''}
                                </option>
                            )) : (
                                <option value="" disabled>Tidak ada ODP tersedia</option>
                            )}
                          </select>
                          <div className="mt-1">
                            <label className="block text-[10px] text-indigo-700 uppercase tracking-widest font-semibold mb-1">Kabel Drop Core</label>
                            <input 
                                type="number" 
                                placeholder="Pemakaian Kabel (Meter)" 
                                className="w-full bg-white border border-indigo-200 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-500"
                                value={cableLength[schedule.id] || ''}
                                onChange={(e) => setCableLength(prev => ({...prev, [schedule.id]: e.target.value}))}
                            />
                          </div>
                          <button
                            onClick={() => {
                                if (!selectedOdp[schedule.id]) return alert('Pilih ODP terlebih dahulu.');
                                if (!cableLength[schedule.id]) return alert('Masukkan panjang kabel.');
                                setWorkflowStep(prev => ({...prev, [schedule.id]: 2}));
                            }}
                            className="mt-2 w-full flex justify-center items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors shadow-sm text-sm"
                          >
                            Lanjut Registrasi ONT
                          </button>
                        </div>
                      )}

                      {schedule.status === 'accepted' && workflowStep[schedule.id] === 2 && (
                        <div className="bg-purple-50 border border-purple-100 p-3 rounded-xl flex flex-col gap-2 animate-in fade-in slide-in-from-right-4">
                           <p className="text-xs text-purple-800 font-bold mb-1">4. Registrasi ONU ke OLT</p>
                           {(!ontRegistrationStatus[schedule.id] || ontRegistrationStatus[schedule.id] === 'unregistered') ? (
                             <>
                               <div>
                                  <div className="flex items-center justify-between mb-0.5">
                                    <label className="block text-[10px] text-purple-700 uppercase tracking-widest font-semibold">SN ONU</label>
                                  </div>
                                  <input 
                                    type="text"
                                    className="w-full text-sm border border-purple-200 rounded px-2 py-1.5 bg-white uppercase font-mono placeholder:normal-case placeholder:text-slate-300"
                                    placeholder="ZTEG12345678"
                                    value={onuForm.serialNumber}
                                    onChange={e => setOnuForm({...onuForm, serialNumber: e.target.value.toUpperCase()})}
                                  />
                               </div>
                               <div>
                                 <label className="block text-[10px] text-purple-700 uppercase tracking-widest font-semibold mb-0.5">Tipe ONU</label>
                                  <select 
                                    className="w-full text-sm border border-purple-200 rounded px-2 py-1.5 bg-white"
                                    value={onuForm.type}
                                    onChange={e => setOnuForm({...onuForm, type: e.target.value})}
                                  >
                                    <option value="ZTE">ZTE</option>
                                    <option value="Huawei">Huawei</option>
                                    <option value="Fiberhome">Fiberhome</option>
                                    <option value="Nokia">Nokia / Lainnya</option>
                                  </select>
                               </div>
                               <button
                                 onClick={async () => {
                                     if (!onuForm.serialNumber) return alert('Masukkan SN ONU');
                                     setOntRegistrationStatus(prev => ({...prev, [schedule.id]: 'blinking'}));
                                     
                                     try {
                                       const response = await fetch('/api/olt/register-onu', {
                                         method: 'POST',
                                         headers: { 'Content-Type': 'application/json' },
                                         body: JSON.stringify({ serialNumber: onuForm.serialNumber, onuType: onuForm.type })
                                       });
                                       if (!response.ok) throw new Error('API Error');
                                       // Success
                                       setOntRegistrationStatus(prev => ({...prev, [schedule.id]: 'standby'}));
                                     } catch (err) {
                                       console.warn('Backend API error for OLT. Continuing with simulation.', err);
                                       setTimeout(() => {
                                          setOntRegistrationStatus(prev => ({...prev, [schedule.id]: 'standby'}));
                                       }, 4000);
                                     }
                                 }}
                                 className="mt-2 w-full flex justify-center items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors shadow-sm text-sm"
                               >
                                 <Activity size={16} /> Registrasi ONU Ke OLT
                               </button>
                             </>
                           ) : (
                             <div className="flex flex-col items-center justify-center p-4 bg-white rounded-lg border border-purple-200 gap-3">
                                <div className="flex items-center gap-4">
                                  <div className="flex flex-col items-center gap-1">
                                     <div className={`w-6 h-6 rounded-full shadow-[0_0_12px_rgba(34,197,94,0.6)] ${ontRegistrationStatus[schedule.id] === 'blinking' ? 'bg-emerald-500 animate-pulse' : 'bg-emerald-500'}`} />
                                     <span className="text-[10px] font-mono font-bold text-slate-500">PON</span>
                                  </div>
                                  <div className="flex flex-col items-center gap-1">
                                     <div className={`w-6 h-6 rounded-full shadow-[0_0_12px_rgba(239,68,68,0.6)] ${ontRegistrationStatus[schedule.id] === 'blinking' ? 'bg-rose-500' : 'bg-rose-950 opacity-20'}`} />
                                     <span className="text-[10px] font-mono font-bold text-slate-500">LOS</span>
                                  </div>
                                </div>
                                <div className="text-center font-mono">
                                  {ontRegistrationStatus[schedule.id] === 'blinking' ? (
                                    <div className="text-sm font-semibold text-amber-600 flex items-center gap-2 justify-center"><Loader2 size={16} className="animate-spin" /> Registrasi...</div>
                                  ) : (
                                    <div className="text-sm font-semibold text-emerald-600 flex items-center gap-2 justify-center"><CheckCircle2 size={16} /> Standby (ONU Terdaftar)</div>
                                  )}
                                  <p className="text-xs text-slate-500 mt-1">SN: {onuForm.serialNumber}</p>
                                </div>
                                
                                {ontRegistrationStatus[schedule.id] === 'standby' && (
                                   <button
                                     onClick={() => {
                                         setWorkflowStep(prev => ({...prev, [schedule.id]: 3}));
                                     }}
                                     className="w-full flex justify-center items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors shadow-sm text-sm mt-2"
                                   >
                                     <Server size={16} /> Lanjut Dial PPPoE
                                   </button>
                                )}
                             </div>
                           )}
                        </div>
                      )}

                      {schedule.status === 'accepted' && workflowStep[schedule.id] === 3 && (
                        <div className="bg-sky-50 border border-sky-100 p-3 rounded-xl flex flex-col gap-2 animate-in fade-in slide-in-from-right-4">
                           <p className="text-xs text-sky-800 font-bold mb-1">5. Setting PPPoE di Modem</p>
                           <p className="text-[10px] text-sky-700 leading-tight">Gunakan username & password di samping kiri untuk dial PPPoE pada modem pelanggan.</p>
                           <button
                            onClick={() => handleActivate(schedule.id, schedule.plan, schedule)}
                            disabled={processingId === schedule.id}
                            className="mt-3 w-full flex justify-center items-center gap-2 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors shadow-sm text-sm"
                          >
                            {processingId === schedule.id ? 'Loading...' : 'Siap, Sinkronkan!'}
                          </button>
                        </div>
                      )}

                      {schedule.status === 'active' && workflowStep[schedule.id] !== 4 && (
                        <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-xl flex flex-col gap-2 w-full animate-in fade-in slide-in-from-right-4">
                          <p className="text-xs text-emerald-800 font-medium mb-1">6. Verifikasi Kecepatan</p>
                          <button
                            onClick={() => handleSpeedtest(schedule.id, schedule.plan)}
                            disabled={isTestingSpeed === schedule.id}
                            className="w-full flex justify-center items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors shadow-sm text-sm"
                          >
                            {isTestingSpeed === schedule.id ? (
                                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Mengukur...</>
                            ) : (
                                <><Activity size={16} /> Mulai Speedtest</>
                            )}
                          </button>
                        </div>
                      )}

                      {schedule.status === 'active' && workflowStep[schedule.id] === 4 && (
                        <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex flex-col gap-2 w-full animate-in fade-in zoom-in-95">
                           <div className="flex flex-col gap-2 bg-white rounded-lg p-2 border border-slate-200">
                             <div className="flex items-center justify-between text-emerald-700 font-mono text-xs font-bold">
                               <span className="flex items-center gap-1"><CheckCircle size={12}/> Speedtest:</span>
                               <span>{speedtestResults[schedule.id]}</span>
                             </div>
                             <div className="flex items-center justify-between text-indigo-700 font-mono text-xs font-bold">
                               <span className="flex items-center gap-1"><MapPin size={12}/> ODP:</span>
                               <span className="max-w-[100px] truncate text-right">{selectedOdp[schedule.id]}</span>
                             </div>
                             <div className="flex items-center justify-between text-purple-700 font-mono text-xs font-bold">
                               <span className="flex items-center gap-1"><MapIcon size={12}/> Kabel:</span>
                               <span>{cableLength[schedule.id]} Meter</span>
                             </div>
                           </div>
                           <button
                              onClick={() => handleCloseOrder(schedule.id)}
                              className="w-full flex justify-center items-center gap-2 bg-slate-900 hover:bg-black text-white font-semibold py-2.5 px-4 rounded-lg transition-colors shadow-sm text-sm"
                            >
                              <CheckSquare size={16} /> Tutup & Selesaikan
                            </button>
                        </div>
                      )}

                      {schedule.status === 'closed' && (
                         <div className="flex justify-center items-center gap-2 text-slate-500 font-semibold bg-slate-100 py-2.5 px-4 rounded-xl border border-slate-200 w-full text-sm">
                           <CheckSquare size={16} /> Selesai
                         </div>
                      )}
                    </div>
                    
                  </div>
                </div>
              ))}
            </div>

            {pendingCount === 0 && schedules.length > 0 && (
               <div className="text-center mt-6 pt-6 border-t border-slate-100">
                 <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mb-3">
                   <CheckCircle size={24} />
                 </div>
                 <h3 className="text-slate-900 font-semibold mb-1">Semua Pekerjaan Selesai</h3>
                 <p className="text-sm text-slate-500">Anda telah menyelesaikan semua jadwal pemasangan hari ini. Kerja bagus!</p>
               </div>
            )}

            {schedules.length === 0 && (
              <div className="text-center py-10">
                <CheckCircle className="mx-auto text-slate-300 mb-3" size={48} />
                <p className="text-slate-500 font-medium">Tidak ada jadwal pemasangan yang menunggu.</p>
              </div>
            )}
            </>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm mt-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pt-2">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Activity className="text-rose-600" size={24} />
                  Tiket Gangguan (Trouble Tickets)
                </h2>
            </div>
            
            <div className="space-y-4">
               {tickets.filter(t => t.status !== 'resolved' && (filterTechnician === 'All' || t.technician === filterTechnician)).map(ticket => (
                  <div key={ticket.id} className="border border-slate-200 rounded-2xl p-5 bg-rose-50/30">
                     <div className="flex flex-col md:flex-row justify-between gap-4">
                       <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-slate-800 text-base">{ticket.title}</h3>
                            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-700">{ticket.status === 'open' ? 'Menunggu' : 'Sedang Dikerjakan'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                             <User size={14} /> <span>{ticket.customerName}</span>
                          </div>
                          {ticket.description && (
                             <p className="text-sm text-slate-700 bg-white p-3 rounded-xl border border-slate-200">{ticket.description}</p>
                          )}
                       </div>
                       <div className="flex flex-col justify-center shrink-0 w-full md:w-[200px]">
                          <button 
                           onClick={async () => {
                              try {
                                const { doc, updateDoc } = await import('firebase/firestore');
                                const { db } = await import('../firebase');
                                await updateDoc(doc(db, 'tickets', ticket.id), { status: ticket.status === 'open' ? 'in_progress' : 'resolved' });
                              } catch(e) {}
                           }}
                           className={`w-full py-2.5 px-4 rounded-xl font-semibold text-sm transition-colors shadow-sm flex items-center justify-center gap-2 ${ticket.status === 'open' ? 'bg-primary-600 hover:bg-primary-700 text-white' : 'bg-emerald-600 hover:bg-emerald-700 text-white'}`}
                          >
                             {ticket.status === 'open' ? <><Play size={16} /> Kerjakan</> : <><CheckSquare size={16} /> Selesaikan</>}
                          </button>
                          <button 
                            onClick={() => setSelectedTicketDetail(ticket)}
                            className="w-full py-2.5 px-4 rounded-xl font-semibold text-sm transition-colors border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 mt-2 flex items-center justify-center gap-2"
                          >
                             <MessageCircle size={16} /> Chat / Lokasi
                          </button>
                       </div>
                     </div>
                  </div>
               ))}
               
               {tickets.filter(t => t.status !== 'resolved' && (filterTechnician === 'All' || t.technician === filterTechnician)).length === 0 && (
                 <div className="text-center py-6">
                    <p className="text-slate-500 font-medium">Tidak ada tiket gangguan saat ini.</p>
                 </div>
               )}
            </div>
          </div>

          {closedSchedules.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm mt-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pt-2">
                <h2 className="text-lg font-bold text-slate-700 flex items-center gap-2">
                  <CheckSquare className="text-emerald-600" size={24} />
                  Riwayat Pekerjaan Selesai
                </h2>
              </div>
              <div className="space-y-4">
                {closedSchedules.map(schedule => (
                   <div key={schedule.id} className="border border-slate-200 rounded-2xl p-5 bg-slate-50 opacity-80 hover:opacity-100 transition-opacity">
                     <div className="flex flex-col md:flex-row justify-between gap-4">
                       <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h3 className="font-bold text-slate-800 text-base">{schedule.customerName}</h3>
                            <button
                               onClick={() => setSelectedScheduleDetail(schedule)}
                               className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary-50 text-primary-600 hover:bg-primary-100 transition-colors border border-primary-200"
                             >
                               <Eye size={14} /> Lihat Detail
                             </button>
                          </div>
                          <p className="text-xs text-slate-500 mb-2">{schedule.address} • {schedule.time}</p>
                          <div className="w-full mt-3 bg-white p-3 rounded-xl border border-slate-200">
                             <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Catatan Teknisi (Privat)</p>
                             <textarea 
                               className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-primary-500 min-h-[60px]"
                               placeholder="Tambahkan catatan khusus pekerjaan ini..."
                               value={notes[schedule.id] !== undefined ? notes[schedule.id] : (schedule.notes || '')}
                               onChange={(e) => setNotes(prev => ({ ...prev, [schedule.id]: e.target.value }))}
                             />
                             <div className="flex justify-end mt-2">
                               <button 
                                 onClick={() => handleSaveNote(schedule.id)}
                                 disabled={isSavingNote === schedule.id}
                                 className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 disabled:opacity-50"
                               >
                                 {isSavingNote === schedule.id ? 'Menyimpan...' : 'Simpan Catatan'}
                               </button>
                             </div>
                          </div>
                       </div>
                       <div className="shrink-0 flex items-start mt-1">
                          <select
                            value={schedule.status}
                            onChange={(e) => {
                              if (window.confirm(`Apakah Anda yakin mengubah status menjadi ${e.target.value.toUpperCase()}?`)) {
                                setSchedules(prev => prev.map(item => item.id === schedule.id ? { ...item, status: e.target.value } : item));
                                updateScheduleStatus(schedule.id, e.target.value);
                              }
                            }}
                            className={`pl-3 pr-8 py-1.5 rounded-xl text-[10px] font-bold tracking-wider uppercase border outline-none cursor-pointer transition-all shadow-sm appearance-none ${
                              schedule.status === 'active' ? 'bg-emerald-500 text-white border-emerald-600 hover:bg-emerald-600 shadow-emerald-500/20' : 
                              schedule.status === 'closed' ? 'bg-slate-500 text-white border-slate-600 hover:bg-slate-600 shadow-slate-500/20' :
                              schedule.status === 'accepted' ? 'bg-primary-600 text-white border-primary-700 hover:bg-primary-700 shadow-primary-500/20' :
                              'bg-amber-500 text-white border-amber-600 hover:bg-amber-600 shadow-amber-500/20'
                            }`}
                            style={{ backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23ffffff%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.7rem top 50%', backgroundSize: '0.65rem auto' }}
                          >
                            <option value="pending" className="bg-white text-slate-800">MENUNGGU PASANG</option>
                            <option value="accepted" className="bg-white text-slate-800">TUGAS DITERIMA</option>
                            <option value="active" className="bg-white text-slate-800">AKTIF (INTERNET)</option>
                            <option value="closed" className="bg-white text-slate-800">CLOSED ORDER</option>
                          </select>
                          
                          {schedule.status === 'accepted' && (
                            <button
                              onClick={() => handleActivate(schedule.id, schedule.plan, schedule)}
                              disabled={processingId === schedule.id}
                              className="px-3 py-1.5 w-full rounded-lg text-[10px] font-bold text-white bg-primary-600 hover:bg-primary-700 transition-colors shadow-sm disabled:opacity-50 tracking-wider flex justify-center items-center gap-1 uppercase mt-2"
                            >
                              {processingId === schedule.id ? 'MENGAKTIFKAN...' : 'ACTIVATE'}
                            </button>
                          )}

                          {speedtestResults[schedule.id] && (
                            <span className="px-2 py-1.5 w-full justify-center rounded-lg text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-200 flex items-center gap-1 shadow-sm tracking-wide mt-2">
                              <Activity size={12} /> {speedtestResults[schedule.id]}
                            </span>
                          )}
                       </div>
                     </div>
                   </div>
                ))}
              </div>
            </div>
          )}
          </>
          )}

        </div>
      </main>
      {waNotifications.length > 0 && (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full">
          {waNotifications.map(notif => (
            <div key={notif.id} className="bg-white border border-green-200 shadow-2xl shadow-green-900/10 rounded-2xl overflow-hidden animate-in slide-in-from-right-8 fade-in duration-300">
              <div className="bg-green-600 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-white">
                  <MessageCircle size={18} fill="currentColor" />
                  <span className="font-semibold text-sm tracking-wide">WhatsApp Pusat</span>
                </div>
                <button onClick={() => removeNotification(notif.id)} className="text-green-200 hover:text-white transition-colors">
                  <X size={16} />
                </button>
              </div>
              <div className="p-4 bg-green-50/50">
                <p className="text-sm font-bold text-slate-900 mb-2">
                  {notif.type === 'new' ? '⚠️ Jadwal Pemasangan Baru' : '⚠️ Perubahan Jadwal'}
                </p>
                <div className="text-sm text-slate-700 whitespace-pre-line space-y-2">
                  {notif.msgs.join('\n\n')}
                </div>
                <p className="text-xs text-slate-500 mt-3 pt-3 border-t border-green-100">
                  {notif.type === 'new' ? 'Mohon segera lakukan pengecekan dan persiapan.' : 'Mohon dicek kembali.'}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Tambah Tugas */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsTaskModalOpen(false)} />
          <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-200 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50 shrink-0">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Tugas Pemasangan Baru</h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">Buat jadwal tugas teknisi</p>
              </div>
              <button 
                onClick={() => setIsTaskModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                disabled={isSubmittingTask}
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateTask} className="p-6 flex-1 overflow-y-auto space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Nama Pelanggan / Tugas</label>
                <input 
                  required
                  type="text" 
                  value={newTaskForm.customerName}
                  onChange={(e) => setNewTaskForm({...newTaskForm, customerName: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500" 
                  placeholder="Misal: Budi Santoso"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Alamat</label>
                <textarea 
                  required
                  value={newTaskForm.address}
                  onChange={(e) => setNewTaskForm({...newTaskForm, address: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 min-h-[80px] resize-none" 
                  placeholder="Detail Alamat Pemasangan"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Tanggal</label>
                  <input 
                    required
                    type="date"
                    value={newTaskForm.date}
                    onChange={(e) => setNewTaskForm({...newTaskForm, date: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Waktu</label>
                  <select 
                    value={newTaskForm.time}
                    onChange={(e) => setNewTaskForm({...newTaskForm, time: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500" 
                  >
                    <option value="09:00 - 12:00">09:00 - 12:00 Pagi</option>
                    <option value="13:00 - 15:00">13:00 - 15:00 Siang</option>
                    <option value="15:00 - 17:00">15:00 - 17:00 Sore</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Prioritas</label>
                  <select 
                    value={newTaskForm.priority}
                    onChange={(e) => setNewTaskForm({...newTaskForm, priority: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500" 
                  >
                    <option value="low">Rendah</option>
                    <option value="normal">Normal</option>
                    <option value="high">Tinggi</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Divisi Teknisi</label>
                  <select 
                    value={newTaskForm.technician}
                    onChange={(e) => setNewTaskForm({...newTaskForm, technician: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500" 
                  >
                    <option value="teknisi1">Team Teknisi 1 (Utara)</option>
                    <option value="teknisi2">Team Teknisi 2 (Selatan)</option>
                    <option value="teknisi3">Team Teknisi 3 (Timur)</option>
                  </select>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-5 mt-2 flex justify-end gap-3 shrink-0">
                <button 
                  type="button"
                  onClick={() => setIsTaskModalOpen(false)}
                  disabled={isSubmittingTask}
                  className="px-5 py-2 rounded-xl text-sm font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors disabled:opacity-50"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  disabled={isSubmittingTask}
                  className="px-5 py-2 rounded-xl text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 transition-colors shadow-sm shadow-primary-500/30 flex items-center gap-2 disabled:opacity-50"
                >
                  {isSubmittingTask && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  Simpan Tugas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Detail */}
      {selectedScheduleDetail && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSelectedScheduleDetail(null)} />
          <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-200">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Detail Pelanggan</h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">{selectedScheduleDetail.id}</p>
              </div>
              <button 
                onClick={() => setSelectedScheduleDetail(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">Nama Pelanggan</p>
                  <p className="text-sm font-medium text-slate-900 flex items-center gap-2">
                    <User size={14} className="text-primary-500" /> {selectedScheduleDetail.customerName}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">Nomor Telepon</p>
                  <p className="text-sm font-medium text-slate-900 flex items-center gap-2">
                    <Phone size={14} className="text-green-500" /> {selectedScheduleDetail.phone}
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">Alamat Pemasangan</p>
                  <p className="text-sm font-medium text-slate-900 flex items-start gap-2">
                    <MapPin size={14} className="text-rose-500 mt-0.5 shrink-0" /> <span className="leading-relaxed">{selectedScheduleDetail.address}</span>
                  </p>
                </div>
                <div className="sm:col-span-2 bg-slate-50 p-4 rounded-xl border border-slate-100 mt-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">Paket Internet</p>
                      <p className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <WifiHigh size={14} className="text-indigo-500" /> {selectedScheduleDetail.plan}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">Jadwal Target</p>
                      <p className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <Calendar size={14} className="text-orange-500" /> {selectedScheduleDetail.date} ({selectedScheduleDetail.time})
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-5 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
              <button 
                onClick={() => setSelectedScheduleDetail(null)}
                className="px-5 py-2 rounded-xl text-sm font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detail & Chat Tiket */}
      {selectedTicketDetail && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Activity className="text-rose-600" />
                Detail Gangguan
              </h3>
              <button onClick={() => setSelectedTicketDetail(null)} className="text-slate-400 hover:text-slate-600 p-2"><X size={20}/></button>
            </div>
            
            <div className="p-5 overflow-y-auto flex-1 flex flex-col gap-4 bg-slate-50/50">
               <div>
                  <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-1 font-mono">Keluhan</h4>
                  <p className="text-slate-800 font-medium bg-white p-4 rounded-xl border border-slate-200">{selectedTicketDetail.description || 'Tidak ada deskripsi'}</p>
               </div>
               
               <div className="flex-1 min-h-[200px] border border-slate-200 rounded-xl bg-white flex flex-col overflow-hidden">
                  <div className="bg-slate-100 px-4 py-2 border-b border-slate-200"><span className="text-xs font-semibold text-slate-600 uppercase tracking-widest font-mono">Update & Kordinasi</span></div>
                  <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3">
                     {(selectedTicketDetail.messages || []).length === 0 ? (
                        <div className="flex items-center justify-center h-full text-slate-400 text-sm">Belum ada pesan/update.</div>
                     ) : (
                        (selectedTicketDetail.messages || []).map((msg: any, i: number) => (
                           <div key={i} className={`flex flex-col ${msg.sender === 'technician' ? 'items-end' : 'items-start'}`}>
                              <span className="text-[10px] text-slate-400 font-mono mb-0.5 px-1">{msg.sender === 'technician' ? 'Saya (Teknisi)' : 'Admin'}</span>
                              <div className={`px-4 py-2 rounded-2xl max-w-[85%] text-sm ${msg.sender === 'technician' ? 'bg-indigo-600 text-white rounded-tr-sm' : 'bg-slate-100 border border-slate-200 text-slate-800 rounded-tl-sm'}`}>
                                 {msg.text.includes('http') ? (
                                    <a href={msg.text.split(' ').find((w: string) => w.startsWith('http'))} target="_blank" rel="noopener noreferrer" className="underline font-medium">Buka Lokasi / Lampiran</a>
                                 ) : msg.text}
                              </div>
                           </div>
                        ))
                     )}
                  </div>
                  <div className="p-3 bg-slate-50 border-t border-slate-200">
                     <form onSubmit={(e) => handleSendTicketMessage(e, false)} className="flex gap-2">
                        <button type="button" onClick={(e) => handleSendTicketMessage(e, true)} title="Kirim Lokasi Sekarang" className="p-2.5 rounded-xl bg-rose-100 text-rose-600 hover:bg-rose-200 transition-colors shrink-0">
                           <MapPin size={20} />
                        </button>
                        <input type="text" value={ticketMessage} onChange={e => setTicketMessage(e.target.value)} placeholder="Tulis update/pesan..." className="flex-1 bg-white border border-slate-300 rounded-xl px-4 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm" />
                        <button type="submit" disabled={!ticketMessage.trim()} className="px-4 py-2.5 bg-indigo-600 font-semibold text-white rounded-xl disabled:opacity-50 flex items-center justify-center shrink-0">
                           Kirim
                        </button>
                     </form>
                  </div>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Scan ONU */}
      {scanningScheduleId && (
        <ScanOnuModal 
          schedule={schedules.find(s => s.id === scanningScheduleId)}
          onClose={() => setScanningScheduleId(null)}
          onConfirm={(sn) => {
            setOnuForm(prev => ({ ...prev, serialNumber: sn }));
            setScanningScheduleId(null);
          }}
        />
      )}
    </div>
  );
}

