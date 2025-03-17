/* eslint-disable */
const path = require("path");
const webpack = require("webpack");
const { merge } = require("webpack-merge");
const common = require("./webpack.common.js");
const BundleTracker = require("webpack-bundle-tracker");
const TerserPlugin = require("terser-webpack-plugin");

module.exports = merge(common, {
  mode: "production",
  plugins: [
    new webpack.DefinePlugin({
      "process.env": {
        NODE_ENV: JSON.stringify("production"),
      },
    }),
  ],
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: {
            drop_console: true,
          },
        },
      }),
    ],
  },
});
