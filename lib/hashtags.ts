const STOP = new Set(
  'a an the and or but if then so of to in on for with at by from up about into over after before is are was were be been being have has had do does did can could will would should may might must i me my we our you your he she it its they them their this that these those there here what which who whom when where why how all any both each few more most other some such no nor not only own same than too very just also get got make made new one two three via per let lets use using used really still even much many like want need way ways thing things people time year years day days week weeks today now'
    .split(' '),
);

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/[#@]/g, ' ')
    .split(/[^\p{L}\p{N}']+/u)
    .map((w) => w.replace(/^'+|'+$/g, '').replace(/'s$/, ''))
    .filter((w) => w.length > 2 && !STOP.has(w) && !/^\d+$/.test(w));
}

/** Most frequent meaningful words and two-word phrases, ranked. */
export function keywords(text: string, n = 8): string[] {
  const words = tokenize(text);
  const score = new Map<string, number>();
  words.forEach((w, i) => {
    score.set(w, (score.get(w) || 0) + 1 + (i < 12 ? 0.5 : 0));
    const next = words[i + 1];
    if (next) score.set(`${w} ${next}`, (score.get(`${w} ${next}`) || 0) + 0.9);
  });
  const ranked = [...score.entries()].filter(([k, v]) => !k.includes(' ') || v >= 1.8).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const out: string[] = [];
  for (const [k] of ranked) {
    if (out.some((o) => o.includes(k) || k.includes(o))) continue;
    out.push(k);
    if (out.length >= n) break;
  }
  return out;
}

export function toHashtag(phrase: string): string {
  const body = phrase
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join('');
  return body ? `#${body}` : '';
}

/** Hashtags from the text's keywords plus any defaults, de-duplicated case-insensitively. */
export function suggestHashtags(text: string, count: number, defaults: string[] = []): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const tag of [...defaults.map((d) => (d.startsWith('#') ? d : toHashtag(d))), ...keywords(text, count + 4).map(toHashtag)]) {
    const key = tag.toLowerCase();
    if (!tag || tag.length < 3 || seen.has(key)) continue;
    seen.add(key);
    out.push(tag);
    if (out.length >= count) break;
  }
  return out;
}
