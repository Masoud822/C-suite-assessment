export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          light: '#FAF8F6',
          primary: '#003A8F',
          pink: '#EB9BAF',
        }
      },
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
        handwriting: ['Caveat', 'cursive'],
        amsterdam: ['"Amsterdam Handwriting"', 'Caveat', 'cursive'],
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(to bottom, rgba(0,58,143,0.8) 53.85%, rgba(160,158,156,0.01) 100%)',
      }
    },
  },
  plugins: [],
}
