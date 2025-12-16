# DAO Voting dApp Tutorial

This tutorial walks you through the DAO Voting example dApp, which demonstrates basic decentralized governance patterns.

## Overview

The DAO Voting dApp consists of:
- **Smart Contract**: `SimpleDAO.sol` - A minimal governance contract
- **Frontend**: Full governance interface for proposals and voting
- **Tests**: Comprehensive unit tests for the DAO contract

## Smart Contract: SimpleDAO

### Contract Details

```solidity
contract SimpleDAO {
    struct Proposal {
        string description;
        uint256 votesFor;
        uint256 votesAgainst;
        bool executed;
        uint256 createdAt;
    }

    mapping(uint256 => Proposal) public proposals;
    mapping(address => uint256) public votingPower;
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    uint256 public proposalCount;
    address public owner;
}
```

**Key Features:**
- Owner-managed voting power assignment
- Anyone can create proposals
- Weighted voting based on assigned power
- One vote per address per proposal
- Proposal execution when passed
- Event emission for all actions

### Deployment

The contract is deployed with the deployer as owner:

```typescript
await deploy("SimpleDAO", {
  from: deployer,
  args: [],
  log: true,
});
```

## Frontend Implementation

### Key Components

1. **DAO Info**: Shows owner, total proposals, and your voting power
2. **Owner Controls**: Set voting power (owner only)
3. **Create Proposal**: Submit new proposals
4. **Vote**: Cast votes on proposals
5. **View Proposal**: Check proposal details and execute

### Using Scaffold Hooks

```typescript
// Read voting power
const { data: myVotingPower } = useScaffoldReadContract({
  contractName: "SimpleDAO",
  functionName: "votingPower",
  args: [connectedAddress],
});

// Create proposal
await writeContractAsync({
  functionName: "propose",
  args: [description],
});

// Vote on proposal
await writeContractAsync({
  functionName: "vote",
  args: [proposalId, support],
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
yarn deploy --tags SimpleDAO
```

### 2. Start the Frontend

```bash
yarn start
```

Navigate to: `http://localhost:3000/examples/dao-vote`

### 3. Set Up Voting Power (Owner Only)

As the deployer (owner):
1. Enter a user address
2. Enter voting power (e.g., "100")
3. Click "Set Voting Power"
4. Repeat for multiple users

### 4. Create a Proposal

Any connected user can:
1. Enter a proposal description
2. Click "Create Proposal"
3. Note the proposal ID (starts at 0)

### 5. Vote on Proposal

Users with voting power can:
1. Enter the proposal ID
2. Select "Vote For" or "Vote Against"
3. Click "Cast Vote"
4. Each address can only vote once per proposal

### 6. View Proposal Results

1. Enter a proposal ID
2. See description, votes for/against, and status
3. If passed (votesFor > votesAgainst), click "Execute Proposal"

## Testing

Run the tests:
```bash
yarn hardhat test test/examples/SimpleDAO.ts --network hardhat
```

### Test Coverage

The test suite covers:
- ✅ Owner assignment
- ✅ Initial proposal count
- ✅ Setting voting power (owner only)
- ✅ Creating proposals
- ✅ Voting with voting power
- ✅ Vote tallying
- ✅ Preventing double voting
- ✅ Preventing voting on executed proposals
- ✅ Proposal execution
- ✅ Execution requirements (votesFor > votesAgainst)

## Common Operations

### Set Voting Power (Owner Only)

```typescript
await simpleDAO.setVotingPower(userAddress, 100);
```

### Create Proposal

```typescript
const tx = await simpleDAO.propose("Increase treasury allocation");
const receipt = await tx.wait();
// Proposal ID is proposalCount - 1
```

### Vote on Proposal

```typescript
const proposalId = 0;
const support = true; // true for "for", false for "against"
await simpleDAO.vote(proposalId, support);
```

### Check Proposal Status

```typescript
const proposal = await simpleDAO.getProposal(proposalId);
console.log("Description:", proposal.description);
console.log("Votes For:", proposal.votesFor.toString());
console.log("Votes Against:", proposal.votesAgainst.toString());
console.log("Executed:", proposal.executed);
```

### Execute Proposal

```typescript
// Only works if votesFor > votesAgainst
await simpleDAO.execute(proposalId);
```

## Understanding DAO Governance

### What is a DAO?

A DAO (Decentralized Autonomous Organization) is:
- An organization governed by smart contracts
- Decisions made through member voting
- Transparent and automated execution
- No central authority

### Governance Flow

1. **Proposal Creation**: Anyone submits ideas
2. **Voting Period**: Members vote for/against
3. **Execution**: Passed proposals are executed
4. **Transparency**: All actions on-chain

### Voting Power

In this example:
- Owner assigns voting power
- More power = more influence
- Alternative models:
  - Token-based (1 token = 1 vote)
  - NFT-based (1 NFT = 1 vote)
  - Reputation-based

## Key Concepts

### Proposal Lifecycle

```
Created → Voting → Passed/Failed → Executed (if passed)
```

### Vote Tracking

The contract prevents double voting:
```solidity
mapping(uint256 => mapping(address => bool)) public hasVoted;
```

### Execution Requirements

A proposal can be executed when:
- `votesFor > votesAgainst`
- Not already executed

### Events

The contract emits events for tracking:
```solidity
event VotingPowerSet(address indexed user, uint256 power);
event ProposalCreated(uint256 indexed proposalId, address indexed proposer, string description);
event Voted(uint256 indexed proposalId, address indexed voter, bool support, uint256 power);
event ProposalExecuted(uint256 indexed proposalId);
```

## Extending the Example

### Ideas for Enhancement

1. **Add Time Locks**: Voting periods and execution delays
2. **Add Quorum**: Minimum participation required
3. **Add Proposal Types**: Different actions for different proposals
4. **Add Delegation**: Allow vote delegation
5. **Add Treasury**: Manage DAO funds

### Example: Adding Time Locks

```solidity
struct Proposal {
    string description;
    uint256 votesFor;
    uint256 votesAgainst;
    bool executed;
    uint256 createdAt;
    uint256 votingEnds;
    uint256 executionDelay;
}

function propose(string calldata description) external returns (uint256) {
    uint256 proposalId = proposalCount;
    proposals[proposalId] = Proposal({
        description: description,
        votesFor: 0,
        votesAgainst: 0,
        executed: false,
        createdAt: block.timestamp,
        votingEnds: block.timestamp + 3 days,
        executionDelay: 2 days
    });
    proposalCount++;
    return proposalId;
}

function vote(uint256 id, bool support) external {
    Proposal storage p = proposals[id];
    require(block.timestamp < p.votingEnds, "Voting ended");
    // ... rest of voting logic
}

function execute(uint256 id) external {
    Proposal storage p = proposals[id];
    require(block.timestamp >= p.votingEnds, "Voting not ended");
    require(block.timestamp >= p.votingEnds + p.executionDelay, "Execution delay not passed");
    // ... rest of execution logic
}
```

### Example: Adding Quorum

```solidity
uint256 public quorumPercentage = 20; // 20% of total voting power

function execute(uint256 id) external {
    Proposal storage p = proposals[id];
    require(!p.executed, "Already executed");
    
    uint256 totalVotes = p.votesFor + p.votesAgainst;
    uint256 requiredQuorum = (totalVotingPower * quorumPercentage) / 100;
    
    require(totalVotes >= requiredQuorum, "Quorum not reached");
    require(p.votesFor > p.votesAgainst, "Proposal not passed");
    
    p.executed = true;
    emit ProposalExecuted(id);
}
```

### Example: Adding Treasury Management

```solidity
function propose(
    string calldata description,
    address target,
    uint256 value,
    bytes calldata data
) external returns (uint256) {
    // Store execution details with proposal
    proposals[proposalCount] = Proposal({
        description: description,
        target: target,
        value: value,
        data: data,
        votesFor: 0,
        votesAgainst: 0,
        executed: false
    });
    proposalCount++;
    return proposalCount - 1;
}

function execute(uint256 id) external {
    Proposal storage p = proposals[id];
    require(!p.executed, "Already executed");
    require(p.votesFor > p.votesAgainst, "Not passed");
    
    p.executed = true;
    
    // Execute the proposal action
    (bool success, ) = p.target.call{value: p.value}(p.data);
    require(success, "Execution failed");
    
    emit ProposalExecuted(id);
}

receive() external payable {} // Accept ETH
```

## Production Considerations

### Security

⚠️ **This is a minimal example. Production DAOs need:**

1. **Access Control**: Proper role management
2. **Time Locks**: Prevent instant execution
3. **Quorum**: Ensure sufficient participation
4. **Proposal Validation**: Verify proposal data
5. **Emergency Stop**: Pause mechanism
6. **Upgrade Path**: Handle contract upgrades

### Best Practices

1. **Voting Period**: Give members time to vote
2. **Execution Delay**: Allow time to review passed proposals
3. **Quorum Requirements**: Ensure legitimacy
4. **Vote Delegation**: Enable participation
5. **Proposal Threshold**: Prevent spam
6. **Snapshot Voting**: Use off-chain voting for gas savings

### Popular DAO Frameworks

- **OpenZeppelin Governor**: Full-featured governance
- **Compound Governor**: Battle-tested governance
- **Aragon**: Complete DAO framework
- **Snapshot**: Off-chain voting

## Troubleshooting

### Can't Vote

**Problem**: Vote transaction reverts
**Solutions**:
- Check you have voting power
- Verify you haven't already voted
- Ensure proposal exists and isn't executed

### Proposal Won't Execute

**Problem**: Execute transaction reverts
**Solutions**:
- Verify votesFor > votesAgainst
- Check proposal isn't already executed
- Ensure proposal ID is correct

### No Voting Power

**Problem**: Your voting power is 0
**Solutions**:
- Contact DAO owner to assign power
- Verify you're using correct address
- Check if you need to acquire governance tokens

## Resources

- [OpenZeppelin Governor](https://docs.openzeppelin.com/contracts/4.x/governance)
- [Compound Governance](https://compound.finance/docs/governance)
- [Snapshot](https://docs.snapshot.org/)
- [DAO Best Practices](https://ethereum.org/en/dao/)

## Next Steps

After mastering the DAO Voting dApp:
1. Implement time locks and quorum
2. Add treasury management
3. Integrate with token-based voting
4. Build a full governance system
5. Deploy to Rootstock testnet
6. Explore existing DAO frameworks
