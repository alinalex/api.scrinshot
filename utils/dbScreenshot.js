const Screenshot = require('../models/Screenshot');
const User = require('../models/User');

exports.addImageToScreenshot = async (id, path) => {
  try {
    let screenshot = await Screenshot.findById(id);

    if (!screenshot) {
      return false;
    }

    screenshot.images.unshift({ path });
    screenshot.status = true;
    screenshot.error = '';
    await screenshot.save();

    return true;
  } catch (err) {
    return false;
  }
};

exports.getUserEmail = async (id) => {
  try {
    let screenshot = await Screenshot.findById(id);

    if (!screenshot) {
      return false;
    }

    let user = await User.findById(screenshot.user);

    return {
      status: true,
      email: user.email,
    };
  } catch (err) {
    console.log(err.message);
    return {
      status: false,
    };
  }
};

exports.changeScreenshotStatus = async (status, id, error) => {
  try {
    let screenshot = await Screenshot.findById(id);

    if (!screenshot) {
      return false;
    }

    screenshot.status = status;
    screenshot.error = error;

    await screenshot.save();

    return true;
  } catch (err) {
    return false;
  }
};
