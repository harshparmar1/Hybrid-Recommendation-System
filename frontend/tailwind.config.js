/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        brand: {
          50:  '#f0f4ff',
          100: '#e0eaff',
          200: '#c7d7fe',
          300: '#a5b8fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
        dark: {
          900: '#0a0a0f',
          800: '#0f0f1a',
          700: '#141420',
          600: '#1a1a2e',
          500: '#1e1e35',
          400: '#252540',
          300: '#2e2e50',
        },
        accent: {
          cyan:    '#06b6d4',
          purple:  '#a855f7',
          pink:    '#ec4899',
          emerald: '#10b981',
          amber:   '#f59e0b',
        },
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%)',
        'gradient-card':  'linear-gradient(145deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
      },
      boxShadow: {
        'card':     '0 4px 24px rgba(0,0,0,0.4), 0 1px 4px rgba(0,0,0,0.3)',
        'card-hover': '0 12px 40px rgba(99,102,241,0.25), 0 4px 12px rgba(0,0,0,0.4)',
        'glow':     '0 0 30px rgba(99,102,241,0.3)',
        'glow-lg':  '0 0 60px rgba(99,102,241,0.2)',
      },
      animation: {
        'float':           'float 6s ease-in-out infinite',
        'float-delay':     'float 6s ease-in-out 2s infinite',
        'float-slow':      'float 8s ease-in-out 4s infinite',
        'pulse-glow':      'pulseGlow 3s ease-in-out infinite',
        'shimmer':         'shimmer 1.8s linear infinite',
        'fadeInUp':        'fadeInUp 0.5s ease forwards',
        'spin-slow':       'spin 8s linear infinite',
        'gradient-rotate': 'gradientRotate 3s linear infinite',
        'particle-float':  'particleFloat 15s ease-in-out infinite',
        'particle-float-2':'particleFloat2 20s ease-in-out infinite',
        'particle-float-3':'particleFloat3 18s ease-in-out infinite',
        'heartBeat':       'heartBeat 0.35s ease-in-out',
        'slideInRight':    'slideInRight 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        'slideOutRight':   'slideOutRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'modalIn':         'modalIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'countUp':         'countUp 1.2s ease-out forwards',
        'typewriter':      'typewriter 3s steps(60, end) forwards, blinkCursor 0.75s step-end infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':       { transform: 'translateY(-20px)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.6', transform: 'scale(1)' },
          '50%':       { opacity: '1',   transform: 'scale(1.05)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition:  '200% 0' },
        },
        fadeInUp: {
          from: { opacity: '0', transform: 'translateY(24px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        gradientRotate: {
          '0%':   { backgroundPosition: '0% 50%' },
          '50%':  { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        particleFloat: {
          '0%':   { transform: 'translate(0, 0) rotate(0deg)', opacity: '0' },
          '10%':  { opacity: '1' },
          '50%':  { transform: 'translate(100px, -200px) rotate(180deg)', opacity: '0.6' },
          '90%':  { opacity: '1' },
          '100%': { transform: 'translate(0, 0) rotate(360deg)', opacity: '0' },
        },
        particleFloat2: {
          '0%':   { transform: 'translate(0, 0) scale(1)', opacity: '0' },
          '15%':  { opacity: '0.8' },
          '50%':  { transform: 'translate(-150px, -180px) scale(1.5)', opacity: '0.4' },
          '85%':  { opacity: '0.8' },
          '100%': { transform: 'translate(0, 0) scale(1)', opacity: '0' },
        },
        particleFloat3: {
          '0%':   { transform: 'translate(0, 0) rotate(0deg)', opacity: '0' },
          '20%':  { opacity: '0.6' },
          '50%':  { transform: 'translate(80px, -250px) rotate(90deg)', opacity: '0.3' },
          '80%':  { opacity: '0.6' },
          '100%': { transform: 'translate(0, 0) rotate(0deg)', opacity: '0' },
        },
        heartBeat: {
          '0%':   { transform: 'scale(1)' },
          '25%':  { transform: 'scale(1.3)' },
          '50%':  { transform: 'scale(0.95)' },
          '100%': { transform: 'scale(1)' },
        },
        slideInRight: {
          from: { transform: 'translateX(100%)' },
          to:   { transform: 'translateX(0)' },
        },
        slideOutRight: {
          from: { transform: 'translateX(0)' },
          to:   { transform: 'translateX(100%)' },
        },
        modalIn: {
          from: { opacity: '0', transform: 'scale(0.95) translateY(10px)' },
          to:   { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        countUp: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        typewriter: {
          from: { width: '0' },
          to:   { width: '100%' },
        },
        blinkCursor: {
          '0%, 100%': { borderColor: 'transparent' },
          '50%':       { borderColor: 'rgba(99,102,241,0.7)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
