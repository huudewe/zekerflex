'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Briefcase, CalendarDays, LayoutDashboard, LogIn, Menu, Sparkles, UserCheck, UserRound, X } from 'lucide-react';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const closeMenu = () => setIsOpen(false);

  return (
    <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="group flex items-center gap-2" onClick={closeMenu}>
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600 text-xl font-black text-white shadow-md shadow-indigo-100 transition group-hover:scale-105">Z</div>
          <img src="/zekerflex-logo.jpeg" alt="ZekerFlex logo" className="h-10 w-10 object-contain" />
        </Link>
        <nav className="hidden items-center gap-8 text-sm font-semibold text-gray-600 md:flex">
          <Link href="/" className="flex items-center gap-1.5 hover:text-indigo-600"><Briefcase className="h-4 w-4 text-gray-400" /> Shifts Zoeken</Link>
          <Link href="/dashboard/werknemer" className="flex items-center gap-1.5 hover:text-indigo-600"><UserCheck className="h-4 w-4 text-gray-400" /> Freelancer Dashboard</Link>
          <Link href="/planning" className="flex items-center gap-1.5 hover:text-indigo-600"><CalendarDays className="h-4 w-4 text-gray-400" /> Mijn planning</Link>
          <Link href="/profiel" className="flex items-center gap-1.5 hover:text-indigo-600"><UserRound className="h-4 w-4 text-gray-400" /> Mijn profiel</Link>
          <Link href="/dashboard/opdrachtgever" className="flex items-center gap-1.5 hover:text-indigo-600"><LayoutDashboard className="h-4 w-4 text-gray-400" /> Opdrachtgever Dashboard</Link>
        </nav>
        <div className="hidden items-center gap-3 md:flex"><Link href="/login" className="flex items-center gap-1.5 px-2 text-xs font-bold text-gray-600 hover:text-indigo-600"><LogIn className="h-4 w-4" /> Inloggen</Link><Link href="/dashboard/opdrachtgever" className="flex items-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 text-xs font-bold text-white shadow-lg shadow-indigo-100 transition hover:bg-indigo-700"><Sparkles className="h-4 w-4" /> Opdrachtgever Portaal</Link></div>
        <button onClick={() => setIsOpen(!isOpen)} className="rounded-2xl border border-gray-100 p-2.5 text-gray-600 hover:bg-gray-50 md:hidden" aria-label="Menu openen">{isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}</button>
      </div>
      {isOpen && <div className="space-y-3 border-t border-gray-100 bg-white/95 px-5 pb-6 pt-4 shadow-xl md:hidden">
        <Link href="/" onClick={closeMenu} className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold text-gray-700 hover:bg-indigo-50 hover:text-indigo-600"><Briefcase className="h-5 w-5 text-indigo-500" /> Shifts Zoeken</Link>
        <Link href="/dashboard/werknemer" onClick={closeMenu} className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold text-gray-700 hover:bg-indigo-50 hover:text-indigo-600"><UserCheck className="h-5 w-5 text-emerald-500" /> Mijn Sollicitaties</Link>
        <Link href="/planning" onClick={closeMenu} className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold text-gray-700 hover:bg-indigo-50 hover:text-indigo-600"><CalendarDays className="h-5 w-5 text-indigo-500" /> Mijn planning</Link>
        <Link href="/profiel" onClick={closeMenu} className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold text-gray-700 hover:bg-indigo-50 hover:text-indigo-600"><UserRound className="h-5 w-5 text-indigo-500" /> Mijn profiel</Link>
        <Link href="/dashboard/opdrachtgever" onClick={closeMenu} className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold text-gray-700 hover:bg-indigo-50 hover:text-indigo-600"><LayoutDashboard className="h-5 w-5 text-amber-500" /> Shifts Beheren</Link>
        <Link href="/login" onClick={closeMenu} className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold text-gray-700 hover:bg-indigo-50 hover:text-indigo-600"><LogIn className="h-5 w-5 text-indigo-500" /> Inloggen</Link>
        <div className="border-t border-gray-100 pt-3"><Link href="/dashboard/opdrachtgever" onClick={closeMenu} className="block w-full rounded-2xl bg-indigo-600 py-3.5 text-center text-sm font-bold text-white">Ga naar Bedrijfsportaal</Link></div>
      </div>}
    </header>
  );
}
