'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function CopilotBubble() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Bubble */}
      <div className="fixed bottom-6 right-6 z-[9999]">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="group relative w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500 to-emerald-500 shadow-[0_0_30px_rgba(34,211,238,0.6)] hover:shadow-[0_0_40px_rgba(34,211,238,0.8)] transition-all hover:scale-110 animate-pulse"
          aria-label="Open AI Assistant"
        >
          {/* Glow rings */}
          <div className="absolute inset-0 w-16 h-16 rounded-full bg-cyan-400/30 blur-md animate-pulse"></div>
          <div className="absolute inset-0 w-16 h-16 rounded-full bg-cyan-400/20 blur-xl animate-pulse"></div>
          
          {/* Icon */}
          <div className="relative w-full h-full flex items-center justify-center p-3">
            <Image
              src="/autopilot.png"
              alt="Autopilot AI"
              fill
              className="object-contain p-2"
            />
          </div>

          {/* Notification badge (optional) */}
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg">
            !
          </div>
        </button>

        {/* Tooltip */}
        {!isOpen && (
          <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-zinc-900 border border-cyan-500/50 rounded-lg text-white text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl">
            Ask me anything
            <div className="absolute top-full right-6 w-2 h-2 bg-zinc-900 border-r border-b border-cyan-500/50 transform rotate-45 -mt-1"></div>
          </div>
        )}
      </div>

      {/* Quick Chat Overlay */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 h-[500px] bg-zinc-950/95 backdrop-blur-xl border border-cyan-500/30 rounded-2xl shadow-[0_0_50px_rgba(34,211,238,0.3)] z-[9999] flex flex-col animate-in slide-in-from-bottom-4 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-emerald-500 flex items-center justify-center shadow-lg relative overflow-hidden p-2">
                <Image
                  src="/autopilot.png"
                  alt="Autopilot"
                  fill
                  className="object-contain p-1.5"
                />
              </div>
              <div>
                <h3 className="text-white font-semibold">AUTOPILOT</h3>
                <p className="text-xs text-zinc-400">AI Copilot</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-zinc-400 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Quick Message */}
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="space-y-4">
              {/* Welcome message */}
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-emerald-500 flex items-center justify-center flex-shrink-0 relative overflow-hidden p-1.5">
                  <Image
                    src="/autopilot.png"
                    alt="AI"
                    fill
                    className="object-contain p-1"
                  />
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3 max-w-[85%]">
                  <p className="text-sm text-zinc-300">
                    Hi! I'm your AI assistant. Ask me about your vehicle maintenance, find nearby services, or get quick answers.
                  </p>
                </div>
              </div>

              {/* Emergency SOS Button */}
              <Link
                href="/emergency"
                className="block mx-11 px-4 py-4 rounded-xl bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-400 hover:to-orange-400 text-white font-bold text-center transition-all shadow-lg animate-pulse"
                onClick={() => setIsOpen(false)}
              >
                🚨 EMERGENCY SOS
              </Link>

              {/* Quick actions */}
              <div className="space-y-2 pl-11 mt-4">
                <button className="w-full text-left px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-cyan-500/50 hover:bg-zinc-800 transition-all text-sm text-zinc-300">
                  🛢️ When do I need an oil change?
                </button>
                <button className="w-full text-left px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-cyan-500/50 hover:bg-zinc-800 transition-all text-sm text-zinc-300">
                  🧼 Find me a car wash
                </button>
                <button className="w-full text-left px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-cyan-500/50 hover:bg-zinc-800 transition-all text-sm text-zinc-300">
                  💚 Check my car's health
                </button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-zinc-800">
            <Link
              href="/assistant"
              className="block w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-white text-center font-semibold hover:from-cyan-400 hover:to-emerald-400 transition-all shadow-lg shadow-cyan-500/20"
            >
              Open Full Chat →
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
