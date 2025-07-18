// index.ts (Point d'entrée principal)

#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { railwayClient } from "@/api/api-client.js";
import { registerAllTools } from "@/tools/index.js";

// Permet d'utiliser un token passé en argument lors du démarrage
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

  const transport = new StdioServerTransport();
  await server.connect(transport);

  const hasToken = railwayClient.getToken() !== null;
  console.log(
    hasToken
      ? `✅ MCP server is running (token OK)`
      : `⚠️ MCP server is running WITHOUT token`
  );
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
