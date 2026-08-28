'use client';

import { useState } from 'react';
import { Bell, Check, Trash2 } from 'lucide-react';
import Navbar from '@/components/navigation/Navbar';
import Footer from '@/components/navigation/Footer';

type Notification = { id: number; title: string; text: string; read: boolean };

const defaults: Notification[] = [
  { id: 1, title: 'Profiel bijna compleet', text: 'Vul je profiel aan voor betere matches.', read: false },
  { id: 2, title: 'Plan je werkweek', text: 'Zet je volgende afspraak in je agenda.', read: false },
];

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    if (typeof window === 'undefined') return defaults;
    try {
      const stored = localStorage.getItem('zf_notifications');
      return stored ? JSON.parse(stored) : defaults;
    } catch {
      return defaults;
    }
  });

  const save = (next: Notification[]) => {
    setNotifications(next);
    localStorage.setItem('zf_notifications', JSON.stringify(next));
  };

  return <div className="flex min-h-screen flex-col bg-[#f8f8f6]"><Navbar /><main className="mx-auto w-full max-w-4xl flex-1 px-4 py-12 sm:px-6 lg:px-8"><div className="mb-8 flex items-start justify-between gap-4"><div><span className="text-xs font-bold uppercase tracking-wider text-[#ff642d]">Actueel</span><h1 className="mt-2 text-4xl font-black text-[#090a0f]">Meldingen</h1><p className="mt-2 text-sm text-[#5f5e59]">Openstaande updates over je profiel, planning en shifts.</p></div><button type="button" onClick={() => save([])} className="flex items-center gap-2 rounded-xl border border-[#deddd7] bg-white px-4 py-2 text-sm font-bold text-[#5f5e59] hover:text-[#ff642d]"><Trash2 className="h-4 w-4" /> Alles wissen</button></div>{notifications.length ? <div className="space-y-3">{notifications.map((notification) => <article key={notification.id} className={`flex items-start justify-between gap-4 border p-5 shadow-sm ${notification.read ? 'border-[#deddd7] bg-white opacity-70' : 'border-[#ff642d]/40 bg-[#fff7f3]'}`}><div className="flex gap-4"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#ff642d] text-[#090a0f]"><Bell className="h-5 w-5" /></span><div><span className="text-xs font-bold uppercase tracking-wide text-[#ff642d]">{notification.read ? 'Gelezen' : 'Nieuw'}</span><h2 className="mt-1 text-lg font-black text-[#090a0f]">{notification.title}</h2><p className="mt-1 text-sm text-[#5f5e59]">{notification.text}</p></div></div>{!notification.read && <button type="button" onClick={() => save(notifications.map((item) => item.id === notification.id ? { ...item, read: true } : item))} className="flex items-center gap-1 text-xs font-bold text-[#ff642d]"><Check className="h-4 w-4" /> Gelezen</button>}</article>)}</div> : <div className="border border-[#deddd7] bg-white p-12 text-center text-sm text-[#5f5e59]">Geen nieuwe meldingen.</div>}</main><Footer /></div>;
}
