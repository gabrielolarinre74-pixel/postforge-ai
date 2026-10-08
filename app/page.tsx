'use client';

import { useMemo, useState } from 'react';
import clsx from 'clsx';
import { ArrowRight, Hash, Link2, Loader2, RefreshCw, Smile, Sparkles, Users, Wand2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Header } from '@/components/Header';
import { Btn } from '@/components/Modal';
import { PlatformBadge } from '@/components/PostPreview';
import { VariantCard } from '@/components/VariantCard';
import { ScheduleDialog } from '@/components/ScheduleDialog';
import { composeOffline } from '@/lib/compose';
import { composeWithAI, validateAi } from '@/lib/ai';
import { PLATFORMS, PLATFORM_IDS, type PlatformId } from '@/lib/platforms';
import { SAMPLE_BRIEFS } from '@/lib/samples';
import { uid, useAiSettings, usePosts, useVoice } from '@/lib/store';
import type { Brief, Goal, Tone, Variant } from '@/lib/types';

const GOALS: { id: Goal; label: string; hint: string }[] = [
  { id: 'announce', label: 'Announce', hint: 'Launches and updates' },
  { id: 'teach', label: 'Teach', hint: 'Lessons and how-tos' },
  { id: 'engage', label: 'Spark talk', hint: 'Opinions and questions' },
  { id: 'traffic', label: 'Drive clicks', hint: 'Send people to a link' },
];
const TONES: Tone[] = ['professional', 'friendly', 'bold', 'playful'];
const MAX = 2000;

export default function Studio() {
  const [voice] = useVoice();
  const [ai] = useAiSettings();
  const [posts, setPosts] = usePosts();
  const [brief, setBrief] = useState<Brief>({ idea: '', platforms: ['x', 'linkedin', 'instagram'], goal: 'announce', tone: 'friendly', audience: '', link: '', emoji: true, hashtags: true });
  const [variants, setVariants] = useState<Variant[]>([]);
  const [tab, setTab] = useState<PlatformId | 'all'>('all');
  const [seed, setSeed] = useState(0);
  const [busy, setBusy] = useState(false);
  const [savedIds, setSavedIds] = useState<Record<string, string>>({});
  const [scheduling, setScheduling] = useState<Variant | null>(null);

  const set = <K extends keyof Brief>(k: K, v: Brief[K]) => setBrief((b) => ({ ...b, [k]: v }));
  const togglePlatform = (p: PlatformId) => set('platforms', brief.platforms.includes(p) ? brief.platforms.filter((x) => x !== p) : [...brief.platforms, p]);

  const forge = async (nextSeed = 0) => {
    if (brief.idea.trim().length < 20) return void toast.error('Give it a sentence or two to work with.');
    if (!brief.platforms.length) return void toast.error('Pick at least one platform.');
    setBusy(true);
    setSeed(nextSeed);
    const clean = { ...brief, idea: brief.idea.trim(), link: brief.link?.trim() || undefined };
    let out: Variant[];
    if (ai.engine === 'ai' && !validateAi(ai)) {
      try {
        out = await composeWithAI(clean, voice, ai);
      } catch (e) {
        toast.error(`${(e as Error).message} Using the offline engine.`);
        out = composeOffline(clean, voice, nextSeed);
      }
    } else {
      await new Promise((r) => setTimeout(r, 350)); // a beat so the swap is visible
      out = composeOffline(clean, voice, nextSeed);
    }
    setVariants(out);
    setSavedIds({});
    if (tab !== 'all' && !clean.platforms.includes(tab)) setTab('all');
    setBusy(false);
  };

  const save = (v: Variant, scheduledAt?: string) => {
    const existing = savedIds[v.id];
    const id = existing ?? uid();
    setPosts((list) => {
      const rest = list.filter((p) => p.id !== id);
      return [{ id, platform: v.platform, text: v.text, thread: v.thread, idea: brief.idea.trim(), createdAt: Date.now(), scheduledAt: scheduledAt ?? list.find((p) => p.id === id)?.scheduledAt }, ...rest];
    });
    setSavedIds((s) => ({ ...s, [v.id]: id }));
    if (!scheduledAt) toast.success('Saved to your library');
  };

  const shown = useMemo(() => (tab === 'all' ? variants : variants.filter((v) => v.platform === tab)), [variants, tab]);
  const counts = useMemo(() => Object.fromEntries(PLATFORM_IDS.map((p) => [p, variants.filter((v) => v.platform === p).length])), [variants]);

  return (
    <div className="min-h-screen bg-ink-50/60">
      <Header />
      <main className="mx-auto grid max-w-[1320px] gap-6 px-6 py-8 lg:grid-cols-[440px_minmax(0,1fr)]">
        <section className="lg:sticky lg:top-24 lg:self-start">
          <div className="panel overflow-hidden">
            <div className="relative overflow-hidden bg-ink-950 px-6 pb-5 pt-6 text-white">
              <div className="pointer-events-none absolute -right-16 -top-20 size-56 rounded-full bg-ocean opacity-60 blur-3xl" />
              <div className="relative">
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-sea-300"><Wand2 className="size-3.5" />Studio</div>
                <h1 className="mt-2 text-[26px] font-semibold leading-tight tracking-tight">One idea. <span className="text-ocean">Every feed.</span></h1>
                <p className="mt-1.5 text-[13.5px] leading-relaxed text-white/60">Write it once in plain words. Get three angles per platform, sized, tagged and checked.</p>
              </div>
            </div>
            <div className="space-y-5 p-6">
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="label mb-0" htmlFor="idea">Your idea</label>
                  <span className="font-mono text-[11px] text-ink-400">{brief.idea.length}/{MAX}</span>
                </div>
                <textarea id="idea" className="field min-h-[150px] resize-y leading-relaxed" maxLength={MAX} placeholder="What happened, what you learned or what you're launching. A few sentences is plenty." value={brief.idea} onChange={(e) => set('idea', e.target.value)} />
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {SAMPLE_BRIEFS.map((s) => (
                    <button key={s.title} onClick={() => setBrief((b) => ({ ...b, ...s.brief, link: s.brief.link ?? '', audience: s.brief.audience ?? '' }))} className="rounded-full bg-ink-100 px-2.5 py-1 text-[11.5px] font-medium text-ink-600 hover:bg-ink-200">{s.title}</button>
                  ))}
                </div>
              </div>

              <div>
                <span className="label">Platforms</span>
                <div className="grid grid-cols-4 gap-2">
                  {PLATFORM_IDS.map((p) => {
                    const on = brief.platforms.includes(p);
                    return (
                      <button key={p} onClick={() => togglePlatform(p)} aria-pressed={on} className={clsx('flex flex-col items-center gap-1.5 rounded-xl border py-2.5 text-[11.5px] font-semibold transition', on ? 'border-ink-950 bg-white ring-4 ring-ink-950/5' : 'border-ink-200 text-ink-500 hover:border-ink-300')}>
                        <span className={clsx(!on && 'opacity-40 grayscale')}><PlatformBadge id={p} /></span>{PLATFORMS[p].name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <span className="label">Goal</span>
                <div className="grid grid-cols-2 gap-2">
                  {GOALS.map((g) => (
                    <button key={g.id} onClick={() => set('goal', g.id)} aria-pressed={brief.goal === g.id} className={clsx('rounded-xl border px-3 py-2 text-left transition', brief.goal === g.id ? 'border-transparent bg-ocean text-white shadow-sea' : 'border-ink-200 hover:border-ink-300')}>
                      <span className="block text-[13px] font-semibold">{g.label}</span>
                      <span className={clsx('block text-[11.5px]', brief.goal === g.id ? 'text-white/75' : 'text-ink-500')}>{g.hint}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="label">Tone</span>
                <div className="flex flex-wrap gap-1.5">
                  {TONES.map((t) => <button key={t} onClick={() => set('tone', t)} className={clsx('chip capitalize', brief.tone === t && 'chip-on')}>{t}</button>)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-400" />
                  <input className="field pl-9" placeholder="Audience" maxLength={60} value={brief.audience} onChange={(e) => set('audience', e.target.value)} aria-label="Audience" />
                </div>
                <div className="relative">
                  <Link2 className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-400" />
                  <input className="field pl-9" placeholder="Link (optional)" maxLength={300} value={brief.link} onChange={(e) => set('link', e.target.value)} aria-label="Link" />
                </div>
              </div>

              <div className="flex gap-2">
                {([['emoji', Smile, 'Emoji'], ['hashtags', Hash, 'Hashtags']] as const).map(([k, Icon, label]) => (
                  <button key={k} onClick={() => set(k, !brief[k])} aria-pressed={brief[k]} className={clsx('chip', brief[k] && 'chip-on')}><Icon className="size-3.5" />{label}</button>
                ))}
              </div>

              <Btn variant="ocean" className="h-12 w-full text-[15px]" onClick={() => forge(0)} disabled={busy}>
                {busy ? <Loader2 className="animate-spin" /> : <Sparkles />}Forge posts<ArrowRight className="ml-auto" />
              </Btn>
              <p className="-mt-2 text-center text-[11.5px] text-ink-400">{ai.engine === 'ai' ? `Writing with ${ai.model}` : 'Offline engine · nothing leaves your browser'}</p>
            </div>
          </div>
        </section>

        <section className="min-w-0">
          {variants.length === 0 ? (
            <div className="panel dots relative flex min-h-[640px] flex-col items-center justify-center overflow-hidden p-10 text-center">
              <div className="flex -space-x-2">{PLATFORM_IDS.map((p) => <span key={p} className="rounded-lg ring-4 ring-white"><PlatformBadge id={p} /></span>)}</div>
              <h2 className="mt-5 text-[22px] font-semibold tracking-tight">Your drafts land here</h2>
              <p className="mt-1.5 max-w-sm text-[14px] leading-relaxed text-ink-500">Each platform gets three structures: a punchy line, a list and a longer take. Every draft is counted, tagged and run through the linter.</p>
              <div className="mt-6 grid w-full max-w-lg gap-2 text-left sm:grid-cols-3">
                {[['X threads', 'Long posts split on sentences, numbered 1/n'], ['Post linter', 'Hook, call to action, hashtags, reading ease'], ['Calendar', 'Schedule and export to any calendar app']].map(([t, d]) => (
                  <div key={t} className="rounded-xl bg-white p-3 shadow-card"><div className="text-[13px] font-semibold">{t}</div><div className="mt-0.5 text-[12px] leading-snug text-ink-500">{d}</div></div>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-1 rounded-full bg-white p-1 shadow-card">
                  {(['all', ...PLATFORM_IDS.filter((p) => counts[p])] as const).map((p) => (
                    <button key={p} onClick={() => setTab(p)} className={clsx('flex h-8 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-semibold transition', tab === p ? 'bg-ink-950 text-white' : 'text-ink-500 hover:text-ink-950')}>
                      {p === 'all' ? 'All' : PLATFORMS[p].name}<span className={clsx('text-[11px]', tab === p ? 'text-white/60' : 'text-ink-400')}>{p === 'all' ? variants.length : counts[p]}</span>
                    </button>
                  ))}
                </div>
                <Btn variant="outline" onClick={() => forge(seed + 1)} disabled={busy}>{busy ? <Loader2 className="animate-spin" /> : <RefreshCw />}New angles</Btn>
              </div>
              <div className={clsx('grid gap-4', tab === 'all' ? 'xl:grid-cols-2' : 'mx-auto max-w-2xl')}>
                {shown.map((v, i) => (
                  <VariantCard key={v.id} variant={v} voice={voice} saved={!!savedIds[v.id]} defaultOpen={tab !== 'all' && i === 0} onSave={(x) => save(x)} onSchedule={(x) => setScheduling(x)} />
                ))}
              </div>
            </>
          )}
        </section>
      </main>
      <ScheduleDialog
        open={!!scheduling}
        onClose={() => setScheduling(null)}
        platform={scheduling?.platform}
        preview={scheduling?.text}
        posts={posts}
        onConfirm={(iso) => {
          if (!scheduling) return;
          save(scheduling, iso);
          toast.success(`Scheduled for ${new Date(iso).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}`);
        }}
      />
    </div>
  );
}
