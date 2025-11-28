import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter Variable"', 'system-ui', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: '#2563eb', // blue-600
          foreground: '#ffffff',
        },
        accent: {
          DEFAULT: '#4f46e5', // indigo-600
          foreground: '#ffffff',
        },
        warning: {
          DEFAULT: '#f59e0b', // amber-500
          foreground: '#111827',
        },
        danger: {
          DEFAULT: '#dc2626', // red-600
          foreground: '#ffffff',
        },
        success: {
          DEFAULT: '#16a34a', // emerald-600
          foreground: '#ffffff',
        },
        muted: {
          DEFAULT: '#e5e7eb', // slate-200
          foreground: '#374151', // slate-700
        },
      },
    },
  },
  plugins: [],
};

export default config;
