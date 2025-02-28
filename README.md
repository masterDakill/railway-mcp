# Railway MCP Server

| Please Note: This is under development and not all features are available yet. 🚧 |
| ----------------------------------------------------------------------------- |

A [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) server for integrating with the [Railway.app](https://railway.app) platform.

This MCP server provides tools for managing Railway projects, services, deployments, and variables through LLM applications that support MCP, such as Claude for Desktop.

## Features

- ✅ Authentication with Railway API tokens
- ✅ Project management (list, info, delete)
- ✅ Service management (create from GitHub repo or Docker image, list)
- ✅ Deployment management (list, restart)
- ✅ Variable management (list, create/update, delete)

## Installation

### Prerequisites

- Node.js 18+ (for built-in fetch API support)
- An active Railway account
- A Railway API token (create one at https://railway.app/account/tokens)

### Quick Start

The easiest way to use the Railway MCP server is through npx:

```bash
npx @jasontanswe/railway-mcp
```

### Global Installation

If you prefer to install globally:

```bash
npm install -g @jasontanswe/railway-mcp
```

## Usage with Claude for Desktop

This MCP server is designed to work with LLM applications like Claude for Desktop.

1. Create or edit your Claude for Desktop config file:
   - macOS: `~/Library/Application\ Support/Claude/claude_desktop_config.json`
   - Windows: `%APPDATA%\Claude\claude_desktop_config.json`

2. Add the railway-mcp server to your configuration with your API token:

```json
{
  "mcpServers": {
    "railway": {
      "command": "npx",
      "args": ["-y", "@jasontanswe/railway-mcp"],
      "env": {
        "RAILWAY_API_TOKEN": "your-railway-api-token-here"
      }
    }
  }
}
```

3. Restart Claude for Desktop

4. You can now start using Railway tools directly in Claude. For example:

```
Please list all my Railway projects
```

5. Alternatively, if you don't want to add your token to the configuration file, you can configure it within Claude using:

```
Please configure the Railway API with my token: {YOUR_API_TOKEN_HERE}
```

## Available Tools

### Authentication
- `configure` - Set your Railway API token (only needed if not provided in environment variables)

### Projects
- `project-list` - List all projects in your account
- `project-info` - Get detailed information about a specific project
- `project-delete` - Delete a project (requires confirmation)

### Services
- `service-create-from-repo` - Create a new service from a GitHub repository
- `service-create-from-image` - Create a new service from a Docker image
- `service-list` - List all services in a project

### Deployments
- `deployment-list` - List recent deployments for a service
- `deployment-restart` - Restart a specific deployment

### Variables
- `variable-list` - List variables for a service or environment
- `variable-upsert` - Create or update a variable
- `variable-delete` - Delete a variable

## Example Workflows

### Setting up a new service

1. List projects to get the project ID
2. Create a new service from a template
3. Add environment variables
4. View the service deployment

### Managing environment variables

1. List projects to find your project ID
2. List variables to see what's currently set
3. Create or update variables as needed
4. Delete any obsolete variables

## Security Considerations

- Railway API tokens provide full access to your account. Keep them secure.
- When using the environment variable method, your token is stored in the Claude Desktop configuration file.
- Sensitive variable values are automatically masked when displayed.
- All API calls use HTTPS for secure communication.
- The server's memory-only token storage means your token is never written to disk outside of the configuration file.

## Troubleshooting

If you encounter issues:

1. **Token Authentication Issues**
   - Ensure your API token is valid and has the necessary permissions
   - If using the environment variable method, check that the token is correctly formatted in the config file
   - Try using the `configure` tool directly in Claude if the environment token isn't working

2. **Server Connection Issues**
   - Check that you've installed the latest version of the server
   - Verify that Node.js version 18 or higher is installed
   - Restart Claude for Desktop after making changes to the configuration

3. **API Errors**
   - Verify that you're using correct project, environment, and service IDs
   - Check Railway's status page for any service disruptions
   - Railway API has rate limits - avoid making too many requests in a short period

## Contributing

We welcome contributions from the community! Here's how you can help:

1. **Fork & Clone**
   ```bash
   git clone https://github.com/your-username/railway-mcp.git
   cd railway-mcp
   npm install
   ```

2. **Make Changes**
   - Create a new branch: `git checkout -b feature/your-feature`
   - Make your changes
   - Write or update tests if necessary
   - Follow the existing code style
   - Commit your changes: `git commit -m "Add your feature"`

3. **Test Your Changes**
   ```bash
   npm run build
   npm start
   ```

4. **Submit a Pull Request**
   - Push to your fork: `git push origin feature/your-feature`
   - Open a pull request from your fork to our main branch
   - Describe your changes and why they're needed
   - Link any related issues

### Development Guidelines

- Use TypeScript for all new code
- Follow the existing project structure
- Keep GraphQL queries in the `api-client.ts` file
- Add new tool implementations in the `tools/` directory

## Debugging

To enable debug logging for the Railway MCP server, add the `DEBUG` environment variable to your Claude Desktop configuration file:

1. Open your Claude Desktop config file:
   - macOS: `~/Library/Application\ Support/Claude/claude_desktop_config.json`
   - Windows: `%APPDATA%\Claude\claude_desktop_config.json`

2. Add the `DEBUG` environment variable to your railway-mcp configuration. You can choose one of these debug options:

```json
{
  "mcpServers": {
    "railway": {
      "command": "npx",
      "args": ["-y", "@jasontanswe/railway-mcp"],
      "env": {
        "RAILWAY_API_TOKEN": "your-railway-api-token-here",
        "DEBUG": "railway:*"  // All debug logs
      }
    }
  }
}
```

Available debug options:
- `railway:*` - Enable all debug logs
- `railway:api` - Only API request/response logs | Under Development 🚧
- `railway:tools` - Only tool execution logs | Under Development 🚧

3. Restart your MCP Client (i.e Claude for Desktop)

### API Debug Logs

When `DEBUG=railway:api` is set, the server will log all GraphQL operations:

1. **Request Details**
   ```
   GraphQL Request:
   Query: [the actual GraphQL query]
   Variables: [the variables being passed]
   ```

2. **Response Details**
   ```
   GraphQL Response: [the full response from Railway API]
   ```

These logs are invaluable for:
- Debugging query structure issues
- Verifying variable passing
- Understanding API responses
- Troubleshooting "Problem processing request" errors

### Common Issues

1. **"Problem processing request"**
   - Enable API debug logs with `DEBUG=railway:api`
   - Check the query structure in the logs
   - Verify variable names match the query parameters
   - Ensure all required variables are provided

2. **Authentication Issues**
   - Check if the API token is set correctly
   - Look for "Authorization" header in request logs
   - Verify token permissions in Railway dashboard

3. **WebSocket Connection Issues**
   - Enable WebSocket debug logs with `DEBUG=railway:ws`
   - Check connection status in logs
   - Verify subscription query format
   - Ensure proper connection initialization

### Development Tips

1. When implementing new features:
   - Test queries in [Railway's GraphQL playground](https://railway.com/graphiql) first, you will need to set your Authorization header to your Railway API token as done here:
   ```
   {
    "Authorization": "Bearer <your-railway-api-token>"
   }
   ```
   - Enable debug logs to verify query execution
   - Add appropriate error handling
   - Update type definitions as needed

2. For local development, you can run the server with debug logs and use your MCP client to test the features. You'll need to update your Claude Desktop config file to use the local server once built:
  ```json
  {
    "mcpServers": {
      "railway": {
        "command": "node",
        "args": ["/ABSOLUTE/PATH/TO/railway-mcp/build/index.js"],
        "env": {
          "RAILWAY_API_TOKEN": "your-railway-api-token-here",
          "DEBUG": "railway:*"  // All debug logs
        }
      }
    }
  }
  ```

## License

MIT
