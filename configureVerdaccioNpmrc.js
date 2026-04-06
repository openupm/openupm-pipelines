"use strict";

const fs = require("fs");
const path = require("path");

/**
 * Build the npmrc auth key for a registry URL.
 * @param {string} registryUrl
 * @returns {string}
 */
function getRegistryAuthKey(registryUrl) {
  const url = new URL(registryUrl);
  const pathname = url.pathname.endsWith("/")
    ? url.pathname
    : `${url.pathname}/`;
  return `//${url.host}${pathname}:_authToken`;
}

/**
 * Create a Verdaccio user token and write npm auth config.
 * @param {object} options
 * @param {string} options.registryUrl
 * @param {string} options.username
 * @param {string} options.password
 * @param {string} options.email
 * @param {string} options.npmrcPath
 * @returns {Promise<void>}
 */
async function configureVerdaccioNpmrc({
  registryUrl,
  username,
  password,
  email,
  npmrcPath,
}) {
  const registry = new URL(registryUrl);
  const userPath = `-/user/org.couchdb.user:${encodeURIComponent(username)}`;
  const response = await fetch(new URL(userPath, registry), {
    method: "PUT",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      _id: `org.couchdb.user:${username}`,
      name: username,
      password,
      email,
      type: "user",
      roles: [],
      date: new Date().toISOString(),
    }),
  });

  const responseText = await response.text();
  if (!response.ok) {
    throw new Error(
      `Verdaccio login failed (${response.status}): ${responseText}`,
    );
  }

  /** @type {{token?: string}} */
  const payload = responseText ? JSON.parse(responseText) : {};
  if (!payload.token) {
    throw new Error("Verdaccio login response did not include a token");
  }

  fs.mkdirSync(path.dirname(npmrcPath), { recursive: true });
  const registryLine = registry.href.endsWith("/")
    ? registry.href
    : `${registry.href}/`;
  const authKey = getRegistryAuthKey(registry.href);
  fs.writeFileSync(
    npmrcPath,
    [
      `registry=${registryLine}`,
      `${authKey}=${payload.token}`,
      "always-auth=true",
    ].join("\n") + "\n",
  );
}

if (require.main === module) {
  const [registryUrl, username, password, email, npmrcPath] =
    process.argv.slice(2);

  if (!registryUrl || !username || !password || !email || !npmrcPath) {
    console.error(
      "Usage: node configureVerdaccioNpmrc.js <registry-url> <username> <password> <email> <npmrc-path>",
    );
    process.exit(1);
  }

  configureVerdaccioNpmrc({
    registryUrl,
    username,
    password,
    email,
    npmrcPath,
  }).catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}

module.exports = {
  configureVerdaccioNpmrc,
  getRegistryAuthKey,
};
