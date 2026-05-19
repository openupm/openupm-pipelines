"use strict";

const { execFileSync } = require("child_process");

/**
 * @param {string} repoUrl
 * @returns {string | null}
 */
function getGitHubLfsUrl(repoUrl) {
  let url;
  try {
    url = new URL(repoUrl);
  } catch {
    const scpMatch = repoUrl.match(
      /^git@github\.com:([^/]+)\/(.+?)(?:\.git)?$/,
    );
    if (!scpMatch) return null;
    return `https://github.com/${scpMatch[1]}/${scpMatch[2]}.git/info/lfs`;
  }

  if (url.protocol !== "https:" && url.protocol !== "ssh:") return null;
  if (url.hostname.toLowerCase() !== "github.com") return null;
  if (url.protocol === "ssh:" && url.username && url.username !== "git") {
    return null;
  }

  const parts = url.pathname.replace(/^\/+|\/+$/g, "").split("/");
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;

  const repoName = parts[1].replace(/\.git$/i, "");
  return `https://github.com/${parts[0]}/${repoName}.git/info/lfs`;
}

/**
 * @param {string} repoDir
 * @returns {string}
 */
function getOriginUrl(repoDir) {
  return execFileSync(
    "git",
    ["-C", repoDir, "config", "--get", "remote.origin.url"],
    {
      encoding: "utf8",
    },
  ).trim();
}

/**
 * @param {string} repoDir
 * @param {string} lfsUrl
 */
function setGitLfsUrl(repoDir, lfsUrl) {
  execFileSync("git", ["-C", repoDir, "config", "--local", "lfs.url", lfsUrl], {
    stdio: "inherit",
  });
}

/**
 * @param {string} repoDir
 * @returns {string | null}
 */
function configureGitLfsUrl(repoDir) {
  const originUrl = getOriginUrl(repoDir);
  const lfsUrl = getGitHubLfsUrl(originUrl);
  if (!lfsUrl) return null;

  setGitLfsUrl(repoDir, lfsUrl);
  return lfsUrl;
}

function main() {
  const repoDir = process.argv[2] || ".";
  const lfsUrl = configureGitLfsUrl(repoDir);
  if (lfsUrl) {
    console.log(`Configured Git LFS URL for GitHub remote: ${lfsUrl}`);
  } else {
    console.log(
      "Repository remote is not a github.com URL; leaving Git LFS URL unchanged.",
    );
  }
}

module.exports = {
  configureGitLfsUrl,
  getGitHubLfsUrl,
};

if (require.main === module) {
  main();
}
