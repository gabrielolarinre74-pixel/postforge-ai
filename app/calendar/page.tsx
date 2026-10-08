'use client';

import { useMemo, useState } from 'react';
import clsx from 'clsx';
import { CalendarArrowDown, ChevronLeft, ChevronRight, FileSpreadsheet, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { Header } from '@/components/Header';
import { Btn } from '@/components/Modal';
import { PlatformBadge } from '@/components/PostPreview';
import { postsOn, sameDay, toCSV, toICS, weekOf } from '@/lib/calendar';
import { PLATFORMS } from '@/lib/platforms';
import { usePosts } from '@/lib/store';

function download(name: string, content: string, type: string) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([content], { type }));
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

export default function CalendarPage() {
  const [posts, setPosts] = usePosts();
  const [anchor, setAnchor] = useState(() => new Date());
  const week = useMemo(() => weekOf(anchor), [anchor]);
  const today = new Date();
  const scheduled = posts.filter((p) => p.scheduledAt);
  const inWeek = scheduled.filter((p) => { const d = new Date(p.scheduledAt!); return d >= week[0] && d < new Date(week[6].getTime() + 86400000); });
  const unscheduled = posts.filter((p) => !p.scheduledAt).slice(0, 6);
  const shift = (days: number) => setAnchor((a) => new Date(a.getFullYear(), a.getMonth(), a.getDate() + days));
  const label = `${week[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${week[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

  return (
    <div className="min-h-screen bg-ink-50/60">
      <Header />
      <main className="mx-auto max-w-[1320px] px-6 py-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="eyebrow mb-1.5">Calendar</div>
            <h1 className="text-[30px] font-semibold tracking-tight">Content plan</h1>
            <p className="mt-1 text-[14px] text-ink-500"><b className="text-ink-950">{inWeek.length}</b> post{inWeek.length === 1 ? '' : 's'} this week · {scheduled.length} scheduled in total</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 rounded-xl bg-white p-1 shadow-card">
              <button onClick={() => shift(-7)} className="grid size-8 place-items-center rounded-lg hover:bg-ink-100" aria-label="Previous week"><ChevronLeft className="size-4" /></button>
              <span className="min-w-44 text-center text-[13px] font-semibold">{label}</span>
              <button onClick={() => shift(7)} className="grid size-8 place-items-center rounded-lg hover:bg-ink-100" aria-label="Next week"><ChevronRight className="size-4" /></button>
            </div>
            <Btn variant="outline" onClick={() => setAnchor(new Date())}>Today</Btn>
            <Btn variant="outline" disabled={!scheduled.length} onClick={() => download('postforge-plan.csv', toCSV(scheduled), 'text/csv')}><FileSpreadsheet />CSV</Btn>
            <Btn disabled={!scheduled.length} onClick={() => { download('postforge-plan.ics', toICS(scheduled), 'text/calendar'); toast.success(`${scheduled.length} posts exported`); }}><CalendarArrowDown />Export .ics</Btn>
          </div>
        </div>

        <div className="panel grid grid-cols-1 overflow-hidden md:grid-cols-7 md:divide-x md:divide-ink-100">
          {week.map((day) => {
            const items = postsOn(day, posts);
            const isToday = sameDay(day, today);
            return (
              <div key={day.toISOString()} className={clsx('flex min-h-[420px] flex-col', isToday && 'bg-sea-50/40')}>
                <div className="flex items-baseline justify-between border-b border-ink-100 px-3 py-2.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-500">{day.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                  <span className={clsx('grid size-7 place-items-center rounded-full font-display text-[14px] font-semibold', isToday ? 'bg-ocean text-white' : 'text-ink-800')}>{day.getDate()}</span>
                </div>
                <div className="flex-1 space-y-2 p-2">
                  {items.map((p) => (
                    <div key={p.id} className="group relative rounded-xl border border-ink-100 bg-white p-2.5 shadow-card">
                      <div className="flex items-center gap-1.5">
                        <PlatformBadge id={p.platform} size="sm" />
                        <span className="font-mono text-[11px] text-ink-500">{new Date(p.scheduledAt!).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
                      </div>
                      <p className="mt-1.5 line-clamp-4 text-[12px] leading-snug text-ink-700">{p.text}</p>
                      <button onClick={() => setPosts((l) => l.map((x) => (x.id === p.id ? { ...x, scheduledAt: undefined } : x)))} className="absolute right-1.5 top-1.5 hidden size-6 place-items-center rounded-md text-ink-400 hover:bg-ink-100 hover:text-ink-900 group-hover:grid" aria-label="Unschedule"><X className="size-3.5" /></button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {unscheduled.length > 0 && (
          <div className="mt-6">
            <div className="eyebrow mb-2.5">Saved but not scheduled</div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {unscheduled.map((p) => (
                <div key={p.id} className="panel flex gap-3 p-3.5">
                  <PlatformBadge id={p.platform} size="sm" />
                  <p className="line-clamp-2 text-[12.5px] text-ink-600">{p.text}</p>
                </div>
              ))}
            </div>
            <p className="mt-2 text-[12px] text-ink-400">Schedule these from the Library. {PLATFORMS.x.name} threads export as one calendar entry with every post in the notes.</p>
          </div>
        )}
      </main>
    </div>
  );
}
