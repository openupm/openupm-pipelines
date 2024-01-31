// Find package folder

const findit = require("findit2");
const path = require("path");
const relative = require("relative");

const findPackage = function(packageName, searchPath) {
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
          pkg = require(path.join(file));
        } catch (err) {
          return;
        }
        if (pkg.name != packageName) {
            console.log(`wrong package name in ${path.join(dirname, basename)}: actual=${pkg.name}, expected=${packageName}`);
            return;
        }
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
  if (process.argv.length < 4) {
    console.log("Usage: node findPackage.js <pkg-name> <search-path>");
    process.exit(1);
  } else {
    findPackage(process.argv[2], process.argv[3])
      .then(x => console.log(x.dirname))
      .catch(() => {});
  }
}

module.exports = { findPackage };
