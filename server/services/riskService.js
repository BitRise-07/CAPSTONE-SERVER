const axios = require("axios");
const Transaction = require("../model/Transaction");
const { calculateAnomalyScore } = require("./calculateAnomalyScore.js");
const {finalRuleScore} = require("./ruleEngine.js");  
const mlBaseUrl = process.env.ML_SERVICE_URL || "http://localhost:8000";

function decisionFromRisk(risk, policy) {
  if (risk >= policy.blockThreshold) return { decision: "block", status: "blocked" };
  if (risk >= policy.otpThreshold) return { decision: "otp", status: "pending_otp" };
  return { decision: "allow", status: "approved" };
}

function adaptivePolicy(user) {
  const history = user.behavior?.transactionCount || 0;
  const confidence = Math.min(1, history / 20);

  return {
    otpThreshold: 0.5 - confidence * 0.1,
    blockThreshold: 0.75 - confidence * 0.1,
    profileConfidence: confidence
  };
}

exports.evaluateRisk = async ({ user, features, transactionContext }) => {
  // ML fallback
  //let ml = 0.2;
  const anomaly = calculateAnomalyScore(features);

  const rule = finalRuleScore({
    user,
    features,
    transactionContext
  });

  
  const risk =
 //   0.4 * ml +
    0.3 * rule +
    0.3 * anomaly;

  const finalRisk = Number(Math.min(Math.max(risk, 0), 1).toFixed(4));

  const policy = adaptivePolicy(user);

  return {
    scores: {
   //   ml,
      anomaly,
      rule,
      risk: finalRisk
    },
    adaptivePolicy: policy,
    ...decisionFromRisk(finalRisk, policy),
    explanation: {
      reason: "Hybrid risk (ML + Rule-based)",
      contributions: []
    }
  };
}