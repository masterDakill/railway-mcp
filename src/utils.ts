import { ToolResult } from './types.js';
import { railwayApi } from './api-client.js';

// Check if API token is set and return error result if not
export function checkApiToken(): ToolResult | null {
  if (!railwayApi.getToken()) {
    return {
      isError: true,
      content: [
        {
          type: "text",
          text: "API token not set. Please either:\n1. Add RAILWAY_API_TOKEN to your environment variables, or\n2. Use the configure tool to set the token manually.",
        },
      ],
    };
  }
  return null;
}

// Format error message for consistent error handling
export function formatError(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error';
}

// Format timestamp into human-readable string
export function formatTimestamp(timestamp: string): string {
  return new Date(timestamp).toLocaleString();
}

// Mask sensitive values in variables (like tokens, passwords, etc.)
export function maskSensitiveValue(key: string, value: string): string {
  const sensitivePatterns = [
    /token/i, /key/i, /password/i, /secret/i, /auth/i, /cred/i,
    /private/i, /api[-_]?key/i, /access[-_]?key/i, /session/i
  ];
  
  if (sensitivePatterns.some(pattern => pattern.test(key))) {
    // Show just the first few characters if it's a long value
    if (value.length > 8) {
      return `${value.substring(0, 4)}${'*'.repeat(8)}`;
    }
    return '*'.repeat(8);
  }
  
  return value;
}

// Format a list of key-value pairs for display
export function formatVariables(variables: Record<string, string>): string {
  if (!variables || Object.keys(variables).length === 0) {
    return "No variables found.";
  }
  
  return Object.entries(variables)
    .map(([key, value]) => `${key} = ${maskSensitiveValue(key, value)}`)
    .join('\n');
}

// Create success response with consistent format
export function createSuccessResponse(message: string): ToolResult {
  return {
    content: [
      {
        type: "text",
        text: `✅ ${message}`,
      },
    ],
  };
}

// Create error response with consistent format
export function createErrorResponse(message: string): ToolResult {
  return {
    isError: true,
    content: [
      {
        type: "text",
        text: `❌ ${message}`,
      },
    ],
  };
}

// Convert deployment status to emoji
export function getStatusEmoji(status: string): string {
  switch (status.toUpperCase()) {
    case 'SUCCESS':
      return '✅';
    case 'DEPLOYING':
    case 'BUILDING':
    case 'QUEUED':
      return '🔄';
    case 'FAILED':
    case 'ERROR':
      return '❌';
    case 'REMOVED':
    case 'CANCELED':
      return '🚫';
    default:
      return '❓';
  }
}
