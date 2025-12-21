import { FORWARDER_ADDRESS } from "./config";
import { EIP712_DOMAIN, EIP712_TYPES, ForwardRequest } from "./types";
import { WalletClient } from "viem";

export async function signMetaTransaction(walletClient: WalletClient, request: ForwardRequest): Promise<string> {
  const domain = {
    ...EIP712_DOMAIN,
    verifyingContract: FORWARDER_ADDRESS,
  };

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
      nonce: BigInt(request.nonce),
      data: request.data as `0x${string}`,
    },
  });

  return signature;
}
