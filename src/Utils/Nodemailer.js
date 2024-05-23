import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.ethereal.email",
  port: 587,
  auth: {
    user: "maryse.rosenbaum66@ethereal.email",
    pass: "6eDQc7MpCq9tP2UBYm",
  },
});

// async..await is not allowed in global scope, must use a wrapper
async function main() {
  // send mail with defined transport object
  try {
   
  } catch (error) {
    return 
  }

  console.log("Message sent: %s", info.messageId);
  console.log(info);
  // Message sent: <d786aa62-4e0a-070a-47ed-0b0666549519@ethereal.email>
}

export { transporter };
