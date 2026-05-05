# ストーリー

## 解きたいこと

The Model 型 SaaS の仕事で、毎回同じ前提を説明したくない。

例:

- ICP / 顧客セグメント
- 商談やCSでよく出る課題
- プロダクトの狙い
- 今期の優先順位
- やらないこと
- 過去の意思決定

この種の判断材料をメモリに保存し、sales、CS、PdM、開発の会話で再利用できるようにする。

## 対象にする指示

- 事業文脈: ICP、競合、KPI、商談メモ
- 顧客文脈: 課題、要望、導入状況、解約リスク
- プロダクト文脈: コンセプト、価値仮説、ロードマップ
- 要望文脈: 機能要望、改善提案、頻度、対象顧客
- 優先順位: 今やること、後でやること、やらないこと
- 意思決定: 決めたこと、理由、前提、却下した案
- ツール文脈: よく使うSaaS、CLI、MCP、設定
- 指示文脈: よく使う依頼文、返答方針、確認手順
- 設計文脈: user story、作る機能、受け入れ条件
- プロセス文脈: 開発手順、issueルール、PRルール、レビュー手順、リリース手順
- 開発文脈: PO、SM、PjM、PdM、QA、Engineer の進め方

## 最初の体験

ユーザー:

```text
次に何を優先すべきか整理して
```

エージェント:

1. `customer`、`sales`、`cs`、`request`、`product`、`priority` でメモリを検索する
2. 顧客課題、事業目標、過去の判断を集める
3. 優先順位の候補と理由を整理する
4. 足りない前提だけ質問する
5. 次のアクションを短く出す

## User Story

- Sales として、商談で出た要望を残したい。後でPdMが優先順位判断に使えるようにするため。
- CS として、問い合わせや解約リスクを残したい。顧客課題をプロダクト改善につなげるため。
- PdM として、意思決定の理由を残したい。後で同じ議論を繰り返さないため。
- PO として、story の背景を残したい。開発チームが目的を見失わないようにするため。
- QA として、検証観点を残したい。リリース前に同じ確認漏れを防ぐため。
- Engineer として、実装方針を残したい。次の修正で同じ前提を使えるようにするため。

## 作っておく機能

- メモリ保存: 要望、判断、方針、作業ルールを保存する
- メモリ検索: 作業前に関連文脈を探す
- スコープ管理: `user`、`project`、`repo` で分ける
- タグ管理: `sales`、`cs`、`product`、`request`、`qa` などで探せる
- 優先度管理: `rule`、`preference`、`note` を分ける
- ツール記憶: GitHub、Notion、Slack、CRM、CI などの使い分けを残す
- 指示テンプレート: よく使う依頼文や確認観点を残す
- 更新履歴: いつ、何を、なぜ変えたかを残す

## 保存対象の例

- user story
- 作る機能
- 受け入れ条件
- 開発プロセス
- issueルール
- PRルール
- レビュー観点
- リリース手順
- よく使うツール
- よく使う指示

## よく使う指示

- 端的にまとめて
- 判断理由も書いて
- 代替案も出して
- issue にして
- story と task に分けて
- PR 本文を作って
- PR を作って
- レビュー依頼して
- 顧客影響を整理して
- 優先順位をつけて
- 受け入れ条件を書いて
- 検証観点を出して
- リリース時の注意点をまとめて

## よく使うツール

- GitHub: issue、PR、Project、release
- Slack: 顧客共有、社内確認、決定事項の共有
- Notion / docs: 仕様、議事録、意思決定ログ
- CRM: 商談、顧客、失注理由
- Helpdesk: 問い合わせ、障害、要望
- CI: lint、test、typecheck、deploy

## 開発プロセス

1. story を書く
2. task issue に分ける
3. 受け入れ条件を決める
4. 実装する
5. lint / test / typecheck を確認する
6. PR に変更点、確認結果、関連 issue を書く
7. 必要な reviewer を指定する

## issueルール

- story issue と task issue を分ける
- task issue は親 story に紐づける
- GitHub Project に追加する
- label / milestone / assignee を付ける
- 受け入れ条件を書く
- 背景、目的、やらないことを書く

## PRルール

- 関連 issue をリンクする
- 変更点を短く書く
- 確認したことを書く
- 未確認のことを書く
- 影響範囲を書く
- 必要な reviewer を付ける
- draft / ready の使い分けを守る

## 保存するメモリ例

```text
namespace: repo:takashiAg/agent-memory-mcp
key: product_concept
priority: rule
tags: product, concept, priority
value:
  The Model 型 SaaS の判断文脈を記憶する。
  sales、CS、PdM、開発が同じ前提を参照できるようにする。
```

```text
namespace: user
key: communication_preferences
priority: preference
tags: communication
value:
  返答は日本語。
  文章は端的にする。
```

```text
namespace: repo:owner/example-app
key: priority_policy
priority: rule
tags: priority, product, sales
value:
  優先順位は顧客課題、事業インパクト、実装コストで判断する。
  単発要望より、複数顧客に共通する課題を優先する。
  やらない理由も記録する。
```

```text
namespace: project:example-saas
key: feature_requests
priority: note
tags: request, product, customer
value:
  機能要望や改善提案は、顧客名、背景、頻度、期待効果と一緒に保存する。
  優先順位を決めるときは、単発要望か共通課題かを確認する。
```

## 必要な機能

- 顧客、商談、CS、機能要望、企画、意思決定を保存できる
- user / repo / project ごとに文脈を分けられる
- 企画、優先順位決定、実装の前に関連メモリを検索できる
- `rule` と `preference` を区別できる
- 実行前に足りない情報だけ質問できる

## やらないこと

- CRM や project management tool を置き換える
- 秘密情報を保存する
- すべてのチャット履歴を自動保存する
