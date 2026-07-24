/* Defers the Stage island mount past LCP (DESIGN.md R12): the canvas,
   Lenis, GSAP choreography and the director only boot once the browser is
   idle (requestIdleCallback, setTimeout(0) fallback). */

import { useEffect, useState } from 'react';
import Stage from './Stage';

type IdleWindow = Window & {
  requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
  cancelIdleCallback?: (id: number) => void;
};

export default function DeferredStage() {
  const [idle, setIdle] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const go = () => {
      if (!cancelled) setIdle(true);
    };
    const w = window as IdleWindow;
    if (w.requestIdleCallback) {
      const id = w.requestIdleCallback(go, { timeout: 1200 });
      return () => {
        cancelled = true;
        w.cancelIdleCallback?.(id);
      };
    }
    const id = setTimeout(go, 0);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, []);

  return idle ? <Stage /> : null;
}
