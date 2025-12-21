import { createPublicClient, createWalletClient, http, parseEther } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { rootstockTestnet } from "viem/chains";
import { config } from "./config";
import { forwarderAbi } from "./abi";
import { ForwardRequest } from "./types";

const publicClient = createPublicClient({
  chain: rootstockTestnet,
  transport: http(config.rpcUrl),
});

const account = privateKeyToAccount(config.relayerPrivateKey as `0x${string}`);

const walletClient = createWalletClient({
  account,
  chain: rootstockTestnet,
  transport: http(config.rpcUrl),
});

export async function verifyRequest(request: ForwardRequest, signature: string): Promise<boolean> {
  try {
    const isValid = await publicClient.readContract({
      address: config.forwarderAddress,
      abi: forwarderAbi,
      functionName: "verify",
      args: [
        {
          from: request.from as `0x${string}`,
          to: request.to as `0x${string}`,
          value: BigInt(request.value),
          gas: BigInt(request.gas),
          nonce: BigInt(request.nonce),
          data: request.data as `0x${string}`,
        },
        signature as `0x${string}`,
      ],
    });

    return isValid;
  } catch (error) {
    console.error("Verification error:", error);
    return false;
  }
}

export async function executeMetaTransaction(
  request: ForwardRequest,
  signature: string
): Promise<string> {
  const hash = await walletClient.writeContract({
    address: config.forwarderAddress,
    abi: forwarderAbi,
    functionName: "execute",
    args: [
      {
        from: request.from as `0x${string}`,
        to: request.to as `0x${string}`,
        value: BigInt(request.value),
        gas: BigInt(request.gas),
        nonce: BigInt(request.nonce),
        data: request.data as `0x${string}`,
      },
      signature as `0x${string}`,
    ],
    gas: BigInt(request.gas) + BigInt(100000),
  });

  return hash;
}

export async function getTransactionStatus(txHash: string) {
  try {
    const receipt = await publicClient.getTransactionReceipt({
      hash: txHash as `0x${string}`,
    });

    return {
      status: receipt.status === "success" ? "confirmed" : "failed",
      blockNumber: receipt.blockNumber.toString(),
    };
  } catch (error) {
    const tx = await publicClient.getTransaction({
      hash: txHash as `0x${string}`,
    });

    if (tx) {
      return {
        status: "pending",
      };
    }

    return {
      status: "not_found",
    };
  }
}

export async function getNonce(address: string): Promise<bigint> {
  const nonce = await publicClient.readContract({
    address: config.forwarderAddress,
    abi: forwarderAbi,
    functionName: "getNonce",
    args: [address as `0x${string}`],
  });

  return nonce;
}

export async function getRelayerBalance(): Promise<string> {
  const balance = await publicClient.getBalance({
    address: account.address,
  });

  return balance.toString();
}
