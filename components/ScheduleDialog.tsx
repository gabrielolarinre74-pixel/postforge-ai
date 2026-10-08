'use client';

import { useEffect, useState } from 'react';
import { Btn, Modal } from './Modal';
import { PlatformBadge } from './PostPreview';
import { nextSlot } from '@/lib/calendar';
import type { PlatformId } from '@/lib/platforms';
import type { SavedPost } from '@/lib/types';

const pad = (n: number) => String(n).padStart(2, '0');
const toLocalInput = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

export function ScheduleDialog({ open, onClose, platform, preview, posts, initial, onConfirm }: {
  open: boolean; onClose: () => void; platform?: PlatformId; preview?: string; posts: SavedPost[]; initial?: string; onConfirm: (iso: string) => void;
}) {
  const [value, setValue] = useState('');
  useEffect(() => {
    if (!open) return;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setValue(toLocalInput(initial ? new Date(initial) : nextSlot(tomorrow, posts)));
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  const when = value ? new Date(value) : null;
  const past = when ? when.getTime() < Date.now() : false;
  return (
    <Modal open={open} onClose={onClose} title="Schedule post" subtitle="Adds it to your content calendar. Export the calendar to get reminders." width="max-w-md"
      footer={<><Btn variant="ghost" onClick={onClose}>Cancel</Btn><Btn variant="ocean" disabled={!when || Number.isNaN(when.getTime())} onClick={() => { onConfirm(new Date(value).toISOString()); onClose(); }}>Add to calendar</Btn></>}>
      {platform && preview && (
        <div className="mb-4 flex gap-2.5 rounded-xl bg-ink-50 p-3">
          <PlatformBadge id={platform} size="sm" />
          <p className="line-clamp-2 text-[12.5px] text-ink-600">{preview}</p>
        </div>
      )}
      <label className="label" htmlFor="when">Date and time</label>
      <input id="when" type="datetime-local" className="field" value={value} onChange={(e) => setValue(e.target.value)} />
      {past && <p className="mt-2 text-[12px] font-medium text-amber-600">That time is in the past.</p>}
    </Modal>
  );
}
