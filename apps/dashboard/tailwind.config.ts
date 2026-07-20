import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#050d1a',
          800: '#0a1628',
          700: '#0f2040',
          600: '#132952'
        },
        emerald: {
          400: '#34d399',
          500: '#10b981',
          600: '#059669'
        },
        rose: {
          400: '#fb7185',
          500: '#f43f5e'
        },
        amber: {
          400: '#fbbf24',
          500: '#f59e0b'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace']
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'grid-pattern': "url(\"data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 40 L40 0' stroke='%230f2040' stroke-width='1'/%3E%3C/svg%3E\")"
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-in': 'slideIn 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease-out',
        'glow': 'glow 2s ease-in-out infinite alternate'
      },
      keyframes: {
        slideIn: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        glow: {
          '0%': { boxShadow: '0 0 5px #10b981, 0 0 10px #10b981' },
          '100%': { boxShadow: '0 0 20px #10b981, 0 0 40px #10b98140' }
        }
      }
    }
  },
  plugins: []
};

export default config;
