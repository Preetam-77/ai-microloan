// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Microloan {

    enum RiskTier { LOW, MEDIUM, HIGH }

    struct Loan {
        address borrower;
        uint256 amount;
        uint256 timestamp;
        uint256 riskScore;
        uint256 interestRate;   // basis points (e.g. 500 = 5%)
        bool repaid;
    }

    mapping(uint256 => Loan) public loans;
    uint256 public loanCount;

    event LoanRequested(
        uint256 loanId,
        address borrower,
        uint256 amount,
        uint256 riskScore,
        uint256 interestRate
    );

    event LoanRepaid(uint256 loanId, address borrower);

    // -------------------------------
    // AI RISK + FINANCIAL LOGIC
    // -------------------------------

    function getRiskTier(uint256 riskScore) public pure returns (RiskTier) {
        if (riskScore >= 750) return RiskTier.LOW;
        if (riskScore >= 550) return RiskTier.MEDIUM;
        return RiskTier.HIGH;
    }

    function getInterestRate(uint256 riskScore) public pure returns (uint256) {
        RiskTier tier = getRiskTier(riskScore);

        if (tier == RiskTier.LOW) return 500;     // 5.00%
        if (tier == RiskTier.MEDIUM) return 1200; // 12.00%
        return 2500;                              // 25.00%
    }

    function getMaxLoanAmount(uint256 riskScore) public pure returns (uint256) {
        RiskTier tier = getRiskTier(riskScore);

        if (tier == RiskTier.LOW) return 5 ether;
        if (tier == RiskTier.MEDIUM) return 3 ether;
        return 1 ether;
    }

    // -------------------------------
    // CORE LOAN FUNCTIONS
    // -------------------------------

    function requestLoan(uint256 amount, uint256 riskScore) external {
        uint256 maxAmount = getMaxLoanAmount(riskScore);
        require(amount <= maxAmount, "Amount exceeds AI approved limit");

        uint256 interestRate = getInterestRate(riskScore);

        loans[loanCount] = Loan({
            borrower: msg.sender,
            amount: amount,
            timestamp: block.timestamp,
            riskScore: riskScore,
            interestRate: interestRate,
            repaid: false
        });

        emit LoanRequested(
            loanCount,
            msg.sender,
            amount,
            riskScore,
            interestRate
        );

        loanCount++;
    }

    function repayLoan(uint256 loanId) external payable {
        Loan storage loan = loans[loanId];

        require(msg.sender == loan.borrower, "Not your loan");
        require(!loan.repaid, "Already repaid");

        uint256 interest = (loan.amount * loan.interestRate) / 10000;
        uint256 totalOwed = loan.amount + interest;

        require(msg.value == totalOwed, "Incorrect repayment amount");

        loan.repaid = true;

        emit LoanRepaid(loanId, msg.sender);
    }

    // -------------------------------
    // UI HELPER FUNCTIONS
    // -------------------------------

    function getLoan(uint256 loanId) external view returns (
        address borrower,
        uint256 amount,
        uint256 timestamp,
        uint256 riskScore,
        uint256 interestRate,
        bool repaid
    ) {
        Loan memory loan = loans[loanId];
        return (
            loan.borrower,
            loan.amount,
            loan.timestamp,
            loan.riskScore,
            loan.interestRate,
            loan.repaid
        );
    }

    function getAllLoans() external view returns (Loan[] memory) {
        Loan[] memory all = new Loan[](loanCount);
        for (uint256 i = 0; i < loanCount; i++) {
            all[i] = loans[i];
        }
        return all;
    }
}

