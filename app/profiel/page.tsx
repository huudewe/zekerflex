'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle2, MapPin, Save, UserRound } from 'lucide-react';
import Footer from '@/components/navigation/Footer';
import Navbar from '@/components/navigation/Navbar';
import { createClient } from '@/lib/supabase/client';

export default function ProfilePage() {
  const supabase = createClient();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [rate, setRate] = useState('');
  const [skills, setSkills] = useState('');
  const [availability, setAvailability] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        window.location.href = '/login';
        return;
      }
      const metadata = user.user_metadata ?? {};
      setName(metadata.display_name ?? '');
      setPhone(metadata.phone ?? '');
      setCity(metadata.city ?? '');
      setRate(metadata.preferred_rate ? String(metadata.preferred_rate) : '');
      setSkills(metadata.skills ?? '');
      setAvailability(metadata.availability ?? '');
      setLoading(false);
    });
  }, []);

  const saveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');
    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        display_name: name,
        phone,
        city,
        preferred_rate: rate ? Number(rate) : null,
        skills,
        availability,
      },
    });
    if (updateError) setError(updateError.message);
    else setMessage('Je profiel is opgeslagen.');
    setSaving(false);
  };

  return <div className="flex min-h-screen flex-col bg-slate-50/60"><Navbar /><main className="mx-auto w-full max-w-3xl flex-grow px-4 py-8 sm:px-6 lg:px-8"><Link href="/dashboard/werknemer" className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-gray-500 transition hover:text-indigo-600"><ArrowLeft className="h-4 w-4" /> Terug naar dashboard</Link><div className="mb-8"><div className="flex items-center gap-2 text-xs font-bold text-indigo-600"><UserRound className="h-4 w-4" /> Mijn profiel</div><h1 className="mt-2 text-3xl font-black tracking-tight text-gray-900">Maak jezelf vindbaar</h1><p className="mt-1 text-sm text-gray-500">Opdrachtgevers zien zo beter of een shift bij jou past.</p></div>{loading ? <div className="h-96 animate-pulse rounded-3xl bg-white" /> : <form onSubmit={saveProfile} className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8"><div className="grid gap-5 sm:grid-cols-2"><label className="text-xs font-bold uppercase tracking-wide text-gray-500 sm:col-span-2">Naam<input value={name} onChange={(event) => setName(event.target.value)} required className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium normal-case tracking-normal text-gray-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" /></label><label className="text-xs font-bold uppercase tracking-wide text-gray-500">Telefoonnummer<input value={phone} onChange={(event) => setPhone(event.target.value)} type="tel" placeholder="Bijv. 06 12345678" className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium normal-case tracking-normal text-gray-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" /></label><label className="text-xs font-bold uppercase tracking-wide text-gray-500"><span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> Woonplaats</span><input value={city} onChange={(event) => setCity(event.target.value)} placeholder="Bijv. Utrecht" className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium normal-case tracking-normal text-gray-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" /></label><label className="text-xs font-bold uppercase tracking-wide text-gray-500">Minimum uurtarief<input value={rate} onChange={(event) => setRate(event.target.value)} type="number" min="0" step="0.50" placeholder="Bijv. 18.50" className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium normal-case tracking-normal text-gray-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" /></label><label className="text-xs font-bold uppercase tracking-wide text-gray-500 sm:col-span-2">Vaardigheden<input value={skills} onChange={(event) => setSkills(event.target.value)} placeholder="Bijv. horeca, kassa, heftruckcertificaat" className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium normal-case tracking-normal text-gray-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" /></label><label className="text-xs font-bold uppercase tracking-wide text-gray-500 sm:col-span-2">Beschikbaarheid<textarea value={availability} onChange={(event) => setAvailability(event.target.value)} placeholder="Bijv. doordeweeks na 16:00 en in het weekend" rows={4} className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium normal-case tracking-normal text-gray-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" /></label></div>{message && <p className="mt-5 flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-700"><CheckCircle2 className="h-4 w-4" /> {message}</p>}{error && <p role="alert" className="mt-5 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}<button type="submit" disabled={saving} className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-100 transition hover:bg-indigo-700 disabled:cursor-wait disabled:opacity-60"><Save className="h-4 w-4" /> {saving ? 'Opslaan...' : 'Profiel opslaan'}</button></form>}</main><Footer /></div>;
}
