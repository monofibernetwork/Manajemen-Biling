import React, { useState, useEffect } from 'react';
import { Camera, X, Check, CheckCircle2, ChevronRight, Barcode } from 'lucide-react';

interface ScanOnuModalProps {
  schedule: any;
  onClose: () => void;
  onConfirm: (sn: string) => void;
}

export function ScanOnuModal({ schedule, onClose, onConfirm }: ScanOnuModalProps) {
  const [manualSn, setManualSn] = useState('');
  const [detectedSn, setDetectedSn] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(true);

  // Simulate scanning after 2 seconds
  useEffect(() => {
    if (isScanning) {
      const timer = setTimeout(() => {
        setDetectedSn('4857544350B7C3C1');
        setIsScanning(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isScanning]);

  const handleManualUse = () => {
    if (manualSn) {
      setDetectedSn(manualSn);
      setIsScanning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-50 overflow-hidden shadow-2xl rounded-xl">
        {/* Header */}
        <div className="bg-[#1967D2] text-white px-4 py-3 flex items-center justify-center relative">
          <h2 className="font-bold text-lg text-center font-sans tracking-wide">Scan SN ONU Teknisi</h2>
          <button 
            onClick={onClose}
            className="absolute right-3 top-3 text-white/80 hover:text-white hover:bg-white/10 p-1 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Customer Info */}
          <div className="bg-white border border-slate-200 rounded-lg p-3 flex gap-3 shadow-sm">
            <div className="mt-0.5">
              <div className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 bg-slate-50">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              </div>
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">Nama Pelanggan: <span className="font-semibold">{schedule?.customerName}</span></p>
              <p className="text-xs text-slate-600 mt-0.5">Alamat: {schedule?.address}</p>
            </div>
          </div>

          {/* Scanner Area */}
          <div className="relative bg-slate-900 rounded-lg overflow-hidden h-48 flex items-center justify-center shadow-inner group">
            {/* Simulated camera feed background */}
            <div 
              className="absolute inset-0 opacity-40 mix-blend-luminosity"
              style={{
                backgroundImage: 'url("https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format&fit=crop&q=60")',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            />
            
            <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs font-semibold px-3 py-1.5 rounded-full z-10 font-mono tracking-wide">
              Scan Barcode / QR SN
            </div>

            {/* Scanning Target Box */}
            <div className="relative z-10 w-40 h-40">
              <div className="absolute inset-0 border-2 border-emerald-500/80 rounded-lg" style={{ clipPath: 'polygon(0 0, 20% 0, 20% 5%, 5% 5%, 5% 20%, 0 20%, 0 100%, 5% 100%, 5% 80%, 20% 80%, 20% 100%, 80% 100%, 80% 80%, 95% 80%, 95% 100%, 100% 100%, 100% 0, 80% 0, 80% 5%, 95% 5%, 95% 20%, 100% 20%, 100% 80%, 95% 80%, 95% 100%, 80% 100%, 80% 95%, 20% 95%, 20% 100%, 0 100%)' }}></div>
              
              {/* Corner brackets for scanner feel */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-emerald-500 rounded-tl-xl"></div>
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-emerald-500 rounded-tr-xl"></div>
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-emerald-500 rounded-bl-xl"></div>
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-emerald-500 rounded-br-xl"></div>

              {/* Scanning animation line */}
              {isScanning && (
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-emerald-400 shadow-[0_0_8px_2px_rgba(52,211,153,0.8)] animate-[scan_2s_ease-in-out_infinite]" />
              )}
              
              {/* Fake QR/Barcode in center */}
              <div className="absolute inset-4 bg-white/90 rounded-md flex flex-col items-center justify-center p-2 opacity-80 mix-blend-screen">
                <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><path d="M7 7h.01"></path><path d="M17 7h.01"></path><path d="M7 17h.01"></path><path d="M17 17h.01"></path><path d="M12 7v10"></path><path d="M7 12h10"></path></svg>
                <div className="w-full flex justify-between mt-1 px-1">
                  <div className="h-4 w-1 bg-black"></div>
                  <div className="h-4 w-2 bg-black"></div>
                  <div className="h-4 w-1 bg-black"></div>
                  <div className="h-4 w-3 bg-black"></div>
                  <div className="h-4 w-1 bg-black"></div>
                  <div className="h-4 w-2 bg-black"></div>
                </div>
              </div>
            </div>
            
            {/* Click to scan simulation if they don't want to wait */}
            {isScanning && (
              <button 
                onClick={() => {
                  setDetectedSn('4857544350B7C3C1');
                  setIsScanning(false);
                }}
                className="absolute inset-0 z-20 w-full h-full cursor-pointer opacity-0"
              />
            )}
          </div>

          {/* Input Manual */}
          <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm">
            <label className="block text-xs font-bold text-slate-800 mb-2 mt-1">Input Manual</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line></svg>
                </div>
                <input 
                  type="text" 
                  value={manualSn}
                  onChange={(e) => setManualSn(e.target.value.toUpperCase())}
                  placeholder="Masukkan Serial Number"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 transition-colors uppercase"
                />
              </div>
              <button 
                onClick={handleManualUse}
                className="bg-[#1967D2] hover:bg-primary-700 text-white px-4 py-2 rounded-md font-semibold text-sm transition-colors shadow-sm cursor-pointer"
              >
                Gunakan
              </button>
            </div>
          </div>

          {/* Result Section */}
          <div className="space-y-3">
            <div className={`p-3 rounded-lg border flex items-center gap-3 transition-colors ${detectedSn ? 'bg-emerald-50 border-emerald-400/60' : 'bg-slate-100 border-slate-200 opacity-50'}`}>
              <div className={`${detectedSn ? 'bg-emerald-500' : 'bg-slate-300'} rounded-full w-6 h-6 flex items-center justify-center text-white shrink-0`}>
                <Check size={14} strokeWidth={3} />
              </div>
              <div>
                <p className={`text-xs font-bold ${detectedSn ? 'text-emerald-800' : 'text-slate-600'}`}>SN Terdeteksi</p>
                <p className={`text-sm ${detectedSn ? 'text-slate-900 font-medium' : 'text-slate-400'}`}>SN: {detectedSn || 'Belum discan'}</p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm">
              <p className="text-xs font-bold text-slate-800 mb-1">Detail Perangkat</p>
              <p className="text-sm text-slate-700">Model: {detectedSn ? 'FiberHome AN5506-04-FA' : '-'}</p>
              <p className="text-sm text-slate-700">Tipe: {detectedSn ? 'GPON ONT' : '-'}</p>
            </div>
          </div>

        </div>

        {/* Action Button */}
        <div className="p-4 bg-slate-50 border-t border-slate-200">
          <button
            disabled={!detectedSn}
            onClick={() => detectedSn && onConfirm(detectedSn)}
            className="w-full bg-[#1967D2] hover:bg-primary-700 disabled:bg-primary-300 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg flex flex-row items-center justify-center gap-2 transition-colors shadow-sm shadow-primary-600/20"
          >
            <CheckCircle2 size={18} />
            Konfirmasi & Registrasi
          </button>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes scan {
          0% { top: 10%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 90%; opacity: 0; }
        }
      `}} />
    </div>
  );
}
