/* eslint-disable no-undef */
require("should");
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const {
  getTmpDir,
  createTmpDir,
  removeTmpDir,
  writeJsonFile,
} = require("./utils");
const { validatePackageManifest } = require("../validatePackageManifest");

describe("validatePackageManifest.js", function () {
  const tmpDir = getTmpDir("test-validate-package-manifest");

  beforeEach(function () {
    removeTmpDir("test-validate-package-manifest");
    createTmpDir("test-validate-package-manifest");
  });

  afterEach(function () {
    removeTmpDir("test-validate-package-manifest");
  });

  it("accepts a matching package manifest", function () {
    writeJsonFile(path.resolve(tmpDir, "package.json"), {
      name: "package-a",
      version: "1.0.0",
    });

    const result = validatePackageManifest(tmpDir, "package-a", "1.0.0");

    result.name.should.equal("package-a");
    result.version.should.equal("1.0.0");
  });

  it("rejects a mismatched package version", function () {
    writeJsonFile(path.resolve(tmpDir, "package.json"), {
      name: "package-a",
      version: "1.0.1",
    });

    (() => validatePackageManifest(tmpDir, "package-a", "1.0.0")).should.throw(
      "Package manifest version mismatch: package.json.version=1.0.1, expectedReleaseVersion=1.0.0",
    );
  });

  it("rejects a mismatched package name", function () {
    writeJsonFile(path.resolve(tmpDir, "package.json"), {
      name: "package-b",
      version: "1.0.0",
    });

    (() => validatePackageManifest(tmpDir, "package-a", "1.0.0")).should.throw(
      "Package manifest name mismatch: actual=package-b, expected=package-a",
    );
  });

  it("accepts a package manifest with a UTF-8 BOM", function () {
    const packageJsonPath = path.resolve(tmpDir, "package.json");
    fs.writeFileSync(
      packageJsonPath,
      '\uFEFF{"name":"package-a","version":"1.0.0"}\n',
    );

    const result = validatePackageManifest(tmpDir, "package-a", "1.0.0");

    result.name.should.equal("package-a");
    result.version.should.equal("1.0.0");
  });

  it("compares package versions as exact strings", function () {
    writeJsonFile(path.resolve(tmpDir, "package.json"), {
      name: "package-a",
      version: "1.2.03",
    });

    (() => validatePackageManifest(tmpDir, "package-a", "1.2.3")).should.throw(
      "Package manifest version mismatch: package.json.version=1.2.03, expectedReleaseVersion=1.2.3",
    );
  });

  it("cli accepts a matching package manifest", function () {
    writeJsonFile(path.resolve(tmpDir, "package.json"), {
      name: "package-a",
      version: "1.0.0",
    });
    const scriptPath = path.resolve(
      __dirname,
      "..",
      "validatePackageManifest.js",
    );
    const result = spawnSync(
      process.execPath,
      [scriptPath, tmpDir, "package-a", "1.0.0"],
      { encoding: "utf8" },
    );

    result.status.should.equal(0);
    result.stdout.should.containEql(
      "Package manifest matches expected package name and version",
    );
  });
});
