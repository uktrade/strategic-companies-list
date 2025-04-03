/* eslint-disable */
const path = require("path");
const TerserPlugin = require("terser-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

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
    scl: [
      "./scl/core/static/scl.js",
      "./scl/core/sass/scl.scss",
    ],
    browser: "./scl/core/static/browser.js",
    ...REACT_APPS,
  },
  output: {
    path: path.resolve(__dirname, "scl", "core", "static", "js"),
    filename: "[name].js",
    clean: true,
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: "[name]-[hash].css",
      chunkFilename: "[id]-[hash].css",
    }),
  ],
  module: {
    rules: [
      // Use file-loader to handle image assets
      {
        test: /\.(png|jpe?g|gif|woff2?|svg|ico)$/i,
        use: [
          {
            loader: "file-loader",
            options: {
              name: "[name].[ext]",
            },
          },
        ],
      },
      {
        test: /\.js|\.jsx$/,
        exclude: /node_modules/,
        use: "babel-loader",
        resolve: {
          extensions: [".jsx", ".js"],
        },
      },

      // Extract compiled SCSS separately from JS
      {
        test: /\.s[ac]ss$/i,
        use: [
          MiniCssExtractPlugin.loader,
          "css-loader",
          "sass-loader",
        ],
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
    modules: ["node_modules"],
    extensions: [".js", ".jsx", ".scss"],
  },
};
