/* eslint-disable no-undef */
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const {
  createPackageArtifactMetadata,
} = require("../createPackageArtifactMetadata");
const {
  createTmpDir,
  getTmpDir,
  removeTmpDir,
  writeJsonFile,
} = require("./utils");

describe("createPackageArtifactMetadata.js", function () {
  const tmpRoot = "test-create-package-artifact-metadata";
  const tmpDir = getTmpDir(tmpRoot);

  beforeEach(function () {
    removeTmpDir(tmpRoot);
    createTmpDir(tmpRoot);
  });

  after(function () {
    removeTmpDir(tmpRoot);
  });

  it("creates artifact metadata from package and tarball", function () {
    const packageDir = path.join(tmpDir, "pkg");
    const tarballPath = path.join(packageDir, "package-a-1.0.0.tgz");
    fs.mkdirSync(packageDir, { recursive: true });
    writeJsonFile(path.join(packageDir, "package.json"), {
      name: "package-a",
      version: "1.0.0",
    });
    fs.writeFileSync(tarballPath, "tarball-content");

    const metadata = createPackageArtifactMetadata(
      packageDir,
      tarballPath,
      "latest",
    );

    metadata.should.deepEqual({
      packageName: "package-a",
      packageVersion: "1.0.0",
      distTag: "latest",
      tarballFile: "package-a-1.0.0.tgz",
      tarballSha256: crypto
        .createHash("sha256")
        .update("tarball-content")
        .digest("hex"),
      signed: false,
    });
  });

  it("creates artifact metadata from package.json with a UTF-8 BOM", function () {
    const packageDir = path.join(tmpDir, "pkg");
    const tarballPath = path.join(packageDir, "package-a-1.0.0.tgz");
    fs.mkdirSync(packageDir, { recursive: true });
    fs.writeFileSync(
      path.join(packageDir, "package.json"),
      '\uFEFF{"name":"package-a","version":"1.0.0"}\n',
    );
    fs.writeFileSync(tarballPath, "tarball-content");

    const metadata = createPackageArtifactMetadata(
      packageDir,
      tarballPath,
      "latest",
    );

    metadata.packageName.should.equal("package-a");
    metadata.packageVersion.should.equal("1.0.0");
  });
});
