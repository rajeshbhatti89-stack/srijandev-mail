import { useState, useEffect } from 'react';
import { 
  UserPlus, 
  ShieldAlert, 
  CheckCircle2, 
  AlertCircle, 
  Trash2, 
  HardDrive, 
  Users, 
  Search,
  Key,
  Save
} from 'lucide-react';
import { api } from '../api';
import { useMailStore } from '../store';
import { getAvatarColor } from '../utils/formatters';
import { format } from 'date-fns';

export function AdminDashboard() {
  const { maxAttachmentMb, setMaxAttachmentMb, userProfile, setContacts } = useMailStore();
  
  // Users list state
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSearch, setUserSearch] = useState('');

  // Provisioning form state
  const [name, setName] = useState('');
  const [emailPrefix, setEmailPrefix] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [loading, setLoading] = useState(false);

  // Settings state
  const [attachmentLimitInput, setAttachmentLimitInput] = useState<number>(maxAttachmentMb || 15);
  const [settingsStatus, setSettingsStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);

  // Fetch users
  const loadUsers = () => {
    setLoadingUsers(true);
    api.getAdminUsers()
      .then(setUsers)
      .catch((err) => {
        console.error("Failed to load users:", err);
      })
      .finally(() => setLoadingUsers(false));
  };

  useEffect(() => {
    loadUsers();
    api.getSettings().then(s => {
      setAttachmentLimitInput(s.max_attachment_size_mb);
      setMaxAttachmentMb(s.max_attachment_size_mb);
    }).catch(console.error);
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    try {
      const email = `${emailPrefix.trim()}@srijandev.in`;
      await api.createAdminUser(email, password, name.trim());
      setStatus({ type: 'success', message: `Successfully provisioned ${email}` });
      setName('');
      setEmailPrefix('');
      setPassword('');
      // Reload users list & contacts
      loadUsers();
      api.getContacts().then(setContacts).catch(console.error);
    } catch (err: any) {
      setStatus({ type: 'error', message: err.message || 'Failed to create user' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string, email: string) => {
    if (userId === userProfile?.id) {
      alert("You cannot delete your own active admin account.");
      return;
    }
    if (!window.confirm(`Are you sure you want to delete user ${email}? All emails and data for this inbox will be removed.`)) {
      return;
    }

    try {
      await api.deleteAdminUser(userId);
      loadUsers();
      api.getContacts().then(setContacts).catch(console.error);
    } catch (err: any) {
      alert(err.message || 'Failed to delete user');
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setSettingsStatus(null);
    try {
      const limit = parseInt(String(attachmentLimitInput), 10);
      if (isNaN(limit) || limit < 1) {
        throw new Error('Limit must be a positive number');
      }
      await api.updateAdminSettings({ max_attachment_size_mb: limit });
      setMaxAttachmentMb(limit);
      setSettingsStatus({ type: 'success', message: `Attachment limit set to ${limit} MB successfully!` });
    } catch (err: any) {
      setSettingsStatus({ type: 'error', message: err.message || 'Failed to update settings' });
    } finally {
      setSavingSettings(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(userSearch.toLowerCase()) || 
    (u.name && u.name.toLowerCase().includes(userSearch.toLowerCase()))
  );

  return (
    <div className="flex-1 overflow-y-auto bg-surface p-6 md:p-10 select-none">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Admin Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-borderLight pb-6">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 bg-blue-50 text-blue-700 rounded-2xl flex items-center justify-center shadow-xs">
              <ShieldAlert size={26} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">Admin Console</h1>
              <p className="text-sm text-gray-500 mt-0.5">Manage domain users, email provisioning, and storage limits</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-2 bg-gray-50 rounded-xl border border-borderLight text-xs">
              <span className="text-gray-500 font-medium">Domain: </span>
              <span className="font-bold text-gray-800">srijandev.in</span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-borderLight rounded-2xl p-5 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Users size={24} />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{users.length}</div>
              <div className="text-xs text-gray-500 font-medium">Provisioned Users</div>
            </div>
          </div>

          <div className="bg-white border border-borderLight rounded-2xl p-5 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <HardDrive size={24} />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{maxAttachmentMb} MB</div>
              <div className="text-xs text-gray-500 font-medium">Attachment Limit</div>
            </div>
          </div>

          <div className="bg-white border border-borderLight rounded-2xl p-5 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Key size={24} />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">Active</div>
              <div className="text-xs text-gray-500 font-medium">Email Service Status</div>
            </div>
          </div>
        </div>

        {/* Main 2-Column Section: Left is User Provisioning & Attachment Limit, Right is Users List */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column (Forms) */}
          <div className="space-y-6 lg:col-span-1">
            {/* Attachment Limit Setting Card */}
            <div className="bg-white border border-borderLight rounded-2xl p-6 shadow-xs">
              <h2 className="text-base font-bold text-gray-900 mb-1 flex items-center gap-2">
                <HardDrive size={18} className="text-primary" />
                Attachment Limit Settings
              </h2>
              <p className="text-xs text-gray-500 mb-4">
                Configure maximum email attachment file size allowed for users.
              </p>

              <form onSubmit={handleSaveSettings} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Max File Size (in MB)
                  </label>
                  <div className="flex rounded-xl overflow-hidden border border-gray-300 focus-within:border-primary focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                    <input 
                      type="number"
                      min="1"
                      max="50"
                      required
                      value={attachmentLimitInput}
                      onChange={e => setAttachmentLimitInput(parseInt(e.target.value, 10) || 15)}
                      className="flex-1 px-3.5 py-2.5 outline-none text-sm text-gray-800"
                    />
                    <div className="bg-gray-100 border-l border-gray-300 px-3.5 py-2.5 text-xs text-gray-600 font-semibold flex items-center">
                      MB
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={savingSettings}
                  className="w-full h-10 bg-primary hover:bg-primaryHover text-white font-medium text-sm rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Save size={16} />
                  {savingSettings ? 'Saving...' : 'Save Limit'}
                </button>

                {settingsStatus && (
                  <div className={`p-3 rounded-xl flex items-center gap-2 text-xs ${
                    settingsStatus.type === 'success' 
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                      : 'bg-red-50 text-red-800 border border-red-200'
                  }`}>
                    {settingsStatus.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                    <span>{settingsStatus.message}</span>
                  </div>
                )}
              </form>
            </div>

            {/* Provision User Card */}
            <div className="bg-white border border-borderLight rounded-2xl p-6 shadow-xs">
              <h2 className="text-base font-bold text-gray-900 mb-1 flex items-center gap-2">
                <UserPlus size={18} className="text-primary" />
                Provision New Inbox
              </h2>
              <p className="text-xs text-gray-500 mb-4">
                Create a domain mailbox with default folders for a user.
              </p>

              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Display Name</label>
                  <input 
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Rajesh Bhatti"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:border-primary focus:ring-2 focus:ring-blue-100 outline-none text-sm text-gray-800 transition-all placeholder:text-gray-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Email Address</label>
                  <div className="flex rounded-xl overflow-hidden border border-gray-300 focus-within:border-primary focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                    <input 
                      type="text" 
                      required
                      value={emailPrefix}
                      onChange={e => setEmailPrefix(e.target.value)}
                      placeholder="username"
                      className="flex-1 px-3.5 py-2.5 outline-none text-sm text-gray-800"
                    />
                    <div className="bg-gray-100 border-l border-gray-300 px-3 py-2.5 text-xs text-gray-600 font-mono flex items-center">
                      @srijandev.in
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Initial Password</label>
                  <input 
                    type="password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:border-primary focus:ring-2 focus:ring-blue-100 outline-none text-sm text-gray-800 transition-all placeholder:text-gray-400"
                  />
                </div>

                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full h-10 bg-primary hover:bg-primaryHover text-white font-medium text-sm rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <UserPlus size={16} />
                  {loading ? 'Provisioning...' : 'Create Mailbox'}
                </button>

                {status && (
                  <div className={`p-3 rounded-xl flex items-center gap-2 text-xs ${
                    status.type === 'success' 
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                      : 'bg-red-50 text-red-800 border border-red-200'
                  }`}>
                    {status.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                    <span>{status.message}</span>
                  </div>
                )}
              </form>
            </div>
          </div>

          {/* Right Column (Users List Table) */}
          <div className="lg:col-span-2">
            <div className="bg-white border border-borderLight rounded-2xl shadow-xs overflow-hidden flex flex-col h-full">
              {/* Table Header & Search */}
              <div className="p-5 border-b border-borderLight flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-gray-900">Domain Users Directory</h2>
                  <p className="text-xs text-gray-500">All registered users under srijandev.in</p>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={e => setUserSearch(e.target.value)}
                    placeholder="Search users..."
                    className="w-full h-9 pl-9 pr-3 bg-gray-50 rounded-xl border border-gray-200 text-xs focus:bg-white focus:border-primary outline-none transition-all"
                  />
                </div>
              </div>

              {/* Users Table */}
              <div className="flex-1 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-gray-500 text-xs font-semibold uppercase tracking-wider border-b border-borderLight">
                    <tr>
                      <th className="px-5 py-3">User</th>
                      <th className="px-4 py-3">Role</th>
                      <th className="px-4 py-3">Created</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-borderLight/60">
                    {loadingUsers ? (
                      <tr>
                        <td colSpan={4} className="px-5 py-8 text-center text-gray-400 text-sm">
                          Loading users list...
                        </td>
                      </tr>
                    ) : filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-5 py-8 text-center text-gray-400 text-sm">
                          No users found matching your search.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map(u => {
                        const avatarBg = getAvatarColor(u.email);
                        const initial = (u.name || u.email).charAt(0).toUpperCase();
                        const isSelf = u.id === userProfile?.id;

                        return (
                          <tr key={u.id} className="hover:bg-gray-50/80 transition-colors">
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-3">
                                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shadow-xs shrink-0 ${avatarBg}`}>
                                  {initial}
                                </div>
                                <div className="min-w-0">
                                  <div className="font-semibold text-gray-900 truncate">
                                    {u.name || u.email.split('@')[0]}
                                  </div>
                                  <div className="text-xs text-gray-500 font-mono truncate">
                                    {u.email}
                                  </div>
                                </div>
                              </div>
                            </td>

                            <td className="px-4 py-3.5">
                              {u.is_admin === 1 ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 border border-purple-200">
                                  Administrator
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                                  User
                                </span>
                              )}
                            </td>

                            <td className="px-4 py-3.5 text-xs text-gray-500 whitespace-nowrap">
                              {u.created_at ? format(new Date(u.created_at), 'MMM d, yyyy') : '—'}
                            </td>

                            <td className="px-4 py-3.5 text-right">
                              {isSelf ? (
                                <span className="text-xs text-gray-400 font-medium italic">You</span>
                              ) : (
                                <button
                                  onClick={() => handleDeleteUser(u.id, u.email)}
                                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Delete user"
                                >
                                  <Trash2 size={16} />
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
