const fse = require("fs-extra");
const path = require("path");
const os = require("os");

/**
 * @param {string} pathToTmp
 * @returns {string}
 */
const getTmpDir = function (pathToTmp) {
  return path.join(os.tmpdir(), pathToTmp);
};

/**
 * @param {string} pathToTmp
 * @returns {void}
 */
const createTmpDir = function (pathToTmp) {
  const workDir = getTmpDir(pathToTmp);
  fse.mkdirpSync(workDir);
};

/**
 * @param {string} pathToTmp
 * @returns {void}
 */
const removeTmpDir = function (pathToTmp) {
  const cwd = getTmpDir(pathToTmp);
  fse.removeSync(cwd);
};

/**
 * @param {string} filePath
 * @param {unknown} data
 * @returns {void}
 */
const writeJsonFile = function (filePath, data) {
  fse.outputJsonSync(filePath, data);
};

module.exports = {
  getTmpDir,
  createTmpDir,
  removeTmpDir,
  writeJsonFile,
};
