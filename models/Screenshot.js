const mongoose = require('mongoose');

const ScreenshotSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
  },
  url: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  frequency: {
    type: String,
    required: true,
  },
  status: {
    type: Boolean,
    default: true,
  },
  error: {
    type: String,
    default: '',
  },
  images: [
    {
      path: {
        type: String,
        required: true,
      },
    },
  ],
  date: {
    type: Date,
    default: Date.now,
  },
});

module.exports = Screenshot = mongoose.model('screenshot', ScreenshotSchema);
