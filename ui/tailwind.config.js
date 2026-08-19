/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: "#142530",
          ink: "#ecebec",
          muted: "#848b91",
          accent: "#fa423c",
        },
      },
    },
  },
  corePlugins: {
    preflight: false,
  },
  plugins: [],
};
