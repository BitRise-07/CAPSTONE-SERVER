const axios = require("axios");

exports.getCity = async (lat, lng) => {
  const apiKey = process.env.GEOCODING_API;

  const res = await axios.get(
    `https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lng}&key=${apiKey}`
  );

  return res.data.results[0]?.components?.city ||
         res.data.results[0]?.components?.town ||
         res.data.results[0]?.components?.village;
}

