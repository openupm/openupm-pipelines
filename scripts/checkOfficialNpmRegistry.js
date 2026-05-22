const fs = require("fs");

const lockfilePath = "package-lock.json";
const allowedRegistry = "https://registry.npmjs.org/";

function collectRegistryViolations(lockfile) {
  const violations = [];

  for (const [name, dependency] of Object.entries(lockfile.packages || {})) {
    visitDependency(violations, name, dependency);
  }

  for (const [name, dependency] of Object.entries(
    lockfile.dependencies || {},
  )) {
    visitDependency(violations, name, dependency);
  }

  return violations;
}

function visitDependency(violations, name, dependency) {
  if (!dependency || typeof dependency !== "object") return;
  if (
    typeof dependency.resolved === "string" &&
    dependency.resolved.startsWith("http") &&
    !dependency.resolved.startsWith(allowedRegistry)
  ) {
    violations.push({ name, resolved: dependency.resolved });
  }
}

function main() {
  const lockfile = JSON.parse(fs.readFileSync(lockfilePath, "utf8"));
  const violations = collectRegistryViolations(lockfile);

  if (violations.length > 0) {
    console.error(
      `Found ${violations.length} package-lock resolved URL(s) outside ${allowedRegistry}:`,
    );
    for (const violation of violations) {
      console.error(`- ${violation.name}: ${violation.resolved}`);
    }
    process.exit(1);
  }

  console.log(`All package-lock resolved URLs use ${allowedRegistry}`);
}

if (require.main === module) {
  main();
}

module.exports = {
  collectRegistryViolations,
};
