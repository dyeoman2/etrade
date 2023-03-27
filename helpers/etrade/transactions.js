const { mmddyyyy, thirtyOneDaysAgo } = require('../../util/dates');
const { eTrade } = require('./auth');

const getTransactions = async ({ accountIdKey, startDate, endDate }) => {
  const transactions = [];
  try {
    const fetchTransactions = async (marker) => {
      const trns = await eTrade.listTransactions({
        accountIdKey,
        startDate,
        endDate,
        marker,
      });
      transactions.push(...trns.Transaction);
      if (trns.next) await fetchTransactions(trns.marker);
      return trns;
    };
    await fetchTransactions();
  } catch (error) {
    console.log(error);
  }
  return transactions;
};

const securitiesSoldLastThirtyDays = async (accountIdKey) => {
  const startDate = mmddyyyy(thirtyOneDaysAgo);
  const endDate = mmddyyyy();
  const transactions = await getTransactions({ accountIdKey, startDate, endDate });
  const sellTransactions = transactions.filter((t) => t.transactionType === 'Sold');
  const soldSecurities = sellTransactions.map((t) => t.brokerage.product.symbol);
  return soldSecurities;
};

module.exports = { getTransactions, securitiesSoldLastThirtyDays };
