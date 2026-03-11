import { FORWARDER_ADDRESS, CHAIN_ID } from "./config";
import { getNonce } from "./relayerClient";
import { getEIP712Domain, EIP712_TYPES, ForwardRequest } from "./types";
import { WalletClient } from "viem";

export async function signMetaTransaction(walletClient: WalletClient, request: ForwardRequest): Promise<string> {
  const domain = getEIP712Domain(CHAIN_ID, FORWARDER_ADDRESS);

  const account = walletClient.account;
  if (!account) {
    throw new Error("No account connected");
  }

  // Fetch nonce from contract (not included in ForwardRequest struct)
  const nonce = await getNonce(request.from);

  const signature = await walletClient.signTypedData({
    account,
    domain,
    types: EIP712_TYPES,
    primaryType: "ForwardRequest",
    message: {
      from: request.from as `0x${string}`,
      to: request.to as `0x${string}`,
      value: BigInt(request.value),
      gas: BigInt(request.gas),
      nonce: nonce, // Fetched from contract, not from request
      deadline: Number(request.deadline), // OpenZeppelin uses uint48 as number
      data: request.data as `0x${string}`,
    },
  });

  return signature;
}

// For batch transactions: sign with a specific nonce (not fetched)
export async function signMetaTransactionWithNonce(
  walletClient: WalletClient,
  request: ForwardRequest,
  nonce: bigint,
): Promise<string> {
  const domain = getEIP712Domain(CHAIN_ID, FORWARDER_ADDRESS);

  const account = walletClient.account;
  if (!account) {
    throw new Error("No account connected");
  }

  const signature = await walletClient.signTypedData({
    account,
    domain,
    types: EIP712_TYPES,
    primaryType: "ForwardRequest",
    message: {
      from: request.from as `0x${string}`,
      to: request.to as `0x${string}`,
      value: BigInt(request.value),
      gas: BigInt(request.gas),
      nonce: nonce, // Use provided nonce for batch
      deadline: Number(request.deadline),
      data: request.data as `0x${string}`,
    },
  });

  return signature;
}
