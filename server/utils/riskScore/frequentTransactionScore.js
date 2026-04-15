const {timeDiff} = require('../calculateTimeDiff.js');

function frequentTransactionScore(stats, currentTime) {
  if (!stats) return 0.2;

  const diff = timeDiff(stats.lastTransactionAt, currentTime);

  let score = 0;

  // 🔥 HIGH PRIORITY → burst in short time (10 min)
  if (stats.txnCountLast10M > 5 && diff < 10) {
    score = 1;
  } else if (stats.txnCountLast10M > 3) {
    score = Math.max(score, 0.6);
  }

  // 🔥 MEDIUM PRIORITY → activity in 1 hour
  if (stats.txnCountLast1H > 10) {
    score = Math.max(score, 0.6);
  } else if (stats.txnCountLast1H > 5) {
    score = Math.max(score, 0.4);
  }

  if (score === 0) score = 0.1;

  return score;
}

module.exports = frequentTransactionScore;