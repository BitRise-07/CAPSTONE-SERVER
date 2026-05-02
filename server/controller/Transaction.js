const mongoose = require("mongoose");
const Transaction = require("../model/Transaction");
const crypto = require("crypto");
const {getCity} =  require("../utils/getCity.js");

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
}

exports.getMyTransactions = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 10 } = req.query;

    const transactions = await Transaction.find({
      $or: [{ sender: userId }, { receiver: userId }],
    })
      .populate("sender", "firstName lastName email")
      .populate("receiver", "firstName lastName email")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Transaction.countDocuments({
      $or: [{ sender: userId }, { receiver: userId }],
    });

    const formattedTransactions = transactions.map((txn) => {
      const isSender = txn.sender._id.toString() === userId.toString();

      return {
        id: txn._id,
        type: isSender ? "DEBIT" : "CREDIT",
        amount: txn.amount,
        status: txn.status,

        withUser: isSender
          ? `${txn.receiver.firstName} ${txn.receiver.lastName}`
          : `${txn.sender.firstName} ${txn.sender.lastName}`,

        withUserEmail: isSender ? txn.receiver.email : txn.sender.email,

        sign: isSender ? "-" : "+",
        label: isSender ? "Money Sent" : "Money Received",
        time: txn.createdAt,
        location: txn.location,
        deviceId: txn.deviceId,
      };
    });

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
      message: "Failed to fetch your transactions",
    });
  }
};

exports.getAllTransactions = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      minAmount,
      maxAmount,
      search,
    } = req.query;

    const filter = {};

    if (status) {
      filter.status = status;
    }

    if (minAmount || maxAmount) {
      filter.amount = {};
      if (minAmount) filter.amount.$gte = Number(minAmount);
      if (maxAmount) filter.amount.$lte = Number(maxAmount);
    }

    const transactions = await Transaction.find(filter)
      .populate("sender", "firstName lastName email")
      .populate("receiver", "firstName lastName email")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    let filteredTransactions = transactions;

    if (search) {
      const searchLower = search.toLowerCase();

      filteredTransactions = transactions.filter((txn) => {
        const senderName =
          `${txn.sender.firstName} ${txn.sender.lastName}`.toLowerCase();
        const receiverName =
          `${txn.receiver.firstName} ${txn.receiver.lastName}`.toLowerCase();

        return (
          senderName.includes(searchLower) ||
          receiverName.includes(searchLower) ||
          txn.sender.email.toLowerCase().includes(searchLower) ||
          txn.receiver.email.toLowerCase().includes(searchLower)
        );
      });
    }

    const formattedTransactions = filteredTransactions.map((txn) => {
      return {
        id: txn._id,

        sender: {
          id: txn.sender._id,
          name: `${txn.sender.firstName} ${txn.sender.lastName}`,
          email: txn.sender.email,
        },

        receiver: {
          id: txn.receiver._id,
          name: `${txn.receiver.firstName} ${txn.receiver.lastName}`,
          email: txn.receiver.email,
        },

        amount: txn.amount,

        status: txn.status,

        statusLabel:
          txn.status === "Success"
            ? "Completed"
            : txn.status === "Fraud"
              ? "⚠️ Fraud"
              : "Failed",

        deviceId: txn.deviceId,
        ipAddress: txn.ipAddress,

        location: txn.location,

        time: txn.createdAt,
        formattedTime: new Date(txn.createdAt).toLocaleString(),

        isSuspicious: txn.status === "Fraud",
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
