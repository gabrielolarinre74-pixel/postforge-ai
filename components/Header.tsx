'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CalendarDays, Library, PenLine, Settings2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { SettingsDialog } from './SettingsDialog';
import { useAiSettings, usePosts } from '@/lib/store';

const NAV = [
  { href: '/', label: 'Studio', icon: PenLine },
  { href: '/library/', label: 'Library', icon: Library },
  { href: '/calendar/', label: 'Calendar', icon: CalendarDays },
];

export function Header() {
  const path = usePathname();
  const [posts] = usePosts();
  const [ai] = useAiSettings();
  const [open, setOpen] = useState(false);
  const scheduled = posts.filter((p) => p.scheduledAt).length;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === ',' && !(e.target as HTMLElement).closest('input, textarea, select, [role=dialog]')) setOpen(true);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const logo = `${process.env.NEXT_PUBLIC_BASE_PATH || ''}/logo.svg`;
  return (
    <header className="sticky top-0 z-30 border-b border-ink-200/70 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1320px] items-center justify-between gap-4 px-6">
        <Link href="/" className="flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logo} alt="" className="size-8" />
          <span className="leading-none">
            <span className="block font-display text-[17px] font-semibold tracking-tight">PostForge</span>
            <span className="text-[10.5px] text-ink-400">by Gabriel.ATH</span>
          </span>
        </Link>
        <nav className="flex items-center gap-1 rounded-full bg-ink-100 p-1" aria-label="Main">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = href === '/' ? path === '/' : path?.startsWith(href.slice(0, -1));
            return (
              <Link key={href} href={href} className={clsx('flex h-8 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-semibold transition', active ? 'bg-white text-ink-950 shadow-card' : 'text-ink-500 hover:text-ink-950')}>
                <Icon className="size-3.5" />
                <span className="hidden sm:inline">{label}</span>
                {label === 'Calendar' && scheduled > 0 && <span className="rounded-full bg-ocean px-1.5 text-[10.5px] leading-4 text-white">{scheduled}</span>}
                {label === 'Library' && posts.length > 0 && <span className="text-[11px] text-ink-400">{posts.length}</span>}
              </Link>
            );
          })}
        </nav>
        <button onClick={() => setOpen(true)} className="flex h-9 items-center gap-2 rounded-full border border-ink-200 px-3 text-[12.5px] font-medium text-ink-600 hover:border-ink-300 hover:text-ink-950">
          <span className={clsx('size-2 rounded-full', ai.engine === 'ai' ? 'bg-deep-500' : 'bg-sea-500')} />
          <span className="hidden md:inline">{ai.engine === 'ai' ? ai.model : 'Offline engine'}</span>
          <Settings2 className="size-4" />
        </button>
      </div>
      <SettingsDialog open={open} onClose={() => setOpen(false)} />
    </header>
  );
}
