import { describe, expect, it } from 'vitest';
import { lintPost, postScore, readingEase } from '@/lib/lint';
import { fold, nextSlot, postsOn, toICS, weekOf } from '@/lib/calendar';
import type { SavedPost } from '@/lib/types';

describe('post linter', () => {
  it('passes a well-formed LinkedIn post', () => {
    const text = 'Most teams overthink onboarding.\n\nWe replaced a blank dashboard with a three-step checklist. New users finish setup on day one, and fewer of them write in confused.\n\nThe lesson: show the next step, not every feature. The checklist changes with the plan each person picks, so nobody sees steps that do not apply to them.\n\nWhat does your first-run experience look like?\n\n#Onboarding #SaaS #ProductDesign';
    const checks = lintPost('linkedin', text);
    expect(checks.filter((c) => !c.ok).map((c) => c.id)).toEqual([]);
    expect(postScore(checks)).toBe(100);
  });
  it('flags stock openers, missing CTAs and shouting', () => {
    const checks = lintPost('x', "I'm so excited to announce our NEW AMAZING FEATURE!!!");
    const bad = checks.filter((c) => !c.ok).map((c) => c.id);
    expect(bad).toEqual(expect.arrayContaining(['hook', 'cta', 'tone']));
  });
  it('treats going over the limit as a hard failure', () => {
    const checks = lintPost('threads', 'word '.repeat(120) + '?');
    expect(checks.find((c) => c.id === 'limit')!.ok).toBe(false);
    expect(postScore(checks)).toBeLessThanOrEqual(40);
  });
  it('warns about links in Instagram captions and banned words', () => {
    const checks = lintPost('instagram', 'New guide is up at https://example.com. Synergy for everyone! Save this.', { banned: ['synergy'] });
    expect(checks.find((c) => c.id === 'links')?.ok).toBe(false);
    expect(checks.find((c) => c.id === 'banned')?.detail).toContain('synergy');
  });
  it('scores plain English higher than jargon', () => {
    expect(readingEase('We ship small changes. People like that. It is fast and easy.')).toBeGreaterThan(readingEase('Organisational transformation necessitates comprehensive stakeholder alignment methodologies.'));
  });
});

describe('calendar', () => {
  const posts: SavedPost[] = [
    { id: 'a', platform: 'x', text: 'Launch day, here we go', idea: '', createdAt: 0, scheduledAt: new Date(2026, 9, 7, 9, 0).toISOString() },
    { id: 'b', platform: 'linkedin', text: 'Line one\nLine two, with comma; and semicolon', idea: '', createdAt: 0, scheduledAt: new Date(2026, 9, 7, 9, 30).toISOString() },
    { id: 'c', platform: 'threads', text: 'draft', idea: '', createdAt: 0 },
  ];
  it('builds a Monday-first week', () => {
    const w = weekOf(new Date(2026, 9, 8)); // Thursday
    expect(w[0].getDay()).toBe(1);
    expect(w[0].getDate()).toBe(5);
    expect(w[6].getDate()).toBe(11);
  });
  it('lists posts for a day and finds the next free slot', () => {
    const day = new Date(2026, 9, 7);
    expect(postsOn(day, posts).map((p) => p.id)).toEqual(['a', 'b']);
    expect(nextSlot(day, posts).getHours()).toBe(10);
  });
  it('writes a valid calendar with escaped text and folded lines', () => {
    const ics = toICS(posts, new Date(Date.UTC(2026, 9, 1)));
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(2);
    expect(ics).toContain('SUMMARY:LinkedIn: Line one');
    expect(ics).toContain('Line two\\, with comma\\; and semicolon');
    expect(ics.split('\r\n').every((l) => new TextEncoder().encode(l).length <= 75)).toBe(true);
    expect(fold('x'.repeat(160)).split('\r\n')).toHaveLength(3);
  });
});
