import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        void: '#09010f',
        cosmos: '#140025',
        nebula: '#1e0035',
        violet: {
          DEFAULT: '#7c3aed',
          light: '#c4b5fd',
          dark: '#4c1d95',
        },
        rose: {
          DEFAULT: '#ec4899',
          light: '#f9a8d4',
          dark: '#9d174d',
        },
        star: '#f8fafc',
        muted: '#6b7280',
      },
      fontFamily: {
        display: ['var(--font-playfair)', 'serif'],
        body: ['var(--font-inter)', 'sans-serif'],
      },
      backgroundImage: {
        'cosmic-gradient': 'linear-gradient(135deg, #09010f 0%, #140025 50%, #09010f 100%)',
        'violet-glow': 'radial-gradient(ellipse at 50% 0%, rgba(124,58,237,0.3) 0%, transparent 70%)',
      },
    },
  },
  plugins: [],
}

export default config
