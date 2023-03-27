const { usDateFormat } = require('../util/dates');
const { formatCurrency, formatPercentage, round } = require('../util/numbers');
const { SES } = require('@aws-sdk/client-ses');

// connect to ses
const ses = new SES({});

exports.tlhSummaryEmail = (tradeSummary) => {
  let subject = 'TLH Report - ';

  const successfulTrade = tradeSummary.some((trade) => trade.status === 'sold and replaced');
  if (successfulTrade) subject += 'Trades Successful';

  const sellFailedStatuses = ['sell order not accepted', 'sell order not executed'];
  const sellFailed = tradeSummary.some((trade) => sellFailedStatuses.includes(trade.status));
  if (sellFailed) subject += 'Sells Failed';

  const buyFailedStatuses = ['buy order not accepted', 'buy order not executed'];
  const buyFailed = tradeSummary.some((trade) => buyFailedStatuses.includes(trade.status));
  if (buyFailed) subject += 'Buys Failed';

  if (!successfulTrade && !sellFailed && !buyFailed) subject += 'No Trades';

  const showTargetSecurity = successfulTrade || buyFailed;

  const params = {
    Source: `TLH Bot <${process.env.EMAIL_FROM}>`,
    Destination: {
      ToAddresses: [process.env.EMAIL_TO],
    },
    ReplyToAddresses: [process.env.EMAIL_TO],
    Message: {
      Body: {
        Html: {
          Charset: 'UTF-8',
          Data: `
            <html>
              <p>Here is the TLH summary</p>
              <table>
                <tr>
                  <th style="text-align: center;">Symbol</th>
                  <th style="text-align: center;">Status</th>
                  <th style="text-align: center;">Date Acquired</th>
                  <th style="text-align: center;">Market Value</th>
                  <th style="text-align: center;">Quantity</th>
                  <th style="text-align: center;">Total Gain</th>
                  <th style="text-align: center;">Total Gain %</th>
                  <th style="text-align: center;">Potential Harvestable Loss</th>
                  ${showTargetSecurity ? `<th style="text-align: center;">Target Symbol</th>` : ''}
                  ${
                    showTargetSecurity ? `<th style="text-align: center;">Target Quantity</th>` : ''
                  }
                  <th style="text-align: center;">Note</th>
                </tr>
                ${tradeSummary
                  .map((trade) => {
                    return `
                    <tr>
                      <td>${trade.symbol}</td>
                      <td>${trade.status}</td>
                      <td>${usDateFormat(trade.dateAcquired)}</td>
                      <td>${formatCurrency(trade.marketValue)}</td>
                      <td>${round(trade.quantity)}</td>
                      <td>${formatCurrency(trade.totalGain)}</td>
                      <td>${formatPercentage(trade.totalGainPct / 100)}</td>
                      <td>${formatCurrency(trade.potentialHarvestableLoss)}</td>
                      ${trade.targetSymbol ? `<td>${trade.targetSymbol}</td>` : ''}
                      ${trade.targetQuantity ? `<td>${trade.targetQuantity}</td>` : ''}
                      <td>${trade.note}</td>
                    </tr>
                  `;
                  })
                  .join('')}
              </table>
            </html>
          `,
        },
      },
      Subject: {
        Charset: 'UTF-8',
        Data: subject,
      },
    },
  };

  return ses.sendEmail(params);
};

exports.tlhFailedEmail = (errorMessage) => {
  const params = {
    Source: `TLH Bot <${process.env.EMAIL_FROM}>`,
    Destination: {
      ToAddresses: [process.env.EMAIL_TO],
    },
    ReplyToAddresses: [process.env.EMAIL_TO],
    Message: {
      Body: {
        Html: {
          Charset: 'UTF-8',
          Data: `
            <html>
              <p>The tax loss harvest failed to run</p>
              <p>Error: ${errorMessage}</p>
            </html>
          `,
        },
      },
      Subject: {
        Charset: 'UTF-8',
        Data: 'TLH Report - Failed to run',
      },
    },
  };

  return ses.sendEmail(params);
};
