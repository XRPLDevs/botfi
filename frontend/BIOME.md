# BiomeJS 設定ガイド

このプロジェクトでは、BiomeJSを使用してコードの品質管理とフォーマットを行っています。

## 概要

BiomeJSは、ESLint、Prettier、TypeScript ESLintなどの複数のツールを統合した高速なJavaScript/TypeScript用のリンター・フォーマッターです。

## インストール

```bash
npm install --save-dev @biomejs/biome
```

## 利用可能なスクリプト

### コードチェック
```bash
# コードの品質チェック（lint + format）
npm run check

# コードの品質チェックと自動修正
npm run check:fix
```

### リンター
```bash
# リンター実行
npm run lint

# リンター実行と自動修正
npm run lint:fix
```

### フォーマッター
```bash
# コードフォーマット
npm run format
```

## 注意事項

### パッケージマネージャーについて
- **npm**: 推奨。すべてのコマンドが正常に動作します
- **yarn**: Node.js v16.15.1ではcorepackの互換性問題により、一部のコマンドでエラーが発生する可能性があります
  - 解決方法: Node.js v18以上へのアップグレードを推奨
  - または、npmを使用してください

## 設定ファイル

`biome.json` で以下の設定を行っています：

- **VCS統合**: Gitとの連携
- **ファイル除外**: `.next/`, `node_modules/`, `dist/` などを除外
- **フォーマッター**: インデント2スペース、行幅100文字
- **リンター**: 推奨ルール + カスタムルール
- **インポート整理**: 自動インポートソート

## 主要なルール

### エラー（Error）
- 未使用変数・インポート
- 明示的な `any` 型の使用
- 配列インデックスをキーとして使用
- 制御文字を含む正規表現

### 警告（Warning）
- `forEach` の使用（`for...of` を推奨）
- `delete` 演算子の使用
- 不要な `try-catch` ブロック

## 自動修正

BiomeJSは多くの問題を自動修正できます：

```bash
# 安全な修正のみ適用
npm run check:fix

# 安全でない修正も含めて適用（注意が必要）
npx @biomejs/biome check --write --unsafe .
```

## エディタ統合

### VS Code
BiomeJS拡張機能をインストールして、リアルタイムでコード品質をチェックできます。

### その他のエディタ
各エディタのBiomeJS拡張機能をインストールしてください。

## トラブルシューティング

### 設定ファイルの移行
BiomeJSのバージョンアップ時は、設定ファイルの移行が必要な場合があります：

```bash
npx @biomejs/biome migrate
npx @biomejs/biome migrate --write
```

### 特定のファイルを除外
`.gitignore` と同様のパターンでファイルを除外できます。

## 参考リンク

- [BiomeJS公式ドキュメント](https://biomejs.dev/)
- [設定リファレンス](https://biomejs.dev/reference/configuration/)
- [ルール一覧](https://biomejs.dev/linter/rules/)
