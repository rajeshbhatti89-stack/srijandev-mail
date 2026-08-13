import React, { useState } from 'react';
import { X, Send, Paperclip } from 'lucide-react';
import { useMailStore } from '../store';
import { api } from '../api';

export function ComposeModal() {
  const { isComposeOpen, setComposeOpen } = useMailStore();
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isComposeOpen) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!to || !body) return;
    
    setLoading(true);
    setError('');
    try {
      await api.sendEmail(to, subject, body);
      setComposeOpen(false);
      setTo('');
      setSubject('');
      setBody('');
    } catch (err: any) {
      setError('Failed to send email. Check configuration.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end justify-end p-8 sm:p-24 z-50">
      <div className="bg-surface border border-borderDark rounded-t-xl shadow-2xl w-full max-w-2xl flex flex-col animate-in slide-in-from-bottom-10 fade-in h-full max-h-[600px]">
        <div className="px-4 py-3 border-b border-borderDark flex justify-between items-center bg-surfaceHighlight rounded-t-xl">
          <span className="font-medium">New Message</span>
          <button 
            onClick={() => setComposeOpen(false)}
            className="text-textMuted hover:text-textMain transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSend} className="flex flex-col flex-1">
          <div className="px-4 py-2 border-b border-borderDark flex items-center">
            <span className="text-textMuted w-12">To:</span>
            <input 
              type="email" 
              value={to}
              onChange={e => setTo(e.target.value)}
              className="flex-1 bg-transparent border-none focus:outline-none" 
              required 
            />
          </div>
          <div className="px-4 py-2 border-b border-borderDark flex items-center">
            <span className="text-textMuted w-12">Subject:</span>
            <input 
              type="text" 
              value={subject}
              onChange={e => setSubject(e.target.value)}
              className="flex-1 bg-transparent border-none focus:outline-none" 
            />
          </div>
          <div className="flex-1 p-4">
            <textarea 
              value={body}
              onChange={e => setBody(e.target.value)}
              className="w-full h-full bg-transparent border-none focus:outline-none resize-none"
              placeholder="Write your message here..."
              required
            />
          </div>
          
          <div className="p-4 border-t border-borderDark flex justify-between items-center bg-surfaceHighlight">
            {error && <span className="text-red-500 text-sm">{error}</span>}
            {!error && <span />} {/* spacer */}
            
            <div className="flex items-center gap-3">
              <button type="button" className="text-textMuted hover:text-textMain p-2 transition-colors">
                <Paperclip size={20} />
              </button>
              <button 
                type="submit"
                disabled={loading}
                className="bg-primary hover:bg-blue-600 text-white font-medium px-6 py-2 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Send'}
                <Send size={16} />
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
