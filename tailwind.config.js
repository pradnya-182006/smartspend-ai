/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#0B1F3A',
          light: '#122444',
          dark: '#071428',
          hover: '#163152',
        },
        brand: {
          emerald: '#10B981',
          indigo: '#635BDB',
          amber: '#F59E0B',
          red: '#EF4444',
        },
        surface: {
          bg: '#F4F7FB',
          card: '#FFFFFF',
          border: '#E2E8F0',
          muted: '#F8FAFC',
        },
        text: {
          dark: '#1E293B',
          muted: '#64748B',
          light: '#94A3B8',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0,0,0,0.05), 0 4px 12px rgba(0,0,0,0.04)',
        'card-hover': '0 4px 16px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.05)',
        'navy': '0 4px 24px rgba(11,31,58,0.25)',
        'indigo': '0 4px 16px rgba(99,91,219,0.3)',
        'emerald': '0 4px 16px rgba(16,185,129,0.3)',
      },
      animation: {
        'fade-up': 'fadeUp 0.3s cubic-bezier(0.16,1,0.3,1) forwards',
        'fade-in': 'fadeIn 0.2s ease-out forwards',
        'slide-in': 'slideIn 0.25s cubic-bezier(0.16,1,0.3,1) forwards',
        'pulse-dot': 'pulseDot 2s infinite',
        'count-up': 'countUp 0.6s ease-out forwards',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(-12px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        pulseDot: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.5', transform: 'scale(0.8)' },
        },
      },
    },
  },
  plugins: [],
}
