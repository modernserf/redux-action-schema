module.exports = {
    parser: "babel-eslint",
    extends: [
        "standard",
        "plugin:import/errors",
        "plugin:react/recommended",
    ],
    plugins: ["standard","import","react"],
    rules: {
      "object-curly-spacing": ["error", "always"],
      "quotes": ["error","double", {
          "avoidEscape": true,
          "allowTemplateLiterals": true,
        }],
      "comma-dangle": ["error","always-multiline"],
      "indent": ["error", 4]
    }
};
