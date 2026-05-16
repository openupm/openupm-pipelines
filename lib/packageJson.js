const fs = require("fs");

/**
 * @param {string} text
 * @returns {string}
 */
const stripLeadingBom = function (text) {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
};

/**
 * @param {string} text
 * @returns {{name?: string, version?: string}}
 */
const parsePackageJsonText = function (text) {
  return JSON.parse(stripLeadingBom(text));
};

/**
 * @param {string} filePath
 * @returns {{name?: string, version?: string}}
 */
const readPackageJson = function (filePath) {
  return parsePackageJsonText(fs.readFileSync(filePath, "utf8"));
};

module.exports = {
  parsePackageJsonText,
  readPackageJson,
  stripLeadingBom,
};
