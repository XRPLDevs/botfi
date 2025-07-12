export function WalletConnectMessage() {
  return (
    <div className="flex flex-col items-center justify-center space-y-6 p-8 text-center">
      <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center">
        <svg
          className="w-12 h-12 text-muted-foreground"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
      </div>

      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Connect Your Wallet</h2>
        <p className="text-muted-foreground max-w-md">
          To view your BotFi asset information, you need to connect your wallet. Please use the
          wallet connect button at the top to start connecting.
        </p>
      </div>
    </div>
  );
}
