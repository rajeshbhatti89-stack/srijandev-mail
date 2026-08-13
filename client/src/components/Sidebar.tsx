import { useEffect, useState } from 'react';
import { Inbox, Send, FileEdit, Archive, Trash2, LogOut } from 'lucide-react';
import { useMailStore } from '../store';
import { api } from '../api';

const iconMap: Record<string, React.ReactNode> = {
  inbox: <Inbox size={18} />,
  sent: <Send size={18} />,
  drafts: <FileEdit size={18} />,
  archive: <Archive size={18} />,
  trash: <Trash2 size={18} />,
  custom: <Inbox size={18} />
};

export function Sidebar() {
  const { currentFolder, setCurrentFolder, setToken, setComposeOpen } = useMailStore();
  const [folders, setFolders] = useState<any[]>([]);

  useEffect(() => {
    api.getFolders().then(setFolders).catch(console.error);
  }, []);

  return (
    <div className="w-64 bg-surface border-r border-borderDark flex flex-col h-full">
      <div className="p-4 flex items-center gap-2">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center font-bold">S</div>
        <span className="font-semibold text-lg tracking-tight">Mail</span>
      </div>

      <div className="px-4 py-2">
        <button 
          onClick={() => setComposeOpen(true)}
          className="w-full bg-primary hover:bg-blue-600 text-white font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
        >
          <FileEdit size={18} />
          Compose
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        <div className="px-3 space-y-1">
          {folders.map(folder => (
            <button
              key={folder.id}
              onClick={() => setCurrentFolder(folder.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                currentFolder === folder.id 
                  ? 'bg-primary/10 text-primary font-medium' 
                  : 'text-textMuted hover:bg-surfaceHighlight hover:text-textMain'
              }`}
            >
              {iconMap[folder.type] || iconMap.custom}
              {folder.name}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 border-t border-borderDark">
        <button 
          onClick={() => setToken(null)}
          className="flex items-center gap-2 text-textMuted hover:text-textMain transition-colors w-full px-2"
        >
          <LogOut size={18} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}
