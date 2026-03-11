export const RELAYER_URL = process.env.NEXT_PUBLIC_RELAYER_URL || "http://localhost:3001";

export const FORWARDER_ADDRESS = (process.env.NEXT_PUBLIC_FORWARDER_ADDRESS || "") as `0x${string}`;

export const EXAMPLE_TARGET_ADDRESS = (process.env.NEXT_PUBLIC_EXAMPLE_TARGET_ADDRESS || "") as `0x${string}`;

export const CHAIN_ID = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || "31");
