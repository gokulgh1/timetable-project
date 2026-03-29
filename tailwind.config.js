/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        mono: ['DM Mono', 'monospace'],
      },
      colors: {
        bg: {
          1: '#0f1117',
          2: '#161b27',
          3: '#1e2535',
          4: '#252d3d',
        },
        border: {
          1: '#2a3347',
          2: '#3a4560',
        },
        txt: {
          1: '#e8eaf0',
          2: '#8892a4',
          3: '#4a5568',
        },
      },
    },
  },
  plugins: [],
}
