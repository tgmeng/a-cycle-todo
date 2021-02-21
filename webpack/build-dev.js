const path = require("path");
const { merge } = require("webpack-merge");

const buildCommon = require("./build-common");

function buildWebpackDevConfig(...config) {
  return buildCommon(
    merge(
      {
        mode: "development",
        devtool: "inline-cheap-module-source-map",
      },
      ...config
    )
  );
}

module.exports = buildWebpackDevConfig;
