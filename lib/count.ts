import type { PlatformId } from './platforms';

const URL_RE = /\bhttps?:\/\/[^\s]+|\b(?:www\.)?[a-z0-9-]+\.(?:com|io|co|dev|ai|app|org|net)(?:\/[^\s]*)?/gi;
const segmenter = typeof Intl !== 'undefined' && 'Segmenter' in Intl ? new Intl.Segmenter('en', { granularity: 'grapheme' }) : null;

/** Visible characters (grapheme clusters), so 👍🏽 or é count once. */
export function graphemes(text: string): string[] {
  return segmenter ? [...segmenter.segment(text)].map((s) => s.segment) : Array.from(text);
}

/**
 * Length the way X counts it: every link counts as 23, and characters outside the
 * Latin-1 / general punctuation ranges (emoji, CJK) count double.
 */
export function xLength(text: string): number {
  let n = 0;
  const withoutUrls = text.replace(URL_RE, () => {
    n += 23;
    return '';
  });
  for (const g of graphemes(withoutUrls)) {
    const cp = g.codePointAt(0) ?? 0;
    const light = cp <= 0x10ff || (cp >= 0x2000 && cp <= 0x200d) || (cp >= 0x2010 && cp <= 0x201f) || (cp >= 0x2032 && cp <= 0x2037);
    n += light ? 1 : 2;
  }
  return n;
}

export function lengthFor(platform: PlatformId, text: string): number {
  return platform === 'x' ? xLength(text) : graphemes(text).length;
}

export function hashtagsIn(text: string): string[] {
  return text.match(/(^|\s)#[\p{L}\p{N}_]+/gu)?.map((t) => t.trim()) ?? [];
}

export function linksIn(text: string): string[] {
  return text.match(URL_RE) ?? [];
}
