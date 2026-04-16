const generateIFSC = (city) => {
  const bankCode = "VDBW";
  const cityCode = city.substring(0, 3).toUpperCase();
  return `${bankCode}0${cityCode}001`;
};

module.exports = generateIFSC;