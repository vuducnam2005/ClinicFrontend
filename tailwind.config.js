/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,ts}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 18px 60px rgba(15, 23, 42, 0.10)',
        card: '0 12px 36px rgba(15, 23, 42, 0.08)',
      },
      backgroundImage: {
        'hero-clinic':
          'linear-gradient(120deg, rgba(240,253,250,0.96) 0%, rgba(236,254,255,0.88) 46%, rgba(255,255,255,0.68) 100%), url("https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&w=2200&q=80")',
      },
    },
  },
  plugins: [],
}
