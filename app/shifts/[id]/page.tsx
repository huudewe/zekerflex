'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowLeft, Calendar, CheckCircle2, Euro, MapPin, ShieldCheck } from 'lucide-react';
import Navbar from '@/components/navigation/Navbar';
import Footer from '@/components/navigation/Footer';
import ApplyModal from '@/components/modals/ApplyModal';
import { createClient } from '@/lib/supabase/client';
import type { Shift } from '@/lib/types';

export default function ShiftDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [shiftId, setShiftId] = useState<string | null>(null);
  const [shift, setShift] = useState<Shift | null>(null);
  const [loading, setLoading] = useState(true);
  const [showApply, setShowApply] = useState(false);

  useEffect(() => {
    params.then(({ id }) => {
      setShiftId(id);
      createClient()
        .from('shifts')
        .select('*')
        .eq('id', id)
        .maybeSingle()
        .then(({ data }) => {
          setShift(data as Shift | null);
          setLoading(false);
        });
    });
  }, [params]);

  return <div className="flex min-h-screen flex-col bg-slate-50/60">
    <Navbar />
    <main className="mx-auto w-full max-w-5xl flex-grow px-4 py-8 sm:px-6 lg:px-8">
      <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-gray-500 transition hover:text-indigo-600"><ArrowLeft className="h-4 w-4" /> Terug naar shifts</Link>
      {loading ? <div className="h-96 animate-pulse rounded-3xl bg-white" /> : !shift ? <section className="rounded-3xl border border-gray-100 bg-white p-12 text-center"><h1 className="text-2xl font-black text-gray-900">Shift niet gevonden</h1><p className="mt-2 text-sm text-gray-500">Deze shift bestaat niet meer of is niet beschikbaar.</p><Link href="/" className="mt-6 inline-flex rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white">Bekijk andere shifts</Link></section> : <>
        <section className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
          <div className="border-b border-gray-100 bg-gradient-to-br from-indigo-50 via-white to-teal-50 px-6 py-10 sm:px-10">
            <div className="flex flex-wrap items-center gap-2"><span className="rounded-xl bg-indigo-100 px-3 py-1.5 text-xs font-bold text-indigo-700">{shift.category}</span><span className={`rounded-xl px-3 py-1.5 text-xs font-bold ${shift.status === 'open' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>{shift.status === 'open' ? 'Open' : 'Vervuld'}</span></div>
            <h1 className="mt-5 max-w-3xl text-3xl font-black tracking-tight text-gray-900 sm:text-5xl">{shift.title}</h1>
            <p className="mt-3 text-lg font-semibold text-gray-500">{shift.company}</p>
          </div>
          <div className="grid gap-8 px-6 py-8 sm:px-10 lg:grid-cols-[1fr_280px]">
            <div><h2 className="text-xl font-black text-gray-900">Over deze shift</h2><p className="mt-3 leading-7 text-gray-600">Een flexibele opdracht bij {shift.company} in {shift.location}. Bekijk de details en reageer direct als deze shift bij jou past.</p><div className="mt-8 grid gap-4 sm:grid-cols-2"><div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4"><Calendar className="h-5 w-5 text-indigo-600" /><div><span className="block text-xs font-semibold text-gray-400">Wanneer</span><span className="text-sm font-bold text-gray-800">{shift.date_display}</span></div></div><div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4"><MapPin className="h-5 w-5 text-teal-600" /><div><span className="block text-xs font-semibold text-gray-400">Locatie</span><span className="text-sm font-bold text-gray-800">{shift.location}</span></div></div></div></div>
            <aside className="rounded-2xl border border-gray-100 bg-slate-50 p-5"><div className="flex items-center gap-2 text-sm font-bold text-gray-500"><Euro className="h-5 w-5 text-indigo-600" /> Uurtarief</div><p className="mt-2 text-3xl font-black text-gray-900">€{shift.rate.toFixed(2)} <span className="text-sm font-semibold text-gray-400">/ uur</span></p><div className="my-5 border-t border-gray-200" /><div className="flex items-start gap-2 text-xs leading-5 text-gray-500"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> Transparant tarief, rechtstreeks via ZekerFlex.</div><button disabled={shift.status !== 'open'} onClick={() => setShowApply(true)} className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-100 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"><CheckCircle2 className="h-4 w-4" /> {shift.status === 'open' ? 'Direct solliciteren' : 'Shift is vervuld'}</button></aside>
          </div>
        </section>
      </>}
    </main>
    <Footer />
    {shiftId && <ApplyModal shift={showApply ? shift : null} onClose={() => setShowApply(false)} />}
  </div>;
}
