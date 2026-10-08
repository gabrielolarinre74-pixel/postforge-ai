import clsx from 'clsx';

/** Ring that fills as a post approaches its limit; turns red past it. */
export function Meter({ value, limit }: { value: number; limit: number }) {
  const r = 9;
  const c = 2 * Math.PI * r;
  const p = Math.min(1, value / limit);
  const over = value > limit;
  const near = !over && value > limit * 0.9;
  return (
    <span className={clsx('flex items-center gap-1.5 font-mono text-[11.5px] tabular-nums', over ? 'text-red-600' : near ? 'text-amber-600' : 'text-ink-500')} title={`${value} of ${limit} characters`}>
      <svg width="22" height="22" viewBox="0 0 22 22" className="-rotate-90">
        <circle cx="11" cy="11" r={r} fill="none" stroke="#e2e8f0" strokeWidth="2.5" />
        <circle cx="11" cy="11" r={r} fill="none" stroke={over ? '#dc2626' : near ? '#d97706' : 'url(#meterGrad)'} strokeWidth="2.5" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - p)} />
        <defs><linearGradient id="meterGrad"><stop offset="0" stopColor="#06b6d4" /><stop offset="1" stopColor="#2563eb" /></linearGradient></defs>
      </svg>
      {over ? `-${value - limit}` : limit - value}
    </span>
  );
}
