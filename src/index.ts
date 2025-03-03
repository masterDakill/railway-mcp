#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { railwayClient } from "@/api/api-client.js";
import { registerAllTools } from "@/tools/index.js";

const server = new McpServer({
  name: "railway-mcp",
  version: "1.0.0",
});

// Register all tool modules
registerAllTools(server);

// Connect server to stdio transport
async function main() {
  await railwayClient.initialize();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  const hasToken = railwayClient.getToken() !== null;
  console.error(hasToken 
    ? "Railway MCP server running with API token from environment"
    : "Railway MCP server running without API token - use 'configure' tool to set token"
  );
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
