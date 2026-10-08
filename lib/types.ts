import type { PlatformId } from './platforms';

export type Goal = 'teach' | 'announce' | 'engage' | 'traffic';
export type Tone = 'professional' | 'friendly' | 'bold' | 'playful';

export interface Brief {
  idea: string;
  platforms: PlatformId[];
  goal: Goal;
  tone: Tone;
  audience?: string;
  link?: string;
  emoji: boolean;
  hashtags: boolean;
}

export interface Voice {
  name: string;
  handle: string;
  signature: string;
  defaultHashtags: string[];
  bannedWords: string[];
}

export interface Variant {
  id: string;
  platform: PlatformId;
  /** label for the structure used, e.g. "List" or "Story" */
  style: string;
  text: string;
  /** X only: the same content split into a thread when it doesn't fit one post */
  thread?: string[];
}

export interface SavedPost {
  id: string;
  platform: PlatformId;
  text: string;
  thread?: string[];
  idea: string;
  createdAt: number;
  /** ISO date-time when scheduled */
  scheduledAt?: string;
  favorite?: boolean;
}

export const DEFAULT_VOICE: Voice = { name: 'Your Brand', handle: 'yourbrand', signature: '', defaultHashtags: [], bannedWords: [] };
