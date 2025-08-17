import { z } from 'zod';

// 環境変数のスキーマ定義
const envSchema = z.object({
  // 環境設定
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // ネットワーク設定
  NETWORK: z.enum(['mainnet', 'testnet', 'devnet']).default('testnet'),

  // Issuer Wallet設定
  BRLUSD_ISSUER_SEED: z.string().min(1, 'BRLUSD_ISSUER_SEED is required'),

  NEXT_PUBLIC_RLUSD_ISSUER_ADDRESS: z
    .string()
    .min(1, 'NEXT_PUBLIC_RLUSD_ISSUER_ADDRESS is required'),
  NEXT_PUBLIC_BRLUSD_ISSUER_ADDRESS: z
    .string()
    .min(1, 'NEXT_PUBLIC_BRLUSD_ISSUER_ADDRESS is required'),
  NEXT_PUBLIC_DEPOSIT_ADDRESS: z.string().min(1, 'NEXT_PUBLIC_DEPOSIT_ADDRESS is required'),
  NEXT_PUBLIC_WITHDRAW_ADDRESS: z.string().min(1, 'NEXT_PUBLIC_WITHDRAW_ADDRESS is required'),
  NEXT_PUBLIC_TRADE_ADDRESS: z.string().min(1, 'NEXT_PUBLIC_TRADE_ADDRESS is required'),
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
