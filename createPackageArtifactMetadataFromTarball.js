const childProcess = require("child_process");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

/**
 * @typedef {{
 *   name?: string,
 *   version?: string,
 * }} PackageJson
 */

/**
 * @param {string} filePath
 * @returns {string}
 */
const sha256File = function (filePath) {
  const hash = crypto.createHash("sha256");
  hash.update(fs.readFileSync(filePath));
  return hash.digest("hex");
};

/**
 * @param {string} tarballPath
 */
const validateTarballExtension = function (tarballPath) {
  if (!tarballPath.endsWith(".tgz") && !tarballPath.endsWith(".tar.gz")) {
    throw new Error(
      "Unsupported package asset extension; expected .tgz or .tar.gz",
    );
  }
};

/**
 * @param {string} tarballPath
 * @returns {PackageJson}
 */
const readPackageJsonFromTarball = function (tarballPath) {
  validateTarballExtension(tarballPath);
  let packageJsonText;
  try {
    packageJsonText = childProcess.execFileSync(
      "tar",
      ["-xOzf", path.resolve(tarballPath), "package/package.json"],
      {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
  } catch (error) {
    const stderr =
      error && typeof error === "object" && "stderr" in error
        ? String(error.stderr)
        : "";
    if (stderr.includes("Not found in archive")) {
      throw new Error("Downloaded package asset has no package/package.json");
    }
    throw new Error("Downloaded package asset is not a valid tar archive");
  }

  try {
    return /** @type {PackageJson} */ (JSON.parse(packageJsonText));
  } catch {
    throw new Error("Downloaded package asset package.json is not valid JSON");
  }
};

/**
 * @param {string} tarballPath
 * @param {string} expectedPackageName
 * @param {string} expectedPackageVersion
 * @param {string} distTag
 * @returns {{
 *   packageName?: string,
 *   packageVersion?: string,
 *   distTag: string,
 *   tarballFile: string,
 *   tarballSha256: string,
 * }}
 */
const createPackageArtifactMetadataFromTarball = function (
  tarballPath,
  expectedPackageName,
  expectedPackageVersion,
  distTag,
) {
  const resolvedTarballPath = path.resolve(tarballPath);
  const packageJson = readPackageJsonFromTarball(resolvedTarballPath);
  if (!packageJson || typeof packageJson !== "object") {
    throw new Error("Downloaded package asset package.json is not an object");
  }
  if (packageJson.name !== expectedPackageName) {
    throw new Error(
      `Downloaded package asset name mismatch: actual=${packageJson.name}, expected=${expectedPackageName}`,
    );
  }
  if (packageJson.version !== expectedPackageVersion) {
    throw new Error(
      `Downloaded package asset version mismatch: actual=${packageJson.version}, expected=${expectedPackageVersion}`,
    );
  }

  return {
    packageName: packageJson.name,
    packageVersion: packageJson.version,
    distTag,
    tarballFile: path.basename(resolvedTarballPath),
    tarballSha256: sha256File(resolvedTarballPath),
  };
};

if (require.main === module) {
  if (process.argv.length < 7) {
    console.error(
      "Usage: node createPackageArtifactMetadataFromTarball.js <tarball-path> <expected-package-name> <expected-package-version> <dist-tag> <output-file>",
    );
    process.exit(1);
  }

  const metadata = createPackageArtifactMetadataFromTarball(
    process.argv[2],
    process.argv[3],
    process.argv[4],
    process.argv[5],
  );
  fs.writeFileSync(process.argv[6], `${JSON.stringify(metadata, null, 2)}\n`);
}

module.exports = {
  createPackageArtifactMetadataFromTarball,
  readPackageJsonFromTarball,
  validateTarballExtension,
};
