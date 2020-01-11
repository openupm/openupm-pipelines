/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
const should = require("should");
const path = require("path");
const fse = require("fs-extra");
const { getTmpDir, createTmpDir, removeTmpDir } = require("./utils");
const { findPackage } = require("../findPackage");

describe("findPackage.js", function() {
  const root = path.relative(__dirname, "..");
  const tmpDir = getTmpDir("test-find-package");
  beforeEach(function() {
    removeTmpDir("test-find-package");
    createTmpDir("test-find-package");
  });
  afterEach(function() {
    removeTmpDir("test-openupm-cli");
  });
  describe("findPackage()", function() {
    it("find success", async function() {
      fse.writeJsonSync(path.resolve(tmpDir, "package.json"), {
        name: "package-a"
      });
      const result = await findPackage("package-a", tmpDir);
      result.pkg.name.should.equal("package-a");
    });
    it("find failed", async function() {
      const result = await findPackage("package-a", tmpDir);
      (result == null).should.be.ok();
    });
    it("search folder not exist", function() {
      findPackage(
        "package-a",
        path.join(tmpDir, "folder-not-exist")
      ).should.be.rejected();
    });
  });
});
