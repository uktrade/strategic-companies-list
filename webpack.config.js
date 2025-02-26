const path = require("path");
module.exports = {
  entry: [path.join(__dirname, "browser.js")],
  output: {
    path: __dirname,
    filename: 'bundle.js'
  },
  // Enable WebPack to use the 'path' package.
  resolve:{
    fallback: { path: require.resolve("path-browserify")}
  }
};
