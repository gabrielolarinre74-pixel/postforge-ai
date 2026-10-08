import { describe, expect, it } from 'vitest';
import { buildPrompt, DEFAULT_AI, parseAiReply, validateAi } from '@/lib/ai';
import { DEFAULT_VOICE, type Brief } from '@/lib/types';

const brief: Brief = { idea: 'We launched dark mode.', platforms: ['x', 'linkedin'], goal: 'announce', tone: 'bold', emoji: false, hashtags: true };

describe('AI settings', () => {
  it('is fine offline and validates online settings', () => {
    expect(validateAi(DEFAULT_AI)).toBeNull();
    expect(validateAi({ ...DEFAULT_AI, engine: 'ai' })).toMatch(/API key/);
    expect(validateAi({ ...DEFAULT_AI, engine: 'ai', apiKey: 'k', baseUrl: 'http://api.example.com' })).toMatch(/https/);
    expect(validateAi({ ...DEFAULT_AI, engine: 'ai', apiKey: 'k', baseUrl: 'http://localhost:11434/v1' })).toBeNull();
  });
});

describe('AI prompt and reply', () => {
  it('includes platform limits, voice rules and the no-invention rule', () => {
    const p = buildPrompt(brief, { ...DEFAULT_VOICE, bannedWords: ['synergy'], signature: '— Acme' });
    expect(p).toContain('X: max 280 characters');
    expect(p).toContain('synergy');
    expect(p).toContain('— Acme');
    expect(p).toMatch(/never invent numbers/);
  });
  it('accepts fenced JSON, drops unknown platforms and threads long X posts', () => {
    const long = 'Sentence that keeps going for a while. '.repeat(12);
    const raw = '```json\n' + JSON.stringify({ posts: [{ platform: 'x', style: 'Short', text: 'Dark mode is here. Try it?' }, { platform: 'x', text: long }, { platform: 'instagram', text: 'not asked for' }, { platform: 'linkedin', text: 'Dark mode shipped. What next?' }] }) + '\n```';
    const out = parseAiReply(raw, brief.platforms);
    expect(out.map((v) => v.platform)).toEqual(['x', 'x', 'linkedin']);
    expect(out[1].thread!.length).toBeGreaterThan(1);
    expect(out[1].style).toBe('Thread');
  });
  it('rejects malformed replies', () => {
    expect(() => parseAiReply('not json', ['x'])).toThrow(/valid JSON/);
    expect(() => parseAiReply('{"posts": "nope"}', ['x'])).toThrow(/expected format/);
  });
});
