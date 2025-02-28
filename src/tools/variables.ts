import { z } from 'zod';
import { railwayApi } from '../api-client.js';
import { ToolResult } from '../types.js';
import { checkApiToken, createErrorResponse, createSuccessResponse, formatError, formatVariables } from '../utils.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

export function registerVariableTools(server: McpServer) {
  // List variables
  server.tool(
    "variable-list",
    "List variables for a service in a specific environment",
    {
      projectId: z.string().describe("ID of the project"),
      environmentId: z.string().describe("ID of the environment"),
      serviceId: z.string().optional().describe("ID of the service (optional, if omitted lists shared variables)"),
    },
    async ({ projectId, environmentId, serviceId }) => {
      const tokenCheck = checkApiToken();
      if (tokenCheck) return tokenCheck;

      try {
        const variables = await railwayApi.getVariables(projectId, environmentId, serviceId);
        
        if (!variables || Object.keys(variables).length === 0) {
          return {
            content: [
              {
                type: "text" as const,
                text: serviceId 
                  ? "No variables found for this service in this environment." 
                  : "No shared variables found for this environment.",
              },
            ],
          };
        }

        const formattedVars = formatVariables(variables);
        const context = serviceId ? "service variables" : "shared environment variables";

        return {
          content: [
            {
              type: "text" as const,
              text: `${Object.keys(variables).length} ${context}:\n\n${formattedVars}`,
            },
          ],
        };
      } catch (error) {
        return createErrorResponse(`Error listing variables: ${formatError(error)}`);
      }
    }
  );

  // Set variable
  server.tool(
    "variable-set",
    "Create or update a variable for a service in a specific environment",
    {
      projectId: z.string().describe("ID of the project"),
      environmentId: z.string().describe("ID of the environment"),
      name: z.string().describe("Variable name"),
      value: z.string().describe("Variable value"),
      serviceId: z.string().optional().describe("ID of the service (optional, if omitted creates/updates a shared variable)"),
    },
    async ({ projectId, environmentId, name, value, serviceId }) => {
      const tokenCheck = checkApiToken();
      if (tokenCheck) return tokenCheck;

      try {
        await railwayApi.upsertVariable({
          projectId,
          environmentId,
          serviceId,
          name,
          value,
        });
        
        const variableType = serviceId ? "service variable" : "shared environment variable";
        return createSuccessResponse(`Successfully set ${variableType} "${name}"`);
      } catch (error) {
        return createErrorResponse(`Error setting variable: ${formatError(error)}`);
      }
    }
  );

  // Delete variable
  server.tool(
    "variable-delete",
    "Delete a variable for a service in a specific environment",
    {
      projectId: z.string().describe("ID of the project"),
      environmentId: z.string().describe("ID of the environment"),
      name: z.string().describe("Variable name to delete"),
      serviceId: z.string().optional().describe("ID of the service (optional, if omitted deletes a shared variable)"),
    },
    async ({ projectId, environmentId, name, serviceId }) => {
      const tokenCheck = checkApiToken();
      if (tokenCheck) return tokenCheck;

      try {
        await railwayApi.deleteVariable({
          projectId,
          environmentId,
          serviceId,
          name,
        });
        
        const variableType = serviceId ? "service variable" : "shared environment variable";
        return createSuccessResponse(`Successfully deleted ${variableType} "${name}"`);
      } catch (error) {
        return createErrorResponse(`Error deleting variable: ${formatError(error)}`);
      }
    }
  );

  // Bulk variable update
  server.tool(
    "variable-bulk-update",
    "Create or update multiple variables at once",
    {
      projectId: z.string().describe("ID of the project"),
      environmentId: z.string().describe("ID of the environment"),
      variables: z.record(z.string()).describe("Object containing variable name-value pairs"),
      serviceId: z.string().optional().describe("ID of the service (optional, if omitted updates shared variables)"),
    },
    async ({ projectId, environmentId, variables, serviceId }) => {
      const tokenCheck = checkApiToken();
      if (tokenCheck) return tokenCheck;

      try {
        const updates = Object.entries(variables).map(([name, value]) => ({
          projectId,
          environmentId,
          serviceId,
          name,
          value,
        }));

        await railwayApi.upsertVariables(updates);
        
        const variableType = serviceId ? "service variables" : "shared environment variables";
        const count = Object.keys(variables).length;
        return createSuccessResponse(`Successfully updated ${count} ${variableType}`);
      } catch (error) {
        return createErrorResponse(`Error updating variables: ${formatError(error)}`);
      }
    }
  );

  // Copy variables between environments
  server.tool(
    "variable-copy",
    "Copy variables from one environment to another",
    {
      projectId: z.string().describe("ID of the project"),
      sourceEnvironmentId: z.string().describe("ID of the source environment"),
      targetEnvironmentId: z.string().describe("ID of the target environment"),
      serviceId: z.string().optional().describe("ID of the service (optional, if omitted copies shared variables)"),
      overwrite: z.boolean().optional().describe("Whether to overwrite existing variables in the target environment"),
    },
    async ({ projectId, sourceEnvironmentId, targetEnvironmentId, serviceId, overwrite = false }) => {
      const tokenCheck = checkApiToken();
      if (tokenCheck) return tokenCheck;

      try {
        // Get source variables
        const sourceVars = await railwayApi.getVariables(projectId, sourceEnvironmentId, serviceId);
        
        if (!sourceVars || Object.keys(sourceVars).length === 0) {
          return {
            content: [
              {
                type: "text" as const,
                text: "No variables found in the source environment.",
              },
            ],
          };
        }

        // Get target variables to check for conflicts
        const targetVars = await railwayApi.getVariables(projectId, targetEnvironmentId, serviceId);
        
        // Filter out variables that already exist if not overwriting
        const varsToUpdate = overwrite 
          ? sourceVars 
          : Object.fromEntries(
              Object.entries(sourceVars).filter(([key]) => !targetVars[key])
            );

        if (Object.keys(varsToUpdate).length === 0) {
          return {
            content: [
              {
                type: "text" as const,
                text: "No new variables to copy. All variables already exist in the target environment.",
              },
            ],
          };
        }

        // Create updates array
        const updates = Object.entries(varsToUpdate).map(([name, value]) => ({
          projectId,
          environmentId: targetEnvironmentId,
          serviceId,
          name,
          value,
        }));

        await railwayApi.upsertVariables(updates);
        
        const variableType = serviceId ? "service variables" : "shared environment variables";
        const count = Object.keys(varsToUpdate).length;
        return createSuccessResponse(
          `Successfully copied ${count} ${variableType} from source environment to target environment`
        );
      } catch (error) {
        return createErrorResponse(`Error copying variables: ${formatError(error)}`);
      }
    }
  );
}
