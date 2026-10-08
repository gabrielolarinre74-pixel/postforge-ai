export type PlatformId = 'x' | 'linkedin' | 'instagram' | 'threads';

export interface Platform {
  id: PlatformId;
  name: string;
  /** hard character limit for a single post */
  limit: number;
  /** comfortable length for the main body (most posts read best well under the limit) */
  sweetSpot: [number, number];
  /** recommended number of hashtags [min, max] */
  hashtags: [number, number];
  /** hard cap on hashtags enforced by the platform, if any */
  maxHashtags?: number;
  /** links in the body are clickable */
  clickableLinks: boolean;
  /** short label used on badges */
  short: string;
}

export const PLATFORMS: Record<PlatformId, Platform> = {
  x: { id: 'x', name: 'X', short: 'X', limit: 280, sweetSpot: [70, 240], hashtags: [0, 2], clickableLinks: true },
  linkedin: { id: 'linkedin', name: 'LinkedIn', short: 'in', limit: 3000, sweetSpot: [400, 1300], hashtags: [2, 5], clickableLinks: true },
  instagram: { id: 'instagram', name: 'Instagram', short: 'IG', limit: 2200, sweetSpot: [150, 1000], hashtags: [3, 12], maxHashtags: 30, clickableLinks: false },
  threads: { id: 'threads', name: 'Threads', short: '@', limit: 500, sweetSpot: [60, 400], hashtags: [0, 1], maxHashtags: 1, clickableLinks: true },
};

export const PLATFORM_IDS = Object.keys(PLATFORMS) as PlatformId[];
