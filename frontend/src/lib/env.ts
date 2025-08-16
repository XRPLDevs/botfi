import { z } from 'zod';

// 環境変数のスキーマ定義
const envSchema = z.object({
  // XRPL設定
  XRPL_NODE_URL: z.string().url().default('wss://s.altnet.rippletest.net:51233'),

  // Issuer Wallet設定
  ISSUER_WALLET_SEED: z.string().min(1, 'ISSUER_WALLET_SEED is required'),

  // 環境設定
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

// 環境変数の検証と型安全な取得
function validateEnv() {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.issues.map((issue) => issue.path.join('.')).join(', ');
      throw new Error(`Missing or invalid environment variables: ${missingVars}`);
    }
    throw error;
  }
}

// 検証済みの環境変数を取得
export const env = validateEnv();

// 環境変数の型をエクスポート
export type Env = z.infer<typeof envSchema>;
