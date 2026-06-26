module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        slate: {
          950: '#020617',
          900: '#0f172a',
          800: '#1e293b',
          400: '#94a3b8',
          100: '#f8fafc',
        },
        sky: {
          500: '#0ea5e9',
          400: '#38bdf8',
        },
      },
    },
  },
  plugins: [],
}
