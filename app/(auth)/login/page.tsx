'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

type AccountRole = 'werknemer' | 'opdrachtgever' | 'bureau_partner';

export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();
    const [role, setRole] = useState<AccountRole>('werknemer');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);

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
      const userRole = user?.user_metadata?.role === 'opdrachtgever' ? 'opdrachtgever' : 'werknemer';
    router.push(`/dashboard/${userRole}`);
    router.refresh();
  };

    return <main className="flex min-h-screen items-center justify-center bg-[#090a0f] p-4 text-[#090a0f] sm:p-8"><div className="grid w-full max-w-6xl overflow-hidden rounded-3xl bg-[#f8f8f6] shadow-2xl lg:grid-cols-[.9fr_1.1fr]"><section className="p-6 sm:p-10"><div className="mb-8 flex items-center justify-between"><Link href="/" aria-label="ZekerFlex home"><img src="/zekerflex-logo.jpeg" alt="ZekerFlex logo" className="h-14 w-14 rounded-xl object-contain" /></Link><select aria-label="Taal kiezen" className="rounded-xl border border-[#deddd7] bg-white px-3 py-2 text-xs font-bold text-[#5f5e59]"><option>Nederlands (NL)</option><option>English (EN)</option></select></div><h1 className="text-3xl font-black">Welkom bij ZekerFlex</h1><p className="mt-2 text-sm text-[#5f5e59]">Log in als {role === 'werknemer' ? 'werknemer' : role === 'opdrachtgever' ? 'bedrijf' : 'bureau partner'}.</p><div className="mt-7 grid grid-cols-3 gap-2" role="tablist" aria-label="Kies accounttype"><button type="button" onClick={() => setRole('werknemer')} className={`rounded-xl border-2 p-3 text-left transition ${role === 'werknemer' ? 'border-[#ff642d] bg-[#ff642d]/10' : 'border-[#deddd7] bg-white text-[#5f5e59]'}`}><span className="block text-sm font-bold">Werknemer</span><span className="mt-1 block text-xs">Shifts zoeken</span></button><button type="button" onClick={() => setRole('opdrachtgever')} className={`rounded-xl border-2 p-3 text-left transition ${role === 'opdrachtgever' ? 'border-[#ff642d] bg-[#ff642d]/10' : 'border-[#deddd7] bg-white text-[#5f5e59]'}`}><span className="block text-sm font-bold">Bedrijf</span><span className="mt-1 block text-xs">Shifts beheren</span></button><button type="button" onClick={() => setRole('bureau_partner')} className={`rounded-xl border-2 p-3 text-left transition ${role === 'bureau_partner' ? 'border-[#ff642d] bg-[#ff642d]/10' : 'border-[#deddd7] bg-white text-[#5f5e59]'}`}><span className="block text-sm font-bold">Bureau</span><span className="mt-1 block text-xs">Eigen flexpool</span></button></div><form onSubmit={handleLogin} className="mt-7 space-y-4"><label className="block text-xs font-bold uppercase tracking-wide text-[#5f5e59]">E-mailadres<input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required autoComplete="email" className="mt-1.5 w-full rounded-xl border border-[#deddd7] bg-white px-4 py-3 text-sm outline-none focus:border-[#ff642d] focus:ring-2 focus:ring-[#ff642d]/20" placeholder="bedrijf@voorbeeld.nl" /></label><label className="block text-xs font-bold uppercase tracking-wide text-[#5f5e59]">Wachtwoord<input value={password} onChange={(event) => setPassword(event.target.value)} type="password" required autoComplete="current-password" className="mt-1.5 w-full rounded-xl border border-[#deddd7] bg-white px-4 py-3 text-sm outline-none focus:border-[#ff642d] focus:ring-2 focus:ring-[#ff642d]/20" placeholder="Je wachtwoord" /></label><div className="flex items-center justify-between gap-3 text-sm text-[#5f5e59]"><label className="flex items-center gap-2"><input type="checkbox" checked={rememberMe} onChange={(event) => setRememberMe(event.target.checked)} className="h-4 w-4 accent-[#ff642d]" /> Ingelogd blijven</label><Link href="/login" className="font-semibold text-[#ff642d]">Wachtwoord vergeten?</Link></div>{error && <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}<button disabled={loading} className="w-full rounded-xl bg-[#ff642d] px-4 py-3.5 font-extrabold text-[#090a0f] transition hover:bg-[#e85022] disabled:cursor-wait disabled:opacity-60">{loading ? 'Bezig met inloggen...' : 'Inloggen'}</button></form><div className="mt-6 grid grid-cols-2 gap-2"><Link href="/dashboard/werknemer" className="rounded-xl border border-[#deddd7] bg-white px-3 py-2 text-center text-xs font-bold">Demo werknemer</Link><Link href="/dashboard/opdrachtgever" className="rounded-xl border border-[#deddd7] bg-white px-3 py-2 text-center text-xs font-bold">Demo bedrijf</Link></div><p className="mt-6 text-center text-sm text-[#5f5e59]">Nog geen account? <Link href="/register" className="font-bold text-[#ff642d] hover:text-[#e85022]">Aanmelden</Link></p></section><section className="relative hidden min-h-[680px] overflow-hidden bg-[#17181d] lg:block"><img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=1200&q=85" alt="Professional van ZekerFlex" className="absolute inset-0 h-full w-full object-cover opacity-80" /><div className="absolute inset-0 bg-gradient-to-t from-[#090a0f] via-transparent to-[#ff642d]/20" /><div className="absolute bottom-10 left-10 max-w-sm text-white"><span className="text-xs font-bold uppercase tracking-[.18em] text-[#ff642d]">Werk op jouw manier</span><h2 className="mt-3 text-4xl font-black">Jouw volgende kans begint hier.</h2><p className="mt-3 text-sm leading-relaxed text-white/75">Vind werk dat past bij jouw leven, ontwikkel jezelf en blijf in controle.</p></div></section></div></main>;
}
