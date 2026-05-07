/* global afterEach, beforeEach, describe, it */

const childProcess = require("child_process");
const crypto = require("crypto");
const fs = require("fs-extra");
const path = require("path");

const {
  createPackageArtifactMetadataFromTarball,
  validateTarballExtension,
} = require("../createPackageArtifactMetadataFromTarball");

describe("createPackageArtifactMetadataFromTarball.js", function () {
  const tmpRoot = "test-create-package-artifact-metadata-from-tarball";

  beforeEach(function () {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
    fs.ensureDirSync(tmpRoot);
  });

  afterEach(function () {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  });

  const createTarball = function (
    packageJson,
    filename = "package-a-1.0.0.tgz",
  ) {
    const tarRoot = path.join(tmpRoot, "tar-root");
    const packageDir = path.join(tarRoot, "package");
    const tarballPath = path.join(tmpRoot, filename);
    fs.ensureDirSync(packageDir);
    fs.writeFileSync(
      path.join(packageDir, "package.json"),
      `${JSON.stringify(packageJson, null, 2)}\n`,
    );
    childProcess.execFileSync("tar", [
      "-czf",
      tarballPath,
      "-C",
      tarRoot,
      "package",
    ]);
    return tarballPath;
  };

  it("creates artifact metadata from tarball package.json", function () {
    const tarballPath = createTarball({
      name: "package-a",
      version: "1.0.0",
    });

    const metadata = createPackageArtifactMetadataFromTarball(
      tarballPath,
      "package-a",
      "1.0.0",
      "latest",
    );

    metadata.should.deepEqual({
      packageName: "package-a",
      packageVersion: "1.0.0",
      distTag: "latest",
      tarballFile: "package-a-1.0.0.tgz",
      tarballSha256: crypto
        .createHash("sha256")
        .update(fs.readFileSync(tarballPath))
        .digest("hex"),
    });
  });

  it("accepts .tar.gz package assets", function () {
    const tarballPath = createTarball(
      {
        name: "package-a",
        version: "1.0.0",
      },
      "package-a-1.0.0.tar.gz",
    );

    const metadata = createPackageArtifactMetadataFromTarball(
      tarballPath,
      "package-a",
      "1.0.0",
      "latest",
    );

    metadata.tarballFile.should.equal("package-a-1.0.0.tar.gz");
    metadata.packageName.should.equal("package-a");
    metadata.packageVersion.should.equal("1.0.0");
  });

  it("rejects unsupported asset extension", function () {
    (() => validateTarballExtension("package.zip")).should.throw(
      /Unsupported package asset extension/,
    );
  });

  it("rejects wrong package name and version", function () {
    const tarballPath = createTarball({
      name: "package-a",
      version: "1.0.0",
    });

    (() =>
      createPackageArtifactMetadataFromTarball(
        tarballPath,
        "package-b",
        "1.0.0",
        "latest",
      )).should.throw(/name mismatch/);
    (() =>
      createPackageArtifactMetadataFromTarball(
        tarballPath,
        "package-a",
        "2.0.0",
        "latest",
      )).should.throw(/version mismatch/);
  });

  it("rejects malformed archive and missing package.json", function () {
    const malformedTarball = path.join(tmpRoot, "malformed.tgz");
    fs.writeFileSync(malformedTarball, "not-a-tarball");
    (() =>
      createPackageArtifactMetadataFromTarball(
        malformedTarball,
        "package-a",
        "1.0.0",
        "latest",
      )).should.throw();

    const tarRoot = path.join(tmpRoot, "empty-root");
    const packageDir = path.join(tarRoot, "package");
    const missingPackageJsonTarball = path.join(tmpRoot, "missing-package.tgz");
    fs.ensureDirSync(packageDir);
    fs.writeFileSync(path.join(packageDir, "README.md"), "readme");
    childProcess.execFileSync("tar", [
      "-czf",
      missingPackageJsonTarball,
      "-C",
      tarRoot,
      "package",
    ]);
    (() =>
      createPackageArtifactMetadataFromTarball(
        missingPackageJsonTarball,
        "package-a",
        "1.0.0",
        "latest",
      )).should.throw(/no package\/package.json/);
  });
});
