# Azure Pipelines for OpenUPM

A customized proxy builder to build and publish upm package using `Azure Pipelines`.

## Security

The pipeline uses two stages. `BuildPackage` runs upstream package lifecycle
hooks inside a container job, packs the package into a `.tgz`, and publishes
that tarball as a pipeline artifact. `PublishPackage` downloads the tarball,
verifies its SHA-256, and publishes it with `npm publish --ignore-scripts`.

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
  "packageVersion": "1.2.3"
}
```

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
    "parameters": "{\"repoUrl\":\"https://...\",\"repoBranch\":\"master\",\"packageName\":\"com.yourcompany.package...\",\"packageVersion\":\"1.2.3\"}"
  }'
```

The `parameters` argument is [a stringified dictionary](https://stackoverflow.com/questions/34343084/start-a-build-and-passing-variables-through-vsts-rest-api/36339920#36339920).

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
    parameters:
      JSON.stringify(
        {
          repoUrl: 'https://...',
          repoBranch: 'master',
          packageName: 'com.yourcompany.package...',
          packageVersion: '1.2.3',
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
