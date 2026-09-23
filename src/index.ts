#!/usr/bin/env node
import "dotenv/config";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { tools, handleToolCall } from "./tools";

async function main(): Promise<void> {
  const server = new Server(
    {
      name: "google-mcp",
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args = {} } = request.params;
    return handleToolCall(name, args as Record<string, unknown>);
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);

  // MCP stdio requires stdout to be clean JSON-RPC only; log to stderr:
  console.error("Google MCP server is running in stdio mode.");
}

main().catch((err: Error) => {
  console.error(`Fatal server error: ${err.message}`);
  process.exit(1);
});
