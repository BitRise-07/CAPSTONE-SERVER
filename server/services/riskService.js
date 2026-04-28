import axios from "axios";
import Transaction from "../model/Transaction.js";
import { finalRuleScore } from "./ruleEngine.js";
import { calculateAnomalyScore } from "./calculateAnomalyScore.js";

const mlBaseUrl = process.env.ML_SERVICE_URL || "http://localhost:8000";

// ✅ Decision logic
function decisionFromRisk(risk, policy) {
  if (risk >= policy.blockThreshold) return { decision: "block", status: "blocked" };
  if (risk >= policy.otpThreshold) return { decision: "otp", status: "pending_otp" };
  return { decision: "allow", status: "approved" };
}

// ✅ Adaptive policy
function adaptivePolicy(user) {
  const history = user.behavior?.transactionCount || 0;
  const confidence = Math.min(1, history / 20);

  return {
    otpThreshold: 0.5 - confidence * 0.1,
    blockThreshold: 0.75 - confidence * 0.1,
    profileConfidence: confidence
  };
}

// ✅ Main risk engine
export async function evaluateRisk({ user, features, transactionContext }) {
  // ML fallback
  let ml = 0.2;
  const anomaly = calculateAnomalyScore(features);

  // try {
  //   const { data } = await axios.post(`${mlBaseUrl}/predict`, {
  //     features
  //   });

  //   ml = data?.fraud_probability || 0.2;
  // } catch {}

  // ✅ RULE SCORE (YOUR OLD LOGIC)
  const rule = finalRuleScore({
    user,
    features,
    transactionContext
  });

  // FINAL COMBINED RISK
  const risk =
    0.4 * ml +
    0.3 * rule +
    0.3 * anomaly;

  const finalRisk = Number(Math.min(Math.max(risk, 0), 1).toFixed(4));

  const policy = adaptivePolicy(user);

  return {
    scores: {
      ml,
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