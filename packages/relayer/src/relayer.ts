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
    // OpenZeppelin's verify expects ForwardRequestData (with signature included)
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
          deadline: Number(request.deadline), // uint48 in Solidity
          data: request.data as `0x${string}`,
          signature: signature as `0x${string}`,
        },
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
  try {
    // OpenZeppelin's execute expects ForwardRequestData (with signature included)
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
          deadline: Number(request.deadline), // uint48 in Solidity
          data: request.data as `0x${string}`,
          signature: signature as `0x${string}`,
        },
      ],
      gas: BigInt(request.gas) + BigInt(100000),
      value: BigInt(request.value), // Include value if non-zero
    });

    return hash;
  } catch (error: any) {
    console.error("❌ Execute contract call failed:");
    console.error("Error message:", error.message);
    console.error("Error details:", error.details || error.shortMessage);
    if (error.cause) {
      console.error("Cause:", error.cause);
    }
    throw error;
  }
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
  // OpenZeppelin uses 'nonces' (plural) instead of 'getNonce'
  const nonce = await publicClient.readContract({
    address: config.forwarderAddress,
    abi: forwarderAbi,
    functionName: "nonces",
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

export async function executeBatchMetaTransactions(
  requests: ForwardRequest[],
  signatures: string[],
  refundReceiver?: string,
): Promise<string> {
  if (requests.length !== signatures.length) {
    throw new Error("Requests and signatures length mismatch");
  }

  // Build ForwardRequestData array with signatures included
  const requestsData = requests.map((request, index) => ({
    from: request.from as `0x${string}`,
    to: request.to as `0x${string}`,
    value: BigInt(request.value),
    gas: BigInt(request.gas),
    deadline: Number(request.deadline),
    data: request.data as `0x${string}`,
    signature: signatures[index] as `0x${string}`,
  }));

  // Calculate total value needed
  const totalValue = requests.reduce((sum, req) => sum + BigInt(req.value), 0n);

  // Use zero address for atomic execution, or provided address for non-atomic
  const receiver = refundReceiver ? (refundReceiver as `0x${string}`) : "0x0000000000000000000000000000000000000000";

  const hash = await walletClient.writeContract({
    address: config.forwarderAddress,
    abi: forwarderAbi,
    functionName: "executeBatch",
    args: [requestsData, receiver],
    gas: requests.reduce((sum, req) => sum + BigInt(req.gas), 0n) + BigInt(200000), // Extra gas for batch overhead
    value: totalValue,
  });

  return hash;
}
