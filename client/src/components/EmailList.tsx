import { useEffect, useState } from 'react';
import { 
  Star, 
  Trash2, 
  RotateCw, 
  Inbox, 
  CheckSquare, 
  Square
} from 'lucide-react';
import { useMailStore } from '../store';
import { api } from '../api';
import { parseAddress, formatGmailDate } from '../utils/formatters';

export function EmailList() {
  const { currentFolder, setSelectedEmailId, searchQuery } = useMailStore();
  const [emails, setEmails] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [folders, setFolders] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const fetchEmails = () => {
    if (!currentFolder) return;
    setLoading(true);
    
    const fetchPromise = currentFolder === 'starred' 
      ? api.getStarredEmails() 
      : api.getEmails(currentFolder, searchQuery);

    fetchPromise
      .then((data) => {
        setEmails(data || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchEmails();
    setSelectedIds(new Set());
  }, [currentFolder, searchQuery]);

  useEffect(() => {
    api.getFolders().then(setFolders).catch(console.error);
  }, []);

  const handleToggleStar = async (e: React.MouseEvent, emailId: string, currentStatus: boolean) => {
    e.stopPropagation();
    try {
      await api.toggleStar(emailId, !currentStatus);
      setEmails(prev => prev.map(m => m.id === emailId ? { ...m, is_starred: !currentStatus ? 1 : 0 } : m));
    } catch (err) {
      console.error(err);
    }
  };

  const handleTrash = async (e: React.MouseEvent, emailId: string) => {
    e.stopPropagation();
    const trashFolder = folders.find(f => f.type === 'trash');
    if (!trashFolder) return;
    try {
      await api.moveEmail(emailId, trashFolder.id);
      setEmails(prev => prev.filter(m => m.id !== emailId));
    } catch (err) {
      console.error(err);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === emails.length && emails.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(emails.map(e => e.id)));
    }
  };

  const toggleSelectOne = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkTrash = async () => {
    const trashFolder = folders.find(f => f.type === 'trash');
    if (!trashFolder || selectedIds.size === 0) return;
    try {
      await Promise.all(Array.from(selectedIds).map(id => api.moveEmail(id, trashFolder.id)));
      setEmails(prev => prev.filter(m => !selectedIds.has(m.id)));
      setSelectedIds(new Set());
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-surface select-none">
      {/* Gmail Top Action Toolbar */}
      <div className="h-12 px-4 border-b border-borderLight flex items-center justify-between shrink-0 bg-surface">
        <div className="flex items-center gap-1">
          {/* Select All Checkbox */}
          <button 
            onClick={toggleSelectAll}
            className="p-2 rounded hover:bg-black/5 text-gray-500 hover:text-gray-700 transition-colors"
            title={selectedIds.size === emails.length && emails.length > 0 ? "Deselect all" : "Select all"}
          >
            {selectedIds.size > 0 && selectedIds.size === emails.length ? (
              <CheckSquare size={18} className="text-primary" />
            ) : (
              <Square size={18} />
            )}
          </button>

          {/* Refresh button */}
          <button 
            onClick={fetchEmails}
            disabled={loading}
            className="p-2 rounded hover:bg-black/5 text-gray-500 hover:text-gray-700 transition-colors"
            title="Refresh"
          >
            <RotateCw size={17} className={loading ? 'animate-spin text-primary' : ''} />
          </button>

          {/* Bulk Action Buttons */}
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-1 ml-2 pl-2 border-l border-borderLight animate-in fade-in">
              <button 
                onClick={handleBulkTrash}
                className="p-2 rounded hover:bg-black/5 text-gray-600 hover:text-red-600 transition-colors"
                title="Delete selected"
              >
                <Trash2 size={18} />
              </button>
            </div>
          )}
        </div>

        {/* Page / Email Count */}
        <div className="text-xs text-gray-500 font-medium">
          {emails.length > 0 ? `1–${emails.length} of ${emails.length}` : '0 emails'}
        </div>
      </div>

      {/* Gmail Category Tab (Primary) */}
      <div className="flex items-center border-b border-borderLight px-2 bg-surface shrink-0">
        <button className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-primary border-b-2 border-primary relative -mb-[1px]">
          <Inbox size={18} />
          <span>Primary</span>
        </button>
      </div>

      {/* Email List Rows Container */}
      <div className="flex-1 overflow-y-auto divide-y divide-borderLight/60">
        {loading && emails.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
            <RotateCw size={20} className="animate-spin mr-2 text-primary" />
            Loading messages...
          </div>
        ) : emails.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <Inbox size={48} className="text-gray-300 stroke-[1.2] mb-3" />
            <p className="text-base font-medium text-gray-600">Your inbox is empty</p>
            <p className="text-xs text-gray-400 mt-1">Messages you receive or send will show up here.</p>
          </div>
        ) : (
          emails.map(email => {
            const isUnread = !email.read_status;
            const isSelected = selectedIds.has(email.id);
            const parsed = parseAddress(email.sender);

            return (
              <div
                key={email.id}
                onClick={() => setSelectedEmailId(email.id)}
                className={`group flex items-center px-4 py-2.5 cursor-pointer text-sm transition-colors border-l-4 ${
                  isSelected 
                    ? 'bg-[#C2DBFE]/30 border-primary' 
                    : isUnread 
                      ? 'bg-white border-transparent font-semibold' 
                      : 'bg-[#F2F6FC]/50 border-transparent text-gray-600'
                } hover:shadow-gmail hover:border-l-primary hover:bg-[#F2F6FC]`}
              >
                {/* Checkbox */}
                <div 
                  onClick={(e) => toggleSelectOne(e, email.id)}
                  className="p-1.5 rounded hover:bg-black/5 mr-1 text-gray-400 hover:text-gray-600 shrink-0"
                >
                  {isSelected ? (
                    <CheckSquare size={18} className="text-primary" />
                  ) : (
                    <Square size={18} />
                  )}
                </div>

                {/* Star Button */}
                <button
                  onClick={(e) => handleToggleStar(e, email.id, !!email.is_starred)}
                  className="p-1.5 rounded hover:bg-black/5 mr-3 text-gray-400 hover:text-gmailStar shrink-0 transition-colors"
                  title={email.is_starred ? "Starred" : "Not starred"}
                >
                  <Star 
                    size={18} 
                    className={email.is_starred ? 'text-gmailStar fill-gmailStar' : ''} 
                  />
                </button>

                {/* Sender Name Column */}
                <div className="w-48 shrink-0 truncate pr-4">
                  <span className={isUnread ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}>
                    {parsed.name || parsed.email}
                  </span>
                </div>

                {/* Subject & Snippet Preview */}
                <div className="flex-1 min-w-0 truncate pr-4 flex items-baseline">
                  <span className={isUnread ? 'font-bold text-gray-900' : 'text-gray-800'}>
                    {email.subject || '(no subject)'}
                  </span>
                  <span className="text-gray-400 mx-1.5 shrink-0">-</span>
                  <span className="text-gray-500 font-normal truncate">
                    {email.text_body ? email.text_body.replace(/\s+/g, ' ').substring(0, 90) : 'No preview text'}
                  </span>
                </div>

                {/* Date / Hover Actions Column */}
                <div className="shrink-0 flex items-center justify-end w-28 text-right">
                  {/* Normal Date (hidden on row hover) */}
                  <span className={`text-xs group-hover:hidden ${isUnread ? 'font-bold text-gray-900' : 'text-gray-500'}`}>
                    {formatGmailDate(email.created_at)}
                  </span>

                  {/* Quick Action Icons on Hover */}
                  <div className="hidden group-hover:flex items-center gap-1">
                    <button
                      onClick={(e) => handleTrash(e, email.id)}
                      className="p-1.5 rounded-full hover:bg-gray-200 text-gray-500 hover:text-red-600 transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
