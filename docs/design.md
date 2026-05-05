# 設計メモ

## メモリ

1件の保存情報をメモリと呼ぶ。

主な項目:

- `namespace`: `global`、`user`、`repo:owner/name` などのスコープ
- `key`: 更新対象を識別する安定した名前
- `value`: 保存する本文
- `tags`: 検索用タグ
- `priority`: `rule`、`preference`、`note`
- `source`: `manual`、`AGENTS.md`、`issue:#123` など
- `expires_at`: 一時的な情報の有効期限

## AGENTS.md との違い

`AGENTS.md` は、そのリポジトリで常に読むべきルールを書く。

メモリは、必要なときだけ検索したい文脈を書く。

## 保存

初期実装は SQLite を使う。

主なテーブル:

- `memories`
- `memory_tags`
- `memory_fts`
- `events`

DB の既定パス:

```text
~/.agent-memory-mcp/memory.sqlite
```

環境変数で変更できる:

```text
AGENT_MEMORY_DB_PATH=/path/to/memory.sqlite
```

## 技術スタック

- TypeScript
- Node.js
- SQLite
- SQLite FTS5
- MCP stdio transport

## MCP ツール

初期実装:

- `remember`
- `search_memory`
- `get_memory`
- `list_memories`
- `forget_memory`

入力・出力の詳細は実装時に型定義を正とする。
