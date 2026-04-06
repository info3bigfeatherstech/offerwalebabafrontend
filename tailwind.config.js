/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
       satoshi: ['Satoshi', 'sans-serif'],
        display: ["Inter", "system-ui", "sans-serif"],
      },
      colors: {
        primary: "#0a1128",
        "primary-light": "#1a2a4e",
        secondary: "#e31e24",
        "secondary-hover": "#c2181d",
        accent: "#09cdff",
      },
    },
  },
  plugins: [],
};
