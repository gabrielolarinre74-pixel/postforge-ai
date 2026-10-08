import { PLATFORMS, type PlatformId } from './platforms';
import { hashtagsIn, lengthFor, linksIn } from './count';

export interface Check {
  id: string;
  label: string;
  ok: boolean;
  detail: string;
  /** hard failures block posting; soft ones are advice */
  hard?: boolean;
}

const WEAK_OPENERS = /^(i'?m (so )?(excited|thrilled|happy|proud) to|in today'?s (world|fast)|hey (everyone|guys|all)|as (we all know|many of you know)|did you know)/i;
const CTA_WORDS = /\?|\b(comment|reply|share|save|try|read|join|sign up|subscribe|follow|tell (me|us)|let (me|us) know|link in bio|dm|book|download|check it out|grab)\b/i;

function syllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, '');
  if (w.length <= 3) return w ? 1 : 0;
  const groups = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '').replace(/^y/, '').match(/[aeiouy]{1,2}/g);
  return Math.max(1, groups?.length ?? 1);
}

/** Flesch reading ease: 60+ is plain English, 30 and below reads like a legal document. */
export function readingEase(text: string): number {
  const words = text.replace(/#[\p{L}\p{N}_]+|https?:\/\/\S+/gu, ' ').match(/[A-Za-z']+/g) ?? [];
  if (words.length < 5) return 100;
  const sentences = Math.max(1, (text.match(/[.!?]+(\s|$)|\n/g) ?? []).length);
  const syl = words.reduce((n, w) => n + syllables(w), 0);
  return Math.round(Math.max(0, Math.min(100, 206.835 - 1.015 * (words.length / sentences) - 84.6 * (syl / words.length))));
}

export function lintPost(platform: PlatformId, text: string, opts: { banned?: string[] } = {}): Check[] {
  const p = PLATFORMS[platform];
  const len = lengthFor(platform, text);
  const firstLine = text.trim().split('\n')[0] ?? '';
  const tags = hashtagsIn(text);
  const words = text.match(/\b[A-Za-z]{3,}\b/g) ?? [];
  const caps = words.filter((w) => w === w.toUpperCase()).length;
  const ease = readingEase(text);
  const banned = (opts.banned ?? []).map((b) => b.trim().toLowerCase()).filter(Boolean).filter((b) => new RegExp(`\\b${b.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(text));
  const checks: Check[] = [
    { id: 'limit', label: 'Within the limit', ok: len <= p.limit, hard: true, detail: `${len.toLocaleString()} of ${p.limit.toLocaleString()} characters${platform === 'x' ? ' (links count as 23)' : ''}.` },
    { id: 'length', label: 'Comfortable length', ok: len >= p.sweetSpot[0] && len <= p.sweetSpot[1], detail: len < p.sweetSpot[0] ? `Short for ${p.name}. Add a detail or an example.` : len > p.sweetSpot[1] ? `Long for ${p.name}. Posts between ${p.sweetSpot[0]} and ${p.sweetSpot[1]} characters are easier to finish.` : 'Easy to read in one go.' },
    { id: 'hook', label: 'Strong first line', ok: firstLine.length > 0 && firstLine.length <= (platform === 'x' ? 120 : 140) && !WEAK_OPENERS.test(firstLine), detail: WEAK_OPENERS.test(firstLine) ? 'Opens with a stock phrase. Lead with the point instead.' : firstLine.length > 140 ? 'The opening line runs long; it gets cut off in feeds.' : 'Opens with the point.' },
    { id: 'cta', label: 'Clear next step', ok: CTA_WORDS.test(text), detail: CTA_WORDS.test(text) ? 'Ends with a question or call to action.' : 'Ask a question or tell readers what to do next.' },
    { id: 'hashtags', label: 'Hashtags', ok: tags.length >= p.hashtags[0] && tags.length <= p.hashtags[1] && (!p.maxHashtags || tags.length <= p.maxHashtags), hard: !!p.maxHashtags && tags.length > p.maxHashtags, detail: `${tags.length} used, ${p.hashtags[0]}–${p.hashtags[1]} suits ${p.name}${p.maxHashtags ? ` (max ${p.maxHashtags})` : ''}.` },
    { id: 'readability', label: 'Plain language', ok: ease >= 50, detail: `Reading ease ${ease}/100${ease < 50 ? '. Shorter sentences and words help.' : '.'}` },
    { id: 'tone', label: 'No shouting', ok: !(words.length > 4 && caps / words.length > 0.3) && !/!{3,}/.test(text), detail: 'All-caps words and "!!!" read as spam.' },
  ];
  if (!p.clickableLinks && linksIn(text).length) checks.push({ id: 'links', label: 'Links', ok: false, detail: `${p.name} captions don't make links clickable. Use "link in bio" instead.` });
  if (platform !== 'x' && len > 300) checks.push({ id: 'breaks', label: 'Line breaks', ok: (text.match(/\n/g) ?? []).length >= 2, detail: 'Break long posts into short paragraphs for mobile.' });
  if (banned.length) checks.push({ id: 'banned', label: 'Brand words', ok: false, detail: `Avoid: ${banned.join(', ')}.` });
  return checks;
}

/** 0–100. Hard failures cap the score at 40. */
export function postScore(checks: Check[]): number {
  if (!checks.length) return 0;
  const score = Math.round((checks.filter((c) => c.ok).length / checks.length) * 100);
  return checks.some((c) => c.hard && !c.ok) ? Math.min(score, 40) : score;
}
