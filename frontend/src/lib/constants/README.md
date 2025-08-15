# 定数ファイル管理ガイド

## 概要

このディレクトリには、アプリケーション全体で使用される定数が一元管理されています。
トークン名やネットワーク設定などの変更が必要な場合、このファイルを編集するだけで済みます。

## ファイル構成

### `tokens.ts`
- トークン関連の定数（名前、発行者、表示名、説明）
- 主要トークンの定義
- トークン設定取得のヘルパー関数
- 設定検証機能

### `networks.ts`
- ネットワーク設定の定数
- 発行者アドレスの管理
- デポジットウォレットの設定
- ネットワーク情報の取得・検証

### `utils.ts`
- 設定の整合性検証
- 設定変更の影響範囲分析
- 設定のバックアップ・復元・比較
- 共通ユーティリティ関数

### `index.ts`
- 全定数ファイルのエクスポート
- 利便性のための再エクスポート
- 統一されたインポートインターフェース

## トークン名変更時の手順

### 1. 影響範囲の確認
トークン名を変更する場合、以下のファイルが自動的に更新されます：

- ✅ `tokens.ts` - 定数定義
- ✅ `asset-config.ts` - アセット設定（再エクスポート）
- ✅ `types.ts` - 型定義（再エクスポート）
- ✅ `xrplClient.ts` - ネットワーク設定（統合済み）

### 2. 変更手順

#### 例：BRLUSDをNEWTOKENに変更する場合

```typescript
// tokens.ts で以下を変更
export const TOKENS = {
  BRLUSD: 'NEWTOKEN',  // ここを変更
  PRO: 'PRO',
  RLUSD: 'RLUSD',
} as const;
```

#### 自動更新される項目
- 発行者アドレス（ISSUERS）
- 表示名（DISPLAY_NAMES）
- 説明文（DESCRIPTIONS）
- 主要トークン配列（PRIMARY_TOKENS）
- 型定義（AssetType, TrustlineStatus）

### 3. 変更後の確認事項

1. **型エラーの確認**
   ```bash
   npm run build
   ```

2. **アプリケーションの動作確認**
   - トークン表示
   - Trustline設定
   - 残高表示

3. **設定の検証**
   ```typescript
   import { validateConfiguration } from '@/lib/constants';
   const validation = validateConfiguration();
   console.log(validation);
   ```

## 新しい共通化機能

### 設定の検証
```typescript
import { validateConfiguration, validateAllTokenConfigs } from '@/lib/constants';

// 全設定の整合性検証
const configValidation = validateConfiguration();

// トークン設定の検証
const tokenValidation = validateAllTokenConfigs();
```

### 影響範囲の分析
```typescript
import { analyzeConfigurationImpact } from '@/lib/constants';

// トークン変更の影響範囲分析
const impact = analyzeConfigurationImpact('token', 'BRLUSD');
console.log('影響を受けるファイル:', impact.affectedFiles);
```

### 設定の概要取得
```typescript
import { getConfigurationSummary } from '@/lib/constants';

// 現在の設定概要
const summary = getConfigurationSummary();
console.log('トークン数:', summary.tokens.total);
```

## ベストプラクティス

### ✅ 推奨事項
- トークン名は定数ファイルでのみ定義
- ハードコーディングされた文字列は使用しない
- 型安全性を保つため、`as const`を使用
- 新しいインデックスファイル（`@/lib/constants`）を使用
- 設定変更前に関連する検証関数を実行

### ❌ 避けるべき事項
- 個別ファイルでのトークン名の直接記述
- マジックナンバー・文字列の使用
- 定数ファイル以外での設定変更
- 個別ファイルからの直接インポート（`@/lib/constants/tokens`など）

## トラブルシューティング

### よくある問題

1. **型エラーが発生する**
   - 定数ファイルの更新漏れがないか確認
   - `as const`の使用を確認
   - 新しいインデックスファイル（`@/lib/constants`）を使用しているか確認

2. **トークンが表示されない**
   - `PRIMARY_TOKENS`配列に含まれているか確認
   - `ASSET_CONFIG`の生成を確認
   - 設定検証関数でエラーがないか確認

3. **Trustline状態が正しく取得できない**
   - 発行者アドレスが正しいか確認
   - ネットワーク設定の確認
   - 設定検証関数でエラーがないか確認

## 今後の拡張

新しいトークンを追加する場合：

1. `tokens.ts`の`TOKENS`オブジェクトに追加
2. 必要に応じて`PRIMARY_TOKENS`に追加
3. 関連する設定（発行者、表示名、説明）を追加
4. 設定検証関数でエラーがないか確認

これにより、アプリケーション全体で一貫したトークン管理が可能になり、設定変更時の影響範囲も最小限に抑えられます。

## 開発者向け情報

### 設定変更のデバッグ
```typescript
import { 
  validateConfiguration, 
  getConfigurationSummary,
  analyzeConfigurationImpact 
} from '@/lib/constants';

// 開発時の設定確認
if (process.env.NODE_ENV === 'development') {
  console.log('設定概要:', getConfigurationSummary());
  console.log('設定検証:', validateConfiguration());
}
```

### パフォーマンス最適化
- 定数ファイルは`as const`で最適化
- 開発時のみ検証関数を実行
- 本番環境では不要な検証をスキップ

## 削除されたファイル

以下のファイルは共通化により削除されました：

- ❌ `frontend/src/app/(app)/_lib/xrpl-client.ts` - 統合済み
- ❌ 重複する設定定義 - 定数ファイルに統合済み

これにより、設定管理がより簡潔で保守しやすくなりました。
