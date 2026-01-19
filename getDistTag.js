/* Get npm dist-tag by comparing local version and latest version.
 *
 * Npm server set dist-tag to "latest" for the last published package. And prevent
 * package publish if local version is less than or equal to latest version. To
 * publish a package at lower version (a patch or mis-ordered publish), a dist-tag is
 * required.
 */
const compareVersions = require("compare-versions");

// Get dist tag, if localVer >= latestVer return latest, otherwise patch@localVer.
const getDistTag = function (localVer, latestVer) {
  try {
    let ret = compareVersions(localVer, latestVer);
    if (ret == 0 || ret == 1) return "latest";
    else return `patch@${localVer}`;
  } catch (err) {
    // Not valid semver, always return latest.
    return "latest";
  }
};

if (require.main === module) {
  if (process.argv.length < 4) {
    console.log("Usage: node getDistTag.js <local_version> <latest_version>");
    process.exit(1);
  } else {
    console.log(getDistTag(process.argv[2], process.argv[3]));
    process.exit(0);
  }
}

module.exports = { getDistTag };
