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
  publicClient,
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

// Configure CORS based on allowed origins
const corsOptions: cors.CorsOptions = {
  origin: config.allowedOrigins.length > 0 ? config.allowedOrigins : true,
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10kb' }));

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

    // Relay request received

    // Check daily budget
    if (!checkDailyBudget()) {
      // Daily budget check failed - returning 503
      return res.status(503).json({
        success: false,
        error: "Service temporarily unavailable: Daily gas budget exceeded",
      } as RelayResponse);
    }

    const validation = validateRelayRequest(request, signature);
    if (!validation.valid) {
      // Request validation failed
      return res.status(400).json({
        success: false,
        error: sanitizeValidationError(validation.error || "Invalid request"),
      } as RelayResponse);
    }

    // Verify signature and nonce before execution to prevent gas drain
    const isValidSignature = await verifyRequest(request, signature);
    if (!isValidSignature) {
      // Signature verification failed
      return res.status(400).json({
        success: false,
        error: "Invalid signature or nonce",
      } as RelayResponse);
    }

    // Validation passed, executing meta-transaction

    let txHash: string;
    try {
      txHash = await executeMetaTransaction(request, signature);
      // Meta-transaction submitted successfully
    } catch (execError: any) {
      console.error("❌ Execution failed:", execError.message);
      console.error("Full error:", execError);
      const sanitized = sanitizeError(execError, "relay");
      return res.status(400).json({
        success: false,
        error: sanitized.message,
      } as RelayResponse);
    }

    // Wait for transaction receipt to get actual gas consumption
    const receipt = await publicClient.waitForTransactionReceipt({
      hash: txHash as `0x${string}`,
    });
    
    // Track actual gas spent using receipt data
    trackGasSpent(receipt.gasUsed, receipt.effectiveGasPrice);

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
  addressRateLimiter,
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

      // Batch relay request received

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

      // Check daily budget before expensive signature verification RPC calls
      if (!checkDailyBudget()) {
        return res.status(503).json({
          success: false,
          error: "Service temporarily unavailable: Daily gas budget exceeded",
        } as BatchRelayResponse);
      }

      // Verify all signatures before execution to prevent gas drain
      const signatureVerificationErrors: string[] = [];
      for (let i = 0; i < batchRequest.requests.length; i++) {
        const { request, signature } = batchRequest.requests[i];
        const isValidSignature = await verifyRequest(request, signature);
        if (!isValidSignature) {
          signatureVerificationErrors.push(`Request ${i}: Invalid signature or nonce`);
        }
      }

      if (signatureVerificationErrors.length > 0) {
        return res.status(400).json({
          success: false,
          error: `Signature verification failed: ${signatureVerificationErrors.join("; ")}`,
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

      // Batch executed successfully

      // Wait for transaction receipt to get actual gas consumption
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: txHash as `0x${string}`,
      });
      
      // Track actual gas spent using receipt data
      trackGasSpent(receipt.gasUsed, receipt.effectiveGasPrice);

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

    // Status check requested

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
  // Relayer started successfully
});
