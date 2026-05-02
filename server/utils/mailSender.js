const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: 465,
  secure: true,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

const mailSender = async (mail, title, body) => {
  try {
    await transporter.verify();
    console.log("✅ SMTP Ready");

    const info = await transporter.sendMail({
      from: `"Vidyawati" <${process.env.MAIL_USER}>`,
      to: mail,
      subject: title,
      html: body,
    });

    console.log("📧 Email sent:", info.messageId);
    return info;

  } catch (error) {
    console.error("❌ Mail error:", error);
    throw error; 
  }
};

module.exports = mailSender;