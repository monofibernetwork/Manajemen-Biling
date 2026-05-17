import React, { useState } from 'react';
import { ShieldCheck, User, AlertCircle, WifiHigh, LogIn } from 'lucide-react';
import { signInWithPopup, signInWithRedirect } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { useTenant } from '../contexts/TenantContext';

interface AdminLoginProps {
  onLogin: () => void;
  onCustomerPortal?: () => void;
  onTechnicianPortal?: () => void;
}

export function AdminLogin({ onLogin, onCustomerPortal, onTechnicianPortal }: AdminLoginProps) {
  const { branding } = useTenant();
  const [error, setError] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleGoogleLogin = async () => {
    setError('');
    setIsAuthenticating(true);

    try {
      // Use redirect to bypass iOS Safari issues with popups/iframes
      await signInWithRedirect(auth, googleProvider);
    } catch (err: any) {
      setError(err.message || 'Gagal login dengan Google.');
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
          <ShieldCheck size={160} />
        </div>
        
        <div className="relative z-10">
          <div className="flex justify-center mb-6">
            {branding?.logoUrl ? (
                <img src={branding.logoUrl} alt="Logo" className="w-16 h-16 object-contain rounded-2xl shrink-0" />
            ) : (
                <div className="w-16 h-16 bg-emerald-500/10 text-emerald-600 rounded-2xl flex items-center justify-center border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                  <ShieldCheck size={32} />
                </div>
            )}
          </div>
          
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center justify-center gap-2">
              <span style={{ color: branding?.primaryColorHex || '#ea580c' }}>{branding?.businessName || 'Portal Access'}</span>
            </h2>
            <p className="text-sm text-slate-400 mt-2">Masuk menggunakan Akun Google yang telah terdaftar di sistem.</p>
          </div>
          
          {error && (
            <div className="mb-6 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
              <AlertCircle size={18} className="text-rose-600 shrink-0 mt-0.5" />
              <p className="text-xs font-medium text-rose-600">{error}</p>
            </div>
          )}
          
          <button
            onClick={handleGoogleLogin}
            disabled={isAuthenticating}
            className={`w-full py-3 mt-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
              isAuthenticating 
                ? 'bg-white text-slate-500 cursor-not-allowed border border-slate-300' 
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg lg:hover:shadow-emerald-500/25 border border-emerald-500/50'
            }`}
          >
            {isAuthenticating ? (
              <><div className="w-5 h-5 border-2 border-slate-500 border-t-transparent rounded-full animate-spin"></div> Memverifikasi...</>
            ) : (
              <><LogIn size={18} /> Login dengan Google (Admin)</>
            )}
          </button>

          {onCustomerPortal && (
            <div className="mt-8 pt-6 border-t border-slate-200/60 text-center flex flex-col gap-3">
              <button
                onClick={onCustomerPortal}
                type="button"
                className="w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all bg-white/40 hover:bg-white border border-slate-300/50 text-slate-700"
              >
                <User size={18} /> Masuk Portal Pelanggan
              </button>
              <button
                onClick={onTechnicianPortal}
                type="button"
                className="w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-700"
              >
                <AlertCircle size={18} /> Masuk Portal Teknisi
              </button>
            </div>
          )}
        </div>
      </div>
      
      <p className="mt-8 text-xs text-slate-400 font-mono tracking-wider">
        &copy; {new Date().getFullYear()} Fiberling Indonesia v2.10 Dashboard
      </p>
    </div>
  );
}

