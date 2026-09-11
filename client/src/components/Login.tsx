import { useState } from 'react';
import { useMailStore } from '../store';
import { api } from '../api';
import { Mail, ArrowRight } from 'lucide-react';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
      setError('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background font-sans p-4">
      {/* Google-styled Login Card */}
      <div className="w-full max-w-md p-8 md:p-10 bg-white border border-borderDark/80 rounded-3xl shadow-gmail-card z-10">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-sm mb-4">
            <Mail size={26} />
          </div>
          <div className="flex items-baseline">
            <span className="font-semibold text-2xl tracking-tight text-gray-900">SrijanDev</span>
            <span className="text-2xl font-normal text-gray-500 ml-1.5">Mail</span>
          </div>
          <h1 className="text-xl font-medium text-gray-800 mt-3">Sign in</h1>
          <p className="text-sm text-gray-500 mt-1">to continue to your Webmail inbox</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Email or Username</label>
            <input 
              type="text" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-primary focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm text-gray-900 placeholder:text-gray-400"
              placeholder="username or user@srijandev.in"
              autoComplete="username"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-primary focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm text-gray-900 placeholder:text-gray-400"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
              {error}
            </div>
          )}

          <div className="pt-2">
            <button 
              type="submit" 
              disabled={loading}
              className="w-full h-11 bg-primary hover:bg-primaryHover text-white font-semibold rounded-full transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2 text-sm disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign In'}
              {!loading && <ArrowRight size={16} />}
            </button>
          </div>
        </form>

        <div className="mt-8 pt-6 border-t border-borderLight text-center">
          <p className="text-xs text-gray-400">
            Protected by SrijanDev Cloudflare Workspace Services
          </p>
        </div>
      </div>
    </div>
  );
}
