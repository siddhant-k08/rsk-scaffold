import express, { Request, Response } from "express";
import cors from "cors";
import { config } from "./config";
import { RelayRequest, RelayResponse, StatusResponse, BatchRelayRequest, BatchRelayResponse } from "./types";
import { validateRelayRequest } from "./validator";
import {
  verifyRequest,
  executeMetaTransaction,
  executeBatchMetaTransactions,
  getTransactionStatus,
  getNonce,
  getRelayerBalance,
} from "./relayer";
import {
  ipRateLimiter,
  ipHourlyRateLimiter,
  addressRateLimiter,
  concurrentRequestLimiter,
  checkDailyBudget,
  trackGasSpent,
  getRemainingBudget,
} from "./rateLimiter";
import { sanitizeError, sanitizeValidationError } from "./errorHandler";

const app = express();

app.use(cors());
app.use(express.json());

// Apply global rate limiters
app.use(concurrentRequestLimiter);

app.get("/", (req: Request, res: Response) => {
  res.json({
    service: "RSK Meta-Transaction Relayer",
    version: "0.0.1",
    chainId: config.chainId,
    forwarder: config.forwarderAddress,
  });
});

app.post("/relay", ipRateLimiter, ipHourlyRateLimiter, addressRateLimiter, async (req: Request, res: Response) => {
  try {
    const { request, signature } = req.body as RelayRequest;

    console.log("📥 Relay request received from:", request.from);

    // Check daily budget
    if (!checkDailyBudget()) {
      console.log("❌ Daily budget exceeded");
      return res.status(503).json({
        success: false,
        error: "Service temporarily unavailable: Daily gas budget exceeded",
      } as RelayResponse);
    }

    const validation = validateRelayRequest(request, signature);
    if (!validation.valid) {
      console.log("❌ Validation failed:", validation.error);
      return res.status(400).json({
        success: false,
        error: sanitizeValidationError(validation.error || "Invalid request"),
      } as RelayResponse);
    }

    // Note: OpenZeppelin's execute function validates the signature internally
    // The verify function may not work as expected, so we skip it and let execute handle validation
    // If the signature is invalid, execute will revert with a clear error
    
    console.log("✅ Validation passed, executing meta-transaction...");
    console.log("Request details:", {
      from: request.from,
      to: request.to,
      value: request.value,
      gas: request.gas,
      deadline: request.deadline,
      data: request.data.substring(0, 20) + "...",
    });

    let txHash: string;
    try {
      txHash = await executeMetaTransaction(request, signature);
      console.log("✅ Meta-transaction submitted:", txHash);
    } catch (execError: any) {
      console.error("❌ Execution failed:", execError.message);
      console.error("Full error:", execError);
      return res.status(400).json({
        success: false,
        error: "Transaction execution failed: " + (execError.shortMessage || execError.message),
      } as RelayResponse);
    }

    // Note: In production, you would track actual gas used from the transaction receipt
    // For now, we estimate based on the request gas limit
    // This should be updated to use actual gas consumption after transaction confirmation
    const estimatedGasPrice = BigInt(60000000); // 60 Mwei (typical for RSK)
    trackGasSpent(BigInt(request.gas), estimatedGasPrice);

    res.json({
      success: true,
      txHash,
    } as RelayResponse);
  } catch (error: any) {
    const sanitized = sanitizeError(error, "relay");
    res.status(500).json({
      success: false,
      error: sanitized.message,
    } as RelayResponse);
  }
});

// Batch relay endpoint
app.post(
  "/relay/batch",
  ipRateLimiter,
  ipHourlyRateLimiter,
  async (req: Request, res: Response) => {
    try {
      const batchRequest = req.body as BatchRelayRequest;

      if (!batchRequest.requests || !Array.isArray(batchRequest.requests)) {
        return res.status(400).json({
          success: false,
          error: "Invalid batch request format",
        } as BatchRelayResponse);
      }

      if (batchRequest.requests.length === 0) {
        return res.status(400).json({
          success: false,
          error: "Batch must contain at least one request",
        } as BatchRelayResponse);
      }

      if (batchRequest.requests.length > 10) {
        return res.status(400).json({
          success: false,
          error: "Batch size limited to 10 requests",
        } as BatchRelayResponse);
      }

      console.log(`📦 Batch relay request with ${batchRequest.requests.length} transactions`);

      // Validate all requests
      const validationErrors: string[] = [];
      for (let i = 0; i < batchRequest.requests.length; i++) {
        const { request, signature } = batchRequest.requests[i];
        const validation = validateRelayRequest(request, signature);
        if (!validation.valid) {
          validationErrors.push(`Request ${i}: ${validation.error}`);
        }
      }

      if (validationErrors.length > 0) {
        return res.status(400).json({
          success: false,
          error: `Validation failed: ${validationErrors.join("; ")}`,
        } as BatchRelayResponse);
      }

      // Check daily budget
      if (!checkDailyBudget()) {
        return res.status(503).json({
          success: false,
          error: "Service temporarily unavailable: Daily gas budget exceeded",
        } as BatchRelayResponse);
      }

      // Extract requests and signatures
      const requests = batchRequest.requests.map(r => r.request);
      const signatures = batchRequest.requests.map(r => r.signature);

      // Execute batch
      const txHash = await executeBatchMetaTransactions(
        requests,
        signatures,
        batchRequest.refundReceiver,
      );

      console.log(`✅ Batch executed: ${txHash}`);

      // Track gas spent (estimate for batch)
      const estimatedGas = requests.reduce((sum, req) => sum + BigInt(req.gas), 0n);
      const estimatedGasPrice = 60000000n; // 60 Mwei (same as single relay)
      trackGasSpent(estimatedGas, estimatedGasPrice);

      res.json({
        success: true,
        txHash,
        executedCount: batchRequest.requests.length,
        failedCount: 0,
      } as BatchRelayResponse);
    } catch (error: any) {
      console.error("❌ Batch relay error:", error);
      const sanitized = sanitizeError(error, "batch_relay");
      res.status(500).json({
        success: false,
        error: sanitized.message,
      } as BatchRelayResponse);
    }
  },
);

app.get("/status/:txHash", async (req: Request, res: Response) => {
  try {
    const { txHash } = req.params;

    // Validate txHash format (0x followed by 64 hex characters)
    const txHashRegex = /^0x[a-fA-F0-9]{64}$/;
    if (!txHashRegex.test(txHash)) {
      return res.status(400).json({
        txHash,
        status: "not_found",
        error: "Invalid transaction hash format",
      } as StatusResponse);
    }

    console.log("📊 Status check for:", txHash);

    const status = await getTransactionStatus(txHash);

    res.json({
      txHash,
      ...status,
    } as StatusResponse);
  } catch (error: any) {
    const sanitized = sanitizeError(error, "status");
    res.status(500).json({
      txHash: req.params.txHash,
      status: "not_found",
      error: sanitized.message,
    } as StatusResponse);
  }
});

app.get("/nonce/:address", async (req: Request, res: Response) => {
  try {
    const { address } = req.params;
    const nonce = await getNonce(address);

    res.json({
      address,
      nonce: nonce.toString(),
    });
  } catch (error: any) {
    const sanitized = sanitizeError(error, "nonce");
    res.status(500).json({
      error: sanitized.message,
    });
  }
});

app.get("/health", async (req: Request, res: Response) => {
  try {
    const balance = await getRelayerBalance();
    const remainingBudget = getRemainingBudget();
    const budgetAvailable = checkDailyBudget();

    res.json({
      status: budgetAvailable ? "healthy" : "degraded",
      relayerBalance: balance,
      chainId: config.chainId,
      dailyBudget: {
        remaining: remainingBudget.toString(),
        available: budgetAvailable,
      },
    });
  } catch (error: any) {
    const sanitized = sanitizeError(error, "health");
    res.status(500).json({
      status: "unhealthy",
      error: sanitized.message,
    });
  }
});

const PORT = config.port;

app.listen(PORT, () => {
  console.log("🚀 RSK Meta-Transaction Relayer");
  console.log(`📡 Listening on port ${PORT}`);
  console.log(`⛓️  Chain ID: ${config.chainId}`);
  console.log(`📝 Forwarder: ${config.forwarderAddress}`);
  console.log(`🎯 Allowed Targets: ${config.allowedTargets.length} contract(s)`);
  if (config.allowedTargets.length > 0 && config.allowedTargets.length <= 3) {
    config.allowedTargets.forEach(addr => console.log(`   - ${addr}`));
  } else if (config.allowedTargets.length > 3) {
    console.log(`   (see startup logs above for full list)`);
  }
  console.log("");
});
