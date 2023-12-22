const { createAppAuth } = require("@octokit/auth-app");
const { Octokit } = require("@octokit/rest");

require("dotenv").config()
const appOctokit = new Octokit({
  authStrategy: createAppAuth,
  auth: {
    appId: process.env.APP_ID,
    privateKey: process.env.PRIVATE_KEY,
    installationId: process.env.INSTALLATION_ID,
  },
});

appOctokit.actions.createWorkflowDispatch({
    owner: "your-username",
    repo: "your-repo",
    workflow_id: "workflow-file.yml",
    ref: "branch-name",
  }).then(response => {
    console.log(response.data);
  }).catch(error => {
    console.error("Error triggering workflow: ", error);
  });
  