import React, { useEffect, useState } from 'react';
import { useMailStore } from '../store';
import { api } from '../api';
import { formatDistanceToNow } from 'date-fns';

export function EmailList() {
  const { currentFolder, selectedEmailId, setSelectedEmailId } = useMailStore();
  const [emails, setEmails] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!currentFolder) return;
    setLoading(true);
    api.getEmails(currentFolder)
      .then(setEmails)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [currentFolder]);

  if (loading) {
    return <div className="flex-1 border-r border-borderDark p-4 text-textMuted">Loading...</div>;
  }

  if (emails.length === 0) {
    return <div className="flex-1 border-r border-borderDark p-4 text-textMuted flex items-center justify-center">No emails here.</div>;
  }

  return (
    <div className="w-80 border-r border-borderDark flex flex-col h-full bg-background overflow-y-auto">
      {emails.map(email => (
        <button
          key={email.id}
          onClick={() => setSelectedEmailId(email.id)}
          className={`text-left p-4 border-b border-borderDark hover:bg-surfaceHighlight transition-colors ${
            selectedEmailId === email.id ? 'bg-surfaceHighlight border-l-2 border-l-primary' : 'border-l-2 border-l-transparent'
          }`}
        >
          <div className="flex justify-between items-baseline mb-1">
            <span className={`font-medium truncate pr-2 ${email.read_status ? 'text-textMuted' : 'text-textMain'}`}>
              {email.sender.split('<')[0] || email.sender}
            </span>
            <span className="text-xs text-textMuted whitespace-nowrap">
              {formatDistanceToNow(new Date(email.created_at), { addSuffix: true })}
            </span>
          </div>
          <div className={`text-sm truncate mb-1 ${email.read_status ? 'text-textMuted' : 'text-textMain font-medium'}`}>
            {email.subject || '(No Subject)'}
          </div>
          <div className="text-xs text-textMuted truncate">
            {email.text_body ? email.text_body.substring(0, 50) : '...'}
          </div>
        </button>
      ))}
    </div>
  );
}
