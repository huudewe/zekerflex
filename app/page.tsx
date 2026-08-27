'use client';

import { useEffect, useState } from 'react';
import { Filter, Heart, Search, ShieldCheck, Sparkles, TrendingUp, Zap } from 'lucide-react';
import Footer from '@/components/navigation/Footer';
import Navbar from '@/components/navigation/Navbar';
import ShiftCard from '@/components/cards/ShiftCard';
import ApplyModal from '@/components/modals/ApplyModal';
import { createClient } from '@/lib/supabase/client';
import type { Shift } from '@/lib/types';

const supabase = createClient();

export default function HomePage() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('alle');
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [showFavorites, setShowFavorites] = useState(false);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);

  useEffect(() => {
    const storedFavorites = window.localStorage.getItem('zekerflex-favorites');
    if (storedFavorites) setFavoriteIds(JSON.parse(storedFavorites));

    const fetchShifts = async () => {
      const { data, error } = await supabase.from('shifts').select('*').order('created_at', { ascending: false });
      if (error) console.error('Fout bij ophalen shifts:', error);
      if (data) setShifts(data as Shift[]);
      setLoading(false);
    };
    fetchShifts();
  }, []);

  const filteredShifts = shifts.filter((shift) => {
    const query = searchTerm.toLowerCase();
    const matchesSearch = [shift.title, shift.company, shift.location].some((value) => value.toLowerCase().includes(query));
    const matchesCategory = selectedCategory === 'alle' || shift.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesFavorites = !showFavorites || favoriteIds.includes(shift.id);
    return matchesSearch && matchesCategory && matchesFavorites;
  });

  const toggleFavorite = (shiftId: string) => {
    const nextFavorites = favoriteIds.includes(shiftId) ? favoriteIds.filter((id) => id !== shiftId) : [...favoriteIds, shiftId];
    setFavoriteIds(nextFavorites);
    window.localStorage.setItem('zekerflex-favorites', JSON.stringify(nextFavorites));
  };

  return <div className="home-shell flex min-h-screen flex-col bg-slate-50/50">
    <Navbar />
    <main className="flex-grow">
      <section className="home-hero border-b border-gray-100 bg-white px-4 pb-20 pt-16 sm:px-6 lg:px-8">
        <div className="hero-spotlight hero-glow-1" />
        <div className="hero-spotlight hero-glow-2" />
        <div className="hero-grid" />

        <div className="relative mx-auto max-w-5xl space-y-6 text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50/80 px-4 py-2 text-xs font-bold text-indigo-700 shadow-sm shadow-indigo-100 backdrop-blur-sm"><Sparkles className="h-4 w-4" /> Ontdek de leukste flexibele klussen</div>
          <h1 className="text-4xl font-black leading-tight tracking-tight text-gray-900 sm:text-6xl">Werken wanneer het jou uitkomt,<br className="hidden sm:inline" /> <span className="text-indigo-600">tegen jouw eigen tarief.</span></h1>
          <p className="mx-auto max-w-2xl text-base font-medium leading-relaxed text-gray-500 sm:text-lg">Kies uit shifts in Horeca, Logistiek, Sales en Events. Solliciteer direct en bouw je eigen flexibele carrière op.</p>
          <div className="mx-auto grid max-w-3xl grid-cols-2 gap-4 pt-6 md:grid-cols-4">
            {['1.500+|Ingevulde Shifts', '€23.50|Gemiddeld Uurtarief', '24 Uur|Snelle Uitbetaling', '4.9 / 5|Kandidaat Score'].map(([value, label]) => <div key={label} className="metric-card rounded-2xl border border-gray-100 bg-white/80 p-4 shadow-[0_12px_30px_rgba(79,70,229,0.06)] backdrop-blur-sm"><span className="block text-2xl font-black text-gray-900">{value}</span><span className="text-xs font-semibold text-gray-400">{label}</span></div>)}
          </div>
        </div>
      </section>

      <section className="relative z-20 mx-auto -mt-8 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="search-shell flex flex-col items-center gap-3 rounded-3xl border border-gray-100 bg-white/80 p-4 shadow-[0_25px_60px_rgba(79,70,229,0.12)] backdrop-blur-xl md:flex-row">
          <div className="relative w-full md:w-1/2">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Zoek op functie, bedrijf of stad..." className="w-full rounded-2xl bg-gray-50 py-3.5 pl-11 pr-4 text-sm font-semibold text-gray-700 outline-none transition focus:bg-white focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="flex w-full items-center gap-2 md:w-1/2">
            <Filter className="ml-2 hidden h-5 w-5 text-gray-400 sm:block" />
            <select value={selectedCategory} onChange={(event) => setSelectedCategory(event.target.value)} className="w-full rounded-2xl bg-gray-50 px-4 py-3.5 text-sm font-semibold text-gray-700 outline-none transition focus:bg-white focus:ring-2 focus:ring-indigo-500"><option value="alle">Alle Categorieën</option><option value="Horeca & Events">Horeca & Events</option><option value="Logistiek & Magazijn">Logistiek & Magazijn</option><option value="Promotie & Sales">Promotie & Sales</option><option value="Schoonmaak">Schoonmaak</option></select>
            <button type="button" onClick={() => setShowFavorites(!showFavorites)} className={`flex shrink-0 items-center gap-2 rounded-2xl px-4 py-3.5 text-xs font-bold transition ${showFavorites ? 'bg-rose-50 text-rose-600' : 'bg-gray-50 text-gray-500 hover:bg-rose-50 hover:text-rose-600'}`}><Heart className={`h-4 w-4 ${showFavorites ? 'fill-current' : ''}`} /> <span className="hidden sm:inline">Favorieten ({favoriteIds.length})</span></button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-gray-900">Beschikbare Shifts</h2>
            <p className="mt-1 text-xs font-medium text-gray-400">Reageer direct en start op korte termijn</p>
          </div>
          <span className="rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-extrabold text-indigo-700">{filteredShifts.length} openstaand</span>
        </div>
        {loading ? <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">{[1, 2, 3].map((item) => <div key={item} className="h-72 animate-pulse rounded-3xl border border-gray-100 bg-white" />)}</div> : filteredShifts.length === 0 ? <div className="mx-auto max-w-md rounded-3xl border border-gray-100 bg-white p-12 text-center"><Heart className="mx-auto h-9 w-9 text-gray-300" /><h3 className="mt-3 text-base font-bold text-gray-800">Geen shifts gevonden</h3><p className="mt-1 text-xs text-gray-500">{showFavorites ? 'Je hebt nog geen favoriete shifts opgeslagen.' : 'Probeer een andere zoekopdracht of verander je filter.'}</p></div> : <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">{filteredShifts.map((shift) => <ShiftCard key={shift.id} shift={shift} onApply={setSelectedShift} isFavorite={favoriteIds.includes(shift.id)} onToggleFavorite={toggleFavorite} />)}</div>}
      </section>

      <section className="border-t border-gray-100 bg-white px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <h2 className="text-3xl font-black tracking-tight text-gray-900">Waarom werken via ZekerFlex?</h2>
            <p className="mt-2 text-sm font-medium text-gray-500">Vrijheid gecombineerd met de zekerheid van een betrouwbaar platform.</p>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">{[[Zap, 'Direct Solliciteren', 'Geen ingewikkelde procedures of lange wachttijden.'], [ShieldCheck, 'Gegarandeerd Tarief', 'Transparante uurtarieven zonder verborgen kosten.'], [TrendingUp, 'Volledige Regie', 'Jij bepaalt waar, wanneer en hoe vaak je werkt.']].map(([Icon, title, text]) => <div key={title as string} className="feature-card space-y-4 rounded-3xl border border-gray-100 bg-slate-50 p-8"><Icon className="h-6 w-6 text-indigo-600" /><h3 className="text-lg font-bold text-gray-900">{title as string}</h3><p className="text-xs font-medium leading-relaxed text-gray-500">{text as string}</p></div>)}</div>
        </div>
      </section>
    </main>
    <Footer />
    <ApplyModal shift={selectedShift} onClose={() => setSelectedShift(null)} />
  </div>;
}
