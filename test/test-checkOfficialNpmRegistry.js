/* eslint-disable no-undef */
const should = require("should");

const {
  collectRegistryViolations,
} = require("../scripts/checkOfficialNpmRegistry");

describe("checkOfficialNpmRegistry.js", function () {
  it("accepts official npm resolved URLs", function () {
    const violations = collectRegistryViolations({
      packages: {
        "node_modules/example": {
          resolved: "https://registry.npmjs.org/example/-/example-1.0.0.tgz",
        },
      },
      dependencies: {
        example: {
          resolved: "https://registry.npmjs.org/example/-/example-1.0.0.tgz",
        },
      },
    });

    violations.should.be.empty();
  });

  it("rejects non-official npm resolved URLs", function () {
    const violations = collectRegistryViolations({
      packages: {
        "node_modules/example": {
          resolved:
            "https://registry.npmmirror.com/example/-/example-1.0.0.tgz",
        },
      },
      dependencies: {},
    });

    should(violations).eql([
      {
        name: "node_modules/example",
        resolved: "https://registry.npmmirror.com/example/-/example-1.0.0.tgz",
      },
    ]);
  });

  it("rejects non-official nested legacy dependency URLs", function () {
    const violations = collectRegistryViolations({
      packages: {},
      dependencies: {
        parent: {
          resolved: "https://registry.npmjs.org/parent/-/parent-1.0.0.tgz",
          dependencies: {
            child: {
              resolved:
                "https://registry.npmmirror.com/child/-/child-1.0.0.tgz",
            },
          },
        },
      },
    });

    should(violations).eql([
      {
        name: "parent > child",
        resolved: "https://registry.npmmirror.com/child/-/child-1.0.0.tgz",
      },
    ]);
  });
});
