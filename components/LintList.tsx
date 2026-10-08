import clsx from 'clsx';
import { Check, TriangleAlert, X } from 'lucide-react';
import type { Check as LintCheck } from '@/lib/lint';

export function ScorePill({ score }: { score: number }) {
  return (
    <span className={clsx('inline-flex h-6 items-center rounded-full px-2 font-mono text-[11px] font-semibold', score >= 85 ? 'bg-sea-50 text-sea-700' : score >= 60 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700')}>
      {score}
    </span>
  );
}

export function LintList({ checks }: { checks: LintCheck[] }) {
  return (
    <ul className="grid gap-x-5 gap-y-2 sm:grid-cols-2">
      {checks.map((c) => (
        <li key={c.id} className="flex gap-2 text-[12.5px]">
          <span className={clsx('mt-0.5 grid size-4 shrink-0 place-items-center rounded-full', c.ok ? 'bg-sea-500 text-white' : c.hard ? 'bg-red-500 text-white' : 'bg-amber-100 text-amber-700')}>
            {c.ok ? <Check className="size-2.5" strokeWidth={3.5} /> : c.hard ? <X className="size-2.5" strokeWidth={3.5} /> : <TriangleAlert className="size-2.5" strokeWidth={3} />}
          </span>
          <span className="min-w-0">
            <span className="font-semibold text-ink-800">{c.label}</span>
            <span className="block leading-snug text-ink-500">{c.detail}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
