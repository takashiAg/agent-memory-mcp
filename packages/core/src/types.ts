export type MemoryPriority = "rule" | "preference" | "note";

export type Memory = {
  id: string;
  namespace: string;
  key: string | null;
  value: string;
  tags: string[];
  priority: MemoryPriority;
  source: string | null;
  created_at: string;
  updated_at: string;
  expires_at: string | null;
};

export type MemorySummary = {
  id: string;
  namespace: string;
  key?: string;
  summary: string;
  tags: string[];
  priority: MemoryPriority;
  updated_at: string;
};

export type RememberInput = {
  namespace: string;
  key?: string;
  value: string;
  tags?: string[];
  priority?: MemoryPriority;
  source?: string;
  expires_at?: string;
};

export type UpdateMemoryInput = {
  id: string;
  namespace?: string;
  key?: string;
  value?: string;
  tags?: string[];
  priority?: MemoryPriority;
  source?: string;
  expires_at?: string;
};
