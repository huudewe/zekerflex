'use client';

import { FormEvent, useEffect, useState } from 'react';
import type { Shift } from '@/lib/types';
import Button from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';

interface ApplyModalProps {
  shift: Shift | null;
  onClose: () => void;
}

export default function ApplyModal({ shift, onClose }: ApplyModalProps) {
  const [submitted, setSubmitted] = useState(false);
  const [profile, setProfile] = useState({ name: '', email: '', phone: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (!shift) return;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      setProfile({
        name: user.user_metadata?.display_name ?? '',
        email: user.email ?? '',
        phone: user.user_metadata?.phone ?? '',
      });
    });
  }, [shift]);

  if (!shift) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-start justify-between">
          <div><h2 className="text-2xl font-extrabold">Solliciteren</h2><p className="text-sm text-gray-500">{shift.title} · {shift.company}</p></div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-900" aria-label="Sluiten">X</button>
        </div>
        {submitted ? <p className="rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-700">Je sollicitatie is verzonden.</p> : (
          <form onSubmit={async (event: FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            setError('');
            setLoading(true);
            const formData = new FormData(event.currentTarget);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { setError('Log eerst in als werknemer om te solliciteren.'); setLoading(false); return; }
            const { data: existingApplication } = await supabase.from('applications').select('id').eq('shift_id', shift.id).eq('applicant_user_id', user.id).maybeSingle();
            if (existingApplication) { setError('Je hebt al op deze shift gesolliciteerd.'); setLoading(false); return; }
            const { error: applicationError } = await supabase.from('applications').insert([{
              shift_id: shift.id,
              applicant_user_id: user.id,
              applicant_name: formData.get('name'),
              applicant_email: formData.get('email'),
              applicant_phone: formData.get('phone'),
              motivation: formData.get('motivation'),
              status: 'In behandeling',
            }]);
            if (applicationError) setError(applicationError.code === '23505' ? 'Je hebt al op deze shift gesolliciteerd.' : applicationError.message); else setSubmitted(true);
            setLoading(false);
          }} className="space-y-4">
            <input required name="name" value={profile.name} onChange={(event) => setProfile({ ...profile, name: event.target.value })} placeholder="Je naam" className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm" />
            <input required type="email" name="email" value={profile.email} onChange={(event) => setProfile({ ...profile, email: event.target.value })} placeholder="E-mailadres" className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm" />
            <input required name="phone" value={profile.phone} onChange={(event) => setProfile({ ...profile, phone: event.target.value })} placeholder="Telefoonnummer" className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm" />
            <textarea name="motivation" placeholder="Korte motivatie" rows={3} className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm" />
            {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
            <Button type="submit" disabled={loading} className="w-full">{loading ? 'Verzenden...' : 'Direct Solliciteren'}</Button>
          </form>
        )}
      </div>
    </div>
  );
}
