const nodemailer = require('nodemailer');
require("dotenv").config()
// Nodemailer configuration
const mailer = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});



module.exports= { mailer };
