export type AssetType = 'BOT' | 'PRO' | 'RLUSD';

export type AssetInfo = {
  id: string;
  type: AssetType;
  issuer?: string;
  balance: number;
  hasTrustline: boolean;
};

export type TrustlineStatus = {
  BOT: boolean;
  PRO: boolean;
  RLUSD: boolean;
};

export type AssetTableViewProps = {
  assets: AssetInfo[];
  trustlineStatus: TrustlineStatus;
  isLoading: boolean;
  error: string | null;
};
