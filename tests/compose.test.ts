import { describe, expect, it } from 'vitest';
import { composeOffline, keyPoints, sentences, topicOf } from '@/lib/compose';
import { hashtagsIn, lengthFor } from '@/lib/count';
import { PLATFORMS } from '@/lib/platforms';
import type { Brief } from '@/lib/types';

const brief: Brief = {
  idea: 'We rebuilt our onboarding flow. New users now see a three-step checklist instead of a blank dashboard. Support tickets about setup dropped and more trials reach the first project. The checklist adapts to the plan you picked.',
  platforms: ['x', 'linkedin', 'instagram', 'threads'],
  goal: 'announce',
  tone: 'friendly',
  audience: 'SaaS founders',
  emoji: true,
  hashtags: true,
};

describe('text helpers', () => {
  it('cleans sentences and adds missing punctuation', () => {
    expect(sentences('- First point. 2) second point!')).toEqual(['First point.', 'Second point!']);
    expect(sentences('ship faster. learn more')).toEqual(['Ship faster.', 'Learn more.']);
  });
  it('splits one long sentence into points', () => {
    expect(keyPoints('Launch checklist for small teams covering pricing pages, onboarding emails, a status page and a changelog people actually read').length).toBeGreaterThan(2);
  });
  it('finds a topic phrase', () => {
    expect(topicOf(brief.idea)).toMatch(/onboarding|checklist/);
  });
});

describe('offline composer', () => {
  const out = composeOffline(brief);
  it('returns three variants for each platform', () => {
    expect(out).toHaveLength(12);
    expect(new Set(out.map((v) => v.id)).size).toBe(12);
  });
  it('keeps every single post within the platform limit (X uses a thread when needed)', () => {
    for (const v of out) {
      if (v.thread) v.thread.forEach((p) => expect(lengthFor('x', p)).toBeLessThanOrEqual(280));
      else expect(lengthFor(v.platform, v.text)).toBeLessThanOrEqual(PLATFORMS[v.platform].limit);
    }
  });
  it('respects hashtag caps', () => {
    for (const v of out) expect(hashtagsIn(v.text).length).toBeLessThanOrEqual(PLATFORMS[v.platform].maxHashtags ?? PLATFORMS[v.platform].hashtags[1]);
  });
  it('omits hashtags and emoji when turned off', () => {
    const plain = composeOffline({ ...brief, hashtags: false, emoji: false, tone: 'professional' });
    expect(plain.every((v) => hashtagsIn(v.text).length === 0)).toBe(true);
    expect(plain.some((v) => /[🎉✨🔥]/u.test(v.text))).toBe(false);
  });
  it('is deterministic, and the seed changes the angle', () => {
    expect(composeOffline(brief)[0].text).toBe(out[0].text);
    expect(composeOffline(brief, undefined, 1)[0].text).not.toBe(out[0].text);
  });
  it('puts the link in traffic posts, and points Instagram to the bio', () => {
    const t = composeOffline({ ...brief, goal: 'traffic', link: 'https://example.com/guide' });
    expect(t.find((v) => v.platform === 'linkedin')!.text).toContain('https://example.com/guide');
    expect(t.find((v) => v.platform === 'instagram')!.text).toContain('link in bio');
  });
  it('adds the signature from the brand voice', () => {
    const v = composeOffline(brief, { name: 'Acme', handle: 'acme', signature: '— Team Acme', defaultHashtags: [], bannedWords: [] });
    expect(v.find((x) => x.platform === 'linkedin')!.text.endsWith('— Team Acme')).toBe(true);
  });
});
