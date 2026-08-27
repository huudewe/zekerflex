'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowLeft, CalendarDays, Clock3, Euro, MapPin } from 'lucide-react';
import Footer from '@/components/navigation/Footer';
import Navbar from '@/components/navigation/Navbar';
import { createClient } from '@/lib/supabase/client';
import type { Application } from '@/lib/types';

const supabase = createClient();
type ScheduledApplication = Application & { shifts?: Application['shifts'] };

export default function PlanningPage() {
  const [applications, setApplications] = useState<ScheduledApplication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPlanning = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = '/login';
        return;
      }
      const { data } = await supabase.from('applications').select('*, shifts(*)').eq('applicant_user_id', user.id).eq('status', 'Aangenomen').order('created_at', { ascending: true });
      if (data) setApplications(data as ScheduledApplication[]);
      setLoading(false);
    };
    loadPlanning();
  }, []);

  return <div className="flex min-h-screen flex-col bg-slate-50/60"><Navbar /><main className="mx-auto w-full max-w-5xl flex-grow px-4 py-8 sm:px-6 lg:px-8"><Link href="/dashboard/werknemer" className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-gray-500 transition hover:text-indigo-600"><ArrowLeft className="h-4 w-4" /> Terug naar dashboard</Link><div className="mb-8"><div className="flex items-center gap-2 text-xs font-bold text-indigo-600"><CalendarDays className="h-4 w-4" /> Mijn planning</div><h1 className="mt-2 text-3xl font-black tracking-tight text-gray-900">Aangenomen shifts</h1><p className="mt-1 text-sm text-gray-500">Een helder overzicht van waar je binnenkort werkt.</p></div>{loading ? <div className="space-y-4"><div className="h-32 animate-pulse rounded-3xl bg-white" /><div className="h-32 animate-pulse rounded-3xl bg-white" /></div> : applications.length === 0 ? <section className="rounded-3xl border border-gray-100 bg-white p-12 text-center"><CalendarDays className="mx-auto h-10 w-10 text-gray-300" /><h2 className="mt-4 text-lg font-black text-gray-800">Je planning is nog leeg</h2><p className="mt-1 text-sm text-gray-500">Aangenomen shifts verschijnen hier automatisch.</p><Link href="/" className="mt-6 inline-flex rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-indigo-700">Bekijk open shifts</Link></section> : <div className="space-y-4">{applications.map((application) => { const shift = application.shifts; if (!shift) return null; return <article key={application.id} className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start"><div><span className="rounded-xl bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">Aangenomen</span><h2 className="mt-3 text-xl font-black text-gray-900">{shift.title}</h2><p className="mt-1 text-sm font-semibold text-gray-500">{shift.company}</p></div><p className="flex items-center gap-1.5 text-sm font-black text-indigo-600"><Euro className="h-4 w-4" /> €{shift.rate.toFixed(2)} / uur</p></div><div className="mt-5 grid gap-3 border-t border-gray-100 pt-4 text-sm font-semibold text-gray-600 sm:grid-cols-3"><span className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-indigo-500" /> {shift.date_display}</span><span className="flex items-center gap-2"><MapPin className="h-4 w-4 text-teal-500" /> {shift.location}</span><span className="flex items-center gap-2"><Clock3 className="h-4 w-4 text-amber-500" /> Plan details volgen</span></div><Link href={`/shifts/${shift.id}`} className="mt-5 inline-flex text-sm font-bold text-indigo-600 hover:text-indigo-800">Bekijk shiftdetails</Link></article>; })}</div>}</main><Footer /></div>;
}
