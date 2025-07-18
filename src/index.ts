#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHttpServerTransport } from "@modelcontextprotocol/sdk/server/streamable-http.js";
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

// Enregistre les outils (comme "railway", etc.)
registerAllTools(server);

async function main() {
  await railwayClient.initialize();

  const port = Number(process.env.PORT || 8080);
  const transport = new StreamableHttpServerTransport({ port });

  await server.connect(transport);

  const hasToken = railwayClient.getToken() !== null;
  console.log(
    hasToken
      ? `✅ MCP HTTP server ready on port ${port} (token OK)`
      : `⚠️ MCP HTTP server ready on port ${port} (no token)`
  );
}

main().catch((error) => {
  console.error("❌ Fatal error in main():", error);
  process.exit(1);
});
