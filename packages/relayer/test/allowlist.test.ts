import { expect } from "chai";
import { config } from "../src/config";
import { validateRelayRequest } from "../src/validator";
import { ForwardRequest } from "../src/types";

// Mock environment variables for testing
const originalEnv = process.env;

describe("Target Allowlist Configuration", function () {
  beforeEach(function () {
    // Reset environment variables before each test
    process.env = { ...originalEnv };
    delete process.env.EXAMPLE_TARGET_ADDRESS;
    delete process.env.ALLOWED_TARGETS;
  });

  afterEach(function () {
    // Restore original environment
    process.env = originalEnv;
  });

  it("should parse single target from EXAMPLE_TARGET_ADDRESS", function () {
    process.env.EXAMPLE_TARGET_ADDRESS = "0x1234567890123456789012345678901234567890";
    
    // Test the parsing function directly
    const allowedTargets = config.allowedTargets;
    
    expect(allowedTargets).to.have.length(1);
    expect(allowedTargets[0]).to.equal("0x1234567890123456789012345678901234567890");
  });

  it("should parse multiple targets from ALLOWED_TARGETS", function () {
    process.env.ALLOWED_TARGETS = "0x1111111111111111111111111111111111111111,0x2222222222222222222222222222222222222222,0x3333333333333333333333333333333333333333";
    
    const allowedTargets = config.allowedTargets;
    
    expect(allowedTargets).to.have.length(3);
    expect(allowedTargets).to.include("0x1111111111111111111111111111111111111111");
    expect(allowedTargets).to.include("0x2222222222222222222222222222222222222222");
    expect(allowedTargets).to.include("0x3333333333333333333333333333333333333333");
  });

  it("should prioritize ALLOWED_TARGETS over EXAMPLE_TARGET_ADDRESS", function () {
    process.env.EXAMPLE_TARGET_ADDRESS = "0x9999999999999999999999999999999999999999";
    process.env.ALLOWED_TARGETS = "0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA,0xBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB";
    
    const allowedTargets = config.allowedTargets;
    
    expect(allowedTargets).to.have.length(2);
    expect(allowedTargets).to.not.include("0x9999999999999999999999999999999999999999");
    expect(allowedTargets).to.include("0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
    expect(allowedTargets).to.include("0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb");
  });

  it("should handle whitespace correctly", function () {
    process.env.ALLOWED_TARGETS = " 0x1111111111111111111111111111111111111111 , 0x2222222222222222222222222222222222222222 ";
    
    const allowedTargets = config.allowedTargets;
    
    expect(allowedTargets).to.have.length(2);
    expect(allowedTargets[0]).to.equal("0x1111111111111111111111111111111111111111");
    expect(allowedTargets[1]).to.equal("0x2222222222222222222222222222222222222222");
  });

  it("should convert addresses to lowercase", function () {
    process.env.ALLOWED_TARGETS = "0xABCDEF1234567890ABCDEF1234567890ABCDEF12";
    
    const allowedTargets = config.allowedTargets;
    
    expect(allowedTargets).to.have.length(1);
    expect(allowedTargets[0]).to.equal("0xabcdef1234567890abcdef1234567890abcdef12");
  });

  it("should filter empty entries", function () {
    process.env.ALLOWED_TARGETS = "0x1111111111111111111111111111111111111111,,0x2222222222222222222222222222222222222222,  ,";
    
    const allowedTargets = config.allowedTargets;
    
    expect(allowedTargets).to.have.length(2);
    expect(allowedTargets).to.include("0x1111111111111111111111111111111111111111");
    expect(allowedTargets).to.include("0x2222222222222222222222222222222222222222");
  });

  it("should return empty array when no targets configured", function () {
    const allowedTargets = config.allowedTargets;
    
    expect(allowedTargets).to.have.length(0);
  });
});

describe("Target Allowlist Validation", function () {
  beforeEach(function () {
    // Reset environment variables before each test
    process.env = { ...originalEnv };
    delete process.env.EXAMPLE_TARGET_ADDRESS;
    delete process.env.ALLOWED_TARGETS;
  });

  afterEach(function () {
    // Restore original environment
    process.env = originalEnv;
  });

  const createTestRequest = (to: string): ForwardRequest => ({
    from: "0x1234567890123456789012345678901234567890",
    to,
    value: "0",
    gas: "100000",
    deadline: (Math.floor(Date.now() / 1000) + 3600).toString(),
    data: "0x1234",
  });

  const testSignature = "0x" + "a".repeat(130);

  it("should accept requests to allowed targets", function () {
    process.env.ALLOWED_TARGETS = "0x1111111111111111111111111111111111111111,0x2222222222222222222222222222222222222222";
    
    const request = createTestRequest("0x1111111111111111111111111111111111111111");
    const result = validateRelayRequest(request, testSignature);
    
    expect(result.valid).to.be.true;
  });

  it("should reject requests to non-allowed targets", function () {
    process.env.ALLOWED_TARGETS = "0x1111111111111111111111111111111111111111,0x2222222222222222222222222222222222222222";
    
    const request = createTestRequest("0x9999999999999999999999999999999999999999");
    const result = validateRelayRequest(request, testSignature);
    
    expect(result.valid).to.be.false;
    expect(result.error).to.equal("Target contract not allowed");
  });

  it("should perform case-insensitive matching", function () {
    process.env.ALLOWED_TARGETS = "0xabcdef1234567890abcdef1234567890abcdef12";
    
    const request = createTestRequest("0xABCDEF1234567890ABCDEF1234567890ABCDEF12"); // Uppercase
    const result = validateRelayRequest(request, testSignature);
    
    expect(result.valid).to.be.true;
  });

  it("should accept requests when no targets are configured (backward compatibility)", function () {
    // No ALLOWED_TARGETS or EXAMPLE_TARGET_ADDRESS set
    
    const request = createTestRequest("0x9999999999999999999999999999999999999999");
    const result = validateRelayRequest(request, testSignature);
    
    expect(result.valid).to.be.true;
  });
});
