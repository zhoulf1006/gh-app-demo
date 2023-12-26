const { Octokit } = require('@octokit/rest');

async function checkTokenPermissions(token) {
    try {
        const octokit = new Octokit({ auth: token });

        // Make a simple request to get the response headers
        const response = await octokit.request('GET /user');

        // Extract the scopes from the 'x-oauth-scopes' header
        console.log(`response.headers: ${JSON.stringify(response.headers)}`)
        const scopes = response.headers['x-oauth-scopes'];
        console.log('Token scopes:', scopes);

        return scopes;
    } catch (error) {
        console.error('Error checking token permissions:', error);
        throw error;
    }
}

module.exports = { checkTokenPermissions };
