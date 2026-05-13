const mongoose = require("mongoose");
const Transaction = require("../model/Transaction");
const User = require("../model/User");
const Profile = require("../model/Profile");

function isFraudTransaction(txn) {
  return txn.decision === "block" || txn.status === "blocked";
}

function toDateFilter(query) {
  const createdAt = {};

  if (query.from) {
    const from = new Date(query.from);
    if (!Number.isNaN(from.getTime())) createdAt.$gte = from;
  }

  if (query.to) {
    const to = new Date(query.to);
    if (!Number.isNaN(to.getTime())) createdAt.$lte = to;
  }

  return Object.keys(createdAt).length ? { createdAt } : {};
}

function riskBand(score = 0) {
  if (score >= 0.8) return "block";
  if (score >= 0.6) return "high";
  if (score >= 0.35) return "medium";
  return "low";
}

function emptyBandCounts() {
  return { block: 0, high: 0, medium: 0, low: 0 };
}

function publicUser(user) {
  if (!user) return null;

  return {
    id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    name: `${user.firstName} ${user.lastName}`,
    email: user.email,
    accountType: user.accountType,
    isBlocked: Boolean(user.isBlocked),
    image: user.image,
    behavior: user.behavior,
    createdAt: user.createdAt,
  };
}

exports.adminOverview = async (req, res) => {
  try {
    const filter = toDateFilter(req.query);
    const transactions = await Transaction.find(filter)
      .populate("user", "firstName lastName email accountType isBlocked image behavior createdAt")
      .sort({ createdAt: 1 })
      .limit(5000)
      .lean();

    const totalTransactions = transactions.length;
    const fraudTransactions = transactions.filter(isFraudTransaction);
    const totalFraud = fraudTransactions.length;
    const otp = transactions.filter((txn) => txn.decision === "otp").length;
    const approved = transactions.filter((txn) => txn.decision === "allow").length;

    const avgRisk = totalTransactions
      ? transactions.reduce((sum, txn) => sum + (txn.scores?.risk || 0), 0) / totalTransactions
      : 0;

    const fraudByCityMap = {};
    const reasonMap = {};
    const hourlyMap = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      fraud: 0,
      total: 0,
      avgRisk: 0,
    }));
    const riskDistribution = emptyBandCounts();
    const userRiskMap = {};

    for (const txn of transactions) {
      const score = txn.scores?.risk || txn.scores?.graph || 0;
      const band = riskBand(score);
      riskDistribution[band] += 1;

      const hour = new Date(txn.createdAt).getHours();
      hourlyMap[hour].total += 1;
      hourlyMap[hour].avgRisk += score;

      const userId = txn.user?._id?.toString() || txn.user?.toString();
      if (userId) {
        if (!userRiskMap[userId]) {
          userRiskMap[userId] = {
            user: publicUser(txn.user),
            totalTransactions: 0,
            fraud: 0,
            otp: 0,
            blocked: 0,
            totalAmount: 0,
            avgRisk: 0,
            lastTransactionAt: txn.createdAt,
          };
        }

        userRiskMap[userId].totalTransactions += 1;
        userRiskMap[userId].totalAmount += txn.amount || 0;
        userRiskMap[userId].avgRisk += score;
        userRiskMap[userId].lastTransactionAt = txn.createdAt;
        if (txn.decision === "otp") userRiskMap[userId].otp += 1;
        if (txn.decision === "block") userRiskMap[userId].blocked += 1;
        if (isFraudTransaction(txn)) userRiskMap[userId].fraud += 1;
      }

      if (!isFraudTransaction(txn)) continue;

      const city = txn.location?.city || "Unknown";
      if (!fraudByCityMap[city]) {
        fraudByCityMap[city] = { city, fraud: 0, totalAmount: 0, avgRisk: 0 };
      }
      fraudByCityMap[city].fraud += 1;
      fraudByCityMap[city].totalAmount += txn.amount || 0;
      fraudByCityMap[city].avgRisk += score;

      hourlyMap[hour].fraud += 1;

      const reasons = [
        txn.explanation?.reason,
        ...(txn.explanation?.rules || [])
          .filter((rule) => ["critical", "high", "medium"].includes(rule.level))
          .map((rule) => rule.reason),
      ].filter(Boolean);

      for (const reason of reasons.length ? reasons : ["Unknown reason"]) {
        reasonMap[reason] = (reasonMap[reason] || 0) + 1;
      }
    }

    const fraudByCity = Object.values(fraudByCityMap)
      .map((row) => ({
        ...row,
        avgRisk: row.fraud ? Number((row.avgRisk / row.fraud).toFixed(4)) : 0,
      }))
      .sort((a, b) => b.fraud - a.fraud);

    const fraudByHour = hourlyMap.map((row) => ({
      hour: row.hour,
      fraud: row.fraud,
      total: row.total,
      avgRisk: row.total ? Number((row.avgRisk / row.total).toFixed(4)) : 0,
    }));

    const avgFraudHour = totalFraud
      ? Number(
          (
            fraudTransactions.reduce(
              (sum, txn) => sum + new Date(txn.createdAt).getHours(),
              0
            ) / totalFraud
          ).toFixed(2)
        )
      : null;

    const fraudReasons = Object.entries(reasonMap)
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count);

    const topRiskUsers = Object.values(userRiskMap)
      .map((row) => ({
        ...row,
        avgRisk: row.totalTransactions
          ? Number((row.avgRisk / row.totalTransactions).toFixed(4))
          : 0,
      }))
      .sort((a, b) => b.fraud - a.fraud || b.avgRisk - a.avgRisk)
      .slice(0, 10);

    const recentFrauds = fraudTransactions
      .slice(-20)
      .reverse()
      .map((txn) => ({
        id: txn._id,
        user: publicUser(txn.user),
        amount: txn.amount,
        merchant: txn.merchant,
        category: txn.category,
        channel: txn.channel,
        city: txn.location?.city,
        decision: txn.decision,
        status: txn.status,
        scores: txn.scores,
        reason: txn.explanation?.reason,
        createdAt: txn.createdAt,
      }));

    return res.status(200).json({
      success: true,
      totals: {
        totalTransactions,
        totalFraud,
        legit: totalTransactions - totalFraud,
        approved,
        otp,
        blocked: totalFraud,
        avgRisk: Number(avgRisk.toFixed(4)),
      },
      graphs: {
        fraudByCity,
        fraudByHour,
        riskDistribution,
        decisionBreakdown: {
          allow: approved,
          otp,
          block: totalFraud,
        },
        recentRiskTrend: transactions.slice(-50).map((txn) => ({
          time: txn.createdAt,
          risk: txn.scores?.risk || 0,
          rule: txn.scores?.rule || 0,
          ml: txn.scores?.ml || 0,
          anomaly: txn.scores?.anomaly || 0,
          decision: txn.decision,
          city: txn.location?.city,
        })),
      },
      fraudTiming: {
        avgFraudHour,
        avgFraudTimeLabel:
          avgFraudHour === null
            ? null
            : `${String(Math.floor(avgFraudHour)).padStart(2, "0")}:00`,
      },
      fraudReasons,
      topRiskUsers,
      recentFrauds,
    });
  } catch (error) {
    console.error("Admin overview error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load admin overview",
    });
  }
};

exports.adminUsers = async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const filter = { accountType: "User" };

    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const users = await User.find(filter)
      .select("-password -resetPasswordToken -resetPasswordExpiresIn")
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .lean();

    const userIds = users.map((user) => user._id);
    const stats = await Transaction.aggregate([
      { $match: { user: { $in: userIds } } },
      {
        $group: {
          _id: "$user",
          totalTransactions: { $sum: 1 },
          totalAmount: { $sum: "$amount" },
          fraud: {
            $sum: {
              $cond: [{ $or: [{ $eq: ["$decision", "block"] }, { $eq: ["$status", "blocked"] }] }, 1, 0],
            },
          },
          avgRisk: { $avg: "$scores.risk" },
          lastTransactionAt: { $max: "$createdAt" },
        },
      },
    ]);

    const statMap = new Map(stats.map((row) => [row._id.toString(), row]));
    const total = await User.countDocuments(filter);

    return res.status(200).json({
      success: true,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      users: users.map((user) => {
        const stat = statMap.get(user._id.toString()) || {};
        return {
          ...publicUser(user),
          totalTransactions: stat.totalTransactions || 0,
          totalAmount: stat.totalAmount || 0,
          fraud: stat.fraud || 0,
          avgRisk: Number((stat.avgRisk || 0).toFixed(4)),
          lastTransactionAt: stat.lastTransactionAt || null,
        };
      }),
    });
  } catch (error) {
    console.error("Admin users error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load users",
    });
  }
};

exports.adminUserDetail = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: "Invalid user id" });
    }

    const [user, profile, transactions] = await Promise.all([
      User.findById(userId).select("-password -resetPasswordToken -resetPasswordExpiresIn").lean(),
      Profile.findOne({ user: userId }).lean(),
      Transaction.find({ user: userId }).sort({ createdAt: -1 }).limit(200).lean(),
    ]);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const totalTransactions = transactions.length;
    const fraud = transactions.filter(isFraudTransaction).length;
    const otp = transactions.filter((txn) => txn.decision === "otp").length;
    const avgRisk = totalTransactions
      ? transactions.reduce((sum, txn) => sum + (txn.scores?.risk || 0), 0) / totalTransactions
      : 0;

    const cityMap = {};
    const reasonMap = {};

    for (const txn of transactions) {
      const city = txn.location?.city || "Unknown";
      if (!cityMap[city]) cityMap[city] = { city, total: 0, fraud: 0 };
      cityMap[city].total += 1;
      if (isFraudTransaction(txn)) {
        cityMap[city].fraud += 1;
        const reason = txn.explanation?.reason || "Unknown reason";
        reasonMap[reason] = (reasonMap[reason] || 0) + 1;
      }
    }

    return res.status(200).json({
      success: true,
      user: publicUser(user),
      profile,
      summary: {
        totalTransactions,
        fraud,
        legit: totalTransactions - fraud,
        otp,
        avgRisk: Number(avgRisk.toFixed(4)),
      },
      graphs: {
        cityBreakdown: Object.values(cityMap).sort((a, b) => b.fraud - a.fraud),
        riskTrend: transactions
          .slice()
          .reverse()
          .map((txn) => ({
            time: txn.createdAt,
            risk: txn.scores?.risk || 0,
            rule: txn.scores?.rule || 0,
            ml: txn.scores?.ml || 0,
            anomaly: txn.scores?.anomaly || 0,
            decision: txn.decision,
          })),
      },
      fraudReasons: Object.entries(reasonMap)
        .map(([reason, count]) => ({ reason, count }))
        .sort((a, b) => b.count - a.count),
      transactions,
    });
  } catch (error) {
    console.error("Admin user detail error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load user detail",
    });
  }
};

exports.scoringGuide = async (req, res) => {
  return res.status(200).json({
    success: true,
    ruleSeverityToNumber: {
      critical: 1,
      high: "0.7 - 0.9 depending on rule",
      medium: "0.3 - 0.6 depending on rule",
      low: "0.1 - 0.2 depending on rule",
    },
    graphBands: {
      block: "risk >= 0.8",
      high: "0.6 <= risk < 0.8",
      medium: "0.35 <= risk < 0.6",
      low: "risk < 0.35",
    },
    finalRiskFormula: {
      withMl: "0.45 * ruleScore + 0.25 * anomalyScore + 0.30 * mlFraudProbability",
      withoutMl: "0.50 * ruleScore + 0.50 * anomalyScore",
      hardRule: "critical or multiple high-risk rules can block directly; numeric risk is still stored as 1.0 for graphing and review",
    },
    mlRole: [
      "ML does not override critical rule blocks.",
      "ML adds probability for borderline cases where rules are not critical.",
      "For direct blocks, ML is still useful as audit evidence, monitoring signal, and retraining feedback.",
    ],
    metricNote: {
      tpr: "TPR/recall = true fraud blocked / all known fraud in the labeled test set.",
      fpr: "FPR = legitimate transactions wrongly blocked / all known legitimate transactions in the labeled test set.",
      productionReality:
        "A live blocked transaction is not automatically known fraud. You need later labels from user complaints, bank chargebacks, manual review, or confirmed safe OTP retries to calculate production FPR/TPR.",
    },
  });
};
