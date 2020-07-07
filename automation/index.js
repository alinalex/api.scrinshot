const puppeteer = require('puppeteer');
const makeid = require('./createFilename');
const launchOptionsMode = { headless: true };
const waitUntil = { waitUntil: 'networkidle0', timeout: 60000 };
const screenshotsPath = 'client/public/resources/screenshots/';
const fs = require('fs');

const run = async (url, id) => {
  try {
    // open the browser and prepare a page
    console.log('am intrat');

    // launchOptionsMode
    const browser = await puppeteer.launch(launchOptionsMode);
    const page = await browser.newPage();

    // set the size of the viewport, so our screenshot will have the desired size
    await page.setViewport({
      width: 1280,
      height: 1024,
    });

    await page.goto(url, waitUntil);

    // create folder if doesn't exist
    const whereToSaveDir = screenshotsPath + id;
    if (!fs.existsSync(screenshotsPath + id)) {
      fs.mkdirSync(whereToSaveDir);
    }

    const screenshotImagePath = whereToSaveDir + '/' + makeid(10) + '.png';

    // save screenshot
    await page.screenshot({
      path: screenshotImagePath,
      fullPage: true,
    });

    // close the browser
    await browser.close();

    console.log('am facut');

    return {
      status: true,
      path: screenshotImagePath,
    };
  } catch (err) {
    console.log(err.message);
    return {
      status: false,
    };
  }
};

module.exports = run;
