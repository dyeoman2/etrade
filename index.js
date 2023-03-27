require('dotenv').config();
const { taxLossHarvesting } = require('./helpers/taxLossHarvesting');

module.exports.handler = async (event, context) => {
  // Log the type of event that triggered the Lambda function
  console.log(`Triggered by ${context.invokedFunctionArn}`);

  // Log the event data
  console.log(JSON.stringify(event));

  if (event.source === 'aws.events') {
    try {
      const result = await taxLossHarvesting();
      return result;
    } catch (err) {
      console.error(err);
    }
  }
};
