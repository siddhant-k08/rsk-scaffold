"use client";

import { useState } from "react";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { Address, AddressInput } from "~~/components/scaffold-eth";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

const NFTMint: NextPage = () => {
  const { address: connectedAddress } = useAccount();
  const [mintToAddress, setMintToAddress] = useState("");
  const [viewAddress, setViewAddress] = useState("");

  // Read NFT info
  const { data: nftName } = useScaffoldReadContract({
    contractName: "SimpleNFT",
    functionName: "name",
  });

  const { data: nftSymbol } = useScaffoldReadContract({
    contractName: "SimpleNFT",
    functionName: "symbol",
  });

  const { data: totalSupply } = useScaffoldReadContract({
    contractName: "SimpleNFT",
    functionName: "totalSupply",
  });

  const { data: nextId } = useScaffoldReadContract({
    contractName: "SimpleNFT",
    functionName: "nextId",
  });

  // Read balance of specific address
  const { data: balanceOf } = useScaffoldReadContract({
    contractName: "SimpleNFT",
    functionName: "balanceOf",
    args: [viewAddress || connectedAddress],
  });

  // Write contract
  const { writeContractAsync: writeSimpleNFTAsync } = useScaffoldWriteContract("SimpleNFT");

  const handleMint = async () => {
    const targetAddress = mintToAddress || connectedAddress;
    if (!targetAddress) {
      alert("Please connect wallet or enter an address");
      return;
    }

    try {
      await writeSimpleNFTAsync({
        functionName: "mint",
        args: [targetAddress],
      });
      setMintToAddress("");
    } catch (error) {
      console.error("Minting failed:", error);
    }
  };

  return (
    <div className="flex items-center flex-col flex-grow pt-10">
      <div className="px-5 w-full max-w-4xl">
        <h1 className="text-center mb-8">
          <span className="block text-4xl font-bold">NFT Minting dApp</span>
          <span className="block text-2xl mt-2">
            {nftName} ({nftSymbol})
          </span>
        </h1>

        <div className="flex flex-col gap-6">
          {/* NFT Collection Info Card */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title">Collection Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm opacity-70">Total Minted</p>
                  <p className="text-2xl font-bold">{totalSupply?.toString() || "0"} NFTs</p>
                </div>
                <div>
                  <p className="text-sm opacity-70">Next Token ID</p>
                  <p className="text-2xl font-bold">#{nextId?.toString() || "0"}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Mint Card */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title">Mint NFT</h2>

              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text">Mint To Address (leave empty to mint to yourself)</span>
                </label>
                <AddressInput
                  value={mintToAddress}
                  onChange={setMintToAddress}
                  placeholder={connectedAddress || "Enter address or connect wallet"}
                />
              </div>

              <div className="card-actions justify-end mt-4">
                <button className="btn btn-primary" onClick={handleMint} disabled={!connectedAddress}>
                  Mint NFT
                </button>
              </div>

              {connectedAddress && (
                <div className="alert alert-success mt-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="stroke-current shrink-0 h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>
                    Minting to:{" "}
                    {mintToAddress || connectedAddress?.substring(0, 6) + "..." + connectedAddress?.substring(38)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* View NFTs Card */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title">View NFT Balance</h2>

              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text">Address to Check (leave empty to check your balance)</span>
                </label>
                <AddressInput
                  value={viewAddress}
                  onChange={setViewAddress}
                  placeholder={connectedAddress || "Enter address"}
                />
              </div>

              <div className="mt-4">
                <p className="text-sm opacity-70">NFT Balance</p>
                <p className="text-3xl font-bold">{balanceOf?.toString() || "0"} NFTs</p>
                <p className="text-sm mt-2">
                  Address: <Address address={viewAddress || connectedAddress} />
                </p>
              </div>
            </div>
          </div>

          {/* Tutorial Card */}
          <div className="card bg-base-200 shadow-xl">
            <div className="card-body">
              <h2 className="card-title">How to Use</h2>
              <ol className="list-decimal list-inside space-y-2">
                <li>Connect your wallet using the button in the header</li>
                <li>To mint to yourself: Leave the address field empty and click &quot;Mint NFT&quot;</li>
                <li>To mint to another address: Enter the recipient address and click &quot;Mint NFT&quot;</li>
                <li>View NFT balances by entering an address in the &quot;View NFT Balance&quot; section</li>
                <li>Each minted NFT gets a unique, auto-incrementing token ID</li>
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
                  This is a simple ERC-721 NFT contract. Anyone can mint NFTs with auto-incrementing token IDs.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NFTMint;
