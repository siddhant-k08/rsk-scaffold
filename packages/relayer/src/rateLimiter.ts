import rateLimit from "express-rate-limit";
import { Request, Response } from "express";

// Rate limiting configuration from environment variables
const RATE_LIMIT_PER_IP_PER_MIN = parseInt(process.env.RATE_LIMIT_PER_IP_PER_MIN || "20");
const RATE_LIMIT_PER_IP_PER_HOUR = parseInt(process.env.RATE_LIMIT_PER_IP_PER_HOUR || "100");
const RATE_LIMIT_PER_ADDRESS_PER_MIN = parseInt(process.env.RATE_LIMIT_PER_ADDRESS_PER_MIN || "10");
const RATE_LIMIT_PER_ADDRESS_PER_HOUR = parseInt(process.env.RATE_LIMIT_PER_ADDRESS_PER_HOUR || "50");
const RATE_LIMIT_GLOBAL_CONCURRENT = parseInt(process.env.RATE_LIMIT_GLOBAL_CONCURRENT || "100");
const DAILY_BUDGET_RBTC = parseFloat(process.env.DAILY_BUDGET_RBTC || "0.1");

// Track per-address request counts and timestamps
interface AddressRateLimitData {
  count: number;
  hourlyCount: number;
  lastRequest: number;
  minuteResetTime: number;
  hourlyResetTime: number;
}

const addressLimits = new Map<string, AddressRateLimitData>();

// Cleanup old entries to prevent memory leak
const CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 hour
const ENTRY_TTL = 24 * 60 * 60 * 1000; // 24 hours

function cleanupOldEntries(): void {
  const now = Date.now();
  const keysToDelete: string[] = [];
  
  for (const [address, data] of addressLimits.entries()) {
    // Remove entries that haven't been accessed for 24 hours
    if (now - data.lastRequest > ENTRY_TTL) {
      keysToDelete.push(address);
    }
  }
  
  keysToDelete.forEach(key => addressLimits.delete(key));
  
  if (keysToDelete.length > 0) {
    console.log(`🧹 Cleaned up ${keysToDelete.length} old address rate limit entries`);
  }
}

// Start cleanup interval
setInterval(cleanupOldEntries, CLEANUP_INTERVAL);

// Daily budget tracking
interface BudgetTracker {
  totalGasSpent: bigint;
  resetTime: number;
}

const dailyBudget: BudgetTracker = {
  totalGasSpent: 0n,
  resetTime: Date.now() + 24 * 60 * 60 * 1000, // 24 hours from now
};

// Maximum daily budget in wei (configurable RBTC amount)
const MAX_DAILY_BUDGET = BigInt(Math.floor(DAILY_BUDGET_RBTC * 1e18));

// Per-IP rate limiter: configurable requests per minute
export const ipRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: RATE_LIMIT_PER_IP_PER_MIN,
  message: "Too many requests from this IP, please try again later",
  standardHeaders: true,
  legacyHeaders: false,
  // Burst allowance handled by express-rate-limit internally
});

// Per-IP hourly rate limiter
export const ipHourlyRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: RATE_LIMIT_PER_IP_PER_HOUR,
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
      minuteResetTime: now + oneMinute,
      hourlyResetTime: now + oneHour,
    };
    addressLimits.set(address, data);
  }

  // Reset hourly counter if needed
  if (now >= data.hourlyResetTime) {
    data.hourlyCount = 0;
    data.hourlyResetTime = now + oneHour;
  }

  // Reset minute counter if needed
  if (now >= data.minuteResetTime) {
    data.count = 0;
    data.minuteResetTime = now + oneMinute;
  }

  // Check cooldown (1 second between requests)
  if (now - data.lastRequest < cooldown) {
    return res.status(429).json({
      success: false,
      error: "Rate limit exceeded: Please wait 1 second between requests",
    });
  }

  // Check per-minute limit (configurable)
  if (data.count >= RATE_LIMIT_PER_ADDRESS_PER_MIN) {
    return res.status(429).json({
      success: false,
      error: `Rate limit exceeded: Maximum ${RATE_LIMIT_PER_ADDRESS_PER_MIN} requests per minute per address`,
    });
  }

  // Check hourly limit (configurable)
  if (data.hourlyCount >= RATE_LIMIT_PER_ADDRESS_PER_HOUR) {
    return res.status(429).json({
      success: false,
      error: `Rate limit exceeded: Maximum ${RATE_LIMIT_PER_ADDRESS_PER_HOUR} requests per hour per address`,
    });
  }

  // Update counters
  data.count++;
  data.hourlyCount++;
  data.lastRequest = now;

  next();
}

// Global concurrent request limiter
let concurrentRequests = 0;
const MAX_CONCURRENT_REQUESTS = RATE_LIMIT_GLOBAL_CONCURRENT;

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
