import { PLATFORMS } from './platforms';
import type { SavedPost } from './types';

/** Monday-based week containing `date`, as 7 local dates at midnight. */
export function weekOf(date: Date): Date[] {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const monday = new Date(d);
  monday.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i));
}

export const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

export function postsOn(day: Date, posts: SavedPost[]): SavedPost[] {
  return posts.filter((p) => p.scheduledAt && sameDay(new Date(p.scheduledAt), day)).sort((a, b) => a.scheduledAt!.localeCompare(b.scheduledAt!));
}

/** Next free slot: the given day at `hour`, moved forward by 30 minutes while taken. */
export function nextSlot(day: Date, posts: SavedPost[], hour = 9): Date {
  const taken = new Set(posts.filter((p) => p.scheduledAt).map((p) => new Date(p.scheduledAt!).getTime()));
  const t = new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour, 0);
  while (taken.has(t.getTime())) t.setMinutes(t.getMinutes() + 30);
  return t;
}

const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

/** Fold lines to 75 octets as RFC 5545 requires, without splitting a multi-byte character. */
export function fold(line: string): string {
  const enc = new TextEncoder();
  const out: string[] = [];
  let cur = '';
  for (const ch of line) {
    if (enc.encode(cur + ch).length > (out.length ? 74 : 75)) {
      out.push(cur);
      cur = ch;
    } else cur += ch;
  }
  out.push(cur);
  return out.join('\r\n ');
}

export function toICS(posts: SavedPost[], now = new Date()): string {
  const events = posts
    .filter((p) => p.scheduledAt)
    .flatMap((p) => {
      const start = new Date(p.scheduledAt!);
      const end = new Date(start.getTime() + 15 * 60_000);
      const title = `${PLATFORMS[p.platform].name}: ${p.text.split('\n')[0].slice(0, 60)}`;
      return ['BEGIN:VEVENT', `UID:${p.id}@postforge`, `DTSTAMP:${stamp(now)}`, `DTSTART:${stamp(start)}`, `DTEND:${stamp(end)}`, `SUMMARY:${esc(title)}`, `DESCRIPTION:${esc(p.thread?.join('\n\n') ?? p.text)}`, 'END:VEVENT'];
    });
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//PostForge//Content calendar//EN', 'CALSCALE:GREGORIAN', ...events, 'END:VCALENDAR'].map(fold).join('\r\n') + '\r\n';
}

export function toCSV(posts: SavedPost[]): string {
  const q = (s: string) => `"${s.replace(/"/g, '""')}"`;
  return ['Platform,Scheduled,Text', ...posts.map((p) => [PLATFORMS[p.platform].name, p.scheduledAt ?? '', q(p.thread?.join('\n\n') ?? p.text)].join(','))].join('\n');
}
