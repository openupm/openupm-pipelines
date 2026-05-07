const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

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
 * @param {string} packageFolder
 * @param {string} tarballPath
 * @param {string} distTag
 * @returns {{
 *   packageName?: string,
 *   packageVersion?: string,
 *   distTag: string,
 *   tarballFile: string,
 *   tarballSha256: string,
 *   signed: boolean,
 * }}
 */
const createPackageArtifactMetadata = function (
  packageFolder,
  tarballPath,
  distTag,
) {
  const packageJsonPath = path.resolve(packageFolder, "package.json");
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
  const resolvedTarballPath = path.resolve(tarballPath);

  return {
    packageName: packageJson.name,
    packageVersion: packageJson.version,
    distTag,
    tarballFile: path.basename(resolvedTarballPath),
    tarballSha256: sha256File(resolvedTarballPath),
    signed: false,
  };
};

if (require.main === module) {
  if (process.argv.length < 6) {
    console.error(
      "Usage: node createPackageArtifactMetadata.js <package-folder> <tarball-path> <dist-tag> <output-file>",
    );
    process.exit(1);
  }

  const metadata = createPackageArtifactMetadata(
    process.argv[2],
    process.argv[3],
    process.argv[4],
  );
  fs.writeFileSync(process.argv[5], `${JSON.stringify(metadata, null, 2)}\n`);
}

module.exports = {
  createPackageArtifactMetadata,
};
