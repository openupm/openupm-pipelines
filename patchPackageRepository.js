const fs = require("fs");
const path = require("path");
const { logError } = require("./lib/logger");
const { readPackageJson } = require("./lib/packageJson");

/**
 * @typedef {{type: string, url: string, revision: string}} RepositoryMetadata
 */

/**
 * @typedef {{
 *   [key: string]: unknown,
 *   name?: string,
 *   version?: string,
 *   displayName?: string,
 *   dependencies?: Record<string, string>,
 *   repository?: string | (Record<string, unknown> & Partial<RepositoryMetadata>),
 * }} PackageManifest
 */

/**
 * @param {string} value
 * @param {string} name
 * @returns {void}
 */
const assertNonEmptyString = function (value, name) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${name} is required`);
  }
};

/**
 * @param {string} packageFolder
 * @param {string} repoUrl
 * @param {string} revision
 * @returns {PackageManifest & {repository: RepositoryMetadata}}
 */
const patchPackageRepository = function (packageFolder, repoUrl, revision) {
  assertNonEmptyString(packageFolder, "packageFolder");
  assertNonEmptyString(repoUrl, "repoUrl");
  assertNonEmptyString(revision, "revision");

  const packageJsonPath = path.resolve(packageFolder, "package.json");
  const packageJson = /** @type {PackageManifest} */ (
    readPackageJson(packageJsonPath)
  );
  const existingRepository =
    packageJson.repository &&
    typeof packageJson.repository === "object" &&
    !Array.isArray(packageJson.repository)
      ? packageJson.repository
      : {};

  packageJson.repository = {
    ...existingRepository,
    type: "git",
    url: repoUrl,
    revision,
  };

  fs.writeFileSync(
    packageJsonPath,
    `${JSON.stringify(packageJson, null, 2)}\n`,
  );

  return /** @type {PackageManifest & {repository: RepositoryMetadata}} */ (
    packageJson
  );
};

if (require.main === module) {
  if (process.argv.length < 5) {
    logError(
      "Usage: node patchPackageRepository.js <package-folder> <repo-url> <revision>",
    );
    process.exit(1);
  }

  try {
    patchPackageRepository(process.argv[2], process.argv[3], process.argv[4]);
    console.log("Patched package repository metadata");
  } catch (err) {
    logError(err.message);
    process.exit(1);
  }
}

module.exports = {
  patchPackageRepository,
};
