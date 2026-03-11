"use client";

import { useEffect, useState } from "react";
import { encodeFunctionData, parseAbi } from "viem";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import Badge from "~~/components/ui/Badge";
import { useNetworkColor } from "~~/hooks/scaffold-eth";
import { EXAMPLE_TARGET_ADDRESS, FORWARDER_ADDRESS } from "~~/utils/gasless/config";
import { signMetaTransaction, signMetaTransactionWithNonce } from "~~/utils/gasless/metaTx";
import { getNonce, relayBatchTransactions, relayTransaction } from "~~/utils/gasless/relayerClient";
import { ForwardRequest } from "~~/utils/gasless/types";

const exampleTargetAbi = parseAbi([
  "function addPoints(uint256 amount) public",
  "function getPoints(address user) public view returns (uint256)",
]);

// Helper function to poll for transaction receipt
async function pollForTransactionReceipt({
  txHash,
  publicClient,
  addLog,
  maxAttempts = 60,
  onSuccess,
  onReverted,
  onUnknown,
}: {
  txHash: `0x${string}`;
  publicClient: any;
  addLog: (message: string) => void;
  maxAttempts?: number;
  onSuccess: (receipt: any) => Promise<void>;
  onReverted: () => void;
  onUnknown: (receipt: any) => Promise<void>;
}): Promise<boolean> {
  let attempts = 0;

  while (attempts < maxAttempts) {
    attempts++;

    try {
      const receipt = await publicClient.getTransactionReceipt({ hash: txHash });

      console.log("Receipt received:", receipt);
      addLog(`📋 Receipt found! Status: ${receipt.status}`);

      if (receipt.status === "success") {
        await onSuccess(receipt);
        return true;
      } else if (receipt.status === "reverted") {
        onReverted();
        return true;
      } else {
        addLog(`⚠️ Unknown receipt status: ${receipt.status}`);
        console.log("Full receipt:", receipt);
        await onUnknown(receipt);
        return true;
      }
    } catch (err: any) {
      if (attempts === 1 || attempts % 10 === 0) {
        console.log(`Attempt ${attempts} - Error:`, err.message);
      }
    }

    if (attempts % 5 === 0) {
      addLog(`⏳ Still waiting... (${attempts}s elapsed)`);
    }

    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  return false; // Timeout
}

export default function GaslessPage() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const networkColor = useNetworkColor();

  const [points, setPoints] = useState<bigint>(0n);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [txHash, setTxHash] = useState<string>("");

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  const loadPoints = async () => {
    if (!address || !publicClient) return;

    try {
      const result = await publicClient.readContract({
        address: EXAMPLE_TARGET_ADDRESS,
        abi: exampleTargetAbi,
        functionName: "getPoints",
        args: [address],
      });
      setPoints(result as bigint);
    } catch (error) {
      console.error("Failed to load points:", error);
      addLog("❌ Failed to load points");
    }
  };

  // Auto-load points when account changes
  useEffect(() => {
    if (isConnected && address) {
      loadPoints();
    } else if (!isConnected) {
      setPoints(0n);
      setLogs([]);
      setTxHash("");
    }
  }, [address, isConnected, loadPoints]);

  const handleDirectCall = async () => {
    if (!address || !walletClient) {
      addLog("❌ Please connect your wallet");
      return;
    }

    setLoading(true);

    try {
      addLog("📝 Preparing direct transaction...");

      const hash = await walletClient.writeContract({
        address: EXAMPLE_TARGET_ADDRESS,
        abi: exampleTargetAbi,
        functionName: "addPoints",
        args: [10n],
        account: address,
      });

      addLog(`✅ Transaction sent: ${hash}`);
      setTxHash(hash);

      addLog("⏳ Waiting for confirmation...");

      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash });
        addLog("✅ Transaction confirmed!");
        await loadPoints();
      }
    } catch (error: any) {
      addLog(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleGaslessCall = async () => {
    if (!address || !walletClient) {
      addLog("❌ Please connect your wallet");
      return;
    }

    setLoading(true);

    try {
      addLog("📝 Encoding function data...");
      const data = encodeFunctionData({
        abi: exampleTargetAbi,
        functionName: "addPoints",
        args: [10n],
      });

      // Calculate deadline (1 hour from now)
      const deadline = Math.floor(Date.now() / 1000) + 3600;

      const request: ForwardRequest = {
        from: address,
        to: EXAMPLE_TARGET_ADDRESS,
        value: "0",
        gas: "200000", // Increased gas limit for meta-transaction execution
        deadline: deadline.toString(),
        data,
      };

      addLog("✍️  Signing EIP-712 message (fetching nonce internally)...");
      const signature = await signMetaTransaction(walletClient, request);
      addLog("✅ Signature obtained");

      addLog("📡 Sending to relayer...");
      const response = await relayTransaction({ request, signature });

      if (response.success && response.txHash) {
        addLog(`✅ Relayer submitted tx: ${response.txHash}`);
        setTxHash(response.txHash);

        addLog("⏳ Waiting for confirmation...");

        if (publicClient) {
          const confirmed = await pollForTransactionReceipt({
            txHash: response.txHash as `0x${string}`,
            publicClient,
            addLog,
            onSuccess: async receipt => {
              addLog(`✅ Transaction confirmed in block ${receipt.blockNumber}!`);
              await loadPoints();
            },
            onReverted: () => {
              addLog("❌ Transaction reverted on-chain");
            },
            onUnknown: async receipt => {
              addLog(`⚠️ Unknown receipt status: ${receipt.status}`);
              await loadPoints();
            },
          });

          if (!confirmed) {
            addLog("⚠️ Confirmation timeout - transaction may still be processing");
            addLog(`Check: https://explorer.testnet.rootstock.io/tx/${response.txHash}`);
            // Still try to load points in case it confirmed
            setTimeout(() => loadPoints(), 3000);
          }
        }
      } else {
        addLog(`❌ Relayer error: ${response.error}`);
      }
    } catch (error: any) {
      addLog(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleBatchCall = async () => {
    if (!address || !walletClient) {
      addLog("❌ Please connect your wallet");
      return;
    }

    setLoading(true);

    try {
      addLog("📦 Preparing batch of 3 transactions...");

      const amounts = [5, 10, 15]; // Three different amounts
      const requests: Array<{ request: ForwardRequest; signature: string }> = [];

      // Fetch starting nonce once for the batch
      addLog("🔍 Fetching starting nonce...");
      const currentNonce = await getNonce(address);
      addLog(`✅ Starting nonce: ${currentNonce}`);

      // Create and sign each request with sequential nonces
      for (let i = 0; i < amounts.length; i++) {
        const amount = amounts[i];
        addLog(`📝 Preparing transaction ${i + 1}: addPoints(${amount}) with nonce ${currentNonce + BigInt(i)}...`);

        const data = encodeFunctionData({
          abi: exampleTargetAbi,
          functionName: "addPoints",
          args: [BigInt(amount)],
        });

        const deadline = Math.floor(Date.now() / 1000) + 3600;

        const request: ForwardRequest = {
          from: address,
          to: EXAMPLE_TARGET_ADDRESS,
          value: "0",
          gas: "200000",
          deadline: deadline.toString(),
          data,
        };

        addLog(`✍️  Signing transaction ${i + 1}...`);
        // Use sequential nonces: currentNonce, currentNonce+1, currentNonce+2
        const signature = await signMetaTransactionWithNonce(walletClient, request, currentNonce + BigInt(i));
        requests.push({ request, signature });
      }

      addLog(`✅ All ${amounts.length} transactions signed with sequential nonces!`);
      addLog("📡 Sending batch to relayer...");

      const response = await relayBatchTransactions(requests);

      if (response.success && response.txHash) {
        addLog(`✅ Batch submitted in single tx: ${response.txHash}`);
        addLog(`💰 Gas savings: ~35% compared to ${amounts.length} separate transactions!`);
        setTxHash(response.txHash);

        addLog("⏳ Waiting for confirmation...");

        if (publicClient) {
          const confirmed = await pollForTransactionReceipt({
            txHash: response.txHash as `0x${string}`,
            publicClient,
            addLog,
            onSuccess: async receipt => {
              addLog(`✅ Batch confirmed in block ${receipt.blockNumber}!`);
              addLog(`🎉 Added ${amounts.reduce((a, b) => a + b, 0)} points total!`);
              await loadPoints();
            },
            onReverted: () => {
              addLog("❌ Batch reverted on-chain");
            },
            onUnknown: async receipt => {
              addLog(`⚠️ Unknown receipt status: ${receipt.status}`);
              await loadPoints();
            },
          });

          if (!confirmed) {
            addLog("⚠️ Confirmation timeout - batch may still be processing");
            addLog(`Check: https://explorer.testnet.rootstock.io/tx/${response.txHash}`);
            setTimeout(() => loadPoints(), 3000);
          }
        }
      } else {
        addLog(`❌ Relayer error: ${response.error}`);
      }
    } catch (error: any) {
      addLog(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const clearLogs = () => {
    setLogs([]);
    // Don't clear txHash - keep the last transaction hash visible
  };

  if (!isConnected) {
    return (
      <div className="flex items-center flex-col flex-grow pt-10">
        <div className="px-5">
          <h1 className="text-center mb-8">
            <span className="block text-4xl font-bold">Gasless Transactions</span>
          </h1>
          <p className="text-center text-lg">Please connect your wallet to continue</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-y-6 lg:gap-y-8 py-8 lg:py-12 justify-center items-center">
      <div className="w-full max-w-7xl px-6 lg:px-10">
        <div className="flex gap-1">
          <Badge type="number">2</Badge>
          <Badge>Gasless Demo</Badge>
        </div>
        <h2 className="text-4xl font-bold mt-2">Gasless Transactions Demo</h2>
        <span className="flex gap-1 items-center my-0 font-light">
          Experience meta-transactions on Rootstock Testnet
        </span>

        <div className="w-full flex gap-7 mt-12">
          <div className="flex flex-col gap-7">
            <div className="bg-secondary p-5 rounded-lg w-80 border border-border">
              <div className="">Your Points</div>
              <hr className="my-3 border-1 border-white-400 rounded-full" />
              <div className="text-4xl font-bold text-center py-4">{points.toString()}</div>
              <button
                className="bg-brand-pink rounded-md py-1.5 px-3 text-black text-sm font-medium w-full disabled:opacity-50 mt-2"
                onClick={loadPoints}
                disabled={loading}
              >
                Refresh
              </button>
            </div>

            <div className="bg-secondary p-5 rounded-lg w-80 border border-border">
              <div className="">Contract Information</div>
              <hr className="my-3 border-1 border-white-400 rounded-full" />
              <div className="flex gap-3 items-center mt-4">
                <div className="text-white-400 flex flex-col gap-2">
                  <div>Forwarder:</div>
                  <div>Target:</div>
                  <div>Network:</div>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="text-xs font-mono break-all">{FORWARDER_ADDRESS || "Not configured"}</div>
                  <div className="text-xs font-mono break-all">{EXAMPLE_TARGET_ADDRESS || "Not configured"}</div>
                  <p className="my-0">
                    <span style={{ color: networkColor }}>Rootstock Testnet</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full flex flex-col gap-7">
            <div className="bg-secondary p-4 rounded-lg w-full h-min border border-border">
              <div className="">Transaction Methods</div>
              <hr className="my-3 border-1 border-white-400 rounded-full" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
                <div className="flex flex-col gap-2">
                  <h3 className="font-semibold">Direct Call</h3>
                  <p className="text-xs opacity-70">Pay gas yourself using your wallet</p>
                  <button
                    className="bg-brand-pink rounded-md py-1.5 px-3 text-black text-sm font-medium w-full disabled:opacity-50"
                    onClick={handleDirectCall}
                    disabled={loading || !EXAMPLE_TARGET_ADDRESS}
                  >
                    {loading ? "Processing..." : "Add 10 Points (Pay Gas)"}
                  </button>
                </div>

                <div className="flex flex-col gap-2">
                  <h3 className="font-semibold">Gasless Call</h3>
                  <p className="text-xs opacity-70">Sign a message, relayer pays gas</p>
                  <button
                    className="bg-brand-pink rounded-md py-1.5 px-3 text-black text-sm font-medium w-full disabled:opacity-50"
                    onClick={handleGaslessCall}
                    disabled={loading || !EXAMPLE_TARGET_ADDRESS || !FORWARDER_ADDRESS}
                  >
                    {loading ? "Processing..." : "Add 10 Points (Gasless)"}
                  </button>
                </div>

                <div className="flex flex-col gap-2">
                  <h3 className="font-semibold">Batch Gasless Call</h3>
                  <p className="text-xs opacity-70">3 transactions in 1 on-chain tx (~35% gas savings)</p>
                  <button
                    className="bg-brand-pink rounded-md py-1.5 px-3 text-black text-sm font-medium w-full disabled:opacity-50"
                    onClick={handleBatchCall}
                    disabled={loading || !EXAMPLE_TARGET_ADDRESS || !FORWARDER_ADDRESS}
                  >
                    {loading ? "Processing..." : "Add 30 Points (Batch: 5+10+15)"}
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-secondary p-4 rounded-lg w-full h-min border border-border">
              <div className="flex justify-between items-center">
                <div className="">Transaction Log</div>
                <button
                  className="bg-brand-pink rounded-md py-1 px-2 text-black text-xs font-medium disabled:opacity-50"
                  onClick={clearLogs}
                >
                  Clear
                </button>
              </div>
              <hr className="my-3 border-1 border-white-400 rounded-full" />
              <div className="flex flex-col gap-2">
                <div className="bg-base-300 rounded p-4 font-mono text-xs max-h-96 overflow-y-auto">
                  {logs.length === 0 ? (
                    <p className="opacity-50">No activity yet...</p>
                  ) : (
                    logs.map((log, i) => (
                      <div key={i} className="mb-1">
                        {log}
                      </div>
                    ))
                  )}
                </div>
                {txHash && (
                  <div className="mt-2 p-3 bg-success/10 border border-success/20 rounded">
                    <p className="text-xs font-semibold mb-1">Latest Transaction Hash:</p>
                    <a
                      href={`https://explorer.testnet.rootstock.io/tx/${txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-500 break-all hover:underline text-xs font-mono"
                    >
                      {txHash}
                    </a>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-secondary p-4 rounded-lg w-full h-min border border-border">
              <div className="">How it works</div>
              <hr className="my-3 border-1 border-white-400 rounded-full" />
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>
                  <strong>Direct Call:</strong> Traditional transaction where you pay gas fees from your wallet
                </li>
                <li>
                  <strong>Gasless Call:</strong> You sign an EIP-712 message, relayer submits and pays gas
                </li>
                <li>Both methods call the same contract function and achieve the same result</li>
                <li>Gasless transactions use the Forwarder contract to verify signatures</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
