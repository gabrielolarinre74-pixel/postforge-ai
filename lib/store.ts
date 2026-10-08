'use client';

import { useCallback, useEffect, useState } from 'react';
import { DEFAULT_AI, type AiSettings } from './ai';
import { DEFAULT_VOICE, type SavedPost, type Voice } from './types';

const KEYS = { posts: 'pf-posts', voice: 'pf-voice', ai: 'pf-ai' } as const;
const EVENT = 'pf-store';

function read<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const v = JSON.parse(raw);
    return Array.isArray(fallback) ? (Array.isArray(v) ? (v as T) : fallback) : { ...fallback, ...v };
  } catch {
    return fallback; // corrupted storage should never crash the app
  }
}

function write(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent(EVENT, { detail: key }));
}

/** localStorage-backed state shared across components and tabs. */
function useStored<T>(key: string, fallback: T): [T, (v: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(fallback);
  useEffect(() => {
    setValue(read(key, fallback));
    const sync = (e: Event) => {
      const k = e instanceof StorageEvent ? e.key : (e as CustomEvent).detail;
      if (k === key) setValue(read(key, fallback));
    };
    window.addEventListener(EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener('storage', sync);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  const set = useCallback((v: T | ((prev: T) => T)) => {
    const next = typeof v === 'function' ? (v as (p: T) => T)(read(key, fallback)) : v;
    write(key, next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return [value, set];
}

export const usePosts = () => useStored<SavedPost[]>(KEYS.posts, []);
export const useVoice = () => useStored<Voice>(KEYS.voice, DEFAULT_VOICE);
export const useAiSettings = () => useStored<AiSettings>(KEYS.ai, DEFAULT_AI);

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
