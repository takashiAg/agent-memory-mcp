import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { detectSecret } from "./secretGuard.js";
import type { Memory, MemorySummary, RememberInput } from "./types.js";

type MemoryRow = Omit<Memory, "tags">;

const DEFAULT_DB_PATH = join(homedir(), ".agent-memory-mcp", "memory.sqlite");

export class MemoryStorage {
  private db: DatabaseSync;

  constructor(dbPath = process.env.AGENT_MEMORY_DB_PATH || DEFAULT_DB_PATH) {
    mkdirSync(dirname(dbPath), { recursive: true });
    this.db = new DatabaseSync(dbPath);
    this.db.exec("PRAGMA foreign_keys = ON");
    this.migrate();
  }

  remember(input: RememberInput): { id: string; namespace: string; key?: string; created: boolean } {
    const secretReason = detectSecret(input.value);
    if (secretReason) {
      this.recordEvent(null, "rejected_secret", secretReason);
      throw new Error("memory rejected because it looks like a secret");
    }

    const now = new Date().toISOString();
    const tags = normalizeTags(input.tags);
    const existing = input.key ? this.findByNamespaceKey(input.namespace, input.key) : null;
    const id = existing?.id ?? randomUUID();
    const createdAt = existing?.created_at ?? now;

    this.db.exec("BEGIN");
    try {
      this.db.prepare(`
        INSERT INTO memories (id, namespace, key, value, priority, source, created_at, updated_at, expires_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(namespace, key) DO UPDATE SET
          value = excluded.value,
          priority = excluded.priority,
          source = excluded.source,
          updated_at = excluded.updated_at,
          expires_at = excluded.expires_at
      `).run(
        id,
        input.namespace,
        input.key ?? null,
        input.value,
        input.priority ?? "note",
        input.source ?? null,
        createdAt,
        now,
        input.expires_at ?? null
      );
      this.replaceTags(id, tags);
      this.replaceFts({ id, namespace: input.namespace, key: input.key ?? null, value: input.value, tags });
      this.recordEvent(id, existing ? "updated" : "created", null);
      this.db.exec("COMMIT");
    } catch (error) {
      this.db.exec("ROLLBACK");
      throw error;
    }

    return { id, namespace: input.namespace, key: input.key, created: !existing };
  }

  search(input: { query: string; namespace?: string; tags?: string[]; limit?: number }): { results: MemorySummary[] } {
    const limit = clamp(input.limit ?? 10, 1, 50);
    const rows = this.searchRows(input.query, input.namespace, limit * 4)
      .filter((memory) => !isExpired(memory))
      .filter((memory) => hasTags(memory.tags, input.tags))
      .slice(0, limit);

    return { results: rows.map(toSummary) };
  }

  get(input: { id?: string; namespace?: string; key?: string }): Memory {
    const memory = input.id
      ? this.findById(input.id)
      : input.namespace && input.key
        ? this.findByNamespaceKey(input.namespace, input.key)
        : null;

    if (!memory) {
      throw new Error("memory not found");
    }

    return memory;
  }

  list(input: { namespace?: string; tags?: string[]; include_expired?: boolean; limit?: number }): { results: MemorySummary[] } {
    const limit = clamp(input.limit ?? 20, 1, 100);
    const rows = this.listRows(input.namespace, limit * 4)
      .filter((memory) => input.include_expired || !isExpired(memory))
      .filter((memory) => hasTags(memory.tags, input.tags))
      .slice(0, limit);

    return { results: rows.map(toSummary) };
  }

  forget(input: { id?: string; namespace?: string; key?: string }): { deleted: boolean; id?: string } {
    const memory = input.id
      ? this.findById(input.id)
      : input.namespace && input.key
        ? this.findByNamespaceKey(input.namespace, input.key)
        : null;

    if (!memory) {
      return { deleted: false };
    }

    this.db.exec("BEGIN");
    try {
      this.db.prepare("DELETE FROM memories WHERE id = ?").run(memory.id);
      this.db.prepare("DELETE FROM memory_fts WHERE id = ?").run(memory.id);
      this.recordEvent(memory.id, "deleted", null);
      this.db.exec("COMMIT");
    } catch (error) {
      this.db.exec("ROLLBACK");
      throw error;
    }

    return { deleted: true, id: memory.id };
  }

  private migrate(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS memories (
        id TEXT PRIMARY KEY,
        namespace TEXT NOT NULL,
        key TEXT,
        value TEXT NOT NULL,
        priority TEXT NOT NULL CHECK (priority IN ('rule', 'preference', 'note')),
        source TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        expires_at TEXT,
        UNIQUE(namespace, key)
      );

      CREATE TABLE IF NOT EXISTS memory_tags (
        memory_id TEXT NOT NULL,
        tag TEXT NOT NULL,
        PRIMARY KEY (memory_id, tag),
        FOREIGN KEY (memory_id) REFERENCES memories(id) ON DELETE CASCADE
      );

      CREATE VIRTUAL TABLE IF NOT EXISTS memory_fts USING fts5(
        id UNINDEXED,
        namespace,
        key,
        value,
        tags
      );

      CREATE TABLE IF NOT EXISTS events (
        id TEXT PRIMARY KEY,
        memory_id TEXT,
        action TEXT NOT NULL,
        detail TEXT,
        created_at TEXT NOT NULL
      );
    `);
  }

  private searchRows(query: string, namespace: string | undefined, limit: number): Memory[] {
    const ftsQuery = toFtsQuery(query);
    if (!ftsQuery) {
      return this.listRows(namespace, limit);
    }

    try {
      const rows = this.db.prepare(`
        SELECT m.*
        FROM memory_fts f
        JOIN memories m ON m.id = f.id
        WHERE memory_fts MATCH ?
          AND (? IS NULL OR m.namespace = ?)
        ORDER BY rank
        LIMIT ?
      `).all(ftsQuery, namespace ?? null, namespace ?? null, limit) as MemoryRow[];
      if (rows.length > 0) {
        return rows.map((row) => this.hydrate(row));
      }
    } catch {
      // Fall through to LIKE search below. FTS can reject punctuation-heavy queries.
    }

    const like = `%${query}%`;
    const rows = this.db.prepare(`
      SELECT *
      FROM memories
      WHERE value LIKE ?
        AND (? IS NULL OR namespace = ?)
      ORDER BY updated_at DESC
      LIMIT ?
    `).all(like, namespace ?? null, namespace ?? null, limit) as MemoryRow[];
    return rows.map((row) => this.hydrate(row));
  }

  private listRows(namespace: string | undefined, limit: number): Memory[] {
    const rows = this.db.prepare(`
      SELECT *
      FROM memories
      WHERE (? IS NULL OR namespace = ?)
      ORDER BY updated_at DESC
      LIMIT ?
    `).all(namespace ?? null, namespace ?? null, limit) as MemoryRow[];
    return rows.map((row) => this.hydrate(row));
  }

  private findById(id: string): Memory | null {
    const row = this.db.prepare("SELECT * FROM memories WHERE id = ?").get(id) as MemoryRow | undefined;
    return row ? this.hydrate(row) : null;
  }

  private findByNamespaceKey(namespace: string, key: string): Memory | null {
    const row = this.db.prepare("SELECT * FROM memories WHERE namespace = ? AND key = ?").get(namespace, key) as MemoryRow | undefined;
    return row ? this.hydrate(row) : null;
  }

  private hydrate(row: MemoryRow): Memory {
    const tagRows = this.db.prepare("SELECT tag FROM memory_tags WHERE memory_id = ? ORDER BY tag").all(row.id) as { tag: string }[];
    return { ...row, tags: tagRows.map((tagRow) => tagRow.tag) };
  }

  private replaceTags(memoryId: string, tags: string[]): void {
    this.db.prepare("DELETE FROM memory_tags WHERE memory_id = ?").run(memoryId);
    const insert = this.db.prepare("INSERT INTO memory_tags (memory_id, tag) VALUES (?, ?)");
    for (const tag of tags) {
      insert.run(memoryId, tag);
    }
  }

  private replaceFts(memory: { id: string; namespace: string; key: string | null; value: string; tags: string[] }): void {
    this.db.prepare("DELETE FROM memory_fts WHERE id = ?").run(memory.id);
    this.db.prepare("INSERT INTO memory_fts (id, namespace, key, value, tags) VALUES (?, ?, ?, ?, ?)").run(
      memory.id,
      memory.namespace,
      memory.key ?? "",
      memory.value,
      memory.tags.join(" ")
    );
  }

  private recordEvent(memoryId: string | null, action: string, detail: string | null): void {
    this.db.prepare("INSERT INTO events (id, memory_id, action, detail, created_at) VALUES (?, ?, ?, ?, ?)").run(
      randomUUID(),
      memoryId,
      action,
      detail,
      new Date().toISOString()
    );
  }
}

function normalizeTags(tags: string[] | undefined): string[] {
  return [...new Set((tags ?? []).map((tag) => tag.trim().toLowerCase()).filter(Boolean))];
}

function hasTags(actual: string[], expected: string[] | undefined): boolean {
  const normalized = normalizeTags(expected);
  return normalized.every((tag) => actual.includes(tag));
}

function isExpired(memory: Memory): boolean {
  return Boolean(memory.expires_at && new Date(memory.expires_at).getTime() <= Date.now());
}

function toSummary(memory: Memory): MemorySummary {
  const summary = memory.value.length > 180 ? `${memory.value.slice(0, 177)}...` : memory.value;
  return {
    id: memory.id,
    namespace: memory.namespace,
    key: memory.key ?? undefined,
    summary,
    tags: memory.tags,
    priority: memory.priority,
    updated_at: memory.updated_at
  };
}

function toFtsQuery(query: string): string {
  const terms = query.trim().split(/\s+/).filter(Boolean);
  return terms.map((term) => `"${term.replaceAll("\"", "\"\"")}"`).join(" AND ");
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
