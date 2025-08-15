// キャッシュタグの定義
export const cacheTags = {
  trustline: 'trustline',
  wallet: 'wallet',
  assets: 'assets',
  deposit: 'deposit',
} as const;

export type CacheTag = (typeof cacheTags)[keyof typeof cacheTags];
