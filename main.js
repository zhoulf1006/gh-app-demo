const { createAppAuth } = require("@octokit/auth-app");
const { Octokit } = require("@octokit/rest");

console.log("start..")
require("dotenv").config()
const appOctokit = new Octokit({
  authStrategy: createAppAuth,
  auth: {
    appId: process.env.APP_ID,
    privateKey: process.env.PRIVATE_KEY,
    installationId: process.env.INSTALLATION_ID,
  },
});

console.log(process.env.APP_ID, process.env.PRIVATE_KEY)

appOctokit.actions.createWorkflowDispatch({
    owner: "zhoulf1006",
    repo: "gh-app-demo",
    workflow_id: "app-demo.yml",
    ref: "main",
  }).then(response => {
    console.log(response.data);
  }).catch(error => {
    console.error("Error triggering workflow: ", error);
  });
  