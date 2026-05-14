/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#FAF6F1',
        foreground: '#2D2A26',
        primary: '#8B5E5A',
        'primary-light': '#B89E99',
        accent: '#D4C5B9',
        card: '#FFFFFF',
        border: '#E8DED4',
        muted: '#8A8580',
        danger: '#C75050',
        success: '#5A9E6F',
        secondary: '#E8F0E4',
        'secondary-fg': '#3D5E42',
        info: '#E0EBF5',
        'info-fg': '#3B5998',
      },
      fontFamily: {
        sans: ['"PingFang SC"', '"Microsoft YaHei"', '"Noto Sans SC"', 'sans-serif'],
        serif: ['"Noto Serif SC"', '"STSong"', '"SimSun"', 'serif'],
      },
    },
  },
  plugins: [],
};
