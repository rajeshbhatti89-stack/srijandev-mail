import { useEffect, useState } from 'react';
import { 
  Inbox, 
  Send, 
  FileText, 
  Trash2, 
  Star, 
  ShieldAlert, 
  Edit3,
  HardDrive,
  CornerDownRight,
  CheckCircle2
} from 'lucide-react';
import { useMailStore } from '../store';
import { api } from '../api';

const folderIconMap: Record<string, React.ReactNode> = {
  inbox: <Inbox size={18} />,
  sent: <Send size={18} />,
  drafts: <FileText size={18} />,
  trash: <Trash2 size={18} />,
  starred: <Star size={18} />,
  custom: <Inbox size={18} />
};

export function Sidebar() {
  const { 
    currentFolder, 
    setCurrentFolder, 
    setComposeOpen, 
    isAdmin, 
    view, 
    setView,
    maxAttachmentMb,
    setSidebarOpen,
    draggedEmailIds,
    setDraggedEmailIds,
    triggerEmailsRefresh
  } = useMailStore();

  const [folders, setFolders] = useState<any[]>([]);
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);
  const [dropSuccessFolderId, setDropSuccessFolderId] = useState<string | null>(null);

  useEffect(() => {
    api.getFolders().then((f) => {
      setFolders(f);
      if (f.length > 0 && !currentFolder) {
        setCurrentFolder(f[0].id);
      }
    }).catch(console.error);
  }, [currentFolder, setCurrentFolder]);

  const handleSelectFolder = (id: string) => {
    setView('mail');
    setCurrentFolder(id);
    setSidebarOpen(false);
  };

  const handleSelectAdmin = () => {
    setView('admin');
    setSidebarOpen(false);
  };

  // Helper to extract email IDs from drag event or store
  const getDroppedEmailIds = (e: React.DragEvent): string[] => {
    if (draggedEmailIds && draggedEmailIds.length > 0) {
      return draggedEmailIds;
    }
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      if (data && Array.isArray(data.emailIds)) {
        return data.emailIds;
      }
    } catch {}
    const text = e.dataTransfer.getData('text/plain');
    if (text) {
      return text.split(',').filter(Boolean);
    }
    return [];
  };

  // Handle drop on Starred folder
  const handleDropOnStarred = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverFolderId(null);
    const ids = getDroppedEmailIds(e);
    if (!ids || ids.length === 0) return;

    try {
      await api.bulkStarEmails(ids, true);
      setDropSuccessFolderId('starred');
      setTimeout(() => setDropSuccessFolderId(null), 1500);
      triggerEmailsRefresh();
    } catch (err) {
      console.error('Failed to star emails on drop:', err);
    } finally {
      setDraggedEmailIds(null);
    }
  };

  // Handle drop on standard/custom folder
  const handleDropOnFolder = async (e: React.DragEvent, targetFolderId: string) => {
    e.preventDefault();
    setDragOverFolderId(null);
    const ids = getDroppedEmailIds(e);
    if (!ids || ids.length === 0) return;

    if (targetFolderId === currentFolder) {
      setDraggedEmailIds(null);
      return;
    }

    try {
      await api.bulkMoveEmails(ids, targetFolderId);
      setDropSuccessFolderId(targetFolderId);
      setTimeout(() => setDropSuccessFolderId(null), 1500);
      triggerEmailsRefresh();
    } catch (err) {
      console.error('Failed to move emails on drop:', err);
    } finally {
      setDraggedEmailIds(null);
    }
  };

  return (
    <aside className="w-72 md:w-64 flex flex-col h-full bg-white md:bg-background select-none pr-3 pt-2 shadow-2xl md:shadow-none border-r border-borderLight md:border-none">
      {/* Mobile Drawer Header with Close Button */}
      <div className="flex md:hidden items-center justify-between px-4 pb-3 pt-1 border-b border-borderLight mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white">
            <Inbox size={16} />
          </div>
          <span className="font-bold text-gray-800 text-base">SrijanDev Mail</span>
        </div>
        <button
          onClick={() => setSidebarOpen(false)}
          className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500 cursor-pointer"
        >
          ✕
        </button>
      </div>

      {/* Gmail Compose Pill Button */}
      <div className="px-4 pb-4">
        <button 
          onClick={() => {
            setComposeOpen(true);
            setSidebarOpen(false);
          }}
          className="flex items-center gap-3.5 bg-primaryLight hover:bg-[#B3E1FF] text-primaryLightText px-6 py-4 rounded-2xl shadow-gmail hover:shadow-gmail-compose transition-all font-medium text-sm group w-full sm:w-auto cursor-pointer"
        >
          <Edit3 size={20} className="text-gray-800 group-hover:scale-105 transition-transform" />
          <span className="font-medium tracking-wide">Compose</span>
        </button>
      </div>

      {/* Gmail Folder Navigation List */}
      <div className="flex-1 overflow-y-auto space-y-1">
        {/* Starred Folder with Drop Target */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            if (dragOverFolderId !== 'starred') setDragOverFolderId('starred');
          }}
          onDragLeave={() => {
            if (dragOverFolderId === 'starred') setDragOverFolderId(null);
          }}
          onDrop={handleDropOnStarred}
          className="relative"
        >
          <button
            onClick={() => handleSelectFolder('starred')}
            className={`w-full flex items-center justify-between px-6 py-2.5 rounded-r-full text-sm transition-all cursor-pointer ${
              dragOverFolderId === 'starred'
                ? 'bg-blue-100 ring-2 ring-primary text-primary font-bold scale-[1.02] shadow-sm'
                : dropSuccessFolderId === 'starred'
                  ? 'bg-emerald-100 text-emerald-800 font-bold'
                  : view === 'mail' && currentFolder === 'starred'
                    ? 'bg-surfaceActive text-blue-900 font-bold'
                    : 'text-textMuted hover:bg-[#EAEEF4] hover:text-textMain font-medium'
            }`}
          >
            <div className="flex items-center gap-4">
              <span className={view === 'mail' && currentFolder === 'starred' ? 'text-blue-900' : 'text-gray-500'}>
                <Star size={18} className={view === 'mail' && currentFolder === 'starred' ? 'fill-blue-900' : ''} />
              </span>
              <span>Starred</span>
            </div>

            {dragOverFolderId === 'starred' && (
              <span className="text-[11px] bg-primary text-white font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                <CornerDownRight size={10} />
                <span>Star</span>
              </span>
            )}
            {dropSuccessFolderId === 'starred' && (
              <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircle2 size={12} />
                <span>Starred</span>
              </span>
            )}
          </button>
        </div>

        {/* Database Folders (Inbox, Sent, Drafts, Trash, etc.) with Drop Target */}
        {folders.map(folder => {
          const isActive = view === 'mail' && currentFolder === folder.id;
          const isDragOver = dragOverFolderId === folder.id;
          const isDropSuccess = dropSuccessFolderId === folder.id;
          const icon = folderIconMap[folder.type] || folderIconMap.custom;

          return (
            <div
              key={folder.id}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                if (dragOverFolderId !== folder.id) setDragOverFolderId(folder.id);
              }}
              onDragLeave={() => {
                if (dragOverFolderId === folder.id) setDragOverFolderId(null);
              }}
              onDrop={(e) => handleDropOnFolder(e, folder.id)}
              className="relative"
            >
              <button
                onClick={() => handleSelectFolder(folder.id)}
                className={`w-full flex items-center justify-between px-6 py-2.5 rounded-r-full text-sm transition-all cursor-pointer ${
                  isDragOver
                    ? 'bg-blue-100 ring-2 ring-primary text-primary font-bold scale-[1.02] shadow-sm'
                    : isDropSuccess
                      ? 'bg-emerald-100 text-emerald-800 font-bold'
                      : isActive
                        ? 'bg-surfaceActive text-blue-900 font-bold'
                        : 'text-textMuted hover:bg-[#EAEEF4] hover:text-textMain font-medium'
                }`}
              >
                <div className="flex items-center gap-4">
                  <span className={isActive ? 'text-blue-900' : 'text-gray-500'}>
                    {icon}
                  </span>
                  <span className="capitalize">{folder.name}</span>
                </div>

                {isDragOver && (
                  <span className="text-[11px] bg-primary text-white font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                    <CornerDownRight size={10} />
                    <span>Move here</span>
                  </span>
                )}
                {isDropSuccess && (
                  <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                    <CheckCircle2 size={12} />
                    <span>Moved</span>
                  </span>
                )}
              </button>
            </div>
          );
        })}

        {/* Admin Console Section (If admin) */}
        {isAdmin && (
          <div className="pt-4 mt-2 border-t border-borderLight/60">
            <div className="px-6 text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Management
            </div>
            <button
              onClick={handleSelectAdmin}
              className={`w-full flex items-center gap-4 px-6 py-2.5 rounded-r-full text-sm transition-colors cursor-pointer ${
                view === 'admin'
                  ? 'bg-surfaceActive text-blue-900 font-bold'
                  : 'text-textMuted hover:bg-[#EAEEF4] hover:text-textMain font-medium'
              }`}
            >
              <span className={view === 'admin' ? 'text-blue-900' : 'text-gray-500'}>
                <ShieldAlert size={18} />
              </span>
              <span>Admin Console</span>
            </button>
          </div>
        )}
      </div>

      {/* Storage Limit Indicator (Gmail style) */}
      <div className="p-4 border-t border-borderLight/80 text-xs text-gray-500">
        <div className="flex items-center gap-2 mb-1.5 font-medium text-gray-600">
          <HardDrive size={14} className="text-gray-400" />
          <span>Attachment Policy</span>
        </div>
        <div className="w-full bg-gray-200 h-1 rounded-full overflow-hidden mb-1">
          <div className="bg-blue-600 h-full w-[25%]" />
        </div>
        <div className="text-[11px] text-gray-400">
          Max {maxAttachmentMb} MB per message
        </div>
      </div>
    </aside>
  );
}
