import React, { useState, useEffect } from 'react';
import { Activity, Server, Shuffle, PowerOff, Gauge, Search, Filter, RefreshCw, X, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function MikrotikManager() {
  const [activeConnections, setActiveConnections] = useState<any[]>([]);
  const [trafficData, setTrafficData] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedConnection, setSelectedConnection] = useState<any | null>(null);
  const [isQueueModalOpen, setIsQueueModalOpen] = useState(false);
  const [queueForm, setQueueForm] = useState({ rx: '10', tx: '10' });

  // Simulate active connections
  useEffect(() => {
    const mockConnections = Array.from({ length: 15 }).map((_, i) => ({
      id: `conn-${i}`,
      user: `user_${Math.floor(Math.random() * 1000)}`,
      ip: `10.10.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      mac: `00:1A:2B:3C:${Math.floor(Math.random() * 90 + 10)}:${Math.floor(Math.random() * 90 + 10)}`,
      uptime: `${Math.floor(Math.random() * 48)}h ${Math.floor(Math.random() * 60)}m`,
      rx: Math.floor(Math.random() * 50),
      tx: Math.floor(Math.random() * 50),
      queue: '50M/50M'
    }));
    setActiveConnections(mockConnections);
  }, []);

  // Simulate Live Traffic
  useEffect(() => {
    const interval = setInterval(() => {
      setTrafficData(prev => {
        const newData = [...prev, {
          time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          rx: Math.floor(Math.random() * 500) + 100, // Mbps
          tx: Math.floor(Math.random() * 400) + 50
        }];
        if (newData.length > 20) newData.shift();
        return newData;
      });
      
      // Update random rx/tx in table
      setActiveConnections(prev => prev.map(c => ({
         ...c,
         rx: Math.floor(Math.random() * 50),
         tx: Math.floor(Math.random() * 50)
      })));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleKick = (user: string) => {
    if (confirm(`Apakah Anda yakin ingin memutuskan (kick) sesi PPPoE untuk user ${user}?`)) {
      setActiveConnections(prev => prev.filter(c => c.user !== user));
      alert(`User ${user} berhasil di-kick dari RouterOS.`);
    }
  };

  const handleSaveQueue = () => {
     if (selectedConnection) {
        setActiveConnections(prev => prev.map(c => c.id === selectedConnection.id ? { ...c, queue: `${queueForm.tx}M/${queueForm.rx}M` } : c));
        alert(`Limit Bandwidth/Queue untuk ${selectedConnection.user} berhasil diubah menjadi ${queueForm.tx}M/${queueForm.rx}M.`);
        setIsQueueModalOpen(false);
     }
  };

  const filteredConnections = activeConnections.filter(c => c.user.toLowerCase().includes(searchQuery.toLowerCase()) || c.ip.includes(searchQuery));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Server className="text-primary-600" /> RouterOS (MikroTik) Manager
          </h1>
          <p className="text-slate-500 mt-1">Live traffic monitoring dan manajemen bandwidth aktif.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-3 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
           <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                 <Activity className="text-emerald-500" /> Live Interface Traffic (ether1-WAN)
              </h3>
              <div className="flex gap-4 text-xs font-mono font-semibold">
                 <span className="text-emerald-600">RX: {trafficData.length ? trafficData[trafficData.length - 1].rx : 0} Mbps</span>
                 <span className="text-blue-600">TX: {trafficData.length ? trafficData[trafficData.length - 1].tx : 0} Mbps</span>
              </div>
           </div>
           <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trafficData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} minTickGap={30} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} unit="M" />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    labelStyle={{ color: '#64748b', fontSize: '10px' }}
                  />
                  <Line type="monotone" dataKey="rx" name="Download (RX)" stroke="#10b981" strokeWidth={3} dot={false} isAnimationActive={false} />
                  <Line type="monotone" dataKey="tx" name="Upload (TX)" stroke="#3b82f6" strokeWidth={3} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
           </div>
        </div>

        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-50/50">
            <div className="flex items-center gap-2">
              <Shuffle className="text-slate-400" size={18} />
              <h3 className="font-semibold text-slate-700">Active PPPoE Connections ({activeConnections.length})</h3>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Cari user / IP..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              />
            </div>
          </div>
          
          <div className="overflow-x-auto">
             <table className="w-full text-left border-collapse">
               <thead>
                 <tr className="bg-slate-50 border-b border-slate-100 text-[11px] uppercase tracking-wider text-slate-500">
                    <th className="p-4 font-semibold">User / Profile</th>
                    <th className="p-4 font-semibold">IP Address</th>
                    <th className="p-4 font-semibold">Uptime</th>
                    <th className="p-4 font-semibold">Traffic (RX/TX)</th>
                    <th className="p-4 font-semibold">Aktif Queue</th>
                    <th className="p-4 font-semibold text-right">Aksi</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100 text-sm">
                 {filteredConnections.map(conn => (
                    <tr key={conn.id} className="hover:bg-slate-50/50">
                       <td className="p-4 font-mono font-semibold text-slate-800">{conn.user}</td>
                       <td className="p-4 font-mono text-slate-600">{conn.ip}</td>
                       <td className="p-4 text-slate-600">{conn.uptime}</td>
                       <td className="p-4 font-mono text-xs">
                         <div className="flex flex-col gap-1">
                           <span className="text-emerald-600 flex items-center gap-1"><ArrowDownIcon /> {conn.rx} Mbps</span>
                           <span className="text-blue-600 flex items-center gap-1"><ArrowUpIcon /> {conn.tx} Mbps</span>
                         </div>
                       </td>
                       <td className="p-4 font-mono font-semibold text-slate-700 bg-slate-50/50 text-center">{conn.queue}</td>
                       <td className="p-4 text-right">
                         <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => { setSelectedConnection(conn); setQueueForm({ rx: conn.queue.split('M/')[1].replace('M',''), tx: conn.queue.split('M/')[0] }); setIsQueueModalOpen(true); }}
                              className="p-1.5 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors border border-transparent hover:border-primary-200" title="Limit Bandwidth"
                            >
                              <Gauge size={16} />
                            </button>
                            <button 
                              onClick={() => handleKick(conn.user)}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-200" title="Kick / Disconnect"
                            >
                              <PowerOff size={16} />
                            </button>
                         </div>
                       </td>
                    </tr>
                 ))}
                 {filteredConnections.length === 0 && (
                   <tr><td colSpan={6} className="text-center p-8 text-slate-500">Tidak ada sesi aktif.</td></tr>
                 )}
               </tbody>
             </table>
          </div>
        </div>
      </div>

      {isQueueModalOpen && selectedConnection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-lg text-slate-800">Set Bandwidth Queue</h3>
              <button onClick={() => setIsQueueModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
            </div>
            <div className="p-6">
              <p className="text-sm text-slate-500 mb-4">Ubah limitasi real-time untuk <b>{selectedConnection.user}</b>.</p>
              <div className="grid grid-cols-2 gap-4 mb-6">
                 <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase">Max TX (Upload)</label>
                    <div className="relative">
                      <input type="number" value={queueForm.tx} onChange={e=>setQueueForm({...queueForm, tx: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 pr-8 text-sm outline-none focus:border-primary-500" />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-mono">M</span>
                    </div>
                 </div>
                 <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase">Max RX (Download)</label>
                    <div className="relative">
                      <input type="number" value={queueForm.rx} onChange={e=>setQueueForm({...queueForm, rx: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 pr-8 text-sm outline-none focus:border-primary-500" />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-mono">M</span>
                    </div>
                 </div>
              </div>
              <button onClick={handleSaveQueue} className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-2.5 rounded-xl transition-colors">Terapkan Limitasi</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ArrowDownIcon() {
  return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M19 12l-7 7-7-7"/></svg>;
}

function ArrowUpIcon() {
  return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>;
}
