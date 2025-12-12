# Environment Variables Configuration Guide

This guide explains all environment variables required to run the RSK Scaffold and the example mini dApps.

## Overview

The project uses environment variables in two locations:
1. **Hardhat** (`packages/hardhat/.env`) - For smart contract deployment
2. **NextJS** (`packages/nextjs/.env.local`) - For frontend configuration

## Quick Setup

### Step 1: Copy Example Files

```bash
# Copy Hardhat environment template
cp packages/hardhat/.env.example packages/hardhat/.env

# Copy NextJS environment template
cp packages/nextjs/.env.example packages/nextjs/.env.local
```

### Step 2: Fill in Required Values

Edit the files and add your values as described below.

---

## Hardhat Environment Variables

**File**: `packages/hardhat/.env`

### Required Variables

#### `DEPLOYER_PRIVATE_KEY`

**Purpose**: Private key of the account that will deploy smart contracts.

**Format**: 64-character hexadecimal string (without `0x` prefix)

**How to get**:
```bash
# Generate a new random account
yarn generate

# Or use an existing wallet's private key
# Export from MetaMask: Account menu → Account details → Export private key
```

**Example**:
```
DEPLOYER_PRIVATE_KEY=ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

**⚠️ Security Warning**:
- NEVER commit real private keys to version control
- Use test accounts for development
- For production, use hardware wallets or secure key management
- Add `.env` to `.gitignore` (already configured)

---

#### `ROOTSTOCK_RPC_URL`

**Purpose**: RPC endpoint URL for connecting to the Rootstock network.

**Options**:

1. **Rootstock RPC Service** (Recommended):
   - Testnet: `https://rpc.testnet.rootstock.io/YOUR_API_KEY_HERE`
   - Mainnet: `https://rpc.mainnet.rootstock.io/YOUR_API_KEY_HERE`
   - Get API key: https://rpc.rootstock.io/
   - Benefits: Higher rate limits, better reliability

2. **Public Endpoints** (Rate Limited):
   - Testnet: `https://public-node.testnet.rsk.co`
   - Mainnet: `https://public-node.rsk.co`
   - Use for testing only

**Example**:
```
ROOTSTOCK_RPC_URL=https://rpc.testnet.rootstock.io/abc123def456
```

---

### Optional Variables

#### `FORKING_URL`

**Purpose**: URL for forking a network in local development.

**When to use**: Advanced testing scenarios where you want to fork mainnet state.

**Example**:
```
FORKING_URL=https://rpc.mainnet.rootstock.io/YOUR_API_KEY
```

---

#### `MAINNET_FORKING_ENABLED`

**Purpose**: Enable/disable mainnet forking.

**Default**: `false`

**Example**:
```
MAINNET_FORKING_ENABLED=true
```

---

## NextJS Environment Variables

**File**: `packages/nextjs/.env.local`

### Required Variables

#### `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID`

**Purpose**: Project ID for WalletConnect integration (used by RainbowKit).

**How to get**:
1. Go to https://cloud.walletconnect.com
2. Sign up or log in
3. Create a new project
4. Copy the Project ID

**Example**:
```
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

**Note**: A default project ID is provided in `scaffold.config.ts` for development, but you should get your own for production.

---

#### `NEXT_PUBLIC_ROOTSTOCK_RPC_URL`

**Purpose**: RPC endpoint for frontend to interact with the blockchain.

**Important**: Must be prefixed with `NEXT_PUBLIC_` to be accessible in the browser.

**Value**: Same as `ROOTSTOCK_RPC_URL` in Hardhat config.

**Example**:
```
NEXT_PUBLIC_ROOTSTOCK_RPC_URL=https://rpc.testnet.rootstock.io/abc123def456
```

---

### Optional Variables

#### `NEXT_PUBLIC_ALCHEMY_API_KEY`

**Purpose**: Alchemy API key for additional blockchain data services.

**When to use**: If you want to use Alchemy's enhanced APIs.

**How to get**: https://dashboard.alchemyapi.io

**Example**:
```
NEXT_PUBLIC_ALCHEMY_API_KEY=your_alchemy_api_key_here
```

---

## Complete Configuration Examples

### Local Development (Hardhat Network)

**`packages/hardhat/.env`**:
```bash
# Use any test private key
DEPLOYER_PRIVATE_KEY=ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

# Not needed for localhost
ROOTSTOCK_RPC_URL=

FORKING_URL=
MAINNET_FORKING_ENABLED=false
```

**`packages/nextjs/.env.local`**:
```bash
# Optional for local development (default provided)
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=

# Not needed for localhost
NEXT_PUBLIC_ROOTSTOCK_RPC_URL=
```

---

### Rootstock Testnet Deployment

**`packages/hardhat/.env`**:
```bash
# Your testnet deployer account
DEPLOYER_PRIVATE_KEY=your_private_key_here

# Rootstock Testnet RPC
ROOTSTOCK_RPC_URL=https://rpc.testnet.rootstock.io/your_api_key_here

FORKING_URL=
MAINNET_FORKING_ENABLED=false
```

**`packages/nextjs/.env.local`**:
```bash
# Your WalletConnect project ID
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_project_id_here

# Same RPC as Hardhat
NEXT_PUBLIC_ROOTSTOCK_RPC_URL=https://rpc.testnet.rootstock.io/your_api_key_here
```

---

### Rootstock Mainnet Deployment

**`packages/hardhat/.env`**:
```bash
# SECURE mainnet deployer account (use hardware wallet recommended)
DEPLOYER_PRIVATE_KEY=your_secure_private_key_here

# Rootstock Mainnet RPC
ROOTSTOCK_RPC_URL=https://rpc.mainnet.rootstock.io/your_api_key_here

FORKING_URL=
MAINNET_FORKING_ENABLED=false
```

**`packages/nextjs/.env.local`**:
```bash
# Your WalletConnect project ID
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_project_id_here

# Mainnet RPC
NEXT_PUBLIC_ROOTSTOCK_RPC_URL=https://rpc.mainnet.rootstock.io/your_api_key_here
```

---

## Verification Checklist

Before deploying, verify:

- [ ] `.env` files are created (not `.env.example`)
- [ ] All REQUIRED variables have values
- [ ] Private keys are test keys (for development) or secure keys (for production)
- [ ] RPC URLs are correct for your target network
- [ ] `.env` files are in `.gitignore` (already configured)
- [ ] WalletConnect Project ID is valid
- [ ] Both Hardhat and NextJS have matching RPC URLs

---

## Troubleshooting

### "Missing API-KEY" Error

**Problem**: Deployment fails with API key error.

**Solution**: 
- Check that `ROOTSTOCK_RPC_URL` is set correctly
- Verify your API key is valid
- Try using the public endpoint temporarily

---

### "Private key too short" Error

**Problem**: Hardhat can't read the private key.

**Solution**:
- Ensure private key is 64 characters (without `0x` prefix)
- Generate a new key with `yarn generate`
- Check for extra spaces or newlines in `.env` file

---

### "Cannot find module '~~/contracts/deployedContracts'"

**Problem**: Frontend can't find deployed contract data.

**Solution**:
- Run `yarn deploy` to deploy contracts first
- Run `yarn hardhat deploy --tags generateTsAbis` to regenerate types
- Ensure contracts are deployed to the network configured in `scaffold.config.ts`

---

### Wallet Connection Issues

**Problem**: Can't connect wallet in frontend.

**Solution**:
- Verify `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID` is set
- Check that you're on the correct network (Rootstock Testnet/Mainnet)
- Ensure RPC URL is accessible from the browser

---

## Security Best Practices

1. **Never commit `.env` files** - They contain sensitive data
2. **Use different keys for different environments** - Dev, staging, production
3. **Rotate keys regularly** - Especially for production
4. **Use hardware wallets for production** - Ledger, Trezor, etc.
5. **Limit deployer account funds** - Only keep what's needed for gas
6. **Monitor deployer account activity** - Set up alerts for unexpected transactions
7. **Use environment-specific API keys** - Different keys for dev/prod
8. **Restrict API key permissions** - Only enable what's needed

---

## Additional Resources

- [Rootstock RPC Documentation](https://dev.rootstock.io/rsk/node/configure/)
- [WalletConnect Cloud](https://cloud.walletconnect.com)
- [Hardhat Environment Variables](https://hardhat.org/hardhat-runner/docs/guides/configuration-variables)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [dotenv Documentation](https://github.com/motdotla/dotenv)

---

## Support

If you encounter issues with environment configuration:

1. Check this documentation
2. Review the `.env.example` files for reference
3. Verify your API keys are valid
4. Check network connectivity
5. Open an issue on GitHub with details

---

**Last Updated**: December 2024
