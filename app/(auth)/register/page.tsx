'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type AccountRole = 'werknemer' | 'opdrachtgever';
const supabase = createClient();

export default function RegisterPage() {
  const [role, setRole] = useState<AccountRole>('werknemer');
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    const { data, error: registerError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { role, display_name: name, company_name: role === 'opdrachtgever' ? company : null },
        emailRedirectTo: `${window.location.origin}/login`,
      },
    });
    if (registerError) {
      setError(registerError.message);
      setLoading(false);
      return;
    }
    if (data.session) {
      window.location.href = role === 'opdrachtgever' ? '/dashboard/opdrachtgever' : '/dashboard/werknemer';
      return;
    }
    window.location.href = `/verify?email=${encodeURIComponent(email)}`;
  };

  return <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-12"><div className="w-full max-w-lg rounded-3xl border border-gray-100 bg-white p-8 shadow-xl"><Link href="/" className="text-2xl font-black tracking-tight text-gray-900">Zeker<span className="text-indigo-600">Flex</span></Link><h1 className="mt-10 text-3xl font-extrabold text-gray-900">Account aanmaken</h1><p className="mt-2 text-sm text-gray-500">Kies eerst welk profiel bij jou past.</p><div className="mt-6 grid grid-cols-2 gap-3"><button type="button" onClick={() => setRole('werknemer')} className={`rounded-2xl border p-4 text-left transition ${role === 'werknemer' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 bg-white text-gray-600'}`}><span className="block text-sm font-bold">Werknemer</span><span className="mt-1 block text-xs">Shifts zoeken en solliciteren</span></button><button type="button" onClick={() => setRole('opdrachtgever')} className={`rounded-2xl border p-4 text-left transition ${role === 'opdrachtgever' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 bg-white text-gray-600'}`}><span className="block text-sm font-bold">Opdrachtgever</span><span className="mt-1 block text-xs">Shifts plaatsen en kandidaten beheren</span></button></div><form onSubmit={handleRegister} className="mt-6 space-y-4"><label className="block text-xs font-bold uppercase text-gray-500">Naam<input value={name} onChange={(event) => setName(event.target.value)} required className="mt-1.5 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Voor- en achternaam" /></label>{role === 'opdrachtgever' && <label className="block text-xs font-bold uppercase text-gray-500">Bedrijfsnaam<input value={company} onChange={(event) => setCompany(event.target.value)} required className="mt-1.5 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Bedrijfsnaam" /></label>}<label className="block text-xs font-bold uppercase text-gray-500">E-mailadres<input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required autoComplete="email" className="mt-1.5 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500" placeholder="jij@voorbeeld.nl" /></label><label className="block text-xs font-bold uppercase text-gray-500">Wachtwoord<input value={password} onChange={(event) => setPassword(event.target.value)} type="password" required minLength={6} autoComplete="new-password" className="mt-1.5 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Minimaal 6 tekens" /></label>{error && <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}{message && <p role="status" className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</p>}<button disabled={loading} className="w-full rounded-xl bg-indigo-600 px-4 py-3 font-bold text-white transition hover:bg-indigo-700 disabled:cursor-wait disabled:opacity-60">{loading ? 'Account wordt aangemaakt...' : `Registreren als ${role === 'opdrachtgever' ? 'opdrachtgever' : 'werknemer'}`}</button></form><p className="mt-6 text-center text-sm text-gray-500">Al een account? <Link href="/login" className="font-bold text-indigo-600 hover:text-indigo-800">Inloggen</Link></p></div></main>;
}
