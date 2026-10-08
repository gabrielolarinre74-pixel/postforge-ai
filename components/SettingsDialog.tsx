'use client';

import { useEffect, useState } from 'react';
import { Cpu, Eye, EyeOff, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import { Btn, Modal } from './Modal';
import { useAiSettings, useVoice } from '@/lib/store';
import { validateAi, type AiSettings } from '@/lib/ai';
import type { Voice } from '@/lib/types';

const list = (s: string) => s.split(',').map((x) => x.trim()).filter(Boolean);

export function SettingsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [ai, setAi] = useAiSettings();
  const [voice, setVoice] = useVoice();
  const [tab, setTab] = useState<'voice' | 'engine'>('voice');
  const [draftAi, setDraftAi] = useState<AiSettings>(ai);
  const [draftVoice, setDraftVoice] = useState<Voice>(voice);
  const [tags, setTags] = useState('');
  const [banned, setBanned] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setDraftAi(ai);
    setDraftVoice(voice);
    setTags(voice.defaultHashtags.join(', '));
    setBanned(voice.bannedWords.join(', '));
    setError('');
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = () => {
    const problem = validateAi(draftAi);
    if (problem) {
      setTab('engine');
      return setError(problem);
    }
    setAi({ ...draftAi, apiKey: draftAi.apiKey.trim() });
    setVoice({ ...draftVoice, handle: draftVoice.handle.replace(/^@/, '').trim(), defaultHashtags: list(tags).slice(0, 5), bannedWords: list(banned).slice(0, 30) });
    toast.success('Settings saved');
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Settings" subtitle="Your brand voice and how posts are written. Stored only in this browser." footer={<><Btn variant="ghost" onClick={onClose}>Cancel</Btn><Btn onClick={save}>Save settings</Btn></>}>
      <div className="mb-5 grid grid-cols-2 gap-1 rounded-xl bg-ink-100 p-1">
        {(['voice', 'engine'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={clsx('h-8 rounded-lg text-[13px] font-semibold', tab === t ? 'bg-white shadow-card' : 'text-ink-500')}>{t === 'voice' ? 'Brand voice' : 'Writing engine'}</button>
        ))}
      </div>
      {tab === 'voice' ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label" htmlFor="vn">Display name</label><input id="vn" className="field" maxLength={40} value={draftVoice.name} onChange={(e) => setDraftVoice({ ...draftVoice, name: e.target.value })} /></div>
            <div><label className="label" htmlFor="vh">Handle</label><input id="vh" className="field" maxLength={30} value={draftVoice.handle} onChange={(e) => setDraftVoice({ ...draftVoice, handle: e.target.value })} /></div>
          </div>
          <div><label className="label" htmlFor="vs">Signature <span className="font-normal text-ink-400">(added to every post)</span></label><input id="vs" className="field" maxLength={80} placeholder="e.g. — The Acme team" value={draftVoice.signature} onChange={(e) => setDraftVoice({ ...draftVoice, signature: e.target.value })} /></div>
          <div><label className="label" htmlFor="vt">Always-on hashtags <span className="font-normal text-ink-400">(comma separated, up to 5)</span></label><input id="vt" className="field" placeholder="buildinpublic, saas" value={tags} onChange={(e) => setTags(e.target.value)} /></div>
          <div><label className="label" htmlFor="vb">Words to avoid <span className="font-normal text-ink-400">(flagged by the linter)</span></label><input id="vb" className="field" placeholder="synergy, game-changer, revolutionary" value={banned} onChange={(e) => setBanned(e.target.value)} /></div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2.5">
            {([['offline', Cpu, 'Offline', 'Built-in composer. No key, nothing leaves your device.'], ['ai', Sparkles, 'AI model', 'Any OpenAI-compatible API writes the drafts.']] as const).map(([id, Icon, name, desc]) => (
              <button key={id} onClick={() => setDraftAi({ ...draftAi, engine: id })} aria-pressed={draftAi.engine === id} className={clsx('rounded-2xl border p-4 text-left transition', draftAi.engine === id ? 'border-ink-950 ring-4 ring-ink-950/5' : 'border-ink-200 hover:border-ink-300')}>
                <span className={clsx('mb-3 grid size-8 place-items-center rounded-lg', draftAi.engine === id ? 'bg-ocean text-white' : 'bg-ink-100 text-ink-600')}><Icon className="size-4" /></span>
                <div className="text-[14px] font-semibold">{name}</div>
                <div className="mt-0.5 text-[12px] leading-snug text-ink-500">{desc}</div>
              </button>
            ))}
          </div>
          {draftAi.engine === 'ai' && (
            <>
              <div>
                <label className="label" htmlFor="key">API key</label>
                <div className="relative">
                  <input id="key" className="field pr-10 font-mono" type={show ? 'text' : 'password'} autoComplete="off" placeholder="sk-…" value={draftAi.apiKey} onChange={(e) => setDraftAi({ ...draftAi, apiKey: e.target.value })} />
                  <button className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400" onClick={() => setShow(!show)} aria-label="Toggle key visibility">{show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button>
                </div>
              </div>
              <div className="grid grid-cols-[1fr_150px] gap-3">
                <div><label className="label" htmlFor="url">Base URL</label><input id="url" className="field font-mono" value={draftAi.baseUrl} onChange={(e) => setDraftAi({ ...draftAi, baseUrl: e.target.value })} /></div>
                <div><label className="label" htmlFor="model">Model</label><input id="model" className="field font-mono" value={draftAi.model} onChange={(e) => setDraftAi({ ...draftAi, model: e.target.value })} /></div>
              </div>
              <p className="rounded-xl bg-sea-50 px-3.5 py-2.5 text-[12px] leading-relaxed text-sea-700">The key is sent only to the base URL above. Replies are checked against a strict schema and the platform limits before they are shown.</p>
            </>
          )}
        </div>
      )}
      {error && <p className="mt-4 text-[13px] font-medium text-red-600">{error}</p>}
    </Modal>
  );
}
