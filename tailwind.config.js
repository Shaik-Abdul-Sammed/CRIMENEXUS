/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        // State Command Center Palette (Figma Token Aligned)
        'bg-primary': '#0A1929',
        'bg-secondary': '#112240',
        'bg-tertiary': '#1E293B',
        'accent-emerald': '#10B981',
        'accent-crimson': '#DC2626',
        'accent-amber': '#F59E0B',
        'accent-indigo': '#6366F1',
        'accent-cyan': '#06B6D4',
        'text-primary': '#FFFFFF',
        'text-secondary': '#E2E8F0',
        'text-muted': '#94A3B8',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        cyber: {
          50: '#f0f4ff',
          100: '#e0e9ff',
          500: '#3b82f6',
          700: '#1d4ed8',
          900: '#0f172a',
          950: '#0b0f19',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Fira Code', 'Menlo', 'Monaco', 'monospace'],
      },
      fontSize: {
        'size-xs': ['12px', { lineHeight: '16px' }],
        'size-sm': ['14px', { lineHeight: '20px' }],
        'size-base': ['16px', { lineHeight: '24px' }],
        'size-lg': ['20px', { lineHeight: '28px' }],
        'size-xl': ['24px', { lineHeight: '32px' }],
        'size-2xl': ['32px', { lineHeight: '40px' }],
        'size-3xl': ['44px', { lineHeight: '52px' }],
      },
      borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px',
      },
      boxShadow: {
        glass: '0 4px 30px rgba(0, 0, 0, 0.1)',
        'glass-elevated': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'glow-emerald': '0 0 15px rgba(16, 185, 129, 0.4)',
        'glow-crimson': '0 0 20px rgba(220, 38, 38, 0.5)',
        'glow-indigo': '0 0 20px rgba(99, 102, 241, 0.35)',
      },
    },
  },
  plugins: [],
};
