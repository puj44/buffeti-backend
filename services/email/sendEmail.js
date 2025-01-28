const nodemailer = require("nodemailer");

async function sendEmail(
  to,
  subject,
  body,
  from = process.env.AUTH_EMAIL_NOREPLY
) {
  try {
    // Create a transporter object
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT ?? 587,
      secure: process.env.SMTP_SECURE === "TRUE" ? true : false,
      auth: {
        user: process.env.AUTH_EMAIL_NOREPLY,
        pass: process.env.AUTH_PASSWORD_NOREPLY,
      },
    });
    // Configure the mailoptions object
    const mailOptions = {
      from: from,
      to: to,
      subject: subject,
      text: body,
    };
    // Send the email
    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log("Send Email Error:", error);
        return false;
      } else {
        return true;
      }
    });
    return true;
  } catch (err) {
    console.log("SEND EMAIL ERROR: ", err);
    return false;
  }
}

module.exports = sendEmail;
