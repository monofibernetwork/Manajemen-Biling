import React, { useState, useEffect } from 'react';
import { Server, Settings, Users, CreditCard, RefreshCw, CheckCircle2, ChevronRight, Play, AlertCircle, ServerCog, AlertTriangle } from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

interface SyncStep {
  id: number;
  title: string;
  description: string;
  icon: any;
}

const steps: SyncStep[] = [
  { id: 1, title: 'Hubungkan perangkat Mikrotik', description: 'Mengecek konektivitas dengan router Mikrotik.', icon: Server },
  { id: 2, title: 'Sinkronisasi PPP Profile', description: 'Mengambil data PPP Profile dari Mikrotik.', icon: Settings },
  { id: 3, title: 'Buat Komisi Loket', description: 'Mengkonfigurasi pengaturan pembagian komisi loket.', icon: CreditCard },
  { id: 4, title: 'Setup Loket Pembayaran', description: 'Menyiapkan portal pembayaran terintegrasi.', icon: CreditCard },
  { id: 5, title: 'Sinkronisasi PPP User', description: 'Sinkronisasi data pelanggan (PPP User) ke database.', icon: Users },
];

export function SyncSetup() {
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(-1);
  const [stepStatuses, setStepStatuses] = useState<Record<number, 'idle' | 'loading' | 'success' | 'error'>>({
    1: 'idle', 2: 'idle', 3: 'idle', 4: 'idle', 5: 'idle'
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorNotification, setErrorNotification] = useState<{show: boolean, stepTitle: string, errorId: string} | null>(null);

  const startSync = () => {
    setIsProcessing(true);
    setCurrentStepIndex(0);
    setStepStatuses({
      1: 'idle', 2: 'idle', 3: 'idle', 4: 'idle', 5: 'idle'
    });
  };

  const handleRetryStep = (index: number) => {
    setCurrentStepIndex(index);
    setIsProcessing(true);
  };

  const syncMikrotikUsersToFirebase = async () => {
    // Simulate fetching users from Mikrotik and writing to Firebase
    const mikrotikUsers = [
      {
        id: `CUST-SYNC-${Date.now().toString().slice(-4)}1`,
        name: 'Sync User 1',
        address: 'Jl. Merpati No. 12',
        phone: '081234567800',
        pppoeUsername: 'sync_user1',
        pppoePassword: '1000181000',
        speedPlan: '50 Mbps',
        status: 'offline',
        ipAddress: '192.168.10.150',
        uptime: '0h 0m 0s',
        paymentStatus: 'paid',
        billingAmount: 150000,
        ontSerialNumber: 'SYNC1234ABCD'
      },
      {
        id: `CUST-SYNC-${Date.now().toString().slice(-4)}2`,
        name: 'Sync User 2',
        address: 'Blok B1 No. 8',
        phone: '081234567801',
        pppoeUsername: 'sync_user2',
        pppoePassword: '1000181000',
        speedPlan: '100 Mbps',
        status: 'online',
        ipAddress: '192.168.10.151',
        uptime: '2d 1h 5m',
        paymentStatus: 'unpaid',
        billingAmount: 230000,
        ontSerialNumber: 'SYNC5678EFGH',
        currentDownload: '15.2 Mbps',
        currentUpload: '2.1 Mbps'
      }
    ];

    for (const user of mikrotikUsers) {
      await setDoc(doc(db, 'customers', user.id), user);
    }
  };

  useEffect(() => {
    if (currentStepIndex >= 0 && currentStepIndex < steps.length && isProcessing) {
      const stepId = steps[currentStepIndex].id;
      
      setStepStatuses(prev => ({ ...prev, [stepId]: 'loading' }));
      
      const processStep = async () => {
        try {
          // Additional operation on step 5
          if (stepId === 5) {
            await syncMikrotikUsersToFirebase();
          } else {
             // Artificial delay to simulate processing
             await new Promise(resolve => setTimeout(resolve, 2000));
          }

          // Simulate a smaller 10% chance of failure (except for step 5, we just let it succeed)
          const isError = stepId !== 5 && Math.random() < 0.1;
          
          if (isError) {
            setStepStatuses(prev => ({ ...prev, [stepId]: 'error' }));
            setIsProcessing(false);
            const errorId = `ERR-SYNC-${Math.floor(1000 + Math.random() * 9000)}`;
            const stepTitle = steps[currentStepIndex].title;
            setErrorNotification({ show: true, stepTitle, errorId });
          } else {
            setStepStatuses(prev => ({ ...prev, [stepId]: 'success' }));
            if (currentStepIndex < steps.length - 1) {
              setCurrentStepIndex(currentStepIndex + 1);
            } else {
              setIsProcessing(false);
            }
          }
        } catch (err: any) {
          setStepStatuses(prev => ({ ...prev, [stepId]: 'error' }));
          setIsProcessing(false);
          setErrorNotification({ show: true, stepTitle: steps[currentStepIndex].title, errorId: err.message });
        }
      };

      processStep();
    }
  }, [currentStepIndex, isProcessing]);

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto space-y-6">
      <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
          <ServerCog size={160} />
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 flex items-center gap-3">
              <RefreshCw className="text-primary-600" size={28} />
              Setup Sinkronisasi
            </h2>
            <p className="text-slate-400 mt-2 max-w-xl">
              Integrasikan sistem billing ini dengan perangkat Mikrotik/OLT Anda dalam 5 langkah mudah.
            </p>
          </div>
          
          <button
            onClick={startSync}
            disabled={isProcessing}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all shadow-lg min-w-[200px] justify-center ${
              isProcessing 
                ? 'bg-white text-slate-500 cursor-not-allowed border border-slate-300' 
                : 'bg-primary-600 hover:bg-primary-700 text-white lg:hover:shadow-primary-600/20 border border-transparent'
            }`}
          >
            {isProcessing ? (
               <><div className="w-5 h-5 border-2 border-slate-500 border-t-transparent rounded-full animate-spin"></div> Memproses...</>
            ) : (
               <><Play size={18} fill="currentColor" /> Mulai Sekarang</>
            )}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {steps.map((step, index) => {
          const status = stepStatuses[step.id];
          const isActive = index === currentStepIndex && isProcessing;
          const isDone = status === 'success';
          const isPending = status === 'idle' || (currentStepIndex === -1);
          
          return (
            <div 
              key={step.id} 
              className={`p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden
                ${isActive ? 'bg-white/80 border-primary-600/50 shadow-[0_0_15px_rgba(6,182,212,0.1)]' : ''}
                ${isDone ? 'bg-white border-emerald-500/30' : ''}
                ${isPending && !isActive ? 'bg-white/50 border-slate-200 opacity-70' : ''}
              `}
            >
              {isActive && (
                <div className="absolute top-0 left-0 w-1 h-full bg-primary-600 shadow-[0_0_10px_rgba(6,182,212,0.8)]"></div>
              )}
              {isDone && (
                <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
              )}

              <div className="flex items-start md:items-center justify-between gap-4">
                <div className="flex items-start md:items-center gap-4">
                  <div className={`p-3 rounded-xl hidden sm:block ${
                    isDone ? 'bg-emerald-500/10 text-emerald-600' :
                    isActive ? 'bg-primary-600 text-white animate-pulse' :
                    'bg-white text-slate-500'
                  }`}>
                    <step.icon size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                       <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md ${
                         isDone ? 'bg-emerald-500/10 text-emerald-600' :
                         isActive ? 'bg-primary-600 text-white' :
                         'bg-white text-slate-500'
                       }`}>
                         STEP {step.id}
                       </span>
                       <h3 className={`font-semibold ${isDone || isActive ? 'text-slate-900' : 'text-slate-400'}`}>
                         {step.title}
                       </h3>
                    </div>
                    <p className="text-sm text-slate-500 mt-1">{step.description}</p>
                    
                    {status === 'error' && errorNotification?.stepTitle === step.title && (
                      <div className="mt-3 p-3 bg-rose-50 border border-rose-200/50 rounded-xl max-w-sm">
                        <p className="text-xs font-semibold text-rose-700 mb-1.5 flex items-center gap-1.5">
                          <AlertTriangle size={14} /> Detail Gangguan:
                        </p>
                        <p className="text-[11px] font-mono text-rose-600/90 leading-relaxed break-words whitespace-pre-wrap">
                          [TIMEOUT_EXCEEDED] No response from target service after 30000ms.
                          Ensure ports (8728, 5432) are open and accessible.
                          {"\n"}Trace ID: {errorNotification.errorId}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center min-w-[120px] justify-end">
                  {status === 'loading' && (
                    <span className="flex items-center gap-2 text-xs font-semibold text-white bg-primary-600 px-3 py-1.5 rounded-lg border border-primary-600/20">
                      <RefreshCw size={14} className="animate-spin" /> Sedang Proses
                    </span>
                  )}
                  {status === 'success' && (
                    <span className="flex items-center gap-2 text-xs font-semibold text-emerald-600 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
                      <CheckCircle2 size={14} /> Selesai
                    </span>
                  )}
                  {status === 'error' && (
                    <div className="flex items-center gap-2">
                       <span className="flex items-center gap-2 text-xs font-semibold text-rose-600 bg-rose-500/10 px-3 py-1.5 rounded-lg border border-rose-500/20">
                         <AlertCircle size={14} /> Gagal
                       </span>
                       <button
                         onClick={() => handleRetryStep(index)}
                         className="bg-white hover:bg-slate-700 text-slate-700 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold transition-colors flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-primary-600/50"
                       >
                         <RefreshCw size={12} /> Coba Lagi
                       </button>
                    </div>
                  )}
                  {status === 'idle' && (
                    <span className="text-xs font-semibold text-slate-400 bg-white/50 px-3 py-1.5 rounded-lg border border-slate-200">
                      Menunggu
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {!isProcessing && currentStepIndex === steps.length - 1 && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 p-6 rounded-2xl flex flex-col sm:flex-row items-center gap-4 animate-in fade-in slide-in-from-bottom-4">
          <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center flex-shrink-0 text-emerald-600">
             <CheckCircle2 size={24} />
          </div>
          <div>
            <h3 className="text-emerald-600 font-bold mb-1">Sinkronisasi Berhasil!</h3>
            <p className="text-sm text-emerald-500/80">Semua layanan Mikrotik, billing, dan profil pengguna telah terhubung dan siap digunakan.</p>
          </div>
        </div>
      )}

      {errorNotification?.show && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl shrink-0">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Kirim Notifikasi?</h3>
                <p className="text-sm text-slate-500 mt-1">
                  Sinkronisasi gagal pada langkah "{errorNotification.stepTitle}". Apakah Anda ingin mengirimkan notifikasi WhatsApp API otomatis ke Admin?
                </p>
                <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-100 text-[10px] font-mono text-slate-600">
                  <p>Error ID: {errorNotification.errorId}</p>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col gap-2 mt-6">
              <button
                onClick={() => {
                  alert(`[WhatsApp API - Auto Notification]\n\nDari (Sender): 082124812114\nKe (Admin): 082124812114\n\n⚠️ PERINGATAN SISTEM\nProses sinkronisasi terhenti. Langkah "${errorNotification.stepTitle}" mengalami gangguan.\n\nError ID: ${errorNotification.errorId}\nMohon Admin segera melakukan pengecekan di log sistem.`);
                  setErrorNotification(null);
                }}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
              >
                Kirim Sekarang
              </button>
              <button
                onClick={() => setErrorNotification(null)}
                className="w-full bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 py-2.5 rounded-xl text-sm font-semibold transition-colors"
              >
                Abaikan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
