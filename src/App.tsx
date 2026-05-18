import { useState, useEffect, useRef } from 'react';
import { Routes, Route, useNavigate, useLocation, useParams } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Wallet, 
  Activity, 
  Settings, 
  Bell,
  Search,
  CreditCard,
  WifiHigh,
  Map as MapIcon,
  UserCircle,
  Terminal,
  CalendarDays,
  RefreshCw,
  LogOut,
  AlertCircle,
  CheckCircle2,
  Server,
  Menu,
  X,
  Network,
  Share2,
  History,
  Shield,
  Wifi,
  AlertTriangle,
  Wrench,
  Box,
  DollarSign,
  ChevronDown,
  ChevronRight,
  Camera,
  Gift
} from 'lucide-react';
  import { mockCustomers } from './mockData';
  import { NetworkTopology } from './components/NetworkTopology';
  import { NetworkGraph } from './components/NetworkGraph';
  import { SnmpMonitoring } from './components/SnmpMonitoring';
  import { CustomerTable } from './components/CustomerTable';
  import { BillingTable } from './components/BillingTable';
  import { CustomerDetails } from './components/CustomerDetails';
  import { OdpMap, INITIAL_MOCK_ODPs } from './components/OdpMap';
  import { OdpMonitoring } from './components/OdpMonitoring';
  import { FupManagement } from './components/FupManagement';
  import { OnuRemoteManagement } from './components/OnuRemoteManagement';
  import { ChatWidget } from './components/ChatWidget';

  import { UserProfile } from './components/UserProfile';
  import { SystemLogs } from './components/SystemLogs';
  import { OltManagement } from './components/OltManagement';
  import { TechnicianPortal } from './components/TechnicianPortal';
  import { NewInstallation } from './components/NewInstallation';
  import { TicketManagement } from './components/TicketManagement';
  import { InventoryManagement } from './components/InventoryManagement';
  import { MemberPortal } from './components/MemberPortal';
  import { SyncSetup } from './components/SyncSetup';
  import { GeniaAcsMonitor } from './components/GeniaAcsMonitor';
  import { InstallationHistory } from './components/InstallationHistory';
  import { Settings as SettingsView } from './components/Settings';
  import { PaymentVerification } from './components/PaymentVerification';
  import { DashboardCharts } from './components/DashboardCharts';
  import { AccessManagement } from './components/AccessManagement';
  import { MikrotikManager } from './components/MikrotikManager';
  import { CashFlow } from './components/CashFlow';
  import { PricingPlans } from './components/PricingPlans';
  import { PromoManagement } from './components/PromoManagement';
  import { TechnicianTracking } from './components/TechnicianTracking';

  import { AdminLogin } from './components/AdminLogin';
  import { CCTVMonitoring } from './components/CCTVMonitoring';

  import { onAuthStateChanged, signOut } from 'firebase/auth';
  import { auth, db } from './firebase';
  import { collection, onSnapshot, setDoc, doc, deleteDoc, getDocs, updateDoc, getDoc, query, where } from 'firebase/firestore';
  import { TenantContext } from './contexts/TenantContext';
  import { applyThemeColor } from './utils/colors';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null = null) {
  let errorMsg = error instanceof Error ? error.message : String(error);
  if (errorMsg.includes('Missing or insufficient permissions')) {
    errorMsg = `Akses Ditolak: Anda tidak memiliki izin untuk ${operationType} pada ${path || 'resource ini'}. Kemungkinan tenantId Anda tidak sesuai. | Root Cause: ` + errorMsg;
  }
  const errInfo: FirestoreErrorInfo = {
    error: errorMsg,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn('Error reading localStorage', error);
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.warn('Error setting localStorage', error);
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue] as const;
}

function StatCard({ title, value, subValue, icon: Icon, colorClass }: any) {
  const newColorText = colorClass.includes('emerald') ? 'text-emerald-600' : 
                       colorClass.includes('cyan') ? 'text-primary-600' :
                       colorClass.includes('amber') ? 'text-amber-600' :
                       colorClass.includes('rose') ? 'text-rose-600' : 'text-primary-600';
  const newColorBg = colorClass.includes('emerald') ? 'bg-emerald-400/10' :
                     colorClass.includes('cyan') ? 'bg-primary-600' :
                     colorClass.includes('amber') ? 'bg-amber-400/10' :
                     colorClass.includes('rose') ? 'bg-rose-400/10' : 'bg-primary-600/10';
  const newIconColor = colorClass.includes('emerald') ? 'text-emerald-600' :
                       colorClass.includes('cyan') ? 'text-white' :
                       colorClass.includes('amber') ? 'text-amber-600' :
                       colorClass.includes('rose') ? 'text-rose-600' : 'text-primary-600';

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 flex flex-col justify-between hover:border-slate-300 transition-colors">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</h3>
        <div className={`p-2 rounded-xl ${newColorBg} ${newIconColor}`}>
          <Icon size={18} />
        </div>
      </div>
      <div>
        <h3 className="text-2xl font-bold text-slate-900 flex items-baseline gap-2">
          {value}
        </h3>
        <p className={`text-[10px] mt-2 font-mono uppercase tracking-widest ${newColorText}`}>{subValue}</p>
      </div>
    </div>
  );
}

function CustomerDetailsRoute({ customers, setCustomers }: { customers: any[], setCustomers: any }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const customer = customers.find(c => c.id === id);
  if (!customer) return <div className="p-6 text-center text-slate-500">Pelanggan tidak ditemukan.</div>;

  const handleUpdate = (updatedCustomer: any) => {
    setCustomers((prev: any[]) => prev.map(c => c.id === updatedCustomer.id ? updatedCustomer : c));
  };

  return <CustomerDetails customer={customer} onBack={() => navigate('/customers')} onUpdateCustomer={handleUpdate} />;
}

function DashboardContent({ customers, totalCustomers, onlineCustomers, totalIncome, odps }: any) {
  const navigate = useNavigate();
  const [dismissedAlerts, setDismissedAlerts] = useLocalStorage<string[]>('dashboard_alerts_dismissed', []);
  const [alertSeenAt, setAlertSeenAt] = useLocalStorage<Record<string, number>>('dashboard_alerts_seen', {});

  const unpaidCount = customers?.filter((c: any) => c.paymentStatus === 'unpaid').length || 0;
  const lossOdps = odps?.filter((o: any) => o.status === 'Loss') || [];
  const fullOdps = odps?.filter((o: any) => o.status === 'Full') || [];
  
  const networkRatio = totalCustomers > 0 ? (onlineCustomers / totalCustomers) : 1;
  const networkWarning = networkRatio < 0.8;

  const unpaidId = `unpaid_${unpaidCount}`;
  const lossId = `loss_${lossOdps.map((o: any) => o.id).join(',')}`;
  const fullId = `full_${fullOdps.length}`;
  const networkId = `network_${networkRatio.toFixed(2)}`;

  // Gunakan ID unik berdasarkan kondisi saat ini, agar jika memburuk, notifikasi muncul lagi
  const possibleAlerts = [];
  
  if (unpaidCount > 0 && !dismissedAlerts.includes(unpaidId)) {
    possibleAlerts.push({
      id: unpaidId,
      type: 'warning',
      title: 'Tunggakan Pembayaran',
      message: `Terdapat ${unpaidCount} pelanggan yang belum melakukan pembayaran. Segera tindak lanjuti di menu Tagihan.`,
      action: () => navigate('/billing')
    });
  }

  if (lossOdps.length > 0 && !dismissedAlerts.includes(lossId)) {
    possibleAlerts.push({
      id: lossId,
      type: 'critical',
      title: 'Koneksi ODP Terputus (Loss)',
      message: `Terdeteksi ${lossOdps.length} ODP mengalami Loss. ID: ${lossOdps.map((o: any) => o.id).join(', ')}.`,
      action: () => navigate('/odp-monitoring')
    });
  }

  if (fullOdps.length > 0 && !dismissedAlerts.includes(fullId)) {
    possibleAlerts.push({
      id: fullId,
      type: 'info',
      title: 'Kapasitas ODP Penuh',
      message: `Terdapat ${fullOdps.length} ODP yang telah mencapai kapasitas maksimal (Full).`,
      action: () => navigate('/odp-map')
    });
  }

  if (networkWarning && !dismissedAlerts.includes(networkId)) {
    possibleAlerts.push({
      id: networkId,
      type: 'critical',
      title: 'Penurunan Kualitas Jaringan',
      message: `Lebih dari 20% pelanggan saat ini sedang offline. Periksa log sistem atau status perangkat sentral.`,
      action: () => navigate('/system-logs')
    });
  }

  useEffect(() => {
    const now = Date.now();
    let stateChanged = false;
    const newSeenAt = { ...alertSeenAt };
    
    // Daftarkan waktu kemunculan pertama untuk alert yang baru
    possibleAlerts.forEach(a => {
      if (!newSeenAt[a.id]) {
        newSeenAt[a.id] = now;
        stateChanged = true;
      }
    });

    if (stateChanged) {
      setAlertSeenAt(newSeenAt);
    }

    // Set timer otomatis hilang untuk alert yang masih aktif
    const timers: any[] = [];
    possibleAlerts.forEach(a => {
      const seenTime = newSeenAt[a.id] || alertSeenAt[a.id] || now;
      const elapsed = now - seenTime;
      if (elapsed < 120000) { // 2 menit
        const t = setTimeout(() => {
          setDismissedAlerts(prev => {
            if (!prev.includes(a.id)) return [...prev, a.id];
            return prev;
          });
        }, 120000 - elapsed);
        timers.push(t);
      } else {
        // Jika sudah lebih dari 2 menit sejak pertama dilihat, otomatis sembunyikan
        setDismissedAlerts(prev => {
          if (!prev.includes(a.id)) return [...prev, a.id];
          return prev;
        });
      }
    });

    return () => timers.forEach(t => clearTimeout(t));
  }, [possibleAlerts.map(a => a.id).join(','), alertSeenAt, setDismissedAlerts]);

  // Hanya tampilkan alert yang umurnya belum 2 menit
  const alerts = possibleAlerts.filter(a => {
     const seenTime = alertSeenAt[a.id];
     if (!seenTime) return true;
     return Date.now() - seenTime < 120000;
  });

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Dashboard Alerts */}
      {alerts.length > 0 && (
        <div className="flex flex-col gap-3">
          {alerts.map(alert => (
            <div key={alert.id} className={`flex items-start justify-between gap-4 p-4 rounded-xl border ${
              alert.type === 'critical' ? 'bg-rose-50 border-rose-200 text-rose-800' :
              alert.type === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-800' :
              'bg-primary-50 border-primary-200 text-primary-800'
            }`}>
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${
                  alert.type === 'critical' ? 'bg-rose-100 text-rose-600' :
                  alert.type === 'warning' ? 'bg-amber-100 text-amber-600' :
                  'bg-primary-100 text-primary-600'
                }`}>
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h4 className="font-semibold text-sm mb-0.5">{alert.title}</h4>
                  <p className="text-xs leading-relaxed opacity-90">{alert.message}</p>
                  <button 
                    onClick={alert.action}
                    className={`mt-2 text-xs font-semibold hover:underline decoration-2 underline-offset-4 ${
                      alert.type === 'critical' ? 'text-rose-700' :
                      alert.type === 'warning' ? 'text-amber-700' :
                      'text-primary-700'
                    }`}
                  >
                    Lihat Selengkapnya &rarr;
                  </button>
                </div>
              </div>
              <button 
                onClick={() => setDismissedAlerts(prev => [...prev, alert.id])}
                className={`p-1.5 rounded-lg transition-colors shrink-0 ${
                  alert.type === 'critical' ? 'hover:bg-rose-100 text-rose-500' :
                  alert.type === 'warning' ? 'hover:bg-amber-100 text-amber-500' :
                  'hover:bg-primary-100 text-primary-500'
                }`}
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Pelanggan" 
          value={totalCustomers.toString()} 
          subValue="+2 pelanggan bulan ini" 
          icon={Users} 
          colorClass="text-primary-600" 
        />
        <StatCard 
          title="Pelanggan Online" 
          value={`${onlineCustomers} / ${totalCustomers}`} 
          subValue={`${totalCustomers - onlineCustomers} sedang offline`} 
          icon={WifiHigh} 
          colorClass="text-emerald-600" 
        />
        <StatCard 
          title="Pendapatan (Bulan Ini)" 
          value={new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(totalIncome)} 
          subValue="75% telah membayar" 
          icon={CreditCard} 
          colorClass="text-primary-600" 
        />
        <StatCard 
          title="Traffic Terkini" 
          value="124 Mbps" 
          subValue="Puncak pada 20:00 WIB" 
          icon={Activity} 
          colorClass="text-amber-500" 
        />
      </div>

      {/* Dashboard Charts */}
      <DashboardCharts customers={customers} odps={odps} />

      {/* Bento Grid Layout for Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-full">
        {/* Network Graph spans 8 columns */}
        <div className="lg:col-span-8 flex flex-col">
          <NetworkGraph />
        </div>

        {/* Two smaller boxes taking the other 4 columns */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 flex flex-col hover:border-slate-300 transition-colors flex-1 min-h-[300px] shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Unpaid Accounts</h3>
              <button onClick={() => navigate('/billing')} className="text-[10px] font-mono text-primary-600 hover:text-primary-700 uppercase">
                View All
              </button>
            </div>
            <div className="space-y-3 flex-1 overflow-y-auto pr-2">
              {customers.filter((c: any) => c.paymentStatus !== 'paid').map((c: any) => (
                <div key={c.id} className="flex items-center justify-between p-2.5 bg-white/30 rounded-xl border border-slate-200/50 hover:bg-white/60 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white text-slate-400 flex items-center justify-center font-bold text-[10px] border border-slate-300">
                      {c.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-900">{c.name}</p>
                      <p className={`text-[9px] font-mono uppercase tracking-widest mt-0.5 ${c.paymentStatus === 'overdue' ? 'text-amber-500' : 'text-slate-500'}`}>
                        {c.paymentStatus === 'overdue' ? 'DUE SOON' : 'PENDING'}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs font-mono font-medium text-emerald-600">
                    Rp {(c.billingAmount/1000)}k
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-6 flex flex-col hover:border-slate-300 transition-colors flex-1 min-h-[350px] shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Infra & OLT Status</h3>
              <div className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px] font-mono animate-pulse">Live</div>
            </div>
            
            <div className="space-y-3 mt-1">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                   <span className="text-[10px] uppercase font-mono text-slate-400">Ping Gateway</span>
                   <span className="text-xs font-mono text-emerald-600">4ms</span>
                </div>
                <div className="w-full bg-white/50 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full w-[5%]"></div>
                </div>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-1.5">
                   <span className="text-[10px] uppercase font-mono text-slate-400">CPU Load</span>
                   <span className="text-xs font-mono text-slate-700">14%</span>
                </div>
                <div className="w-full bg-white/50 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-primary-600 h-full w-[14%] rounded-full"></div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-200 grid grid-cols-2 gap-3 mb-4">
              <div className="bg-slate-50 border border-slate-200/50 p-2.5 rounded-xl text-center">
                <p className="text-[9px] text-slate-500 uppercase tracking-widest font-semibold mb-1">Server MikroTik</p>
                <p className="text-xs text-emerald-600 font-mono">ONLINE</p>
              </div>
              <div className="bg-slate-50 border border-slate-200/50 p-2.5 rounded-xl text-center">
                <p className="text-[9px] text-slate-500 uppercase tracking-widest font-semibold mb-1">OLT Central</p>
                <p className="text-xs text-emerald-600 font-mono">ONLINE</p>
              </div>
            </div>

            <div className="mt-auto bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3.5 flex items-start gap-3 shadow-lg shadow-emerald-500/5 animate-in fade-in duration-500">
              <div className="mt-1 min-w-[8px]">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] text-emerald-600 font-bold font-mono uppercase tracking-wider">OLT: Modem Aktif</p>
                  <span className="text-[9px] text-slate-500 font-mono">Baru saja</span>
                </div>
                <p className="text-[11px] text-emerald-100/90 mt-1.5 leading-relaxed">ONT <span className="font-mono text-emerald-300 bg-emerald-500/20 px-1 py-0.5 rounded">Siti Aminah</span> terhubung. Internet akses UP.</p>
                <button 
                  onClick={() => alert("Pesan otomatis telah dikirim ke nomor WA pelanggan: Siti Aminah, melalui Sender Gateway 082124812114.")}
                  className="mt-2 text-[10px] bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold px-2 py-1 rounded transition-colors flex items-center gap-1"
                >
                  <WifiHigh size={10} /> Kirim Info WA Pelanggan
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [appMode, setAppMode] = useLocalStorage<'loading' | 'login' | 'admin' | 'customer_portal' | 'technician_portal'>('app_mode', 'loading');

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showShareTooltip, setShowShareTooltip] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [odps, setOdps] = useState<any[]>([]);
  const [isWaBillingEnabled, setIsWaBillingEnabled] = useLocalStorage('app_isWaBillingEnabled', true);

  const [tenantId, setTenantId] = useState<string>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('tenant') || 'default';
  });
  const [adminRole, setAdminRole] = useState<string>('superadmin');
  const [branding, setBranding] = useState<any>({ businessName: 'Dream Paymanager', primaryColorHex: '#ea580c' });
  const [menuSearchQuery, setMenuSearchQuery] = useState('');

  const navigate = useNavigate();
  const location = useLocation();

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    'Utama': true,
    'Administrasi': true,
    'Infrastruktur': true,
    'Monitoring': true,
    'Pengaturan': true
  });

  const toggleGroup = (groupName: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  };

  useEffect(() => {
    const fetchPublicBranding = async () => {
      try {
        const brandDoc = await getDoc(doc(db, 'branding', tenantId));
        if (brandDoc.exists()) {
          setBranding(brandDoc.data());
        }
      } catch (e) {
        console.error('Gagal memuat branding awalan', e);
      }
    };
    fetchPublicBranding();
  }, [tenantId]);

  useEffect(() => {
     if (branding?.primaryColorHex) {
        applyThemeColor(branding.primaryColorHex);
     }
  }, [branding?.primaryColorHex]);

  const notificationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleConfirmPayment = async (id: string) => {
    const newDate = new Date().toISOString();
    setCustomers(prev => prev.map(c => c.id === id ? { ...c, paymentStatus: 'paid', lastPaymentDate: newDate } : c));
    try {
      if (auth.currentUser) {
        await updateDoc(doc(db, 'customers', id), {
          paymentStatus: 'paid',
          lastPaymentDate: newDate
        });
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `customers/${id}`);
    }
  };

  const handleRefreshOdps = () => {
    // Simulasi memuat data ulang dari server atau trigger efek refresh.
    // Kami acak status sedikit untuk melihat ada perubahan.
    setOdps(prevOdps => prevOdps.map(odp => {
      let newStatus = odp.status;
      const rand = Math.random();

      if (odp.status === 'Normal') {
          if (rand < 0.1) newStatus = 'Loss';
          else if (rand < 0.2) newStatus = 'Full';
      } else if (odp.status === 'Loss') {
          if (rand < 0.5) newStatus = 'Normal'; 
      } else if (odp.status === 'Full') {
          if (rand < 0.3) newStatus = 'Normal';
          else if (rand < 0.2) newStatus = 'Loss';
      }

      let newCapacity = odp.capacity;
      if (newStatus === 'Full' && odp.status !== 'Full') {
          const [, totalStr] = odp.capacity.split('/');
          newCapacity = `${totalStr}/${totalStr}`;
      } else if (newStatus === 'Normal' && odp.status === 'Full') {
          const [, totalStr] = odp.capacity.split('/');
          const total = parseInt(totalStr) || 8;
          newCapacity = `${Math.floor(total * 0.8)}/${totalStr}`;
      }
      
      return {
        ...odp,
        status: newStatus,
        capacity: newCapacity
      };
    }));
  };

  const handleUpdateOdpStore = async (updated: any) => {
    try {
      setOdps(prev => prev.map(o => o.id === updated.id ? updated : o));
      if (auth.currentUser) {
        const { id, ...data } = updated;
        await updateDoc(doc(db, 'odps', updated.id), data);
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `odps/${updated.id}`);
    }
  };

  const getActiveTab = () => {
    const path = location.pathname;
    if (path === '/') return 'dashboard';
    if (path.startsWith('/customers/')) return 'customer_details';
    if (path === '/customers') return 'customers';
    if (path === '/new-installation') return 'new_installation';
    if (path === '/billing') return 'billing';
    if (path === '/payment-verification') return 'payment_verification';
    if (path === '/sync-setup') return 'sync_setup';
    if (path === '/monitoring') return 'monitoring';
    if (path === '/network-topology') return 'network_topology';
    if (path === '/genia-acs') return 'genia_acs';
    if (path === '/olt-management') return 'olt_management';
    if (path === '/remote-onu') return 'remote_onu';
    if (path === '/odp-map') return 'odp_map';
    if (path === '/odp-monitoring') return 'odp_monitoring';
    if (path === '/fup-management') return 'fup_management';
    if (path === '/system-logs') return 'system_logs';
    if (path === '/portal-member') return 'portal_member';
    if (path === '/user-profile') return 'user_profile';
    if (path === '/settings') return 'settings';
    if (path === '/pricing-plans') return 'pricing_plans';
    if (path === '/promo-management') return 'promo_management';
    if (path === '/access-management') return 'access_management';
    return 'dashboard';
  };
  const activeTab = getActiveTab();

  const getPathForTab = (tabId: string) => {
    if (tabId === 'dashboard') return '/';
    return '/' + tabId.replace('_', '-');
  };

  // List email yang diizinkan untuk login sebagai admin
  // const ALLOWED_EMAILS = ['adityabiznet@gmail.com'];

  // Inside App component (starts at line 501 roughly)
  useEffect(() => {
    let unsubCustomers: () => void;
    let unsubOdps: () => void;
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userEmail = (user.email || '').toLowerCase();
        
        let hasAccess = false;
        let currentTenant = 'default';
        let currentRole = 'superadmin';
        
        let isTechnicianMode = localStorage.getItem('app_mode') === '"technician_portal"';
        
        if (userEmail === 'adityabiznet@gmail.com' || userEmail === 'owner.aditya@dreampaymanager.app') {
          hasAccess = true;
          currentTenant = 'biznet';
          currentRole = 'superadmin';
        } else if (userEmail === 'adityaf90000@gmail.com' || userEmail === 'admin.aditya@dreampaymanager.app') {
          hasAccess = true;
          currentTenant = 'biznet';
          currentRole = 'admin';
        } else if (isTechnicianMode) {
          hasAccess = true;
          currentTenant = 'biznet';
          currentRole = 'technical';
        } else {
          try {
            const userDoc = await getDoc(doc(db, 'system_users', userEmail));
            if (userDoc.exists()) {
              const data = userDoc.data();
              const isValid = data.validUntil ? new Date(data.validUntil) >= new Date() : true;
              if (data.status === 'active' && isValid) {
                hasAccess = true;
                currentTenant = data.tenantId || 'default';
                currentRole = data.role || 'admin';
              } else {
                alert(`Akses Ditolak: Lisensi Anda expired atau disuspend.`);
              }
            } else {
              // Jika baru mendaftar / tidak ada di system_users, izinkan dan otomatis buat data default
              hasAccess = true;
              currentTenant = user.uid || 'default'; // setiap user dapat tenant nya sendiri by default
              currentRole = 'superadmin';
              
              // Simpan sebagai akun baru (Background task)
              setDoc(doc(db, 'system_users', userEmail), {
                email: userEmail,
                status: 'active',
                role: 'superadmin',
                tenantId: currentTenant,
                createdAt: new Date().toISOString()
              }).catch(console.error);
            }
          } catch (e: any) {
            console.error('Verifikasi akses error', e);
            if (e.message?.includes('offline')) {
               // Allow fallback if offline
               alert('Anda sedang offline. Beberapa fitur mungkin tidak tersedia.');
               hasAccess = true; // Let them in if offline to see cached data if any
            } else {
               alert('Gagal memverifikasi akses: ' + e.message);
            }
          }
        }

        const pendingTech = sessionStorage.getItem('pending_tech_registration');
        if (pendingTech && user) {
           try {
              sessionStorage.removeItem('pending_tech_registration');
              await setDoc(doc(db, 'technicians', user.uid), {
                 name: pendingTech,
                 email: user.email,
                 role: 'technician',
                 tenantId: currentTenant,
                 createdAt: new Date().toISOString()
              }, { merge: true });
           } catch(e) { console.error('Gagal daftar teknisi', e); }
        }

        if (!hasAccess) {
          await signOut(auth);
          setAppMode('login');
          return;
        }

        setTenantId(currentTenant);
        setAdminRole(currentRole);
        try {
           const brandDoc = await getDoc(doc(db, 'branding', currentTenant));
           if (brandDoc.exists()) {
              setBranding(brandDoc.data());
           }
        } catch (e) { console.error('Gagal memuat branding', e); }

        if (!isTechnicianMode) {
           setAppMode('admin'); 
        }
        
        // Database Check and Seed
        const checkAndSeed = async () => {
          try {
            const qCust = query(collection(db, 'customers'), where('tenantId', '==', currentTenant));
            const custSnap = await getDocs(qCust);
            if (custSnap.empty && mockCustomers && currentTenant === 'biznet') {
              console.log('Seeding Customers...');
              for (const c of mockCustomers) {
                await setDoc(doc(db, 'customers', c.id), { ...c, tenantId: currentTenant });
              }
            }
            
            const qOdp = query(collection(db, 'odps'), where('tenantId', '==', currentTenant));
            const odpSnap = await getDocs(qOdp);
            if (odpSnap.empty && INITIAL_MOCK_ODPs && currentTenant === 'biznet') {
              console.log('Seeding ODPs...');
              for (const o of INITIAL_MOCK_ODPs) {
                await setDoc(doc(db, 'odps', o.id), { ...o, tenantId: currentTenant });
              }
            }
          } catch (e) {
            console.error("Failed to seed db: ", e);
          }
        };
        checkAndSeed();

        // Listen to Firebase data
        unsubCustomers = onSnapshot(query(collection(db, 'customers'), where('tenantId', '==', currentTenant)), async (snapshot) => {
           const custs: any[] = [];
           snapshot.forEach(doc => custs.push({ id: doc.id, ...doc.data() }));

           // Logic Otomatisasi Isolir & FUP (dilakukan sekali saat load data, di per-client - dalam real app sebaiknya di backend/Cloud Functions)
           let stateChanged = false;
           for (const c of custs) {
              // Jika paymentStatus overdue dan masih online, jadikan isolir/offline
              if (c.paymentStatus === 'overdue' && c.status !== 'isolir' && c.status !== 'offline') {
                 c.status = 'isolir';
                 c.connectionHistory = c.connectionHistory || [];
                 c.connectionHistory.unshift({
                    startTime: new Date().toISOString(),
                    endTime: 'Saat ini',
                    status: 'Terputus karena telat bayar (Isolir - Otomatis)'
                 });
                 if (currentTenant) {
                    try {
                       await updateDoc(doc(db, 'customers', c.id), { 
                           status: 'isolir',
                           connectionHistory: c.connectionHistory
                       });
                    } catch (e) {}
                 }
                 stateChanged = true;
              }
              // FUP Logic: Jika pemakaian harian lebih dari 20GB, speed plan di-throttled ke FUP (misal 5 Mbps)
              // Simulasi: tambahkan properti dummy FUP jika ada penggunaan
              if (c.status === 'online' && c.currentDownload) {
                 const dlSpeed = parseFloat(c.currentDownload.split(' ')[0]);
                 if (dlSpeed > 100) { // Anggap ini kondisi trigger FUP
                    if (!c.fupApplied) {
                       c.fupApplied = true;
                       c.speedPlan = c.speedPlan + ' (FUP Applied)';
                       if (currentTenant) {
                           try {
                              await updateDoc(doc(db, 'customers', c.id), {
                                 fupApplied: true,
                                 speedPlan: c.speedPlan
                              });
                           } catch (e) {}
                       }
                       stateChanged = true;
                    }
                 }
              }
           }

           setCustomers(custs);
        }, (error) => {
           handleFirestoreError(error, OperationType.GET, 'customers');
        });
        
        unsubOdps = onSnapshot(query(collection(db, 'odps'), where('tenantId', '==', currentTenant)), (snapshot) => {
           const odpArr: any[] = [];
           snapshot.forEach(doc => odpArr.push({ id: doc.id, ...doc.data() }));
           setOdps(odpArr);
        }, (error) => {
           handleFirestoreError(error, OperationType.GET, 'odps');
        });
        
      } else {
        if (unsubCustomers) unsubCustomers();
        if (unsubOdps) unsubOdps();
        setAppMode('login');
      }
    });

    return () => {
      unsubscribe();
      if (unsubCustomers) unsubCustomers();
      if (unsubOdps) unsubOdps();
    };
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    setAppMode('login');
  };

  if (appMode === 'loading') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (appMode === 'technician_portal') {
    return (
      <TenantContext.Provider value={{ tenantId, branding, setBranding, adminRole }}>
        <TechnicianPortal onLogout={handleLogout} odps={odps} onUpdateOdp={handleUpdateOdpStore} />
      </TenantContext.Provider>
    );
  }

  if (appMode === 'login') {
    return (
      <TenantContext.Provider value={{ tenantId, branding, setBranding, adminRole }}>
        <AdminLogin 
          onLogin={() => setAppMode('admin')} 
          onCustomerPortal={() => setAppMode('customer_portal')} 
          onTechnicianPortal={() => setAppMode('technician_portal')}
        />
      </TenantContext.Provider>
    );
  }

  if (appMode === 'customer_portal') {
    return (
      <TenantContext.Provider value={{ tenantId, branding, setBranding, adminRole }}>
      <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
        <header className="bg-slate-50/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
          <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-900">
              {branding?.logoUrl ? (
                <img src={branding.logoUrl} alt="Logo" className="w-8 h-8 object-contain rounded-lg shrink-0" />
              ) : (
                <WifiHigh className="text-primary-600" size={24} />
              )}
              <span className="font-bold text-lg tracking-tight flex items-center gap-2" style={{ color: branding?.primaryColorHex || '#ea580c' }}>
                {branding?.businessName || 'Dream Paymanager'}
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary-100 text-primary-700 tracking-wider">v2.10</span>
              </span>
            </div>
            <button 
              onClick={handleLogout}
              className="text-sm font-medium text-rose-500 hover:text-rose-600 transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-rose-50 border border-transparent hover:border-rose-100"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </header>
        <main className="flex-1">
          <MemberPortal />
        </main>
      </div>
      </TenantContext.Provider>
    );
  }

  const allMenuGroups = [
    {
      group: 'Utama',
      roles: ['superadmin', 'admin', 'finance', 'technical', 'cs', 'viewer'],
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['superadmin', 'admin', 'finance', 'technical', 'cs', 'viewer'] },
      ]
    },
    {
      group: 'Administrasi',
      roles: ['superadmin', 'admin', 'finance', 'cs', 'viewer'],
      items: [
        { id: 'customers', label: 'Pelanggan', icon: Users, roles: ['superadmin', 'admin', 'finance', 'cs', 'viewer'] },
        { id: 'billing', label: 'Tagihan & Pembayaran', icon: Wallet, roles: ['superadmin', 'admin', 'finance', 'viewer'] },
        { id: 'payment_verification', label: 'Konfirmasi Pembayaran', icon: CheckCircle2, roles: ['superadmin', 'admin', 'finance'] },
        { id: 'cashflow', label: 'Kas & Keuangan', icon: DollarSign, roles: ['superadmin', 'admin', 'finance', 'viewer'] },
        { id: 'fup_management', label: 'Kebijakan FUP', icon: Shield, roles: ['superadmin', 'admin', 'technical'] },
        { id: 'promo_management', label: 'Promosi & Diskon', icon: Gift, roles: ['superadmin', 'admin', 'finance'] },
        { id: 'portal_member', label: 'Portal Member', icon: UserCircle, roles: ['superadmin', 'admin', 'cs'] },
      ]
    },
    {
      group: 'Teknisi & Penugasan',
      roles: ['superadmin', 'admin', 'technical', 'cs', 'viewer'],
      items: [
        { id: 'new_installation', label: 'Pemasangan Baru', icon: CalendarDays, roles: ['superadmin', 'admin', 'technical', 'cs'] },
        { id: 'installation_history', label: 'Riwayat Pemasangan', icon: History, roles: ['superadmin', 'admin', 'technical', 'viewer'] },
        { id: 'ticket_management', label: 'Tiket Gangguan (Troubleshooting)', icon: Wrench, roles: ['superadmin', 'admin', 'technical', 'cs', 'viewer'] },
        { id: 'technician_tracking', label: 'Pelacakan Teknisi GPS', icon: MapIcon, roles: ['superadmin', 'admin', 'viewer'] },
      ]
    },
    {
      group: 'Infrastruktur',
      roles: ['superadmin', 'admin', 'technical', 'viewer'],
      items: [
        { id: 'network_topology', label: 'Topologi Jaringan', icon: Network, roles: ['superadmin', 'admin', 'technical', 'viewer'] },
        { id: 'mikrotik_manager', label: 'Bandwidth (MikroTik)', icon: Server, roles: ['superadmin', 'admin', 'technical', 'viewer'] },
        { id: 'olt_management', label: 'Manajemen OLT', icon: Server, roles: ['superadmin', 'admin', 'technical'] },
        { id: 'odp_map', label: 'Peta ODP', icon: MapIcon, roles: ['superadmin', 'admin', 'technical', 'viewer'] },
        { id: 'remote_onu', label: 'Remote ONU (C-Data)', icon: Wifi, roles: ['superadmin', 'admin', 'technical'] },
        { id: 'genia_acs', label: 'GeniaACS (TR-069)', icon: Server, roles: ['superadmin', 'admin', 'technical'] },
        { id: 'inventory', label: 'Gudang & Inventaris', icon: Box, roles: ['superadmin', 'admin', 'technical', 'viewer'] },
      ]
    },
    {
      group: 'Monitoring',
      roles: ['superadmin', 'admin', 'technical', 'viewer'],
      items: [
        { id: 'monitoring', label: 'Monitoring SNMP', icon: Activity, roles: ['superadmin', 'admin', 'technical', 'viewer'] },
        { id: 'odp_monitoring', label: 'Monitoring ODP', icon: Activity, roles: ['superadmin', 'admin', 'technical', 'viewer'] },
        { id: 'cctv_monitoring', label: 'CCTV & DVR', icon: Camera, roles: ['superadmin', 'admin', 'technical', 'viewer'] },
        { id: 'system_logs', label: 'Log Sistem', icon: Terminal, roles: ['superadmin', 'admin', 'viewer'] },
      ]
    },
    {
      group: 'Pengaturan',
      roles: ['superadmin', 'admin'],
      items: [
        { id: 'pricing_plans', label: 'Paket Berlangganan', icon: Shield, roles: ['superadmin'] },
        { id: 'sync_setup', label: 'Setup Sinkronisasi', icon: RefreshCw, roles: ['superadmin', 'admin'] },
        { id: 'user_profile', label: 'Profil Saya', icon: UserCircle, roles: ['superadmin', 'admin'] },
        { id: 'settings', label: 'Sistem', icon: Settings, roles: ['superadmin', 'admin'] },
        { id: 'access_management', label: 'Akses & Lisensi', icon: Shield, roles: ['superadmin'] },
      ]
    }
  ];

  const menuGroups = allMenuGroups
    .filter(g => g.roles.includes(adminRole))
    .map(g => ({
      ...g,
      items: g.items.filter(i => (i.roles && i.roles.includes(adminRole)) && 
        i.label.toLowerCase().includes(menuSearchQuery.toLowerCase()))
    }))
    .filter(g => g.items.length > 0);

  // Stats calculation
  const totalCustomers = customers.length;
  const onlineCustomers = customers.filter(c => c.status === 'online').length;
  const totalIncome = customers.filter(c => c.paymentStatus === 'paid').reduce((acc, curr) => acc + curr.billingAmount, 0);

  const unpaidCount = customers.filter(c => c.paymentStatus === 'unpaid').length;
  const lossOdpsLength = odps.filter(o => o.status === 'Loss').length;
  const notifications = [];
  if (unpaidCount > 0) {
    notifications.push({
      id: 'unpaid',
      title: 'Tagihan Belum Lunas',
      message: `Ada ${unpaidCount} pelanggan menunggak.`,
      path: '/billing'
    });
  }
  if (lossOdpsLength > 0) {
    notifications.push({
      id: 'loss_odp',
      title: 'ODP Loss',
      message: `Ada ${lossOdpsLength} ODP berstatus Loss.`,
      path: '/odp-monitoring'
    });
  }

  return (
    <TenantContext.Provider value={{ tenantId, branding, setBranding, adminRole }}>
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Responsive */}
      <aside className={`flex flex-col w-64 bg-slate-50 border-r border-slate-200 fixed h-full z-50 transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {branding?.logoUrl ? (
                <img src={branding.logoUrl} alt="Logo" className="w-10 h-10 object-contain rounded-lg shrink-0" />
            ) : (
                <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center text-white shrink-0">
                  <WifiHigh size={24} />
                </div>
            )}
            <div>
              <h1 className="font-bold text-lg text-slate-900 tracking-tight flex items-center gap-2">
                {branding?.businessName || 'Dream Paymanager'}
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary-100 text-primary-700 tracking-wider">v2.10</span>
              </h1>
              <p className="text-[10px] text-slate-500 font-mono tracking-wider uppercase">Gateway-01</p>
            </div>
          </div>
          <button className="lg:hidden p-2 text-slate-400 hover:text-slate-900" onClick={() => setIsSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>
        
        <div className="px-4 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input 
              type="text" 
              placeholder="Cari menu..." 
              value={menuSearchQuery}
              onChange={(e) => {
                setMenuSearchQuery(e.target.value);
                if (e.target.value) {
                  setExpandedGroups({
                    'Utama': true,
                    'Administrasi': true,
                    'Infrastruktur': true,
                    'Monitoring': true,
                    'Pengaturan': true
                  });
                }
              }}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 placeholder-slate-400 font-medium"
            />
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 overflow-y-auto w-full scrollbar-thin">
          {menuGroups.map((group, idx) => {
            const isUtama = group.group === 'Utama';
            const isExpanded = expandedGroups[group.group] !== false;
            
            return (
              <div key={idx} className="mb-4 last:mb-0">
                {!isUtama && (
                  <button 
                    onClick={() => toggleGroup(group.group)}
                    className="w-full flex items-center justify-between text-[11px] font-semibold text-slate-500 px-3 py-1.5 mb-1 hover:text-slate-700 transition-colors rounded-lg hover:bg-slate-50"
                  >
                    <span className="tracking-wider uppercase">{group.group}</span>
                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </button>
                )}
                {isExpanded && (
                  <div className="space-y-0.5">
                    {group.items.map((tab) => {
                      const Icon = tab.icon;
                      const isActive = activeTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => { navigate(getPathForTab(tab.id)); setIsSidebarOpen(false); }}
                          title={tab.label}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors border border-transparent ${
                            isActive 
                              ? 'bg-primary-50 text-primary-700 font-medium' 
                              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                          }`}
                        >
                          <Icon size={18} strokeWidth={isActive ? 2.5 : 2} className={`shrink-0 ${isActive ? 'text-primary-600' : 'text-slate-400'}`} />
                          <span className="text-sm truncate">{tab.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
        
        <div className="p-4 border-t border-slate-200 bg-slate-50/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-600/20 border-2 border-slate-200 flex-shrink-0 flex items-center justify-center font-bold text-primary-600 text-xs uppercase">
              {auth.currentUser?.email?.substring(0, 2) || 'AD'}
            </div>
            <div className="overflow-hidden w-full">
              <p className="text-xs font-semibold text-slate-900 truncate">
                {auth.currentUser?.displayName || (adminRole === 'superadmin' ? 'Superadmin' : 'Administrator')}
              </p>
              <p className="text-[10px] text-slate-500 font-mono truncate">{auth.currentUser?.email || 'admin@example.com'}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 flex flex-col min-h-screen pb-20 lg:pb-0 transition-all duration-300 w-full overflow-x-hidden">
        {/* Header */}
        <header className="bg-slate-50/80 border-b border-slate-200 sticky top-0 z-30 backdrop-blur-md">
          <div className="flex items-center justify-between p-4 lg:px-6">
            <div className="flex items-center gap-3">
              <button 
                className="lg:hidden p-2 -ml-2 text-slate-400 hover:text-slate-900"
                onClick={() => setIsSidebarOpen(true)}
              >
                <Menu size={24} />
              </button>
              <h2 className="text-lg md:text-xl font-bold text-slate-900 tracking-tight font-sans">
                {activeTab === 'customer_details' 
                  ? 'Detail Pelanggan' 
                  : menuGroups.flatMap(g => g.items).find(t => t.id === activeTab)?.label}
              </h2>
            </div>
            
            <div className="flex items-center gap-2 md:gap-4">
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input 
                  type="text" 
                  placeholder="Search users, IPs..." 
                  className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl bg-slate-50/50 text-xs text-slate-900 focus:outline-none focus:border-primary-600 focus:ring-1 focus:ring-primary-600 w-64 placeholder-slate-500 transition-all font-mono"
                />
              </div>

              <div className="relative">
                <button 
                  onClick={() => setShowShareTooltip(!showShareTooltip)}
                  className="p-2 text-primary-600 hover:bg-primary-700/10 rounded-full transition-colors border border-primary-600/20 bg-primary-600/5 hidden sm:flex items-center gap-2"
                >
                  <Share2 size={16} />
                  <span className="text-xs font-semibold uppercase tracking-wider pr-1">Bagikan</span>
                </button>
                <button 
                  onClick={() => setShowShareTooltip(!showShareTooltip)}
                  className="p-2 text-primary-600 hover:bg-primary-700/10 rounded-full transition-colors border border-primary-600/20 bg-primary-600/5 sm:hidden"
                >
                  <Share2 size={18} />
                </button>
                
                {showShareTooltip && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-slate-50 border border-slate-300 rounded-xl shadow-xl shadow-black/50 p-4 z-50">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-sm font-semibold text-slate-800">Bagikan Aplikasi</h4>
                      <button onClick={() => setShowShareTooltip(false)} className="text-slate-500 hover:text-slate-900">
                        <X size={16} />
                      </button>
                    </div>
                    <p className="text-xs text-slate-400 mb-3">URL Publik untuk akses portal atau share demo (bisa dibuka siapa saja):</p>
                    <div className="flex gap-2">
                       <input 
                         type="text" 
                         readOnly 
                         value={window.location.href}
                         className="flex-1 bg-white border border-slate-300 rounded px-2 py-1 text-[10px] text-slate-700 font-mono w-full outline-none" 
                       />
                       <button 
                         onClick={() => {
                           navigator.clipboard.writeText(window.location.href);
                           alert('Link disalin!');
                           setShowShareTooltip(false);
                         }}
                         className="bg-primary-600 hover:bg-primary-700 text-white px-3 py-1 rounded text-xs font-semibold transition-colors"
                       >
                         Copy
                       </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="relative" ref={notificationRef}>
                <button 
                  className="relative p-2 text-slate-400 hover:bg-white rounded-full transition-colors border border-slate-200 bg-slate-50/50"
                  onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                >
                  <Bell size={18} />
                  {notifications.length > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full"></span>
                  )}
                </button>

                {isNotificationOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden">
                    <div className="p-3 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                      <h3 className="font-semibold text-slate-800 text-sm">Notifikasi</h3>
                      <span className="text-xs font-medium bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">{notifications.length} Baru</span>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto">
                      {notifications.length > 0 ? (
                        <div className="divide-y divide-slate-100">
                          {notifications.map(notif => (
                            <button
                              key={notif.id}
                              onClick={() => {
                                setIsNotificationOpen(false);
                                navigate(notif.path);
                              }}
                              className="w-full text-left p-3 hover:bg-slate-50 transition-colors flex items-start gap-3"
                            >
                              <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${notif.id === 'unpaid' ? 'bg-amber-500' : 'bg-rose-500'}`} />
                              <div>
                                <p className="text-sm font-medium text-slate-800">{notif.title}</p>
                                <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{notif.message}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="p-6 text-center text-slate-500">
                          <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                          <p className="text-sm">Semua aman, tidak ada notifikasi baru.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <button 
                onClick={handleLogout}
                className="relative px-3 py-1.5 flex items-center gap-2 text-rose-600 hover:bg-rose-500/10 hover:text-rose-700 rounded-xl transition-colors border border-slate-200 hover:border-rose-500/30 bg-slate-50/50 text-sm font-medium"
                title="Logout"
              >
                <LogOut size={18} />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-4 lg:p-6 flex-1 overflow-x-hidden">
          <Routes>
            <Route path="/sync-setup" element={<SyncSetup />} />
            <Route path="/portal-member" element={
              <div className="max-w-5xl mx-auto animate-in fade-in">
                 <MemberPortal />
              </div>
            } />
            <Route path="/" element={<DashboardContent customers={customers} totalCustomers={totalCustomers} onlineCustomers={onlineCustomers} totalIncome={totalIncome} odps={odps} />} />
            <Route path="/customers" element={
              <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in">
                <CustomerTable 
                  customers={customers} 
                  setCustomers={setCustomers} 
                />
              </div>
            } />
            <Route path="/customers/:id" element={<CustomerDetailsRoute customers={customers} setCustomers={setCustomers} />} />
            <Route path="/new-installation" element={
              <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in">
                <NewInstallation />
              </div>
            } />
            <Route path="/ticket-management" element={
              <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in">
                <TicketManagement />
              </div>
            } />
            <Route path="/technician-tracking" element={
              <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in">
                <TechnicianTracking />
              </div>
            } />
            <Route path="/installation-history" element={
              <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in">
                <InstallationHistory />
              </div>
            } />
            <Route path="/billing" element={
              <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in">
                <BillingTable customers={customers} isWaBillingEnabled={isWaBillingEnabled} onConfirmPayment={handleConfirmPayment} />
              </div>
            } />
            <Route path="/payment-verification" element={
              <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in">
                <PaymentVerification customers={customers} />
              </div>
            } />
            <Route path="/monitoring" element={
              <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in">
                <SnmpMonitoring />
                <NetworkGraph />
              </div>
            } />
            <Route path="/network-topology" element={
              <div className="max-w-[1600px] mx-auto animate-in fade-in h-[calc(100vh-8rem)]">
                <NetworkTopology />
              </div>
            } />
            <Route path="/genia-acs" element={
              <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in">
                <GeniaAcsMonitor />
              </div>
            } />
            <Route path="/mikrotik-manager" element={
              <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in">
                <MikrotikManager />
              </div>
            } />
            <Route path="/inventory" element={
              <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in">
                <InventoryManagement />
              </div>
            } />
            <Route path="/cashflow" element={
              <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in">
                <CashFlow />
              </div>
            } />
            <Route path="/olt-management" element={
              <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in">
                <OltManagement />
              </div>
            } />
            <Route path="/odp-map" element={
              <div className="h-[calc(100vh-4rem)] animate-in fade-in">
                <OdpMap odps={odps} setOdps={setOdps} customers={customers} />
              </div>
            } />
            <Route path="/odp-monitoring" element={
              <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in">
                <OdpMonitoring 
                  odps={odps} 
                  onRefresh={handleRefreshOdps} 
                  onUpdateOdp={handleUpdateOdpStore}
                />
              </div>
            } />
            <Route path="/fup-management" element={
              <FupManagement />
            } />
            <Route path="/remote-onu" element={
              <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in h-[calc(100vh-8rem)]">
                <OnuRemoteManagement />
              </div>
            } />
            <Route path="/user-profile" element={
              <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in">
                <UserProfile />
              </div>
            } />
            <Route path="/system-logs" element={
              <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in">
                <SystemLogs />
              </div>
            } />
            <Route path="/cctv-monitoring" element={
              <div className="max-w-7xl mx-auto space-y-6 animate-in flex-1 h-full min-h-screen">
                <CCTVMonitoring />
              </div>
            } />
            <Route path="/settings" element={
              <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in">
                <SettingsView isWaBillingEnabled={isWaBillingEnabled} setIsWaBillingEnabled={setIsWaBillingEnabled} />
              </div>
            } />
            <Route path="/pricing-plans" element={
              <div className="w-full h-full animate-in fade-in pb-10">
                <PricingPlans />
              </div>
            } />
            <Route path="/promo-management" element={
              <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in">
                <PromoManagement />
              </div>
            } />
            <Route path="/access-management" element={
              <AccessManagement />
            } />
          </Routes>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-lg border-t border-slate-200 lg:hidden flex items-center justify-around pb-[env(safe-area-inset-bottom,0px)] shadow-[0_-8px_20px_-10px_rgba(0,0,0,0.1)] transition-transform duration-300">
        {[
          { id: 'dashboard', icon: LayoutDashboard, label: 'Dash' },
          { id: 'customers', icon: Users, label: 'Users' },
          { id: 'billing', icon: Wallet, label: 'Billing' },
          { id: 'odp_map', icon: MapIcon, label: 'Map' }
        ].filter(tab => menuGroups.flatMap(g => g.items).some(i => i.id === tab.id)).map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => navigate(getPathForTab(tab.id))}
              className="flex flex-col items-center justify-center py-2 px-1 flex-1 relative group touch-manipulation"
            >
              <div className={`flex items-center justify-center p-1.5 rounded-xl transition-all duration-300 ${isActive ? 'bg-primary-100 text-primary-600 scale-110 mb-1' : 'text-slate-400 group-hover:text-primary-500 mb-1'}`}>
                <Icon 
                  size={24} 
                  className={`transition-all duration-300 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`}
                />
              </div>
              <span className={`text-[10px] font-semibold tracking-wide transition-all duration-300 ${isActive ? 'text-primary-700 opacity-100 transform translate-y-0' : 'text-slate-500 opacity-80'}`}>
                {tab.label}
              </span>
              {isActive && (
                <div className="absolute top-0 inset-x-0 mx-auto w-8 h-1 bg-primary-600 rounded-b-full transition-all duration-300" />
              )}
            </button>
          );
        })}
      </nav>

      <ChatWidget />
    </div>
    </TenantContext.Provider>
  );
}
