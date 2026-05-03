const { calculateAnomalyScore } = require("./calculateAnomalyScore");
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

exports.evaluateRisk = async ({ user, features, transactionContext }) => {

  const rules = evaluateRules({ user, features, transactionContext });

  // 🚨 HARD RULES
  const hard = applyHardRules(rules, user, features, transactionContext);

  if (hard) {
    return {
      decision: hard.decision,
      status: hard.decision === "block" ? "blocked" : "pending_otp",
      scores: null,
      explanation: {
        type: "hard_rule",
        message: hard.reason,
        rules
      }
    };
  }

  // 🔽 SCORING
  const ruleScore = calculateRuleScore(rules);
  const anomaly = calculateAnomalyScore(features);

  const risk = Number(Math.min(1, 0.5 * ruleScore + 0.5 * anomaly).toFixed(4));

  const policy = adaptivePolicy(user);
  const decision = decisionFromRisk(risk, policy);

  return {
    scores: {
      rule: ruleScore,
      anomaly,
      risk,
      note: "Score used only when no critical rule triggered"
    },
    adaptivePolicy: policy,
    ...decision,
    explanation: {
      type: "score_based",
      rules,
      message: "Decision based on rule + anomaly (no ML)"
    }
  };
};