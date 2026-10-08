'use client';

import clsx from 'clsx';
import { PLATFORMS, type PlatformId } from '@/lib/platforms';
import type { Voice } from '@/lib/types';

export function PlatformBadge({ id, size = 'md' }: { id: PlatformId; size?: 'sm' | 'md' }) {
  const bg = { x: 'bg-ink-950', linkedin: 'bg-deep-600', instagram: 'bg-ocean', threads: 'bg-ink-700' }[id];
  return (
    <span className={clsx('inline-grid shrink-0 place-items-center rounded-md font-bold text-white', bg, size === 'sm' ? 'size-5 text-[9px]' : 'size-6 text-[10px]')} title={PLATFORMS[id].name}>
      {PLATFORMS[id].short}
    </span>
  );
}

/** Highlights hashtags, mentions and links without using innerHTML. */
export function RichText({ text }: { text: string }) {
  const parts = text.split(/((?:^|\s)#[\p{L}\p{N}_]+|(?:^|\s)@[\w.]+|https?:\/\/\S+)/u);
  return (
    <>
      {parts.map((p, i) =>
        /^(\s?)[#@]|^https?:/.test(p.trimStart()) && p.trim() ? (
          <span key={i}>{p.match(/^\s*/)?.[0]}<span className="font-medium text-deep-600">{p.trim()}</span></span>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </>
  );
}

function Avatar({ voice }: { voice: Voice }) {
  return <span className="grid size-10 shrink-0 place-items-center rounded-full bg-ocean font-display text-[15px] font-semibold text-white">{(voice.name.trim()[0] || 'Y').toUpperCase()}</span>;
}

export function PostPreview({ platform, text, thread, voice }: { platform: PlatformId; text: string; thread?: string[]; voice: Voice }) {
  const posts = thread?.length ? thread : [text];
  return (
    <div className="space-y-0">
      {posts.map((p, i) => (
        <div key={i} className="relative flex gap-3">
          {i < posts.length - 1 && <span className="absolute bottom-0 left-5 top-12 w-px bg-ink-200" aria-hidden />}
          <Avatar voice={voice} />
          <div className={clsx('min-w-0 flex-1', i < posts.length - 1 && 'pb-5')}>
            <div className="flex items-center gap-1.5 text-[13.5px]">
              <span className="truncate font-semibold">{voice.name || 'Your Brand'}</span>
              {platform !== 'linkedin' && <span className="truncate text-ink-400">@{voice.handle || 'yourbrand'}</span>}
              <span className="text-ink-300">·</span>
              <span className="text-ink-400">{platform === 'linkedin' ? 'Now · Public' : 'now'}</span>
            </div>
            <p className="mt-1 whitespace-pre-wrap break-words text-[14px] leading-[1.55] text-ink-800"><RichText text={p} /></p>
          </div>
        </div>
      ))}
    </div>
  );
}
