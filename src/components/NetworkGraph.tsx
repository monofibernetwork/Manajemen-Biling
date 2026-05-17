import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area } from 'recharts';
import { mockTrafficData } from '../mockData';
import { TrafficData } from '../types';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as TrafficData;
    const client = data.topClient;

    return (
      <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xl min-w-[200px]">
        <p className="text-slate-400 text-xs font-mono mb-3 p-1 rounded-md bg-slate-50 border border-slate-200/50 block w-max">{label}</p>
        
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-primary-600 font-mono">Download</span>
            <span className="text-sm font-bold text-slate-900 font-mono">{data.download} Mbps</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-emerald-600 font-mono">Upload</span>
            <span className="text-sm font-bold text-slate-900 font-mono">{data.upload} Mbps</span>
          </div>
        </div>

        {client && (
          <div className="pt-3 border-t border-slate-200/50 space-y-2 relative group">
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono mb-1">Top Data Consumer</p>
            <div className="flex justify-between items-start cursor-help">
              <div>
                <p className="text-sm font-bold text-slate-800 border-b border-dashed border-slate-500">{client.name}</p>
                <p className="text-xs text-slate-500">{client.speedPlan}</p>
              </div>
              <div className={`w-2 h-2 rounded-full mt-1.5 ${client.status === 'online' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]'}`} />
            </div>
            <div className="flex justify-between items-center mt-1">
               <span className="text-[10px] text-slate-500 font-mono">Usage</span>
               <span className="text-[10px] text-slate-700 font-mono">{client.currentDownload} &darr; | {client.currentUpload} &uarr;</span>
            </div>

            {/* Customer Details Tooltip */}
            <div className="absolute left-full top-0 ml-2 w-56 bg-white border border-slate-300 p-3 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[60]">
              <p className="text-xs font-semibold text-slate-800 mb-2 border-b border-slate-200 pb-2">Detail Pelanggan</p>
              <div className="space-y-1.5">
                <p className="text-[10px] flex justify-between"><span className="text-slate-500">ID:</span> <span className="text-slate-700 font-mono">{client.id}</span></p>
                <p className="text-[10px] flex justify-between"><span className="text-slate-500">Alamat:</span> <span className="text-slate-700 truncate max-w-[120px] text-right" title={client.address}>{client.address}</span></p>
                <p className="text-[10px] flex justify-between"><span className="text-slate-500">Telepon:</span> <span className="text-slate-700 text-right">{client.phone}</span></p>
                <p className="text-[10px] flex justify-between"><span className="text-slate-500">IP Addr:</span> <span className="text-primary-600 font-mono text-right">{client.ipAddress}</span></p>
                <p className="text-[10px] flex justify-between"><span className="text-slate-500">Tagihan:</span> <span className={`${client.paymentStatus === 'paid' ? 'text-emerald-600' : 'text-rose-600'} uppercase font-bold text-right`}>{client.paymentStatus}</span></p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
};

export function NetworkGraph() {
  return (
    <div className="flex-1 w-full bg-white border border-slate-200 rounded-3xl p-6 relative flex flex-col transition-colors hover:border-slate-300 min-h-[350px]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Network Traffic (Real-time)</h2>
        </div>
        <div className="flex gap-4 font-mono text-xs">
          <div className="flex items-center gap-2"><span className="w-3 h-3 bg-primary-600 rounded-sm"></span> Rx (Down)</div>
          <div className="flex items-center gap-2"><span className="w-3 h-3 bg-emerald-500 rounded-sm"></span> Tx (Up)</div>
        </div>
      </div>
      
      <div className="flex-1 w-full relative min-h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={mockTrafficData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorDown" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity={0.4}/>
                <stop offset="100%" stopColor="#6366f1" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorUp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.4}/>
                <stop offset="100%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#3f3f46" strokeOpacity={0.5} />
            <XAxis dataKey="time" stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} tickMargin={10} fontFamily="monospace" />
            <YAxis stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(value) => `${value} M`} tickMargin={10} fontFamily="monospace" />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="download" name="Download" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorDown)" />
            <Area type="monotone" dataKey="upload" name="Upload" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorUp)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
