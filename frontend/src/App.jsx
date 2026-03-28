import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "./contract";
import axios from "axios";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

/* ================= CONSTANTS ================= */

const COLORS = {
  LOW: "#16a34a",
  MEDIUM: "#f59e0b",
  HIGH: "#dc2626"
};

const HARDHAT_CHAIN_ID = "0x7A69"; // 31337

/* ================= APP ================= */

export default function App() {
  const [account, setAccount] = useState(null);
  const [loanAmount, setLoanAmount] = useState("");
  const [riskScore, setRiskScore] = useState(null);
  const [riskTier, setRiskTier] = useState("");
  const [interestRate, setInterestRate] = useState(0);
  const [activity, setActivity] = useState([]);
  const [loans, setLoans] = useState([]);
  const [loadingTx, setLoadingTx] = useState(false);

  const addActivity = (msg) => {
    setActivity((prev) => [
      { msg, time: new Date().toLocaleTimeString() },
      ...prev
    ]);
  };

  useEffect(() => {
    if (account) fetchLoans();
  }, [account]);

  /* ================= WALLET ================= */

  async function connectWallet() {
    if (!window.ethereum) {
      alert("Please install MetaMask");
      return;
    }

    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts"
    });

    // Force Hardhat network
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: HARDHAT_CHAIN_ID }]
      });
    } catch (err) {
      if (err.code === 4902) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [{
            chainId: HARDHAT_CHAIN_ID,
            chainName: "Hardhat Local",
            rpcUrls: ["http://127.0.0.1:8545"],
            nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 }
          }]
        });
      }
    }

    setAccount(accounts[0]);
    addActivity("Wallet connected to Hardhat");
  }

  /* ================= AI CREDIT ================= */

  async function getCreditScore() {
    addActivity("Running AI credit analysis...");

    const res = await axios.post("http://localhost:4000/api/credit-score", {
      monthlyIncome: 35000,
      employmentType: "fulltime",
      hasPreviousLoans: true,
      hasDefaults: false,
      bankAccountAgeYears: 3,
      savings: 40000
    });

    setRiskScore(res.data.riskScore);
    setRiskTier(res.data.riskTier);
    setInterestRate(res.data.interestRate);

    addActivity(
      `AI score generated: ${res.data.riskScore} (${res.data.riskTier})`
    );

    if (res.data.riskTier === "LOW") setLoanAmount(5);
    else if (res.data.riskTier === "MEDIUM") setLoanAmount(3);
    else setLoanAmount(1);
  }

  /* ================= BLOCKCHAIN ================= */

  async function getSignerContract() {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();

    return new ethers.Contract(
      CONTRACT_ADDRESS,
      CONTRACT_ABI,
      signer
    );
  }

  async function getReadContract() {
    const provider = new ethers.BrowserProvider(window.ethereum);

    return new ethers.Contract(
      CONTRACT_ADDRESS,
      CONTRACT_ABI,
      provider
    );
  }

  async function requestLoan() {
    if (!account) {
      alert("Connect wallet first");
      return;
    }

    if (!riskScore) {
      alert("Run AI Credit Check first");
      return;
    }

    try {
      setLoadingTx(true);
      addActivity("Opening MetaMask for loan request...");

      const contract = await getSignerContract();

      const tx = await contract.requestLoan(
        ethers.parseEther(loanAmount.toString()),
        riskScore
      );

      addActivity("Transaction sent. Waiting for confirmation...");
      await tx.wait();

      addActivity(`✅ Loan requested: ${loanAmount} ETH`);
      await fetchLoans();
    } catch (err) {
      console.error(err);
      addActivity("❌ Transaction failed or rejected");
      alert(err.reason || err.message);
    } finally {
      setLoadingTx(false);
    }
  }

  async function fetchLoans() {
    try {
      const contract = await getReadContract();
      const allLoans = await contract.getAllLoans();
      setLoans(allLoans);
      addActivity("Fetched on-chain loan history");
    } catch (err) {
      console.error(err);
    }
  }

  async function repayLoan(loanId, amount) {
    try {
      setLoadingTx(true);
      addActivity(`Opening MetaMask to repay loan #${loanId}...`);

      const contract = await getSignerContract();

      const tx = await contract.repayLoan(loanId, { value: amount });
      await tx.wait();

      addActivity(`✅ Loan #${loanId} repaid`);
      await fetchLoans();
    } catch (err) {
      console.error(err);
      addActivity("❌ Repay failed");
      alert(err.reason || err.message);
    } finally {
      setLoadingTx(false);
    }
  }

  /* ================= DASHBOARD ================= */

  const totalBorrowed = loans.reduce(
    (sum, l) => sum + parseFloat(ethers.formatEther(l.amount)),
    0
  );

  const activeCount = loans.filter((l) => !l.repaid).length;
  const repaidCount = loans.filter((l) => l.repaid).length;

  const chartData = [
  { name: "Active", value: activeCount || 1 },
  { name: "Repaid", value: repaidCount || 1 }
];


  const maxApproved =
    riskTier === "LOW" ? 5 : riskTier === "MEDIUM" ? 3 : 1;

  const suggestedEmi = loanAmount
    ? (loanAmount * (1 + interestRate / 10000)) / 6
    : 0;

  /* ================= UI ================= */

  return (
    <div style={page}>
      <Header />

      {!account ? (
        <button style={btnPrimary} onClick={connectWallet}>
          🔐 Connect Wallet
        </button>
      ) : (
        <>
          <div style={statsGrid}>
            <StatCard title="💰 Total Borrowed" value={`${totalBorrowed.toFixed(2)} ETH`} />
            <StatCard title="⏳ Active Loans" value={activeCount} />
            <StatCard title="✅ Repaid Loans" value={repaidCount} />
          </div>

          <div style={mainGrid}>
            <div style={{ display: "grid", gap: 20 }}>

              <Card title="🤖 AI Credit Intelligence">
                <button style={btnSecondary} onClick={getCreditScore}>
                  Run AI Credit Check
                </button>

                {riskScore && (
                  <>
                    <h2>{riskScore}</h2>
                    <Badge color={COLORS[riskTier]} text={`${riskTier} RISK`} />
                    <p>Interest Rate (AI): <b>{interestRate / 100}%</b></p>
                    <Progress value={riskScore / 10} color={COLORS[riskTier]} />
                  </>
                )}
              </Card>

              {riskTier && (
                <Card title="💡 AI Loan Recommendation">
                  <p>Max Approved Amount: <b>{maxApproved} ETH</b></p>
                  <p>Estimated APR: <b>{interestRate / 100}%</b></p>
                  <p>Suggested 6-month EMI: <b>{suggestedEmi.toFixed(3)} ETH</b></p>
                </Card>
              )}

              <Card title="💸 Smart Loan Request">
                <input
                  style={input}
                  type="number"
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(e.target.value)}
                  placeholder="Loan amount (ETH)"
                />

                <button
                  style={btnPrimary}
                  disabled={loadingTx}
                  onClick={requestLoan}
                >
                  {loadingTx ? "⏳ Waiting for MetaMask..." : "Request Loan On-Chain"}
                </button>
              </Card>

              <Card title="📜 On-Chain Loan History">
                {loans.length === 0 && <p>No loans yet</p>}

                {loans.map((loan, i) => {
                  const principal = parseFloat(
                    ethers.formatEther(loan.amount)
                  );

                  const interest =
                    loan.riskScore < 30 ? 5 : loan.riskScore < 70 ? 10 : 20;

                  const totalDue = (principal * (1 + interest / 100)).toFixed(3);

                  return (
                    <div key={i} style={loanRow}>
                      <div>
                        <b>Loan #{i}</b> — {principal} ETH  
                        <br />
                        Risk: {loan.riskScore} | Interest: {interest}%
                        <br />
                        Total Due: {totalDue} ETH
                      </div>

                      <div>
                        <Badge
                          color={loan.repaid ? "#22c55e" : "#f59e0b"}
                          text={loan.repaid ? "REPAID" : "ACTIVE"}
                        />

                        {!loan.repaid && (
                          <button
                            style={{ ...btnSecondary, marginTop: 6 }}
                            onClick={() => repayLoan(i, loan.amount)}
                          >
                            Repay
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </Card>
            </div>

            <div style={{ display: "grid", gap: 20 }}>
              <Card title="📊 Portfolio Snapshot">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={chartData} dataKey="value" outerRadius={70}>
                      <Cell fill="#3b82f6" />
                      <Cell fill="#22c55e" />
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Card>

              <Card title="🕒 Live Activity">
                <div style={{ maxHeight: 250, overflowY: "auto" }}>
                  {activity.map((a, i) => (
                    <div key={i} style={activityRow}>
                      <b>{a.time}</b> — {a.msg}
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ================= UI COMPONENTS + STYLES ================= */

const Header = () => (
  <div style={header}>
    <h1>🏦 ChainCredit AI</h1>
    <p>AI-powered decentralized micro-lending platform</p>
  </div>
);

const Card = ({ title, children }) => (
  <div style={card}>
    <h2>{title}</h2>
    {children}
  </div>
);

const StatCard = ({ title, value }) => (
  <div style={statCard}>
    <p>{title}</p>
    <h2>{value}</h2>
  </div>
);

const Badge = ({ color, text }) => (
  <span style={{
    background: color,
    padding: "6px 12px",
    borderRadius: 999,
    fontWeight: "bold",
    display: "inline-block",
    marginBottom: 6
  }}>
    {text}
  </span>
);

const Progress = ({ value, color }) => (
  <div style={{ background: "#1e293b", borderRadius: 999, height: 12 }}>
    <div
      style={{
        width: `${Math.min(value, 100)}%`,
        background: color,
        height: 12,
        borderRadius: 999
      }}
    />
  </div>
);

/* ================= STYLES ================= */

const page = { minHeight: "100vh", background: "#020617", color: "white", padding: 30 };
const header = { background: "linear-gradient(135deg, #2563eb, #7c3aed)", padding: 25, borderRadius: 20, marginBottom: 25 };
const mainGrid = { display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20 };
const statsGrid = { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, marginBottom: 20 };
const card = { background: "rgba(15,23,42,0.85)", border: "1px solid #1e293b", borderRadius: 20, padding: 20 };
const statCard = { ...card, textAlign: "center" };
const loanRow = { display: "flex", justifyContent: "space-between", borderBottom: "1px solid #1e293b", padding: "10px 0" };
const activityRow = { borderBottom: "1px solid #1e293b", padding: "6px 0", fontSize: 14 };
const btnPrimary = { background: "linear-gradient(135deg, #2563eb, #7c3aed)", border: "none", padding: "12px 18px", borderRadius: 12, color: "white", fontWeight: "bold", cursor: "pointer" };
const btnSecondary = { background: "#020617", border: "1px solid #1e293b", padding: "10px 16px", borderRadius: 12, color: "white", cursor: "pointer" };
const input = { width: "100%", padding: 12, borderRadius: 12, border: "1px solid #1e293b", background: "#020617", color: "white", marginBottom: 10 };

