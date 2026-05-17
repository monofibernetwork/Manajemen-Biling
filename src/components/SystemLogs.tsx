import { useState, useEffect } from 'react';
import { Terminal, Search, Filter, AlertCircle, CheckCircle2, Info, RefreshCw, ToggleLeft, ToggleRight, X } from 'lucide-react';

interface LogEntry {
  id: string;
  timestamp: string;
  type: 'info' | 'warning' | 'error' | 'success';
  module: string;
  message: string;
  user: string;
}

const mockLogs: LogEntry[] = [
  { id: 'LOG-001', timestamp: '2026-05-05 20:30:15', type: 'error', module: 'System', message: 'Koneksi ke OLT ZTE C320-1 terputus (Timeout).', user: 'System' },
  { id: 'LOG-002', timestamp: '2026-05-05 20:15:00', type: 'success', module: 'Billing', message: 'Pembayaran diterima untuk invoice INV-CUST-102-1234. Status diubah menjadi Lunas.', user: 'Midtrans Webhook' },
  { id: 'LOG-003', timestamp: '2026-05-05 19:45:22', type: 'info', module: 'MikroTik API', message: 'Sinkronisasi profil bandwidth (100Mbps) berhasil.', user: 'Admin' },
  { id: 'LOG-004', timestamp: '2026-05-05 18:20:10', type: 'warning', module: 'Network', message: 'Redaman tinggi terdeteksi pad ODP-01-B (+32dBm).', user: 'System' },
  { id: 'LOG-005', timestamp: '2026-05-05 18:05:00', type: 'success', module: 'Customer', message: 'Pelanggan baru (Budi Santoso) ditambahkan ke sistem.', user: 'Admin' },
  { id: 'LOG-006', timestamp: '2026-05-05 16:30:15', type: 'info', module: 'Auth', message: 'Login berhasil.', user: 'Aditya Biznet' },
  { id: 'LOG-007', timestamp: '2026-05-04 10:20:00', type: 'info', module: 'Settings', message: 'Konfigurasi OLT model diubah ke C-Data GPON.', user: 'Admin' },
];

export function SystemLogs() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterModule, setFilterModule] = useState<string>('All');
  const [filterType, setFilterType] = useState<string>('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [logs, setLogs] = useState<LogEntry[]>(mockLogs);
  const [isAutoRefresh, setIsAutoRefresh] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [notifications, setNotifications] = useState<LogEntry[]>([]);
  const [uiNotification, setUiNotification] = useState<{message: string, type: 'success'} | null>(null);

  const addLog = (newLog: LogEntry) => {
    setLogs(prev => [newLog, ...prev].slice(0, 100)); // keep last 100
    
    // Add subtle notification for error logs
    if (newLog.type === 'error' || (newLog.type as string) === 'critical') {
      setNotifications(prev => [...prev, newLog]);
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== newLog.id));
      }, 6000); // disappear after 6s
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    // Simulate fetching new logs
    setTimeout(() => {
      const newLog: LogEntry = {
        id: `LOG-NEW-${Date.now()}`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        type: 'info',
        module: 'System',
        message: 'Manual refresh: Sistem berhasil memperbarui data log terbaru.',
        user: 'System'
      };
      addLog(newLog);
      setIsRefreshing(false);
      setUiNotification({ message: 'Log sistem berhasil diperbarui.', type: 'success' });
      setTimeout(() => setUiNotification(null), 3000);
    }, 1000);
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isAutoRefresh) {
      interval = setInterval(() => {
        const types: ('info' | 'error' | 'warning' | 'success')[] = ['info', 'info', 'info', 'error', 'warning'];
        const type = types[Math.floor(Math.random() * types.length)];
        
        const newLog: LogEntry = {
          id: `LOG-NEW-${Date.now()}`,
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
          type: type,
          module: type === 'error' ? 'Network' : 'System',
          message: type === 'error' 
            ? `Critical: Koneksi Drop terdeteksi pada node ${Math.floor(Math.random() * 100)}` 
            : 'Auto-refresh: Sistem melakukan pengecekan status terbaru.',
          user: 'System'
        };
        addLog(newLog);
      }, 5000); // 5 seconds for demonstration purposes
    }
    return () => clearInterval(interval);
  }, [isAutoRefresh]);


  const getIconForType = (type: string) => {
    switch (type) {
      case 'info': return <Info size={16} className="text-primary-400" />;
      case 'warning': return <AlertCircle size={16} className="text-amber-600" />;
      case 'error': return <AlertCircle size={16} className="text-rose-600" />;
      case 'success': return <CheckCircle2 size={16} className="text-emerald-600" />;
      default: return <Terminal size={16} className="text-slate-400" />;
    }
  };

  const getStyleForType = (type: string) => {
    switch (type) {
      case 'info': return 'bg-primary-500/10 border-primary-500/20 text-primary-400';
      case 'warning': return 'bg-amber-500/10 border-amber-500/20 text-amber-600';
      case 'error': return 'bg-rose-500/10 border-rose-500/20 text-rose-600';
      case 'success': return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600';
      default: return 'bg-white border-slate-300 text-slate-400';
    }
  };

  const uniqueModules = Array.from(new Set(logs.map(log => log.module)));

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.message.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          log.user.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesModule = filterModule === 'All' || log.module === filterModule;
    const matchesType = filterType === 'All' || log.type === filterType;
    
    let matchesDate = true;
    const logDate = log.timestamp.substring(0, 10);
    if (startDate && logDate < startDate) matchesDate = false;
    if (endDate && logDate > endDate) matchesDate = false;

    return matchesSearch && matchesModule && matchesDate && matchesType;
  });

  return (
    <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[calc(100vh-120px)]">
      <div className="p-6 border-b border-slate-200 bg-white/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Terminal className="text-primary-600" size={20} /> Log Sistem & Aktivitas
          </h2>
          <p className="text-xs text-slate-500 font-mono mt-1">Sistem pencatatan kejadian jaringan dan aktivitas admin.</p>
          {uiNotification && (
            <div className={`mt-3 p-3 rounded-xl border flex items-center gap-2 animate-in fade-in ${uiNotification.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600' : 'bg-rose-500/10 border-rose-500/20 text-rose-600'}`}>
              {uiNotification.type === 'success' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
              <p className="text-xs font-medium">{uiNotification.message}</p>
            </div>
          )}
        </div>
        
        <div className="flex gap-3 w-full sm:w-auto text-sm items-center flex-wrap">
          <button 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center justify-center gap-2 px-3 py-2 bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-xs font-semibold transition-colors"
          >
            <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button 
            onClick={() => setIsAutoRefresh(!isAutoRefresh)}
            className={`flex items-center justify-center gap-2 px-3 py-2 rounded-xl transition-colors border text-xs font-semibold ${isAutoRefresh ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'}`}
          >
            {isAutoRefresh ? <ToggleRight size={16} className="text-emerald-600" /> : <ToggleLeft size={16} />}
            <span className="hidden sm:inline">Auto-refresh (30s)</span>
            {isAutoRefresh && <RefreshCw size={12} className="animate-spin" />}
          </button>
          
          <div className="relative flex-1 sm:w-64 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input 
              type="text" 
              placeholder="Cari log..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-1 focus:ring-primary-600 font-mono text-xs transition-all"
            />
          </div>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
              <Filter size={16} />
            </div>
            <select
              value={filterModule}
              onChange={(e) => setFilterModule(e.target.value)}
              className="appearance-none pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-1 focus:ring-primary-600 font-mono text-xs transition-colors cursor-pointer w-full"
            >
              <option value="All">Semua Module</option>
              {uniqueModules.map(mod => (
                <option key={mod} value={mod}>{mod}</option>
              ))}
            </select>
          </div>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
              <Filter size={16} />
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="appearance-none pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-1 focus:ring-primary-600 font-mono text-xs transition-colors cursor-pointer w-full"
            >
              <option value="All">Semua Status</option>
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="error">Error</option>
              <option value="success">Success</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input 
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-700 outline-none focus:ring-1 focus:ring-primary-600 font-mono text-xs transition-colors"
            />
            <span className="text-slate-400 font-mono text-xs">-</span>
            <input 
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-700 outline-none focus:ring-1 focus:ring-primary-600 font-mono text-xs transition-colors"
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="space-y-4">
          {filteredLogs.map((log) => (
            <div key={log.id} className="flex flex-col sm:flex-row gap-4 items-start sm:items-center bg-slate-50 border border-slate-200/50 p-4 rounded-2xl hover:border-slate-300 transition-colors">
              <div className={`p-2.5 rounded-xl border shrink-0 ${getStyleForType(log.type)}`}>
                {getIconForType(log.type)}
              </div>
              <div className="flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500">{log.timestamp}</span>
                  <span className="hidden sm:block text-slate-400">•</span>
                  <span className="text-[10px] font-mono tracking-widest px-2 py-0.5 rounded-md bg-white text-slate-400 border border-slate-300">{log.module}</span>
                </div>
                <p className="text-sm text-slate-800 mt-1">{log.message}</p>
                <p className="text-[10px] font-mono text-slate-500 mt-2 flex items-center gap-1">
                  <span className="text-slate-400">User:</span> {log.user}
                </p>
              </div>
            </div>
          ))}
          {filteredLogs.length === 0 && (
            <div className="text-center py-12">
              <Terminal className="mx-auto text-slate-700 mb-3" size={32} />
              <p className="text-slate-400 text-sm font-mono tracking-wide">Tidak ada log yang ditemukan.</p>
            </div>
          )}
        </div>
      </div>
      
      {notifications.length > 0 && (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full">
          {notifications.map(notif => (
            <div key={notif.id} className="bg-white border-l-4 border-l-rose-500 border border-slate-200 shadow-2xl rounded-xl p-4 animate-in slide-in-from-right-8 fade-in duration-300">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2 mb-1 text-rose-600">
                  <AlertCircle size={16} />
                  <span className="font-semibold text-sm">Critical Log Detected</span>
                </div>
                <button 
                  onClick={() => setNotifications(prev => prev.filter(n => n.id !== notif.id))} 
                  className="text-slate-400 hover:text-slate-600 transition-colors p-1"
                >
                  <X size={14} />
                </button>
              </div>
              <p className="text-xs text-slate-700 mb-2 leading-relaxed">{notif.message}</p>
              <span className="text-[10px] text-slate-500 font-mono tracking-wider">{notif.module} • {notif.timestamp}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
