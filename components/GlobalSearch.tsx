'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function GlobalSearch() {
  const [query, setQuery] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    // Natural language processing (mock)
    const lowerQuery = query.toLowerCase();
    let searchTerm = query;
    let category = '';

    // Extract intent from natural language
    if (lowerQuery.includes('oil change') || lowerQuery.includes('oil') || lowerQuery.includes('lube')) {
      category = 'oil_change';
      searchTerm = 'oil change';
    } else if (lowerQuery.includes('wash') || lowerQuery.includes('detail') || lowerQuery.includes('clean')) {
      category = 'detailing';
      searchTerm = 'wash';
    } else if (lowerQuery.includes('tire') || lowerQuery.includes('rotation') || lowerQuery.includes('balance')) {
      category = 'tire_shop';
      searchTerm = 'tire';
    } else if (lowerQuery.includes('brake') || lowerQuery.includes('pad') || lowerQuery.includes('rotor')) {
      category = 'mechanic';
      searchTerm = 'brake';
    } else if (lowerQuery.includes('repair') || lowerQuery.includes('mechanic') || lowerQuery.includes('fix')) {
      category = 'mechanic';
      searchTerm = 'mechanic';
    } else if (lowerQuery.includes('glass') || lowerQuery.includes('windshield') || lowerQuery.includes('window')) {
      category = 'glass_repair';
      searchTerm = 'glass';
    } else if (lowerQuery.includes('body') || lowerQuery.includes('paint') || lowerQuery.includes('dent') || lowerQuery.includes('collision')) {
      category = 'body_shop';
      searchTerm = 'body';
    }

    // Redirect to explore page with search params
    router.push(`/explore?search=${encodeURIComponent(searchTerm)}`);
  };

  return (
    <form onSubmit={handleSearch} className="relative max-w-3xl mx-auto">
      <div className="absolute left-6 top-1/2 -translate-y-1/2 pointer-events-none">
        <svg className="w-6 h-6 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Try: 'I need an oil change' or 'Where can I get my tires rotated?'"
        className="w-full pl-16 pr-32 py-6 rounded-2xl bg-zinc-900/80 backdrop-blur-xl border-2 border-zinc-800 text-white text-lg placeholder-zinc-500 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 outline-none transition shadow-2xl"
      />
      <button
        type="submit"
        disabled={!query.trim()}
        className="absolute right-3 top-1/2 -translate-y-1/2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold hover:from-emerald-400 hover:to-cyan-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
      >
        Search
      </button>
    </form>
  );
}
