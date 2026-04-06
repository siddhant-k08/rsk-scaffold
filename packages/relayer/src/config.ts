import dotenv from "dotenv";

dotenv.config();

// Parse allowed target addresses from comma-separated list
function parseAllowedTargets(): string[] {
  if (process.env.ALLOWED_TARGETS) {
    // Use ALLOWED_TARGETS if provided (comma-separated list)
    return process.env.ALLOWED_TARGETS
      .split(',')
      .map(addr => addr.trim().toLowerCase())
      .filter(addr => addr.length > 0);
  } else if (process.env.EXAMPLE_TARGET_ADDRESS) {
    // Fallback to single EXAMPLE_TARGET_ADDRESS for backward compatibility
    return [process.env.EXAMPLE_TARGET_ADDRESS.toLowerCase()];
  }
  return [];
}

// Parse allowed origins from comma-separated list
function parseAllowedOrigins(): string[] {
  if (process.env.ALLOWED_ORIGINS) {
    return process.env.ALLOWED_ORIGINS
      .split(',')
      .map(origin => origin.trim())
      .filter(origin => origin.length > 0);
  }
  return [];
}

export const config = {
  port: process.env.PORT || 3001,
  relayerPrivateKey: process.env.RELAYER_PRIVATE_KEY || "",
  rpcUrl: process.env.RPC_URL || "https://public-node.testnet.rsk.co",
  forwarderAddress: (process.env.FORWARDER_ADDRESS || "") as `0x${string}`,
  
  // @deprecated Use allowedTargets instead. Kept for backward compatibility only.
  exampleTargetAddress: (process.env.EXAMPLE_TARGET_ADDRESS || "") as `0x${string}`,
  
  allowedTargets: parseAllowedTargets(),
  allowedOrigins: parseAllowedOrigins(),
  chainId: parseInt(process.env.CHAIN_ID || "31"),
};

if (!config.relayerPrivateKey) {
  console.warn("⚠️  RELAYER_PRIVATE_KEY not set in .env");
}

if (!config.forwarderAddress) {
  console.warn("⚠️  FORWARDER_ADDRESS not set in .env");
}

if (!config.exampleTargetAddress && config.allowedTargets.length === 0) {
  console.warn("⚠️  EXAMPLE_TARGET_ADDRESS or ALLOWED_TARGETS not set in .env");
}

if (config.allowedTargets.length > 0) {
  // Allowed target contracts configured
  config.allowedTargets.forEach((addr, idx) => {
    // Target contract listed
  });
} else {
  console.warn("⚠️  No target contracts configured in allowlist");
}

if (config.allowedOrigins.length > 0) {
  // Allowed CORS origins configured
  config.allowedOrigins.forEach((origin, idx) => {
    // CORS origin listed
  });
} else {
  console.warn("⚠️  No CORS origins configured - allowing all origins (development mode)");
}
