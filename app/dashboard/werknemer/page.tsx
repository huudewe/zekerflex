'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, CheckCircle2, Clock, Euro, MapPin, UserCheck } from 'lucide-react';
import Footer from '@/components/navigation/Footer';
import Navbar from '@/components/navigation/Navbar';
import { createClient } from '@/lib/supabase/client';
import type { Application } from '@/lib/types';

const supabase = createClient();

type ApplicationWithShift = Application & { shifts?: Application['shifts'] };

export default function WerknemerDashboard() {
  const [applications, setApplications] = useState<ApplicationWithShift[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const loadApplications = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace('/login'); return; }
      if (user.user_metadata?.role === 'opdrachtgever') { router.replace('/dashboard/opdrachtgever'); return; }
      const { data, error } = await supabase.from('applications').select('*, shifts(*)').eq('applicant_user_id', user.id).order('created_at', { ascending: false });
      if (error) console.error('Fout bij ophalen sollicitaties:', error);
      if (data) setApplications(data as ApplicationWithShift[]);
      setLoading(false);
    };
    loadApplications();
  }, []);

  const accepted = applications.filter((application) => application.status === 'Aangenomen');
  const income = accepted.reduce((sum, application) => sum + (application.shifts?.rate ?? 0) * 8, 0);

  return <div className="flex min-h-screen flex-col bg-slate-50/50"><Navbar /><main className="mx-auto w-full max-w-7xl flex-grow px-4 py-10 sm:px-6 lg:px-8"><div className="mb-8"><div className="flex items-center gap-2 text-xs font-bold text-indigo-600"><UserCheck className="h-4 w-4" /> Freelancer Portaal</div><h1 className="mt-1 text-3xl font-black tracking-tight text-gray-900">Mijn Sollicitaties</h1><p className="mt-1 text-xs font-medium text-gray-400">Overzicht van al je reacties op shifts.</p></div><div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-3">{[[Clock, applications.length, 'Totaal Gereageerd'], [CheckCircle2, accepted.length, 'Aangenomen Shifts'], [Euro, `€${income.toFixed(2)}`, 'Geschat Inkomen']].map(([Icon, value, label]) => <div key={label as string} className="flex items-center gap-4 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm"><Icon className="h-6 w-6 text-indigo-600" /><div><span className="block text-2xl font-black text-gray-900">{value as string | number}</span><span className="text-xs font-semibold text-gray-400">{label as string}</span></div></div>)}</div><h2 className="mb-4 text-lg font-extrabold text-gray-900">Sollicitatie Historie</h2>{loading ? <div className="rounded-3xl bg-white p-8 text-center text-xs text-gray-400">Laden...</div> : applications.length === 0 ? <div className="rounded-3xl border border-gray-100 bg-white p-12 text-center"><span className="text-4xl">📥</span><h3 className="mt-2 font-bold">Nog geen sollicitaties</h3></div> : <div className="space-y-4">{applications.map((application) => <div key={application.id} className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm"><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">{application.status || 'In behandeling'}</span><span className="text-xs text-gray-400">{application.applicant_name}</span></div><h3 className="mt-2 text-lg font-bold text-gray-900">{application.shifts?.title || 'Shift'}</h3><p className="text-xs font-semibold text-gray-500">{application.shifts?.company}</p><div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-500"><span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {application.shifts?.date_display}</span><span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {application.shifts?.location}</span><span className="flex items-center gap-1 font-bold text-indigo-600"><Euro className="h-3.5 w-3.5" /> €{application.shifts?.rate?.toFixed(2)} / u</span></div></div>)}</div>}</main><Footer /></div>;
}
