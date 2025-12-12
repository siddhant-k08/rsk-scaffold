# NFT Minting dApp Tutorial

This tutorial walks you through the NFT Minting example dApp, which demonstrates how to create and mint ERC-721 NFTs.

## Overview

The NFT Minting dApp consists of:
- **Smart Contract**: `SimpleNFT.sol` - An ERC-721 NFT with auto-incrementing IDs
- **Frontend**: NFT minting interface with balance checking
- **Tests**: Comprehensive unit tests for the NFT contract

## Smart Contract: SimpleNFT

### Contract Details

```solidity
contract SimpleNFT is ERC721, Ownable {
    uint256 public nextId;

    constructor() ERC721("ExampleNFT", "ENFT") Ownable(msg.sender) {}

    function mint(address to) external returns (uint256) {
        uint256 tokenId = nextId;
        nextId++;
        _safeMint(to, tokenId);
        emit NFTMinted(to, tokenId);
        return tokenId;
    }
}
```

**Key Features:**
- Inherits from OpenZeppelin's ERC721 and Ownable
- Auto-incrementing token IDs
- Anyone can mint NFTs
- NFT name: "ExampleNFT"
- NFT symbol: "ENFT"

### Deployment

The contract is deployed with no constructor arguments:

```typescript
await deploy("SimpleNFT", {
  from: deployer,
  args: [],
  log: true,
});
```

## Frontend Implementation

### Key Components

1. **Collection Info**: Shows total minted NFTs and next token ID
2. **Mint Form**: Mint NFTs to any address
3. **Balance Checker**: View NFT balance for any address

### Using Scaffold Hooks

```typescript
// Read total supply
const { data: totalSupply } = useScaffoldReadContract({
  contractName: "SimpleNFT",
  functionName: "totalSupply",
});

// Mint NFT
const { writeContractAsync } = useScaffoldWriteContract("SimpleNFT");

await writeContractAsync({
  functionName: "mint",
  args: [recipientAddress],
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
yarn deploy --tags SimpleNFT
```

### 2. Start the Frontend

```bash
yarn start
```

Navigate to: `http://localhost:3000/examples/nft-mint`

### 3. Connect Your Wallet

Click "Connect Wallet" in the header.

### 4. Mint Your First NFT

1. Leave the address field empty to mint to yourself
2. Click "Mint NFT"
3. Confirm the transaction
4. You'll receive NFT with token ID #0

### 5. Mint to Another Address

1. Enter a recipient address
2. Click "Mint NFT"
3. The NFT will be minted to that address with the next available ID

### 6. Check NFT Balances

1. Enter an address in the "View NFT Balance" section
2. See how many NFTs that address owns

## Testing

Run the tests:
```bash
yarn hardhat test test/examples/SimpleNFT.ts --network hardhat
```

### Test Coverage

The test suite covers:
- ✅ NFT name and symbol
- ✅ Owner assignment
- ✅ Initial nextId value
- ✅ Minting with correct ID
- ✅ ID incrementing for each mint
- ✅ NFTMinted event emission
- ✅ Total supply tracking
- ✅ Public minting permissions

## Common Operations

### Mint an NFT

```typescript
const tx = await simpleNFT.mint(recipientAddress);
const receipt = await tx.wait();
// Get token ID from event
```

### Check NFT Owner

```typescript
const owner = await simpleNFT.ownerOf(tokenId);
console.log(`NFT #${tokenId} owned by: ${owner}`);
```

### Check NFT Balance

```typescript
const balance = await simpleNFT.balanceOf(address);
console.log(`Address owns ${balance} NFTs`);
```

### Transfer NFT

```typescript
await simpleNFT.transferFrom(fromAddress, toAddress, tokenId);
// or
await simpleNFT.safeTransferFrom(fromAddress, toAddress, tokenId);
```

## Understanding ERC-721

### Token IDs

Unlike ERC-20 tokens (fungible), each ERC-721 token is unique:
- Each NFT has a unique token ID
- Token IDs are sequential: 0, 1, 2, 3, ...
- You can't have fractional NFTs

### Key Differences from ERC-20

| Feature | ERC-20 | ERC-721 |
|---------|--------|---------|
| Fungibility | Fungible | Non-fungible |
| Divisibility | Divisible | Indivisible |
| Identifier | Balance | Token ID |
| Transfer | Amount | Specific token |

## Key Concepts

### ERC-721 Standard

The ERC-721 standard defines:
- `balanceOf(owner)`: Number of NFTs owned
- `ownerOf(tokenId)`: Owner of specific NFT
- `transferFrom(from, to, tokenId)`: Transfer NFT
- `safeTransferFrom(from, to, tokenId)`: Safe transfer with receiver check
- `approve(to, tokenId)`: Approve transfer of specific NFT
- `setApprovalForAll(operator, approved)`: Approve all NFTs
- `getApproved(tokenId)`: Get approved address for NFT
- `isApprovedForAll(owner, operator)`: Check operator approval

### Events

ERC-721 tokens emit events:
```solidity
event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);
event ApprovalForAll(address indexed owner, address indexed operator, bool approved);
```

### Safe Minting

The contract uses `_safeMint` which:
- Checks if recipient is a contract
- If contract, verifies it can receive NFTs
- Prevents NFTs from being locked in contracts

## Extending the Example

### Ideas for Enhancement

1. **Add Metadata**: Store token URI for each NFT
2. **Add Minting Limits**: Limit NFTs per address
3. **Add Minting Cost**: Charge for minting
4. **Add Royalties**: Implement EIP-2981 royalty standard
5. **Add Reveal Mechanism**: Hide metadata until reveal

### Example: Adding Metadata

```solidity
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract SimpleNFT is ERC721URIStorage, Ownable {
    uint256 public nextId;
    string public baseURI;

    function mint(address to, string memory tokenURI) external returns (uint256) {
        uint256 tokenId = nextId;
        nextId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, tokenURI);
        return tokenId;
    }

    function _baseURI() internal view override returns (string memory) {
        return baseURI;
    }

    function setBaseURI(string memory _newBaseURI) external onlyOwner {
        baseURI = _newBaseURI;
    }
}
```

### Example: Adding Minting Cost

```solidity
contract SimpleNFT is ERC721, Ownable {
    uint256 public nextId;
    uint256 public mintPrice = 0.01 ether;

    function mint(address to) external payable returns (uint256) {
        require(msg.value >= mintPrice, "Insufficient payment");
        
        uint256 tokenId = nextId;
        nextId++;
        _safeMint(to, tokenId);
        
        // Refund excess payment
        if (msg.value > mintPrice) {
            payable(msg.sender).transfer(msg.value - mintPrice);
        }
        
        return tokenId;
    }

    function withdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
}
```

## NFT Metadata

### What is Metadata?

NFT metadata describes the NFT's properties:
```json
{
  "name": "Example NFT #1",
  "description": "This is an example NFT",
  "image": "ipfs://QmX...",
  "attributes": [
    {
      "trait_type": "Background",
      "value": "Blue"
    },
    {
      "trait_type": "Rarity",
      "value": "Common"
    }
  ]
}
```

### Storing Metadata

Common approaches:
1. **IPFS**: Decentralized storage (recommended)
2. **Arweave**: Permanent storage
3. **Centralized server**: Simple but not decentralized

## Troubleshooting

### Minting Fails

**Problem**: Mint transaction reverts
**Solutions**:
- Ensure wallet is connected
- Check you have enough gas
- Verify recipient address is valid

### Can't See NFTs

**Problem**: NFTs don't appear in wallet
**Solutions**:
- Some wallets need manual NFT import
- Provide contract address and token ID
- Use block explorer to verify ownership

### Token ID Not Found

**Problem**: `ownerOf` reverts for token ID
**Solutions**:
- Verify the token ID exists (< nextId)
- Check if NFT was burned
- Ensure you're querying the correct contract

## Resources

- [ERC-721 Token Standard](https://eips.ethereum.org/EIPS/eip-721)
- [OpenZeppelin ERC721](https://docs.openzeppelin.com/contracts/4.x/erc721)
- [NFT Metadata Standards](https://docs.opensea.io/docs/metadata-standards)
- [IPFS Documentation](https://docs.ipfs.tech/)

## Next Steps

After mastering the NFT Minting dApp:
1. Add metadata to your NFTs
2. Create a collection with images
3. Implement minting limits or whitelist
4. Try the DAO Voting example
5. Deploy to Rootstock testnet
