const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

const buildProd = require("./build-prod");

const pkg = require("../package.json");

module.exports = buildProd({
  plugins: [
    new HtmlWebpackPlugin({
      title: pkg.name,
      template: path.join(__dirname, "./app-template.html"),
    }),
  ],
});
