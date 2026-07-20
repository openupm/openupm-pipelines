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
- Run all tests with `npm test` before submitting changes.
- When modifying files, run `npm run lint` and `npm run format`.
- Before committing, run `npm run format:check`.
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

- For GitHub-side debugging, `gh` is allowed and preferred for inspecting workflow runs, PRs, and logs when GitHub context is relevant.
- For Azure pipeline debugging, prefer preserving native command output instead of wrapping failures in generic helper scripts.
- Keep clone/LFS/submodule operations in explicit script steps so their stderr/stdout remains parsable in Azure logs.
- If Git LFS behavior changes, check both the container image contents and the effective Git config seen inside `BuildPackage`.
- If a pipeline tool version changes, verify both the YAML `nodeMajorVersion` and the `mise.toml` values.
- When queueing Azure via REST API from a non-default branch of this repo, set `sourceBranch` so the run uses that branch's pipeline definition instead of the default branch.
- Verdaccio e2e config lives at `test/verdaccio/config.yaml`.
- Manual e2e fixture for this repo:
  `repoUrl=https://github.com/favoyang/com.example.nuget-consumer`
  `repoBranch=1.0.1`
  `packageName=com.example.nuget-consumer`
  `packageVersion=1.0.1`
  `e2eTest=true`
- Use `npm run test:e2e:azure` to queue the documented Azure fixture from the
  current branch and print the relevant publish logs automatically.
- Use `node scripts/runAzureFixture.js --e2e-test false` for the normal publish
  validation that expects `409 Conflict`.
- GitHub Actions runs the Azure-backed helper in a separate `Azure E2E` job
  only when the `AZURE_DEVOPS_TOKEN_OPENUPM_PIPELINE` repository secret is
  available.
- Manual normal-publish validation should use `e2eTest=false` with a package
  version that is already published to OpenUPM. The expected result is a `409
Conflict` from the publish step.

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

## Pull Request Delivery Workflow

Deliver repository changes through pull requests by default, regardless of
size. Do not make changes directly in the main checkout unless the user
explicitly approves an exception. Direct commits to `main` or the default
branch should be limited to explicit user-approved exceptions.

Follow this delivery sequence:

1. Create a dedicated topic branch. Use a separate worktree when repository
   guidance requires one or when isolation is useful.
2. Make the requested change and run relevant validation.
3. Update plan progress when working from a saved plan.
4. Run the review gate, fix valid findings, revalidate, and repeat the review
   until it passes.
5. Close the plan when appropriate, then commit and push the reviewed change.
6. Create or update the GitHub pull request with a brief summary and the
   validation commands that were run.
7. Verify required checks and merge when there is no blocking reason.
8. Monitor any explicitly authorized deployment when applicable, then remove
   the clean merged worktree and delete its merged local and remote topic
   branches. Ordinary remote deletion is authorized after confirming that the
   exact pull request is merged and the remote ref matches its recorded head.
   After a squash merge, `git branch -D` is authorized only for the local topic
   branch after confirming that its tip also matches the recorded head and its
   tree matches the merge commit's tree.

Treat a request to `deploy`, `ship`, `publish`, or `deliver` the current
requested repository change set as authorization to complete this normal
topic-branch workflow: commit reviewed in-scope changes, push the topic branch,
create or update its pull request, monitor required checks, make narrowly scoped
fixes for failures caused by the change, merge when all gates pass, and remove
the clean merged worktree and merged topic branches under the cleanup checks
above. Apply required validation and review to every fix. Do not ask for
separate approval for each ordinary step.

This authorization applies only to the current requested repository change
set. It does not authorize force pushes; bypassing reviews, checks, or branch
protections; direct-default-branch commits; releases or package publication;
access to or disclosure of secrets; destructive repository operations;
unrelated pull requests; or material scope expansion. Cleanup does not include
removing a dirty worktree, using `git branch -D` for any other local branch, any
forced remote operation, or other destructive operations. In this section,
`deploy` authorizes repository delivery; it authorizes a service or
infrastructure deployment only when the current request specifically identifies
that deployment. More-specific repository approval rules, including final
content or product publication, still apply.

When requesting platform approval for an authorized step, quote the user's
delivery request and this shared instruction in the justification. If a
platform reviewer rejects the action, ask the user once and wait. Do not retry
an equivalent escalation or repeat the prompt during automatic continuations
unless the user provides new authorization or relevant context.

Direct-default-branch exceptions still need a clean scope check before
committing. When an exception is approved, state that the normal pull request
workflow is being bypassed because of the explicit exception.

Before committing, run `git status --short` and verify the staged files match
the requested change. Stage files by exact path when possible. Avoid broad
staging commands such as `git add .` when unrelated local work exists.

Include screenshots in the pull request only if a change affects rendered UI,
generated visual output, or external presentation.

## Review Gate

Before committing, use the installed `$branch-review-subagent-loop` skill to
review the complete branch diff. Follow the skill through any required fixes,
validation, and re-review. If the skill is unavailable, ask the user to install
it before continuing.

Create, update, or merge the pull request only after the review gate passes.
Merging also requires green checks unless the user explicitly accepts the
remaining risk.
