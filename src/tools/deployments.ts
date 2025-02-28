import { z } from 'zod';
import { railwayApi } from '../api-client.js';
import { ToolResult, Deployment, DeploymentLog } from '../types.js';
import { checkApiToken, createErrorResponse, createSuccessResponse, formatError, getStatusEmoji } from '../utils.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

export function registerDeploymentTools(server: McpServer) {
  // List deployments
  server.tool(
    "deployment-list",
    "List recent deployments for a service in a specific environment",
    {
      projectId: z.string().describe("ID of the project"),
      environmentId: z.string().describe("ID of the environment"),
      serviceId: z.string().describe("ID of the service"),
      limit: z.number().optional().describe("Maximum number of deployments to retrieve (default: 5)"),
    },
    async ({ projectId, environmentId, serviceId, limit = 5 }) => {
      const tokenCheck = checkApiToken();
      if (tokenCheck) return tokenCheck;

      try {
        const deployments = await railwayApi.listDeployments({
          projectId,
          environmentId,
          serviceId,
          limit,
        });
        
        if (deployments.length === 0) {
          return {
            content: [
              {
                type: "text" as const,
                text: "No deployments found for this service.",
              },
            ],
          };
        }

        const formattedDeployments = deployments.map(deployment => {
          const createdAt = new Date(deployment.createdAt).toLocaleString();
          
          return `
🚀 Deployment ID: ${deployment.id}
  Status: ${getStatusEmoji(deployment.status)} ${deployment.status}
  Created: ${createdAt}
  URL: ${deployment.url || deployment.staticUrl || "N/A"}
`;
        }).join("\n");

        return {
          content: [
            {
              type: "text" as const,
              text: `Recent deployments:\n${formattedDeployments}`,
            },
          ],
        };
      } catch (error) {
        return createErrorResponse(`Error listing deployments: ${formatError(error)}`);
      }
    }
  );

  // Get deployment details
  server.tool(
    "deployment-info",
    "Get detailed information about a specific deployment",
    {
      deploymentId: z.string().describe("ID of the deployment"),
    },
    async ({ deploymentId }) => {
      const tokenCheck = checkApiToken();
      if (tokenCheck) return tokenCheck;

      try {
        const deployment = await railwayApi.getDeployment(deploymentId);
        
        if (!deployment) {
          return createErrorResponse(`Deployment with ID ${deploymentId} not found.`);
        }

        const details = `
🚀 Deployment Details:
  ID: ${deployment.id}
  Status: ${getStatusEmoji(deployment.status)} ${deployment.status}
  Created: ${new Date(deployment.createdAt).toLocaleString()}
  Service: ${deployment.serviceId}
  Environment: ${deployment.environmentId}
  URL: ${deployment.url || deployment.staticUrl || "N/A"}
  Can Redeploy: ${deployment.canRedeploy ? "Yes" : "No"}
  Can Rollback: ${deployment.canRollback ? "Yes" : "No"}
`;

        return {
          content: [
            {
              type: "text" as const,
              text: details,
            },
          ],
        };
      } catch (error) {
        return createErrorResponse(`Error getting deployment info: ${formatError(error)}`);
      }
    }
  );

  // Trigger deployment
  server.tool(
    "deployment-trigger",
    "Trigger a new deployment for a service",
    {
      projectId: z.string().describe("ID of the project"),
      serviceId: z.string().describe("ID of the service"),
      environmentId: z.string().describe("ID of the environment"),
      commitSha: z.string().optional().describe("Specific commit SHA to deploy (optional)"),
    },
    async ({ projectId, serviceId, environmentId, commitSha }) => {
      const tokenCheck = checkApiToken();
      if (tokenCheck) return tokenCheck;

      try {
        const deploymentId = await railwayApi.triggerDeployment({
          projectId,
          serviceId,
          environmentId,
          commitSha,
        });
        
        return createSuccessResponse(`Deployment triggered successfully. Deployment ID: ${deploymentId}`);
      } catch (error) {
        return createErrorResponse(`Error triggering deployment: ${formatError(error)}`);
      }
    }
  );

  // Get deployment logs
  server.tool(
    "deployment-logs",
    "Get logs for a specific deployment",
    {
      deploymentId: z.string().describe("ID of the deployment"),
      type: z.enum(["build", "runtime"]).describe("Type of logs to retrieve (build or runtime)"),
      limit: z.number().optional().describe("Maximum number of log lines to retrieve (default: 100)"),
    },
    async ({ deploymentId, type, limit = 100 }) => {
      const tokenCheck = checkApiToken();
      if (tokenCheck) return tokenCheck;

      try {
        const logs = type === "build" 
          ? await railwayApi.getBuildLogs(deploymentId, limit)
          : await railwayApi.getDeploymentLogs(deploymentId, limit);
        
        if (!logs || logs.length === 0) {
          return {
            content: [
              {
                type: "text" as const,
                text: `No ${type} logs found for this deployment.`,
              },
            ],
          };
        }

        const formattedLogs = logs.map((log: DeploymentLog) => 
          `[${new Date(log.timestamp).toISOString()}] ${log.severity ? `[${log.severity}] ` : ''}${log.message}`
        ).join('\n');

        return {
          content: [
            {
              type: "text" as const,
              text: `${type.toUpperCase()} logs for deployment ${deploymentId}:\n\n${formattedLogs}`,
            },
          ],
        };
      } catch (error) {
        return createErrorResponse(`Error fetching deployment logs: ${formatError(error)}`);
      }
    }
  );

  // Restart deployment
  server.tool(
    "deployment-restart",
    "Restart a specific deployment",
    {
      deploymentId: z.string().describe("ID of the deployment to restart"),
    },
    async ({ deploymentId }) => {
      const tokenCheck = checkApiToken();
      if (tokenCheck) return tokenCheck;

      try {
        await railwayApi.restartDeployment(deploymentId);
        
        return createSuccessResponse(`Deployment ${deploymentId} restart initiated successfully`);
      } catch (error) {
        return createErrorResponse(`Error restarting deployment: ${formatError(error)}`);
      }
    }
  );

  // Rollback to deployment
  server.tool(
    "deployment-rollback",
    "Roll back to a specific deployment",
    {
      deploymentId: z.string().describe("ID of the deployment to roll back to"),
    },
    async ({ deploymentId }) => {
      const tokenCheck = checkApiToken();
      if (tokenCheck) return tokenCheck;

      try {
        await railwayApi.rollbackDeployment(deploymentId);
        
        return createSuccessResponse(`Rollback to deployment ${deploymentId} initiated successfully`);
      } catch (error) {
        return createErrorResponse(`Error rolling back deployment: ${formatError(error)}`);
      }
    }
  );

  // Cancel deployment
  server.tool(
    "deployment-cancel",
    "Cancel an ongoing deployment",
    {
      deploymentId: z.string().describe("ID of the deployment to cancel"),
    },
    async ({ deploymentId }) => {
      const tokenCheck = checkApiToken();
      if (tokenCheck) return tokenCheck;

      try {
        await railwayApi.cancelDeployment(deploymentId);
        
        return createSuccessResponse(`Deployment ${deploymentId} cancelled successfully`);
      } catch (error) {
        return createErrorResponse(`Error cancelling deployment: ${formatError(error)}`);
      }
    }
  );
}
