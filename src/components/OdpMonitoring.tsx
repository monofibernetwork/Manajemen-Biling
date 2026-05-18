import React, { useState, useMemo, useEffect } from 'react';
import { Odp } from './OdpMap';
import { Activity, AlertTriangle, CheckCircle2, TrendingDown, MapPin, RefreshCw, ChevronDown, ChevronUp, Router, User, X, Edit2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export function OdpMonitoring({ odps, onRefresh, onUpdateOdp }: { odps: Odp[], onRefresh?: () => void, onUpdateOdp?: (odp: Odp) => void }) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expandedOdpId, setExpandedOdpId] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>('All');

  interface OdpNotification {
    id: string;
    odpId: string;
    status: 'Loss' | 'Full';
    message: string;
  }
  const [notifications, setNotifications] = useState<OdpNotification[]>([]);
  const prevOdpsRef = React.useRef<Odp[]>(odps);

  useEffect(() => {
    const newNotifications: OdpNotification[] = [];
    
    odps.forEach(odp => {
      const prevOdp = prevOdpsRef.current.find(o => o.id === odp.id);
      if (prevOdp && prevOdp.status !== odp.status && (odp.status === 'Loss' || odp.status === 'Full')) {
        newNotifications.push({
          id: Math.random().toString(36).substring(7),
          odpId: odp.id,
          status: odp.status as 'Loss' | 'Full',
          message: `Perhatian: Status ODP ${odp.id} berubah menjadi ${odp.status}.`
        });
      }
    });

    if (newNotifications.length > 0) {
      setNotifications(prev => [...prev, ...newNotifications]);
      newNotifications.forEach(notif => {
        setTimeout(() => {
          setNotifications(prev => prev.filter(n => n.id !== notif.id));
        }, 5000);
      });
    }

    prevOdpsRef.current = odps;
  }, [odps]);

  const onRefreshRef = React.useRef(onRefresh);
  useEffect(() => {
    onRefreshRef.current = onRefresh;
  }, [onRefresh]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setTick(t => t + 1);
      if (onRefreshRef.current) {
        setIsRefreshing(true);
        onRefreshRef.current();
        setTimeout(() => setIsRefreshing(false), 800);
      }
    }, 5000);
    return () => clearInterval(intervalId);
  }, []);

  const toggleExpand = (id: string) => {
    if (expandedOdpId === id) setExpandedOdpId(null);
    else setExpandedOdpId(id);
  };

  const generateMockConnections = (odpId: string, capacity: string) => {
    const activeCount = parseInt(capacity.split('/')[0], 10);
    const mockConns = [];
    let seed = odpId.charCodeAt(odpId.length - 1) + tick;
    
    for (let i = 0; i < activeCount; i++) {
       const randVal = (seed + i) % 10;
       let status = 'Online';
       if (randVal === 0) status = 'Offline';
       else if (randVal === 1) status = 'Loss';

       mockConns.push({
          id: `PORT-${i+1}`,
          ipAddress: `10.10.${seed % 255}.${100 + i}`,
          status: status,
          ontRx: status === 'Online' ? `-${(18 + ((seed + i) % 7) + (seed%3)*0.45).toFixed(2)} dBm` : 'N/A',
       });
    }
    return mockConns;
  };

  const getHealthDetails = (odp: Odp) => {
    let score = 100;
    
    if (odp.status === 'Loss') {
      return { score: 0, text: 'Loss (-100)' };
    }
    
    let text = 'Normal';
    
    if (odp.status === 'Warning') {
      score -= 20;
      text = 'Warning (-20)';
    }
    
    const [usedStr, totalStr] = odp.capacity.split('/');
    const used = parseInt(usedStr, 10) || 0;
    const total = parseInt(totalStr, 10) || 0;
    
    if (total > 0 && used === total) {
      score -= 15;
      text = 'Full (-15)';
    } else if (total > 0 && used / total >= 0.8) {
      score -= 10;
      text = 'Hampir Penuh (-10)';
    }
    
    const conns = generateMockConnections(odp.id, odp.capacity);
    const offlineConns = conns.filter(c => c.status === 'Offline').length;
    const lossConns = conns.filter(c => c.status === 'Loss').length;
    
    if (lossConns > 0) {
      score -= lossConns * 25;
      text = `${lossConns} Loss (-${lossConns * 25})`;
    } else if (offlineConns > 0) {
      score -= offlineConns * 15;
      text = `${offlineConns} Offline (-${offlineConns * 15})`;
    }
    
    return { score: Math.max(0, score), text };
  };

  const handleRefresh = () => {
    if (onRefresh) {
      setIsRefreshing(true);
      onRefresh();
      setTimeout(() => setIsRefreshing(false), 800);
    }
  };

  const normalCount = odps.filter(o => o.status === 'Normal').length;
  const fullCount = odps.filter(o => o.status === 'Full').length;
  const lossCount = odps.filter(o => o.status === 'Loss').length;
  const warningCount = odps.filter(o => o.status === 'Warning').length;

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Activity className="text-primary-600" size={24} />
          Real-time ODP Status Monitoring
        </h2>
        
        {onRefresh && (
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all"
            disabled={isRefreshing}
          >
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin text-primary-600' : ''} />
            {isRefreshing ? 'Memuat...' : 'Refresh Data'}
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex flex-col items-center justify-center">
          <CheckCircle2 className="text-emerald-500 mb-2" size={24} />
          <span className="text-2xl font-bold text-emerald-700">{normalCount}</span>
          <span className="text-xs font-semibold text-emerald-600 uppercase tracking-widest mt-1">Normal</span>
        </div>
        <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex flex-col items-center justify-center">
          <AlertTriangle className="text-amber-500 mb-2" size={24} />
          <span className="text-2xl font-bold text-amber-700">{fullCount}</span>
          <span className="text-xs font-semibold text-amber-600 uppercase tracking-widest mt-1">Full</span>
        </div>
        <div className="bg-yellow-50 border border-yellow-100 p-4 rounded-2xl flex flex-col items-center justify-center">
          <AlertTriangle className="text-yellow-500 mb-2" size={24} />
          <span className="text-2xl font-bold text-yellow-700">{warningCount}</span>
          <span className="text-xs font-semibold text-yellow-600 uppercase tracking-widest mt-1">Warning</span>
        </div>
        <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex flex-col items-center justify-center">
          <TrendingDown className="text-rose-500 mb-2" size={24} />
          <span className="text-2xl font-bold text-rose-700">{lossCount}</span>
          <span className="text-xs font-semibold text-rose-600 uppercase tracking-widest mt-1">Loss</span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex bg-slate-100 p-1 rounded-lg">
            {['All', 'Normal', 'Full', 'Loss', 'Warning', 'Rusak'].map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all ${
                  statusFilter === status 
                    ? 'bg-white text-primary-600 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
          <Link 
            to="/odp-map?filter=problematic"
            className="flex items-center gap-2 px-4 py-1.5 text-sm font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors border border-rose-100"
          >
            <MapPin size={16} />
            Peta ODP Bermasalah
          </Link>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">ID ODP</th>
              <th className="py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Lokasi / Alamat</th>
              <th className="py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-center">Kapasitas</th>
              <th className="py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-center">Pelanggan Aktif</th>
              <th className="py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-center">Status Terkini</th>
              <th className="py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-center">Health Score</th>
              <th className="py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {odps.filter(odp => statusFilter === 'All' || odp.status === statusFilter).map((odp) => (
              <React.Fragment key={odp.id}>
              <tr 
                className={`hover:bg-slate-50 transition-colors cursor-pointer ${expandedOdpId === odp.id ? 'bg-primary-50/50' : ''}`}
                onClick={() => toggleExpand(odp.id)}
              >
                <td className="py-3 px-4 text-sm font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-2">
                  {expandedOdpId === odp.id ? <div className="w-2 h-2 rounded-full bg-primary-600" /> : <div className="w-2 h-2 rounded-full bg-transparent" />}
                  {odp.id}
                </td>
                <td className="py-3 px-4">
                  <span className="text-sm text-slate-700 block">{odp.address}</span>
                  <span className="text-[10px] text-slate-400 font-mono block mt-0.5">{odp.location.lat.toFixed(4)}, {odp.location.lng.toFixed(4)}</span>
                </td>
                <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                  <div className="relative inline-block w-20">
                    <input
                      type="text"
                      value={odp.capacity}
                      onChange={(e) => {
                        if (onUpdateOdp) {
                          onUpdateOdp({ ...odp, capacity: e.target.value });
                        }
                      }}
                      className="w-full text-center text-xs font-mono font-medium text-slate-600 bg-white border border-slate-200 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 rounded px-2 py-1 outline-none transition-colors pr-6"
                      placeholder="e.g. 5/8"
                    />
                    <Edit2 size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </td>
                <td className="py-3 px-4 text-center">
                  <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full text-xs font-semibold">
                    <User size={14} />
                    {odp.capacity.split('/')[0]} Pelanggan
                  </span>
                </td>
                <td className="py-3 px-4 text-center">
                  <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    odp.status === 'Normal' ? 'bg-emerald-100 text-emerald-700' :
                    odp.status === 'Full' ? 'bg-amber-100 text-amber-700' :
                    odp.status === 'Warning' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-rose-100 text-rose-700'
                  }`}>
                    {odp.status}
                  </span>
                </td>
                <td className="py-3 px-4 text-center">
                  <div className="flex flex-col items-center gap-1">
                    <span className={`text-sm font-bold ${getHealthDetails(odp).score >= 80 ? 'text-emerald-600' : getHealthDetails(odp).score >= 50 ? 'text-amber-600' : 'text-rose-600'}`}>
                      {getHealthDetails(odp).score}/100
                    </span>
                    <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${getHealthDetails(odp).score >= 80 ? 'bg-emerald-500' : getHealthDetails(odp).score >= 50 ? 'bg-amber-500' : 'bg-rose-500'} transition-all`}
                        style={{ width: `${getHealthDetails(odp).score}%` }}
                      />
                    </div>
                    <span className="text-[9px] text-slate-400 font-medium whitespace-nowrap mt-0.5">
                      {getHealthDetails(odp).text}
                    </span>
                  </div>
                </td>
                <td className="py-3 px-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {(odp.status === 'Rusak' || odp.status === 'Loss') && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(`Apakah Anda yakin ingin mensimulasikan perbaikan pada ODP ${odp.id} menjadi Normal?`)) {
                            if (onUpdateOdp) onUpdateOdp({ ...odp, status: 'Normal' });
                          }
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors whitespace-nowrap"
                      >
                        <RefreshCw size={14} /> Coba Lagi
                      </button>
                    )}
                    {(odp.status !== 'Normal' || (odp.customers && odp.customers.some((c: any) => c.paymentStatus === 'unpaid' || c.paymentStatus === 'overdue' || c.status === 'Loss' || c.status === 'Offline'))) && (
                      <Link 
                        to={`/odp-map?id=${odp.id}&filter=problematic`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors whitespace-nowrap border border-rose-100"
                      >
                        <AlertTriangle size={14} />
                        Peta Bermasalah
                      </Link>
                    )}
                    <Link 
                      to={`/odp-map?id=${odp.id}`}
                      onClick={(e) => e.stopPropagation()}
                       className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors whitespace-nowrap"
                    >
                      <MapPin size={14} />
                      Lihat Peta
                    </Link>
                  </div>
                </td>
              </tr>
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Separate table for connected devices below the main table */}
      {expandedOdpId && (() => {
        const expandedOdp = odps.find(o => o.id === expandedOdpId);
        const healthDetails = expandedOdp ? getHealthDetails(expandedOdp) : { score: 0, text: '' };
        
        return (
        <div className="mt-8 pt-8 border-t border-slate-200 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Router size={20} className="text-primary-600" />
                Detail Perangkat Terhubung pada {expandedOdpId}
              </h3>
              <p className="text-sm text-slate-500 mt-1">Status dan kesehatan setiap port yang aktif.</p>
            </div>
            
            <div className="flex items-center gap-4 bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">Health Score</p>
                <div className="flex items-center gap-2">
                  <span className={`text-xl font-black ${healthDetails.score >= 80 ? 'text-emerald-600' : healthDetails.score >= 50 ? 'text-amber-600' : 'text-rose-600'}`}>
                    {healthDetails.score}
                  </span>
                  <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${healthDetails.score >= 80 ? 'bg-emerald-500' : healthDetails.score >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
                      style={{ width: `${healthDetails.score}%` }}
                    />
                  </div>
                </div>
              </div>
              <div className="h-8 w-px bg-slate-200" />
              <div>
                 <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">Faktor Utama</p>
                 <p className="text-xs font-semibold text-slate-700">{healthDetails.text}</p>
              </div>
              <button 
                onClick={() => setExpandedOdpId(null)}
                className="ml-2 text-slate-400 hover:text-slate-600 p-1 self-start"
              >
                <X size={20} />
              </button>
            </div>
          </div>
          
          <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left">
              <thead className="bg-slate-100/50 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Port</th>
                  <th className="py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">IP Address</th>
                  <th className="py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Rx Power</th>
                  <th className="py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Connection Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                {generateMockConnections(expandedOdpId, odps.find(o => o.id === expandedOdpId)?.capacity || '0/0').map((conn) => (
                  <tr key={conn.id} className="hover:bg-white transition-colors">
                    <td className="py-3 px-6 text-sm font-mono font-medium text-slate-600">{conn.id}</td>
                    <td className="py-3 px-6 text-sm font-mono text-slate-700">{conn.ipAddress}</td>
                    <td className="py-3 px-6 text-sm font-mono text-slate-700">{conn.ontRx}</td>
                    <td className="py-3 px-6 text-sm">
                       <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${conn.status === 'Online' ? 'bg-emerald-100 text-emerald-700' : conn.status === 'Loss' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'}`}>
                         <div className={`w-1.5 h-1.5 rounded-full ${conn.status === 'Online' ? 'bg-emerald-500 animate-pulse' : conn.status === 'Loss' ? 'bg-rose-500 animate-pulse' : 'bg-slate-400'}`}></div>
                         {conn.status}
                       </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        );
      })()}
      
      {notifications.length > 0 && (
        <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 max-w-sm w-full px-4">
          {notifications.map(notif => (
            <div key={notif.id} className={`bg-white border text-slate-800 shadow-xl rounded-xl p-4 animate-in slide-in-from-bottom-4 fade-in duration-300 ${notif.status === 'Loss' ? 'border-rose-300 shadow-rose-500/10' : 'border-amber-300 shadow-amber-500/10'}`}>
              <div className="flex justify-between items-start gap-4">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg shrink-0 ${notif.status === 'Loss' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'}`}>
                    <AlertTriangle size={20} />
                  </div>
                  <div>
                    <h4 className={`font-semibold text-sm mb-0.5 ${notif.status === 'Loss' ? 'text-rose-700' : 'text-amber-700'}`}>
                      Status {notif.status} Terdeteksi pada ODP
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed">{notif.message}</p>
                    <span className="text-[10px] text-slate-500 font-mono tracking-wider block mt-1">ID: {notif.odpId}</span>
                  </div>
                </div>
                <button 
                  onClick={() => setNotifications(prev => prev.filter(n => n.id !== notif.id))} 
                  className="text-slate-400 hover:text-slate-700 transition-colors bg-slate-50/50 hover:bg-slate-100 rounded-lg p-1.5 shrink-0"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
