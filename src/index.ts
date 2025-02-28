#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { railwayApi } from "./api-client.js";
import { registerProjectTools } from "./tools/projects.js";
import { registerServiceTools } from "./tools/services.js";
import { registerDeploymentTools } from "./tools/deployments.js";
import { registerVariableTools } from "./tools/variables.js";

// Create MCP server
const server = new McpServer({
  name: "railway-mcp",
  version: "1.0.0",
});

// Read token from environment variables first, or keep as null to be set via the configure tool
let apiToken: string | null = process.env.RAILWAY_API_TOKEN || null;

// Configure tool - for setting up the API token manually if not available in environment
server.tool(
  "configure",
  "Configure the Railway API connection (only needed if not set in environment variables)",
  {
    token: z.string().describe("Railway API token"),
  },
  async ({ token }) => {
    try {
      // Test the token with a simple query
      railwayApi.setToken(token);
      const user = await railwayApi.validateToken();
      apiToken = token;
      
      return {
        content: [
          {
            type: "text" as const,
            text: `✅ Successfully connected to Railway API as ${user.name || user.email || 'user'}`,
          },
        ],
      };
    } catch (error) {
      return {
        isError: true,
        content: [
          {
            type: "text" as const,
            text: `❌ Failed to connect to Railway API: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
      };
    }
  }
);

// Register all tool modules
registerProjectTools(server);
registerServiceTools(server);
registerDeploymentTools(server);
registerVariableTools(server);

// Connect server to stdio transport
async function main() {
  // Set token from environment if available
  if (apiToken) {
    railwayApi.setToken(apiToken);
    try {
      const user = await railwayApi.validateToken();
      console.error(`Successfully authenticated with environment token as: ${user.name || user.email || 'user'}`);
    } catch (error) {
      console.error("Error validating environment API token:", error instanceof Error ? error.message : 'Unknown error');
      apiToken = null; // Reset to null if validation fails
      railwayApi.setToken(null);
    }
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  // Log current setup
  if (apiToken) {
    console.error("Railway MCP server running with API token from environment");
  } else {
    console.error("Railway MCP server running without API token - use 'configure' tool to set token");
  }
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
