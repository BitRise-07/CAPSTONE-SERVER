function amountRiskScore(amount, stats) {
  if (!stats) return 0.5;

  let score = 0;

  if (amount > stats.maxAmount * 1.5) score += 0.7;
  else if (amount > stats.avgAmount * 2) score += 0.5;
  else if (amount > stats.avgAmount) score += 0.2;

  return Math.min(score, 1);
}

module.exports = amountRiskScore;