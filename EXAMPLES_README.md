# Mini dApp Examples

This repository includes three complete educational mini dApps demonstrating common blockchain development patterns on Rootstock.

## 📚 Examples Overview

### 1. Token Transfer dApp 💰
A complete ERC-20 token implementation with transfer functionality.

**Location**: `/examples/token-transfer`

**Features**:
- Fixed-supply ERC-20 token (1,000,000 EXT)
- Transfer tokens from sender to any recipient
- Human-friendly amount input (automatically converts to wei)
- Real-time balance display
- Full test coverage

**Learn**:
- ERC-20 token standard
- Token transfers and balances
- Working with decimals and wei conversion
- Using OpenZeppelin contracts

**Tutorial**: [docs/TOKEN_TRANSFER_TUTORIAL.md](./docs/TOKEN_TRANSFER_TUTORIAL.md)

---

### 2. NFT Minting dApp 🖼️
A simple ERC-721 NFT collection with minting capabilities.

**Location**: `/examples/nft-mint`

**Features**:
- ERC-721 NFT with auto-incrementing token IDs
- Mint NFTs to any address
- View NFT balances
- Track total supply
- Full test coverage

**Learn**:
- ERC-721 NFT standard
- NFT minting and ownership
- Difference between fungible and non-fungible tokens
- Safe minting patterns

**Tutorial**: [docs/NFT_MINT_TUTORIAL.md](./docs/NFT_MINT_TUTORIAL.md)

---

### 3. DAO Voting dApp 🗳️
A minimal decentralized governance system.

**Location**: `/examples/dao-vote`

**Features**:
- Owner-managed voting power assignment
- Create and vote on proposals
- Weighted voting system
- Proposal execution when passed
- Prevent double voting
- Full test coverage

**Learn**:
- DAO governance patterns
- Voting mechanisms
- Proposal lifecycle
- Decentralized decision-making

**Tutorial**: [docs/DAO_VOTE_TUTORIAL.md](./docs/DAO_VOTE_TUTORIAL.md)

---

## 🚀 Quick Start

### 1. Configure Environment Variables

Before deploying, you need to set up environment variables for both Hardhat and NextJS.

#### Hardhat Environment Variables

Copy the example file and fill in the required values:

```bash
cp packages/hardhat/.env.example packages/hardhat/.env
```

Edit `packages/hardhat/.env` and set:

- **`DEPLOYER_PRIVATE_KEY`** (REQUIRED): Private key for deploying contracts
  - For local development: Use a test private key
  - Generate one with: `yarn generate`
  - ⚠️ **NEVER commit real private keys to version control**

- **`ROOTSTOCK_RPC_URL`** (REQUIRED): RPC endpoint for Rootstock network
  - Testnet: `https://rpc.testnet.rootstock.io/YOUR_API_KEY_HERE`
  - Mainnet: `https://rpc.mainnet.rootstock.io/YOUR_API_KEY_HERE`
  - Get API key from: https://rpc.rootstock.io/
  - Or use public endpoint: `https://public-node.testnet.rsk.co` (rate limited)

#### NextJS Environment Variables

Copy the example file and fill in the required values:

```bash
cp packages/nextjs/.env.example packages/nextjs/.env.local
```

Edit `packages/nextjs/.env.local` and set:

- **`NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID`** (REQUIRED): For wallet connections
  - Get your project ID from: https://cloud.walletconnect.com
  - Default provided in `scaffold.config.ts` for development

- **`NEXT_PUBLIC_ROOTSTOCK_RPC_URL`** (REQUIRED): RPC endpoint for frontend
  - Same as Hardhat RPC URL
  - Must be prefixed with `NEXT_PUBLIC_` to be accessible in the browser

### 2. Install Dependencies

```bash
yarn install
```

### 3. Start Local Blockchain (Optional)

For local development:

```bash
yarn chain
```

Or skip this step to deploy directly to Rootstock Testnet.

### 4. Deploy Contracts

In a new terminal:

```bash
# Deploy all example contracts to localhost
yarn deploy --tags examples

# Or deploy to Rootstock Testnet
yarn deploy --tags examples --network rootstockTestnet

# Or deploy individually
yarn deploy --tags ExampleToken
yarn deploy --tags SimpleNFT
yarn deploy --tags SimpleDAO
```

### 5. Start Frontend

```bash
yarn start
```

### 6. Access Examples

Navigate to:
- **Examples Index**: http://localhost:3000/examples
- **Token Transfer**: http://localhost:3000/examples/token-transfer
- **NFT Minting**: http://localhost:3000/examples/nft-mint
- **DAO Voting**: http://localhost:3000/examples/dao-vote

---

## 🧪 Testing

### Run All Example Tests

```bash
yarn hardhat test test/examples/*.ts --network hardhat
```

### Run Individual Tests

```bash
yarn hardhat test test/examples/ExampleToken.ts --network hardhat
yarn hardhat test test/examples/SimpleNFT.ts --network hardhat
yarn hardhat test test/examples/SimpleDAO.ts --network hardhat
```

### Test Coverage

All examples include comprehensive test suites covering:
- ✅ Deployment and initialization
- ✅ Core functionality
- ✅ Access control
- ✅ Error handling
- ✅ Event emission
- ✅ Edge cases

---

## 📁 Project Structure

```
packages/
├── hardhat/
│   ├── contracts/
│   │   └── examples/
│   │       ├── ExampleToken.sol      # ERC-20 token contract
│   │       ├── SimpleNFT.sol         # ERC-721 NFT contract
│   │       ├── SimpleDAO.sol         # DAO governance contract
│   │       └── README.md             # Contract documentation
│   ├── deploy/
│   │   ├── 01_deploy_example_token.ts
│   │   ├── 02_deploy_simple_nft.ts
│   │   └── 03_deploy_simple_dao.ts
│   └── test/
│       └── examples/
│           ├── ExampleToken.ts       # Token tests
│           ├── SimpleNFT.ts          # NFT tests
│           └── SimpleDAO.ts          # DAO tests
└── nextjs/
    └── app/
        └── examples/
            ├── page.tsx              # Examples index
            ├── token-transfer/
            │   └── page.tsx          # Token transfer UI
            ├── nft-mint/
            │   └── page.tsx          # NFT minting UI
            └── dao-vote/
                └── page.tsx          # DAO voting UI
```

---

## 🛠️ Technology Stack

### Smart Contracts
- **Solidity** ^0.8.19
- **OpenZeppelin Contracts** v5.0.2
- **Hardhat** for development and testing

### Frontend
- **Next.js 14** with App Router
- **React 18**
- **TypeScript**
- **Wagmi** for Ethereum interactions
- **RainbowKit** for wallet connections
- **TailwindCSS** + **DaisyUI** for styling

### Testing
- **Hardhat Chai Matchers**
- **Ethers.js v6**
- **TypeChain** for type-safe contracts

---

## 🎓 Learning Path

### Beginner
1. Start with **Token Transfer** to understand ERC-20 tokens
2. Learn about token balances, transfers, and decimals
3. Practice using the frontend to interact with contracts

### Intermediate
1. Move to **NFT Minting** to learn about non-fungible tokens
2. Understand the differences between ERC-20 and ERC-721
3. Explore token IDs and ownership

### Advanced
1. Explore **DAO Voting** to understand governance
2. Learn about voting mechanisms and proposal execution
3. Consider extending with time locks and quorum

---

## 🔧 Customization Ideas

### Token Transfer Enhancements
- Add minting and burning capabilities
- Implement token vesting schedules
- Add pausability for emergency stops
- Create a token faucet

### NFT Minting Enhancements
- Add metadata and IPFS integration
- Implement minting limits per address
- Add minting costs (paid mints)
- Implement royalties (EIP-2981)

### DAO Voting Enhancements
- Add time locks for proposals
- Implement quorum requirements
- Add treasury management
- Implement vote delegation
- Add different proposal types

---

## ⚠️ Security Considerations

**These contracts are for educational purposes only.**

Production deployments should include:
- ✅ Comprehensive security audits
- ✅ Reentrancy guards
- ✅ Access control mechanisms
- ✅ Emergency pause functionality
- ✅ Upgrade patterns
- ✅ Rate limiting
- ✅ Input validation
- ✅ Event monitoring

---

## 📖 Additional Resources

### Documentation
- [Rootstock Developer Portal](https://dev.rootstock.io)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts)
- [Solidity Documentation](https://docs.soliditylang.org)
- [Hardhat Documentation](https://hardhat.org/docs)

### Standards
- [ERC-20 Token Standard](https://eips.ethereum.org/EIPS/eip-20)
- [ERC-721 NFT Standard](https://eips.ethereum.org/EIPS/eip-721)
- [OpenZeppelin Governor](https://docs.openzeppelin.com/contracts/4.x/governance)

### Tools
- [Ethers.js Documentation](https://docs.ethers.org)
- [Wagmi Documentation](https://wagmi.sh)
- [RainbowKit Documentation](https://www.rainbowkit.com)

---

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

---

## 📝 License

MIT License - see LICENSE file for details

---

## 🆘 Troubleshooting

### Contracts won't deploy
- Ensure local blockchain is running (`yarn chain`)
- Check you have the correct network configuration
- Verify `.env` file is properly configured

### Frontend shows errors
- Ensure contracts are deployed
- Check wallet is connected
- Verify you're on the correct network

### Tests fail
- Run `yarn compile` to ensure contracts are compiled
- Check you're using the correct network (`--network hardhat`)
- Ensure dependencies are installed

### Transactions revert
- Check you have sufficient balance
- Verify function parameters are correct
- Review contract requirements (e.g., voting power for DAO)

---

## 💬 Support

For questions or issues:
1. Check the individual tutorials in `/docs`
2. Review the contract documentation in `/packages/hardhat/contracts/examples/README.md`
3. Open an issue on GitHub
4. Join the Rootstock developer community

---

**Happy Building! 🚀**
