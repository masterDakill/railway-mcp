import { z } from 'zod';
import { createTool } from '@/utils/tools.js';
import { railwayClient } from '@/api/api-client.js';

export const configTools = [
  createTool(
    "configure",
  "Configure the Railway API connection (only needed if not set in environment variables)",
  {
    token: z.string().describe("Railway API token"),
  },
  async ({ token }) => {
    try {
      await railwayClient.setToken(token);      
      return {
        content: [
          {
            type: "text" as const,
            text: `✅ Successfully connected to Railway API`,
          },
        ],
      };
    } catch (error) {
      return {
        isError: true,
        content: [
          {
            type: "text" as const,
            text: `❌ Failed to connect to Railway API: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
      };
    }
  }
  )
];
