import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '1rem',
      screens: { '2xl': '1280px' },
    },
    extend: {
      colors: {
        bg: '#FAFAF7',
        ink: '#0A0A0A',
        accent: {
          DEFAULT: '#1E40AF',
          50: '#EEF2FF',
          100: '#E0E7FF',
          500: '#6366F1',
          600: '#4F46E5',
          700: '#4338CA',
          900: '#1E1B4B',
        },
        muted: {
          DEFAULT: '#F4F4F0',
          foreground: '#737373',
        },
        border: '#E5E5E0',
      },
      fontFamily: {
        serif: ['"Noto Serif KR"', 'serif'],
        sans: ['Pretendard', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        sm: '4px',
        DEFAULT: '8px',
        md: '12px',
        lg: '16px',
        xl: '20px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(10,10,10,0.04), 0 1px 2px rgba(10,10,10,0.06)',
        elevated: '0 4px 16px rgba(10,10,10,0.06), 0 2px 6px rgba(10,10,10,0.04)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.3s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
