import { type AccountLinesTrustline, Client } from 'xrpl';
import { NETWORK_CONFIG } from './constants/networks';

// 定数ファイルからネットワーク設定を取得（重複定義を削除）
export { NETWORK_CONFIG };

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
