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

export interface StatusResponse {
  txHash: string;
  status: "pending" | "confirmed" | "failed" | "not_found";
  blockNumber?: string;
  error?: string;
}
