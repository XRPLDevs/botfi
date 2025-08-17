import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircleIcon, CheckCircle2Icon, PopcornIcon, InfoIcon } from 'lucide-react';

export default function OverviewPage() {
  const TypographyH3 = ({ children }: { children: React.ReactNode }) => {
    return <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">{children}</h3>;
  };

  const TypographyH4 = ({ children }: { children: React.ReactNode }) => {
    return <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">{children}</h4>;
  };

  const TypographyP = ({ children }: { children: React.ReactNode }) => {
    return <p className="leading-7">{children}</p>;
  };

  const TypographyBlockquote = ({ children }: { children: React.ReactNode }) => {
    return <blockquote className="mt-6 border-l-2 pl-6 italic">{children}</blockquote>;
  };

  const TypographyList = ({ texts }: { texts: { key: string; value: string }[] }) => {
    return (
      <ul className="ml-6 list-disc [&>li]:mt-2">
        {texts.map((text) => (
          <li key={text.key} className="mb-4">
            <span className="font-bold">{text.key}</span>
            <br />
            <span>{text.value}</span>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-[64px] row-start-2 items-center sm:items-start max-w-4xl mx-auto">
        <Alert variant="default">
          <InfoIcon className="h-4 w-4" />
          <AlertTitle>
            <strong>Development Notice</strong>
          </AlertTitle>
          <AlertDescription>
            <p>
              This application is currently under active development. Features and specifications
              may change as we continue to improve the platform. We appreciate your understanding
              and feedback during this development phase.
            </p>
          </AlertDescription>
        </Alert>

        <div className="flex flex-col gap-[16px]">
          <TypographyH3>Introduction</TypographyH3>
          <TypographyP>
            <strong>BotFi</strong> is an <strong>XRPL</strong>-native, <strong>NAV</strong>-based
            asset-management protocol. Users deposit <strong>RLUSD</strong> (a USD-pegged stablecoin
            issued on <strong>XRPL</strong>) and receive <strong>bRLUSD</strong>, a vault share
            token that represents proportional ownership of BotFi's managed pool.{' '}
            <strong>bRLUSD</strong> does not rebase; instead, its value per share (
            <strong>NAV</strong>) is periodically determined on a fixed epoch schedule. All mint and
            burn operations reference the current epoch's <strong>NAV</strong> to provide fair,
            consistent accounting and to avoid risk-free arbitrage.
          </TypographyP>
          <TypographyP>
            Redemptions are designed for safety and clarity. The default path distributes assets{' '}
            <strong>in-kind</strong> (i.e., pro-rata from the vault's holdings). An optional{' '}
            <strong>RLUSD-only</strong> path may be offered under safeguards; when available, it
            converts the non-stablecoin portion into <strong>RLUSD</strong> subject to protective
            limits. BotFi emphasizes <strong>XRPL</strong>-first settlement, transparency of{' '}
            <strong>NAV</strong> history, and operational controls that prioritize user protection.
          </TypographyP>
          <TypographyBlockquote>
            <em>
              Note: The following reflects the high-level design. Implementation details
              (parameters, exact flows, and integrations) may evolve.
            </em>
          </TypographyBlockquote>
        </div>

        <div className="flex flex-col gap-[16px]">
          <TypographyH3>Terminology</TypographyH3>
          <TypographyList
            texts={[
              {
                key: 'XRPL (XRP Ledger)',
                value:
                  'A decentralized, high-throughput ledger using XRP as the native asset and fees, optimized for fast, low-cost settlement.',
              },
              {
                key: 'RLUSD (Deposit Stablecoin)',
                value:
                  'The USD-pegged stablecoin used for deposits and redemptions on XRPL within BotFi.',
              },
              {
                key: 'bRLUSD (Vault Share Token)',
                value:
                  "A share-style token representing a user's proportional claim on the vault. bRLUSD amounts held by users are fixed after mint; the value per bRLUSD changes over time based on NAV.",
              },
              {
                key: 'NAV (Net Asset Value)',
                value:
                  "The per-share value of the vault, computed from the vault's holdings and accrued items at epoch boundaries. All mint/burn operations reference the latest NAV to keep accounting fair and consistent.",
              },
              {
                key: 'Epoch',
                value:
                  'A fixed-interval accounting window. At each epoch boundary, BotFi performs valuation, accrues applicable items, fixes NAV, and then batches deposits and withdrawals using that NAV. Epoch timing is anchored to wall-clock slots; minor timing jitter is tolerated without affecting accounting.',
              },
              {
                key: 'In-Kind Redemption',
                value:
                  "Default redemption mode in which users receive a pro-rata mix of the vault's underlying assets (e.g., RLUSD and any other held assets), reflecting their share of the pool.",
              },
            ]}
          />
        </div>

        <div className="flex flex-col gap-[16px]">
          <TypographyH3>Products</TypographyH3>

          <div className="flex flex-col gap-[16px]">
            <TypographyH4>1) BotFi Vault (bRLUSD)</TypographyH4>
            <TypographyList
              texts={[
                {
                  key: 'Deposit Process',
                  value: 'Deposit RLUSD → receive bRLUSD at the current epoch NAV.',
                },
                {
                  key: 'Share-based Accounting',
                  value:
                    'bRLUSD represents proportional ownership; the number of shares you hold stays constant, while NAV updates over time.',
                },
                {
                  key: 'Redemption Choices',
                  value:
                    "In-Kind (default): receive a pro-rata set of the vault's assets. RLUSD-Only (optional): when available, convert your redemption to RLUSD under safeguards; otherwise, fall back to in-kind.",
                },
              ]}
            />
          </div>

          <div className="flex flex-col gap-[16px]">
            <TypographyH4>2) Operator Controls & Safety</TypographyH4>
            <TypographyList
              texts={[
                {
                  key: 'Epoch Scheduler',
                  value: 'Aligned to wall-clock intervals for consistent timing.',
                },
                {
                  key: 'Health Checks',
                  value:
                    'Oracle/data feeds monitoring, multi-level pause (deposit-only, in-kind-only, full pause), and multisig for sensitive actions.',
                },
                {
                  key: 'Transparent Reporting',
                  value:
                    'Epoch information, NAV history, and vault balances are publicly accessible.',
                },
              ]}
            />
          </div>

          <div className="flex flex-col gap-[16px]">
            <TypographyH4>3) Tooling & Analytics</TypographyH4>
            <TypographyList
              texts={[
                {
                  key: 'User Dashboards',
                  value:
                    'Surface NAV history, position mix at a high level, and clear countdowns to the next epoch.',
                },
                {
                  key: 'Quote System',
                  value:
                    'Indicate the referenced epoch and validity window, keeping expectations aligned with the epoch model.',
                },
              ]}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
