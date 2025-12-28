/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#34C98E',
        'primary-dark': '#2BA876',
        navy: '#1E293B',
        'muted-gray': '#64748B',
        'bg-base': '#FEFFFE',
        'bg-accent': '#F0FDF8',
        'border-light': 'rgba(203, 213, 225, 0.5)',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        'card': '0 2px 8px 0 rgba(0, 0, 0, 0.06)',
        'card-hover': '0 4px 12px 0 rgba(0, 0, 0, 0.08)',
      },
    },
  },
  plugins: [],
}
