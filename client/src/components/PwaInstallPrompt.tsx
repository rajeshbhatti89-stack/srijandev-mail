import { useEffect, useState } from 'react';
import { Download, Share, PlusSquare, Monitor, Smartphone, X, Sparkles, CheckCircle2 } from 'lucide-react';

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [installedSuccess, setInstalledSuccess] = useState(false);

  useEffect(() => {
    // 1. Check if already installed and running as standalone PWA
    const checkStandalone = () => {
      const isStandaloneMode = 
        window.matchMedia('(display-mode: standalone)').matches || 
        (window.navigator as any).standalone === true ||
        document.referrer.includes('android-app://');

      setIsStandalone(isStandaloneMode);
      return isStandaloneMode;
    };

    if (checkStandalone()) {
      return; // Already installed, do not show
    }

    // 2. Detect platform
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/.test(userAgent);
    
    setIsIos(isIosDevice);
    setIsMobile(isMobileDevice);

    // 3. Mandatory every time until PWA is installed
    // Show prompt on page load after a slight smooth delay
    const timer = setTimeout(() => {
      if (!checkStandalone()) {
        setIsOpen(true);
      }
    }, 1200);

    // 4. Capture browser's native install prompt event (Chrome, Edge, Android)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsOpen(true);
    };

    // 5. Listen for appinstalled event
    const handleAppInstalled = () => {
      setInstalledSuccess(true);
      setIsStandalone(true);
      setTimeout(() => setIsOpen(false), 2000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // If running in standalone installed PWA mode, completely hidden
  if (isStandalone || !isOpen) {
    return null;
  }

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setInstalledSuccess(true);
        setTimeout(() => setIsOpen(false), 2000);
      }
      setDeferredPrompt(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-300">
      <div className="w-full sm:max-w-md bg-[#0A0F1E] border border-cyan-500/30 rounded-t-3xl sm:rounded-3xl shadow-[0_0_60px_rgba(0,229,255,0.25)] p-6 sm:p-8 text-white relative overflow-hidden animate-in slide-in-from-bottom-6 sm:zoom-in-95">
        {/* Top ambient glow bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

        {/* Close button */}
        <button
          onClick={() => setIsOpen(false)}
          className="absolute top-4 right-4 p-2 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          title="Dismiss for now"
        >
          <X size={18} />
        </button>

        {installedSuccess ? (
          <div className="flex flex-col items-center text-center py-6">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4 border border-emerald-500/40">
              <CheckCircle2 size={36} />
            </div>
            <h3 className="text-xl font-bold text-white mb-1">App Installed Successfully!</h3>
            <p className="text-xs text-gray-400">You can now launch SrijanDev Mail directly from your device home screen or desktop.</p>
          </div>
        ) : (
          <div>
            {/* Header with App Logo */}
            <div className="flex items-center gap-4 mb-5">
              <div className="relative">
                <div className="absolute inset-0 bg-cyan-400/20 rounded-2xl blur-lg" />
                <img 
                  src="/icon-192.png" 
                  alt="SrijanDev Mail" 
                  className="w-14 h-14 rounded-2xl object-contain relative z-10 border border-cyan-400/40 shadow-lg bg-black/40 p-1"
                />
              </div>

              <div>
                <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-cyan-400 uppercase tracking-wider mb-0.5">
                  <Sparkles size={12} />
                  <span>Official Application</span>
                </div>
                <h3 className="text-lg font-bold text-white tracking-tight">Install SrijanDev Mail</h3>
                <p className="text-xs text-gray-400">Add to your device for instant access</p>
              </div>
            </div>

            {/* Feature Highlights */}
            <div className="space-y-2.5 mb-6 text-xs text-gray-300 bg-white/5 rounded-2xl p-4 border border-white/5">
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                  {isMobile ? <Smartphone size={14} /> : <Monitor size={14} />}
                </div>
                <span>Desktop & Mobile Shortcut with official SrijanDev Logo</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                  <Download size={14} />
                </div>
                <span>Full screen standalone app without browser search bars</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                  <Sparkles size={14} />
                </div>
                <span>Instant notifications & ultra-smooth performance</span>
              </div>
            </div>

            {/* Platform-Specific Actions */}
            {isIos ? (
              /* iOS Safari Install Guide */
              <div className="bg-cyan-950/40 border border-cyan-500/30 rounded-2xl p-4 text-xs space-y-2 mb-4">
                <div className="font-semibold text-cyan-300 flex items-center gap-2">
                  <Share size={15} />
                  <span>How to install on iPhone / iPad:</span>
                </div>
                <ol className="list-decimal list-inside space-y-1.5 text-gray-300 pl-1">
                  <li>Tap the <span className="font-bold text-white">Share</span> button <span className="inline-block px-1 py-0.5 rounded bg-white/10 font-mono">⎋</span> at the bottom of Safari.</li>
                  <li>Scroll down and select <span className="font-bold text-white">"Add to Home Screen"</span> <PlusSquare size={14} className="inline ml-1 text-cyan-400" />.</li>
                  <li>Tap <span className="font-bold text-cyan-400">Add</span> at top right to place the icon on your device!</li>
                </ol>
              </div>
            ) : deferredPrompt ? (
              /* Native 1-Click Install Button (Chrome, Edge, Android) */
              <div className="space-y-3">
                <button
                  onClick={handleInstallClick}
                  className="w-full h-12 bg-gradient-to-r from-[#00E5FF] via-[#00B4D8] to-[#00E5FF] text-gray-950 font-bold rounded-2xl hover:brightness-110 shadow-[0_0_25px_rgba(0,229,255,0.4)] active:scale-[0.99] transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
                >
                  <Download size={18} />
                  <span>Install SrijanDev App</span>
                </button>
              </div>
            ) : (
              /* Desktop Manual / Generic Browser Install Guide */
              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-xs text-gray-300 text-center">
                  Click the <span className="text-cyan-400 font-bold">Install App</span> icon <Download size={13} className="inline ml-0.5" /> in your browser's address bar to add to desktop!
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-full h-11 bg-white/10 hover:bg-white/15 text-white font-medium rounded-2xl transition-colors text-sm"
                >
                  Got It
                </button>
              </div>
            )}

            {/* Later Button */}
            <div className="mt-3 text-center">
              <button
                onClick={() => setIsOpen(false)}
                className="text-xs text-gray-500 hover:text-gray-400 py-1 transition-colors"
              >
                Remind me later
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
