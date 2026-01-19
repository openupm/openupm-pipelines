/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
const should = require("should");

const { getDistTag } = require("../getDistTag");

describe("getDistTag.js", function () {
  describe("getDistTag()", function () {
    it("same version", function () {
      getDistTag("1.0.0", "1.0.0").should.equal("latest");
    });
    it("non semver", function () {
      getDistTag("1.0.0.0.0", "1.0.0").should.equal("latest");
    });
    it("lower local version", function () {
      getDistTag("0.9.0", "1.0.0").should.equal("patch@0.9.0");
      getDistTag("1.0.0", "1.0.1").should.equal("patch@1.0.0");
      getDistTag("1.0.0-preview-5", "1.0.0").should.equal(
        "patch@1.0.0-preview-5",
      );
    });
    it("higher local version", function () {
      getDistTag("1.1.0", "1.0.0").should.equal("latest");
      getDistTag("1.0.1", "1.0.0").should.equal("latest");
      getDistTag("1.0.1-preview-0", "1.0.0").should.equal("latest");
    });
  });
});
