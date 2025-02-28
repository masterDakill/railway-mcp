# Railway MCP Server

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

### Local Installation

```bash
# Clone the repository
git clone <repository_url>
cd railway-mcp

# Install dependencies
npm install

# Build the server
npm run build
```

### Global Installation

```bash
npm install -g railway-mcp
```

## Usage with Claude for Desktop

This MCP server is designed to work with LLM applications like Claude for Desktop.

1. Create or edit your Claude for Desktop config file:
   - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - Windows: `%APPDATA%\Claude\claude_desktop_config.json`

2. Add the railway-mcp server to your configuration with your API token:

```json
{
  "mcpServers": {
    "railway": {
      "command": "railway-mcp",
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

## Development

If you want to contribute to the development of this MCP server:

1. Clone the repository
2. Make your changes
3. Run `npm run build` to compile
4. Test your changes locally
5. Submit a pull request

## License

MIT
