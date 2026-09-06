# Repository Guidelines

## Project Structure & Module Organization

- `azure-pipelines.yml` defines the Azure Pipelines workflow. The pipeline is split into a containerized `BuildPackage` stage that produces a tarball artifact and a later publish stage that consumes that tarball.
- `findPackage.js`, `getDistTag.js`, and `createPackageArtifactMetadata.js` are the core Node scripts used by the pipeline.
- `test/` contains Mocha tests (`test-*.js`) plus shared helpers in `test/utils.js`.
- `repo/` is the checkout folder for target repositories; locally it serves as a fixture project folder for pipeline testing.
- Root files like `package.json` and `package-lock.json` define Node tooling and dependencies.

## Build, Test, and Development Commands

- `npm test` runs the Mocha test suite (`NODE_ENV=test` via `cross-env`).
- `node findPackage.js <pkg-name> <search-path> <output-file>` locates a package.json by name and writes JSON output.
- `node getDistTag.js <local_version> <latest_version>` prints the dist-tag to use when publishing.
- `node createPackageArtifactMetadata.js <package-folder> <tarball-path> <dist-tag> <output-file>` writes the stage handoff metadata for a packed tarball.

## Coding Style & Naming Conventions

- JavaScript uses 2-space indentation, double quotes, and semicolons (match existing files).
- Prefer clear, function-based modules exported via `module.exports`.
- Tests follow `test-<module>.js` naming and use Mocha + Should.
- Prettier is available in devDependencies for formatting when needed.
- Add JSDoc types for new or modified functions where practical.

## Testing Guidelines

- Framework: Mocha with `should` assertions.
- Add tests under `test/` and keep each file focused on one module.
- For code, pipeline, dependency, or tooling changes, run `npm test`, `npm run lint`, and `npm run format:check`; format only affected files when needed.
- For instruction-only changes, check generated freshness, changed Markdown formatting, links, and the diff.
- Run `npm run typecheck` when type-related changes are made (JSDoc/tsconfig).
- When changing `azure-pipelines.yml`, preserve end-to-end behavior for Git submodules, Git LFS fetches, and log visibility for clone/LFS failures because OpenUPM parses those logs.
- When working from a plan, after finishing any item, always state the next
  concrete step. Continue doing this until the plan is genuinely complete so
  the user does not need to ask "what's next?".

## Pipeline Guardrails

- Treat the upstream package repository as untrusted input.
- Keep untrusted package lifecycle hooks inside the containerized `BuildPackage` stage only.
- Do not introduce OpenUPM publish credentials into `BuildPackage`.
- `PublishPackage` and `PublishE2EPackage` must publish the tarball artifact, not the source checkout.
- Keep `npm publish --ignore-scripts` in the publish stage so publish-time hooks cannot execute there.
- Keep the `BuildPackage` container image aligned with `mise.toml` Node major. The YAML uses one hardcoded `nodeMajorVersion` and asserts it against `mise.toml`.
- Read the npm version from `mise.toml` instead of hardcoding it in multiple places.
- Keep `prepare`/Husky for local development, but disable Husky during CI dependency installation in `BuildPackage`.
- Use `e2eTest=true` to route a run to the Verdaccio-based e2e publish stage. Omitted or `false` means normal OpenUPM publish.

## Debugging Tips

For pipeline debugging, toolchain or Git LFS changes, and manual Azure fixture validation, read [docs/agent-pipeline-debugging.md](docs/agent-pipeline-debugging.md). Apply the pipeline and secret-handling guardrails in this file before running its commands.

## Security Notes

- Use `$AZURE_DEVOPS_TOKEN_OPENUPM_PIPELINE` for Azure DevOps authentication when manual debugging requires a token.
- Treat `$AZURE_DEVOPS_TOKEN_OPENUPM_PIPELINE` as a secret. Never print it, echo it, paste it into commit content, or include it in conversation responses.
- Do not add commands or logs that would expose registry credentials, Azure tokens, or generated auth files.

## Commit & Pull Request Guidelines

- Commit messages follow Conventional Commits (e.g., `feat:`, `fix:`, `chore:`, `docs:`) and may include scopes like `fix(ci):`.
- Use a `BREAKING CHANGE:` footer when introducing incompatible changes.
- PRs should describe the change, link related issues, and note test results (e.g., `npm test`).

## Configuration & Environment Notes

- Node tooling is pinned via mise in `mise.toml`.
- Pipeline variables are expected by `azure-pipelines.yml`; see `README.md` for usage examples.

<!-- @agentsnippet "@/pull-request-delivery-workflow.md" -->
