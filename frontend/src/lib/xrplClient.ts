import { type AccountLinesTrustline, Client } from 'xrpl';

// ネットワーク設定
export const NETWORK_CONFIG = {
  mainnet: {
    BOT_ISSUER: 'rUbvHHDLhJkTA1u6XgPKoPGYSVQwrU6jhU',
    RLUSD_ISSUER: 'rQhWct2fv4Vc4KRjRgMrxa8xPN9Zx9iLKV',
    DEPOSIT_WALLET: 'rnjyMRQTM2eYJcrjm1hXdfaUY6vhjAk4pC',
  },
  testnet: {
    BOT_ISSUER: 'rUbvHHDLhJkTA1u6XgPKoPGYSVQwrU6jhU', // テストネット用のアドレスに変更
    RLUSD_ISSUER: 'rQhWct2fv4Vc4KRjRgMrxa8xPN9Zx9iLKV', // テストネット用のアドレスに変更
    DEPOSIT_WALLET: 'rnjyMRQTM2eYJcrjm1hXdfaUY6vhjAk4pC', // テストネット用のアドレスに変更
  },
  devnet: {
    BOT_ISSUER: 'rUbvHHDLhJkTA1u6XgPKoPGYSVQwrU6jhU', // デブネット用のアドレスに変更
    RLUSD_ISSUER: 'rQhWct2fv4Vc4KRjRgMrxa8xPN9Zx9iLKV', // デブネット用のアドレスに変更
    DEPOSIT_WALLET: 'rnjyMRQTM2eYJcrjm1hXdfaUY6vhjAk4pC', // デブネット用のアドレスに変更
  },
} as const;

export class XRPLClient {
  private client: Client;

  constructor(wss: string) {
    this.client = new Client(wss);
  }

  public async requestAccountLines(address: string): Promise<AccountLinesTrustline[]> {
    const response = await this.withConnection(async (client) => {
      const accountLines = await client.request({
        command: 'account_lines',
        account: address,
      });
      return accountLines;
    });

    const lines = response.result.lines;

    return lines;
  }

  private async withConnection<T>(callback: (client: Client) => Promise<T>): Promise<T> {
    try {
      await this.client.connect();
      return await callback(this.client);
    } finally {
      await this.client.disconnect();
    }
  }
}
