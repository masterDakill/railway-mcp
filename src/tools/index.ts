import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { databaseTools } from './database.tool.js';
import { deploymentTools } from './deployment.tool.js';
import { domainTools } from './domain.tool.js';
import { projectTools } from './project.tool.js';
import { serviceTools } from './service.tool.js';
import { tcpProxyTools } from './tcpProxy.tool.js';
import { variableTools } from './variable.tool.js';
import { configTools } from './config.tool.js';
import { volumeTools } from './volume.tool.js';
import { templateTools } from './template.tool.js';

type Tool = Parameters<McpServer['tool']>;

/**
 * Enregistre tous les outils sur le serveur MCP.
 * @param server Instance de McpServer
 */
export function registerAllTools(server: McpServer) {
  const allTools = [
    ...databaseTools,
    ...deploymentTools,
    ...domainTools,
    ...projectTools,
    ...serviceTools,
    ...tcpProxyTools,
    ...variableTools,
    ...configTools,
    ...volumeTools,
    ...templateTools,
  ];

  for (const tool of allTools) {
    if (Array.isArray(tool)) {
      server.tool(...tool as Tool);
    } else {
      console.warn('🟠 Outil ignoré : format incorrect', tool);
    }
  }
}
