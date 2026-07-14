import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#000000',
          soft: '#1a1a1a',
        },
        canvas: {
          DEFAULT: '#ffffff',
          soft: '#f7f7f8',
        },
        hairline: '#e5e5e5',
        body: '#737373',
        link: '#057dbc',
        success: '#16a34a',
        warning: '#d97706',
        danger: '#dc2626',
      },
      fontFamily: {
        display: ['Playfair Display', 'Georgia', 'serif'],
        body: ['Lora', 'Source Serif Pro', 'Georgia', 'serif'],
        sans: ['Inter', 'Manrope', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      borderRadius: {
        none: '0px',
        sm: '2px',
        md: '4px',
        lg: '6px',
        full: '9999px',
      },
      fontSize: {
        'display-hero': ['56px', { lineHeight: '52px', letterSpacing: '-0.5px', fontWeight: '400' }],
        'display-lg': ['40px', { lineHeight: '44px', letterSpacing: '-0.4px', fontWeight: '400' }],
        'display-md': ['28px', { lineHeight: '32px', letterSpacing: '-0.3px', fontWeight: '400' }],
        'display-sm': ['22px', { lineHeight: '28px', letterSpacing: '0', fontWeight: '400' }],
        'display-xs': ['18px', { lineHeight: '24px', letterSpacing: '-0.2px', fontWeight: '700' }],
        'body-lg': ['17px', { lineHeight: '26px', letterSpacing: '0.05px' }],
        'body-md': ['15px', { lineHeight: '22px', letterSpacing: '0' }],
        'body-sm': ['13px', { lineHeight: '18px', letterSpacing: '0.2px' }],
        'caption': ['11px', { lineHeight: '16px', letterSpacing: '0.2px' }],
        'button': ['13px', { lineHeight: '18px', letterSpacing: '0.3px', fontWeight: '600' }],
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-in-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'slide-in-up': 'slideInUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideInUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
