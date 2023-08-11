/** @format */

module.exports = {
  content: ["./src/**/*.html", "./src/**/*.js", "./src/**/*.css"],
  theme: {
    extend: {
      fontFamily: {
        anonymous: ['"Anonymous Pro"', "monospace"],
      },
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
        whitesmoke: "whitesmoke",
      },
      textColor: {
        "gray-f0f": "#f0f0f0",
        "gray-aaa": "#aaa",
      },
      borderColor: {
        "gray-5e7": "#5e7a86",
        "gray-ccc": "#ccc",
      },
      boxShadow: {
        custom:
          "0px 3px 1px -2px rgba(0,0,0,0.2), 0px 2px 2px 0px rgba(0,0,0,0.14), 0px 1px 5px 0px rgba(0,0,0,0.12)",
      },
    },
  },
  plugins: [],
};
