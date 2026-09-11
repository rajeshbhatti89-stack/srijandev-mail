import { useState, useRef } from 'react';
import { X, Save, User, Lock, CheckCircle2, AlertCircle, Camera, Trash2 } from 'lucide-react';
import { useMailStore } from '../store';
import { api } from '../api';
import { getAvatarColor } from '../utils/formatters';

// Utility to compress image to a lightweight 256x256 JPEG base64 string
function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxSize = 256;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxSize) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('Canvas context unavailable'));
        }
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export function ProfileModal() {
  const { userProfile, setProfileModalOpen, setUserProfile } = useMailStore();
  
  const [name, setName] = useState(userProfile?.name || '');
  const [password, setPassword] = useState('');
  const [avatar, setAvatar] = useState<string>(userProfile?.avatar || '');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!userProfile) return null;

  const userInitial = (name || userProfile.email).charAt(0).toUpperCase();
  const avatarBg = getAvatarColor(userProfile.email);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (JPG, PNG, WebP).');
      return;
    }

    try {
      const compressedBase64 = await compressImage(file);
      setAvatar(compressedBase64);
      setError('');
    } catch (err: any) {
      console.error(err);
      setError('Failed to process image. Please try another file.');
    }
  };

  const handleRemoveAvatar = () => {
    setAvatar('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const updateData: any = { name, avatar };
      if (password) updateData.password = password;

      await api.updateProfile(updateData);
      setUserProfile({ ...userProfile, name, avatar });
      setMessage('Profile and picture updated successfully');
      setPassword('');
      setTimeout(() => {
        setProfileModalOpen(false);
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200 select-none">
      <div className="bg-white border border-borderDark/80 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative">
        <div className="p-6 border-b border-borderLight flex justify-between items-center bg-gray-50">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <User className="text-primary" size={20} />
            Account & Profile Picture
          </h2>
          <button 
            onClick={() => setProfileModalOpen(false)}
            className="text-gray-400 hover:text-gray-700 p-1.5 rounded-full hover:bg-black/5 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-5">
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

          {/* Profile Picture Upload Section */}
          <div className="flex flex-col items-center justify-center pb-2">
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              {avatar ? (
                <img 
                  src={avatar} 
                  alt="Profile" 
                  className="w-24 h-24 rounded-full object-cover ring-4 ring-blue-100 shadow-md transition-all group-hover:brightness-75"
                />
              ) : (
                <div className={`w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold shadow-md ring-4 ring-gray-100 text-white ${avatarBg} transition-all group-hover:brightness-75`}>
                  {userInitial}
                </div>
              )}

              {/* Hover Camera Overlay */}
              <div className="absolute inset-0 rounded-full flex flex-col items-center justify-center bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera size={24} className="mb-0.5" />
                <span className="text-[10px] font-semibold">Change</span>
              </div>

              {/* Camera Badge at bottom-right */}
              <div className="absolute bottom-0 right-0 p-1.5 bg-primary text-white rounded-full shadow-md border-2 border-white group-hover:scale-110 transition-transform">
                <Camera size={14} />
              </div>
            </div>

            <input 
              ref={fileInputRef}
              type="file" 
              accept="image/*"
              onChange={handleFileChange}
              className="hidden" 
            />

            <div className="flex items-center gap-3 mt-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs font-semibold text-primary hover:text-primaryHover hover:underline cursor-pointer"
              >
                Upload new picture
              </button>
              {avatar && (
                <>
                  <span className="text-gray-300 text-xs">•</span>
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    className="text-xs text-red-600 hover:text-red-700 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 size={12} />
                    <span>Remove</span>
                  </button>
                </>
              )}
            </div>
            <p className="text-[11px] text-gray-400 mt-1">Supports JPG, PNG, WebP (auto-optimized)</p>
          </div>

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
              className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full text-sm font-medium transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-primary text-white text-sm font-semibold rounded-full hover:bg-primaryHover transition-all shadow-sm flex items-center gap-2 disabled:opacity-50 cursor-pointer"
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
