import { PLATFORMS, type PlatformId } from './platforms';
import { lengthFor } from './count';
import { splitThread } from './thread';
import { keywords, suggestHashtags } from './hashtags';
import type { Brief, Goal, Tone, Variant, Voice } from './types';
import { DEFAULT_VOICE } from './types';

// The offline engine: deterministic, template-driven copywriting built from the user's own words.

export function sentences(text: string): string[] {
  return (text.replace(/\s+/g, ' ').match(/[^.!?]+[.!?]*/g) ?? [])
    .map((s) => s.trim().replace(/^[-•*\d.)\s]+/, ''))
    .filter((s) => s.length > 3)
    .map((s) => {
      const c = s[0].toUpperCase() + s.slice(1);
      return /[.!?]$/.test(c) ? c : `${c}.`;
    });
}

/** Points come from sentences; a single long sentence is split on commas and "and". */
export function keyPoints(idea: string, max = 5): string[] {
  let pts = sentences(idea);
  if (pts.length === 1 && pts[0].length > 90) {
    pts = pts[0].replace(/[.!?]$/, '').split(/,\s*|\s+and\s+|;\s*/).map((p) => p.trim()).filter((p) => p.length > 3).map((p) => `${p[0].toUpperCase()}${p.slice(1)}.`);
  }
  return pts.slice(0, max);
}

export function topicOf(idea: string): string {
  const kw = keywords(idea, 4);
  const phrase = kw.find((k) => k.includes(' ')) ?? kw[0];
  return phrase ?? 'this';
}

const strip = (s: string) => s.replace(/[.!?]+$/, '');
const lowerFirst = (s: string) => (/^[A-Z][a-z]/.test(s) ? s[0].toLowerCase() + s.slice(1) : s);

type Hook = { usesPoint: boolean; make: (topic: string, point: string, audience: string) => string };
const H = (make: Hook['make'], usesPoint = false): Hook => ({ make, usesPoint });

const HOOKS: Record<Goal, Hook[]> = {
  teach: [
    H((t) => `Most teams get ${t} wrong. Here's what actually works:`),
    H((t, _p, a) => `${a ? `For ${a}: ` : ''}the ${t} lessons I'd keep if I started again.`),
    H((t) => `What I wish I knew about ${t} sooner:`),
  ],
  announce: [
    H((_t, p) => `It's live: ${lowerFirst(strip(p))}.`, true),
    H((t) => `There's now a better way to handle your ${t}.`),
    H((_t, p) => `Shipped today. ${strip(p)}.`, true),
  ],
  engage: [
    H((_t, p) => `Unpopular opinion: ${lowerFirst(strip(p))}.`, true),
    H((t, _p, a) => `Honest question${a ? ` for ${a}` : ''}: how are you handling ${t}?`),
    H((t) => `I changed my mind about ${t}. Here's why:`),
  ],
  traffic: [
    H((t) => `We wrote down exactly how we approach ${t}.`),
    H((_t, p) => `${strip(p)}. The full breakdown is below.`, true),
    H((t) => `Everything we know about ${t}, in one place.`),
  ],
};

const CTAS: Record<Goal, string[]> = {
  teach: ['Which of these would you add?', 'Save this for your next planning session.', 'What would you put first?'],
  announce: ['Try it and tell me what you think.', 'Questions? Drop them below.', 'What should we build next?'],
  engage: ['Agree or disagree? Tell me below.', 'Curious where you land on this.', 'What am I missing?'],
  traffic: ['Read the full write-up:', 'The details are here:', 'Full guide:'],
};

const EMOJI: Record<Tone, string[]> = {
  professional: ['→', '→', '→'],
  friendly: ['✨', '👉', '🙌'],
  bold: ['⚡', '🔥', '🚀'],
  playful: ['🎉', '😄', '🌊'],
};

const TONE_OPENERS: Record<Tone, string> = { professional: '', friendly: 'Quick one: ', bold: '', playful: 'Okay, real talk: ' };

/** Returns the hook and the points still left for the body (the first is dropped if the hook used it). */
function hook(brief: Brief, i: number, topic: string, pts: string[]): [string, string[]] {
  const hk = HOOKS[brief.goal][i % 3];
  const canUse = !hk.usesPoint || pts.length > 1;
  const chosen = canUse ? hk : HOOKS[brief.goal].find((x) => !x.usesPoint)!;
  let h = chosen.make(topic, pts[0], brief.audience?.trim() ?? '');
  if (i % 3 === 1 && TONE_OPENERS[brief.tone] && !h.includes(':')) h = TONE_OPENERS[brief.tone] + lowerFirst(h);
  if (brief.tone === 'bold') h = h.replace(/:$/, '.');
  return [h, chosen.usesPoint ? pts.slice(1) : pts];
}

function cta(brief: Brief, i: number): string {
  const c = CTAS[brief.goal][i % 3];
  if (brief.goal === 'traffic') return brief.link ? `${c} ${brief.link}` : c.replace(/:$/, ' (link in the comments).');
  return c;
}

function tags(brief: Brief, voice: Voice, platform: PlatformId): string {
  if (!brief.hashtags) return '';
  const [, max] = PLATFORMS[platform].hashtags;
  const n = platform === 'instagram' ? Math.min(max, 8) : max;
  return n ? suggestHashtags(brief.idea, n, voice.defaultHashtags).join(' ') : '';
}

function sign(voice: Voice): string {
  return voice.signature.trim() ? `\n\n${voice.signature.trim()}` : '';
}

function bullet(brief: Brief, i: number): string {
  if (!brief.emoji) return brief.tone === 'professional' ? '→' : '•';
  return EMOJI[brief.tone][i % 3];
}

function forX(brief: Brief, voice: Voice, i: number, all: string[], topic: string): Variant {
  const [h, pts] = hook(brief, i, topic, all);
  const c = cta(brief, i);
  const t = tags(brief, voice, 'x');
  const styles = ['Punchy', 'Mini-list', 'Line by line'];
  const finish = (body: string) => (body + (t ? `\n\n${t}` : '') + sign(voice)).trim();
  let text: string;
  if (i === 1 && pts.length > 1) {
    // as many bullets as fit in one post
    let n = Math.min(3, pts.length);
    do text = finish(`${h}\n\n${pts.slice(0, n).map((p) => `${bullet(brief, 0)} ${strip(p)}`).join('\n')}\n\n${c}`);
    while (lengthFor('x', text) > PLATFORMS.x.limit && --n > 1);
  } else if (i === 2) text = finish(`${h}\n\n${pts.join('\n\n')}\n\n${c}`);
  else text = finish(`${h} ${pts[0] ?? ''} ${c}`.replace(/\s+/g, ' ').trim());
  let thread: string[] | undefined;
  if (lengthFor('x', text) > PLATFORMS.x.limit) {
    // thread the body; hashtags only ride along on the last post if they fit
    const body = text.replace(`\n\n${t}`, '');
    thread = splitThread(body);
    if (t) {
      const last = thread.length - 1;
      const withTags = thread[last].replace(/ (\d+\/\d+)$/, `\n\n${t} $1`);
      if (lengthFor('x', withTags) <= PLATFORMS.x.limit) thread[last] = withTags;
    }
    // dropping the hashtags was enough to fit one post
    if (thread.length === 1) {
      text = thread[0];
      thread = undefined;
    }
  }
  return { id: `x-${i}`, platform: 'x', style: thread ? 'Thread' : styles[i], text, thread };
}

function forLinkedIn(brief: Brief, voice: Voice, i: number, all: string[], topic: string): Variant {
  const [h, rest] = hook(brief, i, topic, all);
  const pts = rest.length ? rest : all;
  const c = cta(brief, i);
  const t = tags(brief, voice, 'linkedin');
  const body =
    i === 1
      ? `${pts[0]}\n\n${pts.slice(1).join(' ') || `That one change shaped how we think about ${topic}.`}`
      : `${pts.map((p) => `${bullet(brief, 0)} ${strip(p)}`).join('\n')}`;
  const takeaway = brief.goal === 'announce' ? `Built for ${brief.audience?.trim() || 'teams like yours'}.` : `The short version: ${lowerFirst(strip(pts[pts.length - 1]))}.`;
  const text = [h, body, i === 2 ? takeaway : '', c, t].filter(Boolean).join('\n\n') + sign(voice);
  return { id: `linkedin-${i}`, platform: 'linkedin', style: ['List', 'Story', 'Takeaway'][i], text };
}

function forInstagram(brief: Brief, voice: Voice, i: number, all: string[], topic: string): Variant {
  const [h, rest] = hook(brief, i, topic, all);
  const pts = rest.length ? rest : all;
  const t = tags(brief, voice, 'instagram');
  const c = brief.goal === 'traffic' ? 'Full guide at the link in bio.' : ['Save this for later.', 'Share this with someone who needs it.', 'Tell us in the comments.'][i % 3];
  const lines = pts.map((p, k) => `${brief.emoji ? EMOJI[brief.tone][k % 3] : `${k + 1}.`} ${strip(p)}`);
  const body = i === 1 ? pts.join(' ') : lines.join('\n');
  const text = [`${brief.emoji && i !== 1 ? `${EMOJI[brief.tone][2]} ` : ''}${h}`, body, c, t ? `.\n.\n${t}` : ''].filter(Boolean).join('\n\n') + sign(voice);
  return { id: `instagram-${i}`, platform: 'instagram', style: ['Carousel caption', 'Story caption', 'Checklist'][i], text };
}

function forThreads(brief: Brief, voice: Voice, i: number, all: string[], topic: string): Variant {
  const [h, rest] = hook(brief, i, topic, all);
  const pts = rest.length ? rest : all;
  const c = cta(brief, i);
  const t = tags(brief, voice, 'threads');
  let text = [h, pts.slice(0, i === 2 ? 1 : 2).join(' '), c, t].filter(Boolean).join('\n\n') + sign(voice);
  // Threads allows 500 characters: drop the second point if needed
  if (lengthFor('threads', text) > PLATFORMS.threads.limit) text = [h, pts[0], c].join('\n\n') + sign(voice);
  return { id: `threads-${i}`, platform: 'threads', style: ['Conversational', 'Two-liner', 'Question'][i], text };
}

const BUILDERS = { x: forX, linkedin: forLinkedIn, instagram: forInstagram, threads: forThreads };

/** Three variants per selected platform. `seed` rotates the hooks so "regenerate" gives new angles. */
export function composeOffline(brief: Brief, voice: Voice = DEFAULT_VOICE, seed = 0): Variant[] {
  const pts = keyPoints(brief.idea);
  if (!pts.length) return [];
  const topic = topicOf(brief.idea);
  return brief.platforms.flatMap((p) => [0, 1, 2].map((i) => {
    const v = BUILDERS[p](brief, voice, (i + seed) % 3, pts, topic);
    return { ...v, id: `${p}-${i}-${seed}` };
  }));
}
