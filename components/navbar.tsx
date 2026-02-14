import Link from 'next/link';
import Image from 'next/image';
import ViewSwitcherWrapper from './ViewSwitcherWrapper';
import GlobalSearchBar from './GlobalSearchBar';

export default function Navbar() {
  return (
    <nav className="glass-nav border-b border-white/10 sticky top-0 z-50">
      {/* Desktop Navigation */}
      <div className="hidden md:flex max-w-7xl mx-auto px-6 py-4 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-3 flex-shrink-0 group">
          <div className="relative w-10 h-10">
            <Image
              src="/autopilot.png"
              alt="Autopilot"
              fill
              className="object-contain group-hover:scale-110 transition-transform drop-shadow-lg"
            />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-electric-blue to-electric-cyan bg-clip-text text-transparent">
            AUTOPILOT
          </span>
        </Link>
        
        {/* Global Search Bar */}
        <div className="flex-1 max-w-2xl">
          <GlobalSearchBar />
        </div>
        
        <div className="flex items-center gap-4 flex-shrink-0">
          <Link 
            href="/explore" 
            className="text-sm font-medium text-zinc-400 hover:text-white transition-colors"
          >
            Explore
          </Link>
          <Link 
            href="/dashboard" 
            className="text-sm font-medium text-zinc-400 hover:text-white transition-colors"
          >
            Garage
          </Link>
          <Link 
            href="/assistant" 
            className="text-sm font-medium text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            AI
          </Link>
          <Link 
            href="/membership" 
            className="text-sm font-medium text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
            </svg>
            Gold
          </Link>
          
          {/* View Switcher */}
          <ViewSwitcherWrapper />
        </div>
      </div>

      {/* Mobile Header - Simplified */}
      <div className="md:hidden flex items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <div className="relative w-7 h-7">
            <Image
              src="/autopilot.png"
              alt="Autopilot"
              fill
              className="object-contain"
            />
          </div>
          <span className="text-lg font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            AUTOPILOT
          </span>
        </Link>
        <ViewSwitcherWrapper />
      </div>
    </nav>
  );
}
