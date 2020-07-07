const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { check, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const User = require('../models/User');

// @route   POST api/profile/password
// @desc    Update user password
// @access  Private
router.post(
  '/password',
  [
    auth,
    check('currentPassword', 'Current password is required').not().isEmpty(),
    check('password', 'Please enter a password with 6 or more characters')
      .isLength({ min: 6 })
      .custom((value, { req }) => {
        if (value !== req.body.confirmPassword) {
          // trow error if passwords do not match
          throw new Error("Passwords don't match");
        } else {
          return value;
        }
      }),
  ],
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { currentPassword, password } = req.body;

    try {
      // get user
      let user = await User.findById(req.user.id);

      // check the password is correct
      const isMatch = await bcrypt.compare(currentPassword, user.password);

      if (!isMatch) {
        return res.status(400).json({
          errors: [{ msg: 'The given password does not match our records.' }],
        });
      }

      const userFields = {};
      // encrypt the password
      const salt = await bcrypt.genSalt(10);
      userFields.password = await bcrypt.hash(password, salt);

      // update password
      await User.findOneAndUpdate(
        { _id: user.id },
        { $set: userFields },
        { new: true }
      );

      // send response
      res.json({ status: true, msg: 'Password updated successfully' });
    } catch (err) {
      res.status(500).send('server error');
    }
  }
);

// @route   DELETE api/profile/delete
// @desc    Delete user account
// @access  Private
router.delete('/delete', auth, async (req, res) => {
  try {
    // delete all data regarding the user
    await User.deleteOne({ _id: req.user.id });

    // delete files from user

    res.clearCookie('token', { path: '/' });
    res.json({ status: true, msg: 'Your account has been deleted.' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('server error');
  }
});

// @route   PUT api/profile/personalInfo
// @desc    Update user personal information: name, email
// @access  Private
router.put(
  '/personalInfo',
  [
    auth,
    check('email', 'Please include a valid email').normalizeEmail().isEmail(),
  ],
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email } = req.body;

    try {
      // get user
      let user = await User.findById(req.user.id).select('-password');

      if (!user) {
        return res
          .status(400)
          .json({ errors: [{ msg: 'We could not find a matching user' }] });
      }

      const userFields = {};
      userFields.name = name;
      userFields.email = email;

      // update personal info
      user = await User.findOneAndUpdate(
        { _id: user.id },
        { $set: userFields },
        { new: true }
      ).select('-password');

      // send response
      res.json({
        status: true,
        msg: 'Personal information updated successfully',
        user,
      });
    } catch (err) {
      res.status(500).send('server error');
    }
  }
);

// @route   PUT api/profile/profileDetails
// @desc    Update user profile details: timezone
// @access  Private
router.put('/profileDetails', auth, async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { timezone } = req.body;

  try {
    // get user
    let user = await User.findById(req.user.id).select('-password');

    if (!user) {
      return res
        .status(400)
        .json({ errors: [{ msg: 'We could not find a matching user' }] });
    }

    const userFields = {};
    userFields.timezone = timezone;

    // update profile details
    user = await User.findOneAndUpdate(
      { _id: user.id },
      { $set: userFields },
      { new: true }
    ).select('-password');

    // send response
    res.json({
      status: true,
      msg: 'Profile details updated successfully',
      user,
    });
  } catch (err) {
    res.status(500).send('server error');
  }
});

module.exports = router;
