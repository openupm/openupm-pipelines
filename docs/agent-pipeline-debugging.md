# Pipeline debugging reference

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
