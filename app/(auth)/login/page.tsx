'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
    if (loginError) {
      setError('Inloggen mislukt. Controleer je e-mailadres en wachtwoord.');
      setLoading(false);
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    const role = user?.user_metadata?.role === 'opdrachtgever' ? 'opdrachtgever' : 'werknemer';
    router.push(`/dashboard/${role}`);
    router.refresh();
  };

  return <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-12"><div className="w-full max-w-md rounded-3xl border border-gray-100 bg-white p-8 shadow-xl"><Link href="/" className="text-2xl font-black tracking-tight text-gray-900">Zeker<span className="text-indigo-600">Flex</span></Link><h1 className="mt-10 text-3xl font-extrabold text-gray-900">Welkom terug</h1><p className="mt-2 text-sm text-gray-500">Log in op je opdrachtgeveraccount.</p><form onSubmit={handleLogin} className="mt-8 space-y-4"><label className="block text-xs font-bold uppercase text-gray-500">E-mailadres<input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required autoComplete="email" className="mt-1.5 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500" placeholder="bedrijf@voorbeeld.nl" /></label><label className="block text-xs font-bold uppercase text-gray-500">Wachtwoord<input value={password} onChange={(event) => setPassword(event.target.value)} type="password" required autoComplete="current-password" className="mt-1.5 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Je wachtwoord" /></label>{error && <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}<button disabled={loading} className="w-full rounded-xl bg-indigo-600 px-4 py-3 font-bold text-white transition hover:bg-indigo-700 disabled:cursor-wait disabled:opacity-60">{loading ? 'Bezig met inloggen...' : 'Inloggen'}</button></form><p className="mt-6 text-center text-sm text-gray-500">Nog geen account? <Link href="/register" className="font-bold text-indigo-600 hover:text-indigo-800">Registreren</Link></p></div></main>;
}
