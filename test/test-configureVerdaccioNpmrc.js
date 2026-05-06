"use strict";
/* global describe, it */

const fs = require("fs");
const http = require("http");
const os = require("os");
const path = require("path");

const should = require("should");

const {
  configureVerdaccioNpmrc,
  getRegistryAuthKey,
} = require("../configureVerdaccioNpmrc");

describe("configureVerdaccioNpmrc.js", function () {
  it("writes an npmrc with the Verdaccio token returned by adduser", async function () {
    let requestBody = "";
    const server = http.createServer((req, res) => {
      req.on("data", (chunk) => {
        requestBody += chunk;
      });
      req.on("end", () => {
        req.method.should.equal("PUT");
        req.url.should.equal("/-/user/org.couchdb.user:openupm-e2e");
        res.writeHead(201, { "content-type": "application/json" });
        res.end(JSON.stringify({ ok: "created", token: "verdaccio-token" }));
      });
    });

    await new Promise((resolve) =>
      server.listen(0, "127.0.0.1", () => resolve(undefined)),
    );
    const address = server.address();
    should.exist(address);
    if (!address || typeof address === "string") {
      throw new Error("Expected TCP server address");
    }

    const tempDir = fs.mkdtempSync(
      path.join(os.tmpdir(), "configure-verdaccio-npmrc-"),
    );
    const npmrcPath = path.join(tempDir, ".npmrc");
    const registryUrl = `http://127.0.0.1:${address.port}`;

    try {
      await configureVerdaccioNpmrc({
        registryUrl,
        username: "openupm-e2e",
        password: "openupm-e2e-password",
        email: "e2e@example.invalid",
        npmrcPath,
      });

      const payload = JSON.parse(requestBody);
      payload._id.should.equal("org.couchdb.user:openupm-e2e");
      payload.name.should.equal("openupm-e2e");
      payload.password.should.equal("openupm-e2e-password");
      payload.email.should.equal("e2e@example.invalid");

      const npmrc = fs.readFileSync(npmrcPath, "utf8");
      npmrc.should.equal(
        [
          `registry=${registryUrl}/`,
          `${getRegistryAuthKey(registryUrl)}=verdaccio-token`,
          "always-auth=true",
          "",
        ].join("\n"),
      );
    } finally {
      server.close();
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });
});
