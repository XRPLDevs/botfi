import { type AccountLinesTrustline, Client } from 'xrpl';
import { getXRPLEndpoint, getNetworkConfig, type NetworkType } from './constants/networks';
import { env } from './env';

// 定数ファイルからネットワーク設定を取得（重複定義を削除）
export { NETWORK_CONFIG } from './constants/networks';

export class XRPLClient {
  private client: Client;
  private network: NetworkType;
  private networkConfig: ReturnType<typeof getNetworkConfig>;

  constructor(network?: NetworkType) {
    this.network = network || env.NETWORK;
    this.networkConfig = getNetworkConfig(this.network);
    
    // ネットワークに基づいてエンドポイントを選択
    const endpoint = getXRPLEndpoint(this.network);
    this.client = new Client(endpoint);
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

  public async requestAccountTx(address: string, limit?: number): Promise<any[]> {
    // ネットワークに基づいて制限を設定
    const maxLimit = this.networkConfig.maxHistoryLimit;
    const actualLimit = limit ? Math.min(limit, maxLimit) : maxLimit;
    
    const response = await this.withConnection(async (client) => {
      const accountTx = await client.request({
        command: 'account_tx',
        account: address,
        ledger_index_min: -1,
        ledger_index_max: -1,
        binary: false,
        limit: actualLimit,
        forward: false,
      });
      return accountTx;
    });

    return response.result.transactions || [];
  }

  private async withConnection<T>(callback: (client: Client) => Promise<T>): Promise<T> {
    try {
      await this.client.connect();
      return await callback(this.client);
    } finally {
      await this.client.disconnect();
    }
  }

  // ネットワーク情報の取得
  public getNetworkInfo() {
    return {
      network: this.network,
      endpoint: this.client.url,
      config: this.networkConfig
    };
  }

  // トランザクションの自動補完
  public async autofill(transaction: any): Promise<any> {
    return await this.withConnection(async (client) => {
      return await client.autofill(transaction);
    });
  }

  // 署名済みトランザクションの送信
  public async submit(txBlob: string): Promise<any> {
    return await this.withConnection(async (client) => {
      return await client.submit(txBlob);
    });
  }

  // クライアントの切断
  public async disconnect(): Promise<void> {
    if (this.client.isConnected()) {
      await this.client.disconnect();
    }
  }
}
