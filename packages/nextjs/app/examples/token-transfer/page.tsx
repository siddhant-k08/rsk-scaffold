"use client";

import { useState } from "react";
import type { NextPage } from "next";
import { formatUnits, parseUnits } from "viem";
import { useAccount } from "wagmi";
import { Address, AddressInput } from "~~/components/scaffold-eth";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

const TokenTransfer: NextPage = () => {
  const { address: connectedAddress } = useAccount();
  const [recipientAddress, setRecipientAddress] = useState("");
  const [amount, setAmount] = useState("");

  // Read token balance
  const { data: balance } = useScaffoldReadContract({
    contractName: "ExampleToken",
    functionName: "balanceOf",
    args: [connectedAddress],
  });

  // Read token info
  const { data: tokenName } = useScaffoldReadContract({
    contractName: "ExampleToken",
    functionName: "name",
  });

  const { data: tokenSymbol } = useScaffoldReadContract({
    contractName: "ExampleToken",
    functionName: "symbol",
  });

  const { data: totalSupply } = useScaffoldReadContract({
    contractName: "ExampleToken",
    functionName: "totalSupply",
  });

  // Write contract
  const { writeContractAsync: writeExampleTokenAsync } = useScaffoldWriteContract("ExampleToken");

  const handleTransfer = async () => {
    if (!recipientAddress || !amount) {
      alert("Please enter recipient address and amount");
      return;
    }

    try {
      const amountInWei = parseUnits(amount, 18);
      await writeExampleTokenAsync({
        functionName: "transfer",
        args: [recipientAddress, amountInWei],
      });
      setAmount("");
      setRecipientAddress("");
    } catch (error) {
      console.error("Transfer failed:", error);
    }
  };

  return (
    <div className="flex items-center flex-col flex-grow pt-10">
      <div className="px-5 w-full max-w-4xl">
        <h1 className="text-center mb-8">
          <span className="block text-4xl font-bold">Token Transfer dApp</span>
          <span className="block text-2xl mt-2">
            {tokenName} ({tokenSymbol})
          </span>
        </h1>

        <div className="flex flex-col gap-6">
          {/* Token Info Card */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title">Token Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm opacity-70">Total Supply</p>
                  <p className="text-2xl font-bold">
                    {totalSupply ? formatUnits(totalSupply, 18) : "0"} {tokenSymbol}
                  </p>
                </div>
                <div>
                  <p className="text-sm opacity-70">Your Balance</p>
                  <p className="text-2xl font-bold">
                    {balance ? formatUnits(balance, 18) : "0"} {tokenSymbol}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Transfer Card */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title">Transfer Tokens</h2>

              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text">From (Your Address)</span>
                </label>
                <Address address={connectedAddress} />
              </div>

              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text">To (Recipient Address)</span>
                </label>
                <AddressInput
                  value={recipientAddress}
                  onChange={setRecipientAddress}
                  placeholder="Enter recipient address"
                />
              </div>

              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text">Amount ({tokenSymbol})</span>
                </label>
                <input
                  type="number"
                  placeholder="0.0"
                  className="input input-bordered w-full"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  step="0.000000000000000001"
                  min="0"
                />
                <label className="label">
                  <span className="label-text-alt">
                    Balance: {balance ? formatUnits(balance, 18) : "0"} {tokenSymbol}
                  </span>
                </label>
              </div>

              <div className="card-actions justify-end mt-4">
                <button
                  className="btn btn-primary"
                  onClick={handleTransfer}
                  disabled={!connectedAddress || !recipientAddress || !amount}
                >
                  Transfer
                </button>
              </div>
            </div>
          </div>

          {/* Tutorial Card */}
          <div className="card bg-base-200 shadow-xl">
            <div className="card-body">
              <h2 className="card-title">How to Use</h2>
              <ol className="list-decimal list-inside space-y-2">
                <li>Connect your wallet using the button in the header</li>
                <li>Check your token balance in the Token Information section</li>
                <li>Enter the recipient&apos;s address</li>
                <li>Enter the amount of tokens to transfer</li>
                <li>Click &quot;Transfer&quot; and confirm the transaction in your wallet</li>
              </ol>
              <div className="alert alert-info mt-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  className="stroke-current shrink-0 w-6 h-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  ></path>
                </svg>
                <span>
                  This is a fixed-supply ERC-20 token. The entire supply was minted to the deployer on contract
                  creation.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TokenTransfer;
