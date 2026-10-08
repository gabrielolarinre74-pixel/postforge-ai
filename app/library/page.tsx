'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import clsx from 'clsx';
import { CalendarClock, CalendarPlus, Copy, Library, Search, Star, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Header } from '@/components/Header';
import { Btn } from '@/components/Modal';
import { PlatformBadge, RichText } from '@/components/PostPreview';
import { ScorePill } from '@/components/LintList';
import { ScheduleDialog } from '@/components/ScheduleDialog';
import { lintPost, postScore } from '@/lib/lint';
import { PLATFORMS, PLATFORM_IDS, type PlatformId } from '@/lib/platforms';
import { usePosts, useVoice } from '@/lib/store';
import type { SavedPost } from '@/lib/types';

type Status = 'all' | 'drafts' | 'scheduled' | 'starred';
const fmt = (iso: string) => new Date(iso).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

export default function LibraryPage() {
  const [posts, setPosts] = usePosts();
  const [voice] = useVoice();
  const [q, setQ] = useState('');
  const [platform, setPlatform] = useState<PlatformId | 'all'>('all');
  const [status, setStatus] = useState<Status>('all');
  const [scheduling, setScheduling] = useState<SavedPost | null>(null);

  const list = useMemo(() => {
    const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
    return posts.filter((p) =>
      (platform === 'all' || p.platform === platform) &&
      (status === 'all' || (status === 'drafts' ? !p.scheduledAt : status === 'scheduled' ? !!p.scheduledAt : !!p.favorite)) &&
      terms.every((t) => `${p.text} ${p.idea}`.toLowerCase().includes(t)),
    );
  }, [posts, q, platform, status]);

  const update = (id: string, patch: Partial<SavedPost>) => setPosts((l) => l.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  const remove = (id: string) => { setPosts((l) => l.filter((p) => p.id !== id)); toast.success('Deleted'); };
  const counts: Record<Status, number> = { all: posts.length, drafts: posts.filter((p) => !p.scheduledAt).length, scheduled: posts.filter((p) => p.scheduledAt).length, starred: posts.filter((p) => p.favorite).length };

  return (
    <div className="min-h-screen bg-ink-50/60">
      <Header />
      <main className="mx-auto max-w-[1320px] px-6 py-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="eyebrow mb-1.5">Library</div>
            <h1 className="text-[30px] font-semibold tracking-tight">Saved posts</h1>
            <p className="mt-1 text-[14px] text-ink-500">Everything you kept from the studio, ready to copy or schedule.</p>
          </div>
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-400" />
            <input className="field pl-9" placeholder="Search posts" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search posts" />
          </div>
        </div>
        <div className="mb-5 flex flex-wrap items-center gap-2">
          {(['all', 'drafts', 'scheduled', 'starred'] as Status[]).map((s) => (
            <button key={s} onClick={() => setStatus(s)} className={clsx('chip capitalize', status === s && 'chip-on')}>{s}<span className="opacity-60">{counts[s]}</span></button>
          ))}
          <span className="mx-1 h-5 w-px bg-ink-200" />
          {(['all', ...PLATFORM_IDS] as const).map((p) => (
            <button key={p} onClick={() => setPlatform(p)} className={clsx('chip', platform === p && 'chip-on')}>{p === 'all' ? 'Every platform' : <><PlatformBadge id={p} size="sm" />{PLATFORMS[p].name}</>}</button>
          ))}
        </div>

        {list.length === 0 ? (
          <div className="panel dots grid min-h-[360px] place-items-center p-10 text-center">
            <div>
              <Library className="mx-auto size-7 text-ink-400" />
              <div className="mt-3 text-[16px] font-semibold">{posts.length ? 'No posts match these filters' : 'Nothing saved yet'}</div>
              <p className="mt-1 text-[13.5px] text-ink-500">{posts.length ? 'Try clearing the search.' : 'Forge a few drafts and press Save on the ones you like.'}</p>
              {!posts.length && <Link href="/" className="mt-4 inline-flex"><Btn variant="ocean">Open the studio</Btn></Link>}
            </div>
          </div>
        ) : (
          <div className="columns-1 gap-4 md:columns-2 xl:columns-3 [&>*]:mb-4">
            {list.map((p) => {
              const score = postScore(lintPost(p.platform, p.thread?.[0] ?? p.text, { banned: voice.bannedWords }).filter((c) => !(p.thread && c.id === 'limit')));
              return (
                <article key={p.id} className="panel break-inside-avoid overflow-hidden">
                  <div className="flex items-center justify-between gap-2 px-4 pt-4">
                    <div className="flex items-center gap-2 text-[12.5px] font-semibold"><PlatformBadge id={p.platform} size="sm" />{PLATFORMS[p.platform].name}{p.thread && <span className="font-normal text-ink-400">· {p.thread.length}-post thread</span>}</div>
                    <div className="flex items-center gap-1.5">
                      <ScorePill score={score} />
                      <button onClick={() => update(p.id, { favorite: !p.favorite })} className={clsx('grid size-7 place-items-center rounded-full', p.favorite ? 'text-amber-500' : 'text-ink-300 hover:text-ink-600')} aria-label={p.favorite ? 'Unstar' : 'Star'}><Star className={clsx('size-4', p.favorite && 'fill-current')} /></button>
                    </div>
                  </div>
                  <p className="line-clamp-[9] whitespace-pre-wrap px-4 py-3 text-[13.5px] leading-relaxed text-ink-800"><RichText text={p.thread?.join('\n\n') ?? p.text} /></p>
                  {p.scheduledAt && <div className="mx-4 mb-3 flex items-center gap-1.5 rounded-lg bg-sea-50 px-2.5 py-1.5 text-[12px] font-medium text-sea-700"><CalendarClock className="size-3.5" />{fmt(p.scheduledAt)}</div>}
                  <div className="flex items-center gap-1 border-t border-ink-100 px-2 py-1.5">
                    <button onClick={() => navigator.clipboard.writeText(p.thread?.join('\n\n') ?? p.text).then(() => toast.success('Copied'))} className="flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[12.5px] font-semibold text-ink-600 hover:bg-ink-100"><Copy className="size-3.5" />Copy</button>
                    <button onClick={() => setScheduling(p)} className="flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[12.5px] font-semibold text-ink-600 hover:bg-ink-100"><CalendarPlus className="size-3.5" />{p.scheduledAt ? 'Reschedule' : 'Schedule'}</button>
                    <button onClick={() => remove(p.id)} className="ml-auto grid size-8 place-items-center rounded-lg text-ink-400 hover:bg-red-50 hover:text-red-600" aria-label="Delete"><Trash2 className="size-3.5" /></button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
      <ScheduleDialog open={!!scheduling} onClose={() => setScheduling(null)} platform={scheduling?.platform} preview={scheduling?.text} posts={posts} initial={scheduling?.scheduledAt}
        onConfirm={(iso) => { if (scheduling) { update(scheduling.id, { scheduledAt: iso }); toast.success('Scheduled'); } }} />
    </div>
  );
}
