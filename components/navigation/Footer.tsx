import Link from 'next/link';
import { Heart, Shield, Sparkles } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-gray-800 bg-gray-900 text-sm text-gray-400">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center"><img src="/zekerflex-logo.jpeg" alt="ZekerFlex logo" className="h-10 w-10 object-contain" /></div>
            <p className="text-xs leading-relaxed">Het flexplatform voor ambitieuze freelancers en vooruitstrevende opdrachtgevers.</p>
            <div className="flex w-fit items-center gap-2 rounded-xl border border-emerald-800/40 bg-emerald-950/60 px-3 py-1.5 text-xs font-semibold text-emerald-400"><Shield className="h-4 w-4" /> 100% Geverifieerde Shifts</div>
          </div>
          <div><h4 className="mb-4 text-sm font-bold text-white">Voor Freelancers</h4><ul className="space-y-2.5 text-xs font-medium"><li><Link href="/" className="hover:text-white">Alle Shifts Bekijken</Link></li><li><Link href="/dashboard/werknemer" className="hover:text-white">Mijn Sollicitaties</Link></li><li><a href="#" className="hover:text-white">Veelgestelde Vragen</a></li></ul></div>
          <div><h4 className="mb-4 text-sm font-bold text-white">Voor Opdrachtgevers</h4><ul className="space-y-2.5 text-xs font-medium"><li><Link href="/dashboard/opdrachtgever" className="hover:text-white">Kandidaten Beheren</Link></li><li><a href="#" className="hover:text-white">Tarieven & Voorwaarden</a></li></ul></div>
          <div><h4 className="mb-4 text-sm font-bold text-white">Platform Status</h4><div className="space-y-3 rounded-2xl border border-gray-800 bg-gray-800/50 p-4 text-xs"><div className="flex justify-between"><span>Actieve Shifts</span><strong className="text-white">120+ vandaag</strong></div><div className="flex justify-between"><span>Gemiddeld Uurtarief</span><strong className="text-emerald-400">€22.50 / u</strong></div><div className="flex justify-between"><span>Match Rate</span><strong className="text-indigo-400">98.4%</strong></div></div></div>
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-gray-800/80 pt-8 text-xs text-gray-500 sm:flex-row"><p>© {new Date().getFullYear()} ZekerFlex B.V. Alle rechten voorbehouden.</p><div className="flex items-center gap-5"><a href="#" className="hover:text-gray-300">Privacy Policy</a><a href="#" className="hover:text-gray-300">Voorwaarden</a><span className="flex items-center gap-1">Gemaakt met <Heart className="h-3 w-3 text-rose-400" /></span><Sparkles className="h-4 w-4 text-indigo-400" /></div></div>
      </div>
    </footer>
  );
}
