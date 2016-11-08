module.exports = {
    extends: [
        "standard",
        "plugin:import/errors",
    ],
    plugins: ["standard","import"],
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
