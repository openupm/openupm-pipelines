"use strict";
/* global describe, it */

require("should");

const {
  DEFAULTS,
  findRecordsByName,
  parseArgs,
} = require("../scripts/runAzureFixture");

describe("runAzureFixture.js", function () {
  it("parses CLI flags into camelCase options", function () {
    parseArgs([
      "--source-branch",
      "dev/pipeline-sandbox-publish",
      "--e2e-test=false",
      "--poll-interval-ms",
      "5000",
    ]).should.deepEqual({
      sourceBranch: "dev/pipeline-sandbox-publish",
      e2eTest: "false",
      pollIntervalMs: "5000",
    });
  });

  it("filters timeline records by task name", function () {
    findRecordsByName(
      [
        { name: "Publish to Verdaccio", log: { url: "log://1" } },
        { name: "Other step", log: { url: "log://2" } },
        { name: "Print Verdaccio registry content", log: null },
      ],
      ["Publish to Verdaccio", "Print Verdaccio registry content"],
    ).should.deepEqual([
      { name: "Publish to Verdaccio", log: { url: "log://1" } },
    ]);
  });

  it("defaults to the documented manual fixture", function () {
    DEFAULTS.packageName.should.equal("com.example.nuget-consumer");
    DEFAULTS.packageVersion.should.equal("1.0.1");
    DEFAULTS.packageSource.should.equal("git");
    DEFAULTS.e2eTest.should.equal("true");
  });
});
