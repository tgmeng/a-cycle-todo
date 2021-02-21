const path = require("path");
const { merge } = require("webpack-merge");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");

const buildCommon = require("./build-common");

function buildWebpackProdConfig(...config) {
  return buildCommon(
    merge(
      {
        devtool: "source-map",
        cache: {
          type: "filesystem",
        },
        output: {
          filename: "[name].[contenthash].js",
          chunkFilename: "[id].[contenthash].js",
          path: path.resolve(process.cwd(), "dist"),
        },
        optimization: {
          splitChunks: {
            cacheGroups: {
              vendors: {
                test: /[\\/]node_modules[\\/]/,
                name: "vendors",
                chunks: "all",
              },
            },
          },
        },
        plugins: [new CleanWebpackPlugin()],
      },
      ...config
    )
  );
}

module.exports = buildWebpackProdConfig;
