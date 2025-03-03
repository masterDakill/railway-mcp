# Railway MCP Server

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://avatars.githubusercontent.com/u/66716858?s=200&v=4" />
    <source media="(prefers-color-scheme: light)" srcset="https://avatars.githubusercontent.com/u/66716858?s=200&v=4" />
    <img alt="Railway" src="https://avatars.githubusercontent.com/u/66716858?s=200&v=4" height="40" />
  </picture>
  &nbsp;&nbsp;
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://github.com/user-attachments/assets/38db1bcd-50df-4a49-a106-1b5afd924cb2" />
    <source media="(prefers-color-scheme: light)" srcset="https://github.com/user-attachments/assets/82603097-07c9-42bb-9cbc-fb8f03560926" />
    <img alt="MCP" src="https://github.com/user-attachments/assets/82603097-07c9-42bb-9cbc-fb8f03560926" height="40" />
  </picture>
</p>

<p align="center">
  <strong>Let Claude and Cursor manage your Railway infrastructure through natural language. Deploy, configure, and monitor - autonomously and safely.</strong>
</p>

| Please Note: This is under development and not all features are available yet. 🚧 |
| ----------------------------------------------------------------------------- |

**Let Claude and other MCP clients manage your Railway.app infrastructure. Deploy services, manage variables, and monitor deployments - all through natural language.**

A [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) server for integrating with the [Railway.app](https://railway.app) platform.

## Table of Contents

<p align="center">
  <a href="#features">Features</a> •
  <a href="#installation">Installation</a> •
  <a href="#available-tools">Available Tools</a> •
  <a href="#example-workflows">Example Workflows</a> •
  <a href="#security-considerations">Security</a> •
  <a href="#troubleshooting">Troubleshooting</a> •
  <a href="#contributing">Contributing</a> •
</p>

## Features


| Status | Meaning |
|--------|---------|
| ✅ | Complete |
| 🚧🔨⏳ | Being Built or Needs Testing |
| ❌ | Not Built at the moment |

- ✅ Authentication with Railway API tokens
- ✅ Project management (list, info, delete)
- ✅ Deployment management (list, restart)
- 🚧🔨⏳ Service management (create from GitHub repo or Docker image, list)
- 🚧🔨⏳ Variable management (list, create/update, delete)
- ❌ Service Network management
- ❌ Volume management
- ❌ Full support for all templates
   - ❌ Database template support
   - Automatic database and networking workflows
- ❌ Most commonly used workflows
- ❌ More Robust checks for deployed services

## Installation

### Prerequisites

- Node.js 18+ (for built-in fetch API support)
- An active Railway account
- A Railway API token (create one at https://railway.app/account/tokens)

### Quick Start

This MCP server is designed to work with MCP Clients like:
- Claude for Desktop | ✅ Battle-Tested
- Cline | 🚧🔨⏳ Needs Testing
- Cursor | 🚧🔨⏳Needs Testing
- Windsurf | 🚧🔨⏳ Needs Testing
- Other MCP Clients | 🚧🔨⏳ Needs Testing

1. Create or edit your Claude for Desktop config file:
   - macOS: `~/Library/Application\ Support/Claude/claude_desktop_config.json`
   - Windows: `%APPDATA%\Claude\claude_desktop_config.json`

2. Add the railway-mcp server to your configuration with your API token:

```json
   "railway": {
      "command": "npx",
      "args": ["-y", "@jasontanswe/railway-mcp"],
      "env": {
         "RAILWAY_API_TOKEN": "your-railway-api-token-here"
      }
   }
```

When you have multiple MCP servers, your config file might look like this:

```json
{
  "mcpServers": {
    // ... All of your existing MCP servers ...

    // Add the railway-mcp server to your configuration with your API token
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

<details>
<summary><h2> Available Tools</h2></summary>

### Authentication
- `configure` - Set your Railway API token (only needed if not provided in environment variables)

### Projects
- `project-list` - List all projects in your account
- `project-info` - Get detailed information about a specific project
- `project-create` - Create a new project with optional team ID
- `project-delete` - Delete a project
- `project-environments` - List all environments in a project

### Services
- `service-list` - List all services in a specific project
- `service-info` - Get detailed information about a specific service
- `service-create-from-repo` - Create a new service from a GitHub repository
- `service-create-from-image` - Create a new service from a Docker image
- `service-delete` - Delete a service from a project
- `service-restart` - Restart a service in a specific environment
- `service-update` - Update service configuration (build command, start command, etc.) | 🚧 Needs Testing

### Deployments
- `deployment-list` - List recent deployments for a service
- `deployment-trigger` - Trigger a new deployment for a service
- `deployment-logs` - Get logs for a specific deployment
- `deployment-health-check` - Check the health/status of a deployment

### Variables
- `variable-list` - List variables for a service or environment
- `variable-set` - Create or update a variable
- `variable-delete` - Delete a variable
- `variable-bulk-set` - Bulk update variables for a service | 🚧 Needs Testing
- `variable-copy` - Copy variables between environments | 🚧 Needs Testing

### Databases
- `database-list-types` - List all available database types that can be deployed
- `database-deploy` - Deploy a new database service
</details>

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

We welcome contributions from the community! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details on how to get started, development guidelines, and debugging information.
