/** @format */

module.exports = {
  purge: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  theme: {
    extend: {
      backgroundColor: {
        "gray-474": "#474747",
        "gray-353": "#353a3c",
        "gray-303": "#30383b",
        "gray-262": "#262a2b",
        "gray-333": "#33373a",
        "gray-1a1": "#1a1d1e",
        "gray-232": "#232627",
        "red-b70": "#b70e0e",
        "blue-1c4": "#1c4f7a",
        "gray-3f3": "#3f3f42",
        "red-9b2": "#9b2d2d",
      },
      textColor: {
        "gray-f0f": "#f0f0f0",
        "gray-aaa": "#aaa",
      },
      borderColor: {
        "gray-5e7": "#5e7a86",
        "gray-ccc": "#ccc",
      },
    },
  },
  plugins: [],
};
