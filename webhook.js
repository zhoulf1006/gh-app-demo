import dotenv from 'dotenv'
import fs from 'fs'
import http from 'http'
import { Octokit, App } from 'octokit'
import { createNodeMiddleware } from '@octokit/webhooks'

// Load environment variables from .env file
dotenv.config()

// Set configured values
const appId = process.env.APP_ID
const privateKey = process.env.PRIVATE_KEY
const secret = process.env.WEBHOOK_SECRET
const enterpriseHostname = process.env.ENTERPRISE_HOSTNAME
const messageForNewPRs = fs.readFileSync('./message.md', 'utf8')

// Create an authenticated Octokit client authenticated as a GitHub App
try {
  const app = new App({
    appId,
    privateKey,
    webhooks: {
      secret
    },
    ...(enterpriseHostname && {
      Octokit: Octokit.defaults({
        baseUrl: `https://${enterpriseHostname}/api/v3`
      })
    })
  })

  // Logging Middleware
  const logRequests = (req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next(); // Continue to the next middleware
  }

  // Optional: Get & log the authenticated app's name
  const { data } = await app.octokit.request('/app')

  // Read more about custom logging: https://github.com/octokit/core.js#logging
  app.octokit.log.debug(`Authenticated as '${data.name}'`)
  let eventHandled = false;
  // Subscribe to the "pull_request.opened" webhook event
  app.webhooks.on('pull_request.opened', async ({ octokit, payload }) => {
    console.log(`Received a pull request event for #${payload.pull_request.number}`)
    eventHandled = true;
    try {
      await octokit.rest.issues.createComment({
        owner: payload.repository.owner.login,
        repo: payload.repository.name,
        issue_number: payload.pull_request.number,
        body: messageForNewPRs
      })
    } catch (error) {
      if (error.response) {
        console.error(`Error! Status: ${error.response.status}. Message: ${error.response.data.message}`)
      } else {
        console.error(error)
      }
    }
  })

  // Handler for any event
  app.webhooks.onAny(({ id, name, payload }) => {
    if (!eventHandled) {
      console.log(`Unhandled event: ${id}, ${name}`);
      // Log the payload or any other relevant information
    }
    // Reset the flag for the next event
    eventHandled = false;
  });

  // Optional: Handle errors
  app.webhooks.onError((error) => {
    if (error.name === 'AggregateError') {
      // Log Secret verification errors
      console.log(`Error processing request: ${error.event}`)
    } else {
      console.log(error)
    }
  })
  // Launch a web server to listen for GitHub webhooks
  const port = process.env.PORT || 3000
  const path = '/api/webhook'
  const localWebhookUrl = `http://localhost:${port}${path}`

  // See https://github.com/octokit/webhooks.js/#createnodemiddleware for all options
  const middleware = createNodeMiddleware(app.webhooks, { path })

  // http.createServer(middleware).listen(port, () => {
  //   console.log(`Server is listening for events at: ${localWebhookUrl}`)
  //   console.log('Press Ctrl + C to quit.')
  // })
  http.createServer((req, res) => {
    logRequests(req, res, () => middleware(req, res));
  }).listen(port, () => {
    console.log(`Server is listening for events at: ${localWebhookUrl}`)
    console.log('Press Ctrl + C to quit.')
  })

}
catch (e) {
  console.log(e)
}


