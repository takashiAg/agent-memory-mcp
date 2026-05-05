#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import * as z from "zod/v4";
import { MemoryStorage } from "./storage.js";

const storage = new MemoryStorage();

const server = new McpServer({
  name: "agent-memory-mcp",
  version: "0.1.0"
});

const prioritySchema = z.enum(["rule", "preference", "note"]);

server.registerTool(
  "remember",
  {
    description: "Save or update business context, decisions, requests, preferences, or workflow rules.",
    inputSchema: {
      namespace: z.string().min(1),
      key: z.string().min(1).optional(),
      value: z.string().min(1),
      tags: z.array(z.string().min(1)).optional(),
      priority: prioritySchema.optional(),
      source: z.string().optional(),
      expires_at: z.string().optional()
    }
  },
  async (input) => jsonResult(storage.remember(input))
);

server.registerTool(
  "search_memory",
  {
    description: "Search memories before planning, prioritizing, creating issues, sending PRs, or implementing.",
    inputSchema: {
      query: z.string().min(1),
      namespace: z.string().optional(),
      tags: z.array(z.string().min(1)).optional(),
      limit: z.number().int().min(1).max(50).optional()
    }
  },
  async (input) => jsonResult(storage.search(input))
);

server.registerTool(
  "get_memory",
  {
    description: "Get a memory by id, or by namespace and key.",
    inputSchema: {
      id: z.string().optional(),
      namespace: z.string().optional(),
      key: z.string().optional()
    }
  },
  async (input) => jsonResult(storage.get(input))
);

server.registerTool(
  "list_memories",
  {
    description: "List memories by namespace or tags.",
    inputSchema: {
      namespace: z.string().optional(),
      tags: z.array(z.string().min(1)).optional(),
      include_expired: z.boolean().optional(),
      limit: z.number().int().min(1).max(100).optional()
    }
  },
  async (input) => jsonResult(storage.list(input))
);

server.registerTool(
  "forget_memory",
  {
    description: "Delete a memory by id, or by namespace and key.",
    inputSchema: {
      id: z.string().optional(),
      namespace: z.string().optional(),
      key: z.string().optional()
    }
  },
  async (input) => jsonResult(storage.forget(input))
);

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

function jsonResult(value: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(value, null, 2)
      }
    ]
  };
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
