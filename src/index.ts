#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { railwayClient } from "@/api/api-client.js";
import { registerAllTools } from "@/tools/index.js";

// Token via CLI
const cliToken = process.argv[2];
if (cliToken) {
  process.env.RAILWAY_API_TOKEN = cliToken;
}

const server = new McpServer({
  name: "railway-mcp",
  version: "1.0.0",
});

registerAllTools(server);

async function main() {
  await railwayClient.initialize();
  const transport = new StdioServerTransport(); // STDIO (pas HTTP pour l’instant)
  await server.connect(transport);

  const hasToken = railwayClient.getToken() !== null;
  console.log(hasToken
    ? `✅ MCP STDIO server ready (token OK)`
    : `⚠️ MCP STDIO server ready (no token)`
  );
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
