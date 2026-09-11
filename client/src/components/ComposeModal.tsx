import { useRef, useState, useEffect } from 'react';
import { 
  X, 
  Paperclip, 
  Trash2, 
  Minus, 
  AlertCircle
} from 'lucide-react';
import { useMailStore, type Contact } from '../store';
import { api } from '../api';
import { getAvatarColor } from '../utils/formatters';

interface RecipientItem {
  email: string;
  name?: string;
}

export function ComposeModal() {
  const { 
    isComposeOpen, 
    setComposeOpen, 
    contacts, 
    maxAttachmentMb, 
    rememberContact 
  } = useMailStore();

  // Recipients
  const [toList, setToList] = useState<RecipientItem[]>([]);
  const [ccList, setCcList] = useState<RecipientItem[]>([]);
  const [bccList, setBccList] = useState<RecipientItem[]>([]);

  // Show/Hide CC and BCC rows
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);

  // Active inputs
  const [toInput, setToInput] = useState('');
  const [ccInput, setCcInput] = useState('');
  const [bccInput, setBccInput] = useState('');

  // Autocomplete state
  const [activeField, setActiveField] = useState<'to' | 'cc' | 'bcc' | null>(null);
  const [suggestions, setSuggestions] = useState<Contact[]>([]);
  const [focusedSuggestionIdx, setFocusedSuggestionIdx] = useState<number>(-1);

  // Content
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [attachments, setAttachments] = useState<{ filename: string, content_type: string, content: string, size: number }[]>([]);
  
  // UI states
  const [isMinimized, setIsMinimized] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const toInputRef = useRef<HTMLInputElement>(null);

  // Calculate total attachment size
  const totalAttachmentBytes = attachments.reduce((acc, att) => acc + att.size, 0);
  const totalAttachmentMb = (totalAttachmentBytes / (1024 * 1024)).toFixed(2);
  const maxBytes = maxAttachmentMb * 1024 * 1024;

  // Autocomplete filtering
  useEffect(() => {
    let query = '';
    if (activeField === 'to') query = toInput.trim().toLowerCase();
    else if (activeField === 'cc') query = ccInput.trim().toLowerCase();
    else if (activeField === 'bcc') query = bccInput.trim().toLowerCase();

    if (!query) {
      setSuggestions([]);
      return;
    }

    const filtered = contacts.filter(c => 
      c.email.toLowerCase().includes(query) || 
      (c.name && c.name.toLowerCase().includes(query))
    ).slice(0, 5);

    setSuggestions(filtered);
    setFocusedSuggestionIdx(-1);
  }, [toInput, ccInput, bccInput, activeField, contacts]);

  if (!isComposeOpen) return null;

  const handleAddRecipient = (field: 'to' | 'cc' | 'bcc', contact: { email: string, name?: string }) => {
    const email = contact.email.trim().toLowerCase();
    if (!email || !email.includes('@')) return;

    const item: RecipientItem = {
      email,
      name: contact.name?.trim() || contact.email.split('@')[0]
    };

    if (field === 'to') {
      if (!toList.some(r => r.email.toLowerCase() === email)) {
        setToList([...toList, item]);
      }
      setToInput('');
    } else if (field === 'cc') {
      if (!ccList.some(r => r.email.toLowerCase() === email)) {
        setCcList([...ccList, item]);
      }
      setCcInput('');
    } else if (field === 'bcc') {
      if (!bccList.some(r => r.email.toLowerCase() === email)) {
        setBccList([...bccList, item]);
      }
      setBccInput('');
    }

    setSuggestions([]);
    setActiveField(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, field: 'to' | 'cc' | 'bcc') => {
    let currentInput = field === 'to' ? toInput : field === 'cc' ? ccInput : bccInput;

    if (e.key === 'ArrowDown' && suggestions.length > 0) {
      e.preventDefault();
      setFocusedSuggestionIdx(prev => (prev + 1) % suggestions.length);
      return;
    }

    if (e.key === 'ArrowUp' && suggestions.length > 0) {
      e.preventDefault();
      setFocusedSuggestionIdx(prev => (prev - 1 + suggestions.length) % suggestions.length);
      return;
    }

    if (e.key === 'Enter' || e.key === ',' || e.key === 'Tab') {
      if (focusedSuggestionIdx >= 0 && suggestions[focusedSuggestionIdx]) {
        e.preventDefault();
        handleAddRecipient(field, suggestions[focusedSuggestionIdx]);
        return;
      }

      if (currentInput.trim()) {
        e.preventDefault();
        handleAddRecipient(field, { email: currentInput.trim() });
      }
    } else if (e.key === 'Backspace' && !currentInput) {
      if (field === 'to' && toList.length > 0) {
        setToList(toList.slice(0, -1));
      } else if (field === 'cc' && ccList.length > 0) {
        setCcList(ccList.slice(0, -1));
      } else if (field === 'bcc' && bccList.length > 0) {
        setBccList(bccList.slice(0, -1));
      }
    }
  };

  const removeRecipient = (field: 'to' | 'cc' | 'bcc', index: number) => {
    if (field === 'to') setToList(toList.filter((_, i) => i !== index));
    if (field === 'cc') setCcList(ccList.filter((_, i) => i !== index));
    if (field === 'bcc') setBccList(bccList.filter((_, i) => i !== index));
  };

  // Handle files with attachment size validation (default 15MB)
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      setError('');

      // Check total size limit
      let incomingBytes = 0;
      for (const file of files) {
        incomingBytes += file.size;
      }

      if (totalAttachmentBytes + incomingBytes > maxBytes) {
        setError(`Cannot attach files. Total size exceeds the ${maxAttachmentMb} MB limit.`);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      const newAttachments = await Promise.all(
        files.map(file => {
          return new Promise<{ filename: string, content_type: string, content: string, size: number }>((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
              const result = reader.result as string;
              const base64Data = result.split(',')[1];
              resolve({
                filename: file.name,
                content_type: file.type || 'application/octet-stream',
                content: base64Data,
                size: file.size
              });
            };
            reader.onerror = reject;
          });
        })
      );

      setAttachments(prev => [...prev, ...newAttachments]);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    // Check if there are any lingering input values not yet made chips
    const finalToList = [...toList];
    if (toInput.trim() && toInput.includes('@')) {
      finalToList.push({ email: toInput.trim() });
    }

    if (finalToList.length === 0) {
      setError('Please specify at least one recipient in "To"');
      return;
    }

    const finalCcList = [...ccList];
    if (ccInput.trim() && ccInput.includes('@')) {
      finalCcList.push({ email: ccInput.trim() });
    }

    const finalBccList = [...bccList];
    if (bccInput.trim() && bccInput.includes('@')) {
      finalBccList.push({ email: bccInput.trim() });
    }

    setLoading(true);
    setError('');

    try {
      await api.sendEmail({
        to: finalToList.map(r => r.email),
        cc: finalCcList.length > 0 ? finalCcList.map(r => r.email) : undefined,
        bcc: finalBccList.length > 0 ? finalBccList.map(r => r.email) : undefined,
        subject: subject || '(No Subject)',
        body: body || '',
        attachments: attachments.length > 0 ? attachments.map(a => ({
          filename: a.filename,
          content_type: a.content_type,
          content: a.content
        })) : undefined
      });

      // Remember newly typed contacts
      for (const item of [...finalToList, ...finalCcList, ...finalBccList]) {
        rememberContact(item.email, item.name);
      }

      // Close & reset
      setComposeOpen(false);
      setToList([]);
      setCcList([]);
      setBccList([]);
      setToInput('');
      setCcInput('');
      setBccInput('');
      setSubject('');
      setBody('');
      setAttachments([]);
    } catch (err: any) {
      setError(err.message || 'Failed to send email. Check network & server config.');
    } finally {
      setLoading(false);
    }
  };

  // Render Outlook/Google style Autocomplete Popup
  const renderAutocomplete = (field: 'to' | 'cc' | 'bcc') => {
    if (activeField !== field || suggestions.length === 0) return null;

    return (
      <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-2xl shadow-gmail-dropdown border border-borderDark/80 py-2 z-50 animate-in fade-in">
        <div className="px-3 py-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
          Suggested Contacts
        </div>
        {suggestions.map((item, idx) => {
          const isFocused = idx === focusedSuggestionIdx;
          const initial = (item.name || item.email).charAt(0).toUpperCase();
          const avatarColor = getAvatarColor(item.email);

          return (
            <div
              key={item.email}
              onMouseDown={() => handleAddRecipient(field, item)}
              className={`flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors ${
                isFocused ? 'bg-blue-50' : 'hover:bg-gray-50'
              }`}
            >
              {/* Outlook / Google profile avatar */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-xs shadow-xs shrink-0 ${avatarColor}`}>
                {initial}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-gray-900 truncate">
                    {item.name || item.email.split('@')[0]}
                  </span>
                  {item.is_domain_user && (
                    <span className="text-[10px] bg-blue-100 text-blue-700 font-medium px-1.5 py-0.2 rounded-full">
                      Domain
                    </span>
                  )}
                  {item.is_admin && (
                    <span className="text-[10px] bg-purple-100 text-purple-700 font-medium px-1.5 py-0.2 rounded-full">
                      Admin
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-500 font-mono truncate">
                  {item.email}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className={`fixed z-50 transition-all duration-200 ${
      isMinimized 
        ? 'bottom-0 right-8 w-72 h-10' 
        : 'bottom-0 right-4 md:right-8 w-full md:w-[600px] h-[540px] max-h-[90vh]'
    }`}>
      <div className="bg-white rounded-t-2xl shadow-2xl border border-gray-300 flex flex-col h-full overflow-hidden">
        {/* Gmail Floating Compose Header */}
        <div className="px-4 py-2.5 bg-[#F2F6FC] border-b border-borderLight flex items-center justify-between select-none cursor-pointer"
             onClick={() => isMinimized && setIsMinimized(false)}>
          <span className="font-medium text-sm text-gray-800">
            {subject ? subject : 'New Message'}
          </span>
          <div className="flex items-center gap-1 text-gray-500">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsMinimized(!isMinimized);
              }}
              className="p-1 rounded hover:bg-black/10 transition-colors"
              title={isMinimized ? "Maximize" : "Minimize"}
            >
              <Minus size={15} />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setComposeOpen(false);
              }}
              className="p-1 rounded hover:bg-black/10 transition-colors hover:text-red-600"
              title="Close"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Compose Window Body */}
        {!isMinimized && (
          <div className="flex flex-col flex-1 min-h-0 bg-white">
            {/* Recipient Rows Container */}
            <div className="divide-y divide-borderLight text-sm">
              {/* TO ROW */}
              <div className="px-4 py-1.5 flex items-center gap-2 relative flex-wrap min-h-[42px]">
                <span className="text-gray-500 text-xs w-8 select-none font-medium">To</span>
                <div className="flex-1 flex items-center gap-1.5 flex-wrap">
                  {toList.map((r, i) => (
                    <span 
                      key={i} 
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#E8F0FE] text-blue-900 border border-blue-200 text-xs font-medium"
                    >
                      <span className="truncate max-w-[180px]">{r.name ? `${r.name} <${r.email}>` : r.email}</span>
                      <button 
                        type="button" 
                        onClick={() => removeRecipient('to', i)} 
                        className="text-blue-700 hover:text-red-500"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                  <input
                    ref={toInputRef}
                    type="text"
                    value={toInput}
                    onChange={e => setToInput(e.target.value)}
                    onFocus={() => setActiveField('to')}
                    onKeyDown={e => handleKeyDown(e, 'to')}
                    placeholder={toList.length === 0 ? "Recipients" : ""}
                    className="flex-1 min-w-[120px] bg-transparent outline-none text-sm py-1"
                  />
                </div>

                {/* CC & BCC Toggles */}
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 select-none">
                  {!showCc && (
                    <button 
                      type="button" 
                      onClick={() => setShowCc(true)} 
                      className="hover:text-primary hover:underline"
                    >
                      Cc
                    </button>
                  )}
                  {!showBcc && (
                    <button 
                      type="button" 
                      onClick={() => setShowBcc(true)} 
                      className="hover:text-primary hover:underline"
                    >
                      Bcc
                    </button>
                  )}
                </div>

                {renderAutocomplete('to')}
              </div>

              {/* CC ROW */}
              {showCc && (
                <div className="px-4 py-1.5 flex items-center gap-2 relative flex-wrap min-h-[42px] animate-in fade-in">
                  <span className="text-gray-500 text-xs w-8 select-none font-medium">Cc</span>
                  <div className="flex-1 flex items-center gap-1.5 flex-wrap">
                    {ccList.map((r, i) => (
                      <span 
                        key={i} 
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-800 border border-gray-200 text-xs font-medium"
                      >
                        <span className="truncate max-w-[180px]">{r.name ? `${r.name} <${r.email}>` : r.email}</span>
                        <button 
                          type="button" 
                          onClick={() => removeRecipient('cc', i)} 
                          className="text-gray-500 hover:text-red-500"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                    <input
                      type="text"
                      value={ccInput}
                      onChange={e => setCcInput(e.target.value)}
                      onFocus={() => setActiveField('cc')}
                      onKeyDown={e => handleKeyDown(e, 'cc')}
                      placeholder="Cc recipients"
                      className="flex-1 min-w-[120px] bg-transparent outline-none text-sm py-1"
                    />
                  </div>
                  {renderAutocomplete('cc')}
                </div>
              )}

              {/* BCC ROW */}
              {showBcc && (
                <div className="px-4 py-1.5 flex items-center gap-2 relative flex-wrap min-h-[42px] animate-in fade-in">
                  <span className="text-gray-500 text-xs w-8 select-none font-medium">Bcc</span>
                  <div className="flex-1 flex items-center gap-1.5 flex-wrap">
                    {bccList.map((r, i) => (
                      <span 
                        key={i} 
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-800 border border-gray-200 text-xs font-medium"
                      >
                        <span className="truncate max-w-[180px]">{r.name ? `${r.name} <${r.email}>` : r.email}</span>
                        <button 
                          type="button" 
                          onClick={() => removeRecipient('bcc', i)} 
                          className="text-gray-500 hover:text-red-500"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                    <input
                      type="text"
                      value={bccInput}
                      onChange={e => setBccInput(e.target.value)}
                      onFocus={() => setActiveField('bcc')}
                      onKeyDown={e => handleKeyDown(e, 'bcc')}
                      placeholder="Bcc recipients"
                      className="flex-1 min-w-[120px] bg-transparent outline-none text-sm py-1"
                    />
                  </div>
                  {renderAutocomplete('bcc')}
                </div>
              )}

              {/* SUBJECT ROW */}
              <div className="px-4 py-1 flex items-center">
                <input
                  type="text"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  placeholder="Subject"
                  className="w-full bg-transparent outline-none text-sm py-1.5 text-gray-900 font-medium placeholder:text-gray-400"
                />
              </div>
            </div>

            {/* BODY TEXTAREA */}
            <div className="flex-1 p-4 flex flex-col min-h-0">
              <textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                placeholder="Write your email here..."
                className="w-full flex-1 bg-transparent border-none outline-none resize-none text-sm text-gray-800 font-sans leading-relaxed"
              />

              {/* ATTACHMENT PREVIEW PILLS */}
              {attachments.length > 0 && (
                <div className="pt-3 border-t border-borderLight flex flex-wrap gap-2">
                  {attachments.map((att, i) => (
                    <div 
                      key={i} 
                      className="flex items-center gap-2 bg-gray-50 border border-borderDark/80 rounded-lg px-3 py-1.5 text-xs text-gray-800 shadow-xs"
                    >
                      <Paperclip size={13} className="text-primary shrink-0" />
                      <span className="truncate max-w-[150px] font-medium">{att.filename}</span>
                      <span className="text-[10px] text-gray-400 font-mono">
                        {(att.size / 1024).toFixed(0)} KB
                      </span>
                      <button 
                        type="button" 
                        onClick={() => removeAttachment(i)} 
                        className="text-gray-400 hover:text-red-500 ml-1"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ERROR MESSAGE BAR */}
            {error && (
              <div className="px-4 py-2 bg-red-50 border-t border-red-200 text-red-700 text-xs flex items-center gap-1.5">
                <AlertCircle size={14} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* BOTTOM GMAIL ACTION TOOLBAR */}
            <div className="h-14 px-4 border-t border-borderLight bg-[#F8FAFC] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                {/* Blue Pill Send Button */}
                <button
                  type="button"
                  onClick={() => handleSend()}
                  disabled={loading}
                  className="h-9 px-6 bg-primary hover:bg-primaryHover text-white text-sm font-semibold rounded-full shadow-sm hover:shadow-md transition-all flex items-center justify-center disabled:opacity-50"
                >
                  {loading ? 'Sending...' : 'Send'}
                </button>

                {/* Attachment Button */}
                <input
                  type="file"
                  multiple
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 rounded-full hover:bg-black/5 text-gray-600 hover:text-primary transition-colors relative"
                  title={`Attach files (Max ${maxAttachmentMb} MB)`}
                >
                  <Paperclip size={18} />
                </button>

                {/* Attachment Size indicator */}
                {attachments.length > 0 && (
                  <span className="text-xs text-gray-500 font-mono">
                    {totalAttachmentMb} MB / {maxAttachmentMb} MB
                  </span>
                )}
              </div>

              {/* Trash/Discard Button */}
              <button
                type="button"
                onClick={() => {
                  setComposeOpen(false);
                  setToList([]);
                  setCcList([]);
                  setBccList([]);
                  setSubject('');
                  setBody('');
                  setAttachments([]);
                }}
                className="p-2 rounded-full hover:bg-black/5 text-gray-500 hover:text-red-600 transition-colors"
                title="Discard draft"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
