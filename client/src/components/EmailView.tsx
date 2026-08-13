import React, { useEffect, useState } from 'react';
import { useMailStore } from '../store';
import { api } from '../api';
import { format } from 'date-fns';
import { Paperclip, Download } from 'lucide-react';

export function EmailView() {
  const { selectedEmailId } = useMailStore();
  const [email, setEmail] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedEmailId) {
      setEmail(null);
      return;
    }
    setLoading(true);
    api.getEmail(selectedEmailId)
      .then(setEmail)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedEmailId]);

  if (!selectedEmailId) {
    return <div className="flex-1 flex items-center justify-center text-textMuted bg-background">Select an email to read</div>;
  }

  if (loading || !email) {
    return <div className="flex-1 p-8 text-textMuted bg-background">Loading...</div>;
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-y-auto">
      <div className="p-8 border-b border-borderDark shrink-0">
        <h1 className="text-2xl font-bold mb-4">{email.subject || '(No Subject)'}</h1>
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium">{email.sender}</div>
            <div className="text-sm text-textMuted">to {email.recipient}</div>
          </div>
          <div className="text-sm text-textMuted">
            {format(new Date(email.created_at), 'MMM d, yyyy, h:mm a')}
          </div>
        </div>
      </div>

      {email.attachments && email.attachments.length > 0 && (
        <div className="px-8 py-4 border-b border-borderDark flex flex-wrap gap-2 shrink-0">
          {email.attachments.map((att: any) => (
            <a 
              key={att.id}
              href={api.getAttachmentUrl(att.id)}
              download={att.filename}
              className="flex items-center gap-2 bg-surfaceHighlight border border-borderDark rounded-md px-3 py-1.5 text-sm hover:bg-borderDark transition-colors"
            >
              <Paperclip size={14} />
              <span className="truncate max-w-[200px]">{att.filename}</span>
              <Download size={14} className="text-textMuted ml-1" />
            </a>
          ))}
        </div>
      )}

      <div className="p-8 flex-1">
        {email.html_body ? (
          <div 
            className="email-content text-textMain"
            dangerouslySetInnerHTML={{ __html: email.html_body }}
          />
        ) : (
          <div className="whitespace-pre-wrap text-textMain font-mono text-sm">
            {email.text_body}
          </div>
        )}
      </div>
    </div>
  );
}
