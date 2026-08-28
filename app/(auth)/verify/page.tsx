'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function VerifyPage() {
  const supabase = createClient();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState(searchParams.get('email') ?? '');
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const verifyCode = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    const { error: verifyError } = await supabase.auth.verifyOtp({ email, token: code, type: 'signup' });
    if (verifyError) {
      setError('Deze code is ongeldig of verlopen. Vraag een nieuwe verificatiemail aan.');
      setLoading(false);
      return;
    }
    setMessage('E-mailadres bevestigd. Je kunt nu inloggen.');
    setLoading(false);
  };

  return <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-12"><div className="w-full max-w-md rounded-3xl border border-gray-100 bg-white p-8 shadow-xl"><Link href="/" className="text-2xl font-black tracking-tight text-gray-900">Zeker<span className="text-indigo-600">Flex</span></Link><h1 className="mt-10 text-3xl font-extrabold text-gray-900">E-mail bevestigen</h1><p className="mt-2 text-sm text-gray-500">Vul de code uit je verificatiemail in.</p><form onSubmit={verifyCode} className="mt-8 space-y-4"><label className="block text-xs font-bold uppercase text-gray-500">E-mailadres<input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required className="mt-1.5 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500" /></label><label className="block text-xs font-bold uppercase text-gray-500">Verificatiecode<input value={code} onChange={(event) => setCode(event.target.value)} inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required className="mt-1.5 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-center text-2xl tracking-[0.4em] outline-none focus:ring-2 focus:ring-indigo-500" placeholder="123456" /></label>{error && <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}{message && <p role="status" className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</p>}<button disabled={loading} className="w-full rounded-xl bg-indigo-600 px-4 py-3 font-bold text-white disabled:opacity-60">{loading ? 'Controleren...' : 'E-mail bevestigen'}</button></form><p className="mt-6 text-center text-sm text-gray-500">Al bevestigd? <Link href="/login" className="font-bold text-indigo-600">Inloggen</Link></p></div></main>;
}
