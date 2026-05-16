/* eslint-disable no-undef */
require("should");
const fs = require("fs");
const path = require("path");
const {
  getTmpDir,
  createTmpDir,
  removeTmpDir,
  writeJsonFile,
} = require("./utils");
const { patchPackageRepository } = require("../patchPackageRepository");

describe("patchPackageRepository.js", function () {
  const tmpDir = getTmpDir("test-patch-package-repository");
  const repoUrl = "https://github.com/openupm/test-package";
  const revision = "0123456789abcdef0123456789abcdef01234567";

  beforeEach(function () {
    removeTmpDir("test-patch-package-repository");
    createTmpDir("test-patch-package-repository");
  });

  afterEach(function () {
    removeTmpDir("test-patch-package-repository");
  });

  it("adds repository metadata when missing", function () {
    writeJsonFile(path.resolve(tmpDir, "package.json"), {
      name: "package-a",
      version: "1.0.0",
    });

    const result = patchPackageRepository(tmpDir, repoUrl, revision);

    result.repository.should.deepEqual({
      type: "git",
      url: repoUrl,
      revision,
    });

    const saved = JSON.parse(
      fs.readFileSync(path.resolve(tmpDir, "package.json"), "utf8"),
    );
    saved.repository.should.deepEqual(result.repository);
  });

  it("replaces string repository metadata", function () {
    writeJsonFile(path.resolve(tmpDir, "package.json"), {
      name: "package-a",
      version: "1.0.0",
      repository: "https://example.invalid/old.git",
    });

    const result = patchPackageRepository(tmpDir, repoUrl, revision);

    result.repository.should.deepEqual({
      type: "git",
      url: repoUrl,
      revision,
    });
  });

  it("preserves extra object repository metadata", function () {
    writeJsonFile(path.resolve(tmpDir, "package.json"), {
      name: "package-a",
      version: "1.0.0",
      repository: {
        type: "git",
        url: "https://example.invalid/old.git",
        directory: "Packages/package-a",
      },
    });

    const result = patchPackageRepository(tmpDir, repoUrl, revision);

    result.repository.should.deepEqual({
      type: "git",
      url: repoUrl,
      revision,
      directory: "Packages/package-a",
    });
  });

  it("preserves unrelated manifest fields", function () {
    writeJsonFile(path.resolve(tmpDir, "package.json"), {
      name: "package-a",
      version: "1.0.0",
      displayName: "Package A",
      dependencies: {
        "package-b": "2.0.0",
      },
    });

    const result = patchPackageRepository(tmpDir, repoUrl, revision);

    result.name.should.equal("package-a");
    result.version.should.equal("1.0.0");
    result.displayName.should.equal("Package A");
    result.dependencies.should.deepEqual({
      "package-b": "2.0.0",
    });
  });

  it("rejects a missing package manifest", function () {
    (() => patchPackageRepository(tmpDir, repoUrl, revision)).should.throw(
      /ENOENT/,
    );
  });

  it("rejects an invalid package manifest", function () {
    fs.writeFileSync(path.resolve(tmpDir, "package.json"), "{");

    (() => patchPackageRepository(tmpDir, repoUrl, revision)).should.throw();
  });
});
