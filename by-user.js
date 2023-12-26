require('dotenv').config();
const { checkTokenPermissions } = require('./check-permissions');

const express = require('express');
const { Octokit } = require('@octokit/rest');
const app = express();
const port = 3000;

// Replace with your GitHub App's client ID and secret
const CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;

let userAccessToken;

// Redirect users to request GitHub access
app.get('/login/github', (req, res) => {
    const scopes = 'repo, workflow, user';
    const url = `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&scope=${scopes}`;
    res.redirect(url);
});

// GitHub callback URL
app.get('/api/auth/callback/github', async (req, res) => {
    const code = req.query.code;

    try {
        // Exchange code for an access token
        const response = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                code: code,
            }),
        });

        const data = await response.json();
        userAccessToken  = data.access_token;
        console.log(`userAccessToken: ${userAccessToken}`)

        // Use the access token with Octokit
        const octokit = new Octokit({ auth: userAccessToken });

        // Now you can perform actions with the octokit instance on behalf of the authenticated user
        // Example: Fetch user info
        const userInfo = await octokit.users.getAuthenticated();
        console.log(userInfo.data);

        res.send('Login successful!');
    } catch (error) {
        console.error('Error during authentication: ', error);
        res.status(500).send('Authentication failed');
    }
});

// Route to check the permissions of the user's access token
app.get('/check-permissions', async (req, res) => {
    if (!userAccessToken) {
        res.status(403).send('User not authenticated');
        return;
    }

    try {
        const scopes = await checkTokenPermissions(userAccessToken);
        res.send(`The access token has the following scopes: ${scopes}`);
    } catch (error) {
        res.status(500).send('Error checking token permissions');
    }
});

// Route to trigger a GitHub Actions workflow
app.get('/trigger-workflow', async (req, res) => {
    if (!userAccessToken) {
        res.status(403).send('User not authenticated');
        return;
    }

    try {
        const octokit = new Octokit({ auth: userAccessToken });

        // Replace with your GitHub username, repository, and workflow file name
        const owner = process.env.GITHUB_OWNER;
        const repo = process.env.GITHUB_REPO;
        const workflow_id = process.env.GITHUB_WORKFLOW_FILE;

        // Trigger the workflow
        await octokit.actions.createWorkflowDispatch({
            owner,
            repo,
            workflow_id,
            ref: 'main', // Replace with your branch name if different
        });

        res.send('Workflow triggered successfully!');
    } catch (error) {
        console.error('Error triggering workflow: ', error);
        res.status(500).send('Failed to trigger workflow');
    }
});


app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
    console.log(`Login at http://localhost:${port}/login/github`);
    console.log(`Trigger workflow at http://localhost:${port}/trigger-workflow`);
});
