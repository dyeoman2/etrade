const { eTrade } = require('./auth');

const previewAndPlaceOrder = async ({ accountIdKey, orderAction, symbol, quantity }) => {
  try {
    const clientOrderId = Date.now();
    const tradePayload = {
      accountIdKey,
      orderType: 'EQ',
      order: [
        {
          allOrNone: false,
          priceType: 'MARKET',
          orderTerm: 'GOOD_FOR_DAY',
          marketSession: 'REGULAR',
          Instrument: [
            {
              Product: {
                securityType: 'EQ',
                symbol,
              },
              orderAction,
              quantityType: 'QUANTITY',
              quantity: Math.floor(quantity),
            },
          ],
        },
      ],
      clientOrderId,
    };
    const previewedOrder = await eTrade.previewOrder(tradePayload);
    if (previewedOrder === undefined) return false;

    const placedOrder = await eTrade.placeOrder({
      ...tradePayload,
      previewIds: previewedOrder.PreviewIds,
    });
    return placedOrder.OrderIds[0].orderId;
  } catch (error) {
    console.log(error);
  }
  return false;
};

module.exports = { previewAndPlaceOrder };
