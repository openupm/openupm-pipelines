"use strict";

const { execFileSync } = require("child_process");

const DEFAULTS = {
  definitionId: 1,
  organization: "openupm",
  project: "openupm",
  repoUrl: "https://github.com/favoyang/com.example.nuget-consumer",
  repoBranch: "1.0.1",
  packageName: "com.example.nuget-consumer",
  packageVersion: "1.0.1",
  packageSource: "git",
  packageAssetUrl: "",
  packageAssetName: "",
  e2eTest: "true",
  pollIntervalMs: 10000,
};

/**
 * @param {string[]} argv
 * @returns {Record<string, string>}
 */
function parseArgs(argv) {
  /** @type {Record<string, string>} */
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith("--")) continue;
    const [rawKey, inlineValue] = arg.slice(2).split("=", 2);
    const key = rawKey.replace(/-([a-z])/g, (_, letter) =>
      letter.toUpperCase(),
    );
    const nextValue = inlineValue !== undefined ? inlineValue : argv[index + 1];
    if (inlineValue === undefined) index += 1;
    options[key] = nextValue;
  }
  return options;
}

/**
 * @returns {string}
 */
function getCurrentBranch() {
  return execFileSync("git", ["branch", "--show-current"], {
    encoding: "utf8",
  }).trim();
}

/**
 * @param {string} token
 * @param {string} url
 * @param {RequestInit} [init]
 * @returns {Promise<Response>}
 */
async function azureFetch(token, url, init = {}) {
  const headers = new Headers(init.headers || {});
  const auth = Buffer.from(`:${token}`).toString("base64");
  headers.set("authorization", `Basic ${auth}`);
  if (init.body && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }
  return fetch(url, { ...init, headers });
}

/**
 * @param {string} buildUrl
 * @param {number} buildId
 */
function printBuildHeader(buildUrl, buildId) {
  console.log(`Queued Azure build ${buildId}`);
  console.log(`Build URL: ${buildUrl}`);
}

/**
 * @param {string} token
 * @param {string} baseUrl
 * @param {number} buildId
 * @returns {Promise<any>}
 */
async function fetchTimeline(token, baseUrl, buildId) {
  const response = await azureFetch(
    token,
    `${baseUrl}/_apis/build/builds/${buildId}/Timeline?api-version=5.1`,
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch build timeline (${response.status})`);
  }
  return response.json();
}

/**
 * @param {string} token
 * @param {string} baseUrl
 * @param {number} buildId
 * @returns {Promise<any>}
 */
async function fetchBuild(token, baseUrl, buildId) {
  const response = await azureFetch(
    token,
    `${baseUrl}/_apis/build/builds/${buildId}?api-version=5.1`,
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch build state (${response.status})`);
  }
  return response.json();
}

/**
 * @param {string} token
 * @param {string} baseUrl
 * @param {number} buildId
 * @param {number} pollIntervalMs
 * @returns {Promise<any>}
 */
async function waitForBuild(token, baseUrl, buildId, pollIntervalMs) {
  let build;
  let completed = false;
  while (!completed) {
    build = await fetchBuild(token, baseUrl, buildId);
    console.log(
      `Build ${build.id} status: ${build.status}${build.result ? ` (${build.result})` : ""}`,
    );
    completed = build.status === "completed";
    if (!completed) {
      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    }
  }
  return build;
}

/**
 * @param {string} token
 * @param {string} logUrl
 * @returns {Promise<string>}
 */
async function fetchLog(token, logUrl) {
  const response = await azureFetch(token, `${logUrl}?api-version=5.1`);
  if (!response.ok) {
    throw new Error(`Failed to fetch log (${response.status})`);
  }
  return response.text();
}

/**
 * @param {any[]} records
 * @param {string[]} names
 * @returns {any[]}
 */
function findRecordsByName(records, names) {
  return records.filter(
    (record) => names.includes(record.name) && record.log && record.log.url,
  );
}

async function main() {
  const token = process.env.AZURE_DEVOPS_TOKEN_OPENUPM_PIPELINE;
  if (!token) {
    throw new Error("AZURE_DEVOPS_TOKEN_OPENUPM_PIPELINE is not set");
  }

  const args = parseArgs(process.argv.slice(2));
  const sourceBranchName = args.sourceBranch || getCurrentBranch();
  const sourceBranch = sourceBranchName.startsWith("refs/heads/")
    ? sourceBranchName
    : `refs/heads/${sourceBranchName}`;

  const options = {
    ...DEFAULTS,
    ...args,
  };

  const baseUrl = `https://dev.azure.com/${options.organization}/${options.project}`;
  /** @type {Record<string, string>} */
  const parameters = {
    repoUrl: options.repoUrl,
    repoBranch: options.repoBranch,
    packageName: options.packageName,
    packageVersion: options.packageVersion,
    packageSource: options.packageSource,
    e2eTest: options.e2eTest,
  };
  if (options.packageAssetUrl)
    parameters.packageAssetUrl = options.packageAssetUrl;
  if (options.packageAssetName)
    parameters.packageAssetName = options.packageAssetName;
  const payload = {
    definition: { id: Number(options.definitionId) },
    sourceBranch,
    parameters: JSON.stringify(parameters),
  };

  const queueResponse = await azureFetch(
    token,
    `${baseUrl}/_apis/build/builds?api-version=5.1`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
  if (!queueResponse.ok) {
    throw new Error(`Failed to queue build (${queueResponse.status})`);
  }

  const queuedBuild = await queueResponse.json();
  printBuildHeader(queuedBuild._links.web.href, queuedBuild.id);
  const build = await waitForBuild(
    token,
    baseUrl,
    queuedBuild.id,
    Number(options.pollIntervalMs),
  );
  const timeline = await fetchTimeline(token, baseUrl, queuedBuild.id);

  const recordNames =
    options.e2eTest === "true"
      ? ["Publish to Verdaccio", "Print Verdaccio registry content"]
      : ["Publish to OpenUPM"];

  const interestingRecords = findRecordsByName(
    timeline.records || [],
    recordNames,
  );
  for (const record of interestingRecords) {
    console.log(`\n=== ${record.name} (${record.result || record.state}) ===`);
    const logText = await fetchLog(token, record.log.url);
    process.stdout.write(logText.endsWith("\n") ? logText : `${logText}\n`);
  }

  if (options.e2eTest === "false") {
    const publishRecord = interestingRecords.find(
      (record) => record.name === "Publish to OpenUPM",
    );
    const logText = publishRecord
      ? await fetchLog(token, publishRecord.log.url)
      : "";
    const expected409 =
      build.result === "failed" && logText.includes("409 Conflict");
    if (!expected409) {
      throw new Error("Expected Publish to OpenUPM to fail with 409 Conflict");
    }
    console.log("\nObserved expected 409 Conflict from OpenUPM publish.");
    return;
  }

  if (build.result !== "succeeded") {
    throw new Error(`Expected e2e build to succeed, got ${build.result}`);
  }

  console.log("\nE2E fixture run succeeded.");
}

module.exports = {
  DEFAULTS,
  getCurrentBranch,
  parseArgs,
  findRecordsByName,
};

if (require.main === module) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
