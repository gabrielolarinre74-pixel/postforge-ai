import { xLength } from './count';

/**
 * Split long text into an X thread. Breaks on paragraphs, then sentences, then words,
 * and keeps room for a " 1/5" counter on every post.
 */
export function splitThread(text: string, limit = 280, numbered = true): string[] {
  const clean = text.replace(/\r/g, '').trim();
  if (!clean) return [];
  if (xLength(clean) <= limit) return [clean];

  const reserve = numbered ? 6 : 0; // " 12/12"
  const max = limit - reserve;
  const units: string[] = [];
  for (const para of clean.split(/\n{2,}/)) {
    const sentences = para.match(/[^.!?\n]+[.!?]+["')\]]*|[^.!?\n]+$/g)?.map((s) => s.trim()).filter(Boolean) ?? [para];
    for (const s of sentences) {
      if (xLength(s) <= max) units.push(s);
      else {
        // a single sentence longer than a post: fall back to word wrapping
        let line = '';
        for (const w of s.split(/\s+/)) {
          const next = line ? `${line} ${w}` : w;
          if (xLength(next) > max && line) {
            units.push(line);
            line = w;
          } else line = next;
        }
        if (line) units.push(line);
      }
    }
    units.push('\n'); // paragraph marker
  }

  const posts: string[] = [];
  let cur = '';
  for (const u of units) {
    if (u === '\n') {
      if (cur) cur += '\n\n';
      continue;
    }
    const next = cur ? `${cur}${cur.endsWith('\n\n') ? '' : ' '}${u}` : u;
    if (xLength(next.trim()) > max && cur.trim()) {
      posts.push(cur.trim());
      cur = u;
    } else cur = next;
  }
  if (cur.trim()) posts.push(cur.trim());

  return numbered && posts.length > 1 ? posts.map((p, i) => `${p} ${i + 1}/${posts.length}`) : posts;
}
