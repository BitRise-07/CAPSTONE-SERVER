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


  const velocity10m = recent.filter(
    (tx) => now - tx.createdAt <= 10 * 60 * 1000
  ).length;

  const velocity1h = recent.length;

  const timeGapMinutes = lastTx
    ? Math.max((now - lastTx.createdAt) / 60000, 0.1)
    : 1440;

  const distance = lastTx
    ? getDistanceKm(
        lastTx.location.latitude,
        lastTx.location.longitude,
        payload.location.latitude,
        payload.location.longitude
      )
    : 0;

  const deviceChanged =
    lastTx && lastTx.deviceId !== payload.deviceId ? 1 : 0;

  const avg = user.behavior?.avgAmount || 0;
  const std = user.behavior?.stdAmount || 1;

  const amountDeviation = std
    ? Math.abs(payload.amount - avg) / std
    : payload.amount / 1000;

  const hour = now.getHours();

  return {
    amount: Number(payload.amount),
    hour_of_day: hour,
    velocity_10m: velocity10m + 1,
    velocity_1h: velocity1h + 1,
    time_gap_minutes: Number(timeGapMinutes.toFixed(2)),
    geo_distance_km: Number(distance.toFixed(2)),
    device_changed: deviceChanged,
    amount_deviation: Number(amountDeviation.toFixed(3)),
    night_transaction: hour < 6 || hour > 22 ? 1 : 0,
    known_device: user.behavior?.commonDevices?.includes(payload.deviceId) ? 1 : 0,
    known_location: user.behavior?.commonLocations?.includes(payload.location.city) ? 1 : 0
  };
}

exports.updateBehaviorProfile = async (user, transaction) => {
  const count = user.behavior?.transactionCount || 0;
  const nextCount = count + 1;

  const prevAvg = user.behavior?.avgAmount || 0;
  const nextAvg = prevAvg + (transaction.amount - prevAvg) / nextCount;

  const prevStd = user.behavior?.stdAmount || 0;
  const nextStd = Math.sqrt(
    ((prevStd ** 2) * count + (transaction.amount - nextAvg) ** 2) / nextCount
  );

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
}