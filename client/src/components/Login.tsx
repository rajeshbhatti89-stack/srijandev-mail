import { useState } from 'react';
import { useMailStore } from '../store';
import { api } from '../api';
import { 
  Lock, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  User, 
  Sparkles,
  AlertCircle
} from 'lucide-react';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const setAuth = useMailStore(s => s.setAuth);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await api.login(email, password);
      setAuth(data.token, data.is_admin);
    } catch (err: any) {
      setError('Invalid username/email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#030712] font-sans p-4 relative overflow-hidden select-none">
      {/* Dynamic Ambient Background Glows inspired by srijandev.in */}
      <div className="absolute top-[-15%] left-[-10%] w-[55vw] h-[55vw] max-w-[650px] max-h-[650px] bg-gradient-to-br from-cyan-500/20 via-blue-600/15 to-transparent rounded-full blur-[140px] pointer-events-none animate-pulse duration-1000" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[55vw] h-[55vw] max-w-[650px] max-h-[650px] bg-gradient-to-tl from-purple-600/20 via-indigo-600/15 to-transparent rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70vw] h-[70vw] max-w-[800px] max-h-[800px] bg-cyan-900/10 rounded-full blur-[160px] pointer-events-none" />

      {/* Futuristic Cyber Dot Matrix Grid Overlay */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: 'radial-gradient(rgba(0, 229, 255, 0.4) 1px, transparent 1px)',
          backgroundSize: '28px 28px'
        }}
      />

      {/* Main Luxury Glass Card */}
      <div className="w-full max-w-[430px] bg-[#0A0F1E]/80 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 sm:p-10 shadow-[0_0_60px_rgba(0,0,0,0.9),0_0_30px_rgba(0,229,255,0.15)] relative z-10 transition-all">
        {/* Top Edge Ambient Neon Accent Line */}
        <div className="absolute top-0 left-8 right-8 h-[1px] bg-gradient-to-r from-transparent via-[#00E5FF]/70 to-transparent" />

        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-8">
          {/* Logo with Soft Glowing Aura */}
          <div className="relative mb-5 group cursor-pointer">
            <div className="absolute -inset-2 bg-gradient-to-r from-cyan-500/30 to-blue-600/30 rounded-full blur-xl group-hover:blur-2xl transition-all opacity-80" />
            <img 
              src="/logo.png" 
              alt="SrijanDev" 
              className="w-44 h-auto object-contain relative z-10 drop-shadow-[0_0_15px_rgba(0,229,255,0.35)] group-hover:scale-[1.03] transition-transform duration-300" 
            />
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
            <span>SrijanDev Mail</span>
          </h1>

          <p className="text-xs text-slate-400 mt-1 font-medium tracking-wide">
            Enterprise Spatial & Cloud Communication Portal
          </p>

          {/* SrijanDev Live Node Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 mt-3.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-[11px] font-mono text-cyan-300">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            <span>mail.srijandev.in • secure</span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          {/* Username / Email Field */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Email or Username
              </label>
              <span className="text-[10px] text-cyan-400/80 font-mono">
                @srijandev.in
              </span>
            </div>

            <div className="relative flex items-center group">
              <div className="absolute left-4 text-slate-400 group-focus-within:text-cyan-400 transition-colors pointer-events-none">
                <User size={18} />
              </div>
              <input 
                type="text" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="username or user@srijandev.in"
                autoComplete="username"
                required
                className="w-full bg-[#111827]/90 border border-white/10 rounded-2xl pl-11 pr-4 py-3.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/25 transition-all shadow-inner"
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Password
              </label>
            </div>

            <div className="relative flex items-center group">
              <div className="absolute left-4 text-slate-400 group-focus-within:text-cyan-400 transition-colors pointer-events-none">
                <Lock size={18} />
              </div>
              <input 
                type={showPassword ? "text" : "password"} 
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                required
                className="w-full bg-[#111827]/90 border border-white/10 rounded-2xl pl-11 pr-11 py-3.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/25 transition-all shadow-inner font-mono tracking-wider"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 text-slate-400 hover:text-slate-200 transition-colors p-1"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Error Notice */}
          {error && (
            <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/25 text-red-400 text-xs flex items-center gap-2 animate-in fade-in">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* SrijanDev Electric Cyan Submit Button */}
          <div className="pt-2">
            <button 
              type="submit" 
              disabled={loading}
              className="w-full h-12 bg-gradient-to-r from-[#00E5FF] via-[#00B4D8] to-[#00E5FF] hover:brightness-110 active:scale-[0.99] text-gray-950 font-bold tracking-wide rounded-2xl transition-all shadow-[0_0_25px_rgba(0,229,255,0.4)] hover:shadow-[0_0_35px_rgba(0,229,255,0.65)] flex items-center justify-center gap-2.5 text-sm disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <span>Authenticating node...</span>
              ) : (
                <>
                  <span>Sign In to Inbox</span>
                  <ArrowRight size={17} className="stroke-[2.5]" />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Footer Security Badges */}
        <div className="mt-8 pt-6 border-t border-white/5 flex flex-col items-center text-center space-y-2">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
            <ShieldCheck size={14} className="text-cyan-400" />
            <span>Encrypted with Cloudflare D1 & Workers Architecture</span>
          </div>
          <a 
            href="https://srijandev.in" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-[11px] text-slate-500 hover:text-cyan-400 transition-colors inline-flex items-center gap-1"
          >
            <span>Engineered by SrijanDev Technologies</span>
            <Sparkles size={11} />
          </a>
        </div>
      </div>
    </div>
  );
}
