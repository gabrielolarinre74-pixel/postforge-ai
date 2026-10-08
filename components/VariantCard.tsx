'use client';

import { useMemo, useState } from 'react';
import clsx from 'clsx';
import { CalendarPlus, Check, ChevronDown, Copy, PencilLine, Bookmark } from 'lucide-react';
import toast from 'react-hot-toast';
import { PostPreview, PlatformBadge } from './PostPreview';
import { Meter } from './Meter';
import { LintList, ScorePill } from './LintList';
import { lintPost, postScore } from '@/lib/lint';
import { lengthFor } from '@/lib/count';
import { splitThread } from '@/lib/thread';
import { PLATFORMS } from '@/lib/platforms';
import type { Variant, Voice } from '@/lib/types';

export function VariantCard({ variant, voice, onSave, onSchedule, saved, defaultOpen }: {
  variant: Variant; voice: Voice; saved?: boolean; defaultOpen?: boolean;
  onSave: (v: Variant) => void; onSchedule: (v: Variant) => void;
}) {
  const [text, setText] = useState(variant.text);
  const [editing, setEditing] = useState(false);
  const [open, setOpen] = useState(!!defaultOpen);
  const p = PLATFORMS[variant.platform];
  const len = lengthFor(variant.platform, text);
  const thread = variant.platform === 'x' && len > p.limit ? splitThread(text) : undefined;
  const checks = useMemo(() => lintPost(variant.platform, thread ? thread[0] : text, { banned: voice.bannedWords }).filter((c) => !(thread && c.id === 'limit')), [variant.platform, text, thread, voice.bannedWords]);
  const score = postScore(checks);
  const current: Variant = { ...variant, text, thread };

  const copy = () => navigator.clipboard.writeText(thread ? thread.join('\n\n') : text).then(() => toast.success(thread ? `Thread of ${thread.length} copied` : 'Copied'));

  return (
    <article className="panel animate-rise overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-ink-100 px-5 py-3">
        <div className="flex items-center gap-2">
          <PlatformBadge id={variant.platform} />
          <span className="text-[13px] font-semibold">{p.name}</span>
          <span className="rounded-full bg-ink-100 px-2 py-0.5 text-[11px] font-medium text-ink-600">{thread ? `Thread · ${thread.length} posts` : variant.style}</span>
        </div>
        <div className="flex items-center gap-2.5">
          {!thread && <Meter value={len} limit={p.limit} />}
          <ScorePill score={score} />
        </div>
      </div>
      <div className="px-5 py-4">
        {editing ? (
          <textarea className="field min-h-[180px] resize-y font-mono text-[13px] leading-relaxed" value={text} onChange={(e) => setText(e.target.value)} autoFocus aria-label="Edit post" />
        ) : (
          <PostPreview platform={variant.platform} text={text} thread={thread} voice={voice} />
        )}
      </div>
      <div className="flex flex-wrap items-center gap-1 border-t border-ink-100 px-3 py-2">
        <button onClick={() => setEditing(!editing)} className={clsx('flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[12.5px] font-semibold', editing ? 'bg-ink-950 text-white' : 'text-ink-600 hover:bg-ink-100')}>
          {editing ? <Check className="size-3.5" /> : <PencilLine className="size-3.5" />}{editing ? 'Done' : 'Edit'}
        </button>
        <button onClick={copy} className="flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[12.5px] font-semibold text-ink-600 hover:bg-ink-100"><Copy className="size-3.5" />Copy</button>
        <button onClick={() => onSave(current)} className={clsx('flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[12.5px] font-semibold', saved ? 'text-sea-700' : 'text-ink-600 hover:bg-ink-100')}>
          <Bookmark className={clsx('size-3.5', saved && 'fill-current')} />{saved ? 'Saved' : 'Save'}
        </button>
        <button onClick={() => onSchedule(current)} className="flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[12.5px] font-semibold text-ink-600 hover:bg-ink-100"><CalendarPlus className="size-3.5" />Schedule</button>
        <button onClick={() => setOpen(!open)} className="ml-auto flex h-8 items-center gap-1 rounded-lg px-2.5 text-[12.5px] font-medium text-ink-500 hover:bg-ink-100" aria-expanded={open}>
          {checks.filter((c) => !c.ok).length ? `${checks.filter((c) => !c.ok).length} suggestion${checks.filter((c) => !c.ok).length > 1 ? 's' : ''}` : 'All checks pass'}
          <ChevronDown className={clsx('size-3.5 transition', open && 'rotate-180')} />
        </button>
      </div>
      {open && <div className="border-t border-ink-100 bg-ink-50/60 px-5 py-4"><LintList checks={checks} /></div>}
    </article>
  );
}
