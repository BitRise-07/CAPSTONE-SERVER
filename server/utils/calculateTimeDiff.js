function timeDiff(lastTime, currentTime) {
  if (!lastTime) return Infinity;

  const diffMs = new Date(currentTime) - new Date(lastTime);
  return diffMs / (1000 * 60);
}

module.exports = timeDiff;``