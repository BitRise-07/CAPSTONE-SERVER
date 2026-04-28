import { timeDiff } from "../utils/calculateTimeDiff.js";
import { getDistanceKm } from "../utils/getDistanceKm.js";

// ✅ Amount risk
function amountRiskScore(amount, user) {
  const avg = user.behavior?.avgAmount || 0;
  const max = user.behavior?.maxAmount || avg;

  if (amount > max * 1.5) return 0.7;
  if (amount > avg * 2) return 0.5;
  if (amount > avg) return 0.2;

  return 0.1;
}

// ✅ Device risk
function deviceRiskScore(deviceId, user) {
  if (!deviceId) return 0.8;

  if (user.behavior?.commonDevices?.includes(deviceId)) {
    return 0.1;
  }

  return 0.7;
}

// ✅ Velocity risk (geo + time)
function velocityRiskScore(user, location, currentTime) {
  const lastTime = user.behavior?.lastTransactionAt;
  const lastLat = user.behavior?.lastLatitude;
  const lastLon = user.behavior?.lastLongitude;

  if (!lastTime || !lastLat) return 0.2;

  const diffMinutes = timeDiff(lastTime, currentTime);
  const diffHours = diffMinutes / 60;

  if (diffHours === 0) return 1;

  const distance = getDistanceKm(
    location.latitude,
    location.longitude,
    lastLat,
    lastLon
  );

  const speed = distance / diffHours;

  if (speed > 900) return 1;
  if (speed > 600) return 0.9;
  if (speed > 200) return 0.7;
  if (speed > 100) return 0.4;

  return 0.1;
}

// ✅ Location risk
function locationRiskScore(location, user) {
  if (!user.behavior?.commonLocations?.length) return 0.3;

  if (!user.behavior.commonLocations.includes(location.city)) {
    return 0.4;
  }

  return 0.1;
}

// ✅ Frequency risk
function frequentTransactionScore(features) {
  let score = 0;

  if (features.velocity_10m > 5) score = 1;
  else if (features.velocity_10m > 3) score = 0.6;

  if (features.velocity_1h > 10) score = Math.max(score, 0.6);
  else if (features.velocity_1h > 5) score = Math.max(score, 0.4);

  if (score === 0) score = 0.1;

  return score;
}

// ✅ FINAL RULE SCORE
export function finalRuleScore({ user, features, transactionContext }) {
  const now = new Date();

  const amountScore = amountRiskScore(transactionContext.amount, user);
  const velocityScore = velocityRiskScore(user, transactionContext.location, now);
  const deviceScore = deviceRiskScore(transactionContext.deviceId, user);
  const locationScore = locationRiskScore(transactionContext.location, user);
  const freqScore = frequentTransactionScore(features);

  const finalScore =
    velocityScore * 0.3 +
    amountScore * 0.2 +
    locationScore * 0.15 +
    freqScore * 0.15 +
    deviceScore * 0.1;

  return Number(Math.min(finalScore, 1).toFixed(4));
}