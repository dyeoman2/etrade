# Automated Tax Loss Harvesting at eTrade

This repository contains a Node.js script that implements a daily cron job for tax loss harvesting at etrade. The script sells securities with harvestable losses and replaces them with similar securities that you define in `./data/modelSecurities.js`.

The goal is to produce stronger after-tax returns. For more details on the potential tax benefits of tax loss harvesting, please contact a financial professional or view this article from the [CFA institute](https://www.cfainstitute.org/en/research/financial-analysts-journal/2020/empirical-evaluation-tax-loss-harvesting-alpha).

### Environment variables

Before running the script, you need to set up your environment variables. Rename `.env.sample` to `.env` and update the environment variables per the instructions in the file.

### AWS Simple Email Service (SES)

This project sends a summary email that shows you what trades occurred and lets you know if there were any errors. In order for the emails to work, you will need to add your email as an identity in [SES](https://aws.amazon.com/ses/). In order for the emails to work when running locally, you will need to install the [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-getting-started.html).

### Automated AWS deployments with the Serverless Framework and Github

We use the Serverless Framework to have our infrastructure needs laid out in our code `serverless.yml` and to automate our deployments from our GitHub repository to our AWS Lambda function. Here are the general steps to make this happen:

1. Install the Serverless CLI

```
npm install -g serverless
```

2. Login to the Serverless dashboard

```
serverless login
```

3. To create the project in the Serverless framework, run the command below, and then follow the CLI prompts.

```
serverless
```

4. In the Serverless Dashboard, go to the CI/CD section of your project and connect your AWS and GitHub accounts. Once connected, any pushes to your GitHub repository will be deployed to AWS. More information about setting this up can be found in this [guide](https://www.serverless.com/framework/docs/guides/cicd).

5. Add the environment variables from your `.env` file to the parameters section in the Serverless dashboard or via the [Serverless CLI](https://www.serverless.com/framework/docs/guides/parameters#cli-parameters). This will pass the environment variables to the Lambda function when you deploy your code.

6. Deploy to AWS by pushing your code to GitHub or running the CLI command below

```
serverless deploy
```

### Local invocation

1. Use [nvm](https://github.com/nvm-sh/nvm#install--update-script) to set your local node environment version 14. If you deploy different versions on node, the deployment will fail.

2. Install the packages

```
npm install
```

3. Invoke the function

```
serverless invoke local --function tlh
```

### Disclaimer

Please be aware that the information provided in this code is for informational purposes only and is not intended to be investment or financial advice. Any actions taken based on the information provided in this code are taken at the user's own risk. The author and any associated parties make no representations or warranties as to the accuracy or completeness of the information provided in this code.
