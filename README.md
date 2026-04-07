# Azure Pipelines for OpenUPM

A customized proxy builder to build and publish upm package using `Azure Pipelines`.

## Security

The pipeline uses a containerized `BuildPackage` stage and then routes the
packed tarball into one of two publish stages:

- normal publish: `PublishPackage` publishes to OpenUPM
- e2e publish: `PublishE2EPackage` publishes to a local Verdaccio registry

Both publish stages consume the tarball artifact and use
`npm publish --ignore-scripts`.

This keeps compatibility with packages that rely on `prepack` or
`prepublishOnly` while keeping the OpenUPM publish credential out of the
untrusted build stage.

## Prepare Azure

Prepare an npm service connection:

- Visit https://dev.azure.com/openupm/openupm
- Project settings > Service connections > New service connection > npm
- Connection name, `openupm`
- Registry URL, `https://package.openupm.com`
- Personal Token...

## Build with REST API

Required `parameters` payload:

```json
{
  "repoUrl": "https://...",
  "repoBranch": "master",
  "packageName": "com.yourcompany.package...",
  "packageVersion": "1.2.3",
  "e2eTest": "false"
}
```

`e2eTest` is optional and defaults to `false`. Set it to `"true"` to route the
run to the Verdaccio-based end-to-end publish test instead of the normal
OpenUPM publish stage.

If no variables are provided, the build is aborted as failed via
[`vstsabort`](https://github.com/lextm/vstsabort).

API reference:
[`azure-devops-rest-5.1`](https://docs.microsoft.com/en-us/rest/api/azure/devops/build/builds/queue?view=azure-devops-rest-5.1)

Set your Azure DevOps Personal Access Token in the environment before calling the
API:

```bash
export AZURE_DEVOPS_TOKEN_OPENUPM_PIPELINE="your-personal-access-token"
```

```bash
curl --verbose \
  --user ":$AZURE_DEVOPS_TOKEN_OPENUPM_PIPELINE" \
  --request POST \
  "https://dev.azure.com/openupm/openupm/_apis/build/builds?api-version=5.1" \
  --json '{
    "definition": { "id": 1 },
    "parameters": "{\"repoUrl\":\"https://...\",\"repoBranch\":\"master\",\"packageName\":\"com.yourcompany.package...\",\"packageVersion\":\"1.2.3\",\"e2eTest\":\"false\"}"
  }'
```

The `parameters` argument is [a stringified dictionary](https://stackoverflow.com/questions/34343084/start-a-build-and-passing-variables-through-vsts-rest-api/36339920#36339920).

When queueing the pipeline through the REST API, the run uses the pipeline's
default branch unless you override `sourceBranch`. This is important when
testing changes from a non-default branch of `openupm-pipelines`:

```json
{
  "definition": { "id": 1 },
  "sourceBranch": "refs/heads/your-branch-name",
  "parameters": "{\"repoUrl\":\"https://...\",\"repoBranch\":\"master\",\"packageName\":\"com.yourcompany.package...\",\"packageVersion\":\"1.2.3\",\"e2eTest\":\"false\"}"
}
```

## Manual E2E Fixture

Use this fixture for manual end-to-end testing:

```json
{
  "repoUrl": "https://github.com/favoyang/com.example.nuget-consumer",
  "repoBranch": "1.0.1",
  "packageName": "com.example.nuget-consumer",
  "packageVersion": "1.0.1",
  "e2eTest": "true"
}
```

When testing pipeline changes from a branch, queue the run via REST API and set
`sourceBranch` to that branch so Azure uses your branch version of
`azure-pipelines.yml`.

When running the e2e path, the pipeline publishes the tarball to a local
Verdaccio instance with anonymous publish access and then prints the published
metadata plus the Verdaccio storage contents into the job log.

To queue that documented fixture from the current branch and stream the relevant
Azure logs automatically, run:

```bash
npm run test:e2e:azure
```

This helper expects `AZURE_DEVOPS_TOKEN_OPENUPM_PIPELINE` in the environment.
It defaults to the documented `e2eTest=true` fixture and uses the current Git
branch as `sourceBranch`. To run the normal OpenUPM validation instead, use:

```bash
node scripts/runAzureFixture.js --e2e-test false
```

That mode expects the duplicate-version `409 Conflict` failure and exits
successfully only when it observes that result.

GitHub Actions also runs this helper in a separate `Azure E2E` job when the
repository secret `AZURE_DEVOPS_TOKEN_OPENUPM_PIPELINE` is configured. That job
is intentionally separate from the normal unit-test job because it is a
credentialed integration test against Azure Pipelines.

For a manual check of the normal OpenUPM path, queue the same package/version
with `e2eTest=false` only when that version is already published. The expected
result for that validation run is an OpenUPM publish failure with HTTP `409
Conflict`, which confirms the pipeline stayed on the real registry path.

## Build with `azure-devops-node-api`

https://github.com/Microsoft/azure-devops-node-api

```javascript
const azureDevops = require("azure-devops-node-api");

const token = process.env.AZURE_DEVOPS_TOKEN_OPENUPM_PIPELINE;
const endpoint = 'https://dev.azure.com/openupm';
const definitionId = 1;
const project = 'openupm';

const buildPipelines = async function () {
  let authHandler = azureDevops.getPersonalAccessTokenHandler(token);
  let conn = new azureDevops.WebApi(endpoint, authHandler);
  var buildApi = await conn.getBuildApi();
  let build = await buildApi.queueBuild({
    definition: {
      id: definitionId
    },
    sourceBranch: 'refs/heads/your-branch-name',
    parameters:
      JSON.stringify(
        {
          repoUrl: 'https://...',
          repoBranch: 'master',
          packageName: 'com.yourcompany.package...',
          packageVersion: '1.2.3',
          e2eTest: 'false',
          ...
        }
      )
  }, project);
  console.log(build);
};
```

## Contributors

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tbody>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="http://littlebigfun.com"><img src="https://avatars.githubusercontent.com/u/125390?v=4?s=100" width="100px;" alt="Favo Yang"/><br /><sub><b>Favo Yang</b></sub></a><br /><a href="https://github.com/openupm/openupm-pipelines/commits?author=favoyang" title="Code">💻</a> <a href="#maintenance-favoyang" title="Maintenance">🚧</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://gaijinent.com/"><img src="https://avatars.githubusercontent.com/u/5287406?v=4?s=100" width="100px;" alt="Pavel "am1goo" Shestakov"/><br /><sub><b>Pavel "am1goo" Shestakov</b></sub></a><br /><a href="https://github.com/openupm/openupm-pipelines/commits?author=am1goo" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/James-Frowen"><img src="https://avatars.githubusercontent.com/u/23101891?v=4?s=100" width="100px;" alt="James Frowen"/><br /><sub><b>James Frowen</b></sub></a><br /><a href="https://github.com/openupm/openupm-pipelines/issues?q=author%3AJames-Frowen" title="Bug reports">🐛</a></td>
    </tr>
  </tbody>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->
