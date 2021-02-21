const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

const buildDev = require("./build-dev");

const pkg = require("../package.json");

module.exports = buildDev({
  plugins: [
    new HtmlWebpackPlugin({
      title: pkg.name,
      template: path.join(__dirname, "./app-template.html"),
    }),
  ],
});
