const path = require("path");
const { logError } = require("./lib/logger");
const { readPackageJson } = require("./lib/packageJson");

/**
 * @param {string} packageFolder
 * @param {string} expectedPackageName
 * @param {string} expectedPackageVersion
 * @returns {{name?: string, version?: string}}
 */
const validatePackageManifest = function (
  packageFolder,
  expectedPackageName,
  expectedPackageVersion,
) {
  const packageJsonPath = path.join(packageFolder, "package.json");
  const pkg = readPackageJson(packageJsonPath);

  if (pkg.name !== expectedPackageName) {
    throw new Error(
      `Package manifest name mismatch: actual=${pkg.name}, expected=${expectedPackageName}`,
    );
  }

  if (pkg.version !== expectedPackageVersion) {
    throw new Error(
      `Package manifest version mismatch: package.json.version=${pkg.version}, expectedReleaseVersion=${expectedPackageVersion}`,
    );
  }

  return pkg;
};

if (require.main === module) {
  if (process.argv.length < 5) {
    logError(
      "Usage: node validatePackageManifest.js <package-folder> <expected-package-name> <expected-package-version>",
    );
    process.exit(1);
  }

  try {
    validatePackageManifest(process.argv[2], process.argv[3], process.argv[4]);
    console.log("Package manifest matches expected package name and version");
  } catch (err) {
    logError(err.message);
    process.exit(1);
  }
}

module.exports = { validatePackageManifest };
