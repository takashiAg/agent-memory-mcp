# agent-memory-mcp

ローカルに保存したメモリを、Codex や Claude Code などの MCP 対応エージェントから検索・参照するための MCP サーバーです。

## 目的

- ユーザー設定や作業ルールを再利用する
- リポジトリごとの運用メモを検索できるようにする
- `AGENTS.md` に書くほど常時必要ではない情報を保管する

## コンセプト

`agent-memory-mcp` は、エージェント用のローカル記憶です。

チャット履歴では流れてしまうが、毎回 `AGENTS.md` に載せるほどではない情報を、必要なときに検索して使えるようにします。

## ターゲット

- Codex
- Claude Code
- MCP 対応のコーディングエージェント
- 複数リポジトリをまたいで作業する開発者

## 方針

- 保存先はローカルの SQLite
- 検索は SQLite FTS5 から始める
- 秘密情報は保存しない
- クラウド同期や自動アップロードはしない

## 想定ツール

- `remember`: メモリを保存・更新する
- `search_memory`: メモリを検索する
- `get_memory`: メモリを取得する
- `list_memories`: メモリを一覧する
- `forget_memory`: メモリを削除する

## ドキュメント

- [設計メモ](docs/design.md)
- [セキュリティ](docs/security.md)
