const express = require('express');
const router = express.Router();
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { check, validationResult } = require('express-validator');
const sendMail = require('../utils/sendMail', 'email-confirmation');
const auth = require('../middleware/auth');
const User = require('../models/User');

// @route   POST api/user/register
// @desc    Register user
// @access  Public
router.post(
  '/register',
  [
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Please include a valid email').normalizeEmail().isEmail(),
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
    check('timezone', 'Timezone is required').not().isEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, timezone } = req.body;

    try {
      // see if user exists
      let user = await User.findOne({ email });

      if (user) {
        return res
          .status(400)
          .json({ errors: [{ msg: 'User already exists' }] });
      }

      // get users gravatar
      const profilePhoto = gravatar.url(email, {
        s: '200',
        r: 'pg',
        d: 'mm',
      });

      // create random token for verification email link
      const emailVerificationToken = crypto.randomBytes(20).toString('hex');

      user = new User({
        name,
        email,
        profilePhoto,
        password,
        timezone,
        emailVerificationToken,
      });

      // encrypt the password
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);

      // save user to db
      await user.save();

      // send email
      await sendMail(user, 'email-confirmation');

      // return jsonwebtoken
      const payload = {
        user: {
          id: user.id,
        },
      };

      jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: 360000 },
        (err, token) => {
          if (err) throw err;
          // add also secure: true (Marks the cookie to be used with HTTPS only.)
          res.cookie('token', token, { httpOnly: true, maxAge: 360000000 });
          res.json({ status: true, msg: 'User successfully created!' });
        }
      );
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

// @route   GET api/user/activate/:token
// @desc    Verify activation link
// @access  Public
router.get('/activate/:token', async (req, res) => {
  const emailVerificationToken = req.params.token;

  try {
    const user = await User.findOne({ emailVerificationToken });

    // check if token is valid
    if (!user) {
      return res
        .status(400)
        .json({ errors: [{ msg: 'Invalid activation token' }] });
    }

    if (user.emailVerified) {
      return res
        .status(400)
        .json({ errors: [{ msg: 'Email already verified' }] });
    }

    // set emailVerified to true in user model
    const userFields = {};
    userFields.emailVerified = true;

    await User.findOneAndUpdate(
      { _id: user.id },
      { $set: userFields },
      { new: true }
    );

    // send response
    res.json({ status: true, msg: 'Verification successfull' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('server error');
  }
});

// @route   POST api/user/activate
// @desc    Send mail with activation link again
// @access  Public
router.post('/activate', auth, async (req, res) => {
  try {
    let user = await User.findById(req.user.id).select('-password');

    // check the account is not already verified
    if (user.emailVerified) {
      return res
        .status(400)
        .json({ status: false, msg: 'Email already verified' });
    }

    const userFields = {};

    // create random token for verification email link
    userFields.emailVerificationToken = crypto.randomBytes(20).toString('hex');

    // update user details
    user = await User.findOneAndUpdate(
      { _id: user.id },
      { $set: userFields },
      { new: true }
    );

    // send email again
    await sendMail(user, 'email-confirmation');

    res.json({ status: true, msg: 'Email sent again' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('server error');
  }
});

// @route   POST api/user/forgot
// @desc    Send forgot password email
// @access  Public
router.post(
  '/forgot',
  [check('email', 'Please include a valid email').normalizeEmail().isEmail()],
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;

    try {
      // see if user exists
      let user = await User.findOne({ email });

      if (!user) {
        return res.status(400).json({
          errors: [{ msg: 'The given email does not match our records.' }],
        });
      }

      const userFields = {};
      // create reset password token for forgot email
      userFields.passwordResetToken = crypto.randomBytes(20).toString('hex');
      userFields.passwordResetExpires = Date.now() + 3600000; // 1 hour

      // update user
      user = await User.findOneAndUpdate(
        { _id: user.id },
        { $set: userFields },
        { new: true }
      );

      // send email
      sendMail(user, 'forgot-password');

      // send response
      res.json({
        status: true,
        msg: 'We have emailed your password reset link!',
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('server error');
    }
  }
);

// @route   GET api/user/forgot/:token
// @desc    Check if password forgot token is valid and did not expired
// @access  Public
router.get('/forgot/:token', async (req, res) => {
  const passwordResetToken = req.params.token;

  try {
    const user = await User.findOne({ passwordResetToken })
      .where('passwordResetExpires')
      .gt(Date.now());

    // check if token is valid
    if (!user) {
      return res.status(400).json({
        errors: [{ msg: 'Forgot password token is invalid or has expired' }],
      });
    }

    // send response
    res.json({ status: true, msg: 'Verification successfull' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('server error');
  }
});

// @route   POST api/user/forgot/reset
// @desc    Update password after forgot token was validated
// @access  Public
router.post(
  '/forgot/reset',
  [
    check('email', 'Please include a valid email').normalizeEmail().isEmail(),
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

    const { email, password } = req.body;

    try {
      // see if user exists
      let user = await User.findOne({ email });

      if (!user) {
        return res.status(400).json({
          errors: [{ msg: 'The given email does not match our records.' }],
        });
      }

      const userFields = {};
      // encrypt the password
      const salt = await bcrypt.genSalt(10);
      userFields.password = await bcrypt.hash(password, salt);

      // make undefined the reset token and expiry date
      userFields.passwordResetToken = undefined;
      userFields.passwordResetExpires = undefined;

      // update password
      await User.findOneAndUpdate(
        { _id: user.id },
        { $set: userFields },
        { new: true }
      );

      // send response
      res.json({ status: true, msg: 'Password reset successfully' });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('server error');
    }
  }
);

module.exports = router;
