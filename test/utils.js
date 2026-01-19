const fse = require("fs-extra");
const path = require("path");
const os = require("os");

const getTmpDir = function (pathToTmp) {
  return path.join(os.tmpdir(), pathToTmp);
};

const createTmpDir = function (pathToTmp) {
  const workDir = getTmpDir(pathToTmp);
  fse.mkdirpSync(workDir);
};

const removeTmpDir = function (pathToTmp) {
  const cwd = getTmpDir(pathToTmp);
  fse.removeSync(cwd);
};

const writeJsonFile = function (filePath, data) {
  fse.outputJsonSync(filePath, data);
};

module.exports = {
  getTmpDir,
  createTmpDir,
  removeTmpDir,
  writeJsonFile,
};
