import rateLimit from "express-rate-limit";
import { Request, Response } from "express";

// Track per-address request counts and timestamps
interface AddressRateLimitData {
  count: number;
  hourlyCount: number;
  lastRequest: number;
  hourlyResetTime: number;
}

const addressLimits = new Map<string, AddressRateLimitData>();

// Daily budget tracking
interface BudgetTracker {
  totalGasSpent: bigint;
  resetTime: number;
}

const dailyBudget: BudgetTracker = {
  totalGasSpent: 0n,
  resetTime: Date.now() + 24 * 60 * 60 * 1000, // 24 hours from now
};

// Maximum daily budget in wei (0.1 RBTC = 100000000000000000 wei)
const MAX_DAILY_BUDGET = BigInt("100000000000000000");

// Per-IP rate limiter: 20 requests per minute, 100 per hour
export const ipRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 requests per minute
  message: "Too many requests from this IP, please try again later",
  standardHeaders: true,
  legacyHeaders: false,
  // Burst allowance handled by express-rate-limit internally
});

// Per-IP hourly rate limiter
export const ipHourlyRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100, // 100 requests per hour
  message: "Hourly request limit exceeded, please try again later",
  standardHeaders: true,
  legacyHeaders: false,
});

// Per-address rate limiter middleware
export function addressRateLimiter(req: Request, res: Response, next: Function) {
  const { request } = req.body;

  if (!request || !request.from) {
    return next();
  }

  const address = request.from.toLowerCase();
  const now = Date.now();
  const oneMinute = 60 * 1000;
  const oneHour = 60 * 60 * 1000;
  const cooldown = 1000; // 1 second

  let data = addressLimits.get(address);

  if (!data) {
    data = {
      count: 0,
      hourlyCount: 0,
      lastRequest: 0,
      hourlyResetTime: now + oneHour,
    };
    addressLimits.set(address, data);
  }

  // Reset hourly counter if needed
  if (now >= data.hourlyResetTime) {
    data.hourlyCount = 0;
    data.hourlyResetTime = now + oneHour;
  }

  // Check cooldown (1 second between requests)
  if (now - data.lastRequest < cooldown) {
    return res.status(429).json({
      success: false,
      error: "Rate limit exceeded: Please wait 1 second between requests",
    });
  }

  // Check per-minute limit (10 requests per minute)
  if (data.count >= 10 && now - data.lastRequest < oneMinute) {
    return res.status(429).json({
      success: false,
      error: "Rate limit exceeded: Maximum 10 requests per minute per address",
    });
  }

  // Check hourly limit (50 requests per hour)
  if (data.hourlyCount >= 50) {
    return res.status(429).json({
      success: false,
      error: "Rate limit exceeded: Maximum 50 requests per hour per address",
    });
  }

  // Reset minute counter if a minute has passed
  if (now - data.lastRequest >= oneMinute) {
    data.count = 0;
  }

  // Update counters
  data.count++;
  data.hourlyCount++;
  data.lastRequest = now;

  next();
}

// Global concurrent request limiter
let concurrentRequests = 0;
const MAX_CONCURRENT_REQUESTS = 100;

export function concurrentRequestLimiter(req: Request, res: Response, next: Function) {
  if (concurrentRequests >= MAX_CONCURRENT_REQUESTS) {
    return res.status(503).json({
      success: false,
      error: "Service temporarily unavailable: Too many concurrent requests",
    });
  }

  concurrentRequests++;

  // Decrease counter when response finishes
  res.on("finish", () => {
    concurrentRequests--;
  });

  next();
}

// Daily budget checker
export function checkDailyBudget(): boolean {
  const now = Date.now();

  // Reset budget if 24 hours have passed
  if (now >= dailyBudget.resetTime) {
    dailyBudget.totalGasSpent = 0n;
    dailyBudget.resetTime = now + 24 * 60 * 60 * 1000;
  }

  return dailyBudget.totalGasSpent < MAX_DAILY_BUDGET;
}

// Track gas spent
export function trackGasSpent(gasUsed: bigint, gasPrice: bigint) {
  const gasCost = gasUsed * gasPrice;
  dailyBudget.totalGasSpent += gasCost;
}

// Get remaining budget
export function getRemainingBudget(): bigint {
  if (dailyBudget.totalGasSpent >= MAX_DAILY_BUDGET) {
    return 0n;
  }
  return MAX_DAILY_BUDGET - dailyBudget.totalGasSpent;
}
