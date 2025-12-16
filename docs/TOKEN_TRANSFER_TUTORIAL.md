# Token Transfer dApp Tutorial

This tutorial walks you through the Token Transfer example dApp, which demonstrates how to create and transfer ERC-20 tokens.

## Overview

The Token Transfer dApp consists of:
- **Smart Contract**: `ExampleToken.sol` - A fixed-supply ERC-20 token
- **Frontend**: Token transfer interface with balance checking
- **Tests**: Comprehensive unit tests for the token contract

## Smart Contract: ExampleToken

### Contract Details

```solidity
contract ExampleToken is ERC20 {
    constructor(uint256 initialSupply) ERC20("ExampleToken", "EXT") {
        _mint(msg.sender, initialSupply);
    }
}
```

**Key Features:**
- Inherits from OpenZeppelin's ERC20 implementation
- Fixed supply: All tokens minted to deployer on creation
- Token name: "ExampleToken"
- Token symbol: "EXT"
- Decimals: 18 (default for ERC20)

### Deployment

The contract is deployed with an initial supply of 1,000,000 tokens:

```typescript
const initialSupply = hre.ethers.parseUnits("1000000", 18);
await deploy("ExampleToken", {
  from: deployer,
  args: [initialSupply],
  log: true,
});
```

## Frontend Implementation

### Key Components

1. **Balance Display**: Shows your current token balance
2. **Transfer Form**: Send tokens to any address
3. **Amount Input**: Human-friendly input (automatically converts to wei)

### Using Scaffold Hooks

The frontend uses scaffold-eth hooks for easy contract interaction:

```typescript
// Read token balance
const { data: balance } = useScaffoldReadContract({
  contractName: "ExampleToken",
  functionName: "balanceOf",
  args: [connectedAddress],
});

// Transfer tokens
const { writeContractAsync } = useScaffoldWriteContract("ExampleToken");

await writeContractAsync({
  functionName: "transfer",
  args: [recipientAddress, amountInWei],
});
```

## Step-by-Step Usage

### 1. Deploy the Contract

Start a local blockchain:
```bash
yarn chain
```

In a new terminal, deploy the contract:
```bash
yarn deploy --tags ExampleToken
```

### 2. Start the Frontend

```bash
yarn start
```

Navigate to: `http://localhost:3000/examples/token-transfer`

### 3. Connect Your Wallet

Click "Connect Wallet" in the header and select your wallet provider.

### 4. Check Your Balance

As the deployer, you should see 1,000,000 EXT tokens in your balance.

### 5. Transfer Tokens

1. Enter a recipient address (try using another account from your wallet)
2. Enter the amount to transfer (e.g., "100")
3. Click "Transfer"
4. Confirm the transaction in your wallet

### 6. Verify the Transfer

- Check your new balance (should be reduced)
- Switch to the recipient account and check their balance

## Testing

Run the tests:
```bash
yarn hardhat test test/examples/ExampleToken.ts --network hardhat
```

### Test Coverage

The test suite covers:
- ✅ Token name and symbol
- ✅ Initial supply minted to deployer
- ✅ Total supply correctness
- ✅ Token transfers between accounts
- ✅ Insufficient balance handling
- ✅ Balance updates after transfers

## Common Operations

### Check Token Balance

```typescript
const balance = await exampleToken.balanceOf(address);
console.log(`Balance: ${ethers.formatUnits(balance, 18)} EXT`);
```

### Transfer Tokens

```typescript
const amount = ethers.parseUnits("100", 18);
await exampleToken.transfer(recipientAddress, amount);
```

### Approve and TransferFrom

```typescript
// Approve spender
const amount = ethers.parseUnits("50", 18);
await exampleToken.approve(spenderAddress, amount);

// Spender transfers tokens
await exampleToken.connect(spender).transferFrom(
  ownerAddress,
  recipientAddress,
  amount
);
```

## Understanding Wei and Decimals

ERC-20 tokens use decimals to represent fractional amounts:

- **Decimals**: 18 (standard)
- **1 EXT** = 1,000,000,000,000,000,000 wei (10^18)

**Converting amounts:**
```typescript
// Human-readable to wei
const amountInWei = ethers.parseUnits("100.5", 18);

// Wei to human-readable
const humanAmount = ethers.formatUnits(amountInWei, 18);
```

## Key Concepts

### ERC-20 Standard

The ERC-20 standard defines:
- `totalSupply()`: Total token supply
- `balanceOf(address)`: Balance of an address
- `transfer(to, amount)`: Transfer tokens
- `approve(spender, amount)`: Approve spending
- `transferFrom(from, to, amount)`: Transfer on behalf
- `allowance(owner, spender)`: Check approved amount

### Events

ERC-20 tokens emit events:
```solidity
event Transfer(address indexed from, address indexed to, uint256 value);
event Approval(address indexed owner, address indexed spender, uint256 value);
```

These events can be monitored in the frontend for real-time updates.

## Extending the Example

### Ideas for Enhancement

1. **Add Minting**: Allow owner to mint new tokens
2. **Add Burning**: Allow users to burn their tokens
3. **Add Pausing**: Implement emergency stop functionality
4. **Add Snapshots**: Track balances at specific points in time
5. **Add Voting**: Implement governance with token-weighted voting

### Example: Adding Minting

```solidity
import "@openzeppelin/contracts/access/Ownable.sol";

contract ExampleToken is ERC20, Ownable {
    constructor(uint256 initialSupply) 
        ERC20("ExampleToken", "EXT") 
        Ownable(msg.sender) 
    {
        _mint(msg.sender, initialSupply);
    }

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}
```

## Troubleshooting

### Transaction Fails

**Problem**: Transfer transaction reverts
**Solutions**:
- Check you have sufficient balance
- Ensure recipient address is valid
- Verify you're connected to the correct network

### Balance Not Updating

**Problem**: Balance doesn't update after transfer
**Solutions**:
- Wait for transaction confirmation
- Refresh the page
- Check the transaction on block explorer

### Can't Connect Wallet

**Problem**: Wallet connection fails
**Solutions**:
- Ensure wallet is installed
- Check you're on the correct network
- Try refreshing the page

## Resources

- [ERC-20 Token Standard](https://eips.ethereum.org/EIPS/eip-20)
- [OpenZeppelin ERC20](https://docs.openzeppelin.com/contracts/4.x/erc20)
- [Ethers.js Documentation](https://docs.ethers.org)
- [Rootstock Developer Portal](https://dev.rootstock.io)

## Next Steps

After mastering the Token Transfer dApp:
1. Try the NFT Minting example
2. Explore the DAO Voting example
3. Build your own token with custom features
4. Deploy to Rootstock testnet
