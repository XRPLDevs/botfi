import { NETWORKS } from './networks';
import { TOKENS } from './tokens';

/**
 * 設定の整合性を検証する共通関数
 */
export function validateConfiguration() {
  const errors: string[] = [];

  // トークン設定の検証
  Object.values(TOKENS).forEach((tokenName) => {
    if (!tokenName || tokenName.trim() === '') {
      errors.push(`Invalid token name: ${tokenName}`);
    }
  });

  // ネットワーク設定の検証
  Object.values(NETWORKS).forEach((network) => {
    if (!network || network.trim() === '') {
      errors.push(`Invalid network name: ${network}`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    summary: {
      tokenCount: Object.keys(TOKENS).length,
      networkCount: Object.keys(NETWORKS).length,
    },
  };
}

/**
 * 設定の概要を取得
 */
export function getConfigurationSummary() {
  return {
    tokens: {
      total: Object.keys(TOKENS).length,
      names: Object.values(TOKENS),
      primary: Object.values(TOKENS).filter((name) => ['bRLUSD', 'PRO'].includes(name)),
    },
    networks: {
      total: Object.keys(NETWORKS).length,
      names: Object.values(NETWORKS),
    },
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * 設定変更の影響範囲を分析
 */
export function analyzeConfigurationImpact(changeType: 'token' | 'network', targetName: string) {
  const impact = {
    changeType,
    targetName,
    affectedFiles: [] as string[],
    affectedTypes: [] as string[],
    recommendations: [] as string[],
  };

  if (changeType === 'token') {
    impact.affectedFiles = [
      'constants/tokens.ts',
      'constants/networks.ts',
      'app/(app)/_lib/asset-config.ts',
      'app/(app)/_containers/asset-table/types.ts',
      'app/(app)/_containers/asset-table/container.tsx',
    ];
    impact.affectedTypes = ['TokenName', 'AssetType', 'TrustlineStatus'];
    impact.recommendations = [
      'トークン名変更後は型チェックを実行してください',
      'アプリケーションの動作確認を行ってください',
      'Trustline設定の確認を行ってください',
    ];
  } else if (changeType === 'network') {
    impact.affectedFiles = ['constants/networks.ts', 'lib/xrplClient.ts'];
    impact.affectedTypes = ['NetworkType', 'NETWORK_CONFIG'];
    impact.recommendations = [
      'ネットワーク設定変更後は接続テストを行ってください',
      '発行者アドレスの確認を行ってください',
    ];
  }

  return impact;
}

/**
 * 設定のバックアップと復元
 */
export function backupConfiguration() {
  return {
    tokens: { ...TOKENS },
    networks: { ...NETWORKS },
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  };
}

/**
 * 設定の比較
 */
export function compareConfigurations(
  config1: ReturnType<typeof backupConfiguration>,
  config2: ReturnType<typeof backupConfiguration>
) {
  const differences = {
    tokens: {} as Record<string, { old: string; new: string }>,
    networks: {} as Record<string, { old: string; new: string }>,
    hasChanges: false,
  };

  // トークンの変更を検出
  Object.keys(config1.tokens).forEach((key) => {
    if (
      config1.tokens[key as keyof typeof config1.tokens] !==
      config2.tokens[key as keyof typeof config2.tokens]
    ) {
      differences.tokens[key] = {
        old: config1.tokens[key as keyof typeof config1.tokens],
        new: config2.tokens[key as keyof typeof config2.tokens],
      };
      differences.hasChanges = true;
    }
  });

  // ネットワークの変更を検出
  Object.keys(config1.networks).forEach((key) => {
    if (
      config1.networks[key as keyof typeof config1.networks] !==
      config2.networks[key as keyof typeof config2.networks]
    ) {
      differences.networks[key] = {
        old: config1.networks[key as keyof typeof config1.networks],
        new: config2.networks[key as keyof typeof config2.networks],
      };
      differences.hasChanges = true;
    }
  });

  return differences;
}
