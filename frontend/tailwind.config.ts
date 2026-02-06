import type { Config } from 'tailwindcss';
import { activeTheme } from './lib/theme/palettes';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: activeTheme.primary,
        secondary: activeTheme.secondary,
        accent: activeTheme.accent,
        // @ts-ignore - handling the fact that some earlier themes might not have these defined yet implies we should backfill or use optional chaining in a real app,
        // but for now we are switching to autoSecure which has them.
        // For safety, we keep hardcoded fallbacks if the active theme doesn't have them (legacy themes).
        danger: (activeTheme as any).danger || {
          DEFAULT: '#EF4444',
          50: '#FEF2F2',
          100: '#FEE2E2',
          200: '#FECACA',
          300: '#FCA5A5',
          400: '#F87171',
          500: '#EF4444',
          600: '#DC2626',
          700: '#B91C1C',
          800: '#991B1B',
          900: '#7F1D1D',
        },
        success: (activeTheme as any).success || {
          DEFAULT: '#22c55e',
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        warning: (activeTheme as any).warning || {
          DEFAULT: '#eab308',
          50: '#fefce8',
          100: '#fef9c3',
          200: '#fef08a',
          300: '#fde047',
          400: '#facc15',
          500: '#eab308',
          600: '#ca8a04',
          700: '#a16207',
          800: '#854d0e',
          900: '#713f12',
        },
      },
    },
  },
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  plugins: [require('@tailwindcss/forms')],
};

export default config;
