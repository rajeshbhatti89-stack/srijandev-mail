import { useEffect, useState } from 'react';
import { useMailStore } from '../store';
import { api } from '../api';
import { format } from 'date-fns';
import { 
  Paperclip, 
  Download, 
  ArrowLeft, 
  Star, 
  Trash2, 
  Reply, 
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { parseAddress, getAvatarColor } from '../utils/formatters';

export function EmailView() {
  const { selectedEmailId, setSelectedEmailId, setComposeOpen } = useMailStore();
  const [email, setEmail] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

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

  if (!selectedEmailId) return null;

  if (loading || !email) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-gray-400 text-sm bg-surface">
        Loading message...
      </div>
    );
  }

  const parsedSender = parseAddress(email.sender);
  const avatarBg = getAvatarColor(parsedSender.email || parsedSender.name);
  const senderInitial = (parsedSender.name || parsedSender.email || 'U').charAt(0).toUpperCase();

  const handleToggleStar = async () => {
    try {
      const newStatus = !email.is_starred;
      await api.toggleStar(email.id, newStatus);
      setEmail({ ...email, is_starred: newStatus ? 1 : 0 });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async () => {
    try {
      const folders = await api.getFolders();
      const trashFolder = folders.find((f: any) => f.type === 'trash');
      if (trashFolder) {
        await api.moveEmail(email.id, trashFolder.id);
        setSelectedEmailId(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleReply = () => {
    setComposeOpen(true);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-surface select-text overflow-hidden">
      {/* Gmail Top Action Bar */}
      <div className="h-12 px-4 border-b border-borderLight flex items-center justify-between shrink-0 bg-surface">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setSelectedEmailId(null)}
            className="p-2 rounded-full hover:bg-black/5 text-gray-600 hover:text-gray-900 transition-colors"
            title="Back to inbox"
          >
            <ArrowLeft size={18} />
          </button>

          <div className="h-5 w-[1px] bg-borderLight mx-1" />

          <button 
            onClick={handleDelete}
            className="p-2 rounded-full hover:bg-black/5 text-gray-600 hover:text-red-600 transition-colors"
            title="Delete"
          >
            <Trash2 size={18} />
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button 
            onClick={handleToggleStar}
            className="p-2 rounded-full hover:bg-black/5 text-gray-500 hover:text-gmailStar transition-colors"
            title={email.is_starred ? "Starred" : "Star"}
          >
            <Star 
              size={18} 
              className={email.is_starred ? 'text-gmailStar fill-gmailStar' : ''} 
            />
          </button>
        </div>
      </div>

      {/* Message Content Scrollable View */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {/* Subject Header */}
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-2xl font-normal text-gray-900 tracking-tight break-words">
            {email.subject || '(no subject)'}
          </h1>
        </div>

        {/* Sender Info Card */}
        <div className="flex items-start justify-between border-b border-borderLight pb-4">
          <div className="flex items-start gap-3.5">
            {/* Google-style Avatar */}
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-base shadow-sm shrink-0 ${avatarBg}`}>
              {senderInitial}
            </div>

            <div>
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="font-semibold text-gray-900 text-sm">
                  {parsedSender.name || parsedSender.email}
                </span>
                <span className="text-xs text-gray-500 font-mono">
                  &lt;{parsedSender.email}&gt;
                </span>
              </div>

              {/* "to me" pill dropdown */}
              <div className="relative mt-1">
                <button 
                  onClick={() => setShowDetails(!showDetails)}
                  className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 hover:bg-black/5 px-1.5 py-0.5 rounded transition-colors"
                >
                  <span>to {email.recipient}</span>
                  {showDetails ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </button>

                {showDetails && (
                  <div className="mt-2 p-3 bg-white rounded-xl shadow-gmail-dropdown border border-borderDark/80 text-xs space-y-1.5 z-20 w-80 font-mono">
                    <div><span className="text-gray-400 font-sans">from:</span> <span className="text-gray-800">{email.sender}</span></div>
                    <div><span className="text-gray-400 font-sans">to:</span> <span className="text-gray-800">{email.recipient}</span></div>
                    <div><span className="text-gray-400 font-sans">date:</span> <span className="text-gray-800">{format(new Date(email.created_at), 'MMM d, yyyy, h:mm a')}</span></div>
                    <div><span className="text-gray-400 font-sans">subject:</span> <span className="text-gray-800">{email.subject}</span></div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="text-xs text-gray-500 whitespace-nowrap pt-1">
            {format(new Date(email.created_at), 'MMM d, yyyy, h:mm a')}
          </div>
        </div>

        {/* Attachments Section (Gmail card style) */}
        {email.attachments && email.attachments.length > 0 && (
          <div className="pt-2">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Paperclip size={14} />
              <span>{email.attachments.length} Attachment{email.attachments.length > 1 ? 's' : ''}</span>
            </div>

            <div className="flex flex-wrap gap-3">
              {email.attachments.map((att: any) => {
                const sizeMb = att.size ? (att.size / (1024 * 1024)).toFixed(2) + ' MB' : '';
                return (
                  <a
                    key={att.id}
                    href={api.getAttachmentUrl(att.id)}
                    download={att.filename}
                    className="flex items-center gap-3 bg-gray-50 hover:bg-blue-50/60 border border-borderDark/80 hover:border-blue-300 rounded-xl px-4 py-3 transition-all duration-200 group max-w-xs shadow-xs"
                  >
                    <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                      <Paperclip size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-800 truncate group-hover:text-blue-700">
                        {att.filename}
                      </div>
                      <div className="text-xs text-gray-400 font-mono">
                        {sizeMb}
                      </div>
                    </div>
                    <Download size={16} className="text-gray-400 group-hover:text-blue-700 shrink-0" />
                  </a>
                );
              })}
            </div>
          </div>
        )}

        {/* Email Body Content */}
        <div className="pt-2">
          {email.html_body ? (
            <div 
              className="email-content text-gray-800 text-sm leading-relaxed overflow-x-auto"
              dangerouslySetInnerHTML={{ __html: email.html_body }}
            />
          ) : (
            <div className="whitespace-pre-wrap text-gray-800 text-sm font-sans leading-relaxed">
              {email.text_body || ''}
            </div>
          )}
        </div>

        {/* Bottom Quick Action Buttons */}
        <div className="pt-8 border-t border-borderLight flex items-center gap-3">
          <button
            onClick={handleReply}
            className="flex items-center gap-2 px-5 py-2 rounded-full border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium transition-colors"
          >
            <Reply size={16} />
            <span>Reply</span>
          </button>
        </div>
      </div>
    </div>
  );
}
