const fs = require("fs");

/**
 * @param {unknown} metadata
 * @returns {{ signed: boolean, publishedVersion?: string }}
 */
const createPackageResult = function (metadata) {
  const source = /** @type {Record<string, unknown>} */ (
    metadata && typeof metadata === "object" ? metadata : {}
  );
  const result = {
    signed: source.signed === true,
  };
  if (typeof source.packageVersion === "string") {
    result.publishedVersion = source.packageVersion;
  }
  return result;
};

/**
 * @param {string} metadataFile
 * @returns {{ signed: boolean, publishedVersion?: string }}
 */
const createPackageResultFromMetadataFile = function (metadataFile) {
  return createPackageResult(JSON.parse(fs.readFileSync(metadataFile, "utf8")));
};

if (require.main === module) {
  if (process.argv.length < 3) {
    console.error("Usage: node createPackageResult.js <metadata-file>");
    process.exit(1);
  }

  const result = createPackageResultFromMetadataFile(process.argv[2]);
  console.log(`OPENUPM_PACKAGE_RESULT ${JSON.stringify(result)}`);
}

module.exports = {
  createPackageResult,
  createPackageResultFromMetadataFile,
};
