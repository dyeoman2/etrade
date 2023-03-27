const { ETrade } = require('e-trade-api');
const chromium = require('@sparticuz/chrome-aws-lambda');
const puppeteer = chromium.puppeteer;

const eTrade = new ETrade({
  key: process.env.ETRADE_API_KEY,
  secret: process.env.ETRADE_API_SECRET,
  mode: 'prod',
});

const getNewToken = async () => {
  let browser;
  try {
    const requestTokenResults = await eTrade.requestToken();
    console.log('token request completed');

    // open puppeter browser
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath,
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    });

    // set page
    const page = await browser.newPage();
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36'
    );

    // login page
    await page.goto(requestTokenResults.url, { waitUntil: 'networkidle2' });
    await page.waitForSelector('[name="USER"]');

    const warningInitial = await page.$$eval('[class="universal-message-heading"]', (items) =>
      items.map((item) => item.innerText)
    );
    console.log('warningInitial', warningInitial);

    const username = process.env.ETRADE_USER;
    await page.type('[name="USER"]', username);
    await page.$eval('[name="USER"]', (el) => el.value);

    const password = process.env.ETRADE_PASSWORD;
    await page.type('[name="PASSWORD"]', password);
    await page.$eval('[name="PASSWORD"]', (el) => el.value);

    const urlInitial = await page.url();
    console.log('urlInitial', urlInitial);

    await page.click('#logon_button');
    await page.waitForTimeout(3000);

    const warningEnd = await page.$$eval('[class="universal-message-heading"]', (items) =>
      items.map((item) => item.innerText)
    );
    console.log('warningEnd', warningEnd);

    const urlEnd = await page.url();
    console.log('urlEnd', urlEnd);

    // terms page
    await page.waitForSelector('[class="api-title"]');
    const terms = await page.$eval('[class="api-title"]', (el) => el.innerText);
    console.log('terms', terms);
    await page.waitForSelector('[name="submit"]');
    await page.click('[name="submit"]');
    await page.waitForTimeout(3000);

    // verification code page
    const verificationCode = await page.$eval('[type="text"]', (el) => el.value);

    const accessTokenResults = await eTrade.getAccessToken({
      key: requestTokenResults.oauth_token,
      secret: requestTokenResults.oauth_token_secret,
      code: verificationCode,
    });

    const { oauth_token, oauth_token_secret } = accessTokenResults;

    setAccessToken(oauth_token, oauth_token_secret);

    await browser.close();
  } catch (error) {
    console.log('error', error);
  }
};

const setAccessToken = (oauth_token, oauth_token_secret) => {
  console.log('setAccessToken');
  eTrade.settings.accessToken =
    oauth_token === undefined ? process.env.ETRADE_OAUTH_TOKEN : oauth_token;
  eTrade.settings.accessSecret =
    oauth_token_secret === undefined ? process.env.ETRADE_OAUTH_TOKEN_SECRET : oauth_token_secret;
};

const setToken = async () => {
  try {
    const auth = process.env.ETRADE_OAUTH_TOKEN_ACTIVE === 'true';
    console.log('auth', auth);
    if (!auth) await getNewToken();
    else setAccessToken();
  } catch (error) {
    console.log('error', error);
  }
};

module.exports = { eTrade, setToken };
