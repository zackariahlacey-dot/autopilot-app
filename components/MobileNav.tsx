'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { haptics } from '@/lib/haptics';

export default function MobileNav() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === '/' && pathname === '/') return true;
    if (path !== '/' && pathname?.startsWith(path)) return true;
    return false;
  };

  const handleTap = () => {
    haptics.light();
  };

  const navItems = [
    {
      name: 'Explore',
      path: '/explore',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
    },
    {
      name: 'Garage',
      path: '/dashboard',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
    },
    {
      name: 'AI',
      path: '/assistant',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      ),
    },
    {
      name: 'Gold',
      path: '/membership',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      ),
    },
  ];

  return (
    <>
      {/* Mobile Bottom Navigation - Tesla/Instagram Style */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass-nav border-t border-white/10 safe-area-bottom shadow-2xl">
        <div className="grid grid-cols-4 gap-1 px-4 py-3">
          {navItems.map((item) => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                href={item.path}
                onClick={handleTap}
                className={`flex flex-col items-center justify-center py-3 px-3 rounded-xl transition-all active:scale-95 ${
                  active
                    ? 'bg-electric-blue/20 text-electric-blue shadow-lg shadow-electric-blue/20'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className={`${active ? 'scale-110' : ''} transition-transform`}>
                  {item.icon}
                </div>
                <span className={`text-xs mt-1 font-medium ${active ? 'text-cyan-400' : ''}`}>
                  {item.name}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Add bottom padding to content on mobile to account for fixed nav */}
      <div className="md:hidden h-20" />
    </>
  );
}
