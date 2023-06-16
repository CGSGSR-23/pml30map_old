const resolve = require("@rollup/plugin-node-resolve");
// const commonjs = require("@rollup/plugin-commonjs");

module.exports = {
  input: "client/src/main.js",
  output: {
    file: "client/bundle.js",
    format: "es",
    sourcemap: "inline",
  },
  plugins: [
    resolve({
      jsnext: true,
      main: true,
      browser: true,
    }),
    //commonjs(),
  ],
};
