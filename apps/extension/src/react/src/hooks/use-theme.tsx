import { useEffect, useState } from 'react';
import { Theme, EffectiveTheme } from '@repo/shared/types/app-settings';

type UseThemeProps = {
  onThemeChange(theme: EffectiveTheme): void;
  defaultTheme?: Theme;
  storageKey?: string;
};

export function useTheme({
  onThemeChange,
  defaultTheme = 'system',
  storageKey = 'vite-ui-theme',
}: UseThemeProps) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  );

  const [effectiveTheme, setEffectiveTheme] = useState<'light' | 'dark'>(
    'light'
  );

  useEffect(() => {
    const root = window.document.documentElement;

    root.classList.remove('light', 'dark');

    let effectiveTheme: 'light' | 'dark';

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)')
        .matches
        ? 'dark'
        : 'light';

      effectiveTheme = systemTheme;
    } else {
      effectiveTheme = theme;
    }

    root.classList.add(effectiveTheme);
    setEffectiveTheme(effectiveTheme);
  }, [theme]);

  // Listen for system theme changes when using system theme
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      const root = window.document.documentElement;
      root.classList.remove('light', 'dark');

      const systemTheme = mediaQuery.matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
      setEffectiveTheme(systemTheme);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  const toggleTheme = () => {
    const newTheme = effectiveTheme === 'light' ? 'dark' : 'light';
    localStorage.setItem(storageKey, newTheme);
    setTheme(newTheme);
    onThemeChange(newTheme);
  };

  return {
    effectiveTheme,
    setTheme,
    toggleTheme,
  };
}
