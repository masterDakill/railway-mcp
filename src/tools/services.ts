import { z } from 'zod';
import { railwayApi } from '../api-client.js';
import { ToolResult, Service, Deployment } from '../types.js';
import { checkApiToken, createErrorResponse, createSuccessResponse, formatError, getStatusEmoji } from '../utils.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

export function registerServiceTools(server: McpServer) {
  // List services
  server.tool(
    "service-list",
    "List all services in a specific project",
    {
      projectId: z.string().describe("ID of the project to list services for"),
    },
    async ({ projectId }) => {
      const tokenCheck = checkApiToken();
      if (tokenCheck) return tokenCheck;

      try {
        const services = await railwayApi.listServices(projectId);
        
        if (services.length === 0) {
          return {
            content: [
              {
                type: "text" as const,
                text: "No services found in this project.",
              },
            ],
          };
        }

        // Get latest deployment status for each service
        const serviceDetails = await Promise.all(services.map(async (service: Service) => {
          try {
            const deployments = await railwayApi.listDeployments({
              projectId,
              serviceId: service.id,
              limit: 1
            });
            const latestDeployment = deployments[0];
            const status = latestDeployment ? `${getStatusEmoji(latestDeployment.status)} ${latestDeployment.status}` : '⚪ NO DEPLOYMENTS';
            
            return `🚀 ${service.name} (ID: ${service.id})
   Status: ${status}
   URL: ${latestDeployment?.url || 'N/A'}`;
          } catch {
            return `🚀 ${service.name} (ID: ${service.id})
   Status: ⚠️ Unable to fetch status`;
          }
        }));

        return {
          content: [
            {
              type: "text" as const,
              text: `Services in project:\n\n${serviceDetails.join('\n\n')}`,
            },
          ],
        };
      } catch (error) {
        return createErrorResponse(`Error listing services: ${formatError(error)}`);
      }
    }
  );

  // Get service details
  server.tool(
    "service-info",
    "Get detailed information about a specific service",
    {
      projectId: z.string().describe("ID of the project"),
      serviceId: z.string().describe("ID of the service"),
      environmentId: z.string().describe("ID of the environment"),
    },
    async ({ projectId, serviceId, environmentId }) => {
      const tokenCheck = checkApiToken();
      if (tokenCheck) return tokenCheck;

      try {
        const [serviceInstance, deployments] = await Promise.all([
          railwayApi.getServiceInstance(serviceId, environmentId),
          railwayApi.listDeployments({ projectId, serviceId, environmentId, limit: 5 })
        ]);

        if (!serviceInstance) {
          return createErrorResponse(`Service instance not found.`);
        }

        const deploymentHistory = deployments.map((d: Deployment) => 
          `   ${getStatusEmoji(d.status)} ${d.status} - ${new Date(d.createdAt).toLocaleString()}`
        ).join('\n');

        const details = `
🚀 Service: ${serviceInstance.serviceName}

📊 Configuration:
   Region: ${serviceInstance.region || 'Not set'}
   Replicas: ${serviceInstance.numReplicas || 1}
   Root Directory: ${serviceInstance.rootDirectory || '/'}
   Build Command: ${serviceInstance.buildCommand || 'Not set'}
   Start Command: ${serviceInstance.startCommand || 'Not set'}
   Health Check Path: ${serviceInstance.healthcheckPath || 'Not set'}
   Sleep Mode: ${serviceInstance.sleepApplication ? 'Enabled' : 'Disabled'}

🔄 Recent Deployments:
${deploymentHistory || '   No recent deployments'}
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
        return createErrorResponse(`Error getting service details: ${formatError(error)}`);
      }
    }
  );

  // Create service from repo
  server.tool(
    "service-create-from-repo",
    "Create a new service in a project from a GitHub repository",
    {
      projectId: z.string().describe("ID of the project to create the service in"),
      repo: z.string().describe("GitHub repository name (e.g., 'railwayapp-templates/django')"),
      name: z.string().optional().describe("Custom name for the service (optional)"),
    },
    async ({ projectId, repo, name }) => {
      const tokenCheck = checkApiToken();
      if (tokenCheck) return tokenCheck;

      try {
        const service = await railwayApi.createService({
          projectId,
          name,
          source: { repo },
        });
        
        return createSuccessResponse(`Created new service "${service.name}" (ID: ${service.id}) from GitHub repo "${repo}"`);
      } catch (error) {
        return createErrorResponse(`Error creating service: ${formatError(error)}`);
      }
    }
  );

  // Create service from image
  server.tool(
    "service-create-from-image",
    "Create a new service in a project from a Docker image",
    {
      projectId: z.string().describe("ID of the project to create the service in"),
      image: z.string().describe("Docker image name (e.g., 'postgres:14')"),
      name: z.string().optional().describe("Custom name for the service (optional)"),
    },
    async ({ projectId, image, name }) => {
      const tokenCheck = checkApiToken();
      if (tokenCheck) return tokenCheck;

      try {
        const service = await railwayApi.createService({
          projectId,
          name,
          source: { image },
        });
        
        return createSuccessResponse(`Created new service "${service.name}" (ID: ${service.id}) from Docker image "${image}"`);
      } catch (error) {
        return createErrorResponse(`Error creating service: ${formatError(error)}`);
      }
    }
  );

  // Update service configuration
  server.tool(
    "service-update",
    "Update service configuration",
    {
      projectId: z.string().describe("ID of the project"),
      serviceId: z.string().describe("ID of the service"),
      environmentId: z.string().describe("ID of the environment"),
      config: z.object({
        buildCommand: z.string().optional().describe("Build command"),
        startCommand: z.string().optional().describe("Start command"),
        rootDirectory: z.string().optional().describe("Root directory"),
        healthcheckPath: z.string().optional().describe("Health check path"),
        numReplicas: z.number().optional().describe("Number of replicas"),
        sleepApplication: z.boolean().optional().describe("Enable/disable sleep mode"),
      }).describe("Service configuration options"),
    },
    async ({ projectId, serviceId, environmentId, config }) => {
      const tokenCheck = checkApiToken();
      if (tokenCheck) return tokenCheck;

      try {
        await railwayApi.updateServiceInstance(serviceId, environmentId, config);
        
        return createSuccessResponse(`Service configuration updated successfully`);
      } catch (error) {
        return createErrorResponse(`Error updating service: ${formatError(error)}`);
      }
    }
  );

  // Delete service
  server.tool(
    "service-delete",
    "Delete a service from a project",
    {
      projectId: z.string().describe("ID of the project"),
      serviceId: z.string().describe("ID of the service"),
      confirmDelete: z.boolean().describe("Confirm that you want to delete this service"),
    },
    async ({ projectId, serviceId, confirmDelete }) => {
      const tokenCheck = checkApiToken();
      if (tokenCheck) return tokenCheck;

      if (!confirmDelete) {
        return {
          content: [
            {
              type: "text" as const,
              text: "Service deletion cancelled. Set confirmDelete to true to proceed.",
            },
          ],
        };
      }

      try {
        await railwayApi.deleteService(serviceId);
        
        return createSuccessResponse(`Service deleted successfully`);
      } catch (error) {
        return createErrorResponse(`Error deleting service: ${formatError(error)}`);
      }
    }
  );

  // Restart service
  server.tool(
    "service-restart",
    "Restart a service in a specific environment",
    {
      projectId: z.string().describe("ID of the project"),
      serviceId: z.string().describe("ID of the service"),
      environmentId: z.string().describe("ID of the environment"),
    },
    async ({ projectId, serviceId, environmentId }) => {
      const tokenCheck = checkApiToken();
      if (tokenCheck) return tokenCheck;

      try {
        await railwayApi.restartService(serviceId, environmentId);
        
        return createSuccessResponse(`Service restart initiated successfully`);
      } catch (error) {
        return createErrorResponse(`Error restarting service: ${formatError(error)}`);
      }
    }
  );

  // Get service logs
  server.tool(
    "service-logs",
    "Get logs for a service in a specific environment",
    {
      projectId: z.string().describe("ID of the project"),
      serviceId: z.string().describe("ID of the service"),
      environmentId: z.string().describe("ID of the environment"),
      limit: z.number().optional().describe("Maximum number of log lines to retrieve (default: 100)"),
    },
    async ({ projectId, serviceId, environmentId, limit = 100 }) => {
      const tokenCheck = checkApiToken();
      if (tokenCheck) return tokenCheck;

      try {
        // Get latest deployment first
        const deployments = await railwayApi.listDeployments({
          projectId,
          serviceId,
          environmentId,
          limit: 1
        });

        if (!deployments || deployments.length === 0) {
          return {
            content: [
              {
                type: "text" as const,
                text: "No deployments found for this service.",
              },
            ],
          };
        }

        const latestDeployment = deployments[0];
        const logs = await railwayApi.getDeploymentLogs(latestDeployment.id, limit);
        
        if (!logs || logs.length === 0) {
          return {
            content: [
              {
                type: "text" as const,
                text: "No logs found for this service's latest deployment.",
              },
            ],
          };
        }

        const formattedLogs = logs.map((log) => 
          `[${new Date(log.timestamp).toISOString()}] ${log.severity ? `[${log.severity}] ` : ''}${log.message}`
        ).join('\n');

        return {
          content: [
            {
              type: "text" as const,
              text: `Recent logs for service (from deployment ${latestDeployment.id}):\n\n${formattedLogs}`,
            },
          ],
        };
      } catch (error) {
        return createErrorResponse(`Error fetching service logs: ${formatError(error)}`);
      }
    }
  );
}
