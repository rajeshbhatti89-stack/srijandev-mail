import { useState } from 'react';
import { X, Save, User, Lock, CheckCircle2, AlertCircle } from 'lucide-react';
import { useMailStore } from '../store';
import { api } from '../api';

export function ProfileModal() {
  const { userProfile, setProfileModalOpen, setUserProfile } = useMailStore();
  
  const [name, setName] = useState(userProfile?.name || '');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  if (!userProfile) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const updateData: any = { name };
      if (password) updateData.password = password;

      await api.updateProfile(updateData);
      setUserProfile({ ...userProfile, name });
      setMessage('Profile updated successfully');
      setPassword('');
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200 select-none">
      <div className="bg-white border border-borderDark/80 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative">
        <div className="p-6 border-b border-borderLight flex justify-between items-center bg-gray-50">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <User className="text-primary" size={20} />
            Account Settings
          </h2>
          <button 
            onClick={() => setProfileModalOpen(false)}
            className="text-gray-400 hover:text-gray-700 p-1.5 rounded-full hover:bg-black/5 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-4">
          {message && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
              <CheckCircle2 size={16} />
              <span>{message}</span>
            </div>
          )}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Email Address</label>
            <input 
              type="email" 
              value={userProfile.email}
              disabled
              className="w-full bg-gray-100 border border-gray-200 text-gray-500 rounded-xl px-4 py-2.5 text-sm font-mono opacity-80 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Full Name</label>
            <div className="relative">
              <User className="absolute left-3.5 top-3 text-gray-400" size={16} />
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="w-full bg-white border border-gray-300 text-gray-900 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-100 focus:border-primary outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Change Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 text-gray-400" size={16} />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Leave blank to keep current"
                className="w-full bg-white border border-gray-300 text-gray-900 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-100 focus:border-primary outline-none transition-all"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-2 border-t border-borderLight">
            <button
              type="button"
              onClick={() => setProfileModalOpen(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-primary text-white text-sm font-semibold rounded-full hover:bg-primaryHover transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
            >
              <Save size={16} />
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
