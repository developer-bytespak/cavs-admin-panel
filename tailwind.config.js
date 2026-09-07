/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Surfaces
        canvas: '#F6F7F9',
        warm: '#F7F4EE',
        card: '#FFFFFF',
        // Dark identity
        midnight: '#080D18',
        'midnight-2': '#0C1424',
        navy: '#0B1F45',
        'navy-2': '#122C5C',
        // Cavs brand
        royal: '#1746C7',
        electric: '#2864FF',
        'royal-tint': '#EDF2FE',
        orange: '#F05A1A',
        'orange-tint': '#FFF0E8',
        'orange-soft': '#FDBA9A',
        // Ink
        ink: '#111318',
        'ink-2': '#3D4351',
        'ink-3': '#737984',
        'ink-4': '#9BA1AC',
        // Lines
        line: '#E6E8EE',
        'line-soft': '#F0F2F6',
        // Status
        good: '#0E8F63',
        'good-tint': '#E7F6EF',
        warn: '#B77900',
        'warn-tint': '#FDF4E3',
        bad: '#C93A45',
        'bad-tint': '#FCECED',
        // Categorical series (validated: light mode, all 6 checks pass)
        's1': '#1746C7',
        's2': '#F05A1A',
        's3': '#0E9F8E',
        's4': '#7C5CE0',
        's5': '#B77900',
        's6': '#D9457F',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        display: ['"Barlow Condensed"', 'Inter', 'sans-serif'],
      },
      borderRadius: { xl: '14px', '2xl': '18px', '3xl': '22px' },
      /* Finer opacity steps so the dark Arena surfaces can be tuned precisely. */
      opacity: Object.fromEntries(
        [2, 3, 4, 6, 7, 8, 9, 11, 12, 13, 14, 16, 18, 22, 24, 26, 28, 32, 34, 36, 38, 42, 44, 46, 48,
         52, 54, 56, 58, 62, 64, 66, 68, 72, 74, 76, 78, 82, 84, 86, 88, 92, 94, 96, 98]
          .map((n) => [String(n), String(n / 100)])
      ),
      boxShadow: {
        card: '0 1px 2px rgba(17,19,24,0.04), 0 1px 1px rgba(17,19,24,0.02)',
        lift: '0 6px 20px -6px rgba(17,19,24,0.10), 0 2px 6px -2px rgba(17,19,24,0.05)',
        pop: '0 16px 48px -12px rgba(11,31,69,0.22), 0 4px 12px -4px rgba(17,19,24,0.08)',
        arena: '0 0 0 1px rgba(255,255,255,0.06), 0 24px 60px -20px rgba(0,0,0,0.7)',
        glow: '0 0 24px -4px rgba(240,90,26,0.45)',
      },
      fontSize: {
        '2xs': ['10px', { lineHeight: '13px', letterSpacing: '0.08em' }],
      },
      transitionTimingFunction: {
        premium: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      keyframes: {
        'live-pulse': {
          '0%,100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.45', transform: 'scale(0.86)' },
        },
        'ring-pulse': {
          '0%': { transform: 'scale(1)', opacity: '0.55' },
          '100%': { transform: 'scale(2.4)', opacity: '0' },
        },
        shimmer: { '100%': { transform: 'translateX(100%)' } },
        'fade-up': { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'none' } },
      },
      animation: {
        'live-pulse': 'live-pulse 1.8s cubic-bezier(0.4,0,0.6,1) infinite',
        'ring-pulse': 'ring-pulse 1.8s cubic-bezier(0.4,0,0.6,1) infinite',
        shimmer: 'shimmer 1.6s infinite',
        'fade-up': 'fade-up 0.4s cubic-bezier(0.22,1,0.36,1) both',
      },
    },
  },
  plugins: [],
}
