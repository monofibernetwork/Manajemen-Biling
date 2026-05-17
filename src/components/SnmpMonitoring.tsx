import React, { useState, useEffect } from 'react';
import { Activity, Server, Cpu, HardDrive, BellRing, Wifi, AlertTriangle, ArrowUpRight, ArrowDownRight, ThermometerSnowflake } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function SnmpMonitoring() {
  const [deviceData, setDeviceData] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  
  useEffect(() => {
    // Initial SNMP Data Simulation for network devices
    const initialData = Array.from({ length: 15 }).map((_, i) => {
      const time = new Date(Date.now() - (14 - i) * 1000).toLocaleTimeString('en-US', { hour12: false, second: '2-digit', minute: '2-digit', hour: '2-digit' });
      return {
        time,
        oltCpu: 30 + Math.random() * 20,
        oltMem: 40 + Math.random() * 5,
        switchCpu: 15 + Math.random() * 10,
        switchMem: 25 + Math.random() * 5,
        routerCpu: 40 + Math.random() * 25,
        routerMem: 50 + Math.random() * 10,
        trafficIn: 450 + Math.random() * 100,
        trafficOut: 120 + Math.random() * 50,
      };
    });
    setDeviceData(initialData);

    setAlerts([
      { id: 1, type: 'warning', message: 'High CPU utilization on Core-Router (75%)', time: '2 mins ago' },
      { id: 2, type: 'critical', message: 'SNMP probe timeout on Switch-Dist-02', time: '10 mins ago' },
      { id: 3, type: 'info', message: 'OLT-01 temperature stabilized (42°C)', time: '1 hour ago' },
    ]);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-US', { hour12: false, second: '2-digit', minute: '2-digit', hour: '2-digit' });
      
      const newPoint = {
        time: timeStr,
        oltCpu: 30 + Math.random() * 20,
        oltMem: 40 + Math.random() * 5,
        switchCpu: 15 + Math.random() * 10,
        switchMem: 25 + Math.random() * 5,
        routerCpu: 40 + Math.random() * 25,
        routerMem: 50 + Math.random() * 10,
        trafficIn: 450 + Math.random() * 100,
        trafficOut: 120 + Math.random() * 50,
      };

      setDeviceData(prev => {
        const newData = [...prev, newPoint];
        if (newData.length > 20) newData.shift();
        return newData;
      });

    }, 2000); // 2 second SNMP polling interval
    return () => clearInterval(interval);
  }, []);

  const currentData = deviceData.length > 0 ? deviceData[deviceData.length - 1] : null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Router SNMP Status */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm transition-all flex flex-col items-start hover:shadow-md">
           <div className="flex w-full items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center">
                  <Server size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Core-Router-01</h3>
                  <p className="text-[10px] text-slate-500 font-mono">10.0.0.1 (MikroTik)</p>
                </div>
              </div>
              <div className="px-2 py-1 rounded bg-emerald-50 text-emerald-600 border border-emerald-200 text-[10px] font-bold font-mono tracking-widest uppercase">
                Healthy
              </div>
           </div>
           
           <div className="grid grid-cols-2 gap-4 w-full mt-2">
             <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col gap-1">
                <div className="flex items-center gap-1.5 text-slate-500 text-[10px] uppercase font-bold tracking-widest">
                  <Cpu size={12} /> CPU Load
                </div>
                <div className="text-xl font-bold font-mono text-slate-800">
                  {currentData?.routerCpu.toFixed(1)}%
                </div>
             </div>
             <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col gap-1">
                <div className="flex items-center gap-1.5 text-slate-500 text-[10px] uppercase font-bold tracking-widest">
                  <HardDrive size={12} /> RAM
                </div>
                <div className="text-xl font-bold font-mono text-slate-800">
                  {currentData?.routerMem.toFixed(1)}%
                </div>
             </div>
           </div>
        </div>

        {/* OLT SNMP Status */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm transition-all flex flex-col items-start hover:shadow-md">
           <div className="flex w-full items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Server size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">OLT-Central-01</h3>
                  <p className="text-[10px] text-slate-500 font-mono">10.0.1.2 (C-Data)</p>
                </div>
              </div>
              <div className="px-2 py-1 rounded bg-emerald-50 text-emerald-600 border border-emerald-200 text-[10px] font-bold font-mono tracking-widest uppercase">
                Healthy
              </div>
           </div>
           
           <div className="grid grid-cols-2 gap-4 w-full mt-2">
             <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col gap-1">
                <div className="flex items-center gap-1.5 text-slate-500 text-[10px] uppercase font-bold tracking-widest">
                  <Cpu size={12} /> CPU Load
                </div>
                <div className="text-xl font-bold font-mono text-slate-800">
                  {currentData?.oltCpu.toFixed(1)}%
                </div>
             </div>
             <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col gap-1">
                <div className="flex items-center gap-1.5 text-slate-500 text-[10px] uppercase font-bold tracking-widest">
                  <ThermometerSnowflake size={12} /> Temp
                </div>
                <div className="text-xl font-bold font-mono text-slate-800">
                  45°C
                </div>
             </div>
           </div>
        </div>

        {/* Switch SNMP Status */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm transition-all flex flex-col items-start hover:shadow-md">
           <div className="flex w-full items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Server size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Switch-Dist-01</h3>
                  <p className="text-[10px] text-slate-500 font-mono">10.0.1.10 (Huawei)</p>
                </div>
              </div>
              <div className="px-2 py-1 rounded bg-amber-50 text-amber-600 border border-amber-200 text-[10px] font-bold font-mono tracking-widest uppercase">
                Warning
              </div>
           </div>
           
           <div className="grid grid-cols-2 gap-4 w-full mt-2">
             <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col gap-1">
                <div className="flex items-center gap-1.5 text-slate-500 text-[10px] uppercase font-bold tracking-widest">
                  <Activity size={12} /> Ports
                </div>
                <div className="text-xl font-bold font-mono text-slate-800">
                  12/24 UP
                </div>
             </div>
             <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col gap-1">
                <div className="flex items-center gap-1.5 text-slate-500 text-[10px] uppercase font-bold tracking-widest">
                  <HardDrive size={12} /> RAM
                </div>
                <div className="text-xl font-bold font-mono text-slate-800">
                  {currentData?.switchMem.toFixed(1)}%
                </div>
             </div>
           </div>
        </div>
      </div>

      {/* Aggregate Traffic Chart & SNMP Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Dynamic Chart */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Main Uplink Traffic (Gi0/1)</h3>
              <p className="text-[10px] font-mono text-slate-500 mt-1 uppercase tracking-widest">Auto-polling 2s</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary-500"></span> In {currentData?.trafficIn.toFixed(0)}M
              </span>
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Out {currentData?.trafficOut.toFixed(0)}M
              </span>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={deviceData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTrafficIn" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorTrafficOut" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="time" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} tickMargin={10} fontFamily="monospace" minTickGap={30} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}M`} tickMargin={10} fontFamily="monospace" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', color: '#0f172a', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ fontFamily: 'monospace', fontSize: '12px' }}
                  labelStyle={{ color: '#64748b', fontSize: '12px', marginBottom: '4px' }}
                  isAnimationActive={false}
                />
                <Area isAnimationActive={false} type="monotone" dataKey="trafficIn" name="Traffic IN" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorTrafficIn)" />
                <Area isAnimationActive={false} type="monotone" dataKey="trafficOut" name="Traffic OUT" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorTrafficOut)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Real-time Alerts */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 text-sm">SNMP Traps & Alerts</h3>
            <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center relative">
              <BellRing size={12} className="text-slate-500" />
              <span className="w-2 h-2 rounded-full bg-rose-500 absolute -top-0.5 -right-0.5 animate-pulse"></span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-2">
             {alerts.map((alert) => (
                <div key={alert.id} className="p-3 rounded-xl border border-slate-100 bg-slate-50 flex gap-3 items-start hover:bg-slate-100 transition-colors cursor-pointer">
                  <div className={`mt-0.5 p-1.5 rounded-lg ${
                    alert.type === 'critical' ? 'bg-rose-100 text-rose-600' :
                    alert.type === 'warning' ? 'bg-amber-100 text-amber-600' :
                    'bg-primary-100 text-primary-600'
                  }`}>
                    {alert.type === 'critical' ? <AlertTriangle size={14} /> : 
                     alert.type === 'warning' ? <Activity size={14} /> : 
                     <Wifi size={14} />}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-800 leading-tight">{alert.message}</p>
                    <p className="text-[10px] text-slate-500 font-mono mt-1">{alert.time}</p>
                  </div>
                </div>
             ))}
          </div>
          
          <button className="mt-4 w-full py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
            View All Logs
          </button>
        </div>
      </div>
    </div>
  );
}
