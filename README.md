# Azure Pipelines for OpenUPM

A customized proxy builder to build and publish upm package using `Azure Pipelines`.

## Prepare Azura

Prepare a service connection
- Visit https://dev.azure.com/openupm/openupm
- Project settings > Service connections > New service connection > npm
- Connection name, `openupm`
- Registry URL, `https://package.openupm.com`
- Personal Token...

## Build with REST API

Required variables

    {
        repo_url: 'https://...',
        repo_branch: 'master',
        package_name: 'com.yourcompany.package...'
    }

If no variables are provided, the build will be [abort as failed](https://github.com/lextm/vstsabort).

Api reference: [azure-devops-rest-5.1](https://docs.microsoft.com/en-us/rest/api/azure/devops/build/builds/queue?view=azure-devops-rest-5.1).

```bash
http --ignore-stdin \
  -v \
  -a username:token \
  post https://dev.azure.com/openupm/openupm/_apis/build/builds?api-version=5.1 \
  definition:='{ "id": 1 }' \
  parameters:='"{ \"repo_url\": \"https://...\", ... }"'
```

The `parameters` argument is [a stringified dictionary](https://stackoverflow.com/questions/34343084/start-a-build-and-passing-variables-through-vsts-rest-api/36339920#36339920).

## Build with azure-devops-node-api

https://github.com/Microsoft/azure-devops-node-api

```javascript
const azureDevops = require("azure-devops-node-api");

const token = '';
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
          repo_url: 'https://...',
          ...
        }
      )
  }, project);
  cconsole.log(build);
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
