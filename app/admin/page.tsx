'use client';

import { useEffect, useState } from 'react';
import { createClient } from '../../lib/supabase/client';
import type { Application, Shift } from '../../lib/types';

const supabase = createClient();

export default function AdminPage() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  useEffect(() => {
    let active = true;
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const role = userData.user?.app_metadata?.role || userData.user?.user_metadata?.role;
      if (role !== 'admin') {
        if (active) { setMessage('Geen admin-toegang.'); setLoading(false); }
        return;
      }
      const [{ data: shiftData, error: shiftError }, { data: applicationData, error: applicationError }] = await Promise.all([
        supabase.from('shifts').select('*').order('created_at', { ascending: false }),
        supabase.from('applications').select('*, shifts(*)').order('created_at', { ascending: false })
      ]);
      if (!active) return;
      if (shiftError || applicationError) setMessage(shiftError?.message || applicationError?.message || 'Data laden mislukt.');
      setShifts((shiftData as Shift[]) || []);
      setApplications((applicationData as Application[]) || []);
      setLoading(false);
    };
    load();
    const channel = supabase.channel('admin-live').on('postgres_changes', { event: '*', schema: 'public', table: 'shifts' }, load).on('postgres_changes', { event: '*', schema: 'public', table: 'applications' }, load).subscribe();
    return () => { active = false; supabase.removeChannel(channel); };
  }, [supabase]);

  const updateApplication = async (id: string, status: Application['status']) => {
    const { error } = await supabase.from('applications').update({ status }).eq('id', id);
    setMessage(error ? error.message : `Aanmelding bijgewerkt: ${status}.`);
  };
  const updateShift = async (id: string, status: Shift['status']) => {
    const { error } = await supabase.from('shifts').update({ status }).eq('id', id);
    setMessage(error ? error.message : `Klus bijgewerkt: ${status}.`);
  };

  if (loading) return <main className="mx-auto max-w-6xl p-8">Admingegevens laden...</main>;
  if (message === 'Geen admin-toegang.') return <main className="mx-auto max-w-6xl p-8"><h1 className="text-3xl font-bold">Geen toegang</h1><p className="mt-2 text-slate-600">Log in met een account met de adminrol.</p></main>;
  return <main className="mx-auto max-w-6xl space-y-8 p-6 md:p-10"><header><p className="text-sm font-bold uppercase tracking-widest text-teal-700">Live beheer</p><h1 className="mt-2 text-4xl font-bold text-slate-900">ZekerFlex Admin</h1><p className="mt-2 text-slate-600">Verbonden met Supabase. Wijzigingen worden realtime bijgewerkt.</p>{message && <p className="mt-4 rounded-lg border border-teal-200 bg-teal-50 p-3 text-teal-800">{message}</p>}</header><section className="grid gap-4 md:grid-cols-3"><Metric label="Open klussen" value={shifts.filter((shift) => shift.status === 'open').length} /><Metric label="Totaal klussen" value={shifts.length} /><Metric label="Aanmeldingen" value={applications.length} /></section><section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-xl font-bold">Klussenbeheer</h2><div className="mt-4 grid gap-3 md:grid-cols-2">{shifts.map((shift) => <article className="rounded-lg border border-slate-200 p-4" key={shift.id}><h3 className="font-bold">{shift.title}</h3><p className="text-sm text-slate-600">{shift.company} · {shift.location} · {shift.status}</p><button className="mt-3 rounded-md bg-teal-700 px-3 py-2 text-sm font-bold text-white" onClick={() => updateShift(shift.id, shift.status === 'open' ? 'geannuleerd' : 'open')}>{shift.status === 'open' ? 'Klus annuleren' : 'Klus openen'}</button></article>)}</div></section><section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-xl font-bold">Aanmeldingenbeheer</h2><div className="mt-4 space-y-3">{applications.map((application) => <article className="flex flex-col justify-between gap-3 rounded-lg border border-slate-200 p-4 md:flex-row md:items-center" key={application.id}><div><h3 className="font-bold">{application.applicant_name}</h3><p className="text-sm text-slate-600">{application.shifts?.title || application.shift_id} · {application.status}</p></div><div className="flex gap-2"><button className="rounded-md bg-emerald-700 px-3 py-2 text-sm font-bold text-white" onClick={() => updateApplication(application.id, 'Aangenomen')}>Aannemen</button><button className="rounded-md border border-rose-300 px-3 py-2 text-sm font-bold text-rose-700" onClick={() => updateApplication(application.id, 'Afgewezen')}>Afwijzen</button></div></article>)}</div></section></main>;
}

function Metric({ label, value }: { label: string; value: number }) { return <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">{label}</p><strong className="mt-2 block text-3xl text-slate-900">{value}</strong></div>; }
