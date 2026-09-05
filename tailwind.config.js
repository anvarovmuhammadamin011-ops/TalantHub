/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#1F2430',
          2: '#6B7280',
          3: '#9CA3AF',
        },
        bg: '#F8F9FB',
        surface: '#F8F9FB',
        border: {
          DEFAULT: '#E5E7EB',
          soft: '#EEF0F3',
        },
        accent: {
          DEFAULT: '#6366F1',
          soft: '#EEF0FE',
          hover: '#5457E5',
          light: '#EEF0FE',
          dark: '#5457E5',
        },
        success: {
          DEFAULT: '#15803D',
          soft: '#DCFCE7',
        },
        danger: {
          DEFAULT: '#B91C1C',
          soft: '#FEE2E2',
        },
        primary: {
          DEFAULT: '#6366F1',
          light: '#EEF0FE',
          dark: '#5457E5',
        },
        'text-primary': '#1F2430',
        'text-secondary': '#6B7280',
        'text-muted': '#9CA3AF',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        xl: '14px',
      },
      boxShadow: {
        sm: '0 1px 3px rgba(16, 24, 40, 0.05)',
      },
    },
  },
  plugins: [],
}
