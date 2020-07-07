const express = require('express');
var cors = require('cors');
const dotenv = require('dotenv');
const userRouter = require('./api/user');
const authRouter = require('./api/auth');
const profileRouter = require('./api/profile');
const screenshotRouter = require('./api/screenshot');
const cookieParser = require('cookie-parser');
const automate = require('./cron');

// Load environment variables from .env file, where API keys and passwords are configured. It also has this possibility: { path: "filename" }
dotenv.config();

// connect database
const connectDB = require('./config/db');
connectDB();

const app = express();

// init middleware
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());

// define api routes
app.use('/api/user', userRouter);
app.use('/api/auth', authRouter);
app.use('/api/profile', profileRouter);
app.use('/api/screenshot', screenshotRouter);

// const letsAutomate = async (id, time, url) => {
//   const test = await automate(id, time, url);
//   console.log('test: ' + test);
// };

// // letsAutomate('blabla', null, 'https://sadada.da');
// automate('5efde39cf8df3091e62ab180', null, 'https://alinrauta.com');

app.get('/', (req, res) =>
  res.send('api running and just been modified to be automatically')
);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`server started on port ${PORT}`));
