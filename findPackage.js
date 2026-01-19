// Find package folder
const fs = require("fs");
const findit = require("findit2");
const path = require("path");
const relative = require("relative");
const { logDebug, logError } = require("./lib/logger");

/**
 * @param {string} filePath
 * @returns {{name?: string}}
 */
const readPackageJson = function (filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  return JSON.parse(raw);
};

/**
 * @param {string} packageName
 * @param {string} searchPath
 * @returns {Promise<{dirname: string, pkg: {name?: string}, file: string} | null>}
 */
const findPackage = function (packageName, searchPath) {
  return new Promise((resolve, reject) => {
    try {
      searchPath = path.resolve(process.cwd(), searchPath);
    } catch (err) {
      reject("searchPath does not exist");
    }
    const finder = findit(searchPath);
    // eslint-disable-next-line no-unused-vars
    finder.on("file", (file, stat, stop) => {
      const basename = path.basename(file);
      if (basename == "package.json") {
        const dirname = relative(process.cwd(), path.dirname(file));
        let pkg = null;
        try {
          pkg = readPackageJson(file);
        } catch (err) {
          logError(`Failed to parse ${path.join(dirname, basename)}`);
          return;
        }
        if (pkg.name != packageName) {
          logDebug(
            `Mismatched package name in ${path.join(dirname, basename)}: actual=${pkg.name}, expected=${packageName}`,
          );
          return;
        }
        logDebug(`Found package name in ${path.join(dirname, basename)}`);
        finder.stop();
        resolve({ dirname, pkg, file });
      }
    });
    finder.on("end", () => {
      resolve(null);
    });
    finder.on("error", () => {
      finder.stop();
      reject("find package.json error");
    });
  });
};

if (require.main === module) {
  if (process.argv.length < 5) {
    logError(
      "Usage: node findPackage.js <pkg-name> <search-path> <output-filename>",
    );
    process.exit(1);
  } else {
    findPackage(process.argv[2], process.argv[3])
      .then((result) => {
        if (!result) {
          logError(
            `Error: ENOENT, error path package.json with name=${process.argv[2]}`,
          );
          process.exit(1);
        }
        // Write to output file
        const outputFilename = process.argv[4];
        const content = JSON.stringify(result);
        try {
          fs.writeFileSync(outputFilename, content);
          console.log("Saved to " + outputFilename);
        } catch (err) {
          logError(err);
          process.exit(1);
        }
      })
      .catch((err) => {
        logError(err);
        process.exit(1);
      });
  }
}

module.exports = { findPackage };
