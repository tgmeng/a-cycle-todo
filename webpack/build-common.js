const path = require("path");
const { merge } = require("webpack-merge");

function buildWebpackCommonConfig(...config) {
  return merge(
    {
      entry: "./src/index",
      module: {
        rules: [
          {
            test: /\.(?:t|j)sx?$/,
            loader: "babel-loader",
            exclude: /node_modules/,
            options: {
              cacheDirectory: true,
            },
          },
          {
            test: /\.css$/i,
            use: ["style-loader", "css-loader"],
          },
        ],
      },
      resolve: {
        extensions: [".js", ".jsx", ".ts", ".tsx"],
      },
    },
    ...config
  );
}

module.exports = buildWebpackCommonConfig;
