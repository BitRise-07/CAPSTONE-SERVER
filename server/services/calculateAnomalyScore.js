exports.calculateAnomalyScore = (features) => {
  let score = 0;

  if (features.amount_deviation > 3) score += 0.5;
  else if (features.amount_deviation > 2) score += 0.3;
  else if (features.amount_deviation > 1) score += 0.1;

  if (features.geo_distance_km > 1000) score += 0.3;
  else if (features.geo_distance_km > 500) score += 0.2;
  else if (features.geo_distance_km > 100) score += 0.1;

  if (features.velocity_10m >= 5) score += 0.3;
  else if (features.velocity_10m >= 3) score += 0.2;

  if (features.velocity_1h > 10) score += 0.2;

  if (features.night_transaction) score += 0.05;

  if (!features.known_device) score += 0.1;
  if (!features.known_location) score += 0.1;

  return Number(Math.min(score, 1).toFixed(4));
};