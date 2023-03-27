const { eTrade } = require('./auth');

const getPositions = async (accountIdKey) => {
  const initialPositions = await eTrade
    .viewPortfolio({ accountIdKey })
    .then((res) => res[0].Position);

  return initialPositions.map((el) => {
    const {
      dateAcquired,
      marketValue,
      quantity,
      positionType,
      totalGain,
      totalGainPct,
      Product: product,
    } = el;
    const securityType = product?.securityType || 'N/A';
    return {
      symbol: product?.symbol || 'N/A',
      status: 'Held',
      dateAcquired,
      marketValue,
      quantity,
      totalGain,
      totalGainPct,
      potentialHarvestableLoss:
        securityType === 'EQ' && positionType === 'LONG' && totalGainPct <= -5,
      securityType,
      note: null,
    };
  });
};

module.exports = { getPositions };
