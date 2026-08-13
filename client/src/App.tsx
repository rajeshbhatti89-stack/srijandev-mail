import React from 'react';
import { useMailStore } from './store';
import { Login } from './components/Login';
import { Sidebar } from './components/Sidebar';
import { EmailList } from './components/EmailList';
import { EmailView } from './components/EmailView';
import { ComposeModal } from './components/ComposeModal';

function App() {
  const token = useMailStore(s => s.token);

  if (!token) {
    return <Login />;
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-background text-textMain flex">
      <Sidebar />
      <EmailList />
      <EmailView />
      <ComposeModal />
    </div>
  );
}

export default App;
