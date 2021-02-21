module.exports = {
  presets: [
    ["@babel/preset-env", { targets: "defaults" }],
    ["@babel/preset-typescript", { isTSX: true, allExtensions: true }],
  ],
  plugins: [
    [
      "const-enum",
      {
        transform: "constObject",
      },
    ],
  ],
};
