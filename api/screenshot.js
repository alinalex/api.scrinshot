const express = require('express');
const fs = require('fs');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const Screenshot = require('../models/Screenshot');
const User = require('../models/User');
const { setCron, updateCron, deleteCron } = require('../cron');
const screenshotsPath = 'client/public/resources/screenshots/';
const { cronHourAndMinute } = require('../utils/cronTime');
// const screenshotMaker = require('../automation');
// const letsTakeaScreenshot = async (url, id) => {
//   const res = await screenshotMaker(url, id);
//   return res;
// };

// @route   POST api/screenshot/
// @desc    Add screenshot
// @access  Private
router.post(
  '/',
  [
    auth,
    check('url', 'Website URL is required').not().isEmpty(),
    check('title', 'Website title is required').not().isEmpty(),
    check('frequency', 'Frequency is required').not().isEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { url, title, frequency } = req.body;

    try {
      // get user
      let user = await User.findById(req.user.id);

      if (!user) {
        return res
          .status(400)
          .json({ errors: [{ msg: 'We could not find a matching user' }] });
      }

      // see if screenshot exists
      let screenshot = await Screenshot.find({
        $or: [{ url }, { title }],
        user: req.user.id,
      });

      if (screenshot.length) {
        return res.status(400).json({
          errors: [
            {
              msg:
                'A screenshot with the url or title you entered already exists. Please use different url or titles.',
            },
          ],
        });
      }

      // create screenshot to be saved
      screenshot = new Screenshot({
        url,
        title,
        frequency,
        user: req.user.id,
      });

      // save screenshot to db
      await screenshot.save();

      const time = cronHourAndMinute();

      // create cron job
      await setCron(screenshot._id.toString(), time, url);

      // send response
      res.json({
        status: true,
        msg: 'Screenshot created successfully',
        screenshot,
      });
    } catch (err) {
      console.error('error de la catch de la api post: ' + err.message);
      res.status(500).json({
        errors: [
          {
            msg: 'An error occured, please try again later.',
          },
        ],
      });
    }
  }
);

// @route   PUT api/screenshot/:screenshot_id
// @desc    Edit screenshot
// @access  Private
router.put(
  '/:screenshot_id',
  [
    auth,
    check('url', 'Website URL is required').not().isEmpty(),
    check('title', 'Website title is required').not().isEmpty(),
    check('frequency', 'Frequency is required').not().isEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { url, title, frequency } = req.body;

    try {
      // get user
      let user = await User.findById(req.user.id);

      // check if user exists
      if (!user) {
        return res
          .status(400)
          .json({ errors: [{ msg: 'We could not find a matching user' }] });
      }

      // check if screenshot exists
      let screenshot = await Screenshot.findById(req.params.screenshot_id);

      if (!screenshot) {
        return res.status(400).json({
          errors: [
            {
              msg: 'We could not find a matching screenshot',
            },
          ],
        });
      }

      const screenshotFields = {
        url,
        title,
        frequency,
      };

      // update screenshot
      screenshot = await Screenshot.findOneAndUpdate(
        { _id: req.params.screenshot_id },
        { $set: screenshotFields },
        { new: true }
      );

      // update cron
      const time = cronHourAndMinute();
      await updateCron(req.params.screenshot_id, time, url);

      // send response
      res.json({
        status: true,
        msg: 'Screenshot updated successfully',
        screenshot,
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({
        errors: [
          {
            msg: 'An error occured, please try again later.',
          },
        ],
      });
    }
  }
);

// @route   DELETE api/screenshot/:screenshot_id
// @desc    Delete screenshot
// @access  Private
router.delete('/:screenshot_id', auth, async (req, res) => {
  try {
    // get user
    let user = await User.findById(req.user.id);

    if (!user) {
      return res
        .status(400)
        .json({ errors: [{ msg: 'We could not find a matching user' }] });
    }

    // check if screenshot exists
    let screenshot = await Screenshot.findById(req.params.screenshot_id);

    if (!screenshot) {
      return res.status(400).json({
        errors: [
          {
            msg: 'We could not find a matching screenshot',
          },
        ],
      });
    }

    // delete screenshot images folder
    const dir = screenshotsPath + req.params.screenshot_id;
    try {
      fs.rmdirSync(dir, { recursive: true });

      console.log(`${dir} is deleted!`);
    } catch (err) {
      console.error(`Error while deleting ${dir}.`);
    }

    // delete screenshot
    await Screenshot.deleteOne({ _id: req.params.screenshot_id });

    // delete cron
    await deleteCron(req.params.screenshot_id);

    // send response
    res.json({
      status: true,
      msg: 'Screenshot deleted successfully',
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      errors: [
        {
          msg: 'An error occured, please try again later.',
        },
      ],
    });
  }
});

// @route   GET api/screenshot/
// @desc    Add screenshot
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    // get user
    let user = await User.findById(req.user.id);

    if (!user) {
      return res
        .status(400)
        .json({ errors: [{ msg: 'We could not find a matching user' }] });
    }

    // to do
    const screenshots = await Screenshot.find({ user: req.user.id });

    // send response
    res.json({
      screenshots,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      errors: [
        {
          msg: 'An error occured, please try again later.',
        },
      ],
    });
  }
});

module.exports = router;
