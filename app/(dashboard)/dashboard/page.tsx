import Link from 'next/link';
import { ArrowRight, Bell, BriefcaseBusiness, Building2, UserRound } from 'lucide-react';
import Navbar from '@/components/navigation/Navbar';
import Footer from '@/components/navigation/Footer';

const portals = [
  { href: '/dashboard/werknemer', icon: UserRound, title: 'Werknemersdashboard', text: 'Bekijk je sollicitaties, planning en inkomen.', tone: 'bg-[#ff642d]' },
  { href: '/dashboard/opdrachtgever', icon: Building2, title: 'Bedrijvendashboard', text: 'Beheer shifts, kandidaten en je team.', tone: 'bg-[#13b8a6]' },
  { href: '/meldingen', icon: Bell, title: 'Meldingen', text: 'Bekijk updates over je profiel en planning.', tone: 'bg-[#8f8ce8]' },
];

export default function DashboardPage() {
  return <div className="flex min-h-screen flex-col bg-[#f8f8f6] text-[#090a0f]"><Navbar /><main className="relative flex-1 overflow-hidden px-4 py-16 sm:px-6 lg:px-8"><div className="pointer-events-none absolute -right-20 top-12 h-64 w-64 rounded-full border border-[#13b8a6]/30 [transform:rotateX(62deg)_rotateZ(24deg)] [box-shadow:0_0_0_20px_rgba(19,184,166,.06),0_0_0_42px_rgba(19,184,166,.04)]" /><div className="relative mx-auto max-w-6xl"><div className="max-w-2xl"><span className="inline-flex items-center gap-2 rounded-full border border-[#deddd7] bg-white px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#ff642d]"><BriefcaseBusiness className="h-4 w-4" /> ZekerFlex platform</span><h1 className="mt-6 text-4xl font-black tracking-tight sm:text-6xl">Kies jouw werkplek.</h1><p className="mt-4 max-w-xl text-lg leading-relaxed text-[#5f5e59]">Ga direct naar je persoonlijke dashboard, bedrijfsomgeving of actuele meldingen.</p></div><div className="mt-12 grid gap-5 md:grid-cols-3">{portals.map(({ href, icon: Icon, title, text, tone }) => <Link key={href} href={href} className="group relative overflow-hidden rounded-3xl border border-[#deddd7] bg-white p-7 shadow-sm transition hover:-translate-y-2 hover:shadow-xl"><span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${tone} text-white shadow-lg`}><Icon className="h-6 w-6" /></span><h2 className="mt-8 text-xl font-black">{title}</h2><p className="mt-2 min-h-12 text-sm leading-relaxed text-[#5f5e59]">{text}</p><span className="mt-7 inline-flex items-center gap-2 text-sm font-extrabold text-[#ff642d]">Openen <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span></Link>)}</div></div></main><Footer /></div>;
}
