// const {getDistanceKm} = require("../getDistanceKm.js");
// const timeDiff = require("../calculateTimeDiff.js");

// function velocityRiskScore(stats, currentLocation, currentTime) {
//   if (!stats?.lastTransactionAt || !stats?.lastTransactionLocation) {
//     return 0.2;
//   }

//   const diffMinutes = timeDiff(stats.lastTransactionAt, currentTime);
//   const diffHours = diffMinutes / 60;

//   if (diffHours === 0) return 1; 

//   // 🌍 distance (km)
//   const distance = getDistanceKm(
//     currentLocation.lat,
//     currentLocation.lon,
//     stats.lastTransactionLocation.lat,
//     stats.lastTransactionLocation.lon
//   );

//   const speed = distance / diffHours;


//   if (speed > 900) return 1;

//   if (speed > 600) return 0.9;

//   if (speed > 200) return 0.7;

//   if (speed > 100) return 0.4;

//   return 0.1;
// }

// module.exports = velocityRiskScore