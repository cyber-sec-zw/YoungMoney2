import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

type Theme = 'dark' | 'light';
export type ColorPalette = 'original' | 'true-pink' | 'tiffany' | 'charcoal-violet' | 'cyprus' | 'turmeric';
export const COLOR_PALETTES: { id: ColorPalette; name: string; detail: string; swatch: string }[] = [
  { id: 'original', name: 'Original Ember', detail: 'Orange · gold', swatch: '#f97316' },
  { id: 'true-pink', name: 'True Pink', detail: 'Chill white · dark gray', swatch: '#e74791' },
  { id: 'tiffany', name: 'Tiffany', detail: 'Tiffany blue · dark gray', swatch: '#0ab7b2' },
  { id: 'charcoal-violet', name: 'Charcoal Violet', detail: 'Violet · cyber lime', swatch: '#9174f5' },
  { id: 'cyprus', name: 'Cyprus', detail: 'Deep teal · sand', swatch: '#247c69' },
  { id: 'turmeric', name: 'Turmeric', detail: 'Turmeric · malt', swatch: '#d99d18' },
];
interface ThemeCtx { theme: Theme; palette: ColorPalette; toggle: () => void; setPalette: (palette: ColorPalette) => void; }

const ThemeContext = createContext<ThemeCtx>({ theme: 'dark', palette: 'original', toggle: () => {}, setPalette: () => {} });

const isPalette = (value: string | null): value is ColorPalette => COLOR_PALETTES.some(palette => palette.id === value);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('journal-theme') as Theme | null;
    return saved || 'dark';
  });
  const [palette, setPalette] = useState<ColorPalette>(() => {
    const saved = localStorage.getItem('journal-palette');
    return isPalette(saved) ? saved : 'original';
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.dataset.palette = palette;
    localStorage.setItem('journal-theme', theme);
    localStorage.setItem('journal-palette', palette);
  }, [theme, palette]);

  const toggle = () => setTheme(t => (t === 'dark' ? 'light' : 'dark'));

  return <ThemeContext.Provider value={{ theme, palette, toggle, setPalette }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
