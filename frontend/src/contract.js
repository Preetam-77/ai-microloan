import { ethers } from "ethers";

const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

const CONTRACT_ABI = [
  {
    "inputs": [
      { "internalType": "uint256", "name": "amount", "type": "uint256" },
      { "internalType": "uint256", "name": "riskScore", "type": "uint256" }
    ],
    "name": "requestLoan",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "loanId", "type": "uint256" }],
    "name": "repayLoan",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "loanId", "type": "uint256" }],
    "name": "getLoan",
    "outputs": [
      { "internalType": "address", "name": "borrower", "type": "address" },
      { "internalType": "uint256", "name": "amount", "type": "uint256" },
      { "internalType": "uint256", "name": "timestamp", "type": "uint256" },
      { "internalType": "uint256", "name": "riskScore", "type": "uint256" },
      { "internalType": "bool", "name": "repaid", "type": "bool" }
    ],
    "stateMutability": "view",
    "type": "function"
  },

  // ✅ ADD THIS
  {
    "inputs": [],
    "name": "getAllLoans",
    "outputs": [
      {
        "components": [
          { "internalType": "address", "name": "borrower", "type": "address" },
          { "internalType": "uint256", "name": "amount", "type": "uint256" },
          { "internalType": "uint256", "name": "timestamp", "type": "uint256" },
          { "internalType": "uint256", "name": "riskScore", "type": "uint256" },
          { "internalType": "bool", "name": "repaid", "type": "bool" }
        ],
        "internalType": "struct Microloan.Loan[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

export { CONTRACT_ADDRESS, CONTRACT_ABI };
