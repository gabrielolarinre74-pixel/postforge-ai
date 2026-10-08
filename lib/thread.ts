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
  // units are sentences; '\n' marks a line break and '\n\n' a paragraph break
  const units: string[] = [];
  const wrap = (s: string) => {
    if (xLength(s) <= max) return void units.push(s);
    let line = '';
    for (const w of s.split(/\s+/)) {
      const next = line ? `${line} ${w}` : w;
      if (xLength(next) > max && line) {
        units.push(line);
        line = w;
      } else line = next;
    }
    if (line) units.push(line);
  };
  clean.split(/\n{2,}/).forEach((para, pi) => {
    if (pi) units.push('\n\n');
    para.split('\n').forEach((ln, li) => {
      if (li) units.push('\n');
      const parts = ln.match(/[^.!?]+[.!?]+["')\]]*|[^.!?]+$/g)?.map((x) => x.trim()).filter(Boolean) ?? [];
      parts.forEach(wrap);
    });
  });

  const posts: string[] = [];
  let cur = '';
  let gap = '';
  for (const u of units) {
    if (u === '\n' || u === '\n\n') {
      if (cur) gap = gap === '\n\n' ? gap : u;
      continue;
    }
    const next = cur ? `${cur}${gap || ' '}${u}` : u;
    if (xLength(next) > max && cur) {
      posts.push(cur);
      cur = u;
    } else cur = next;
    gap = '';
  }
  if (cur) posts.push(cur);

  return numbered && posts.length > 1 ? posts.map((p, i) => `${p} ${i + 1}/${posts.length}`) : posts;
}
