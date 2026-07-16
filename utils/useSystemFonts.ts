// utils/useSystemFonts.ts — Hook to load system fonts via Tauri, with web fallback

import { useState, useEffect } from 'react';

const FALLBACK_FONTS = [
  'Arial', 'Arial Black', 'Comic Sans MS', 'Courier New', 'Georgia',
  'Impact', 'Inter', 'Lucida Console', 'Palatino Linotype', 'Tahoma',
  'Times New Roman', 'Trebuchet MS', 'Verdana',
];

let cachedFonts: string[] | null = null;

export function useSystemFonts() {
  const [fonts, setFonts] = useState<string[]>(cachedFonts || FALLBACK_FONTS);
  const [loading, setLoading] = useState(!cachedFonts);

  useEffect(() => {
    if (cachedFonts) return;

    import('@tauri-apps/api/core')
      .then(({ invoke }) => invoke<string[]>('get_system_fonts'))
      .then(result => {
        const merged = Array.from(new Set([...FALLBACK_FONTS, ...result])).sort();
        cachedFonts = merged;
        setFonts(merged);
      })
      .catch(() => {
        cachedFonts = FALLBACK_FONTS;
        setFonts(FALLBACK_FONTS);
      })
      .finally(() => setLoading(false));
  }, []);

  return { fonts, loading };
}
