const { modelSecurities } = require('../data/modelSecurities');
const { previewAndPlaceOrder } = require('./etrade/previewPlaceOrder');
const { securitiesSoldLastThirtyDays } = require('./etrade/transactions');
const { getPositions } = require('./etrade/positions');
const { isOrderExecuted } = require('./etrade/orderStatus');
const { eTrade, setToken } = require('./etrade/auth');
const { tlhFailedEmail, tlhSummaryEmail } = require('./email');

const accountIdKey = process.env.ETRADE_ACCOUNT_ID;

const wait = (seconds) => new Promise((resolve) => setTimeout(resolve, seconds * 1000));

const taxLossHarvesting = async () => {
  try {
    await setToken();

    const positions = await getPositions(accountIdKey);

    const washSalePositions = await securitiesSoldLastThirtyDays(accountIdKey);
    console.log('wash sale positions', washSalePositions);

    // check for available securities to buy
    const tradingSummary = await Promise.all(
      positions.map(async (position) => {
        let { marketValue, potentialHarvestableLoss, quantity, securityType, symbol } = position;

        // exclude if the positon is a non-equity securities (optional)
        if (securityType !== 'EQ') return { ...position, note: 'not an equity security' };

        // exclude if the position doesn't have a loss or the loss isn't large enough
        if (!potentialHarvestableLoss)
          return { ...position, note: 'no losses available to harvest' };

        // check if position is in a model
        const securityInModel = modelSecurities.find((el) => el.ticker === symbol);
        // exclude if the position doesn't have a model
        if (!securityInModel) return { ...position, note: 'no model holds this security' };

        // target securities to buy
        const targetSecurities = modelSecurities
          .filter((el) => el.sleeve === securityInModel.sleeve && el.ticker !== symbol)
          .sort((a, b) => a.rank - b.rank);

        // exclude if the position doesn't have alternate securities in the model
        if (!targetSecurities?.length) {
          return { ...position, note: 'no alternate securities in model' };
        }

        // target securities that don't have wash sale restrictions
        const availableSecurities = targetSecurities.filter(
          (el) => !washSalePositions.includes(el.ticker)
        );

        // exclude if all of the position's alternate securities in the model have wash sale restrictions
        if (!availableSecurities?.length) {
          return {
            ...position,
            note: 'alternate securities have wash buy restrictions',
          };
        }

        // place sell order
        const sellOrderId = await previewAndPlaceOrder({
          accountIdKey,
          orderAction: 'SELL',
          symbol,
          quantity,
        });

        // exclude if the position's sell order is not accepted
        if (!sellOrderId) return { ...position, note: 'sell order not accepted' };

        // wait for sell order to execute
        await wait(45);

        // check sell order status
        const sellExecuted = await isOrderExecuted({
          accountIdKey,
          orderId: sellOrderId,
          transactionType: 'SELL',
        });

        // exclude if the position's sell order is not executed
        if (!sellExecuted) return { ...position, note: 'sell order failed' };

        // get quote for security to buy
        const securityToBuy = availableSecurities[0].ticker;
        const quote = await eTrade.getQuotes({ symbols: [securityToBuy] });
        const bid = quote?.All?.bid || false;
        if (!bid) return { ...position, note: 'quote not available' };

        const buyQuantity = Math.floor(marketValue / bid);

        // place buy order
        const buyOrderId = await previewAndPlaceOrder({
          accountIdKey,
          orderAction: 'BUY',
          symbol: securityToBuy,
          quantity: buyQuantity,
        });

        const failedBuyPayload = {
          ...position,
          status: 'Sold',
          targetSymbol: securityToBuy,
          targetQuantity: buyQuantity,
        };

        // buy order not accepted
        if (!buyOrderId) return { ...failedBuyPayload, note: 'buy order not accepted' };

        // wait for buy order to execute
        await wait(45);

        // check for successful buy
        const buyExecuted = await isOrderExecuted({
          accountIdKey,
          orderId: buyOrderId,
          transactionType: 'BUY',
        });

        // buy order not executed
        if (!buyExecuted) return { ...failedBuyPayload, note: 'buy order not executed' };

        // add to trading summary
        return {
          ...position,
          status: 'Sold and replaced',
          targetSymbol: securityToBuy,
          targetQuantity: buyQuantity,
          note: 'success',
        };
      })
    );
    await tlhSummaryEmail(tradingSummary);
    return tradingSummary;
  } catch (error) {
    console.log('error', error.message);
    await tlhFailedEmail(error.message);
    return error.message;
  }
};

module.exports = { taxLossHarvesting };
