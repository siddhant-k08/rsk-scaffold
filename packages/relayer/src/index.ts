import express, { Request, Response } from "express";
import cors from "cors";
import { config } from "./config";
import { RelayRequest, RelayResponse, StatusResponse } from "./types";
import { validateRelayRequest } from "./validator";
import {
  verifyRequest,
  executeMetaTransaction,
  getTransactionStatus,
  getNonce,
  getRelayerBalance,
} from "./relayer";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  res.json({
    service: "RSK Meta-Transaction Relayer",
    version: "0.0.1",
    chainId: config.chainId,
    forwarder: config.forwarderAddress,
  });
});

app.post("/relay", async (req: Request, res: Response) => {
  try {
    const { request, signature } = req.body as RelayRequest;

    console.log("📥 Relay request received from:", request.from);

    const validation = validateRelayRequest(request, signature);
    if (!validation.valid) {
      console.log("❌ Validation failed:", validation.error);
      return res.status(400).json({
        success: false,
        error: validation.error,
      } as RelayResponse);
    }

    const isValid = await verifyRequest(request, signature);
    if (!isValid) {
      console.log("❌ Signature verification failed");
      return res.status(400).json({
        success: false,
        error: "Invalid signature or nonce",
      } as RelayResponse);
    }

    console.log("✅ Signature verified, executing meta-transaction...");

    const txHash = await executeMetaTransaction(request, signature);

    console.log("✅ Meta-transaction submitted:", txHash);

    res.json({
      success: true,
      txHash,
    } as RelayResponse);
  } catch (error: any) {
    console.error("❌ Relay error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Internal server error",
    } as RelayResponse);
  }
});

app.get("/status/:txHash", async (req: Request, res: Response) => {
  try {
    const { txHash } = req.params;

    console.log("📊 Status check for:", txHash);

    const status = await getTransactionStatus(txHash);

    res.json({
      txHash,
      ...status,
    } as StatusResponse);
  } catch (error: any) {
    console.error("❌ Status check error:", error);
    res.status(500).json({
      txHash: req.params.txHash,
      status: "not_found",
      error: error.message,
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
    console.error("❌ Nonce fetch error:", error);
    res.status(500).json({
      error: error.message,
    });
  }
});

app.get("/health", async (req: Request, res: Response) => {
  try {
    const balance = await getRelayerBalance();

    res.json({
      status: "healthy",
      relayerBalance: balance,
      chainId: config.chainId,
    });
  } catch (error: any) {
    res.status(500).json({
      status: "unhealthy",
      error: error.message,
    });
  }
});

const PORT = config.port;

app.listen(PORT, () => {
  console.log("🚀 RSK Meta-Transaction Relayer");
  console.log(`📡 Listening on port ${PORT}`);
  console.log(`⛓️  Chain ID: ${config.chainId}`);
  console.log(`📝 Forwarder: ${config.forwarderAddress}`);
  console.log(`🎯 Target: ${config.exampleTargetAddress}`);
  console.log("");
});
