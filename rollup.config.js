// rollup.config.js
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import babel from "@rollup/plugin-babel";
import terser from "@rollup/plugin-terser";
import replace from "@rollup/plugin-replace";

export default {
  input: "weather-widget.js",
  output: {
    file: "weather-widget.min.js",
    format: "iife",
    name: "WeatherWidget",
  },
  plugins: [
    replace({
      "process.env.NODE_ENV": JSON.stringify("production"),
      preventAssignment: true,
    }),
    resolve({
      extensions: [".js", ".jsx"],
    }),
    babel({
      babelHelpers: "bundled",
      presets: ["@babel/preset-env", "@babel/preset-react"],
      exclude: "node_modules/**",
    }),
    commonjs(),
    terser(),
  ],
};
