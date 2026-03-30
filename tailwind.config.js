/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    // Root templates (base.html, auth, dashboard, pos, valuting, financials, ledger, payroll, branches, core feature pages)
    './templates/**/*.html',
    // App-level templates (inventory, core)
    './core/templates/**/*.html',
    './inventory/templates/**/*.html',
    // Static JS files may contain inline class references
    './static/js/**/*.js',
    // Flowbite component classes
    './node_modules/flowbite/**/*.js',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f7f8ev',
          100: '#ecedc7',
          200: '#dbe09b',
          300: '#c4cb6a',
          400: '#abb246',
          500: '#949b33',
          600: '#7d8025', // Main Logo Color
          700: '#5c5f1c',
          800: '#3f421f',
          900: '#262914',
          950: '#141609',
        },
        secondary: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
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
        pos: {
          'navy-dark': '#1a3a5c',
          'navy-mid': '#2c4a6e',
          'purple': '#6a1b9a',
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
