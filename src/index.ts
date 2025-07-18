#!/usr/bin/env node

import express, { Request, Response } from "express";import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { railwayClient } from "@/api/api-client.js";
import { registerAllTools } from "@/tools/index.js";

// Get token from command line if provided
const cliToken = process.argv[2];
if (cliToken) {
  process.env.RAILWAY_API_TOKEN = cliToken;
}

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
    ? "✅ Railway MCP server running with API token" + (cliToken ? " from command line" : " from environment")
    : "⚠️ Railway MCP server running without API token - use 'configure' tool to set token"
  );

  // 🟣 Railway-friendly HTTP server
const app = express();
const port = process.env.PORT || 8080;

app.get("/", (req: Request, res: Response) => {
  res.send("✅ MCP server is running (Stdio only)");
});

app.listen(port, () => {
  console.log(`✅ HTTP server listening on port ${port}`);
});
}

main().catch((error) => {
  console.error("❌ Fatal error in main():", error);
  process.exit(1);
});
