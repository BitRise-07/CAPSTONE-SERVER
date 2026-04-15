const mongoose = require("mongoose");
const Transaction = require("../model/Transaction");
const User = require("../model/User");
const Notification = require("../model/Notification");
const TransactionStats = require("../model/TransactionStats");
const { io, onlineUsers } = require("../server");
const crypto = require("crypto");

exports.createTransaction = async (req, res) => {
  try {
    const senderId = req.user._id;

    const status = req.user.status || "Success";

    const { receiverId, amount, lat, lon, deviceId, ipAddress } = req.body;

    if (!receiverId || !amount) {
      throw new Error("Receiver and amount required");
    }

    const sender = await User.findById(senderId);
    const receiver = await User.findById(receiverId);

    if (!receiver) throw new Error("Receiver not found");

    let stats = await TransactionStats.findOne({ userId: senderId });

    if (!stats) {
      const newStats = await TransactionStats.create([{ userId: senderId }], {
        session,
      });
      stats = newStats[0];
    }

    if (status === "Success") {
      sender.balance -= amount;
      receiver.balance += amount;

      await sender.save({ session });
      await receiver.save({ session });
    }

    const transaction = await Transaction.create([
      {
        sender: senderId,
        receiver: receiverId,
        amount,
        status,
        deviceId: device._id,
        ipAddress: req.ip,
        location: { lat, lon },
      },
    ]);
    const txn = transaction[0];
    await User.findByIdAndUpdate(senderId, {
      $push: { transactions: txn._id },
    });

    if (status === "Success") {
      await User.findByIdAndUpdate(receiverId, {
        $push: { transactions: txn._id },
      });
    }

    const now = new Date();

    if (
      !stats.txnWindow10MStart ||
      now - stats.txnWindow10MStart > 10 * 60 * 1000
    ) {
      stats.txnCountLast10M = 0;
      stats.txnWindow10MStart = now;
    }

    stats.txnCountLast10M += 1;

    if (
      !stats.txnWindow1HStart ||
      now - stats.txnWindow1HStart > 60 * 60 * 1000
    ) {
      stats.txnCountLast1H = 0;
      stats.txnWindow1HStart = now;
    }

    stats.txnCountLast1H += 1;

    stats.avgAmount =
      ((stats.avgAmount || 0) * txnCount + amount) / (txnCount + 1);

    stats.maxAmount = Math.max(stats.maxAmount || 0, amount);
    stats.lastTransactionAt = new Date();
    stats.lastTransactionLocation = { lat, lon };
    stats.lastTransactionAmount = amount;


    if(stats.lastDeviceId !== deviceId) {
      newDevice = crypto.randomBytes(16).toString("hex");
      stats.lastDeviceId = deviceId;
    }

    await stats.save();
//  Notify receiver if online
    

    return res.status(200).json({
      success: true,
      deviceId: stats.lastDeviceId,
      status,
      transaction: transaction[0],
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

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

        withUserEmail: isSender
          ? txn.receiver.email
          : txn.sender.email,

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
        const senderName = `${txn.sender.firstName} ${txn.sender.lastName}`.toLowerCase();
        const receiverName = `${txn.receiver.firstName} ${txn.receiver.lastName}`.toLowerCase();

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