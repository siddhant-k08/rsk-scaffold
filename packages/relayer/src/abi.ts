export const forwarderAbi = [
  {
    type: "constructor",
    inputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "execute",
    inputs: [
      {
        name: "req",
        type: "tuple",
        components: [
          { name: "from", type: "address" },
          { name: "to", type: "address" },
          { name: "value", type: "uint256" },
          { name: "gas", type: "uint256" },
          { name: "nonce", type: "uint256" },
          { name: "data", type: "bytes" },
        ],
      },
      { name: "signature", type: "bytes" },
    ],
    outputs: [
      { name: "", type: "bool" },
      { name: "", type: "bytes" },
    ],
    stateMutability: "payable",
  },
  {
    type: "function",
    name: "getNonce",
    inputs: [{ name: "from", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "verify",
    inputs: [
      {
        name: "req",
        type: "tuple",
        components: [
          { name: "from", type: "address" },
          { name: "to", type: "address" },
          { name: "value", type: "uint256" },
          { name: "gas", type: "uint256" },
          { name: "nonce", type: "uint256" },
          { name: "data", type: "bytes" },
        ],
      },
      { name: "signature", type: "bytes" },
    ],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getDomainSeparator",
    inputs: [],
    outputs: [{ name: "", type: "bytes32" }],
    stateMutability: "view",
  },
  {
    type: "event",
    name: "MetaTransactionExecuted",
    inputs: [
      { name: "from", type: "address", indexed: true },
      { name: "to", type: "address", indexed: true },
      { name: "nonce", type: "uint256", indexed: false },
      { name: "success", type: "bool", indexed: false },
      { name: "returnData", type: "bytes", indexed: false },
    ],
  },
] as const;
