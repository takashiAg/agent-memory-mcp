# agent-memory-mcp

The Model 型 SaaS の業務文脈を、Codex や Claude Code などの MCP 対応エージェントへ引き継ぐためのローカルメモリです。

## 目的

- sales、CS、PdM、開発の前提を再利用する
- 優先順位や意思決定の理由を検索できるようにする
- 毎回説明している作業ルールを保管する

## コンセプト

`agent-memory-mcp` は、The Model 型 SaaS の判断文脈メモリです。

顧客課題、商談、機能要望、企画、優先順位、実装判断を保存し、エージェントが必要な場面で検索して使えるようにします。

## ターゲット

- Codex
- Claude Code
- MCP 対応のコーディングエージェント
- SaaS の CEO / 事業責任者
- Sales / CS / Marketing / RevOps
- PO / SM / PjM / PdM / QA / Engineer

## 方針

- TypeScript + Node.js で実装する
- 保存先はローカルの SQLite
- 検索は SQLite FTS5 から始める
- 秘密情報は保存しない
- クラウド同期や自動アップロードはしない

## 技術スタック

- TypeScript
- Node.js
- MCP
- SQLite
- SQLite FTS5

## 使い方

```bash
npm install
npm run build
node dist/server.js
```

Codex 設定例:

```toml
[mcp_servers.agent_memory]
command = "node"
args = ["/path/to/agent-memory-mcp/dist/server.js"]
enabled = true
```

## 想定ツール

- `remember`: メモリを保存・更新する
- `search_memory`: メモリを検索する
- `get_memory`: メモリを取得する
- `list_memories`: メモリを一覧する
- `forget_memory`: メモリを削除する

## ドキュメント

- [ストーリー](docs/story.md)
- [設計メモ](docs/design.md)
- [セキュリティ](docs/security.md)
