const transporter = require("../utils/nodemailer");

const sendMail = async ( to, subject, body) => {
  try {
    if (!transporter) {
      throw new Error('Nodemailer transporter is not initialized.');
    }

    const response = await transporter.sendMail({
      from: `"Kamakhya Helpdesk" <${process.env.EMAIL_USER_NAME}>`,
      to,
      subject: 'OTP FOR LOGIN',    
      html: body
    });
    console.log(response)
    if(!response) throw new Error("Error sending email:")
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Error sending email:")
  }
};

const generateOTP = () => {
    const otp = Math.floor(100000 + Math.random() * 900000);
    return otp.toString(); 
};

module.exports = {sendMail,generateOTP};
