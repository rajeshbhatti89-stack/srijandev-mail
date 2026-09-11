import { useEffect, useState, useRef } from 'react';
import { Search, X, Settings, LogOut, Menu, Mail } from 'lucide-react';
import { useMailStore } from '../store';
import { api } from '../api';
import { getAvatarColor } from '../utils/formatters';

export function Header() {
  const { 
    searchQuery, 
    setSearchQuery, 
    userProfile, 
    setUserProfile, 
    setAuth, 
    setProfileModalOpen, 
    isSidebarOpen, 
    setSidebarOpen 
  } = useMailStore();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.getProfile().then(profile => {
      setUserProfile(profile);
    }).catch(console.error);
  }, [setUserProfile]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const userInitial = userProfile?.name 
    ? userProfile.name.charAt(0).toUpperCase() 
    : (userProfile?.email ? userProfile.email.charAt(0).toUpperCase() : 'U');

  const avatarBg = getAvatarColor(userProfile?.email || 'user');

  return (
    <header className="h-16 px-4 flex items-center justify-between shrink-0 bg-background z-30 select-none">
      {/* Left: Hamburger & Brand */}
      <div className="flex items-center gap-3 w-64">
        <button
          onClick={() => setSidebarOpen(!isSidebarOpen)}
          className="p-2.5 rounded-full hover:bg-black/5 text-textMuted hover:text-textMain transition-colors"
          title="Main menu"
        >
          <Menu size={20} />
        </button>

        <div className="flex items-center gap-2 cursor-pointer" onClick={() => useMailStore.getState().setView('mail')}>
          {/* Gmail-style Brand Icon */}
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-sm">
            <Mail size={20} className="stroke-[2.2]" />
          </div>
          <div className="flex items-baseline">
            <span className="font-semibold text-xl tracking-tight text-gray-800">SrijanDev</span>
            <span className="text-xl font-normal text-gray-500 ml-1">Mail</span>
          </div>
        </div>
      </div>

      {/* Center: Gmail Search Bar */}
      <div className="flex-1 max-w-2xl px-4">
        <div className="relative flex items-center w-full group">
          <div className="absolute left-3.5 text-gray-500 group-focus-within:text-primary pointer-events-none">
            <Search size={20} />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search mail"
            className="w-full h-11 pl-11 pr-10 bg-surfaceHighlight hover:bg-[#E2ECF8] focus:bg-white text-gray-900 rounded-full border border-transparent focus:border-borderDark focus:shadow-gmail outline-none transition-all text-sm placeholder:text-gray-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 p-1 rounded-full text-gray-500 hover:text-gray-700 hover:bg-black/5 transition-colors"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Right: Actions & Account */}
      <div className="flex items-center gap-1.5" ref={dropdownRef}>
        <button 
          onClick={() => setProfileModalOpen(true)}
          className="p-2 rounded-full hover:bg-black/5 text-gray-600 hover:text-gray-900 transition-colors"
          title="Settings"
        >
          <Settings size={20} />
        </button>

        {/* Account Avatar Button */}
        <div className="relative ml-2">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center justify-center p-0.5 rounded-full hover:ring-4 hover:ring-black/5 transition-all"
            title={userProfile?.email || 'Google Account'}
          >
            <div className={`w-9 h-9 rounded-full flex items-center justify-center font-medium text-sm shadow-sm ${avatarBg}`}>
              {userInitial}
            </div>
          </button>

          {/* Google Account Profile Card Modal */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-3xl shadow-gmail-dropdown border border-borderDark/80 p-4 z-50 animate-in fade-in zoom-in-95">
              <div className="flex flex-col items-center text-center pb-4 border-b border-borderLight">
                <div className="text-xs font-medium text-gray-500 mb-3 truncate max-w-full">
                  {userProfile?.email}
                </div>
                
                <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mb-2 shadow-sm ${avatarBg}`}>
                  {userInitial}
                </div>

                <h3 className="font-semibold text-gray-900 text-lg">
                  {userProfile?.name || 'SrijanDev User'}
                </h3>
                <p className="text-sm text-gray-500 font-mono mt-0.5">
                  {userProfile?.email}
                </p>

                {userProfile?.is_admin === 1 && (
                  <span className="mt-2 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-200">
                    Administrator
                  </span>
                )}

                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    setProfileModalOpen(true);
                  }}
                  className="mt-4 px-5 py-2 rounded-full border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Manage your Account
                </button>
              </div>

              <div className="pt-3">
                <button
                  onClick={() => setAuth(null, false)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <LogOut size={18} className="text-gray-500" />
                  Sign out of SrijanDev
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
