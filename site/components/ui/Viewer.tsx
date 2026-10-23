'use client';
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { he } from '@/content/he';

export type ViewerItem = {
  title: string;
  /** Sources in preference order, e.g. [{src:'/media/x.webm',type:'video/webm'},{src:'/media/x.mp4',type:'video/mp4'}] */
  sources: { src: string; type: string }[];
  poster?: string;
  /** 'portrait' (9:16), 'wide' (16:9), 'cinema' (2.39:1) */
  aspect?: 'portrait' | 'wide' | 'cinema';
  note?: string;
};

type Ctx = { open: (item: ViewerItem, opener?: HTMLElement | null) => void; close: () => void };
const ViewerCtx = createContext<Ctx>({ open: () => {}, close: () => {} });
export const useViewer = () => useContext(ViewerCtx);

/** One <dialog> for every video on the site: the showreel, the gallery, the opening film. */
export function ViewerProvider({ children }: { children: ReactNode }) {
  const [item, setItem] = useState<ViewerItem | null>(null);
  const [failed, setFailed] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const opener = useRef<HTMLElement | null>(null);

  const close = useCallback(() => {
    const d = dialog.current;
    if (d?.open) d.close();
  }, []);

  const open = useCallback((it: ViewerItem, from?: HTMLElement | null) => {
    opener.current = from ?? (document.activeElement as HTMLElement | null);
    setFailed(false);
    setItem(it);
  }, []);

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (item && !d.open) {
      d.showModal();
      document.documentElement.style.overflow = 'hidden';
      const v = video.current;
      if (v) { v.load(); v.play().catch(() => {}); }
    }
    const onClose = () => {
      document.documentElement.style.overflow = '';
      const v = video.current; if (v) { v.pause(); }
      setItem(null);
      opener.current?.focus?.();
    };
    d.addEventListener('close', onClose);
    return () => d.removeEventListener('close', onClose);
  }, [item]);

  return (
    <ViewerCtx.Provider value={{ open, close }}>
      {children}
      <dialog ref={dialog} className="viewer" aria-labelledby="viewer-title" onClick={(e) => { if (e.target === dialog.current) close(); }}>
        <div className={`viewer-inner aspect-${item?.aspect ?? 'wide'}`}>
          <header className="viewer-head">
            <h2 id="viewer-title" className="viewer-title">{item?.title ?? ''}</h2>
            <button type="button" className="btn btn-ghost" onClick={close}>{he.viewer.close}</button>
          </header>
          <div className="viewer-body">
            {item && !failed && (
              <video ref={video} controls playsInline poster={item.poster} preload="metadata" onError={() => setFailed(true)}>
                {item.sources.map((s) => <source key={s.src} src={s.src} type={s.type} />)}
              </video>
            )}
            {failed && <p className="viewer-fail">{he.viewer.unavailable}</p>}
          </div>
          {item?.note && <p className="viewer-note">{item.note}</p>}
        </div>
      </dialog>
    </ViewerCtx.Provider>
  );
}
