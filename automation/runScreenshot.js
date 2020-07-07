const screenshotMaker = require('../automation');
const sendMail = require('../utils/sendMail');
const {
  addImageToScreenshot,
  getUserEmail,
  changeScreenshotStatus,
} = require('../utils/dbScreenshot');
const letsTakeaScreenshot = async (url, id) => {
  const res = await screenshotMaker(url, id);
  return res;
};

const runScreenshot = async (url, id) => {
  // run screenshot
  const res = await letsTakeaScreenshot(url, id);

  // get user email
  const emailRes = await getUserEmail(id);

  if (res.status) {
    // save image screenshot to db
    const dbUpdateRes = await addImageToScreenshot(id, res.path);
    if (!dbUpdateRes) {
      await sendMail(null, 'email-cron-image-update-error');
    } else {
      if (emailRes.status) {
        // send email to user
        await sendMail({ email: emailRes.email }, 'email-screenshot-is-ready');
      }
    }

    return true;
  } else {
    // send error email to admin
    // await sendMail(null, 'email-cron-error');

    if (emailRes.status) {
      // send error email to user
      await sendMail({ email: emailRes.email }, 'email-url-is-not-valid');
    }

    // changes status to false (paused)
    changeScreenshotStatus(false, id, 'URL is not valid');

    return false;
  }
};

module.exports = runScreenshot;
