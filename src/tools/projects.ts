import { z } from 'zod';
import { railwayApi } from '../api-client.js';
import { ToolResult } from '../types.js';
import { checkApiToken, createErrorResponse, createSuccessResponse, formatError } from '../utils.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

export function registerProjectTools(server: McpServer) {
  // List projects
  server.tool(
    "project-list",
    "List all projects in your Railway account",
    {},
    async () => {
      const tokenCheck = checkApiToken();
      if (tokenCheck) return tokenCheck;

      try {
        const projects = await railwayApi.listProjects();
        
        if (projects.length === 0) {
          return {
            content: [
              {
                type: "text" as const,
                text: "You don't have any projects yet.",
              },
            ],
          };
        }

        const formattedProjects = projects.map((project) => `
📂 ${project.name} (ID: ${project.id})
  Environments: ${project.environments?.length ? `
    ${project.environments.map((environment) => `
      ${environment.name} (ID: ${environment.id})
    `).join("\n")}
  ` : "None"}
  Services: ${project.services?.length ? `
    ${project.services.map((service) => `
      ${service.name} (ID: ${service.id})
    `).join("\n")}
  ` : "None"}
`).join("\n");

        return {
          content: [
            {
              type: "text" as const,
              text: `Found ${projects.length} projects:\n\n${formattedProjects}`,
            },
          ],
        };
      } catch (error) {
        return createErrorResponse(`Error listing projects: ${formatError(error)}`);
      }
    }
  );

  // Project info
  server.tool(
    "project-info",
    "Get detailed information about a specific project",
    {
      projectId: z.string().describe("ID of the project"),
    },
    async ({ projectId }) => {
      const tokenCheck = checkApiToken();
      if (tokenCheck) return tokenCheck;

      try {
        const project = await railwayApi.getProject(projectId);
        
        if (!project) {
          return createErrorResponse(`Project with ID ${projectId} not found.`);
        }

        // Get environments and services for this project
        const environments = await railwayApi.listEnvironments(projectId);
        const services = await railwayApi.listServices(projectId);
        
        const environmentDetails = environments.map((env) => 
          `  🔹 ${env.name} (ID: ${env.id})`
        ).join("\n");
        
        const serviceDetails = services.map((service) => 
          `  🔹 ${service.name} (ID: ${service.id})`
        ).join("\n");

        return {
          content: [
            {
              type: "text" as const,
              text: `
📂 Project: ${project.name} (ID: ${project.id})

📊 Environments:
${environmentDetails || "  No environments found"}

🚀 Services:
${serviceDetails || "  No services found"}
`,
            },
          ],
        };
      } catch (error) {
        return createErrorResponse(`Error getting project info: ${formatError(error)}`);
      }
    }
  );

  // Create project
  server.tool(
    "project-create",
    "Create a new Railway project",
    {
      name: z.string().describe("Name for the new project"),
      teamId: z.string().optional().describe("Team ID to create the project under (optional)"),
    },
    async ({ name, teamId }) => {
      const tokenCheck = checkApiToken();
      if (tokenCheck) return tokenCheck;

      try {
        const project = await railwayApi.createProject(name, teamId);
        
        return createSuccessResponse(`Project "${project.name}" (ID: ${project.id}) created successfully`);
      } catch (error) {
        return createErrorResponse(`Error creating project: ${formatError(error)}`);
      }
    }
  );

  // Delete project
  server.tool(
    "project-delete",
    "Delete a project from your Railway account (CAUTION: this cannot be undone)",
    {
      projectId: z.string().describe("ID of the project to delete"),
      confirmDelete: z.boolean().describe("Confirm that you want to delete this project"),
    },
    async ({ projectId, confirmDelete }) => {
      const tokenCheck = checkApiToken();
      if (tokenCheck) return tokenCheck;

      if (!confirmDelete) {
        return {
          content: [
            {
              type: "text" as const,
              text: "Project deletion cancelled. Set confirmDelete to true to proceed.",
            },
          ],
        };
      }

      try {
        await railwayApi.deleteProject(projectId);
        
        return createSuccessResponse(`Project with ID ${projectId} has been successfully deleted.`);
      } catch (error) {
        return createErrorResponse(`Error deleting project: ${formatError(error)}`);
      }
    }
  );
}
