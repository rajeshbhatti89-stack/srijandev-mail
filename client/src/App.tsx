import { useEffect } from 'react';
import { useMailStore } from './store';
import { Login } from './components/Login';
import { Sidebar } from './components/Sidebar';
import { EmailList } from './components/EmailList';
import { EmailView } from './components/EmailView';
import { ComposeModal } from './components/ComposeModal';
import { AdminDashboard } from './components/AdminDashboard';
import { Header } from './components/Header';
import { ProfileModal } from './components/ProfileModal';
import { api } from './api';

function App() {
  const token = useMailStore(s => s.token);
  const view = useMailStore(s => s.view);
  const isProfileModalOpen = useMailStore(s => s.isProfileModalOpen);
  const selectedEmailId = useMailStore(s => s.selectedEmailId);
  const isSidebarOpen = useMailStore(s => s.isSidebarOpen);
  const setSidebarOpen = useMailStore(s => s.setSidebarOpen);
  const setContacts = useMailStore(s => s.setContacts);
  const setMaxAttachmentMb = useMailStore(s => s.setMaxAttachmentMb);

  useEffect(() => {
    if (token) {
      api.getContacts().then(setContacts).catch(console.error);
      api.getSettings().then(s => setMaxAttachmentMb(s.max_attachment_size_mb)).catch(console.error);
    }
  }, [token, setContacts, setMaxAttachmentMb]);

  if (!token) {
    return <Login />;
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-background text-textMain flex flex-col font-sans">
      {/* Gmail Top Header */}
      <Header />

      {/* Main Workspace */}
      <div className="flex-1 flex min-h-0 relative pr-0 md:pr-4 pb-0 md:pb-4">
        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
          <div 
            className="md:hidden fixed inset-0 bg-black/40 z-40 backdrop-blur-xs transition-opacity" 
            onClick={() => setSidebarOpen(false)} 
          />
        )}
        
        {/* Sidebar */}
        <div className={`${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 absolute md:static inset-y-0 left-0 z-50 transition-transform duration-200 ease-in-out`}>
          <Sidebar />
        </div>

        {/* Gmail Main Content Card Container */}
        <main className="flex-1 flex min-w-0 bg-surface md:rounded-2xl border border-borderDark/70 shadow-gmail-card overflow-hidden">
          {view === 'mail' ? (
            selectedEmailId ? (
              <EmailView />
            ) : (
              <EmailList />
            )
          ) : (
            <AdminDashboard />
          )}
        </main>
      </div>

      <ComposeModal />
      {isProfileModalOpen && <ProfileModal />}
    </div>
  );
}

export default App;
