'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export function Modal({ open, onClose, title, subtitle, children, footer, width = 'max-w-lg' }: {
  open: boolean; onClose: () => void; title: string; subtitle?: string; children: React.ReactNode; footer?: React.ReactNode; width?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open || typeof document === 'undefined') return null;
  return createPortal(
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <div className="absolute inset-0 bg-ink-950/50 backdrop-blur-sm" onClick={onClose} />
      <div role="dialog" aria-modal="true" aria-label={title} className={`relative w-full ${width} animate-rise overflow-hidden rounded-3xl bg-white shadow-lift`}>
        <div className="h-1 bg-ocean" />
        <div className="flex items-start justify-between gap-4 px-6 pb-3 pt-5">
          <div>
            <h2 className="text-[19px] font-semibold tracking-tight">{title}</h2>
            {subtitle && <p className="mt-0.5 text-[13px] text-ink-500">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="grid size-8 place-items-center rounded-full text-ink-500 hover:bg-ink-100 hover:text-ink-950" aria-label="Close"><X className="size-4" /></button>
        </div>
        <div className="max-h-[68vh] overflow-y-auto px-6 pb-5">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-ink-100 bg-ink-50 px-6 py-3.5">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

export function Btn({ variant = 'dark', className = '', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'dark' | 'ocean' | 'ghost' | 'outline' }) {
  const v = {
    dark: 'bg-ink-950 text-white hover:bg-ink-800',
    ocean: 'bg-ocean text-white shadow-sea hover:brightness-110',
    ghost: 'text-ink-600 hover:bg-ink-100 hover:text-ink-950',
    outline: 'border border-ink-200 bg-white text-ink-800 hover:border-ink-300 hover:bg-ink-50',
  }[variant];
  return <button {...props} className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-[13.5px] font-semibold transition active:scale-[.98] disabled:pointer-events-none disabled:opacity-45 [&_svg]:size-4 ${v} ${className}`} />;
}
