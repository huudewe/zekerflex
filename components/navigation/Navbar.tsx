'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';

const workerLinks = [
  ['/dashboard/werknemer', 'Vind klussen'],
  ['/dashboard/werknemer', 'Waarom ZekerFlex'],
  ['/planning', 'Hoe ZekerFlex werkt'],
  ['/profiel', 'Jouw profiel'],
];

const companyLinks = [
  ['/dashboard/opdrachtgever', 'Vind professionals'],
  ['/dashboard/opdrachtgever', 'Shifts plaatsen'],
  ['/dashboard/opdrachtgever', 'Werkgeversdashboard'],
];

function Dropdown({ label, links }: { label: string; links: string[][] }) {
  return <details className="group relative hidden lg:block">
    <summary className="cursor-pointer list-none rounded-xl px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#17181d] hover:text-[#ff642d]">{label}<span className="ml-1 text-[#b9b8b2]">⌄</span></summary>
    <div className="absolute left-0 top-12 z-50 w-64 rounded-2xl border border-[#33343a] bg-[#f8f8f6] p-2 shadow-2xl">
      {links.map(([href, text]) => <Link key={text} href={href} className="block rounded-xl px-3 py-2 text-sm font-medium text-[#090a0f] transition hover:bg-[#ebeae5] hover:text-[#ff642d]">{text}</Link>)}
    </div>
  </details>;
}

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const closeMenu = () => setIsOpen(false);

  return <header className="sticky top-0 z-50 border-b border-[#24252a] bg-[#090a0f] text-[#f8f8f6] shadow-lg">
    <div className="mx-auto flex min-h-20 max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
      <div className="flex min-w-0 items-center gap-3 sm:gap-5">
        <Link href="/" onClick={closeMenu} aria-label="ZekerFlex home" className="shrink-0 rounded-2xl bg-[#17181d] p-2"><img src="/zekerflex-logo.jpeg" alt="ZekerFlex logo" className="h-10 w-10 rounded-lg border-2 border-white object-contain" /></Link>
        <div className="flex min-w-0 items-center gap-1 rounded-xl bg-[#17181d] p-1" aria-label="Kies profiel"><Link href="/" className="rounded-lg bg-[#f8f8f6] px-2.5 py-2 text-xs font-bold text-[#090a0f] sm:px-3">Werknemer</Link><Link href="/dashboard/opdrachtgever" className="rounded-lg px-2.5 py-2 text-xs font-bold text-white hover:bg-[#292a30] sm:px-3">Bedrijven</Link><Link href="/#about" className="rounded-lg px-2.5 py-2 text-xs font-bold text-white hover:bg-[#292a30] sm:px-3">ZekerFlex OS</Link></div>
        <nav className="hidden items-center gap-1 lg:flex"><Dropdown label="Werknemers" links={workerLinks} /><Dropdown label="Bedrijven" links={companyLinks} /><Link href="/dashboard/werknemer" className="rounded-xl px-3 py-2 text-sm font-semibold text-white hover:bg-[#17181d] hover:text-[#ff642d]">Dashboard</Link><Link href="/#about" className="rounded-xl px-3 py-2 text-sm font-semibold text-white hover:bg-[#17181d] hover:text-[#ff642d]">Over ons</Link></nav>
      </div>
      <div className="hidden items-center gap-3 lg:flex"><select aria-label="Taal kiezen" className="rounded-xl border border-[#33343a] bg-[#17181d] px-2.5 py-2 text-xs font-bold text-white"><option>NL</option><option>EN</option></select><Link href="/login" className="px-3 py-2 text-sm font-medium hover:text-[#ff642d]">Inloggen</Link><Link href="/login" className="rounded-xl border border-[#ff642d] bg-[#ff642d] px-3 py-2 text-sm font-extrabold text-[#090a0f] hover:bg-[#e85022]">Sessie starten</Link><Link href="/register" className="rounded-xl bg-[#f8f8f6] px-4 py-2.5 text-sm font-bold text-[#090a0f] hover:bg-[#b9b8b2]">Aanmelden</Link></div>
      <button type="button" onClick={() => setIsOpen(!isOpen)} className="rounded-xl border border-[#33343a] p-2.5 text-white hover:bg-[#17181d] lg:hidden" aria-label={isOpen ? 'Menu sluiten' : 'Menu openen'}>{isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}</button>
    </div>
    {isOpen && <div className="border-t border-[#24252a] bg-[#f8f8f6] px-4 pb-5 pt-3 text-[#090a0f] lg:hidden"><div className="space-y-1"><Link href="/" onClick={closeMenu} className="block rounded-xl bg-[#090a0f] px-4 py-3 text-sm font-bold text-white">Werknemer</Link><Link href="/dashboard/werknemer" onClick={closeMenu} className="block rounded-xl px-4 py-3 text-sm font-bold hover:bg-[#ebeae5]">Werknemersdashboard</Link><Link href="/meldingen" onClick={closeMenu} className="block rounded-xl px-4 py-3 text-sm font-bold hover:bg-[#ebeae5]">Meldingen</Link><Link href="/dashboard/opdrachtgever" onClick={closeMenu} className="block rounded-xl px-4 py-3 text-sm font-bold hover:bg-[#ebeae5]">Bedrijvendashboard</Link><Link href="/#about" onClick={closeMenu} className="block rounded-xl px-4 py-3 text-sm font-bold hover:bg-[#ebeae5]">ZekerFlex OS</Link>{workerLinks.map(([href, text]) => <Link key={text} href={href} onClick={closeMenu} className="block rounded-xl px-4 py-3 text-sm font-medium hover:bg-[#ebeae5]">{text}</Link>)}</div><div className="mt-3 grid grid-cols-2 gap-2 border-t border-[#deddd7] pt-3"><Link href="/login" onClick={closeMenu} className="rounded-xl bg-[#ebeae5] py-3 text-center text-sm font-bold">Inloggen</Link><Link href="/register" onClick={closeMenu} className="rounded-xl bg-[#ff642d] py-3 text-center text-sm font-extrabold">Aanmelden</Link></div><Link href="/login" onClick={closeMenu} className="mt-2 block rounded-xl bg-[#ff642d] py-3 text-center text-sm font-extrabold">Sessie starten</Link></div>}
  </header>;
}
