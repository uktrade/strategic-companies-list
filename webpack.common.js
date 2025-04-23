/* eslint-disable */
const path = require("path");
const TerserPlugin = require("terser-webpack-plugin");

const REACT_APPS = [
  "company-briefing",
  "engagement",
].reduce(
  (prev, acc) => ({
    ...prev,
    [acc]: path.join(__dirname, `./scl/core/static/react/features/${acc}/index`),
  }),
  {}
);

module.exports = {
  mode: "development",
  context: __dirname,
  entry: {
    scl: "./scl/core/static/scl.js",
    'aws-transcribe': "./scl/core/static/aws-transcribe.js",
    ...REACT_APPS,
  },
  output: {
    path: path.resolve(__dirname, "scl", "core", "static", "js"),
    filename: "[name].js",
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.js|\.jsx$/,
        exclude: /node_modules/,
        use: "babel-loader",
        resolve: {
          extensions: [".jsx", ".js"],
        },
      },
    ],
  },
  optimization: {
    minimize: true,
    minimizer: [new TerserPlugin({
      extractComments: false,
    })],
  },
  resolve: {
    extensions: [".js", ".jsx"],
  },
};
