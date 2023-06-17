const resolve = require("@rollup/plugin-node-resolve");

module.exports = [
  {
    input: "client/src/editor_main.js",
    output: {
      file: "client/editor_bundle.js",
      format: "es",
      sourcemap: "inline",
    },
    plugins: [
      resolve({
        jsnext: true,
        main: true,
        browser: true,
      })
    ],
  },
  {
    input: "client/src/nodes.js",
    output: {
      file: "client/server_test_bundle.js",
      format: "es",
      sourcemap: "inline",
    },
    plugins: [
      resolve({
        jsnext: true,
        main: true,
        browser: true,
      })
    ],
  },
  {
    input: "client/src/viewer_main.js",
    output: {
      file: "client/viewer_bundle.js",
      format: "es",
      sourcemap: "inline"
    },
    plugins: [
      resolve({
        jsnext: true,
        main: true,
        browser: true
      })
    ]
  }
];
