import { describe, expect, it } from 'vitest';
import { graphemes, hashtagsIn, lengthFor, linksIn, xLength } from '@/lib/count';
import { splitThread } from '@/lib/thread';
import { keywords, suggestHashtags, toHashtag } from '@/lib/hashtags';

describe('counting', () => {
  it('counts links as 23 on X regardless of length', () => {
    expect(xLength('see https://example.com/a/very/long/path/that/keeps/going')).toBe(4 + 23);
  });
  it('counts emoji double on X and once elsewhere', () => {
    expect(xLength('hi 👋')).toBe(5);
    expect(lengthFor('linkedin', 'hi 👋')).toBe(4);
    expect(graphemes('👍🏽').length).toBe(1);
  });
  it('finds hashtags and links', () => {
    expect(hashtagsIn('Ship it #BuildInPublic and #ai_tools, not this#one')).toEqual(['#BuildInPublic', '#ai_tools']);
    expect(linksIn('read postforge.dev/blog or https://a.io')).toHaveLength(2);
  });
});

describe('threads', () => {
  it('leaves short text alone', () => {
    expect(splitThread('Short and sweet.')).toEqual(['Short and sweet.']);
  });
  it('splits on sentences, numbers posts and keeps each under the limit', () => {
    const text = Array.from({ length: 14 }, (_, i) => `This is sentence number ${i + 1} and it carries a useful idea.`).join(' ');
    const posts = splitThread(text);
    expect(posts.length).toBeGreaterThan(2);
    posts.forEach((p, i) => {
      expect(xLength(p)).toBeLessThanOrEqual(280);
      expect(p.endsWith(` ${i + 1}/${posts.length}`)).toBe(true);
    });
    expect(posts[0]).toMatch(/^This is sentence number 1 /);
  });
  it('word-wraps a single sentence that is longer than a post', () => {
    const posts = splitThread('word '.repeat(120).trim(), 280, false);
    expect(posts.length).toBe(3);
    expect(posts.every((p) => xLength(p) <= 280)).toBe(true);
  });
});

describe('keywords and hashtags', () => {
  const text = 'We cut onboarding time in half. The new onboarding checklist guides customers through setup, and customer support tickets dropped.';
  it('ranks repeated meaningful words first', () => {
    expect(keywords(text, 3)[0]).toBe('onboarding');
  });
  it('builds camel-cased hashtags and respects defaults', () => {
    expect(toHashtag('product launch')).toBe('#ProductLaunch');
    const tags = suggestHashtags(text, 3, ['saas', '#Onboarding']);
    expect(tags[0]).toBe('#Saas');
    expect(tags[1]).toBe('#Onboarding');
    expect(tags.filter((t) => t.toLowerCase() === '#onboarding')).toHaveLength(1);
    expect(tags).toHaveLength(3);
  });
});
