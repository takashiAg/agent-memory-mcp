#!/usr/bin/env node
import { MemoryStorage } from "./storage.js";

const args = process.argv.slice(2);
const namespace = readOption("--namespace");
const tags = readMany("--tag");
const json = args.includes("--json");
const limit = Number(readOption("--limit") ?? 100);

const storage = new MemoryStorage();
const memories = storage.list({ namespace, tags, include_expired: true, limit }).results;

if (json) {
  console.log(JSON.stringify(memories, null, 2));
} else if (memories.length === 0) {
  console.log("No memories found.");
} else {
  for (const memory of memories) {
    const key = memory.key ? `/${memory.key}` : "";
    const tagsText = memory.tags.length > 0 ? ` [${memory.tags.join(", ")}]` : "";
    console.log(`${memory.namespace}${key} (${memory.priority})${tagsText}`);
    console.log(`  ${memory.summary.replaceAll("\n", "\n  ")}`);
  }
}

function readOption(name: string): string | undefined {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
}

function readMany(name: string): string[] | undefined {
  const values = args
    .map((arg, index) => (arg === name ? args[index + 1] : undefined))
    .filter((value): value is string => Boolean(value));
  return values.length > 0 ? values : undefined;
}
