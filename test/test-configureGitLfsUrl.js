"use strict";
/* global describe, it */

const should = require("should");

const { getGitHubLfsUrl } = require("../configureGitLfsUrl");

describe("configureGitLfsUrl.js", function () {
  it("normalizes HTTPS GitHub remotes to the Git LFS endpoint", function () {
    getGitHubLfsUrl("https://github.com/bluecadet/unity-packages").should.equal(
      "https://github.com/bluecadet/unity-packages.git/info/lfs",
    );
    getGitHubLfsUrl(
      "https://github.com/bluecadet/unity-packages.git",
    ).should.equal("https://github.com/bluecadet/unity-packages.git/info/lfs");
  });

  it("normalizes GitHub SSH remotes to the public HTTPS Git LFS endpoint", function () {
    getGitHubLfsUrl(
      "ssh://git@github.com/bluecadet/unity-packages.git",
    ).should.equal("https://github.com/bluecadet/unity-packages.git/info/lfs");
    getGitHubLfsUrl("git@github.com:bluecadet/unity-packages.git").should.equal(
      "https://github.com/bluecadet/unity-packages.git/info/lfs",
    );
  });

  it("does not rewrite non-GitHub remotes", function () {
    should(
      getGitHubLfsUrl("https://gitlab.com/bluecadet/unity-packages"),
    ).equal(null);
    should(
      getGitHubLfsUrl("https://github.example.com/bluecadet/unity-packages"),
    ).equal(null);
    should(getGitHubLfsUrl("file:///tmp/unity-packages")).equal(null);
  });
});
