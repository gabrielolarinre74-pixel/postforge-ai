const STOP = new Set(
  (
    'a an the and or but if then so of to in on for with at by from up about into over after before is are was were be been being ' +
    'have has had do does did can could will would should may might must i me my we our you your he she it its they them their ' +
    'this that these those there here what which who whom when where why how all any both each few more most other some such no ' +
    'nor not only own same than too very just also get got make made new one two three via per let lets use using used really ' +
    'still even much many like want need way ways thing things people time year years day days week weeks today now instead see ' +
    'seen saw look looks show shows go goes come comes take takes give gives keep keeps put puts try tries start starts stop stops ' +
    'find finds think thinks know knows feel feels seem seems help helps work works run runs call calls set sets turn turns move ' +
    'moves pick picks reach reaches drop drops adapt adapts rebuild rebuilt build builds built ship ships launch add adds change ' +
    'changes improve better best good great big small large little first last next quick easy hard simple blank real actually ' +
    'every always never often less fewer lot lots step steps based without within across around while though because already yet ' +
    'again ever'
  ).split(' '),
);

/** Meaningful words in order, with null where a stopword or punctuation broke the phrase. */
function stream(text: string): (string | null)[] {
  return text
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, ' . ')
    .replace(/[#@]/g, ' ')
    .split(/(\s+|[.,!?;:()"\u2014\u2013]+)/u)
    .map((w) => w.trim().replace(/^[-']+|[-']+$/g, '').replace(/'s$/, ''))
    .filter((w) => w !== '')
    .map((w) => (/^[\p{L}\p{N}'-]+$/u.test(w) && w.length > 2 && !STOP.has(w) && !/^\d+$/.test(w) && !/(ed|ly)$/.test(w) ? w : null));
}

export function tokenize(text: string): string[] {
  return stream(text).filter((w): w is string => !!w);
}

/** Most useful words and adjacent two-word phrases, ranked. Phrases never span a stopword. */
export function keywords(text: string, n = 8): string[] {
  const seq = stream(text);
  const score = new Map<string, number>();
  let seen = 0;
  seq.forEach((w, i) => {
    if (!w) return;
    seen++;
    score.set(w, (score.get(w) || 0) + 1 + (seen <= 6 ? 0.4 : 0));
    const next = seq[i + 1];
    if (next) score.set(`${w} ${next}`, (score.get(`${w} ${next}`) || 0) + 1.5);
  });
  const ranked = [...score.entries()].sort((a, b) => b[1] - a[1] || b[0].length - a[0].length);
  const out: string[] = [];
  for (const [k] of ranked) {
    if (out.some((o) => o.split(' ').some((w) => k.split(' ').includes(w)))) continue;
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
