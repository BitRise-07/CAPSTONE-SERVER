const { getDistanceKm } = require("../utils/getDistanceKm");
const { timeDiff } = require("../utils/calculateTimeDiff");


function isImpossibleTravel(user, location, now) {
  const lastTime = user.behavior?.lastTransactionAt;
  const lastLat = user.behavior?.lastLatitude;
  const lastLon = user.behavior?.lastLongitude;

  if (!lastTime || !lastLat) return false;

  const diffMin = timeDiff(lastTime, now);
  if (diffMin <= 0) return true;

  const distance = getDistanceKm(
    location.latitude,
    location.longitude,
    lastLat,
    lastLon
  );

  const speed = distance / (diffMin / 60);
  return speed > 900;
}

function isBurstFraud(features) {
  return features.velocity_10m >= 7;
}


function velocityRule(user, location, now) {
  const lastTime = user.behavior?.lastTransactionAt;
  const lastLat = user.behavior?.lastLatitude;
  const lastLon = user.behavior?.lastLongitude;

  if (!lastTime || !lastLat) {
    return { name: "velocity", score: 0.2, level: "low", reason: "No history" };
  }

  const diffMin = timeDiff(lastTime, now);
  if (diffMin <= 0) {
    return { name: "velocity", score: 1, level: "critical", reason: "Zero time gap" };
  }

  const distance = getDistanceKm(
    location.latitude,
    location.longitude,
    lastLat,
    lastLon
  );

  const speed = distance / (diffMin / 60);

  if (speed > 900) return { name: "velocity", score: 1, level: "critical", reason: "Impossible travel" };
  if (speed > 600) return { name: "velocity", score: 0.9, level: "high", reason: "Very high speed" };
  if (speed > 200) return { name: "velocity", score: 0.7, level: "high", reason: "High speed" };
  if (speed > 100) return { name: "velocity", score: 0.4, level: "medium", reason: "Moderate speed" };

  return { name: "velocity", score: 0.1, level: "low", reason: "Normal movement" };
}

function frequencyRule(features) {
  const v10 = features.velocity_10m;
  const v1h = features.velocity_1h;

  if (v10 >= 7) return { name: "frequency", score: 1, level: "critical", reason: "Burst transactions" };
  if (v10 >= 5) return { name: "frequency", score: 0.9, level: "high", reason: "High frequency (10m)" };
  if (v10 >= 3) return { name: "frequency", score: 0.6, level: "medium", reason: "Moderate frequency" };

  if (v1h > 15) return { name: "frequency", score: 0.7, level: "high", reason: "High hourly frequency" };

  return { name: "frequency", score: 0.1, level: "low", reason: "Normal frequency" };
}

function amountRule(amount, user) {
  const avg = user.behavior?.avgAmount || 0;
  const max = user.behavior?.maxAmount || avg;

  if (amount > max * 1.5) return { name: "amount", score: 0.7, level: "high", reason: "Exceeds max pattern" };
  if (amount > avg * 2) return { name: "amount", score: 0.5, level: "medium", reason: "Above normal" };
  if (amount > avg) return { name: "amount", score: 0.2, level: "low", reason: "Slightly higher" };

  return { name: "amount", score: 0.1, level: "low", reason: "Normal amount" };
}

function deviceRule(deviceId, user) {
  if (!deviceId) return { name: "device", score: 0.8, level: "high", reason: "Missing device" };

  if (!user.behavior?.commonDevices?.includes(deviceId)) {
    return { name: "device", score: 0.7, level: "high", reason: "New device" };
  }

  return { name: "device", score: 0.1, level: "low", reason: "Known device" };
}

function locationRule(location, user) {
  if (!user.behavior?.commonLocations?.length) {
    return { name: "location", score: 0.3, level: "medium", reason: "No history" };
  }

  if (!user.behavior.commonLocations.includes(location.city)) {
    return { name: "location", score: 0.4, level: "medium", reason: "New location" };
  }

  return { name: "location", score: 0.1, level: "low", reason: "Known location" };
}


exports.evaluateRules = ({ user, features, transactionContext }) => {
  const now = new Date();

  return [
    velocityRule(user, transactionContext.location, now),
    frequencyRule(features),
    amountRule(transactionContext.amount, user),
    deviceRule(transactionContext.deviceId, user),
    locationRule(transactionContext.location, user)
  ];
};

exports.applyHardRules = (rules, user, features, ctx) => {
  const now = new Date();

  if (isImpossibleTravel(user, ctx.location, now)) {
    return { decision: "block", reason: "Impossible travel detected" };
  }

  if (isBurstFraud(features)) {
    return { decision: "block", reason: "Too many transactions in short time" };
  }

  const critical = rules.find(r => r.level === "critical");
  if (critical) return { decision: "block", reason: critical.reason };

  const high = rules.filter(r => r.level === "high");

  if (high.length >= 2) {
    return { decision: "block", reason: "Multiple high-risk signals" };
  }

  if (high.length === 1) {
    return { decision: "otp", reason: high[0].reason };
  }

  return null;
};

exports.calculateRuleScore = (rules) => {
  const weights = {
    velocity: 0.3,
    frequency: 0.2,
    amount: 0.2,
    location: 0.15,
    device: 0.15
  };

  let score = 0;

  for (const r of rules) {
    score += (weights[r.name] || 0) * r.score;
  }

  return Number(Math.min(score, 1).toFixed(4));
};