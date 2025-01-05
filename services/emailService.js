const dotenv = require('dotenv');
dotenv.config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env["EMAIL-SERVICE-SMTP-HOST"],
  port: 2525, 
  //secure: false, 
  auth: {
      user: process.env["EMAIL-SERVICE-USERNAME"], 
      pass: process.env["EMAIL-SERVICE-PASSWORD"],  
  },
});

const subjects = {
  resetPassword: 'Reset your password',
};

const bodies = { 
  resetPassword: (resetLink) => `
      <p>Click the link below to reset your password:</p>
      <a href="${resetLink}">Reset password</a>
  `,
}


async function sendResetPasswordEmail(to, userId) {
  try {
      const token = generateToken(userId);
      const link = generateResetLink(userId, token);

      const mailOptions = {
          from: `'${process.env["EMAIL-SERVICE-APP-NAME"]}' ${process.env["EMAIL-SERVICE-ADDRESS"]}`,
          to: to,
          subject: subjects.resetPassword, 
          html: bodies.resetPassword(link), 
      }; 

      await transporter.sendMail(mailOptions)
        .then(info => {
          console.log(`[EMAIL SERVICE] Email sent: ${info.response}`);
          return token;
        })
        .catch(err => {
          console.error(`[EMAIL SERVICE] Error sending email: ${err.message}`);
          return null;
        })
      console.log(`[EMAIL SERVICE] Email sent to ${to}`);
      return token;
  } catch (error) {
      console.error(`[EMAIL SERVICE] Failed to send email: ${error.message}`);
      throw error;
  }
}

function generateResetLink(userId, token) {
    return `http://localhost:3000/reset-password?userId=${userId}&token=${token}`;
}

function generateToken(userId) {
  const crypto = require('crypto');
  const secret = process.env.RESET_TOKEN_SECRET || 'default_secret'; 
  const token = crypto
    .createHmac('sha256', secret)
    .update(userId + Date.now().toString()) 
    .digest('hex');
  return token;
}

module.exports = {
  sendResetPasswordEmail,
};