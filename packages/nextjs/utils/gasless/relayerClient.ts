import { RELAYER_URL } from "./config";
import { RelayRequest, RelayResponse } from "./types";

export async function relayTransaction(relayRequest: RelayRequest): Promise<RelayResponse> {
  const response = await fetch(`${RELAYER_URL}/relay`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(relayRequest),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to relay transaction");
  }

  return response.json();
}

export async function getTransactionStatus(txHash: string) {
  const response = await fetch(`${RELAYER_URL}/status/${txHash}`);

  if (!response.ok) {
    throw new Error("Failed to get transaction status");
  }

  return response.json();
}

export async function getNonce(address: string): Promise<bigint> {
  const response = await fetch(`${RELAYER_URL}/nonce/${address}`);

  if (!response.ok) {
    throw new Error("Failed to get nonce");
  }

  const data = await response.json();
  return BigInt(data.nonce);
}
