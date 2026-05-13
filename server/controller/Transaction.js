const mongoose = require("mongoose");
const Transaction = require("../model/Transaction");
const crypto = require("crypto");
const { getCity } = require("../utils/getCity.js");

const { buildFeatures } = require("../services/featureService.js");
const { evaluateRisk } = require("../services/riskService.js");
const { updateBehaviorProfile } = require("../services/featureService.js");

exports.addTransaction = async (req, res) => {
  try {
    const payload = req.body;

    if (
      !payload.amount ||
      !payload.deviceId ||
      !payload.location?.latitude ||
      !payload.location?.longitude
    ) {
      return res.status(400).json({
        message: "amount, deviceId, latitude, longitude are required",
      });
    }

    const city = await getCity(
      payload.location.latitude,
      payload.location.longitude,
    );

    payload.location.city = city;

    const features = await buildFeatures(req.user, payload);

    const risk = await evaluateRisk({
      user: req.user,
      features,
      transactionContext: payload,
    });

    const transaction = await Transaction.create({
      user: req.user._id,
      amount: payload.amount,
      merchant: payload.merchant,
      category: payload.category,
      channel: payload.channel,
      accountId: payload.accountId,
      deviceId: payload.deviceId,
      location: payload.location,
      features,
      scores: risk.scores,
      adaptivePolicy: risk.adaptivePolicy,
      decision: risk.decision,
      status: risk.status,
      explanation: risk.explanation,
    });

    if (transaction.decision !== "block") {
      await updateBehaviorProfile(req.user, transaction);
    }

    console.log("New Transaction:", transaction);

    res.status(201).json({
      transaction,
    });
  } catch (error) {
    console.error("Transaction Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.getMyTransactions = async (req, res) => {
  try {
    const userId = req.user._id;

    const transactions = await Transaction.find({
      user: userId,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      transactions,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch transactions",
    });
  }
};

exports.getAllTransactions = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      decision,
      minAmount,
      maxAmount,
      search,
    } = req.query;

    const filter = {};

    if (status) {
      filter.status = status;
    }

    if (decision) {
      filter.decision = decision;
    }

    if (minAmount || maxAmount) {
      filter.amount = {};
      if (minAmount) filter.amount.$gte = Number(minAmount);
      if (maxAmount) filter.amount.$lte = Number(maxAmount);
    }

    const transactions = await Transaction.find(filter)
      .populate("user", "firstName lastName email accountType isBlocked image")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    let filteredTransactions = transactions;

    if (search) {
      const searchLower = search.toLowerCase();

      filteredTransactions = transactions.filter((txn) => {
        const userName =
          `${txn.user?.firstName || ""} ${txn.user?.lastName || ""}`.toLowerCase();
        const userEmail = txn.user?.email?.toLowerCase() || "";

        return (
          userName.includes(searchLower) ||
          userEmail.includes(searchLower) ||
          txn.merchant?.toLowerCase().includes(searchLower) ||
          txn.location?.city?.toLowerCase().includes(searchLower)
        );
      });
    }

    const formattedTransactions = filteredTransactions.map((txn) => {
      return {
        id: txn._id,

        user: {
          id: txn.user?._id,
          name: `${txn.user?.firstName || ""} ${txn.user?.lastName || ""}`.trim(),
          email: txn.user?.email,
          image: txn.user?.image,
          isBlocked: Boolean(txn.user?.isBlocked),
        },

        amount: txn.amount,
        merchant: txn.merchant,
        category: txn.category,
        channel: txn.channel,

        status: txn.status,
        decision: txn.decision,
        scores: txn.scores,
        reason: txn.explanation?.reason,

        statusLabel:
          txn.status === "approved"
            ? "Completed"
            : txn.status === "blocked"
              ? "Blocked"
              : "Pending OTP",

        deviceId: txn.deviceId,

        location: txn.location,

        time: txn.createdAt,
        formattedTime: new Date(txn.createdAt).toLocaleString(),

        isSuspicious: txn.decision === "block" || txn.status === "blocked",
      };
    });

    const total = await Transaction.countDocuments(filter);

    return res.status(200).json({
      success: true,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
      transactions: formattedTransactions,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch all transactions",
    });
  }
};
