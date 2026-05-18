import React, { useState } from 'react';
import { ShieldCheck, User, AlertCircle, WifiHigh, LogIn, Mail, UserPlus } from 'lucide-react';
import { signInWithPopup, signInWithRedirect, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
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
  const [loginMethod, setLoginMethod] = useState<'google' | 'email'>('google');
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleGoogleLogin = async () => {
    setError('');
    setIsAuthenticating(true);

    try {
      await signInWithPopup(auth, googleProvider);
      onLogin();
    } catch (err: any) {
      setError(err.message || 'Gagal login dengan Google.');
      setIsAuthenticating(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Username dan password harus diisi');
      return;
    }
    
    if (password.length < 6) {
      setError('Password minimal 6 karakter');
      return;
    }
    
    setError('');
    setIsAuthenticating(true);

    // Menggunakan fake email dari username
    const authEmail = `${username.toLowerCase().replace(/\s+/g, '')}@dreampaymanager.app`;

    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, authEmail, password);
      } else {
        try {
          await signInWithEmailAndPassword(auth, authEmail, password);
        } catch (signInErr: any) {
          // Auto-register if user doesn't exist
          if (signInErr.code === 'auth/user-not-found' || signInErr.code === 'auth/invalid-credential') {
            try {
               await createUserWithEmailAndPassword(auth, authEmail, password);
            } catch (regErr: any) {
               throw regErr;
            }
          } else {
            throw signInErr;
          }
        }
      }
      onLogin();
      // Jangan set isAuthenticating(false) disini jika berhasil, karena 
      // komponen akan unmount. Namun jika ada error dari App.tsx, form ini akan
      // "stuck". Kita berikan timeout agar kembali bisa di-klik jika stuck.
      setTimeout(() => {
        setIsAuthenticating(false);
      }, 5000);
    } catch (err: any) {
      setError(err.message || `Gagal ${isRegistering ? 'mendaftar' : 'login'} dengan username. Pastikan kredensial benar.`);
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
            <img src="/logo.png" alt="Fiberling Indonesia Logo" className="w-auto h-24 object-contain shrink-0" onError={(e) => {
              // Fallback jika gambar belum diupload
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextElementSibling?.classList.remove('hidden');
            }} />
            <div className="hidden w-20 h-20 bg-blue-500/10 text-blue-600 rounded-2xl flex items-center justify-center border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.15)]">
              <ShieldCheck size={40} />
            </div>
          </div>
          
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center justify-center gap-2">
              <span className="text-[#002B5B]">FIBERLING INDONESIA</span>
            </h2>
            <p className="text-sm font-semibold text-[#00A8E8]">ISP MANAGEMENT SERVICES</p>
            <p className="text-xs text-slate-400 mt-3">Masuk untuk mengakses dashboard manajemen.</p>
          </div>
          
          {error && (
            <div className="mb-6 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
              <AlertCircle size={18} className="text-rose-600 shrink-0 mt-0.5" />
              <p className="text-xs font-medium text-rose-600">{error}</p>
            </div>
          )}

          <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
            <button 
              type="button" 
              onClick={() => { setLoginMethod('google'); setError(''); }}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${loginMethod === 'google' ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}
            >
              Google Login
            </button>
            <button 
              type="button" 
              onClick={() => { setLoginMethod('email'); setError(''); }}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${loginMethod === 'email' ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}
            >
              Username Login
            </button>
          </div>
          
          {loginMethod === 'google' ? (
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
                <><LogIn size={18} /> Login dengan Google</>
              )}
            </button>
          ) : (
            <form onSubmit={handleEmailAuth} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 ml-1">Username</label>
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan username"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all text-slate-700"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 ml-1">Password</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all text-slate-700"
                />
              </div>
              
              <div className="flex items-center justify-between text-xs px-1">
                <span className="text-slate-500">{isRegistering ? 'Sudah punya akun?' : 'Belum punya akun?'}</span>
                <button 
                  type="button" 
                  onClick={() => setIsRegistering(!isRegistering)}
                  className="text-emerald-600 font-bold hover:underline"
                >
                  {isRegistering ? 'Login disini' : 'Daftar sekarang'}
                </button>
              </div>

              <button
                type="submit"
                disabled={isAuthenticating}
                className={`w-full py-3 mt-2 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                  isAuthenticating 
                    ? 'bg-white text-slate-500 cursor-not-allowed border border-slate-300' 
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg lg:hover:shadow-emerald-500/25 border border-emerald-500/50'
                }`}
              >
                {isAuthenticating ? (
                  <><div className="w-5 h-5 border-2 border-slate-500 border-t-transparent rounded-full animate-spin"></div> Memverifikasi...</>
                ) : (
                  isRegistering ? <><UserPlus size={18} /> Buat Akun Baru</> : <><User size={18} /> Login dengan Username</>
                )}
              </button>
            </form>
          )}

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

