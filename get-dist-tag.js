// Get dist tag based on local version and latest version

const compareVersions = require('compare-versions');

// Get dist tag.
const getDistTag = function (localVer, latestVer) {
  try {
    // If localVer >= latestVer return latest, otherwise patch@localVer.
    let ret = compareVersions(localVer, latestVer);
    if (ret == 0 || ret == 1)
      return 'latest';
    else
      return `patch@${localVer}`;
  } catch (err) {
    // Not valid semver, always return latest.
    return 'latest';
  }
};

if (require.main === module) {
  if (process.argv.length < 4) {
    console.log('Usage: node get-dist-tag.js <local_version> <latest_version>');
    process.exit(1);
  } else {
    console.log(getDistTag(process.argv[2], process.argv[3]));
    process.exit(0);
  }
}
