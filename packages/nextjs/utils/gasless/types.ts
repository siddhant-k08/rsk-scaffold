export interface ForwardRequest {
  from: string;
  to: string;
  value: string;
  gas: string;
  nonce: string;
  data: string;
}

export interface RelayRequest {
  request: ForwardRequest;
  signature: string;
}

export interface RelayResponse {
  success: boolean;
  txHash?: string;
  error?: string;
}

export const EIP712_DOMAIN = {
  name: "RSKForwarder",
  version: "0.0.1",
  chainId: 31,
  verifyingContract: "" as `0x${string}`,
};

export const EIP712_TYPES = {
  ForwardRequest: [
    { name: "from", type: "address" },
    { name: "to", type: "address" },
    { name: "value", type: "uint256" },
    { name: "gas", type: "uint256" },
    { name: "nonce", type: "uint256" },
    { name: "data", type: "bytes" },
  ],
};
