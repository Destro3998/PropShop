/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
      "./views/**/*.{html,js}",
      "./views/index.html",
      "./views/layouts/main.handlebars",
      ".views/**/*.{html,js,handlebars}",
      ".views/*.{html,js,handlebars}",
      "./views/layouts/*.{handlebars,js,html}"
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}

