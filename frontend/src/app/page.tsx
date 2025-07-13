'use client';

import { useEffect, useState } from "react";
import { title, subtitle } from "@/components/primitives";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { useWalletStore } from "@/stores";
import { Client, Wallet } from "xrpl"
import { isInstalled, setTrustline, sendPayment } from "@gemwallet/api";

const ISSUER_WALLET_SECRET = "sEdTnfkRt8SeknnhvNtZ4QUcUW4jGeQ";
const ALLOWED_CURRENCY = "AAA";

export default function Home() {
  const { isConnected, address } = useWalletStore();

  const [isTokenAllowed, setIsTokenAllowed] = useState(false);
  const [amount, setAmount] = useState(0);

  const handleWalletInfo = async () => {
    const client = new Client("wss://s.altnet.rippletest.net:51233/")

    try {
      await client.connect();

      const response = await client.request({
        command: "account_lines",
        account: address,
      })

      const result = response.result
      const lines = result.lines

      // 許可されているトークンが存在するか account が issuer のものか、currency が AAA のものか
      const isTokenAllowed = lines.some((line) => line.account === ISSUER_WALLET_SECRET || line.currency === ALLOWED_CURRENCY);

      setIsTokenAllowed(isTokenAllowed);
    } catch (error) {
      console.error(error);
    } finally {
      client.disconnect();
    }
  }

  const handleTrustline = async () => {
    try {
      if (!isInstalled()) {
        console.error("Gemwallet is not installed");
        return;
      }

      const wallet = Wallet.fromSecret(ISSUER_WALLET_SECRET);

      const response = await setTrustline({
        limitAmount: {
          value: "1000000000",
          currency: ALLOWED_CURRENCY,
          issuer: wallet.address,
        }
      });

      console.log(response)

      await handleWalletInfo();
    } catch (error) {
      console.error(error);
    }
  }

  const handleDeposit = async () => {
    try {
      if (!isInstalled()) {
        console.error("Gemwallet is not installed");
        return;
      }

      if (amount <= 0) {
        console.error("Amount must be greater than 0");
        return;
      }

      const wallet = Wallet.fromSecret(ISSUER_WALLET_SECRET);

      const strToHex = (str: string) => {
        return Buffer.from(str).toString("hex");
      }

      const response = await sendPayment({
        amount: amount.toString(),
        destination: wallet.address,
        memos: [
          {
            memo: {
              memoType: strToHex("deposit"),
              memoData: strToHex("user:abcd1234"),
              memoFormat: strToHex("text/plain"),
            }
          }
        ]
      })

      console.log(response)
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    (async () => {
      if (!isConnected) return;

      await handleWalletInfo();
    })()
  }, [isConnected])

  return (
    <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
      <div className="inline-block max-w-xl text-center justify-center">
        <span className={title()}>Make&nbsp;</span>
        <span className={title({ color: "violet" })}>beautiful&nbsp;</span>
        <br />
        <span className={title()}>
          websites regardless of your design experience.
        </span>
        <div className={subtitle({ class: "mt-4" })}>
          Beautiful, fast and modern React UI library.
        </div>
      </div>

      <div className="flex gap-3">
        {isConnected ? (
          <div className="text-center">
            <p>{address}</p>
            {isTokenAllowed ? (
              <>
                <Input
                  label="Amount"
                  type="number"
                  placeholder="Amount"
                  className="my-2"
                  value={amount.toString()}
                  onValueChange={(value) => setAmount(Number(value))}
                />
                <Button className="my-2" onPress={handleDeposit}>Deposit {ALLOWED_CURRENCY}</Button>
              </>
            ): (
              <Button className="my-2" onPress={handleTrustline}>
                Trustline {ALLOWED_CURRENCY}
              </Button>
            )}
          </div>
        ): (
          <p>Not connected</p>
        )}
      </div>
    </section>
  );
}
