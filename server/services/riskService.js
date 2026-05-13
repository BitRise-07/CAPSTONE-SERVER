const { calculateAnomalyScore } = require("./calculateAnomalyScore");
const axios = require("axios");
const {
  evaluateRules,
  applyHardRules,
  calculateRuleScore
} = require("./ruleEngine");

function adaptivePolicy(user) {
  const tx = user.behavior?.transactionCount || 0;

  let confidence = 0.2;
  if (tx > 50) confidence = 1;
  else if (tx > 20) confidence = 0.8;
  else if (tx > 5) confidence = 0.5;

  return {
    otpThreshold: 0.6 - confidence * 0.2,
    blockThreshold: 0.8 - confidence * 0.2,
    profileConfidence: confidence
  };
}

function decisionFromRisk(risk, policy) {
  if (risk >= policy.blockThreshold) return { decision: "block", status: "blocked" };
  if (risk >= policy.otpThreshold) return { decision: "otp", status: "pending_otp" };
  return { decision: "allow", status: "approved" };
}

function hardDecisionScore(hard) {
  if (!hard) return 0;
  if (hard.decision === "block") return 1;
  if (hard.decision === "otp") return 0.75;
  return 0;
}

async function getMlScore(features) {
  try {
    const { data } = await axios.post(
      `${process.env.ML_SERVICE_URL || "http://localhost:5000"}/predict`,
      { features },
      { timeout: 2500 }
    );

    return {
      score: Number(Number(data.fraud_probability || 0).toFixed(4)),
      threshold: data.threshold,
      available: true,
    };
  } catch (error) {
    return {
      score: 0,
      threshold: null,
      available: false,
      error: "ML service unavailable",
    };
  }
}

exports.evaluateRisk = async ({ user, features, transactionContext }) => {

  const rules = evaluateRules({ user, features, transactionContext });
  const ruleScore = calculateRuleScore(rules);
  const anomaly = calculateAnomalyScore(features);
  const ml = await getMlScore(features);

  // 🚨 HARD RULES
  const hard = applyHardRules(rules, user, features, transactionContext);

  if (hard) {
    const hardScore = hardDecisionScore(hard);
    const risk = Number(Math.max(hardScore, ruleScore, anomaly, ml.score).toFixed(4));

    return {
      decision: hard.decision,
      status: hard.decision === "block" ? "blocked" : "pending_otp",
      scores: {
        ml: ml.score,
        anomaly,
        rule: Number(Math.max(ruleScore, hardScore).toFixed(4)),
        graph: risk,
        risk,
      },
      explanation: {
        type: "hard_rule",
        reason: hard.reason,
        message: "Rule engine made the final decision. ML score is stored for review and graphing.",
        mlMessage: ml.available
          ? `ML fraud probability ${ml.score} at threshold ${ml.threshold}`
          : ml.error,
        rules
      }
    };
  }

  // 🔽 SCORING
  const risk = ml.available
    ? Number(Math.min(1, 0.45 * ruleScore + 0.25 * anomaly + 0.3 * ml.score).toFixed(4))
    : Number(Math.min(1, 0.5 * ruleScore + 0.5 * anomaly).toFixed(4));

  const policy = adaptivePolicy(user);
  const decision = decisionFromRisk(risk, policy);

  return {
    scores: {
      ml: ml.score,
      rule: ruleScore,
      anomaly,
      risk,
      graph: risk,
    },
    adaptivePolicy: policy,
    ...decision,
    explanation: {
      type: "score_based",
      reason: decision.decision === "allow" ? "Risk below OTP threshold" : "Combined risk crossed policy threshold",
      rules,
      message: ml.available
        ? "Decision based on weighted rule, anomaly, and ML scores."
        : "Decision based on rule + anomaly scores because ML service was unavailable.",
      mlMessage: ml.available
        ? `ML fraud probability ${ml.score} at threshold ${ml.threshold}`
        : ml.error,
    }
  };
};
