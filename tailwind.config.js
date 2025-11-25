/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  safelist: [
    {
      pattern: /^(bg|text|border)-(elegant|gold)-(50|100|200|300|400|500|600|700|800|900)$/,
    },
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          50: '#FFFCF0',
          100: '#FFF8DC',
          200: '#FFF0B3',
          300: '#FFE485',
          400: '#FFD700',
          500: '#DAA520',
          600: '#B8860B',
          700: '#996F00',
          800: '#7A5800',
          900: '#5C4200',
        },
        elegant: {
          50: '#F8F9FA',
          100: '#E9ECEF',
          200: '#DEE2E6',
          300: '#CED4DA',
          400: '#ADB5BD',
          500: '#6C757D',
          600: '#495057',
          700: '#343A40',
          800: '#212529',
          900: '#1C2526',
        },
        gray: {
          50: '#F9FAFB',
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#1F2937',
          900: '#111827',
        },
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        'serif': ['Crimson Text', 'Georgia', 'Times New Roman', 'serif'],
        'display': ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1.5', letterSpacing: '0.025em' }],
        'sm': ['0.875rem', { lineHeight: '1.5', letterSpacing: '0.025em' }],
        'base': ['1rem', { lineHeight: '1.6', letterSpacing: '0.015em' }],
        'lg': ['1.125rem', { lineHeight: '1.6', letterSpacing: '0.015em' }],
        'xl': ['1.25rem', { lineHeight: '1.5', letterSpacing: '0.01em' }],
        '2xl': ['1.5rem', { lineHeight: '1.4', letterSpacing: '0.005em' }],
        '3xl': ['1.875rem', { lineHeight: '1.3', letterSpacing: '0' }],
        '4xl': ['2.25rem', { lineHeight: '1.2', letterSpacing: '-0.01em' }],
        '5xl': ['3rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        '6xl': ['3.75rem', { lineHeight: '1', letterSpacing: '-0.02em' }],
      },
      fontWeight: {
        'light': '300',
        'normal': '400',
        'medium': '500',
        'semibold': '600',
        'bold': '700',
        'extrabold': '800',
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out',
        'slide-in': 'slideIn 0.8s ease-out',
        'float': 'float 3s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 2s infinite',
        'tooltip-fade': 'tooltip-fade 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'tooltip-fade': {
          '0%': { opacity: '0', transform: 'translateY(5px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(-50px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' }
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' }
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' }
        }
      },
      backgroundImage: {
        'gradient-gold': 'linear-gradient(135deg, #FFD700, #DAA520)',
        'gradient-elegant': 'linear-gradient(135deg, #1C2526, #343A40)',
        'gradient-radial': 'radial-gradient(ellipse at center, var(--tw-gradient-stops))',
        'shimmer': 'linear-gradient(90deg, transparent, rgba(255, 215, 0, 0.3), transparent)',
      },
      boxShadow: {
        'gold': '0 4px 20px rgba(255, 215, 0, 0.3)',
        'gold-lg': '0 8px 32px rgba(255, 215, 0, 0.4)',
        'elegant': '0 8px 32px rgba(0, 0, 0, 0.1)',
        'elegant-lg': '0 16px 48px rgba(0, 0, 0, 0.15)',
        'inner-gold': 'inset 0 2px 4px rgba(255, 215, 0, 0.2)',
      },
      backdropBlur: {
        xs: '2px',
      },
      scale: {
        '102': '1.02',
        '103': '1.03',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      }
    },
  },
  plugins: [],
};