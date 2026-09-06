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

## Pull Request Delivery Workflow

Deliver repository changes through pull requests by default, regardless of
size. Do not make changes directly in the main checkout unless the user
explicitly approves an exception. Direct commits to `main` or the default
branch should be limited to explicit user-approved exceptions.

Work on a dedicated topic branch, using a separate worktree when required or
useful. Make the requested change, run relevant validation, and pass the review
gate below before committing or creating/updating a PR. Keep saved-plan
progress current and close the plan when its objective is complete. PRs should
describe the final scope and validation results.

When asked to prepare changes as PRs for review, finish with validated,
reviewed PRs and report remaining limitations. A read-only review ends with
findings and coverage limits; it does not authorize changes or PR creation.
For authorized delivery, continue through green checks,
merge, any explicitly authorized deployment, and verified cleanup. Use a
Conventional Commit PR title and squash subject when the repository uses them
to determine release versions.

Treat a request to `deploy`, `ship`, `publish`, or `deliver` the current
requested repository change set as authorization to complete this normal
topic-branch workflow: commit reviewed in-scope changes, push the topic branch,
create or update its pull request, monitor required checks, make narrowly scoped
fixes for failures caused by the change, merge when all gates pass, and remove
the clean merged worktree and merged topic branches under the cleanup checks
below. Apply required validation and review to every fix. Do not ask for
separate approval for each ordinary step.

This authorization applies only to the current requested repository change
set. It does not authorize force pushes; bypassing reviews, checks, or branch
protections; direct-default-branch commits; manual releases or package
publication outside the repository's existing merge-triggered automation;
access to or disclosure of secrets; destructive repository operations;
unrelated pull requests; or material scope expansion. Authorization to merge a
pull request includes any package version and publication performed
automatically by the repository's existing merge workflow. In this section,
`deploy` authorizes repository delivery; it authorizes a service or
infrastructure deployment only when the current request specifically identifies
that deployment. More-specific repository approval rules, including final
content or product publication, still apply. Cleanup is limited to the verified merged worktree and topic
branches described below; it never includes dirty worktrees or forced remote operations.

When requesting platform approval for an authorized step, quote the user's
delivery request and this shared instruction in the justification. If a
platform reviewer rejects the action, ask the user once and wait. Do not retry
an equivalent escalation or repeat the prompt during automatic continuations
unless the user provides new authorization or relevant context.

Before committing, run `git status --short`, stage intended files by exact
path, and verify the staged scope. For an explicitly approved default-branch
exception, state that the normal PR workflow is being bypassed and still check
scope. Include screenshots only for changes to rendered UI, generated visual
output, or external presentation.

## Merged-Branch Cleanup

After confirming the exact PR is merged, remove only its clean worktree.
Ordinary remote branch deletion requires the remote ref to match the PR's
recorded head. A local topic branch may be deleted with `git branch -D` only
when its tip matches that recorded head and either:

- Its tree matches the squash commit's tree; or
- When the base advanced, both the `git patch-id --verbatim` of the aggregate
  diff from the merge base matches the squash commit's first-parent diff and
  applying that exact aggregate diff to the first-parent tree produces the
  squash commit's tree.

The second proof handles intervening base changes without ignoring whitespace
or patch locations. Retain the branch if neither proof succeeds. This is not
authorization for `git branch -D` on any other local branch or for other
destructive operations.

## Review Gate

Before committing, use the installed `$branch-review-subagent-loop` skill to
review the complete branch diff. Follow the skill through any required fixes,
validation, and re-review. If the skill is unavailable, ask the user to install
it before continuing.

Create, update, or merge the pull request only after the review gate passes.
Merging also requires green checks unless the user explicitly accepts the
remaining risk.
