/* eslint-disable no-undef */
const fs = require("fs");
const path = require("path");

const {
  createPackageResult,
  createPackageResultFromMetadataFile,
} = require("../createPackageResult");
const {
  createTmpDir,
  getTmpDir,
  removeTmpDir,
  writeJsonFile,
} = require("./utils");

describe("createPackageResult.js", function () {
  const tmpRoot = "test-create-package-result";
  const tmpDir = getTmpDir(tmpRoot);

  beforeEach(function () {
    removeTmpDir(tmpRoot);
    createTmpDir(tmpRoot);
  });

  after(function () {
    removeTmpDir(tmpRoot);
  });

  it("creates a signed package result with publishedVersion", function () {
    createPackageResult({
      signed: true,
      packageVersion: "1.2.3",
    }).should.deepEqual({
      signed: true,
      publishedVersion: "1.2.3",
    });
  });

  it("creates an unsigned package result with publishedVersion", function () {
    createPackageResult({
      signed: false,
      packageVersion: "2.0.0-preview.1",
    }).should.deepEqual({
      signed: false,
      publishedVersion: "2.0.0-preview.1",
    });
  });

  it("defaults missing signed to false", function () {
    createPackageResult({
      packageVersion: "1.0.0",
    }).should.deepEqual({
      signed: false,
      publishedVersion: "1.0.0",
    });
  });

  it("reads metadata from disk", function () {
    const metadataFile = path.join(tmpDir, "metadata.json");
    writeJsonFile(metadataFile, {
      signed: true,
      packageVersion: "3.1.4",
    });

    createPackageResultFromMetadataFile(metadataFile).should.deepEqual({
      signed: true,
      publishedVersion: "3.1.4",
    });
  });

  it("prints the result marker from the CLI", function () {
    const metadataFile = path.join(tmpDir, "metadata.json");
    fs.writeFileSync(
      metadataFile,
      JSON.stringify({ signed: true, packageVersion: "4.5.6" }),
    );

    const result = createPackageResultFromMetadataFile(metadataFile);

    `OPENUPM_PACKAGE_RESULT ${JSON.stringify(result)}`.should.equal(
      'OPENUPM_PACKAGE_RESULT {"signed":true,"publishedVersion":"4.5.6"}',
    );
  });
});
