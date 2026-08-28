'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building, Calendar, MapPin, Plus, Trash2, Users } from 'lucide-react';
import Footer from '@/components/navigation/Footer';
import Navbar from '@/components/navigation/Navbar';
import { createClient } from '@/lib/supabase/client';
import type { Application, Shift } from '@/lib/types';

type JoinedApplication = Application & { shifts?: Shift };

export default function OpdrachtgeverDashboard() {
  const supabase = createClient();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [applications, setApplications] = useState<JoinedApplication[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [location, setLocation] = useState('');
  const [rate, setRate] = useState('');
  const [dateDisplay, setDateDisplay] = useState('');
  const [category, setCategory] = useState('Horeca & Events');
  const router = useRouter();

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.replace('/login'); return; }
    if (user.user_metadata?.role !== 'opdrachtgever') { router.replace('/dashboard/werknemer'); return; }
    const [{ data: shiftData }, { data: applicationData }] = await Promise.all([
      supabase.from('shifts').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('applications').select('*, shifts!inner(*)').eq('shifts.user_id', user.id).order('created_at', { ascending: false }),
    ]);
    if (shiftData) setShifts(shiftData as Shift[]);
    if (applicationData) setApplications(applicationData as JoinedApplication[]);
  };

  useEffect(() => { loadData(); }, []);

  const createShift = async (event: React.FormEvent) => {
    event.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.replace('/login'); return; }
    const { error } = await supabase.from('shifts').insert([{ user_id: user.id, title, company, location, rate: Number(rate), date_display: dateDisplay, category, status: 'open' }]);
    if (error) alert(`Fout bij plaatsen shift: ${error.message}`); else { setShowCreate(false); setTitle(''); setCompany(''); setLocation(''); setRate(''); setDateDisplay(''); await loadData(); }
  };

  const deleteShift = async (id: string) => {
    if (!confirm('Weet je zeker dat je deze shift wilt verwijderen?')) return;
    const { error } = await supabase.from('shifts').delete().eq('id', id);
    if (error) alert(`Fout bij verwijderen: ${error.message}`); else loadData();
  };

  const updateApplication = async (applicationId: string, status: Application['status'], shiftId: string) => {
    if (status === 'Aangenomen') {
      const { data: claimedShift, error: shiftError } = await supabase.from('shifts').update({ status: 'vervuld' }).eq('id', shiftId).eq('status', 'open').select('id').maybeSingle();
      if (shiftError || !claimedShift) {
        alert('Deze shift is al vervuld of niet meer beschikbaar.');
        return;
      }
    }
    const { error: applicationError } = await supabase.from('applications').update({ status }).eq('id', applicationId);
    if (applicationError) {
      if (status === 'Aangenomen') await supabase.from('shifts').update({ status: 'open' }).eq('id', shiftId).eq('status', 'vervuld');
      alert(`Fout bij bijwerken sollicitatie: ${applicationError.message}`);
      return;
    }
    await loadData();
  };

  return <div className="flex min-h-screen flex-col bg-slate-50/50"><Navbar /><main className="mx-auto w-full max-w-7xl flex-grow px-4 py-10 sm:px-6 lg:px-8"><div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><div className="flex items-center gap-2 text-xs font-bold text-indigo-600"><Building className="h-4 w-4" /> Opdrachtgever Portaal</div><h1 className="mt-1 text-3xl font-black tracking-tight text-gray-900">Bedrijf Beheer</h1><p className="mt-1 text-xs font-medium text-gray-400">Plaats klussen en beheer sollicitaties.</p></div><button onClick={() => setShowCreate(true)} className="flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3.5 text-xs font-bold text-white shadow-lg shadow-indigo-100 hover:bg-indigo-700"><Plus className="h-4 w-4" /> Nieuwe Shift Plaatsen</button></div><section className="mb-12 space-y-4"><h2 className="text-xl font-extrabold text-gray-900">Geplaatste Shifts ({shifts.length})</h2>{shifts.length === 0 ? <div className="rounded-3xl border border-gray-100 bg-white p-8 text-center text-xs text-gray-400">Nog geen shifts geplaatst.</div> : <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">{shifts.map((shift) => <div key={shift.id} className="flex flex-col justify-between space-y-4 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm"><div><div className="mb-2 flex items-center justify-between"><span className="rounded-lg bg-indigo-50 px-2.5 py-1 text-[10px] font-bold text-indigo-700">{shift.category}</span><button onClick={() => deleteShift(shift.id)} className="rounded-xl p-1.5 text-gray-400 hover:bg-rose-50 hover:text-rose-600" aria-label="Shift verwijderen"><Trash2 className="h-4 w-4" /></button></div><h3 className="font-bold text-gray-900">{shift.title}</h3><p className="text-xs text-gray-400">{shift.company} · {shift.location}</p></div><div className="flex items-center justify-between border-t border-gray-50 pt-2 text-[11px] text-gray-400"><span>Status: <strong className={shift.status === 'vervuld' ? 'text-gray-600' : 'text-emerald-600'}>{shift.status}</strong></span><span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{shift.date_display}</span></div></div>)}</div>}</section><section className="space-y-4"><h2 className="text-xl font-extrabold text-gray-900">Binnengekomen Reacties ({applications.length})</h2>{applications.map((application) => <div key={application.id} className="flex flex-col justify-between gap-4 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm md:flex-row md:items-center"><div><div className="flex flex-wrap items-center gap-2"><span className="rounded-md bg-indigo-50 px-2.5 py-0.5 text-xs font-bold text-indigo-600">{application.shifts?.title}</span><span className="text-xs font-semibold text-gray-500">{application.status}</span></div><h3 className="mt-2 text-base font-bold text-gray-900">{application.applicant_name}</h3><p className="text-xs text-gray-500">{application.applicant_email} · {application.applicant_phone}</p>{application.motivation && <p className="mt-2 rounded-xl bg-slate-50 p-2.5 text-xs text-gray-600">&quot;{application.motivation}&quot;</p>}</div><div className="flex items-center gap-2"><button onClick={() => updateApplication(application.id, 'Aangenomen', application.shift_id)} className="rounded-xl bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-100">Aannemen 🟢</button><button onClick={() => updateApplication(application.id, 'Afgewezen', application.shift_id)} className="rounded-xl bg-rose-50 px-4 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100">Afwijzen 🔴</button></div></div>)}</section></main>{showCreate && <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4"><form onSubmit={createShift} className="w-full max-w-lg space-y-4 rounded-3xl bg-white p-8 shadow-2xl"><h2 className="text-2xl font-black">Nieuwe Shift Plaatsen</h2>{[['Functietitel', title, setTitle], ['Bedrijfsnaam', company, setCompany], ['Locatie', location, setLocation], ['Uurtarief', rate, setRate], ['Datum / Tijdstip', dateDisplay, setDateDisplay]].map(([label, value, setter]) => <input key={label as string} required placeholder={label as string} value={value as string} onChange={(event) => (setter as (value: string) => void)(event.target.value)} type={label === 'Uurtarief' ? 'number' : 'text'} className="w-full rounded-xl bg-gray-50 p-3 text-sm outline-none focus:ring-2 focus:ring-indigo-600" />)}<select value={category} onChange={(event) => setCategory(event.target.value)} className="w-full rounded-xl bg-gray-50 p-3 text-sm"><option>Horeca & Events</option><option>Logistiek & Magazijn</option><option>Promotie & Sales</option><option>Schoonmaak</option></select><div className="flex gap-3"><button type="button" onClick={() => setShowCreate(false)} className="w-1/2 rounded-xl bg-gray-100 py-3 font-bold">Annuleren</button><button type="submit" className="w-1/2 rounded-xl bg-indigo-600 py-3 font-bold text-white">Publiceren</button></div></form></div>}<Footer /></div>;
}
