// 定数ファイルから直接型をエクスポート
export type { TokenName as AssetType } from '@/lib/constants';

// AssetTypeの型エイリアスを定義
type AssetType = import('@/lib/constants').TokenName;

// APIレスポンスの型定義
export type TrustlineResponse = {
  currency: string;
  displayCurrency: string;
  issuer: string;
  balance: string;
  limit: string;
  isTrust: boolean;
};

export type AssetInfo = {
  id: string;
  type: AssetType;
  issuer?: string;
  balance: number;
  hasTrustline: boolean;
};

// 動的にTrustlineStatusの型を生成
export type TrustlineStatus = {
  [K in AssetType]: boolean;
};

// 残高情報を含むTrustlineStatus
export type TrustlineStatusWithBalance = {
  [K in AssetType]: {
    hasTrustline: boolean;
    balance: number;
  };
};

// ダイアログの状態管理用
export type DialogState = {
  isOpen: boolean;
  type: 'deposit' | 'withdraw' | 'setTrustline' | null;
  asset: AssetInfo | null;
};

// Deposit/Withdrawの入力値
export type TransactionInput = {
  amount: string;
  maxAmount: number;
};

// トラストライン送信用の型定義
export type TrustlineSetRequest = {
  currency: string;
  issuer: string;
  limit: string;
};

export type TrustlineSetResponse = {
  ok: boolean;
  error?: string;
  txHash?: string;
  signUrl?: string; // 署名用URLを追加
};

// Deposit用のPaymentトランザクション処理の型定義
export type DepositRequest = {
  currency: string;
  issuer: string;
  amount: string;
  destination: string; // Deposit専用アドレス
};

export type DepositResponse = {
  ok: boolean;
  error?: string;
  txHash?: string;
  signUrl?: string; // 署名用URLを追加
};

export type AssetTableViewProps = {
  assets: AssetInfo[];
  trustlineStatus: TrustlineStatus;
  isLoading: boolean;
  error: string | null;
  onOpenDialog: (type: 'deposit' | 'withdraw', asset: AssetInfo) => void;
};
