'use client';

import { Calendar, Euro, Heart, MapPin } from 'lucide-react';
import Link from 'next/link';
import { Shift } from '@/lib/types';

interface ShiftCardProps {
  shift: Shift;
  onApply: (shift: Shift) => void;
  isFavorite: boolean;
  onToggleFavorite: (shiftId: string) => void;
}

export default function ShiftCard({ shift, onApply, isFavorite, onToggleFavorite }: ShiftCardProps) {
  const isVervuld = shift.status === 'vervuld';

  return (
    <article className={`group relative flex flex-col justify-between rounded-3xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${isVervuld ? 'bg-gray-50/50 opacity-70' : ''}`}>
      <div>
        <div className="mb-4 flex items-center justify-between gap-2">
          <span className="rounded-xl border border-indigo-100/50 bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700">
            {shift.category || 'Horeca & Events'}
          </span>
          <div className="flex items-center gap-2">{isVervuld ? <span className="rounded-xl bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-600">🔒 Vervuld</span> : <span className="flex items-center gap-1.5 rounded-xl border border-emerald-100/50 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" /> Open</span>}<button type="button" onClick={() => onToggleFavorite(shift.id)} title={isFavorite ? 'Verwijder uit favorieten' : 'Bewaar als favoriet'} aria-label={isFavorite ? 'Verwijder uit favorieten' : 'Bewaar als favoriet'} className={`rounded-xl p-2 transition ${isFavorite ? 'bg-rose-50 text-rose-500' : 'bg-gray-50 text-gray-400 hover:bg-rose-50 hover:text-rose-500'}`}><Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} /></button></div>
        </div>

        <Link href={`/shifts/${shift.id}`} className="block leading-snug text-xl font-extrabold text-gray-900 transition-colors hover:text-indigo-600">{shift.title}</Link>
        <p className="mt-1 text-sm font-medium text-gray-400">{shift.company}</p>

        <div className="mt-6 space-y-2.5 border-t border-gray-50 pt-5 text-xs font-medium text-gray-600">
          <div className="flex items-center gap-2.5"><Calendar className="h-4 w-4 text-gray-400" /><span>{shift.date_display}</span></div>
          <div className="flex items-center gap-2.5"><MapPin className="h-4 w-4 text-gray-400" /><span>{shift.location}</span></div>
          <div className="flex items-center gap-2.5 pt-1 text-sm font-bold text-indigo-600"><Euro className="h-4 w-4 text-indigo-500" /><span>€{shift.rate.toFixed(2)} / uur</span></div>
        </div>
      </div>

      <div className="mt-6 border-t border-gray-100 pt-4">
        {isVervuld ? (
          <Link href={`/shifts/${shift.id}`} className="block w-full rounded-2xl bg-gray-100 py-3.5 text-center text-xs font-bold text-gray-500 transition hover:bg-gray-200">Bekijk details</Link>
        ) : (
          <div className="flex items-center gap-2"><Link href={`/shifts/${shift.id}`} className="flex-1 rounded-2xl border border-gray-200 py-3.5 text-center text-xs font-bold text-gray-600 transition hover:border-indigo-200 hover:text-indigo-600">Details</Link><button onClick={() => onApply(shift)} className="flex-[1.4] rounded-2xl bg-indigo-600 py-3.5 text-xs font-bold text-white shadow-lg shadow-indigo-100 transition hover:bg-indigo-700 active:scale-[0.98]">Direct Solliciteren</button></div>
        )}
      </div>
    </article>
  );
}
