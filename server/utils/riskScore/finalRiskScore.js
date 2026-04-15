import {deviceRiskScore} from "./deviceRiskScore.js";
import {amountRiskScore} from "./amountRiskScore.js";
import {velocityRiskScore} from "./velocityRiskScore.js";
import {locationRiskScore} from "./locationRiskScore.js";
import {frequentTransactionScore} from "./frequentTransactionScore.js";

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