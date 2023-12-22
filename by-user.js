require('dotenv').config();
const express = require('express');
const { Octokit } = require('@octokit/rest');
const app = express();
const port = 3000;

// Replace with your GitHub App's client ID and secret
const CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;

// Redirect users to request GitHub access
app.get('/login/github', (req, res) => {
    const url = `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}`;
    res.redirect(url);
});

// GitHub callback URL
app.get('/github/callback', async (req, res) => {
    const code = req.query.code;

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
    const accessToken = data.access_token;

    // Use the access token with Octokit
    const octokit = new Octokit({ auth: accessToken });

    // Now you can perform actions with the octokit instance on behalf of the authenticated user
    // Example: Fetch user info
    const userInfo = await octokit.users.getAuthenticated();
    console.log(userInfo.data);

    res.send('Login successful!');
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
