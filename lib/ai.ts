import { z } from 'zod';
import { PLATFORMS, type PlatformId } from './platforms';
import { lengthFor } from './count';
import { splitThread } from './thread';
import type { Brief, Variant, Voice } from './types';

export interface AiSettings {
  engine: 'offline' | 'ai';
  apiKey: string;
  baseUrl: string;
  model: string;
}

export const DEFAULT_AI: AiSettings = { engine: 'offline', apiKey: '', baseUrl: 'https://api.openai.com/v1', model: 'gpt-4o-mini' };

export function validateAi(s: AiSettings): string | null {
  if (s.engine !== 'ai') return null;
  if (!s.apiKey.trim()) return 'Add an API key, or switch to the offline engine.';
  let url: URL;
  try {
    url = new URL(s.baseUrl);
  } catch {
    return 'The base URL is not a valid URL.';
  }
  const local = ['localhost', '127.0.0.1'].includes(url.hostname);
  if (url.protocol !== 'https:' && !(local && url.protocol === 'http:')) return 'The base URL must use https (http is allowed for localhost).';
  if (!s.model.trim()) return 'Choose a model.';
  return null;
}

const Schema = z.object({
  posts: z.array(z.object({
    platform: z.enum(['x', 'linkedin', 'instagram', 'threads']),
    style: z.string().max(40).default('AI draft'),
    text: z.string().min(1).max(4000),
  })).min(1).max(24),
});

export function buildPrompt(brief: Brief, voice: Voice): string {
  const rules = brief.platforms.map((p) => `- ${PLATFORMS[p].name}: max ${PLATFORMS[p].limit} characters, ${PLATFORMS[p].hashtags[0]}-${PLATFORMS[p].hashtags[1]} hashtags${PLATFORMS[p].clickableLinks ? '' : ', links are not clickable (say "link in bio")'}`).join('\n');
  return [
    `Write 3 distinct social posts for each platform listed, from the idea below.`,
    `Goal: ${brief.goal}. Tone: ${brief.tone}.${brief.audience ? ` Audience: ${brief.audience}.` : ''}${brief.link ? ` Link: ${brief.link}.` : ''}`,
    `Emoji: ${brief.emoji ? 'allowed, sparingly' : 'none'}. Hashtags: ${brief.hashtags ? 'yes' : 'none'}.`,
    voice.bannedWords.length ? `Never use these words: ${voice.bannedWords.join(', ')}.` : '',
    voice.signature ? `End every post with this signature: ${voice.signature}` : '',
    `Platform rules:\n${rules}`,
    `Start each post with a strong first line, use only facts from the idea, never invent numbers or customers, and end with a clear next step.`,
    `Reply with JSON only: {"posts":[{"platform":"x|linkedin|instagram|threads","style":"short label","text":"..."}]}`,
    `Idea:\n"""${brief.idea.slice(0, 4000)}"""`,
  ].filter(Boolean).join('\n\n');
}

/** Parse and validate the model reply. Over-long X posts become threads; other over-long posts are dropped. */
export function parseAiReply(raw: string, platforms: PlatformId[]): Variant[] {
  const json = raw.trim().replace(/^```(?:json)?\s*|\s*```$/g, '');
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch {
    throw new Error('The model did not return valid JSON.');
  }
  const parsed = Schema.safeParse(data);
  if (!parsed.success) throw new Error('The model reply did not match the expected format.');
  const counts: Record<string, number> = {};
  return parsed.data.posts
    .filter((p) => platforms.includes(p.platform))
    .flatMap((p): Variant[] => {
      const i = (counts[p.platform] = (counts[p.platform] ?? -1) + 1);
      const v: Variant = { id: `ai-${p.platform}-${i}-${Date.now()}`, platform: p.platform, style: p.style, text: p.text.trim() };
      if (lengthFor(p.platform, v.text) <= PLATFORMS[p.platform].limit) return [v];
      return p.platform === 'x' ? [{ ...v, style: 'Thread', thread: splitThread(v.text) }] : [];
    });
}

export async function composeWithAI(brief: Brief, voice: Voice, s: AiSettings, signal?: AbortSignal): Promise<Variant[]> {
  const res = await fetch(`${s.baseUrl.replace(/\/+$/, '')}/chat/completions`, {
    method: 'POST',
    signal,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${s.apiKey.trim()}` },
    body: JSON.stringify({
      model: s.model,
      temperature: 0.8,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: 'You are a sharp social media copywriter. You only use facts given to you.' },
        { role: 'user', content: buildPrompt(brief, voice) },
      ],
    }),
  });
  if (!res.ok) throw new Error(res.status === 401 ? 'The API key was rejected.' : `The AI service returned ${res.status}.`);
  const body = await res.json();
  const content = body?.choices?.[0]?.message?.content;
  if (typeof content !== 'string') throw new Error('The AI service returned an empty reply.');
  const out = parseAiReply(content, brief.platforms);
  if (!out.length) throw new Error('The model reply had no usable posts.');
  return out;
}
