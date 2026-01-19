# Repository Guidelines

## Project Structure & Module Organization

- `azure-pipelines.yml` defines the Azure Pipelines workflow for building and publishing packages.
- `findPackage.js` and `getDistTag.js` are the core Node scripts used by the pipeline.
- `test/` contains Mocha tests (`test-*.js`) plus shared helpers in `test/utils.js`.
- `repo/` is the checkout folder for target repositories; locally it serves as a fixture project folder for pipeline testing.
- Root files like `package.json` and `package-lock.json` define Node tooling and dependencies.

## Build, Test, and Development Commands

- `npm test` runs the Mocha test suite (`NODE_ENV=test` via `cross-env`).
- `node findPackage.js <pkg-name> <search-path> <output-file>` locates a package.json by name and writes JSON output.
- `node getDistTag.js <local_version> <latest_version>` prints the dist-tag to use when publishing.

## Coding Style & Naming Conventions

- JavaScript uses 2-space indentation, double quotes, and semicolons (match existing files).
- Prefer clear, function-based modules exported via `module.exports`.
- Tests follow `test-<module>.js` naming and use Mocha + Should.
- Prettier is available in devDependencies for formatting when needed.

## Testing Guidelines

- Framework: Mocha with `should` assertions.
- Add tests under `test/` and keep each file focused on one module.
- Run all tests with `npm test` before submitting changes.
- When modifying files, run `npm run lint` and `npm run format`.
- Before committing, run `npm run format:check`.
- Run `npm run typecheck` when type-related changes are made (JSDoc/tsconfig).

## Commit & Pull Request Guidelines

- Commit messages follow Conventional Commits (e.g., `feat:`, `fix:`, `chore:`, `docs:`) and may include scopes like `fix(ci):`.
- Use a `BREAKING CHANGE:` footer when introducing incompatible changes.
- PRs should describe the change, link related issues, and note test results (e.g., `npm test`).

## Configuration & Environment Notes

- Node tooling is pinned via Volta in `package.json`.
- Pipeline variables are expected by `azure-pipelines.yml`; see `README.md` for usage examples.
