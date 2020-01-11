const fse = require("fs-extra");
const path = require("path");
const os = require("os");

const getTmpDir = function(pathToTmp) {
  return path.join(os.tmpdir(), pathToTmp);
};

const createTmpDir = function(pathToTmp) {
  const workDir = getTmpDir(pathToTmp);
  fse.mkdirpSync(workDir);
};

const removeTmpDir = function(pathToTmp) {
  const cwd = getTmpDir(pathToTmp);
  fse.removeSync(cwd);
};

module.exports = {
  getTmpDir,
  createTmpDir,
  removeTmpDir
};
