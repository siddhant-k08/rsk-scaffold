# Smart Contracts

## Overview

This directory contains both the original rsk-scaffold contracts and the new gasless meta-transaction contracts.

## Contracts

### Original Scaffold

**YourContract.sol**
- Example contract from rsk-scaffold
- Demonstrates basic Solidity patterns
- Greeting system with counters

### Gasless Meta-Transaction System

**Forwarder.sol**
- EIP-712 compliant meta-transaction forwarder
- Manages user nonces
- Verifies signatures and executes calls
- Domain: RSKForwarder v0.0.1
- Chain ID: 31 (Rootstock Testnet)

**ERC2771Context.sol**
- Trusted forwarder context
- Extracts real sender from meta-transactions
- Provides _msgSender() override
- Minimal implementation for gas efficiency

**ExampleTarget.sol**
- Demo contract using ERC2771Context
- Simple points system
- Works with both direct and meta-transaction calls
- Demonstrates proper sender identification

## EIP-712 Domain

```solidity
{
  name: "RSKForwarder",
  version: "0.0.1",
  chainId: 31,
  verifyingContract: <forwarder_address>
}
```

## EIP-712 Types

```solidity
ForwardRequest {
  address from;
  address to;
  uint256 value;
  uint256 gas;
  uint256 nonce;
  bytes data;
}
```

## Usage

### Direct Call

```solidity
ExampleTarget target = ExampleTarget(targetAddress);
target.addPoints(10);
```

### Meta-Transaction Call

```javascript
// 1. Get nonce
const nonce = await forwarder.getNonce(userAddress);

// 2. Encode function call
const data = target.interface.encodeFunctionData("addPoints", [10]);

// 3. Create request
const request = {
  from: userAddress,
  to: targetAddress,
  value: 0,
  gas: 100000,
  nonce: nonce,
  data: data
};

// 4. Sign EIP-712 message
const signature = await signer.signTypedData(domain, types, request);

// 5. Execute via forwarder
await forwarder.execute(request, signature);
```

## Security Features

1. **Nonce Management**
   - Prevents replay attacks
   - Sequential nonces per user
   - Automatically incremented

2. **Signature Verification**
   - EIP-712 structured data
   - On-chain signature recovery
   - Validates signer matches request.from

3. **Gas Protection**
   - Specified gas limit enforced
   - Prevents out-of-gas attacks
   - Caller provides buffer gas

4. **Sender Identification**
   - ERC2771Context extracts real sender
   - Appended to calldata by forwarder
   - Target contract sees original user

## Testing

```bash
# Run all tests
npx hardhat test

# Run specific test
npx hardhat test test/Forwarder.test.ts

# Run with gas reporting
REPORT_GAS=true npx hardhat test
```

## Deployment

```bash
# Deploy to Rootstock Testnet
npx hardhat deploy --network rootstockTestnet

# Verify deployment
npx hardhat run scripts/printAddresses.ts --network rootstockTestnet
```

## Gas Costs

Approximate gas costs on Rootstock Testnet:

- Forwarder deployment: ~800,000 gas
- ExampleTarget deployment: ~400,000 gas
- Direct addPoints call: ~50,000 gas
- Meta-transaction addPoints: ~80,000 gas

Meta-transaction overhead: ~30,000 gas for signature verification and forwarding.

## Extending

To add meta-transaction support to your contract:

1. Inherit from ERC2771Context:

```solidity
contract MyContract is ERC2771Context {
  constructor(address trustedForwarder) 
    ERC2771Context(trustedForwarder) {}
}
```

2. Use _msgSender() instead of msg.sender:

```solidity
function myFunction() public {
  address user = _msgSender(); // Works for both direct and meta-tx
  // ...
}
```

3. Deploy with Forwarder address:

```javascript
const myContract = await MyContract.deploy(forwarderAddress);
```

## Limitations

- Value transfers not supported (gasless only)
- Single forwarder per contract
- No batching support
- Sequential nonces only

## References

- [EIP-712: Typed Structured Data](https://eips.ethereum.org/EIPS/eip-712)
- [EIP-2771: Secure Protocol for Native Meta Transactions](https://eips.ethereum.org/EIPS/eip-2771)
- [OpenZeppelin MinimalForwarder](https://docs.openzeppelin.com/contracts/4.x/api/metatx)
