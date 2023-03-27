const { mmddyyyy } = require('../../util/dates');
const { eTrade } = require('./auth');

const isOrderExecuted = async ({ accountIdKey, orderId, transactionType }) => {
  let executed = false;
  try {
    const orders = await eTrade
      .listOrders({
        accountIdKey,
        fromDate: mmddyyyy(),
        toDate: mmddyyyy(),
        transactionType,
      })
      .then((res) => res.Order);
    const order = orders.find((el) => el.orderId === orderId);
    executed = order.OrderDetail[0].status === 'EXECUTED';
  } catch (error) {
    console.log('error', error);
  }
  console.log('executed', executed);
  return executed;
};

module.exports = { isOrderExecuted };
