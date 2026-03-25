/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './templates/**/*.html',
    './core/templates/**/*.html',
    './inventory/templates/**/*.html',
    './sales/templates/**/*.html',
    './node_modules/flowbite/**/*.js',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: 'var(--color-primary-50, #eef2ff)',
          100: 'var(--color-primary-100, #e0e7ff)',
          200: 'var(--color-primary-200, #c7d2fe)',
          300: 'var(--color-primary-300, #a5b4fc)',
          400: 'var(--color-primary-400, #818cf8)',
          500: 'var(--color-primary-500, #6366f1)',
          600: 'var(--color-primary-600, #4f46e5)',
          700: 'var(--color-primary-700, #4338ca)',
          800: 'var(--color-primary-800, #3730a3)',
          900: 'var(--color-primary-900, #312e81)',
          950: 'var(--color-primary-950, #1e1b4b)',
        },
        white: 'var(--color-white, #ffffff)',
        gray: {
          50: 'var(--color-gray-50, #f8fafc)',
          100: 'var(--color-gray-100, #f1f5f9)',
          200: 'var(--color-gray-200, #e2e8f0)',
          300: 'var(--color-gray-300, #cbd5e1)',
          400: 'var(--color-gray-400, #94a3b8)',
          500: 'var(--color-gray-500, #64748b)',
          600: 'var(--color-gray-600, #475569)',
          700: 'var(--color-gray-700, #334155)',
          800: 'var(--color-gray-800, #1e293b)',
          900: 'var(--color-gray-900, #0f172a)',
          950: 'var(--color-gray-950, #020617)',
        },
        surface: {
          700: 'var(--color-surface-700, #1e293b)',
          800: 'var(--color-surface-800, #0f172a)',
          900: 'var(--color-surface-900, #020617)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [
    require('flowbite/plugin'),
  ],
};
