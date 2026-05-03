const Transaction = require("../model/Transaction");
const { getDistanceKm } = require("../utils/getDistanceKm");


exports.buildFeatures = async (user, payload) => {
  const now = new Date();

  const recent = await Transaction.find({
    user: user._id,
    createdAt: {
      $gte: new Date(now.getTime() - 60 * 60 * 1000)
    }
  });

  const lastTx = await Transaction.findOne({ user: user._id })
    .sort({ createdAt: -1 });

  // ✅ Velocity counts (NO artificial +1)
  const velocity10m = recent.filter(
    (tx) => now - tx.createdAt <= 10 * 60 * 1000
  ).length;

  const velocity1h = recent.length;

  // ✅ Time gap (handle edge case properly)
  let timeGapMinutes = 9999;
  if (lastTx) {
    const diff = (now - lastTx.createdAt) / 60000;
    timeGapMinutes = diff > 0 ? diff : 0.01;
  }

  // ✅ Distance calculation safe
  let distance = 0;
  if (
    lastTx &&
    payload.location?.latitude &&
    payload.location?.longitude
  ) {
    distance = getDistanceKm(
      lastTx.location.latitude,
      lastTx.location.longitude,
      payload.location.latitude,
      payload.location.longitude
    );
  }

  // ✅ Device change
  const deviceChanged =
    lastTx && lastTx.deviceId !== payload.deviceId ? 1 : 0;

  // ✅ Behavior stats safe
  const avg = user.behavior?.avgAmount || 0;
  let std = user.behavior?.stdAmount || 0;

  // Avoid divide by zero
  if (std < 1) std = 1;

  const amountDeviation = Math.abs(payload.amount - avg) / std;

  const hour = now.getHours();

  return {
    amount: Number(payload.amount),

    hour_of_day: hour,

    velocity_10m: velocity10m,
    velocity_1h: velocity1h,

    time_gap_minutes: Number(timeGapMinutes.toFixed(2)),
    geo_distance_km: Number(distance.toFixed(2)),

    device_changed: deviceChanged,

    amount_deviation: Number(amountDeviation.toFixed(3)),

    night_transaction: hour < 6 || hour > 22 ? 1 : 0,

    known_device: user.behavior?.commonDevices?.includes(payload.deviceId) ? 1 : 0,

    known_location: user.behavior?.commonLocations?.includes(payload.location?.city) ? 1 : 0
  };
};

exports.updateBehaviorProfile = async (user, transaction) => {
  const count = user.behavior?.transactionCount || 0;
  const nextCount = count + 1;

  const prevAvg = user.behavior?.avgAmount || 0;

  const nextAvg = prevAvg + (transaction.amount - prevAvg) / nextCount;

  // ✅ Stable std update
  const prevStd = user.behavior?.stdAmount || 0;

  let nextStd = Math.sqrt(
    ((prevStd ** 2) * count +
      (transaction.amount - prevAvg) * (transaction.amount - nextAvg)) /
      nextCount
  );

  if (isNaN(nextStd) || nextStd < 1) nextStd = 1;

  const commonDevices = [
    ...new Set([
      ...(user.behavior?.commonDevices || []),
      transaction.deviceId
    ])
  ].slice(-8);

  const commonLocations = [
    ...new Set([
      ...(user.behavior?.commonLocations || []),
      transaction.location.city
    ])
  ].slice(-8);

  user.behavior = {
    avgAmount: Number(nextAvg.toFixed(2)),
    stdAmount: Number(nextStd.toFixed(2)),

    maxAmount: Math.max(user.behavior?.maxAmount || 0, transaction.amount),

    transactionCount: nextCount,

    commonDevices,
    commonLocations,

    lastTransactionAt: transaction.createdAt,
    lastLatitude: transaction.location.latitude,
    lastLongitude: transaction.location.longitude
  };

  await user.save();
};