import { ForwardRequest } from "./types";
import { config } from "./config";

const MAX_GAS = 1000000n;
const MIN_GAS = 21000n;

export function validateRelayRequest(request: ForwardRequest, signature: string): {
  valid: boolean;
  error?: string;
} {
  if (!request.from || !isValidAddress(request.from)) {
    return { valid: false, error: "Invalid 'from' address" };
  }

  if (!request.to || !isValidAddress(request.to)) {
    return { valid: false, error: "Invalid 'to' address" };
  }

  if (request.to.toLowerCase() !== config.exampleTargetAddress.toLowerCase()) {
    return { valid: false, error: "Target contract not allowed" };
  }

  if (!request.data || !request.data.startsWith("0x")) {
    return { valid: false, error: "Invalid data field" };
  }

  if (!signature || !signature.startsWith("0x") || signature.length !== 132) {
    return { valid: false, error: "Invalid signature format" };
  }

  try {
    const gas = BigInt(request.gas);
    if (gas < MIN_GAS || gas > MAX_GAS) {
      return { valid: false, error: `Gas must be between ${MIN_GAS} and ${MAX_GAS}` };
    }
  } catch {
    return { valid: false, error: "Invalid gas value" };
  }

  try {
    const value = BigInt(request.value);
    if (value !== 0n) {
      return { valid: false, error: "Value must be 0 for gasless transactions" };
    }
  } catch {
    return { valid: false, error: "Invalid value field" };
  }

  try {
    BigInt(request.nonce);
  } catch {
    return { valid: false, error: "Invalid nonce value" };
  }

  return { valid: true };
}

function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}
