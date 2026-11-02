import { useEffect, useRef } from 'react';
import { Animation } from '../types';
import { startClickAnimations } from '../codegen/clickAnimations.js';

/** Animate the visual only, keeping editor selection and resize handles stationary. */
export function useElementAnimations(animations: Animation[] | undefined, paused = false) {
  const ref = useRef<HTMLDivElement>(null);
  const key = JSON.stringify(animations || []);
  useEffect(() => {
    if (!ref.current || paused || !animations?.length) return;
    return startClickAnimations(ref.current, {editor:true});
  }, [key, paused]);
  return ref;
}
