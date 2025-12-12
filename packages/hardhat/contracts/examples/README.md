# Example Smart Contracts

This directory contains three educational smart contract examples demonstrating common dApp patterns.

## Contracts

### 1. ExampleToken.sol
A simple fixed-supply ERC-20 token contract.

**Features:**
- Fixed supply minted to deployer on deployment
- Standard ERC-20 functionality (transfer, approve, etc.)
- 18 decimal places (standard for ERC-20)

**Use Cases:**
- Learn ERC-20 token standards
- Understand token transfers
- Practice working with token balances

### 2. SimpleNFT.sol
A simple ERC-721 NFT contract with auto-incrementing token IDs.

**Features:**
- Anyone can mint NFTs
- Auto-incrementing token IDs
- Standard ERC-721 functionality
- Ownable pattern for future extensions

**Use Cases:**
- Learn ERC-721 NFT standards
- Understand NFT minting and ownership
- Practice working with non-fungible tokens

### 3. SimpleDAO.sol
A minimal DAO (Decentralized Autonomous Organization) contract.

**Features:**
- Owner-managed voting power assignment
- Anyone can create proposals
- Weighted voting system
- Proposal execution when passed
- Vote tracking to prevent double voting

**Use Cases:**
- Learn basic governance patterns
- Understand voting mechanisms
- Practice working with DAOs

## Deployment

Deploy all example contracts:
```bash
yarn deploy --tags examples
```

Deploy individual contracts:
```bash
yarn deploy --tags ExampleToken
yarn deploy --tags SimpleNFT
yarn deploy --tags SimpleDAO
```

## Testing

Run all example tests:
```bash
yarn hardhat test test/examples/*.ts --network hardhat
```

Run individual test files:
```bash
yarn hardhat test test/examples/ExampleToken.ts --network hardhat
yarn hardhat test test/examples/SimpleNFT.ts --network hardhat
yarn hardhat test test/examples/SimpleDAO.ts --network hardhat
```

## Security Considerations

⚠️ **These contracts are for educational purposes only.**

They demonstrate basic patterns but lack production-ready features such as:
- Comprehensive access controls
- Reentrancy guards
- Time locks for governance
- Quorum requirements for voting
- Pausability
- Upgradeability

For production use, consider:
- Using audited libraries like OpenZeppelin
- Adding comprehensive security measures
- Conducting security audits
- Implementing proper testing and monitoring

## Learn More

- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts)
- [Solidity Documentation](https://docs.soliditylang.org)
- [Rootstock Developer Portal](https://dev.rootstock.io)
