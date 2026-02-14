'use client';

import { useState, useEffect } from 'react';
import { haptics } from '@/lib/haptics';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Listen for the beforeinstallprompt event
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      // Only show on mobile
      const isMobile = window.innerWidth < 768;
      if (isMobile) {
        // Delay showing prompt by 3 seconds
        setTimeout(() => {
          setShowPrompt(true);
        }, 3000);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    haptics.medium();

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user's response
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      haptics.success();
      setShowPrompt(false);
    } else {
      haptics.light();
    }

    // Clear the deferred prompt
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    haptics.light();
    setShowPrompt(false);
    
    // Don't show again for 7 days
    localStorage.setItem('autopilot-install-dismissed', Date.now().toString());
  };

  // Don't show if installed or dismissed recently
  useEffect(() => {
    const dismissed = localStorage.getItem('autopilot-install-dismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed);
      const daysSince = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);
      if (daysSince < 7) {
        setShowPrompt(false);
      }
    }
  }, []);

  if (!showPrompt || isInstalled) return null;

  return (
    <div className="fixed bottom-24 md:bottom-6 left-4 right-4 z-[100] animate-in slide-in-from-bottom-4 duration-500">
      <div className="relative overflow-hidden rounded-2xl border-2 border-cyan-500/50 bg-gradient-to-br from-zinc-950 to-zinc-900 p-4 shadow-2xl shadow-cyan-500/20 backdrop-blur-xl">
        {/* Animated glow */}
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-transparent to-emerald-500/10 animate-pulse" />
        
        <div className="relative z-10 flex items-start gap-4">
          {/* Icon */}
          <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-emerald-500 flex items-center justify-center shadow-lg">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-white mb-1">
              Add Autopilot to Home Screen
            </h3>
            <p className="text-xs text-zinc-400 mb-3">
              One-tap access to car care, AI assistance, and emergency SOS
            </p>

            <div className="flex gap-2">
              <button
                onClick={handleInstall}
                className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-white text-sm font-bold transition-all active:scale-95 shadow-lg"
              >
                Install App
              </button>
              <button
                onClick={handleDismiss}
                className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium transition-all active:scale-95"
              >
                Later
              </button>
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 w-8 h-8 rounded-lg hover:bg-zinc-800 flex items-center justify-center text-zinc-500 hover:text-white transition-colors active:scale-95"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
