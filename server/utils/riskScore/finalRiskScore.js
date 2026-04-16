
const deviceRiskScore = require("./deviceRiskScore.js");
const amountRiskScore = require("./amountRiskScore.js");
const velocityRiskScore = require("./velocityRiskScore.js");
const locationRiskScore = require("./locationRiskScore.js");
const frequentTransactionScore = require("./frequentTransactionScore.js");

function finalRiskScore({
  amount,
  stats,
  deviceId,
  location,
  currentTime
}) {
  const amountScore = amountRiskScore(amount, stats);
  const velocityScore = velocityRiskScore(stats, currentTime);
  const deviceScore = deviceRiskScore(deviceId, stats);
  const locationScore = locationRiskScore(location, stats);
  const freqScore = frequentTransactionScore(stats, currentTime);

  //  weighted scoring
  const finalScore =
    (velocityScore * 0.3) +  
    (amountScore * 0.2) +
    (locationScore * 0.15) +
    (freqScore * 0.15) +
    (deviceScore * 0.1);      

  return finalScore;
}

module.exports = finalRiskScore;