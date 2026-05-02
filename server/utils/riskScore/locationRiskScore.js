// const axios = require("axios");


// async function locationRiskScore(currentLocation, stats) {
//   if (!stats?.lastTransactionLocation) return 0.3;

//   const currentCity = await getCityFromCoords(
//     currentLocation.lat,
//     currentLocation.lon
//   );

//   const lastCity = await getCityFromCoords(
//     stats.lastTransactionLocation.lat,
//     stats.lastTransactionLocation.lon
//   );

//   // 🔥 compare cities
//   if (currentCity === "Unknown" || lastCity === "Unknown") {
//     return 0.4;
//   }

//   if (currentCity !== lastCity) {
//     return 0.4; // different city → suspicious
//   }

//   return 0.1; // same city → safe
// }

// async function getCityFromCoords(lat, lon) {
//   try {
//     const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`;

//     const res = await axios.get(url, {
//       headers: {
//         "User-Agent": "fraud-detection-app"
//       }
//     });

//     const address = res.data.address;

//     return (
//       address.city ||
//       address.town ||
//       address.village ||
//       address.state ||
//       "Unknown"
//     );

//   } catch (err) {
//     console.error("Geo error:", err.message);
//     return "Unknown";
//   }
// }

// module.exports = locationRiskScore;