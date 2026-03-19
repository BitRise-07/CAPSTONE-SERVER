
const mongoose = require("mongoose");
const Transaction = require("../models/Transaction");
const User = require("../models/User");
const Notification = require("../models/Notification");
const TransactionStats = require("../models/TransactionStats");
const Device = require("../models/Device");
const { io, onlineUsers } = require("../server");

// ================= TRANSFER MONEY =================
exports.transferMoney = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const senderId = req.user._id;

    // ✅ From Fraud Middleware
    const status = req.user.status || "Success";
    const fraudReason = req.user.fraudReason || [];

    const { receiverId, amount, lat, lon } = req.body;

    // ================= VALIDATION =================
    if (!receiverId || !amount) {
      throw new Error("Receiver and amount required");
    }

    const sender = await User.findById(senderId).session(session);
    const receiver = await User.findById(receiverId).session(session);

    if (!receiver) throw new Error("Receiver not found");
    if (sender.balance < amount) throw new Error("Insufficient balance");

    // ================= DEVICE CHECK =================
    let device = await Device.findOne({
      userId: senderId,
      deviceId: req.headers["device-id"],
    });

    if (!device) {
      const newDevice = await Device.create(
        [{
          userId: senderId,
          deviceId: req.headers["device-id"],
          ipAddress: req.ip,
          isTrusted: false,
        }],
        { session }
      );
      device = newDevice[0];
    }

    // ================= STATS =================
    let stats = await TransactionStats.findOne({ userId: senderId });

    if (!stats) {
      const newStats = await TransactionStats.create(
        [{ userId: senderId }],
        { session }
      );
      stats = newStats[0];
    }

    // ================= MONEY TRANSFER =================
    if (status === "Success") {
      sender.balance -= amount;
      receiver.balance += amount;

      await sender.save({ session });
      await receiver.save({ session });
    }

    // ================= CREATE TRANSACTION =================
    const transaction = await Transaction.create(
      [{
        sender: senderId,
        receiver: receiverId,
        amount,
        status,
        deviceId: device._id,
        ipAddress: req.ip,
        location: { lat, lon },
      }],
      { session }
    );

    const txnCount = stats.txnCountLast24Hr || 0;

    stats.avgAmount =
      ((stats.avgAmount || 0) * txnCount + amount) / (txnCount + 1);

    stats.maxAmount = Math.max(stats.maxAmount || 0, amount);
    stats.txnCountLast1Hr = (stats.txnCountLast1Hr || 0) + 1;
    stats.txnCountLast24Hr = txnCount + 1;
    stats.lastTransactionAt = new Date();
    stats.lastTransactionLocation = { lat, lon };

    await stats.save({ session });

    const notifications = [];

    // sender
    notifications.push({
      user: senderId,
      message:
        status === "Success"
          ? `₹${amount} sent successfully`
          : `⚠️ Transaction flagged: ${fraudReason.join(", ")}`,
      type: status === "Fraud" ? "FRAUD" : "INFO",
    });

    // receiver
    if (status === "Success") {
      notifications.push({
        user: receiverId,
        message: `₹${amount} received`,
        type: "INFO",
      });
    }

    await Notification.insertMany(notifications, { session });

    await session.commitTransaction();
    session.endSession();

    const senderSocket = onlineUsers.get(senderId.toString());
    const receiverSocket = onlineUsers.get(receiverId.toString());

    if (senderSocket) {
      io.to(senderSocket).emit("transactionUpdate", {
        status,
        amount,
        balance: sender.balance,
      });
    }

    if (receiverSocket && status === "Success") {
      io.to(receiverSocket).emit("moneyReceived", {
        amount,
        balance: receiver.balance,
      });
    }

    if (status === "Fraud" && senderSocket) {
      io.to(senderSocket).emit("fraudAlert", {
        message: fraudReason.join(", "),
      });
    }

    return res.status(200).json({
      success: true,
      status,
      transaction: transaction[0],
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();

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
      .populate("sender", "name email")
      .populate("receiver", "name email")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Transaction.countDocuments({
      $or: [{ sender: userId }, { receiver: userId }],
    });

    return res.status(200).json({
      success: true,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
      transactions,
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
    // ✅ Optional: check admin
    if (req.user.accountType !== "Admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin only.",
      });
    }

    const { page = 1, limit = 10, status } = req.query;

    const filter = {};
    if (status) {
      filter.status = status; // Success / Fraud / Failed
    }

    const transactions = await Transaction.find(filter)
      .populate("sender", "name email")
      .populate("receiver", "name email")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Transaction.countDocuments(filter);

    return res.status(200).json({
      success: true,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
      transactions,
    });

  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch all transactions",
    });
  }
};

