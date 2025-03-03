import { z } from 'zod';
import { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js';

export type Tool<T extends z.ZodRawShape = z.ZodRawShape> = [
  string,
  string,
  T,
  ToolCallback<T>
];

export function createTool<T extends z.ZodRawShape>(
  name: string,
  description: string,
  schema: T,
  handler: ToolCallback<T>
): Tool<T> {
  return [
    name,
    description,
    schema,
    handler
  ] as const;
} 