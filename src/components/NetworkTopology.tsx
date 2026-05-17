import React, { useState } from 'react';
import { AreaChart, Area, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { Search, Map as MapIcon, Maximize, Minus, Plus, Settings, ChevronDown, ChevronRight, Server, GitMerge, Box, Monitor, Activity, CheckCircle2, AlertTriangle, XCircle, ZapOff } from 'lucide-react';

const mockChartData = [
  { time: '00:00', upload: 2, download: 3 },
  { time: '04:00', upload: 4, download: 5 },
  { time: '08:00', upload: 3, download: 8 },
  { time: '12:00', upload: 6, download: 10.5 },
  { time: '16:00', upload: 5, download: 7 },
  { time: '20:00', upload: 8, download: 9 },
  { time: '24:00', upload: 4, download: 6 },
];

const mockTopologyTree = {
  id: 'CORE-1',
  name: 'Core Router',
  type: 'CORE',
  status: 'Aktif',
  children: [
    {
      id: 'OLT-A',
      name: 'OLT Pusat (PON 1)',
      type: 'OLT',
      status: 'Aktif',
      details: { tx: '+9 dBm', sfp: 'Class C+' },
      children: [
        {
          id: 'FDT-1',
          name: 'Splitter (1:4)',
          type: 'SPLITTER',
          status: 'Aktif',
          details: { input: '+9 dBm', loss: '-7.4 dB', output: '+1.6 dBm' },
          children: [
            {
              id: 'ODP-JKT-001',
              name: 'ODP 1 (1:8)',
              type: 'ODP',
              status: 'Aktif',
              details: { input: '+1.6 dBm', loss: '-10.5 dB' },
              children: [
                { id: 'ONT-001', name: 'PT Nusantara Indo', type: 'ONT', status: 'Online', details: { rx: '-21.9 dBm' } },
                { id: 'ONT-002', name: 'Klinik Sehat', type: 'ONT', status: 'Offline', details: { rx: '-28.5 dBm' } },
              ]
            },
            {
              id: 'ODP-JKT-002',
              name: 'ODP 2 (1:8)',
              type: 'ODP',
              status: 'Peringatan',
              details: { input: '+1.6 dBm', loss: '-11 dB' },
              children: [
                { id: 'ONT-003', name: 'Toko Makmur', type: 'ONT', status: 'Online', details: { rx: '-24.0 dBm' } }
              ]
            }
          ]
        },
        {
          id: 'FDT-2',
          name: 'Splitter (1:8)',
          type: 'SPLITTER',
          status: 'Aktif',
          details: { input: '+9 dBm', loss: '-10.5 dB', output: '-1.5 dBm' },
          children: [
             {
               id: 'ODP-JKT-003',
               name: 'ODP 3 (1:8)',
               type: 'ODP',
               status: 'Aktif',
               details: { input: '-1.5 dBm', loss: '-10.5 dB' },
               children: []
             }
          ]
        }
      ]
    }
  ]
};

const TypeIcon = ({ type, size = 16, className = "" }: { type: string, size?: number, className?: string }) => {
  switch (type) {
    case 'CORE': return <Server size={size} className={className} />;
    case 'OLT': return <Server size={size} className={className} />;
    case 'SPLITTER': return <GitMerge size={size} className={className} />;
    case 'ODP': return <Box size={size} className={className} />;
    case 'ONT': return <Monitor size={size} className={className} />;
    default: return <Server size={size} className={className} />;
  }
};

const TreeNode = ({ node, level = 0 }: { node: any, level?: number }) => {
  const [expanded, setExpanded] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const hasChildren = node.children && node.children.length > 0;

  const typeColorClass = () => {
    switch (node.type) {
      case 'CORE': return 'bg-fuchsia-50/80 border-fuchsia-300 text-fuchsia-900 shadow-md';
      case 'OLT': return 'bg-blue-50/80 border-blue-300 text-blue-900 shadow-md';
      case 'SPLITTER': return 'bg-cyan-50/80 border-cyan-300 text-cyan-900 shadow-sm';
      case 'ODP': return 'bg-orange-50/80 border-orange-300 text-orange-900 shadow-sm';
      case 'ONT': return 'bg-slate-50 border-slate-300 text-slate-800 shadow-sm';
      default: return 'bg-white border-slate-200 text-slate-800 shadow-sm';
    }
  };

  const getIconColor = () => {
    switch (node.type) {
      case 'CORE': return 'text-fuchsia-600 bg-fuchsia-100/50';
      case 'OLT': return 'text-blue-600 bg-blue-100/50';
      case 'SPLITTER': return 'text-cyan-600 bg-cyan-100/50';
      case 'ODP': return 'text-orange-600 bg-orange-100/50';
      case 'ONT': return 'text-slate-600 bg-slate-100/50';
      default: return 'text-slate-600 bg-slate-100/50';
    }
  };

  const StatusIcon = () => {
    switch(node.status) {
      case 'Aktif': 
      case 'Online': 
      case 'Normal':
        return <CheckCircle2 size={16} className="text-emerald-500 bg-white rounded-full p-px shadow-sm" />;
      case 'Peringatan': 
        return <AlertTriangle size={16} className="text-amber-500 bg-white rounded-full p-px shadow-sm" />;
      case 'Offline': 
      case 'Rusak': 
      case 'Loss':
        return <XCircle size={16} className="text-rose-500 bg-white rounded-full p-px shadow-sm" />;
      default: 
        return <div className="w-3 h-3 rounded-full border-2 border-white bg-slate-500 shadow-sm"></div>;
    }
  };

  return (
    <div className="flex flex-col relative w-full">
      <div 
        className={`flex items-center gap-3 p-3 my-1.5 rounded-xl border-2 ${typeColorClass()} cursor-pointer transition-all hover:scale-[1.01] max-w-md w-full relative z-10 backdrop-blur-sm`}
        onClick={() => hasChildren && setExpanded(!expanded)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="flex items-center justify-center w-6 h-6">
           {hasChildren ? (expanded ? <ChevronDown size={18} className="text-slate-400" /> : <ChevronRight size={18} className="text-slate-400" />) : <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>}
        </div>
        
        <div className={`flex items-center justify-center w-11 h-11 rounded-lg border shrink-0 relative overflow-hidden ${getIconColor()} ${node.type === 'CORE' ? 'border-fuchsia-200' : node.type === 'OLT' ? 'border-blue-200' : node.type === 'SPLITTER' ? 'border-cyan-200' : node.type === 'ODP' ? 'border-orange-200' : 'border-slate-200'}`}>
           <TypeIcon type={node.type} size={22} className={getIconColor().split(' ')[0]} />
           <div className="absolute -bottom-1 -right-1 flex items-center justify-center bg-white rounded-full p-0.5">
             <StatusIcon />
           </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
             <h4 className="font-bold text-sm truncate">{node.name}</h4>
             <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-white border border-black/10 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">{node.type}</span>
          </div>
          <div className="flex items-center gap-3 mt-1.5">
             <p className="text-[11px] opacity-75 font-medium truncate">{node.id}</p>
             {node.details && Object.entries(node.details).map(([k, v]: [string, any]) => (
               <span key={k} className={`text-[10px] font-bold px-1.5 rounded bg-white/60 border border-black/5 ${String(v).includes('-28') || String(v).includes('Offline') ? 'text-rose-600' : String(v).includes('Class') ? 'text-indigo-600' : 'text-emerald-700'}`}>
                 {k.toUpperCase()}: {v}
               </span>
             ))}
          </div>
        </div>
      </div>
      
      {/* Visual connection line to children */}
      {hasChildren && expanded && (
        <div className="relative ml-9 pl-4 border-l-2 border-slate-300/50 mt-1 mb-2">
          {node.children.map((child: any, idx: number) => (
             <div key={child.id} className="relative">
                {/* Horizontal connection line to this child */}
                <div className="absolute top-8 -left-4 w-4 h-0.5 bg-slate-300/50"></div>
                <TreeNode node={child} level={level + 1} />
             </div>
          ))}
        </div>
      )}
    </div>
  );
};

export function NetworkTopology() {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.2, 2));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.2, 0.5));
  const handleZoomReset = () => setZoomLevel(1);

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full">
      {/* Left Sidebar: Device List */}
      <div className="w-full lg:w-64 flex-shrink-0 space-y-6 overflow-y-auto custom-scrollbar pr-2 pb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-800 mb-4 px-2">Daftar Perangkat</h2>
          <div className="space-y-1">
            <button className="w-full text-left flex items-center gap-3 px-3 py-2 bg-primary-50 text-primary-700 rounded-lg border border-primary-200/50">
              <div className="w-8 h-8 rounded bg-primary-100 flex items-center justify-center flex-shrink-0">
                <Server size={18} />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm">Core Router</p>
                <p className="text-xs text-primary-600 font-medium">(Aktif)</p>
              </div>
            </button>

            {[
              { id: 'OLT-A', status: 'Aktif', color: 'emerald' },
              { id: 'OLT-B', status: 'Aktif', color: 'emerald' },
              { id: 'OLT-C', status: 'Peringatan', color: 'amber' },
              { id: 'OLT-D', status: 'Aktif', color: 'emerald' },
            ].map(device => (
              <button key={device.id} className="w-full text-left flex items-center gap-3 px-3 py-2 hover:bg-slate-50 text-slate-700 rounded-lg transition-colors">
                <div className={`w-3 h-3 rounded-full flex-shrink-0 ml-2 bg-${device.color}-500 flex items-center justify-center shadow-sm`}>
                   {device.status === 'Peringatan' && <div className="w-1 h-1 bg-white rounded-full"></div>}
                </div>
                <div className="flex-1 ml-3">
                  <p className="font-medium text-sm">{device.id}</p>
                  <p className={`text-xs text-${device.color}-600`}>({device.status})</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="px-2">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Status Indikator</h2>
          <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-center">
              <div className="w-3 h-3 rounded-full bg-emerald-500 mx-auto mb-1"></div>
              <p className="text-lg font-bold text-slate-800">4</p>
            </div>
            <div className="text-center">
              <div className="w-3 h-3 rounded-full bg-amber-500 mx-auto mb-1"></div>
              <p className="text-lg font-bold text-slate-800">1</p>
            </div>
            <div className="text-center">
               <div className="w-3 h-3 rounded-full bg-rose-500 mx-auto mb-1"></div>
              <p className="text-lg font-bold text-slate-800">0</p>
            </div>
          </div>
        </div>

        <div className="px-2">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Log Konektivitas</h2>
          <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-px before:bg-slate-200">
            <div className="relative flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-rose-500 mt-1.5 flex-shrink-0 relative z-10 shadow-[0_0_0_4px_#f8fafc]"></div>
              <div>
                <p className="text-[10px] text-slate-500 font-mono">08:45:22 - OLT-C Link Down</p>
                <p className="text-xs font-semibold text-slate-700">(Fiber Cut)</p>
              </div>
            </div>
            <div className="relative flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0 relative z-10 shadow-[0_0_0_4px_#f8fafc]"></div>
              <div>
                <p className="text-[10px] text-slate-500 font-mono">08:44:15 - OLT-A Link Up</p>
                <p className="text-xs font-semibold text-slate-700">(Fiber Restored)</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-0 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden relative">
        {/* Header */}
        <div className="px-4 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0 z-20">
          <h2 className="text-lg sm:text-xl font-bold text-slate-800 flex items-center gap-2">
            <Activity className="text-primary-600" size={24} />
            Topologi Jaringan OLT &rarr; ONT
          </h2>
          <div className="flex items-center gap-3">
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Cari ID/Nama..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-400 w-48 transition-all shadow-sm" 
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col lg:flex-row flex-1 p-0 sm:p-6 gap-6 overflow-hidden bg-slate-50/50">
          {/* Topology Interactive Tree */}
          <div className="flex-1 bg-slate-50 rounded-2xl border border-slate-200 relative overflow-hidden flex flex-col shadow-inner">
            <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-1 flex flex-col">
                <button onClick={handleZoomIn} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"><Plus size={18} /></button>
                <div className="w-full h-px bg-slate-100 my-0.5"></div>
                <button onClick={handleZoomOut} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"><Minus size={18} /></button>
              </div>
              <button onClick={handleZoomReset} className="bg-white rounded-xl shadow-sm border border-slate-200 p-2.5 hover:bg-slate-100 text-slate-600 transition-colors">
                <Maximize size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-auto custom-scrollbar p-8 sm:p-12 relative">
               <div 
                 className="min-w-max transition-transform duration-300 origin-top-left"
                 style={{ transform: `scale(${zoomLevel})` }}
               >
                 <TreeNode node={mockTopologyTree} />
               </div>
            </div>
          </div>

          {/* Right Sidebar: Real-time Stats */}
          <div className="w-full lg:w-72 flex-shrink-0 flex flex-col gap-6 p-4 sm:p-0">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <h2 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wider">Statistik Jaringan</h2>
              
              <div className="space-y-6">
                <div>
                  <p className="text-xs font-semibold text-slate-500 mb-1">Throughput OLT Pusat</p>
                  <p className="text-2xl font-bold text-slate-900 mb-3 tracking-tight">10.5 <span className="text-sm text-slate-500 font-normal">Gbps</span></p>
                  <div className="h-16 w-full -ml-2 relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={mockChartData}>
                        <defs>
                          <linearGradient id="colorDl" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <RechartsTooltip />
                        <Area type="monotone" dataKey="download" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorDl)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <p className="text-xs font-semibold text-slate-500 mb-1">Penggunaan CPU Core</p>
                  <p className="text-2xl font-bold text-slate-900 mb-3 tracking-tight">34 <span className="text-sm text-slate-500 font-normal">%</span></p>
                  <div className="h-16 w-full -ml-2 relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={mockChartData}>
                        <defs>
                          <linearGradient id="colorUp" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <RechartsTooltip />
                        <Area type="monotone" dataKey="upload" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorUp)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
